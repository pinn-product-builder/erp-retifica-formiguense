-- Migration: Implement Auto Purchase Needs System
-- Description: Create functions to automatically generate purchase needs based on low stock levels

-- Function to generate purchase needs from low stock
CREATE OR REPLACE FUNCTION generate_purchase_needs_from_low_stock(p_org_id UUID)
RETURNS JSON AS $$
DECLARE
  v_part RECORD;
  v_need_id UUID;
  v_generated_count INTEGER := 0;
  v_min_stock_level INTEGER := 5; -- Configurável por organização
  v_reorder_quantity INTEGER;
  v_suggested_suppliers JSON;
BEGIN
  -- Verificar peças com estoque baixo
  FOR v_part IN 
    SELECT 
      pi.part_code,
      pi.part_name,
      pi.quantity as available_quantity,
      pi.unit_cost,
      COALESCE(pi.min_stock_level, v_min_stock_level) as min_level,
      COALESCE(pi.reorder_quantity, v_min_stock_level * 2) as reorder_qty
    FROM parts_inventory pi
    WHERE pi.org_id = p_org_id
      AND pi.quantity <= COALESCE(pi.min_stock_level, v_min_stock_level)
      AND pi.status = 'disponivel'
      -- Não gerar se já existe necessidade pendente para esta peça
      AND NOT EXISTS (
        SELECT 1 FROM purchase_needs pn 
        WHERE pn.org_id = p_org_id 
          AND pn.part_code = pi.part_code 
          AND pn.status IN ('pending', 'in_quotation', 'ordered')
      )
  LOOP
    -- Calcular quantidade necessária
    v_reorder_quantity := v_part.reorder_qty;
    
    -- Buscar fornecedores sugeridos para esta peça
    BEGIN
      SELECT suggest_suppliers_for_part(v_part.part_name, p_org_id) INTO v_suggested_suppliers;
    EXCEPTION WHEN OTHERS THEN
      v_suggested_suppliers := '[]'::JSON;
    END;
    
    -- Determinar prioridade baseada no nível de estoque
    DECLARE
      v_priority TEXT;
      v_shortage_ratio DECIMAL;
    BEGIN
      v_shortage_ratio := (v_part.min_level - v_part.available_quantity)::DECIMAL / v_part.min_level::DECIMAL;
      
      IF v_part.available_quantity = 0 THEN
        v_priority := 'critical';
      ELSIF v_shortage_ratio >= 0.8 THEN
        v_priority := 'high';
      ELSIF v_shortage_ratio >= 0.5 THEN
        v_priority := 'medium';
      ELSE
        v_priority := 'low';
      END IF;
    END;
    
    -- Criar necessidade de compra
    INSERT INTO purchase_needs (
      org_id,
      part_code,
      part_name,
      required_quantity,
      available_quantity,
      shortage_quantity,
      priority_level,
      need_type,
      suggested_suppliers,
      estimated_cost,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_org_id,
      v_part.part_code,
      v_part.part_name,
      v_reorder_quantity,
      v_part.available_quantity,
      v_reorder_quantity - v_part.available_quantity,
      v_priority,
      'auto_reorder',
      COALESCE(v_suggested_suppliers, '[]'::JSON),
      v_part.unit_cost * v_reorder_quantity,
      'pending',
      NOW(),
      NOW()
    ) RETURNING id INTO v_need_id;
    
    v_generated_count := v_generated_count + 1;
    
    -- Log da geração automática
    RAISE NOTICE 'Generated purchase need for part % (ID: %)', v_part.part_code, v_need_id;
  END LOOP;
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'generated_count', v_generated_count,
    'message', 'Purchase needs generated successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error generating purchase needs: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert purchase needs to requisition
