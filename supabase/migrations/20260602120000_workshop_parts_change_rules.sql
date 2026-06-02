-- =====================================================
-- Regra: inclusão/exclusão/substituição de peças em OS após aprovação.
-- Task ClickUp 86agmy9k7.
--
-- Permite ao almoxarifado alterar peças em OS já aprovadas sem
-- depender do comercial, com critério de valor máximo automático.
-- Default = desligado (mantém comportamento atual: bloqueia alteração
-- pós-aprovação).
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workshop_parts_change_rules (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Permite que perfis operacionais (almoxarifado) incluam/excluam/substituam
  -- peças em OS já aprovadas. Quando false, qualquer alteração é bloqueada.
  allow_after_approval BOOLEAN NOT NULL DEFAULT false,

  -- Valor máximo (em R$) da alteração unitária (qty * unit_price) permitido
  -- automaticamente. NULL = sem limite quando allow_after_approval = true.
  -- Alterações acima desse valor são bloqueadas mesmo com a flag ligada.
  auto_threshold_amount NUMERIC(12, 2) CHECK (auto_threshold_amount IS NULL OR auto_threshold_amount >= 0),

  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_workshop_parts_change_rules_updated_at
BEFORE UPDATE ON public.workshop_parts_change_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.workshop_parts_change_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wpcr_org_access" ON public.workshop_parts_change_rules;
CREATE POLICY "wpcr_org_access"
  ON public.workshop_parts_change_rules FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

REVOKE ALL ON public.workshop_parts_change_rules FROM anon;

COMMENT ON TABLE public.workshop_parts_change_rules IS
  'Regra por organização para alteração de peças em OS aprovada pelo almoxarifado (task 86agmy9k7).';
