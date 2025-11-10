-- Corrigir função para criar peça automaticamente se não existir
-- Garantir que recebimentos sempre criem a peça no estoque quando necessário

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
  v_part_id UUID;
  v_po_item RECORD;
  v_new_part_id UUID;
  v_extracted_code TEXT;
BEGIN
  -- Buscar informações do recebimento
  SELECT * INTO v_receipt
  FROM purchase_receipts
  WHERE id = NEW.receipt_id;
  
  -- Buscar informações do pedido de compra
  SELECT * INTO v_po
  FROM purchase_orders
  WHERE id = v_receipt.purchase_order_id;
  
  -- Buscar informações do item do pedido
  SELECT * INTO v_po_item
  FROM purchase_order_items
  WHERE id = NEW.purchase_order_item_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Item do pedido % não encontrado', NEW.purchase_order_item_id;
    RETURN NEW;
  END IF;
  
  -- Se part_id não está definido, tentar buscar do purchase_order_item
  v_part_id := NEW.part_id;
  
  IF v_part_id IS NULL THEN
    SELECT part_id INTO v_part_id
    FROM purchase_order_items
    WHERE id = NEW.purchase_order_item_id;
  END IF;
  
  -- Se ainda não tem part_id, tentar buscar pela correspondência de nome
  IF v_part_id IS NULL THEN
    SELECT pi.id INTO v_part_id
    FROM purchase_order_items poi
    JOIN parts_inventory pi ON (
      poi.item_name ILIKE '%' || pi.part_code || '%'
      OR poi.item_name ILIKE '%' || pi.part_name || '%'
      OR pi.part_name ILIKE '%' || poi.item_name || '%'
    )
    WHERE poi.id = NEW.purchase_order_item_id
      AND pi.org_id = v_receipt.org_id
    LIMIT 1;
    
    -- Se encontrou, atualizar o purchase_order_item e o receipt_item
    IF v_part_id IS NOT NULL THEN
      -- Atualizar purchase_order_item para ter o part_id
      UPDATE purchase_order_items
      SET part_id = v_part_id
      WHERE id = NEW.purchase_order_item_id;
      
      -- Atualizar receipt_item para ter o part_id
      UPDATE purchase_receipt_items
      SET part_id = v_part_id
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  -- Se ainda não tem part_id, criar nova peça no estoque
  IF v_part_id IS NULL THEN
    -- Tentar extrair código do nome (ex: "Rolamento SKF 6203" -> "SKF 6203")
    v_extracted_code := NULL;
    IF v_po_item.item_name ~ '[0-9A-Z]' THEN
      v_extracted_code := regexp_replace(v_po_item.item_name, '^[^0-9A-Z]*([0-9A-Z][^ ]*).*$', '\1', 'g');
    END IF;
    
    -- Criar nova peça no estoque
    INSERT INTO parts_inventory (
      org_id,
      part_name,
      part_code,
      quantity,
      unit_cost,
      supplier,
      status,
      notes,
      created_at
    ) VALUES (
      v_receipt.org_id,
      v_po_item.item_name, -- Usar nome do item como nome da peça
      v_extracted_code, -- Código extraído ou NULL
      0, -- Quantidade inicial será 0, será atualizada pela movimentação
      COALESCE(NEW.unit_cost, v_po_item.unit_price, 0),
      (SELECT name FROM suppliers WHERE id = v_po.supplier_id),
      'disponivel',
      'Criada automaticamente no recebimento ' || v_receipt.receipt_number || ' - PO: ' || v_po.po_number,
      NOW()
    )
    RETURNING id INTO v_new_part_id;
    
    v_part_id := v_new_part_id;
    
    -- Atualizar purchase_order_item para ter o part_id
    UPDATE purchase_order_items
    SET part_id = v_part_id
    WHERE id = NEW.purchase_order_item_id;
    
    -- Atualizar receipt_item para ter o part_id
    UPDATE purchase_receipt_items
    SET part_id = v_part_id
    WHERE id = NEW.id;
    
    RAISE NOTICE 'Nova peça criada automaticamente: % (ID: %)', v_po_item.item_name, v_part_id;
  END IF;
  
  -- Apenas processar se a qualidade foi aprovada
  IF NEW.quality_status != 'approved' THEN
    RAISE NOTICE 'Item % com qualidade não aprovada (status: %), entrada no estoque ignorada', 
      NEW.id, NEW.quality_status;
    RETURN NEW;
  END IF;
  
  -- Buscar informações da peça
  SELECT * INTO v_part
  FROM parts_inventory
  WHERE id = v_part_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Peça % não encontrada no estoque após criação', v_part_id;
  END IF;
  
  -- Buscar usuário que recebeu
  SELECT received_by INTO v_user_id
  FROM purchase_receipts
  WHERE id = NEW.receipt_id;
  
  -- Usar approved_quantity em vez de received_quantity
  -- Apenas itens aprovados devem entrar no estoque
  v_approved_qty := COALESCE(NEW.approved_quantity, 0);
  
  -- Se não há quantidade aprovada, não criar movimentação
  IF v_approved_qty <= 0 THEN
    RAISE NOTICE 'Item % não tem quantidade aprovada, entrada no estoque ignorada', NEW.id;
    RETURN NEW;
  END IF;
  
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
    v_part_id, -- Usar o part_id encontrado ou criado
    'entrada',
    v_approved_qty, -- Usar approved_quantity
    v_part.quantity,
    v_part.quantity + v_approved_qty, -- Atualizar com quantidade aprovada
    COALESCE(NEW.unit_cost, v_po_item.unit_price, 0),
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
      'is_partial_receipt', (NEW.received_quantity != NEW.approved_quantity OR NEW.rejected_quantity > 0),
      'part_id_found', (v_part_id IS NOT NULL),
      'part_created', (v_new_part_id IS NOT NULL)
    )
  );
  
  RAISE NOTICE 'Entrada no estoque criada para peça % (quantidade aprovada: %, recebida: %, rejeitada: %)', 
    v_part.part_name, v_approved_qty, NEW.received_quantity, COALESCE(NEW.rejected_quantity, 0);
  
  RETURN NEW;
END;
$$;

-- Atualizar comentário da função
COMMENT ON FUNCTION public.create_inventory_entry_on_receipt() IS 
'Cria automaticamente uma movimentação de entrada no estoque quando um item é recebido no recebimento de compra (parcial ou completo). Busca part_id automaticamente se não estiver definido. Se a peça não existir, cria automaticamente no estoque. Apenas processa itens com qualidade aprovada e usa approved_quantity para atualizar o estoque.';

