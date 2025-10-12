-- =====================================================
-- PARTE 3/3: FUNCTIONS E TRIGGERS
-- =====================================================

-- Função genérica para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Função para gerar número do inventário
CREATE OR REPLACE FUNCTION public.generate_inventory_count_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_count_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(count_number FROM 'INV-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM inventory_counts
  WHERE org_id = p_org_id
    AND count_number LIKE 'INV-' || v_year || '-%';
  
  v_count_number := 'INV-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_count_number;
END;
$$;

-- Função para processar ajustes após contagem
CREATE OR REPLACE FUNCTION public.process_inventory_count_adjustments(p_count_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_count_number TEXT;
  v_counted_by UUID;
  v_item RECORD;
  v_count_status TEXT;
  v_adjustment_count INTEGER := 0;
BEGIN
  -- Buscar informações da contagem
  SELECT org_id, count_number, counted_by, status
  INTO v_org_id, v_count_number, v_counted_by, v_count_status
  FROM inventory_counts
  WHERE id = p_count_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contagem não encontrada';
  END IF;
  
  IF v_count_status = 'completed' THEN
    RAISE EXCEPTION 'Contagem já foi processada anteriormente';
  END IF;
  
  IF v_count_status != 'in_progress' THEN
    RAISE EXCEPTION 'Apenas contagens em andamento podem ser processadas';
  END IF;
  
  -- Para cada item com diferença
  FOR v_item IN 
    SELECT 
      ici.*,
      pi.part_code,
      pi.part_name
    FROM inventory_count_items ici
    INNER JOIN parts_inventory pi ON pi.id = ici.part_id
    WHERE ici.count_id = p_count_id
      AND ici.counted_quantity IS NOT NULL
      AND ici.difference != 0
  LOOP
    INSERT INTO inventory_movements (
      org_id,
      part_id,
      movement_type,
      quantity,
      previous_quantity,
      new_quantity,
      unit_cost,
      reason,
      notes,
      created_by,
      metadata
    ) VALUES (
      v_org_id,
      v_item.part_id,
      'ajuste',
      ABS(v_item.difference),
      v_item.expected_quantity,
      v_item.counted_quantity,
      v_item.unit_cost,
      'Ajuste de inventário #' || v_count_number,
      CASE 
        WHEN v_item.notes IS NOT NULL THEN 
          'Contagem física - ' || v_item.notes
        ELSE 
          'Contagem física - Divergência: ' || v_item.difference
      END,
      COALESCE(v_item.counted_by, v_counted_by),
      jsonb_build_object(
        'count_id', p_count_id,
        'count_number', v_count_number,
        'adjustment_type', CASE 
          WHEN v_item.difference > 0 THEN 'increase' 
          ELSE 'decrease' 
        END,
        'expected_quantity', v_item.expected_quantity,
        'counted_quantity', v_item.counted_quantity,
        'difference', v_item.difference
      )
    );
    
    v_adjustment_count := v_adjustment_count + 1;
  END LOOP;
  
  -- Atualizar status da contagem para concluída
  UPDATE inventory_counts
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_count_id;
  
  RAISE NOTICE 'Processamento concluído: % ajustes criados', v_adjustment_count;
END;
$$;

-- Trigger para updated_at
CREATE TRIGGER update_inventory_counts_updated_at
  BEFORE UPDATE ON public.inventory_counts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

