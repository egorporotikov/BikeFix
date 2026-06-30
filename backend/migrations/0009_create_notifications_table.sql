-- Migration: Create notifications table
-- Adds user-facing notifications with recipient-based row-level security.

BEGIN;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id uuid NOT NULL,
  sender_profile_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_recipient_profile_fkey FOREIGN KEY (recipient_profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT notifications_sender_profile_fkey FOREIGN KEY (sender_profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_profile_id ON public.notifications (recipient_profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_recipient
  ON public.notifications
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND auth.uid() = (
      SELECT auth_id
      FROM public.profiles
      WHERE public.profiles.id = notifications.recipient_profile_id
    )
  );

CREATE POLICY notifications_insert_service_role
  ON public.notifications
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
  );

CREATE POLICY notifications_update_recipient
  ON public.notifications
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND auth.uid() = (
      SELECT auth_id
      FROM public.profiles
      WHERE public.profiles.id = notifications.recipient_profile_id
    )
  ) WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = (
      SELECT auth_id
      FROM public.profiles
      WHERE public.profiles.id = notifications.recipient_profile_id
    )
  );

COMMIT;
