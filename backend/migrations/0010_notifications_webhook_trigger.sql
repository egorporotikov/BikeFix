-- Migration: Create webhook trigger for notifications
-- Replaces any old notification webhook trigger/function with the correct Supabase HTTP extension.

BEGIN;

DROP TRIGGER IF EXISTS on_new_notification ON public.notifications;
DROP FUNCTION IF EXISTS public.notify_new_notification();

CREATE FUNCTION public.notify_new_notification()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM extensions.http(
    (
      'POST',
      'https://maqkkafsjiadduqvtdha.functions.supabase.co/notify',
      '{"Content-Type": "application/json"}',
      row_to_json(NEW)::text
    )::extensions.http_request
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_notification();

COMMIT;
