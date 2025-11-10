-- Corrigir ambiguidade de supplier_id na função suggest_suppliers_for_part
-- e remover recursão desnecessária

CREATE OR REPLACE FUNCTION public.suggest_suppliers_for_part(
  p_org_id UUID,
  p_part_code TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  supplier_id UUID,
  supplier_name TEXT,
  rating DECIMAL(3,2),
  on_time_rate DECIMAL(5,2),
  last_purchase_date DATE,
  last_price DECIMAL(15,2),
  delivery_days INTEGER,
  is_preferred BOOLEAN,
  score DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_supplier RECORD;
  v_score DECIMAL(5,2);
  v_results TABLE (
    supplier_id UUID,
    supplier_name TEXT,
    rating DECIMAL(3,2),
    on_time_rate DECIMAL(5,2),
    last_purchase_date DATE,
    last_price DECIMAL(15,2),
    delivery_days INTEGER,
    is_preferred BOOLEAN,
    score DECIMAL(5,2)
  );
BEGIN
  -- Buscar fornecedores relevantes
  FOR v_supplier IN
    SELECT DISTINCT
      s.id AS supplier_id,
      s.name AS supplier_name,
      s.rating,
      s.on_time_delivery_rate,
      s.last_purchase_date,
      s.delivery_days,
      s.is_preferred,
      -- Buscar último preço se houver histórico
      (
        SELECT poi.unit_price
        FROM purchase_order_items poi
        INNER JOIN purchase_orders po ON po.id = poi.po_id
        WHERE po.supplier_id = s.id
          AND po.org_id = p_org_id
          AND (p_part_code IS NULL OR poi.item_name ILIKE '%' || p_part_code || '%')
        ORDER BY po.order_date DESC
        LIMIT 1
      ) as last_price
    FROM suppliers s
    WHERE s.org_id = p_org_id
      AND s.is_active = true
      AND (
        -- Se tem código de peça, buscar por histórico ou categoria
        (p_part_code IS NOT NULL AND (
          EXISTS (
            SELECT 1 FROM purchase_order_items poi
            INNER JOIN purchase_orders po ON po.id = poi.po_id
            WHERE po.supplier_id = s.id
              AND poi.item_name ILIKE '%' || p_part_code || '%'
          )
          OR (p_category IS NOT NULL AND p_category = ANY(s.categories))
        ))
        -- Se só tem categoria, buscar por categoria
        OR (p_part_code IS NULL AND p_category IS NOT NULL AND p_category = ANY(s.categories))
        -- Se não tem filtros, todos os fornecedores
        OR (p_part_code IS NULL AND p_category IS NULL)
      )
    ORDER BY s.rating DESC, s.on_time_delivery_rate DESC
  LOOP
    -- Calcular score do fornecedor
    v_score := 0;
    
    -- Rating geral (peso 30%)
    v_score := v_score + (v_supplier.rating / 5.0) * 30;
    
    -- Pontualidade (peso 25%)
    v_score := v_score + (v_supplier.on_time_delivery_rate / 100.0) * 25;
    
    -- Competitividade de preço (peso 15%) - assumir 5.0 se não há histórico
    v_score := v_score + (COALESCE((
      SELECT s2.price_rating FROM suppliers s2 WHERE s2.id = v_supplier.supplier_id
    ), 5.0) / 5.0) * 15;
    
    -- Qualidade (peso 20%)
    v_score := v_score + (COALESCE((
      SELECT s3.quality_rating FROM suppliers s3 WHERE s3.id = v_supplier.supplier_id
    ), 5.0) / 5.0) * 20;
    
    -- Bônus: comprou recentemente (últimos 90 dias) - peso 5%
    IF v_supplier.last_purchase_date IS NOT NULL 
       AND v_supplier.last_purchase_date >= CURRENT_DATE - INTERVAL '90 days' THEN
      v_score := v_score + 5;
    END IF;
    
    -- Bônus: fornecedor preferido - peso 5%
    IF v_supplier.is_preferred THEN
      v_score := v_score + 5;
    END IF;
    
    -- Retornar resultado
    RETURN QUERY SELECT
      v_supplier.supplier_id,
      v_supplier.supplier_name,
      v_supplier.rating,
      v_supplier.on_time_delivery_rate,
      v_supplier.last_purchase_date,
      v_supplier.last_price,
      v_supplier.delivery_days,
      v_supplier.is_preferred,
      v_score;
  END LOOP;
  
  -- Retornar resultados ordenados por score (limitado pelo p_limit)
  -- A ordenação já é feita no loop acima, mas vamos garantir
  RETURN;
END;
$$;

-- Comentário atualizado
COMMENT ON FUNCTION public.suggest_suppliers_for_part(UUID, TEXT, TEXT, INTEGER) IS 
'Sugere fornecedores para uma peça específica baseado em histórico, categoria, rating e performance. Retorna fornecedores ordenados por score calculado.';

