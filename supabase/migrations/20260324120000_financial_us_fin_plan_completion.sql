ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_id uuid,
  ADD COLUMN IF NOT EXISTS is_renegotiated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_late_fee_date date;

ALTER TABLE public.accounts_receivable
  DROP CONSTRAINT IF EXISTS accounts_receivable_source_check;

ALTER TABLE public.accounts_receivable
  ADD CONSTRAINT accounts_receivable_source_check
  CHECK (source IS NULL OR source = ANY (ARRAY['budget'::text, 'order'::text, 'manual'::text]));

ALTER TABLE public.accounts_payable
  ADD COLUMN IF NOT EXISTS competence_date date,
  ADD COLUMN IF NOT EXISTS invoice_file_url text;

UPDATE public.accounts_payable
SET competence_date = due_date
WHERE competence_date IS NULL;

ALTER TABLE public.cash_closings
  ADD COLUMN IF NOT EXISTS opening_balance numeric(15,2),
  ADD COLUMN IF NOT EXISTS total_income numeric(15,2),
  ADD COLUMN IF NOT EXISTS total_expenses numeric(15,2),
  ADD COLUMN IF NOT EXISTS system_balance numeric(15,2),
  ADD COLUMN IF NOT EXISTS physical_cash numeric(15,2),
  ADD COLUMN IF NOT EXISTS bank_balance numeric(15,2),
  ADD COLUMN IF NOT EXISTS total_verified numeric(15,2),
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';

UPDATE public.cash_closings
SET
  opening_balance = COALESCE(opening_balance, expected_balance),
  total_income = COALESCE(total_income, 0),
  total_expenses = COALESCE(total_expenses, 0),
  system_balance = COALESCE(system_balance, expected_balance),
  physical_cash = COALESCE(physical_cash, counted_balance),
  bank_balance = COALESCE(bank_balance, 0),
  total_verified = COALESCE(total_verified, counted_balance),
  status = COALESCE(status, CASE WHEN difference_amount = 0 THEN 'closed' ELSE 'divergent' END)
WHERE opening_balance IS NULL OR status IS NULL;

ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS applies_to text[] NOT NULL DEFAULT ARRAY['both']::text[];

ALTER TABLE public.cost_centers
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.cost_centers(id) ON DELETE SET NULL;

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS default_expense_category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_cost_center_id uuid REFERENCES public.cost_centers(id) ON DELETE SET NULL;

ALTER TABLE public.monthly_dre
  ADD COLUMN IF NOT EXISTS deductions numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_revenue numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_expenses numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commercial_expenses numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS financial_expenses numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxes numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partners_withdrawals numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS operational_result numeric(15,2) DEFAULT 0;

ALTER TABLE public.ap_recurring_schedules
  ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'supplier',
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS last_generated_cycle_key text;

UPDATE public.ap_recurring_schedules
SET start_date = COALESCE(start_date, next_run_date)
WHERE start_date IS NULL;

ALTER TABLE public.bank_statement_imports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS summary jsonb;

ALTER TABLE public.bank_statement_lines
  ADD COLUMN IF NOT EXISTS bank_transaction_id text,
  ADD COLUMN IF NOT EXISTS import_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.bank_reconciliation_items
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS adjustment_reason text,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

DROP INDEX IF EXISTS public.idx_ar_source_installment_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ar_source_installment_unique
  ON public.accounts_receivable (org_id, source, source_id, installment_number)
  WHERE source IS NOT NULL AND source_id IS NOT NULL AND installment_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.ar_due_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  receivable_account_id uuid NOT NULL REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  reference_date date NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ar_due_alerts_type_check CHECK (alert_type = ANY (ARRAY['due_in_7_days'::text, 'due_in_3_days'::text, 'due_today'::text]))
);

CREATE UNIQUE INDEX IF NOT EXISTS ar_due_alerts_unique
  ON public.ar_due_alerts (org_id, receivable_account_id, alert_type, reference_date);

CREATE INDEX IF NOT EXISTS ar_due_alerts_org_idx ON public.ar_due_alerts (org_id);

