-- 0006_profiles_first_clean_schema.sql
-- Clean, minimal, normalized schema for a fresh Supabase project.
-- This migration assumes a fresh database (no legacy public.users or public.mechanics tables).
-- It creates tables designed to work with Supabase Auth (auth.users) and a local `profiles` table.
-- Run this on a new DB or a DB where legacy tables have already been migrated/removed.

BEGIN;

-- Ensure the pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Profiles: single source of truth for user metadata linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE,
  username text,
  email text,
  role text NOT NULL DEFAULT 'user' CHECK (role = ANY (ARRAY['user','mechanic'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- If Supabase auth schema exists, add FK to auth.users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    BEGIN
      ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users (id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- already exists
    END;
  END IF;
END$$;

-- 2) Mechanics: mechanic-specific profile data, one-to-one with profiles
CREATE TABLE IF NOT EXISTS public.mechanics (
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
  CONSTRAINT mechanics_profile_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- 3) Repair requests: created by requester profile, optionally assigned to mechanic profile
CREATE TABLE IF NOT EXISTS public.repair_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_profile_id uuid NOT NULL,
  mechanic_profile_id uuid,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','accepted','completed','cancelled'])),
  address text,
  category text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT repair_requests_requester_profile_fkey FOREIGN KEY (requester_profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT repair_requests_mechanic_profile_fkey FOREIGN KEY (mechanic_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL
);

-- 4) Offers: mechanic offers for a repair request
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_request_id uuid NOT NULL,
  mechanic_profile_id uuid NOT NULL,
  price numeric NOT NULL,
  eta_hours integer,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','accepted','rejected','completed'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT offers_repair_request_fkey FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests (id) ON DELETE CASCADE,
  CONSTRAINT offers_mechanic_profile_fkey FOREIGN KEY (mechanic_profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- 5) Chats: one chat per repair request (optional). Keep participants for quick checks.
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_request_id uuid UNIQUE,
  requester_profile_id uuid,
  mechanic_profile_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chats_repair_request_fkey FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests (id) ON DELETE CASCADE,
  CONSTRAINT chats_requester_profile_fkey FOREIGN KEY (requester_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL,
  CONSTRAINT chats_mechanic_profile_fkey FOREIGN KEY (mechanic_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL
);

-- 6) Messages: belong to chats; sender is a profile
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  sender_profile_id uuid NOT NULL,
  content text NOT NULL,
  sender_role text NOT NULL CHECK (sender_role = ANY (ARRAY['user','mechanic'])),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT messages_chat_fkey FOREIGN KEY (chat_id) REFERENCES public.chats (id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_profile_fkey FOREIGN KEY (sender_profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- 7) Subscriptions (mechanic plans)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_profile_id uuid UNIQUE NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK (plan = ANY (ARRAY['free','basic','pro','premium'])),
  is_active boolean NOT NULL DEFAULT true,
  active_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT subscriptions_mechanic_profile_fkey FOREIGN KEY (mechanic_profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON public.profiles (auth_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_repair_requests_requester_profile_id ON public.repair_requests (requester_profile_id);
CREATE INDEX IF NOT EXISTS idx_offers_repair_request_id ON public.offers (repair_request_id);
CREATE INDEX IF NOT EXISTS idx_chats_repair_request_id ON public.chats (repair_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages (chat_id);

-- Row level security policies for frontend-authenticated access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own_profile ON public.profiles
  FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY profiles_update_own_profile ON public.profiles
  FOR UPDATE USING (auth.uid() = auth_id);

ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY repair_requests_select_own ON public.repair_requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = repair_requests.requester_profile_id) OR
      auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = repair_requests.mechanic_profile_id)
    )
  );
CREATE POLICY repair_requests_insert_own ON public.repair_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = requester_profile_id)
  );
CREATE POLICY repair_requests_update_own ON public.repair_requests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = requester_profile_id)
  );

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY offers_select_own ON public.offers
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = offers.mechanic_profile_id) OR
      auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = (SELECT requester_profile_id FROM public.repair_requests WHERE public.repair_requests.id = offers.repair_request_id))
    )
  );
CREATE POLICY offers_insert_by_mechanic ON public.offers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = mechanic_profile_id)
  );

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY chats_select_own ON public.chats
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = chats.requester_profile_id) OR
      auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = chats.mechanic_profile_id)
    )
  );
CREATE POLICY chats_insert_own ON public.chats
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = requester_profile_id)
  );

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_select_own ON public.messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = messages.sender_profile_id) OR
      auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = (SELECT requester_profile_id FROM public.chats WHERE public.chats.id = messages.chat_id)) OR
      auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = (SELECT mechanic_profile_id FROM public.chats WHERE public.chats.id = messages.chat_id))
    )
  );
CREATE POLICY messages_insert_own ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = (SELECT auth_id FROM public.profiles WHERE public.profiles.id = sender_profile_id)
  );

COMMIT;

-- End of migration
