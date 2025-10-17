-- =====================================================
-- SISTEMA DE WORKFLOWS DE APROVAÇÃO
-- =====================================================
-- Implementação de workflows de aprovação para compras e movimentações
-- conforme US-009.3 e US-010.1/010.2
--
-- Criado: 2025-01-17
-- Autor: Sistema ERP Retifica Formiguense
-- =====================================================

-- =====================================================
-- 1. TABELA: approval_workflows (Workflows de Aprovação)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Identificação do workflow
  workflow_type TEXT NOT NULL CHECK (
    workflow_type IN ('purchase_order', 'inventory_adjustment', 'inventory_entry', 'inventory_exit')
  ),
  reference_id UUID NOT NULL, -- ID do registro que precisa aprovação
  reference_table TEXT NOT NULL, -- Tabela do registro
  
  -- Dados do solicitante
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Dados da aprovação
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'cancelled')
  ),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Dados do item para aprovação
  item_data JSONB NOT NULL, -- Dados completos do item
  approval_reason TEXT, -- Motivo que gerou necessidade de aprovação
  
  -- Limites que acionaram aprovação
  value_threshold DECIMAL(15,2), -- Valor que acionou aprovação
  quantity_threshold INTEGER, -- Quantidade que acionou aprovação
  percentage_threshold DECIMAL(5,2), -- Percentual que acionou aprovação
  
  -- Observações
  notes TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA: approval_rules (Regras de Aprovação)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.approval_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Tipo de regra
  rule_type TEXT NOT NULL CHECK (
    rule_type IN ('purchase_order', 'inventory_adjustment', 'inventory_entry', 'inventory_exit')
  ),
  
  -- Condições para aprovação
  min_value DECIMAL(15,2), -- Valor mínimo que requer aprovação
  min_quantity INTEGER, -- Quantidade mínima que requer aprovação
  min_percentage DECIMAL(5,2), -- Percentual mínimo que requer aprovação
  
  -- Aprovadores permitidos (roles)
  allowed_approvers TEXT[] DEFAULT '{"admin", "manager", "owner"}',
  
  -- Configurações
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- =====================================================
-- Índices para approval_workflows
CREATE INDEX IF NOT EXISTS idx_approval_workflows_org_id 
  ON public.approval_workflows(org_id);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_type 
  ON public.approval_workflows(workflow_type);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_status 
  ON public.approval_workflows(status);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_reference 
  ON public.approval_workflows(reference_id, reference_table);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_requested_by 
  ON public.approval_workflows(requested_by);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_approved_by 
  ON public.approval_workflows(approved_by) 
  WHERE approved_by IS NOT NULL;

-- Índices para approval_rules
CREATE INDEX IF NOT EXISTS idx_approval_rules_org_id 
  ON public.approval_rules(org_id);

CREATE INDEX IF NOT EXISTS idx_approval_rules_type 
  ON public.approval_rules(rule_type);

CREATE INDEX IF NOT EXISTS idx_approval_rules_active 
  ON public.approval_rules(is_active) 
  WHERE is_active = true;

-- =====================================================
-- 4. RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_rules ENABLE ROW LEVEL SECURITY;

-- Policies para approval_workflows
CREATE POLICY "Users can view approval workflows from their org"
  ON public.approval_workflows 
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY "Users can create approval workflows in their org"
  ON public.approval_workflows 
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    AND requested_by = auth.uid()
  );

CREATE POLICY "Users can update approval workflows in their org"
  ON public.approval_workflows 
  FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Policies para approval_rules
CREATE POLICY "Users can view approval rules from their org"
  ON public.approval_rules 
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY "Only admins can manage approval rules"
  ON public.approval_rules 
  FOR ALL
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
        AND role IN ('admin', 'owner')
    )
  );

