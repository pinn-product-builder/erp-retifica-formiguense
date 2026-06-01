-- =====================================================================
-- SPRINT 0 — Bundle de migrations Financeiro/M05
--
-- Aplica em ordem as 5 migrations do Sprint 0 + sincroniza o histórico
-- em supabase_migrations.schema_migrations. Tudo em UMA transação:
-- se qualquer comando falhar, ROLLBACK automático — nada fica meio aplicado.
--
-- Como usar:
--   1) Abra o Supabase Studio (prod Favarini, projeto citibygettyzjgaewfca)
--   2) SQL Editor → "New query"
--   3) Cole TODO o conteúdo deste arquivo
--   4) Run
--   5) Se sucesso: o output mostra "Bundle aplicado: 5 migrations". Pronto.
--   6) Se erro: tudo rolled back. Me avisa qual statement falhou.
--
-- Conteúdo (em ordem cronológica):
--   1) 20260521120000 — receipt_history.bank_account_id  (ClickUp 86agymx0v)
--   2) 20260521130000 — ar_collection_rules + steps      (ClickUp 86agymx9y)
--   3) 20260521140000 — cash_flow_projection_config      (ClickUp 86agymy8t)
--   4) 20260521150000 — accounts_receivable.negotiation_*(ClickUp 86agymxde)
--   5) 20260521160000 — accounts_payable.is_forecast + * (ClickUp 86agmy9vd)
--
-- Todas as 5 são idempotentes (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- Reaplicar não causa dano caso o schema já tenha algum desses campos.
-- =====================================================================

BEGIN;

-- =====================================================================
-- [1/5] 20260521120000_receipt_history_bank_account.sql
-- Task ClickUp 86agymx0v — vincular conta bancária/caixa ao receber
-- =====================================================================

ALTER TABLE public.receipt_history
  ADD COLUMN IF NOT EXISTS bank_account_id UUID
    REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_receipt_history_bank_account_id
  ON public.receipt_history(bank_account_id)
  WHERE bank_account_id IS NOT NULL;

COMMENT ON COLUMN public.receipt_history.bank_account_id IS
  'Origem do pagamento (conta bancária ou caixa). Obrigatório no app a partir de mai/2026; nullable para histórico anterior.';


-- =====================================================================
-- [2/5] 20260521130000_ar_collection_rules.sql
-- Task ClickUp 86agymx9y — Régua de cobrança configurável (schema + UI)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.ar_collection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_ar_collection_rules_org_id
  ON public.ar_collection_rules(org_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ar_collection_rules_default_per_org
  ON public.ar_collection_rules(org_id) WHERE is_default = true;

CREATE TABLE IF NOT EXISTS public.ar_collection_rule_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.ar_collection_rules(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  offset_days INTEGER NOT NULL,
  offset_type TEXT NOT NULL DEFAULT 'calendar' CHECK (offset_type IN ('calendar', 'business')),
  step_kind TEXT NOT NULL DEFAULT 'reminder'
    CHECK (step_kind IN ('reminder_pre', 'reminder_due', 'reminder_post', 'warning_protest', 'protest')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rule_id, offset_days)
);

CREATE INDEX IF NOT EXISTS idx_ar_collection_rule_steps_rule_id
  ON public.ar_collection_rule_steps(rule_id);
CREATE INDEX IF NOT EXISTS idx_ar_collection_rule_steps_org_id
  ON public.ar_collection_rule_steps(org_id);

DROP TRIGGER IF EXISTS update_ar_collection_rules_updated_at ON public.ar_collection_rules;
CREATE TRIGGER update_ar_collection_rules_updated_at
BEFORE UPDATE ON public.ar_collection_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ar_collection_rule_steps_updated_at ON public.ar_collection_rule_steps;
CREATE TRIGGER update_ar_collection_rule_steps_updated_at
BEFORE UPDATE ON public.ar_collection_rule_steps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ar_collection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_collection_rule_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ar_collection_rules_org_access" ON public.ar_collection_rules;
CREATE POLICY "ar_collection_rules_org_access"
  ON public.ar_collection_rules FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

DROP POLICY IF EXISTS "ar_collection_rule_steps_org_access" ON public.ar_collection_rule_steps;
CREATE POLICY "ar_collection_rule_steps_org_access"
  ON public.ar_collection_rule_steps FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

REVOKE ALL ON public.ar_collection_rules FROM anon;
REVOKE ALL ON public.ar_collection_rule_steps FROM anon;

COMMENT ON TABLE public.ar_collection_rules IS
  'Régua de cobrança automática (config). Cada org pode ter várias; uma é a padrão.';
COMMENT ON TABLE public.ar_collection_rule_steps IS
  'Passos de uma régua: offset relativo ao vencimento + mensagem. Dispatcher (Fase 2) usa essa config.';


-- =====================================================================
-- [3/5] 20260521140000_cash_flow_projection_config.sql
-- Task ClickUp 86agymy8t — Cenários otimista/pessimista configuráveis
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.cash_flow_projection_config (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  optimistic_income_factor NUMERIC(5, 3) NOT NULL DEFAULT 1.200 CHECK (optimistic_income_factor > 0),
  optimistic_expense_factor NUMERIC(5, 3) NOT NULL DEFAULT 0.980 CHECK (optimistic_expense_factor > 0),
  pessimistic_income_factor NUMERIC(5, 3) NOT NULL DEFAULT 0.800 CHECK (pessimistic_income_factor > 0),
  pessimistic_expense_factor NUMERIC(5, 3) NOT NULL DEFAULT 1.050 CHECK (pessimistic_expense_factor > 0),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_cash_flow_projection_config_updated_at ON public.cash_flow_projection_config;
CREATE TRIGGER update_cash_flow_projection_config_updated_at
BEFORE UPDATE ON public.cash_flow_projection_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cash_flow_projection_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cfpc_org_access" ON public.cash_flow_projection_config;
CREATE POLICY "cfpc_org_access"
  ON public.cash_flow_projection_config FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

REVOKE ALL ON public.cash_flow_projection_config FROM anon;

COMMENT ON TABLE public.cash_flow_projection_config IS
  'Configuração por organização dos fatores dos cenários otimista/pessimista do fluxo projetado (task 86agymy8t).';


-- =====================================================================
-- [4/5] 20260521150000_ar_negotiation_fields.sql
-- Task ClickUp 86agymxde — Negociação individual da duplicata
-- =====================================================================

ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS negotiation_promised_date DATE,
  ADD COLUMN IF NOT EXISTS negotiation_notes TEXT,
  ADD COLUMN IF NOT EXISTS negotiation_paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS negotiation_owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS negotiation_resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ar_negotiation_promised_date
  ON public.accounts_receivable(negotiation_promised_date)
  WHERE negotiation_promised_date IS NOT NULL AND negotiation_resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ar_negotiation_paused
  ON public.accounts_receivable(org_id, negotiation_paused_at)
  WHERE negotiation_paused_at IS NOT NULL AND negotiation_resolved_at IS NULL;

COMMENT ON COLUMN public.accounts_receivable.negotiation_promised_date IS
  'Data prometida pelo cliente em negociação individual. Régua automática suspende disparos até resolução.';
COMMENT ON COLUMN public.accounts_receivable.negotiation_paused_at IS
  'Marca início da negociação (pausa régua). Null quando não há negociação ativa.';
COMMENT ON COLUMN public.accounts_receivable.negotiation_resolved_at IS
  'Marca resolução da negociação (paga, refeita ou cancelada). Quando preenchida, régua volta a operar.';


-- =====================================================================
-- [5/5] 20260521160000_ap_forecast_fields.sql
-- Task ClickUp 86agmy9vd — Previsão recorrente vs realizado
-- =====================================================================

ALTER TABLE public.accounts_payable
  ADD COLUMN IF NOT EXISTS is_forecast BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS forecast_resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS forecast_recurring_schedule_id UUID
    REFERENCES public.ap_recurring_schedules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forecast_original_amount NUMERIC(12, 2);

CREATE INDEX IF NOT EXISTS idx_ap_is_forecast_pending
  ON public.accounts_payable(org_id, is_forecast, forecast_resolved_at)
  WHERE is_forecast = true AND forecast_resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ap_forecast_schedule
  ON public.accounts_payable(forecast_recurring_schedule_id)
  WHERE forecast_recurring_schedule_id IS NOT NULL;

COMMENT ON COLUMN public.accounts_payable.is_forecast IS
  'true quando o AP vem de previsão recorrente e ainda não foi confirmado com NF real.';
COMMENT ON COLUMN public.accounts_payable.forecast_resolved_at IS
  'Quando preenchido, o AP foi confirmado com dados reais da NF — deixa de ser previsão.';
COMMENT ON COLUMN public.accounts_payable.forecast_original_amount IS
  'Valor originalmente previsto (snapshot). Permite calcular variância previsto x realizado.';


-- =====================================================================
-- Marca as 5 migrations como aplicadas no histórico do Supabase CLI
-- (idempotente: ON CONFLICT DO NOTHING)
-- =====================================================================

INSERT INTO supabase_migrations.schema_migrations (version) VALUES
  ('20260521120000'),
  ('20260521130000'),
  ('20260521140000'),
  ('20260521150000'),
  ('20260521160000')
ON CONFLICT (version) DO NOTHING;


-- =====================================================================
-- Sucesso: commit
-- =====================================================================
COMMIT;

-- Output de confirmação
DO $$
BEGIN
  RAISE NOTICE '✅ Bundle Sprint 0 aplicado: 5 migrations + histórico sincronizado.';
END $$;
