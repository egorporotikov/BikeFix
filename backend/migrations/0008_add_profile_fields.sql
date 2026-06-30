-- Migration: Add missing profile fields for user editing
-- Adds `name`, `city`, `bio`, and `profile_image_url` to the profiles table safely.

DO $$
BEGIN
    -- Add name column if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'name'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN name text;
    END IF;

    -- Add city column if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'city'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN city text;
    END IF;

    -- Add bio column if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'bio'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN bio text;
    END IF;

    -- Add profile_image_url column if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN profile_image_url text;
    END IF;
END$$;
