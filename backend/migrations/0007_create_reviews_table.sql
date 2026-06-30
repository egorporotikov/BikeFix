-- Migration: Create reviews table
-- Adds mechanic reviews left by users after completed requests

BEGIN;

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_profile_id uuid NOT NULL,
  user_profile_id uuid NOT NULL,
  repair_request_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT reviews_mechanic_profile_fkey FOREIGN KEY (mechanic_profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT reviews_user_profile_fkey FOREIGN KEY (user_profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT reviews_request_fkey FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_mechanic_profile_id ON public.reviews (mechanic_profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_profile_id ON public.reviews (user_profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_request_id ON public.reviews (repair_request_id);

COMMIT;
