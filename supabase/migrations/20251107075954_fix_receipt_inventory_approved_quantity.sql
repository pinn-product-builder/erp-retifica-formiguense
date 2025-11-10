-- Corrigir função de entrada no estoque para usar approved_quantity
-- Garantir que apenas itens aprovados entrem no estoque (parcial ou completo)

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
  v_approved_qty INTEGER;
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
  
  -- Usar approved_quantity em vez de received_quantity
  -- Apenas itens aprovados devem entrar no estoque
  v_approved_qty := COALESCE(NEW.approved_quantity, 0);
  
  -- Se não há quantidade aprovada, não criar movimentação
  IF v_approved_qty <= 0 THEN
    RAISE NOTICE 'Item % não tem quantidade aprovada, entrada no estoque ignorada', NEW.id;
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
  -- Usar approved_quantity para garantir que apenas itens aprovados entrem
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
    v_approved_qty, -- Usar approved_quantity
    v_part.quantity,
    v_part.quantity + v_approved_qty, -- Atualizar com quantidade aprovada
    NEW.unit_cost,
    NULL, -- Não vincula com ordem de serviço, apenas com PO
    'Recebimento de compra - PO: ' || v_po.po_number || ' | Recebimento: ' || v_receipt.receipt_number,
    CASE 
      WHEN NEW.has_divergence THEN 
        'Recebido com divergência: ' || COALESCE(NEW.divergence_reason, 'Não especificada') ||
        CASE 
          WHEN NEW.rejected_quantity > 0 THEN 
            ' | Rejeitados: ' || NEW.rejected_quantity || ' unidade(s)'
          ELSE ''
        END
      WHEN NEW.rejected_quantity > 0 THEN
        'Recebimento parcial: ' || NEW.rejected_quantity || ' unidade(s) rejeitada(s)'
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
      'quality_status', NEW.quality_status,
      'received_quantity', NEW.received_quantity,
      'approved_quantity', NEW.approved_quantity,
      'rejected_quantity', NEW.rejected_quantity,
      'is_partial_receipt', (NEW.received_quantity != NEW.approved_quantity OR NEW.rejected_quantity > 0)
    )
  );
  
  RAISE NOTICE 'Entrada no estoque criada para peça % (quantidade aprovada: %, recebida: %, rejeitada: %)', 
    v_part.part_name, v_approved_qty, NEW.received_quantity, COALESCE(NEW.rejected_quantity, 0);
  
  RETURN NEW;
END;
$$;

-- Atualizar comentário da função
COMMENT ON FUNCTION public.create_inventory_entry_on_receipt() IS 
'Cria automaticamente uma movimentação de entrada no estoque quando um item é recebido no recebimento de compra (parcial ou completo). Apenas processa itens com part_id definido, qualidade aprovada e usa approved_quantity para atualizar o estoque.';

