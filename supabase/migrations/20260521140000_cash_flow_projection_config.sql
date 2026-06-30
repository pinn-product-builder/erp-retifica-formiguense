-- =====================================================
-- Fluxo Projetado: percentuais de cenários configuráveis por org.
-- Task ClickUp 86agymy8t.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cash_flow_projection_config (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- Fator multiplicador para o cenário otimista (sobre o realista).
  -- Default 1.20 = +20% nas entradas e -2% nas saídas, conforme padrão Favarini.
  optimistic_income_factor NUMERIC(5, 3) NOT NULL DEFAULT 1.200 CHECK (optimistic_income_factor > 0),
  optimistic_expense_factor NUMERIC(5, 3) NOT NULL DEFAULT 0.980 CHECK (optimistic_expense_factor > 0),
  -- Fator multiplicador para o cenário pessimista.
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
DROP POLICY IF EXISTS "cfpc_org_access" ON public.cash_flow_projection_config;
CREATE POLICY "cfpc_org_access"
  ON public.cash_flow_projection_config FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

REVOKE ALL ON public.cash_flow_projection_config FROM anon;

COMMENT ON TABLE public.cash_flow_projection_config IS
  'Configuração por organização dos fatores dos cenários otimista/pessimista do fluxo projetado (task 86agymy8t).';
