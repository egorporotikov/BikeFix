-- Migration: Add role column to users
-- Adds a text `role` column with default 'user' and a CHECK constraint restricting values.
-- Safe to run multiple times (checks for existence).

DO $$
BEGIN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name='users' AND column_name='role'
    ) THEN
        ALTER TABLE public.users
        ADD COLUMN role text NOT NULL DEFAULT 'user';
    END IF;

    -- Add check constraint if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname='users_role_check'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_role_check CHECK (role IN ('user','mechanic'));
    END IF;
END$$;
