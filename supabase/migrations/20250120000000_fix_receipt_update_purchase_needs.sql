-- Corrigir atualização de purchase_needs e estoque após recebimento
-- Esta função atualiza purchase_needs quando peças são recebidas e o estoque é atualizado

-- 1. Função para atualizar purchase_needs após recebimento
CREATE OR REPLACE FUNCTION public.update_purchase_needs_on_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_part_code VARCHAR(100);
  v_part_name VARCHAR(255);
  v_org_id UUID;
  v_current_stock INTEGER;
  v_approved_qty INTEGER;
  v_receipt RECORD;
  v_po RECORD;
BEGIN
  -- Apenas processar movimentações de entrada (recebimento)
  IF NEW.movement_type != 'entrada' THEN
    RETURN NEW;
  END IF;

  -- Verificar se é uma movimentação de recebimento (tem metadata com receipt_id)
  IF NEW.metadata IS NULL OR (NEW.metadata->>'receipt_id') IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar informações da peça
  SELECT 
    pi.part_code,
    pi.part_name,
    pi.org_id
  INTO v_part_code, v_part_name, v_org_id
  FROM parts_inventory pi
  WHERE pi.id = NEW.part_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Peça % não encontrada no estoque para atualizar purchase_needs', NEW.part_id;
    RETURN NEW;
  END IF;

  -- Usar new_quantity que já reflete o estoque após a movimentação
  -- (o trigger update_inventory_on_movement já executou antes)
  v_current_stock := NEW.new_quantity;

  -- Obter quantidade aprovada do metadata
  v_approved_qty := COALESCE((NEW.metadata->>'approved_quantity')::INTEGER, NEW.quantity);

  -- Atualizar purchase_needs para esta peça
  -- Atualizar available_quantity com o estoque atual (após a movimentação)
  UPDATE purchase_needs
  SET 
    available_quantity = v_current_stock,
    updated_at = NOW()
  WHERE org_id = v_org_id
    AND part_code = v_part_code
    AND status = 'pending';

  -- Se a necessidade foi totalmente atendida (available_quantity >= required_quantity), 
  -- atualizar status para 'completed' ou remover se não há mais necessidade
  UPDATE purchase_needs
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE org_id = v_org_id
    AND part_code = v_part_code
    AND status = 'pending'
    AND available_quantity >= required_quantity;

  -- Se ainda há necessidade mas foi parcialmente atendida, manter como 'pending'
  -- (já foi atualizado acima)

  RAISE NOTICE 'Purchase_needs atualizado para peça % (part_code: %). Estoque atual: %, Quantidade recebida: %', 
    v_part_name, v_part_code, v_current_stock, v_approved_qty;

  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar purchase_needs após movimentação de estoque
DROP TRIGGER IF EXISTS trigger_update_purchase_needs_on_receipt ON public.inventory_movements;
CREATE TRIGGER trigger_update_purchase_needs_on_receipt
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  WHEN (NEW.movement_type = 'entrada' AND NEW.metadata IS NOT NULL AND (NEW.metadata->>'receipt_id') IS NOT NULL)
  EXECUTE FUNCTION public.update_purchase_needs_on_receipt();

-- Comentário da função
COMMENT ON FUNCTION public.update_purchase_needs_on_receipt() IS 
'Atualiza purchase_needs quando peças são recebidas. Atualiza available_quantity com o estoque atual e marca como completed se a necessidade foi totalmente atendida.';

-- 2. Verificar e corrigir trigger de criação de movimentação
-- O trigger já existe, mas vamos garantir que está configurado corretamente
-- O trigger trigger_create_inventory_entry já está configurado para executar após INSERT
-- quando part_id IS NOT NULL e quality_status = 'approved'

-- 3. Função auxiliar para atualizar purchase_needs baseado no estoque atual
-- Útil para corrigir dados existentes ou atualizar após mudanças no estoque
CREATE OR REPLACE FUNCTION public.sync_purchase_needs_with_stock(p_org_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_part RECORD;
BEGIN
  -- Atualizar available_quantity de todas as purchase_needs pendentes
  -- baseado no estoque atual
  FOR v_part IN
    SELECT DISTINCT
      pn.org_id,
      pn.part_code,
      COALESCE(pi.quantity, 0) as current_stock
    FROM purchase_needs pn
    LEFT JOIN parts_inventory pi ON pi.part_code = pn.part_code AND pi.org_id = pn.org_id
    WHERE pn.status = 'pending'
      AND (p_org_id IS NULL OR pn.org_id = p_org_id)
  LOOP
    -- Atualizar available_quantity
    UPDATE purchase_needs
    SET 
      available_quantity = v_part.current_stock,
      status = CASE 
        WHEN v_part.current_stock >= required_quantity THEN 'completed'
        ELSE 'pending'
      END,
      updated_at = NOW()
    WHERE org_id = v_part.org_id
      AND part_code = v_part.part_code
      AND status = 'pending';
    
    v_updated_count := v_updated_count + 1;
  END LOOP;

  RETURN v_updated_count;
END;
$$;

COMMENT ON FUNCTION public.sync_purchase_needs_with_stock(UUID) IS 
'Sincroniza purchase_needs com o estoque atual. Atualiza available_quantity e marca como completed se a necessidade foi atendida. Útil para corrigir dados existentes.';

