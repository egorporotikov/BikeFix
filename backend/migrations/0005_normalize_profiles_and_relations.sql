-- 0005_normalize_profiles_and_relations.sql
-- Converts legacy public.users/public.mechanics-based schema into a normalized
-- profiles-centered schema suitable for Supabase Auth (auth.users) integration.
-- IMPORTANT: Review, back up your DB, and run in a maintenance window.
-- This migration attempts to be idempotent and safe: it creates new columns,
-- populates them from existing data, adds FKs, and only drops legacy columns/tables
-- after populating new columns.

BEGIN;

-- 1) Create `profiles` (if not exists) linked to `auth.users(id)` where possible
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE,
  username text,
  email text,
  role text NOT NULL DEFAULT 'user' CHECK (role = ANY (ARRAY['user','mechanic'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Link `auth_id` to Supabase Auth table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    BEGIN
      ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users (id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      -- constraint already exists; ignore
      NULL;
    END;
  END IF;
END$$;

-- 2) Create a normalized `mechanics` table that references `profiles(id)`
CREATE TABLE IF NOT EXISTS public.mechanics_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE NOT NULL,
  name text,
  city text,
  bio text,
  profile_image_url text,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT mechanics_new_profile_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- 3) Add new profile FK columns to existing domain tables (if they are missing)
ALTER TABLE public.repair_requests
  ADD COLUMN IF NOT EXISTS requester_profile_id uuid,
  ADD COLUMN IF NOT EXISTS mechanic_profile_id uuid;

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS mechanic_profile_id uuid;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_profile_id uuid;

ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS requester_profile_id uuid,
  ADD COLUMN IF NOT EXISTS mechanic_profile_id uuid;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS mechanic_profile_id uuid;

-- 4) Populate `profiles` from legacy `public.users` by matching emails to `auth.users` when possible.
-- If auth.users exists, preference is to set auth_id to that id. Otherwise create a profile with NULL auth_id.
INSERT INTO public.profiles (auth_id, username, email, role, created_at, updated_at)
SELECT
  au.id as auth_id,
  u.username,
  u.email,
  COALESCE(u.role, 'user')::text,
  u.created_at,
  u.updated_at
FROM public.users u
LEFT JOIN auth.users au ON lower(au.email) = lower(u.email)
ON CONFLICT (email) DO NOTHING;

-- For any remaining users whose email was NULL or didn't match auth.users, insert without auth_id
INSERT INTO public.profiles (username, email, role, created_at, updated_at)
SELECT u.username, u.email, COALESCE(u.role, 'user'), u.created_at, u.updated_at
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE (p.email IS NOT DISTINCT FROM u.email AND p.username = u.username)
);

-- 5) Create mechanics entries from legacy mechanics linking through public.users -> profiles
INSERT INTO public.mechanics_new (profile_id, name, city, bio, profile_image_url, rating, total_reviews, is_verified, created_at, updated_at)
SELECT p.id, m.name, m.city, m.bio, m.profile_image_url, m.rating, m.total_reviews, m.is_verified, m.created_at, m.updated_at
FROM public.mechanics m
LEFT JOIN public.users u ON m.user_id = u.id
LEFT JOIN public.profiles p ON (p.email IS NOT NULL AND lower(p.email) = lower(u.email)) OR (p.username IS NOT NULL AND p.username = u.username)
WHERE p.id IS NOT NULL
ON CONFLICT (profile_id) DO NOTHING;

-- 6) Populate new profile FK columns in existing domain tables by joining on legacy ids
-- repair_requests.requester_profile_id from repair_requests.user_id -> users -> profiles
UPDATE public.repair_requests rr
SET requester_profile_id = p.id
FROM public.users u
JOIN public.profiles p ON (p.email IS NOT NULL AND lower(p.email) = lower(u.email)) OR (p.username IS NOT NULL AND p.username = u.username)
WHERE rr.user_id = u.id AND rr.requester_profile_id IS NULL;

-- repair_requests.mechanic_profile_id from repair_requests.mechanic_id -> mechanics -> users -> profiles
UPDATE public.repair_requests rr
SET mechanic_profile_id = p.id
FROM public.mechanics m
LEFT JOIN public.users u ON m.user_id = u.id
LEFT JOIN public.profiles p ON (p.email IS NOT NULL AND lower(p.email) = lower(u.email)) OR (p.username IS NOT NULL AND p.username = u.username)
WHERE rr.mechanic_id = m.id AND rr.mechanic_profile_id IS NULL AND p.id IS NOT NULL;

-- offers.mechanic_profile_id from offers.mechanic_id -> mechanics -> users -> profiles
UPDATE public.offers o
SET mechanic_profile_id = p.id
FROM public.mechanics m
LEFT JOIN public.users u ON m.user_id = u.id
LEFT JOIN public.profiles p ON (p.email IS NOT NULL AND lower(p.email) = lower(u.email)) OR (p.username IS NOT NULL AND p.username = u.username)
WHERE o.mechanic_id = m.id AND o.mechanic_profile_id IS NULL AND p.id IS NOT NULL;

