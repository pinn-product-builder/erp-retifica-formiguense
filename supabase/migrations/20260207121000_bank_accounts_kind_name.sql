ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS kind text DEFAULT 'bank',
  ADD COLUMN IF NOT EXISTS name text;

UPDATE public.bank_accounts
SET kind = COALESCE(NULLIF(trim(kind), ''), 'bank')
WHERE kind IS NULL;

UPDATE public.bank_accounts
SET name = COALESCE(NULLIF(trim(name), ''), NULLIF(trim(bank_name), ''), 'Conta')
WHERE name IS NULL;

ALTER TABLE public.bank_accounts
  ALTER COLUMN kind SET NOT NULL;

ALTER TABLE public.bank_accounts
  ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.bank_accounts
  DROP CONSTRAINT IF EXISTS bank_accounts_kind_check;

ALTER TABLE public.bank_accounts
  ADD CONSTRAINT bank_accounts_kind_check
  CHECK (kind = ANY (ARRAY['bank'::text, 'cash'::text]));

ALTER TABLE public.bank_accounts
  ALTER COLUMN bank_name DROP NOT NULL;

UPDATE public.bank_accounts
SET bank_name = COALESCE(bank_name, '')
WHERE kind = 'cash' AND bank_name IS NULL;
