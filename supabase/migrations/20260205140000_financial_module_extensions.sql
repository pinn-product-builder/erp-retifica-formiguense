DO $enum$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'payment_status' AND e.enumlabel = 'renegotiated'
  ) THEN
    ALTER TYPE public.payment_status ADD VALUE 'renegotiated';
  END IF;
END
$enum$;

DO $enum2$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'payment_method' AND e.enumlabel = 'boleto'
  ) THEN
    ALTER TYPE public.payment_method ADD VALUE 'boleto';
  END IF;
END
$enum2$;

CREATE TABLE IF NOT EXISTS public.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_cost_centers_org_id ON public.cost_centers(org_id);

ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS competence_date date,
  ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

UPDATE public.accounts_receivable
SET competence_date = due_date
WHERE competence_date IS NULL;

ALTER TABLE public.accounts_payable
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id),
  ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id),
  ADD COLUMN IF NOT EXISTS purchase_order_id uuid REFERENCES public.purchase_orders(id),
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';

ALTER TABLE public.cash_flow
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id);

UPDATE public.cash_flow cf
SET org_id = ar.org_id
FROM public.accounts_receivable ar
WHERE cf.accounts_receivable_id = ar.id AND cf.org_id IS NULL AND ar.org_id IS NOT NULL;

UPDATE public.cash_flow cf
SET org_id = ap.org_id
FROM public.accounts_payable ap
WHERE cf.accounts_payable_id = ap.id AND cf.org_id IS NULL AND ap.org_id IS NOT NULL;

UPDATE public.cash_flow cf
SET org_id = o.org_id
FROM public.orders o
WHERE cf.order_id = o.id AND cf.org_id IS NULL AND o.org_id IS NOT NULL;

UPDATE public.cash_flow cf
SET org_id = ba.org_id
FROM public.bank_accounts ba
WHERE cf.bank_account_id = ba.id AND cf.org_id IS NULL AND ba.org_id IS NOT NULL;

ALTER TABLE public.cash_flow_projection
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS chart_account_code text;

CREATE TABLE IF NOT EXISTS public.receipt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  receivable_account_id uuid NOT NULL REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
  amount_received numeric(15,2) NOT NULL,
  received_at date NOT NULL,
  payment_method public.payment_method,
  late_fee_charged numeric(15,2) DEFAULT 0,
  discount_applied numeric(15,2) DEFAULT 0,
  notes text,
  registered_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipt_history_ar ON public.receipt_history(receivable_account_id);
CREATE INDEX IF NOT EXISTS idx_receipt_history_org ON public.receipt_history(org_id);

CREATE TABLE IF NOT EXISTS public.ar_renegotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  original_ar_id uuid NOT NULL REFERENCES public.accounts_receivable(id),
  new_ar_id uuid REFERENCES public.accounts_receivable(id),
  original_amount numeric(15,2) NOT NULL,
  new_amount numeric(15,2) NOT NULL,
  reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ap_recurring_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id),
  expense_category_id uuid REFERENCES public.expense_categories(id),
  description_template text NOT NULL DEFAULT '',
  amount numeric(15,2) NOT NULL,
  payment_method public.payment_method,
  day_of_month int NOT NULL DEFAULT 1 CHECK (day_of_month >= 1 AND day_of_month <= 31),
  next_run_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_tiers_ap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  max_amount numeric(15,2) NOT NULL,
  sequence_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  withdrawal_date date NOT NULL,
  amount numeric(15,2) NOT NULL,
  description text,
  dre_category text NOT NULL DEFAULT 'partner_withdrawal',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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
  UNIQUE (org_id, closing_date)
);

CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id),
  statement_end_date date NOT NULL,
  statement_balance numeric(15,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bank_statement_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id),
  file_name text,
  file_format text NOT NULL DEFAULT 'csv',
  imported_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.bank_statement_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid NOT NULL REFERENCES public.bank_statement_imports(id) ON DELETE CASCADE,
  transaction_date date NOT NULL,
  amount numeric(15,2) NOT NULL,
  description text,
  balance_after numeric(15,2),
  matched_cash_flow_id uuid REFERENCES public.cash_flow(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bank_reconciliation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id uuid NOT NULL REFERENCES public.bank_reconciliations(id) ON DELETE CASCADE,
  cash_flow_id uuid REFERENCES public.cash_flow(id),
  statement_line_id uuid REFERENCES public.bank_statement_lines(id),
  matched_amount numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.card_machine_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  payment_method public.payment_method,
  fee_percentage numeric(8,4) DEFAULT 0,
  fee_fixed numeric(15,2) DEFAULT 0,
  settlement_days int DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.refresh_accounts_receivable_overdue(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.accounts_receivable
  SET status = 'overdue'::payment_status,
      updated_at = now()
  WHERE status = 'pending'::payment_status
    AND due_date < CURRENT_DATE
    AND (p_org_id IS NULL OR org_id = p_org_id);
END;
$$;

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_renegotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_tiers_ap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statement_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_machine_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cost_centers_authenticated" ON public.cost_centers;
CREATE POLICY "cost_centers_authenticated" ON public.cost_centers FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "receipt_history_authenticated" ON public.receipt_history;
CREATE POLICY "receipt_history_authenticated" ON public.receipt_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ar_renegotiations_authenticated" ON public.ar_renegotiations;
CREATE POLICY "ar_renegotiations_authenticated" ON public.ar_renegotiations FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ap_recurring_authenticated" ON public.ap_recurring_schedules;
CREATE POLICY "ap_recurring_authenticated" ON public.ap_recurring_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "approval_tiers_ap_authenticated" ON public.approval_tiers_ap;
CREATE POLICY "approval_tiers_ap_authenticated" ON public.approval_tiers_ap FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "partner_withdrawals_authenticated" ON public.partner_withdrawals;
CREATE POLICY "partner_withdrawals_authenticated" ON public.partner_withdrawals FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "cash_closings_authenticated" ON public.cash_closings;
CREATE POLICY "cash_closings_authenticated" ON public.cash_closings FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "bank_reconciliations_authenticated" ON public.bank_reconciliations;
CREATE POLICY "bank_reconciliations_authenticated" ON public.bank_reconciliations FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "bank_statement_imports_authenticated" ON public.bank_statement_imports;
CREATE POLICY "bank_statement_imports_authenticated" ON public.bank_statement_imports FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "bank_statement_lines_authenticated" ON public.bank_statement_lines;
CREATE POLICY "bank_statement_lines_authenticated" ON public.bank_statement_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "bank_reconciliation_items_authenticated" ON public.bank_reconciliation_items;
CREATE POLICY "bank_reconciliation_items_authenticated" ON public.bank_reconciliation_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "card_machine_configs_authenticated" ON public.card_machine_configs;
CREATE POLICY "card_machine_configs_authenticated" ON public.card_machine_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_cost_centers_updated_at ON public.cost_centers;
CREATE TRIGGER update_cost_centers_updated_at BEFORE UPDATE ON public.cost_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_ap_recurring_updated_at ON public.ap_recurring_schedules;
CREATE TRIGGER update_ap_recurring_updated_at BEFORE UPDATE ON public.ap_recurring_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_approval_tiers_ap_updated_at ON public.approval_tiers_ap;
CREATE TRIGGER update_approval_tiers_ap_updated_at BEFORE UPDATE ON public.approval_tiers_ap FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_partner_withdrawals_updated_at ON public.partner_withdrawals;
CREATE TRIGGER update_partner_withdrawals_updated_at BEFORE UPDATE ON public.partner_withdrawals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_bank_reconciliations_updated_at ON public.bank_reconciliations;
CREATE TRIGGER update_bank_reconciliations_updated_at BEFORE UPDATE ON public.bank_reconciliations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_card_machine_configs_updated_at ON public.card_machine_configs;
CREATE TRIGGER update_card_machine_configs_updated_at BEFORE UPDATE ON public.card_machine_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