-- messages.sender_profile_id from messages.sender_id -> users -> profiles
UPDATE public.messages msg
SET sender_profile_id = p.id
FROM public.users u
JOIN public.profiles p ON (p.email IS NOT NULL AND lower(p.email) = lower(u.email)) OR (p.username IS NOT NULL AND p.username = u.username)
WHERE msg.sender_id = u.id AND msg.sender_profile_id IS NULL;

-- chats requester_profile_id and mechanic_profile_id
UPDATE public.chats c
SET requester_profile_id = p.id
FROM public.users u
JOIN public.profiles p ON (p.email IS NOT NULL AND lower(p.email) = lower(u.email)) OR (p.username IS NOT NULL AND p.username = u.username)
WHERE c.user_id = u.id AND c.requester_profile_id IS NULL;

UPDATE public.chats c
SET mechanic_profile_id = p.id
FROM public.mechanics m
LEFT JOIN public.users u ON m.user_id = u.id
LEFT JOIN public.profiles p ON (p.email IS NOT NULL AND lower(p.email) = lower(u.email)) OR (p.username IS NOT NULL AND p.username = u.username)
WHERE c.mechanic_id = m.id AND c.mechanic_profile_id IS NULL AND p.id IS NOT NULL;

-- subscriptions
UPDATE public.subscriptions s
SET mechanic_profile_id = p.id
FROM public.mechanics m
LEFT JOIN public.users u ON m.user_id = u.id
LEFT JOIN public.profiles p ON (p.email IS NOT NULL AND lower(p.email) = lower(u.email)) OR (p.username IS NOT NULL AND p.username = u.username)
WHERE s.mechanic_id = m.id AND s.mechanic_profile_id IS NULL AND p.id IS NOT NULL;

-- 7) Add foreign key constraints to the new profile columns
ALTER TABLE public.repair_requests
  ADD CONSTRAINT repair_requests_requester_profile_fkey FOREIGN KEY (requester_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL;
ALTER TABLE public.repair_requests
  ADD CONSTRAINT repair_requests_mechanic_profile_fkey FOREIGN KEY (mechanic_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.offers
  ADD CONSTRAINT offers_mechanic_profile_fkey FOREIGN KEY (mechanic_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_profile_fkey FOREIGN KEY (sender_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.chats
  ADD CONSTRAINT chats_requester_profile_fkey FOREIGN KEY (requester_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL;
ALTER TABLE public.chats
  ADD CONSTRAINT chats_mechanic_profile_fkey FOREIGN KEY (mechanic_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_mechanic_profile_fkey FOREIGN KEY (mechanic_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL;

-- 8) Optional: copy or denormalize small bits (e.g., keep sender_role on messages)
-- If you want sender_role to be kept for historical accuracy, populate it from profiles
UPDATE public.messages msg
SET sender_role = p.role
FROM public.profiles p
WHERE msg.sender_profile_id = p.id AND (msg.sender_role IS NULL OR msg.sender_role = '');

-- 9) After verifying data is correct, the following cleanup steps remove legacy columns and tables.
-- These are intentionally left commented out. Run them only after manual verification and backups.

-- DROP FOREIGN KEYS referencing legacy tables (if they exist)
-- ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_mechanic_id_fkey;
-- ALTER TABLE public.offers DROP COLUMN IF EXISTS mechanic_id;
-- ALTER TABLE public.repair_requests DROP CONSTRAINT IF EXISTS repair_requests_mechanic_id_fkey;
-- ALTER TABLE public.repair_requests DROP CONSTRAINT IF EXISTS repair_requests_user_id_fkey;
-- ALTER TABLE public.repair_requests DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE public.repair_requests DROP COLUMN IF EXISTS mechanic_id;
-- ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;
-- ALTER TABLE public.messages DROP COLUMN IF EXISTS sender_id;
-- ALTER TABLE public.chats DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE public.chats DROP COLUMN IF EXISTS mechanic_id;
-- DROP TABLE IF EXISTS public.users;
-- DROP TABLE IF EXISTS public.mechanics;

-- 10) Rename mechanics_new to mechanics (when ready)
-- ALTER TABLE public.mechanics_new RENAME TO mechanics;

COMMIT;

-- NOTES:
-- - Review and run locally on a copy of your database first.
-- - If you have large amounts of data, consider batching updates and adding indexes before heavy joins.
-- - Some mappings rely on matching `email` or `username` between legacy tables and `auth.users`.
--   If that's not reliable for your dataset, you should provide a mapping table or script to resolve ambiguous rows.
-- - After this migration is applied and verified, update backend code to stop using legacy `user_id`/`mechanic_id`
--   and instead use `profiles.id` or `profiles.auth_id` when interacting with Supabase Auth.
