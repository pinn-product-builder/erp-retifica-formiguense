-- =====================================================
-- PARTE 3/3: FUNCTIONS E TRIGGERS
-- =====================================================

-- Função para gerar número do recebimento
CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_receipt_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(receipt_number FROM 'REC-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM purchase_receipts
  WHERE org_id = p_org_id
    AND receipt_number LIKE 'REC-' || v_year || '-%';
  
  v_receipt_number := 'REC-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_receipt_number;
END;
$$;

-- Função para atualizar status do PO
CREATE OR REPLACE FUNCTION public.update_purchase_order_on_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_po_id UUID;
  v_total_ordered INTEGER;
  v_total_received INTEGER;
BEGIN
  SELECT purchase_order_id INTO v_po_id
  FROM purchase_receipts
  WHERE id = NEW.receipt_id;
  
  SELECT 
    SUM(poi.quantity),
    SUM(COALESCE(pri.received_quantity, 0))
  INTO v_total_ordered, v_total_received
  FROM purchase_order_items poi
  LEFT JOIN purchase_receipt_items pri ON pri.purchase_order_item_id = poi.id
  WHERE poi.po_id = v_po_id;
  
  IF v_total_received >= v_total_ordered THEN
    UPDATE purchase_orders
    SET 
      status = 'completed',
      actual_delivery = CURRENT_DATE
    WHERE id = v_po_id;
  ELSIF v_total_received > 0 THEN
    UPDATE purchase_orders
    SET status = 'partially_received'
    WHERE id = v_po_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar PO
DROP TRIGGER IF EXISTS trigger_update_po_on_receipt ON public.purchase_receipt_items;
CREATE TRIGGER trigger_update_po_on_receipt
  AFTER INSERT OR UPDATE ON public.purchase_receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_purchase_order_on_receipt();

-- Trigger para updated_at
CREATE TRIGGER update_purchase_receipts_updated_at
  BEFORE UPDATE ON public.purchase_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

