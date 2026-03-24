ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_id uuid;

ALTER TABLE public.accounts_receivable
  DROP CONSTRAINT IF EXISTS accounts_receivable_source_check;

ALTER TABLE public.accounts_receivable
  ADD CONSTRAINT accounts_receivable_source_check
  CHECK (source IS NULL OR source = ANY (ARRAY['budget'::text, 'order'::text, 'manual'::text]));
