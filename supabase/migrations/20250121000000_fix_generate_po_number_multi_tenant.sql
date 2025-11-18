CREATE OR REPLACE FUNCTION generate_po_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
  new_po_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(
    MAX(SUBSTRING(po.po_number FROM 'PO-' || current_year || '-(\d+)')::INTEGER), 
    0
  ) + 1
  INTO sequence_num
  FROM purchase_orders po
  WHERE po.org_id = p_org_id
    AND po.po_number LIKE 'PO-' || current_year || '-%';
  
  new_po_number := 'PO-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_po_number;
END;
$$;

CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    IF NEW.org_id IS NOT NULL THEN
      NEW.po_number := generate_po_number(NEW.org_id);
    ELSE
      RAISE EXCEPTION 'org_id é obrigatório para gerar número do pedido';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