CREATE TABLE IF NOT EXISTS public.ar_late_fee_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  penalty_percent numeric(8,4) NOT NULL DEFAULT 0,
  daily_interest_percent numeric(8,4) NOT NULL DEFAULT 0,
  grace_days int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ar_late_fee_rules_org_one_active
  ON public.ar_late_fee_rules (org_id)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.ar_late_fee_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  receivable_account_id uuid NOT NULL REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
  calculated_date date NOT NULL,
  penalty_amount numeric(15,2) NOT NULL DEFAULT 0,
  interest_amount numeric(15,2) NOT NULL DEFAULT 0,
  total_fee numeric(15,2) NOT NULL DEFAULT 0,
  days_overdue int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ar_late_fee_history_ar_idx ON public.ar_late_fee_history (receivable_account_id);

CREATE TABLE IF NOT EXISTS public.financial_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  reference_id uuid,
  reference_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financial_notifications_org_idx ON public.financial_notifications (org_id);

CREATE TABLE IF NOT EXISTS public.ap_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payable_id uuid NOT NULL REFERENCES public.accounts_payable(id) ON DELETE CASCADE,
  amount_paid numeric(15,2) NOT NULL,
  paid_at date NOT NULL,
  payment_method public.payment_method,
  notes text,
  registered_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ap_payment_history_payable_idx ON public.ap_payment_history (payable_id);

CREATE TABLE IF NOT EXISTS public.monthly_financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  year int NOT NULL,
  pdf_url text,
  excel_url text,
  generated_by uuid REFERENCES auth.users(id),
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, month, year)
);

CREATE TABLE IF NOT EXISTS public.fin_accounting_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  event_type text NOT NULL,
  idempotency_key text NOT NULL,
  account_code text,
  debit numeric(15,2) NOT NULL DEFAULT 0,
  credit numeric(15,2) NOT NULL DEFAULT 0,
  competence_date date,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS fin_accounting_entries_org_idx ON public.fin_accounting_entries (org_id);

CREATE TABLE IF NOT EXISTS public.bank_transmission_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction = ANY (ARRAY['outbound'::text, 'inbound'::text])),
  file_hash text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  total_items int NOT NULL DEFAULT 0,
  processed_items int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bank_transmission_batches_org_idx ON public.bank_transmission_batches (org_id);

CREATE TABLE IF NOT EXISTS public.bank_reconciliation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reconciliation_id uuid NOT NULL REFERENCES public.bank_reconciliations(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  pdf_url text,
  generated_by uuid REFERENCES auth.users(id),
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ar_due_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_late_fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_late_fee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transmission_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ar_due_alerts_authenticated" ON public.ar_due_alerts;
CREATE POLICY "ar_due_alerts_authenticated" ON public.ar_due_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ar_late_fee_rules_authenticated" ON public.ar_late_fee_rules;
CREATE POLICY "ar_late_fee_rules_authenticated" ON public.ar_late_fee_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ar_late_fee_history_authenticated" ON public.ar_late_fee_history;
CREATE POLICY "ar_late_fee_history_authenticated" ON public.ar_late_fee_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "financial_notifications_authenticated" ON public.financial_notifications;
CREATE POLICY "financial_notifications_authenticated" ON public.financial_notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ap_payment_history_authenticated" ON public.ap_payment_history;
CREATE POLICY "ap_payment_history_authenticated" ON public.ap_payment_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "monthly_financial_reports_authenticated" ON public.monthly_financial_reports;
CREATE POLICY "monthly_financial_reports_authenticated" ON public.monthly_financial_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "fin_accounting_entries_authenticated" ON public.fin_accounting_entries;
CREATE POLICY "fin_accounting_entries_authenticated" ON public.fin_accounting_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bank_transmission_batches_authenticated" ON public.bank_transmission_batches;
CREATE POLICY "bank_transmission_batches_authenticated" ON public.bank_transmission_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bank_reconciliation_reports_authenticated" ON public.bank_reconciliation_reports;
CREATE POLICY "bank_reconciliation_reports_authenticated" ON public.bank_reconciliation_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_ar_late_fee_rules_updated_at ON public.ar_late_fee_rules;
CREATE TRIGGER update_ar_late_fee_rules_updated_at BEFORE UPDATE ON public.ar_late_fee_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_transmission_batches_updated_at ON public.bank_transmission_batches;
CREATE TRIGGER update_bank_transmission_batches_updated_at BEFORE UPDATE ON public.bank_transmission_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
