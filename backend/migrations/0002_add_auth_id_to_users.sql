-- Migration: Add auth_id column to public.users table
-- Purpose: Link user profiles with Supabase Auth users

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- Optional: Remove hashed_password if using Supabase Auth exclusively
-- ALTER TABLE public.users DROP COLUMN IF EXISTS hashed_password;
