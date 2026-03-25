ALTER TABLE public.financial_notifications
  ADD COLUMN IF NOT EXISTS dedupe_key text;

CREATE UNIQUE INDEX IF NOT EXISTS financial_notifications_org_dedupe_key_unique
  ON public.financial_notifications (org_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;
