-- =====================================================
-- Régua de cobrança (configuração)
-- Task ClickUp 86agymx9y — Fase 1: schema + UI.
-- Fase 2 (dispatcher cron/email) será migration separada.
--
-- Cada org pode ter múltiplas réguas (ex: "Padrão", "Cliente VIP")
-- com vários passos (offset em dias relativos ao vencimento).
-- =====================================================

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
  -- Offset em dias a partir do vencimento. Negativo = antes; 0 = no dia; positivo = depois.
  offset_days INTEGER NOT NULL,
  -- 'calendar' = dias corridos; 'business' = dias úteis (D+5 da régua Favarini)
  offset_type TEXT NOT NULL DEFAULT 'calendar' CHECK (offset_type IN ('calendar', 'business')),
  -- Categoria do passo (drives copy padrão e UI)
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

-- =====================================================
-- Triggers para updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_ar_collection_rules_updated_at ON public.ar_collection_rules;
CREATE TRIGGER update_ar_collection_rules_updated_at
BEFORE UPDATE ON public.ar_collection_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ar_collection_rule_steps_updated_at ON public.ar_collection_rule_steps;
CREATE TRIGGER update_ar_collection_rule_steps_updated_at
BEFORE UPDATE ON public.ar_collection_rule_steps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS (segue padrão is_org_member)
-- =====================================================
ALTER TABLE public.ar_collection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_collection_rule_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ar_collection_rules_org_access" ON public.ar_collection_rules;
DROP POLICY IF EXISTS "ar_collection_rules_org_access" ON public.ar_collection_rules;
CREATE POLICY "ar_collection_rules_org_access"
  ON public.ar_collection_rules FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

DROP POLICY IF EXISTS "ar_collection_rule_steps_org_access" ON public.ar_collection_rule_steps;
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