CREATE OR REPLACE FUNCTION convert_needs_to_requisition(
  p_need_ids UUID[],
  p_org_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_requisition_id UUID;
  v_requisition_number TEXT;
  v_need RECORD;
  v_item_count INTEGER := 0;
  v_total_value DECIMAL := 0;
BEGIN
  -- Verificar se todas as necessidades pertencem à organização
  IF EXISTS (
    SELECT 1 FROM purchase_needs 
    WHERE id = ANY(p_need_ids) 
      AND org_id != p_org_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to purchase needs';
  END IF;
  
  -- Gerar número da requisição
  SELECT generate_requisition_number(p_org_id) INTO v_requisition_number;
  
  -- Criar requisição de compra
  INSERT INTO purchase_requisitions (
    org_id,
    requisition_number,
    description,
    status,
    requested_by,
    created_at,
    updated_at
  ) VALUES (
    p_org_id,
    v_requisition_number,
    'Requisição gerada automaticamente a partir de necessidades de compra',
    'pending',
    current_user_id(), -- Função que retorna o ID do usuário atual
    NOW(),
    NOW()
  ) RETURNING id INTO v_requisition_id;
  
  -- Adicionar itens da requisição baseados nas necessidades
  FOR v_need IN 
    SELECT * FROM purchase_needs 
    WHERE id = ANY(p_need_ids) 
      AND org_id = p_org_id
      AND status = 'pending'
  LOOP
    INSERT INTO purchase_requisition_items (
      requisition_id,
      item_name,
      description,
      quantity,
      estimated_price,
      total_price,
      urgency_level,
      created_at
    ) VALUES (
      v_requisition_id,
      v_need.part_name,
      CONCAT('Código: ', v_need.part_code, ' - Necessidade automática'),
      v_need.shortage_quantity,
      v_need.estimated_cost / v_need.required_quantity,
      v_need.estimated_cost,
      CASE v_need.priority_level
        WHEN 'critical' THEN 'urgent'
        WHEN 'high' THEN 'high'
        ELSE 'normal'
      END,
      NOW()
    );
    
    -- Atualizar status da necessidade
    UPDATE purchase_needs 
    SET status = 'in_quotation', updated_at = NOW()
    WHERE id = v_need.id;
    
    v_item_count := v_item_count + 1;
    v_total_value := v_total_value + v_need.estimated_cost;
  END LOOP;
  
  -- Atualizar valor total da requisição
  UPDATE purchase_requisitions 
  SET total_estimated_value = v_total_value
  WHERE id = v_requisition_id;
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'requisition_id', v_requisition_id,
    'requisition_number', v_requisition_number,
    'items_count', v_item_count,
    'total_value', v_total_value,
    'message', 'Requisition created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error converting needs to requisition: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user ID (helper function)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and alert about critical stock levels
CREATE OR REPLACE FUNCTION check_critical_stock_levels(p_org_id UUID)
RETURNS JSON AS $$
DECLARE
  v_critical_parts JSON;
  v_count INTEGER;
BEGIN
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'part_code', part_code,
      'part_name', part_name,
      'current_quantity', quantity,
      'min_level', COALESCE(min_stock_level, 5),
      'days_without_stock', CASE 
        WHEN quantity = 0 THEN EXTRACT(days FROM NOW() - updated_at)::INTEGER
        ELSE 0 
      END
    )
  ), COUNT(*)
  INTO v_critical_parts, v_count
  FROM parts_inventory
  WHERE org_id = p_org_id
    AND quantity <= COALESCE(min_stock_level, 5)
    AND status = 'disponivel';
  
  RETURN JSON_BUILD_OBJECT(
    'critical_parts', COALESCE(v_critical_parts, '[]'::JSON),
    'count', COALESCE(v_count, 0),
    'checked_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically generate purchase needs when stock goes below minimum
CREATE OR REPLACE FUNCTION trigger_auto_purchase_needs()
RETURNS TRIGGER AS $$
BEGIN
  -- Só executar se a quantidade diminuiu e ficou abaixo do mínimo
  IF TG_OP = 'UPDATE' AND 
     NEW.quantity < OLD.quantity AND 
     NEW.quantity <= COALESCE(NEW.min_stock_level, 5) AND
     NEW.status = 'disponivel' THEN
    
    -- Verificar se não existe necessidade pendente
    IF NOT EXISTS (
      SELECT 1 FROM purchase_needs 
      WHERE org_id = NEW.org_id 
        AND part_code = NEW.part_code 
        AND status IN ('pending', 'in_quotation', 'ordered')
    ) THEN
      -- Gerar necessidade automaticamente (em background)
      PERFORM generate_purchase_needs_from_low_stock(NEW.org_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela parts_inventory
DROP TRIGGER IF EXISTS trigger_auto_needs_on_low_stock ON parts_inventory;
CREATE TRIGGER trigger_auto_needs_on_low_stock
  AFTER UPDATE ON parts_inventory
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_purchase_needs();

-- Adicionar campos de configuração na tabela parts_inventory se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'parts_inventory' 
                 AND column_name = 'min_stock_level') THEN
    ALTER TABLE parts_inventory ADD COLUMN min_stock_level INTEGER DEFAULT 5;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'parts_inventory' 
                 AND column_name = 'reorder_quantity') THEN
    ALTER TABLE parts_inventory ADD COLUMN reorder_quantity INTEGER DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'parts_inventory' 
                 AND column_name = 'max_stock_level') THEN
    ALTER TABLE parts_inventory ADD COLUMN max_stock_level INTEGER DEFAULT 50;
  END IF;
END $$;

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_parts_inventory_low_stock 
ON parts_inventory (org_id, quantity, min_stock_level) 
WHERE status = 'disponivel';

CREATE INDEX IF NOT EXISTS idx_purchase_needs_status_priority 
ON purchase_needs (org_id, status, priority_level, created_at);

-- Comentários nas funções
COMMENT ON FUNCTION generate_purchase_needs_from_low_stock(UUID) IS 
'Gera automaticamente necessidades de compra baseadas em peças com estoque baixo';

COMMENT ON FUNCTION convert_needs_to_requisition(UUID[], UUID) IS 
'Converte necessidades de compra selecionadas em uma requisição de compra';

COMMENT ON FUNCTION check_critical_stock_levels(UUID) IS 
'Verifica e retorna informações sobre peças com estoque crítico';

COMMENT ON FUNCTION current_user_id() IS 
'Retorna o ID do usuário autenticado atual';

-- Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION generate_purchase_needs_from_low_stock(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_needs_to_requisition(UUID[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_critical_stock_levels(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
