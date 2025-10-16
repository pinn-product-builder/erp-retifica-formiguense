-- =====================================================
-- FASE 4: INTEGRAÇÃO RECEBIMENTO → ESTOQUE
-- =====================================================
-- Integração automática entre recebimentos de compra e estoque
-- Cria movimentações de entrada automaticamente
--
-- Criado: 2025-01-12
-- Autor: Sistema ERP Retifica Formiguense
-- =====================================================

-- =====================================================
-- 1. ADICIONAR part_id em purchase_order_items (se não existir)
-- =====================================================
-- Permite vincular itens do pedido diretamente às peças do estoque
ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS part_id UUID REFERENCES public.parts_inventory(id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_part_id 
  ON public.purchase_order_items(part_id)
  WHERE part_id IS NOT NULL;

COMMENT ON COLUMN public.purchase_order_items.part_id IS 
'Vinculação com peça do estoque. Permite entrada automática ao receber o pedido.';

-- =====================================================
-- 2. FUNCTION: Criar entrada no estoque ao receber
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_inventory_entry_on_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_receipt RECORD;
  v_po RECORD;
  v_part RECORD;
  v_user_id UUID;
BEGIN
  -- Buscar informações do recebimento
  SELECT * INTO v_receipt
  FROM purchase_receipts
  WHERE id = NEW.receipt_id;
  
  -- Buscar informações do pedido de compra
  SELECT * INTO v_po
  FROM purchase_orders
  WHERE id = v_receipt.purchase_order_id;
  
  -- Apenas processar se o item tem part_id (vínculo com estoque)
  IF NEW.part_id IS NULL THEN
    RAISE NOTICE 'Item % não tem part_id, entrada no estoque ignorada', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Apenas processar se a qualidade foi aprovada
  IF NEW.quality_status != 'approved' THEN
    RAISE NOTICE 'Item % com qualidade não aprovada, entrada no estoque ignorada', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Buscar informações da peça
  SELECT * INTO v_part
  FROM parts_inventory
  WHERE id = NEW.part_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Peça % não encontrada no estoque', NEW.part_id;
    RETURN NEW;
  END IF;
  
  -- Buscar usuário que recebeu
  SELECT received_by INTO v_user_id
  FROM purchase_receipts
  WHERE id = NEW.receipt_id;
  
  -- Criar movimentação de entrada no estoque
  INSERT INTO inventory_movements (
    org_id,
    part_id,
    movement_type,
    quantity,
    previous_quantity,
    new_quantity,
    unit_cost,
    order_id,
    reason,
    notes,
    created_by,
    metadata
  ) VALUES (
    v_receipt.org_id,
    NEW.part_id,
    'entrada',
    NEW.received_quantity,
    v_part.quantity,
    v_part.quantity + NEW.received_quantity,
    NEW.unit_cost,
    NULL, -- Não vincula com ordem de serviço, apenas com PO
    'Recebimento de compra - PO: ' || v_po.po_number || ' | Recebimento: ' || v_receipt.receipt_number,
    CASE 
      WHEN NEW.has_divergence THEN 
        'Recebido com divergência: ' || COALESCE(NEW.divergence_reason, 'Não especificada')
      ELSE 
        'Recebimento conforme pedido'
    END,
    COALESCE(v_user_id, v_receipt.created_by),
    jsonb_build_object(
      'receipt_id', v_receipt.id,
      'receipt_number', v_receipt.receipt_number,
      'purchase_order_id', v_po.id,
      'po_number', v_po.po_number,
      'supplier_id', v_po.supplier_id,
      'has_divergence', NEW.has_divergence,
      'quality_status', NEW.quality_status
    )
  );
  
  RAISE NOTICE 'Entrada no estoque criada para peça % (quantidade: %)', v_part.part_name, NEW.received_quantity;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. TRIGGER: Criar entrada automaticamente
-- =====================================================
DROP TRIGGER IF EXISTS trigger_create_inventory_entry ON public.purchase_receipt_items;
CREATE TRIGGER trigger_create_inventory_entry
  AFTER INSERT ON public.purchase_receipt_items
  FOR EACH ROW
  WHEN (NEW.part_id IS NOT NULL AND NEW.quality_status = 'approved')
  EXECUTE FUNCTION public.create_inventory_entry_on_receipt();

-- =====================================================
-- 4. COMENTÁRIOS
-- =====================================================
COMMENT ON FUNCTION public.create_inventory_entry_on_receipt() IS 
'Cria automaticamente uma movimentação de entrada no estoque quando um item é recebido no recebimento de compra. Apenas processa itens com part_id definido e qualidade aprovada.';

-- =====================================================
-- 5. FUNCTION: Sincronizar part_id de items existentes
-- =====================================================
-- Função auxiliar para vincular itens de pedidos às peças do estoque
-- baseado no part_code
CREATE OR REPLACE FUNCTION public.sync_purchase_items_with_inventory()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  UPDATE purchase_order_items poi
  SET part_id = pi.id
  FROM parts_inventory pi
  WHERE poi.part_id IS NULL
    AND pi.part_code IS NOT NULL
    AND (
      poi.item_name ILIKE '%' || pi.part_code || '%'
      OR poi.item_name ILIKE '%' || pi.part_name || '%'
    )
    AND poi.po_id IN (
      SELECT id FROM purchase_orders po
      WHERE po.org_id = pi.org_id
    );
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$;

COMMENT ON FUNCTION public.sync_purchase_items_with_inventory() IS 
'Função auxiliar para vincular itens de pedidos de compra existentes às peças do estoque baseado em correspondência de nome/código. Retorna quantidade de itens atualizados.';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