-- =====================================================
-- 5. FUNÇÃO: Verificar se precisa aprovação
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_approval_required(
  p_org_id UUID,
  p_rule_type TEXT,
  p_value DECIMAL DEFAULT NULL,
  p_quantity INTEGER DEFAULT NULL,
  p_percentage DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rule RECORD;
  v_requires_approval BOOLEAN := false;
BEGIN
  -- Buscar regras ativas para este tipo
  FOR v_rule IN 
    SELECT *
    FROM approval_rules
    WHERE org_id = p_org_id
      AND rule_type = p_rule_type
      AND is_active = true
  LOOP
    -- Verificar se alguma condição é atendida
    IF (v_rule.min_value IS NOT NULL AND p_value IS NOT NULL AND p_value >= v_rule.min_value) OR
       (v_rule.min_quantity IS NOT NULL AND p_quantity IS NOT NULL AND p_quantity >= v_rule.min_quantity) OR
       (v_rule.min_percentage IS NOT NULL AND p_percentage IS NOT NULL AND p_percentage >= v_rule.min_percentage) THEN
      v_requires_approval := true;
      EXIT; -- Sair do loop na primeira regra que se aplica
    END IF;
  END LOOP;
  
  RETURN v_requires_approval;
END;
$$;

-- =====================================================
-- 6. FUNÇÃO: Criar workflow de aprovação
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_approval_workflow(
  p_org_id UUID,
  p_workflow_type TEXT,
  p_reference_id UUID,
  p_reference_table TEXT,
  p_item_data JSONB,
  p_approval_reason TEXT DEFAULT NULL,
  p_value DECIMAL DEFAULT NULL,
  p_quantity INTEGER DEFAULT NULL,
  p_percentage DECIMAL DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_workflow_id UUID;
  v_rule RECORD;
BEGIN
  -- Buscar regra aplicável
  SELECT *
  INTO v_rule
  FROM approval_rules
  WHERE org_id = p_org_id
    AND rule_type = p_workflow_type
    AND is_active = true
    AND (
      (min_value IS NOT NULL AND p_value IS NOT NULL AND p_value >= min_value) OR
      (min_quantity IS NOT NULL AND p_quantity IS NOT NULL AND p_quantity >= min_quantity) OR
      (min_percentage IS NOT NULL AND p_percentage IS NOT NULL AND p_percentage >= min_percentage)
    )
  ORDER BY 
    CASE 
      WHEN min_value IS NOT NULL AND p_value IS NOT NULL THEN min_value
      WHEN min_quantity IS NOT NULL AND p_quantity IS NOT NULL THEN min_quantity
      WHEN min_percentage IS NOT NULL AND p_percentage IS NOT NULL THEN min_percentage
      ELSE 0
    END ASC
  LIMIT 1;
  
  -- Criar workflow
  INSERT INTO approval_workflows (
    org_id,
    workflow_type,
    reference_id,
    reference_table,
    requested_by,
    item_data,
    approval_reason,
    value_threshold,
    quantity_threshold,
    percentage_threshold,
    status
  ) VALUES (
    p_org_id,
    p_workflow_type,
    p_reference_id,
    p_reference_table,
    auth.uid(),
    p_item_data,
    COALESCE(p_approval_reason, 'Aprovação automática requerida por regra organizacional'),
    p_value,
    p_quantity,
    p_percentage,
    'pending'
  ) RETURNING id INTO v_workflow_id;
  
  RETURN v_workflow_id;
END;
$$;

-- =====================================================
-- 7. FUNÇÃO: Aprovar workflow
-- =====================================================
CREATE OR REPLACE FUNCTION public.approve_workflow(
  p_workflow_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_workflow RECORD;
  v_user_role TEXT;
  v_can_approve BOOLEAN := false;
BEGIN
  -- Buscar workflow
  SELECT aw.*, ar.allowed_approvers
  INTO v_workflow
  FROM approval_workflows aw
  INNER JOIN approval_rules ar ON ar.org_id = aw.org_id AND ar.rule_type = aw.workflow_type
  WHERE aw.id = p_workflow_id
    AND aw.status = 'pending'
    AND ar.is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow não encontrado ou não está pendente';
  END IF;
  
  -- Verificar se usuário pode aprovar
  SELECT role INTO v_user_role
  FROM organization_users
  WHERE user_id = auth.uid()
    AND organization_id = v_workflow.org_id
    AND is_active = true;
  
  -- Verificar se o role está na lista de aprovadores permitidos
  IF v_user_role = ANY(v_workflow.allowed_approvers) THEN
    v_can_approve := true;
  END IF;
  
  IF NOT v_can_approve THEN
    RAISE EXCEPTION 'Usuário não tem permissão para aprovar este tipo de workflow';
  END IF;
  
  -- Aprovar workflow
  UPDATE approval_workflows
  SET 
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = NOW(),
    notes = p_notes,
    updated_at = NOW()
  WHERE id = p_workflow_id;
  
  -- Executar ação específica baseada no tipo
  CASE v_workflow.workflow_type
    WHEN 'purchase_order' THEN
      -- Atualizar status do pedido de compra
      UPDATE purchase_orders
      SET 
        status = 'approved',
        updated_at = NOW()
      WHERE id = v_workflow.reference_id;
      
    WHEN 'inventory_adjustment' THEN
      -- Aplicar ajuste de inventário
      PERFORM public.apply_inventory_adjustment_from_workflow(v_workflow.reference_id, v_workflow.item_data);
      
    WHEN 'inventory_entry' THEN
      -- Aplicar entrada de estoque
      PERFORM public.apply_inventory_entry_from_workflow(v_workflow.reference_id, v_workflow.item_data);
      
    WHEN 'inventory_exit' THEN
      -- Aplicar saída de estoque
      PERFORM public.apply_inventory_exit_from_workflow(v_workflow.reference_id, v_workflow.item_data);
  END CASE;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 8. FUNÇÃO: Rejeitar workflow
-- =====================================================
CREATE OR REPLACE FUNCTION public.reject_workflow(
  p_workflow_id UUID,
  p_rejection_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_workflow RECORD;
  v_user_role TEXT;
  v_can_approve BOOLEAN := false;
BEGIN
  -- Buscar workflow
  SELECT aw.*, ar.allowed_approvers
  INTO v_workflow
  FROM approval_workflows aw
  INNER JOIN approval_rules ar ON ar.org_id = aw.org_id AND ar.rule_type = aw.workflow_type
  WHERE aw.id = p_workflow_id
    AND aw.status = 'pending'
    AND ar.is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow não encontrado ou não está pendente';
  END IF;
  
  -- Verificar se usuário pode aprovar (mesma permissão para rejeitar)
  SELECT role INTO v_user_role
  FROM organization_users
  WHERE user_id = auth.uid()
    AND organization_id = v_workflow.org_id
    AND is_active = true;
  
  IF v_user_role = ANY(v_workflow.allowed_approvers) THEN
    v_can_approve := true;
  END IF;
  
  IF NOT v_can_approve THEN
    RAISE EXCEPTION 'Usuário não tem permissão para rejeitar este workflow';
  END IF;
  
  -- Rejeitar workflow
  UPDATE approval_workflows
  SET 
    status = 'rejected',
    approved_by = auth.uid(),
    approved_at = NOW(),
    rejection_reason = p_rejection_reason,
    updated_at = NOW()
  WHERE id = p_workflow_id;
  
  -- Atualizar status do item original baseado no tipo
  CASE v_workflow.workflow_type
    WHEN 'purchase_order' THEN
      UPDATE purchase_orders
      SET 
        status = 'rejected',
        updated_at = NOW()
      WHERE id = v_workflow.reference_id;
  END CASE;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 9. FUNÇÕES AUXILIARES PARA APLICAR APROVAÇÕES
-- =====================================================
-- Função para aplicar ajuste de inventário aprovado
CREATE OR REPLACE FUNCTION public.apply_inventory_adjustment_from_workflow(
  p_reference_id UUID,
  p_item_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Implementar lógica específica de ajuste de inventário
  -- Esta função será expandida quando implementarmos os ajustes
  RAISE NOTICE 'Ajuste de inventário aprovado: %', p_reference_id;
END;
$$;

-- Função para aplicar entrada de estoque aprovada
CREATE OR REPLACE FUNCTION public.apply_inventory_entry_from_workflow(
  p_reference_id UUID,
  p_item_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Implementar lógica específica de entrada de estoque
  RAISE NOTICE 'Entrada de estoque aprovada: %', p_reference_id;
END;
$$;

-- Função para aplicar saída de estoque aprovada
CREATE OR REPLACE FUNCTION public.apply_inventory_exit_from_workflow(
  p_reference_id UUID,
  p_item_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Implementar lógica específica de saída de estoque
  RAISE NOTICE 'Saída de estoque aprovada: %', p_reference_id;
END;
$$;

-- =====================================================
-- 10. INSERIR REGRAS PADRÃO
-- =====================================================
-- Inserir regras padrão para organizações existentes
INSERT INTO public.approval_rules (org_id, rule_type, min_value, description)
SELECT 
  id as org_id,
  'purchase_order' as rule_type,
  5000.00 as min_value,
  'Pedidos de compra acima de R$ 5.000 requerem aprovação' as description
FROM public.organizations
ON CONFLICT DO NOTHING;

INSERT INTO public.approval_rules (org_id, rule_type, min_value, description)
SELECT 
  id as org_id,
  'inventory_adjustment' as rule_type,
  500.00 as min_value,
  'Ajustes de inventário acima de R$ 500 requerem aprovação' as description
FROM public.organizations
ON CONFLICT DO NOTHING;

INSERT INTO public.approval_rules (org_id, rule_type, min_value, description)
SELECT 
  id as org_id,
  'inventory_entry' as rule_type,
  1000.00 as min_value,
  'Entradas manuais acima de R$ 1.000 requerem aprovação' as description
FROM public.organizations
ON CONFLICT DO NOTHING;

INSERT INTO public.approval_rules (org_id, rule_type, min_percentage, description)
SELECT 
  id as org_id,
  'inventory_exit' as rule_type,
  20.00 as min_percentage,
  'Saídas que representem mais de 20% do estoque requerem aprovação' as description
FROM public.organizations
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. TRIGGER: Atualizar updated_at
-- =====================================================
CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_rules_updated_at
  BEFORE UPDATE ON public.approval_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 12. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================
COMMENT ON TABLE public.approval_workflows IS 
'Workflows de aprovação para compras e movimentações de estoque. Status: pending (pendente), approved (aprovado), rejected (rejeitado), cancelled (cancelado).';

COMMENT ON TABLE public.approval_rules IS 
'Regras configuráveis que determinam quando aprovações são necessárias por organização e tipo de operação.';

COMMENT ON FUNCTION public.check_approval_required(UUID, TEXT, DECIMAL, INTEGER, DECIMAL) IS 
'Verifica se uma operação requer aprovação baseada nas regras configuradas para a organização.';

COMMENT ON FUNCTION public.create_approval_workflow(UUID, TEXT, UUID, TEXT, JSONB, TEXT, DECIMAL, INTEGER, DECIMAL) IS 
'Cria um novo workflow de aprovação quando uma operação atende aos critérios configurados.';

COMMENT ON FUNCTION public.approve_workflow(UUID, TEXT) IS 
'Aprova um workflow pendente e executa a ação correspondente no sistema.';

COMMENT ON FUNCTION public.reject_workflow(UUID, TEXT) IS 
'Rejeita um workflow pendente com justificativa obrigatória.';

-- =====================================================
-- 13. GRANTS (Permissões)
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON public.approval_workflows TO authenticated;
GRANT SELECT ON public.approval_rules TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.approval_rules TO authenticated; -- Será restrito por RLS

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
