-- =====================================================
-- PARTE 4/4: TRIGGERS E VALIDAÇÕES
-- =====================================================

-- FUNCTION: Validar movimentação
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

-- FUNCTION: Atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION public.update_inventory_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_part_name TEXT;
  v_low_stock_threshold INTEGER := 5;
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

-- Criar triggers
DROP TRIGGER IF EXISTS trigger_validate_inventory_movement ON public.inventory_movements;
CREATE TRIGGER trigger_validate_inventory_movement
  BEFORE INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_inventory_movement();

DROP TRIGGER IF EXISTS trigger_update_inventory_on_movement ON public.inventory_movements;
CREATE TRIGGER trigger_update_inventory_on_movement
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_movement();

