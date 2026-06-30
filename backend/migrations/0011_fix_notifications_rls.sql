BEGIN;

DROP POLICY IF EXISTS notifications_select_recipient ON public.notifications;
DROP POLICY IF EXISTS notifications_update_recipient ON public.notifications;

CREATE POLICY notifications_select_recipient
  ON public.notifications
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND auth.uid() = (
      SELECT auth_id
      FROM public.profiles
      WHERE public.profiles.id = notifications.recipient_profile_id
    )
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
