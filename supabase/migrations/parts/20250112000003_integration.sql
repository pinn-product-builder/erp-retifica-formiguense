-- =====================================================
-- INTEGRAÇÃO: Recebimento → Estoque
-- =====================================================

-- Adicionar part_id em purchase_order_items
ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS part_id UUID REFERENCES public.parts_inventory(id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_part_id 
  ON public.purchase_order_items(part_id)
  WHERE part_id IS NOT NULL;

COMMENT ON COLUMN public.purchase_order_items.part_id IS 
'Vinculação com peça do estoque. Permite entrada automática ao receber o pedido.';

-- Função para criar entrada no estoque ao receber
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
  SELECT * INTO v_receipt
  FROM purchase_receipts
  WHERE id = NEW.receipt_id;
  
  SELECT * INTO v_po
  FROM purchase_orders
  WHERE id = v_receipt.purchase_order_id;
  
  IF NEW.part_id IS NULL THEN
    RAISE NOTICE 'Item % não tem part_id, entrada no estoque ignorada', NEW.id;
    RETURN NEW;
  END IF;
  
  IF NEW.quality_status != 'approved' THEN
    RAISE NOTICE 'Item % com qualidade não aprovada, entrada no estoque ignorada', NEW.id;
    RETURN NEW;
  END IF;
  
  SELECT * INTO v_part
  FROM parts_inventory
  WHERE id = NEW.part_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Peça % não encontrada no estoque', NEW.part_id;
    RETURN NEW;
  END IF;
  
  SELECT received_by INTO v_user_id
  FROM purchase_receipts
  WHERE id = NEW.receipt_id;
  
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
    NULL,
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
  
  RAISE NOTICE 'Entrada no estoque criada para peça %', v_part.part_name;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_create_inventory_entry ON public.purchase_receipt_items;
CREATE TRIGGER trigger_create_inventory_entry
  AFTER INSERT ON public.purchase_receipt_items
  FOR EACH ROW
  WHEN (NEW.part_id IS NOT NULL AND NEW.quality_status = 'approved')
  EXECUTE FUNCTION public.create_inventory_entry_on_receipt();

COMMENT ON FUNCTION public.create_inventory_entry_on_receipt() IS 
'Cria automaticamente uma movimentação de entrada no estoque quando um item é recebido. Apenas processa itens com part_id definido e qualidade aprovada.';

