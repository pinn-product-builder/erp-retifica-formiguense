-- Caixa por usuário: conta dedicada, sessões de abertura, fechamento por conta bancária (caixa físico)
--
-- 0. Pré-requisito: colunas kind / name em bank_accounts (idempotente).
--    Igual a 20260207121000_bank_accounts_kind_name.sql — necessário se essa migration
--    ainda não foi aplicada no banco (evita ERROR: column "kind" does not exist).

ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS name text;

UPDATE public.bank_accounts
SET kind = COALESCE(NULLIF(trim(kind), ''), 'bank')
WHERE kind IS NULL;

UPDATE public.bank_accounts
SET name = COALESCE(NULLIF(trim(name), ''), NULLIF(trim(bank_name), ''), 'Conta')
WHERE name IS NULL;

ALTER TABLE public.bank_accounts
  ALTER COLUMN kind SET DEFAULT 'bank';

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

-- 1. Dono da conta caixa (operador)
ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.bank_accounts.owner_user_id IS 'Para kind=cash: operador dono do caixa físico; NULL = caixa compartilhado/legado';

CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_accounts_org_owner_cash_unique
  ON public.bank_accounts (org_id, owner_user_id)
  WHERE owner_user_id IS NOT NULL AND kind = 'cash';

-- 2. Conta "Caixa legado" por organização (histórico antes do modelo por operador)
INSERT INTO public.bank_accounts (org_id, bank_name, account_number, kind, name, is_active)
SELECT o.id, '', 'LEGADO', 'cash', 'Caixa legado', true
FROM public.organizations o
WHERE NOT EXISTS (
    SELECT 1
    FROM public.bank_accounts ba
    WHERE ba.org_id = o.id
      AND ba.account_number = 'LEGADO'
      AND ba.kind = 'cash'
  );

-- 2b. Tabela cash_closings (pré-requisito se 20260205140000 / 20260324120000 não foram aplicadas)
CREATE TABLE IF NOT EXISTS public.cash_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  closing_date date NOT NULL,
  expected_balance numeric(15,2) NOT NULL DEFAULT 0,
  counted_balance numeric(15,2) NOT NULL DEFAULT 0,
  difference_amount numeric(15,2) NOT NULL DEFAULT 0,
  notes text,
  closed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT cash_closings_org_id_closing_date_key UNIQUE (org_id, closing_date)
);

ALTER TABLE public.cash_closings
  ADD COLUMN IF NOT EXISTS opening_balance numeric(15,2),
  ADD COLUMN IF NOT EXISTS total_income numeric(15,2),
  ADD COLUMN IF NOT EXISTS total_expenses numeric(15,2),
  ADD COLUMN IF NOT EXISTS system_balance numeric(15,2),
  ADD COLUMN IF NOT EXISTS physical_cash numeric(15,2),
  ADD COLUMN IF NOT EXISTS bank_balance numeric(15,2),
  ADD COLUMN IF NOT EXISTS total_verified numeric(15,2),
  ADD COLUMN IF NOT EXISTS status text;

UPDATE public.cash_closings
SET
  opening_balance = COALESCE(opening_balance, expected_balance),
  total_income = COALESCE(total_income, 0),
  total_expenses = COALESCE(total_expenses, 0),
  system_balance = COALESCE(system_balance, expected_balance),
  physical_cash = COALESCE(physical_cash, counted_balance),
  bank_balance = COALESCE(bank_balance, 0),
  total_verified = COALESCE(total_verified, counted_balance),
  status = COALESCE(status, CASE WHEN COALESCE(difference_amount, 0) = 0 THEN 'closed' ELSE 'divergent' END)
WHERE opening_balance IS NULL OR status IS NULL;

ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cash_closings_authenticated" ON public.cash_closings;
CREATE POLICY "cash_closings_authenticated"
  ON public.cash_closings FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Fechamento vinculado à conta de caixa
ALTER TABLE public.cash_closings
  ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE RESTRICT;

UPDATE public.cash_closings c
SET bank_account_id = (
  SELECT ba.id
  FROM public.bank_accounts ba
  WHERE ba.org_id = c.org_id
    AND ba.account_number = 'LEGADO'
    AND ba.kind = 'cash'
  LIMIT 1
)
WHERE c.bank_account_id IS NULL;

ALTER TABLE public.cash_closings
  ALTER COLUMN bank_account_id SET NOT NULL;

ALTER TABLE public.cash_closings
  DROP CONSTRAINT IF EXISTS cash_closings_org_id_closing_date_key;

ALTER TABLE public.cash_closings
  ADD CONSTRAINT cash_closings_org_date_bank_account_key UNIQUE (org_id, closing_date, bank_account_id);

CREATE INDEX IF NOT EXISTS idx_cash_closings_org_date ON public.cash_closings (org_id, closing_date);
CREATE INDEX IF NOT EXISTS idx_cash_closings_bank_account ON public.cash_closings (bank_account_id);

-- 4. Sessão de caixa (abertura com saldo inicial; um open por usuário/org)
CREATE TABLE IF NOT EXISTS public.cash_register_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  business_date date NOT NULL,
  status text NOT NULL DEFAULT 'open',
  opening_balance numeric(15,2) NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT cash_register_sessions_status_check CHECK (status = ANY (ARRAY['open'::text, 'closed'::text]))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_register_sessions_one_open_per_user
  ON public.cash_register_sessions (org_id, user_id)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_cash_register_sessions_org_date ON public.cash_register_sessions (org_id, business_date);
CREATE INDEX IF NOT EXISTS idx_cash_register_sessions_account ON public.cash_register_sessions (bank_account_id);

CREATE TRIGGER update_cash_register_sessions_updated_at
  BEFORE UPDATE ON public.cash_register_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cash_register_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_member_all_cash_register_sessions" ON public.cash_register_sessions;
CREATE POLICY "org_member_all_cash_register_sessions"
  ON public.cash_register_sessions FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));
