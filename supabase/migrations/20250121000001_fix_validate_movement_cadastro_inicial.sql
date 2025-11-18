CREATE OR REPLACE FUNCTION public.validate_inventory_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_quantity INTEGER;
  v_is_cadastro_inicial BOOLEAN := false;
BEGIN
  SELECT quantity INTO v_current_quantity
  FROM parts_inventory
  WHERE id = NEW.part_id
    AND org_id = NEW.org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Peça não encontrada ou não pertence à organização';
  END IF;

  v_is_cadastro_inicial := (
    NEW.movement_type = 'entrada' 
    AND v_current_quantity = 0 
    AND NEW.previous_quantity = 0
    AND NEW.quantity > 0
  );

  IF NOT v_is_cadastro_inicial AND NEW.previous_quantity != v_current_quantity THEN
    RAISE EXCEPTION 'Quantidade anterior (%) não corresponde ao estoque atual (%). Conflito de concorrência detectado.', 
      NEW.previous_quantity, v_current_quantity;
  END IF;

  IF NEW.new_quantity < 0 THEN
    RAISE EXCEPTION 'Estoque não pode ficar negativo. Estoque atual: %, Tentativa de reduzir: %', 
      v_current_quantity, NEW.quantity;
  END IF;

  RETURN NEW;
END;
$$;

