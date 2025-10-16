-- =====================================================
-- FASE 1: SISTEMA DE MOVIMENTAÇÃO DE ESTOQUE
-- =====================================================
-- Implementação do sistema de movimentação de inventário
-- conforme documentado em proj_docs/modules/inventory/implementation-plan.md
--
-- Criado: 2025-01-12
-- Autor: Sistema ERP Retifica Formiguense
-- =====================================================

-- =====================================================
-- 1. TABELA PRINCIPAL: inventory_movements
-- =====================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts_inventory(id) ON DELETE CASCADE,
  
  -- Tipo de movimentação
  movement_type TEXT NOT NULL CHECK (
    movement_type IN ('entrada', 'saida', 'ajuste', 'transferencia', 'reserva', 'baixa')
  ),
  
  -- Quantidades
  quantity INTEGER NOT NULL CHECK (quantity != 0),
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  
  -- Custo (opcional, usado em entradas)
  unit_cost DECIMAL(10,2),
  
  -- Vínculos com outras entidades
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  budget_id UUID REFERENCES public.detailed_budgets(id) ON DELETE SET NULL,
  
  -- Justificativa e observações
  reason TEXT NOT NULL,
  notes TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadados adicionais (JSON para flexibilidade futura)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_inventory_movements_org_id 
  ON public.inventory_movements(org_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_part_id 
  ON public.inventory_movements(part_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at 
  ON public.inventory_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_type 
  ON public.inventory_movements(movement_type);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_order_id 
  ON public.inventory_movements(order_id) 
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_budget_id 
  ON public.inventory_movements(budget_id) 
  WHERE budget_id IS NOT NULL;

-- =====================================================
-- 3. RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Visualizar movimentações da própria organização
CREATE POLICY "Users can view movements from their org"
  ON public.inventory_movements 
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Policy: Criar movimentações na própria organização
CREATE POLICY "Users can create movements in their org"
  ON public.inventory_movements 
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    AND created_by = auth.uid()
  );

-- =====================================================
-- 4. TRIGGER: Atualizar estoque automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_inventory_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_part_name TEXT;
  v_low_stock_threshold INTEGER := 5; -- padrão
  v_min_stock INTEGER;
BEGIN
  -- Buscar nome da peça e threshold configurado
  SELECT 
    pi.part_name,
    COALESCE(psc.minimum_stock, v_low_stock_threshold)
  INTO v_part_name, v_min_stock
  FROM parts_inventory pi
  LEFT JOIN parts_stock_config psc ON pi.part_code = psc.part_code AND pi.org_id = psc.org_id
  WHERE pi.id = NEW.part_id;

  -- Atualizar quantidade na tabela parts_inventory
  UPDATE parts_inventory
  SET quantity = NEW.new_quantity
  WHERE id = NEW.part_id;
  
  -- Criar alerta se estoque ficar baixo
  IF NEW.new_quantity <= v_min_stock AND NEW.new_quantity >= 0 THEN
    -- Inserir ou atualizar alerta de estoque baixo
    INSERT INTO stock_alerts (
      org_id,
      part_code,
      part_name,
      current_stock,
      minimum_stock,
      alert_type,
      alert_level,
      is_active,
      created_at
    )
    SELECT 
      NEW.org_id,
      pi.part_code,
      pi.part_name,
      NEW.new_quantity,
      v_min_stock,
      'low_stock',
      CASE 
        WHEN NEW.new_quantity = 0 THEN 'critical'
        WHEN NEW.new_quantity < v_min_stock * 0.5 THEN 'high'
        ELSE 'warning'
      END,
      true,
      NOW()
    FROM parts_inventory pi
    WHERE pi.id = NEW.part_id
    ON CONFLICT (org_id, part_code) 
    DO UPDATE SET
      current_stock = EXCLUDED.current_stock,
      alert_level = EXCLUDED.alert_level,
      created_at = NOW(),
      is_active = true;
  END IF;
  
  -- Se estoque voltou a nível adequado, desativar alerta
  IF NEW.new_quantity > v_min_stock THEN
    UPDATE stock_alerts
    SET is_active = false
    WHERE org_id = NEW.org_id
      AND part_code = (SELECT part_code FROM parts_inventory WHERE id = NEW.part_id)
      AND alert_type = 'low_stock';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: Executar após inserir movimentação
DROP TRIGGER IF EXISTS trigger_update_inventory_on_movement ON public.inventory_movements;
CREATE TRIGGER trigger_update_inventory_on_movement
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_movement();

-- =====================================================
-- 5. FUNCTION: Validar estoque antes de movimentação
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_inventory_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_quantity INTEGER;
BEGIN
  -- Buscar quantidade atual
  SELECT quantity INTO v_current_quantity
  FROM parts_inventory
  WHERE id = NEW.part_id
    AND org_id = NEW.org_id;

  -- Validar se a peça existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Peça não encontrada ou não pertence à organização';
  END IF;

  -- Validar se previous_quantity está correto
  IF NEW.previous_quantity != v_current_quantity THEN
    RAISE EXCEPTION 'Quantidade anterior (%) não corresponde ao estoque atual (%). Conflito de concorrência detectado.', 
      NEW.previous_quantity, v_current_quantity;
  END IF;

  -- Validar estoque negativo (não permitido)
  IF NEW.new_quantity < 0 THEN
    RAISE EXCEPTION 'Estoque não pode ficar negativo. Estoque atual: %, Tentativa de reduzir: %', 
      v_current_quantity, NEW.quantity;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: Validar ANTES de inserir movimentação
DROP TRIGGER IF EXISTS trigger_validate_inventory_movement ON public.inventory_movements;
CREATE TRIGGER trigger_validate_inventory_movement
  BEFORE INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_inventory_movement();

-- =====================================================
-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================
COMMENT ON TABLE public.inventory_movements IS 
'Registra todas as movimentações de estoque (entradas, saídas, ajustes, etc.) com auditoria completa.';

COMMENT ON COLUMN public.inventory_movements.movement_type IS 
'Tipo: entrada (recebimento), saida (venda/uso), ajuste (correção), transferencia (entre locais), reserva (bloqueio), baixa (descarte)';

COMMENT ON COLUMN public.inventory_movements.quantity IS 
'Quantidade movimentada (sempre positiva, o tipo define se aumenta ou diminui estoque)';

COMMENT ON COLUMN public.inventory_movements.previous_quantity IS 
'Quantidade no estoque ANTES da movimentação (para auditoria e controle de concorrência)';

COMMENT ON COLUMN public.inventory_movements.new_quantity IS 
'Quantidade no estoque APÓS a movimentação';

COMMENT ON COLUMN public.inventory_movements.reason IS 
'Motivo/justificativa obrigatória para a movimentação';

COMMENT ON FUNCTION public.update_inventory_on_movement() IS 
'Trigger que atualiza automaticamente o estoque em parts_inventory e cria alertas se necessário';

COMMENT ON FUNCTION public.validate_inventory_movement() IS 
'Trigger que valida a movimentação antes de inserir, impedindo estoque negativo e detectando conflitos de concorrência';

-- =====================================================
-- 7. GRANTS (Permissões)
-- =====================================================
-- Conceder permissões básicas para usuários autenticados
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

