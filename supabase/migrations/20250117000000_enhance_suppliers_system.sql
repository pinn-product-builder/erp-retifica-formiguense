-- =====================================================
-- MELHORIAS NO SISTEMA DE FORNECEDORES
-- =====================================================
-- Implementação das melhorias para US-009.1: Gestão de Fornecedores
-- Adiciona campos faltantes, múltiplos contatos e sistema de avaliação
--
-- Criado: 2025-01-17
-- Autor: Sistema ERP Retifica Formiguense
-- =====================================================

-- =====================================================
-- 1. ADICIONAR CAMPOS FALTANTES NA TABELA SUPPLIERS
-- =====================================================
-- Adicionar campos que estavam faltando na tabela suppliers
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS brands TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_preferred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_time_delivery_rate DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS quality_rating DECIMAL(3,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS price_rating DECIMAL(3,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS last_purchase_date DATE;

-- =====================================================
-- 2. TABELA: supplier_contacts (Múltiplos Contatos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.supplier_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Informações do contato
  name TEXT NOT NULL,
  role TEXT, -- "Vendedor", "Gerente", "Financeiro"
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  
  -- Flags
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. TABELA: supplier_evaluations (Avaliações)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.supplier_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  
  -- Avaliações (1-5)
  delivery_rating DECIMAL(3,2) NOT NULL CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  quality_rating DECIMAL(3,2) NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
  price_rating DECIMAL(3,2) NOT NULL CHECK (price_rating >= 1 AND price_rating <= 5),
  service_rating DECIMAL(3,2) NOT NULL CHECK (service_rating >= 1 AND service_rating <= 5),
  overall_rating DECIMAL(3,2) GENERATED ALWAYS AS (
    (delivery_rating + quality_rating + price_rating + service_rating) / 4
  ) STORED,
  
  -- Detalhes
  delivered_on_time BOOLEAN NOT NULL,
  had_quality_issues BOOLEAN DEFAULT false,
  comments TEXT,
  
  -- Responsável
  evaluated_by UUID REFERENCES auth.users(id),
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- =====================================================
-- Índices para supplier_contacts
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier_id 
  ON public.supplier_contacts(supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_contacts_org_id 
  ON public.supplier_contacts(org_id);

CREATE INDEX IF NOT EXISTS idx_supplier_contacts_is_primary 
  ON public.supplier_contacts(is_primary) 
  WHERE is_primary = true;

-- Índices para supplier_evaluations
CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_supplier_id 
  ON public.supplier_evaluations(supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_org_id 
  ON public.supplier_evaluations(org_id);

CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_po_id 
  ON public.supplier_evaluations(purchase_order_id) 
  WHERE purchase_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_evaluated_at 
  ON public.supplier_evaluations(evaluated_at DESC);

-- Índices adicionais para suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_categories 
  ON public.suppliers USING GIN(categories);

CREATE INDEX IF NOT EXISTS idx_suppliers_brands 
  ON public.suppliers USING GIN(brands);

CREATE INDEX IF NOT EXISTS idx_suppliers_is_preferred 
  ON public.suppliers(is_preferred) 
  WHERE is_preferred = true;

CREATE INDEX IF NOT EXISTS idx_suppliers_rating 
  ON public.suppliers(rating DESC);

-- =====================================================
-- 5. RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE public.supplier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_evaluations ENABLE ROW LEVEL SECURITY;

-- Policies para supplier_contacts
CREATE POLICY "Users can view supplier contacts from their org"
  ON public.supplier_contacts 
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY "Users can manage supplier contacts in their org"
  ON public.supplier_contacts 
  FOR ALL
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Policies para supplier_evaluations
CREATE POLICY "Users can view supplier evaluations from their org"
  ON public.supplier_evaluations 
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY "Users can create supplier evaluations in their org"
  ON public.supplier_evaluations 
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    AND evaluated_by = auth.uid()
  );

-- =====================================================
-- 6. FUNÇÃO: Recalcular rating do fornecedor
-- =====================================================
CREATE OR REPLACE FUNCTION public.recalculate_supplier_rating(p_supplier_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_avg_delivery DECIMAL(3,2);
  v_avg_quality DECIMAL(3,2);
  v_avg_price DECIMAL(3,2);
  v_avg_service DECIMAL(3,2);
  v_overall_rating DECIMAL(3,2);
  v_on_time_rate DECIMAL(5,2);
  v_total_orders INTEGER;
BEGIN
  -- Calcular médias das avaliações (últimos 12 meses)
  SELECT 
    COALESCE(AVG(delivery_rating), 5.0),
    COALESCE(AVG(quality_rating), 5.0),
    COALESCE(AVG(price_rating), 5.0),
    COALESCE(AVG(service_rating), 5.0),
    COALESCE(AVG(overall_rating), 5.0)
  INTO 
    v_avg_delivery,
    v_avg_quality,
    v_avg_price,
    v_avg_service,
    v_overall_rating
  FROM supplier_evaluations
  WHERE supplier_id = p_supplier_id
    AND evaluated_at >= NOW() - INTERVAL '12 months';
  
  -- Calcular taxa de pontualidade (últimos 12 meses)
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(
      (COUNT(*) FILTER (WHERE delivered_on_time = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      100.0
    )
  INTO v_total_orders, v_on_time_rate
  FROM supplier_evaluations
  WHERE supplier_id = p_supplier_id
    AND evaluated_at >= NOW() - INTERVAL '12 months';
  
  -- Atualizar fornecedor
  UPDATE suppliers
  SET 
    rating = v_overall_rating,
    quality_rating = v_avg_quality,
    price_rating = v_avg_price,
    on_time_delivery_rate = v_on_time_rate,
    total_orders = v_total_orders,
    updated_at = NOW()
  WHERE id = p_supplier_id;
END;
$$;

-- =====================================================
-- 7. FUNÇÃO: Sugerir fornecedores para peça
-- =====================================================
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
BEGIN
  -- Buscar fornecedores relevantes
  FOR v_supplier IN
    SELECT DISTINCT
      s.id,
      s.name,
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
      SELECT price_rating FROM suppliers WHERE id = v_supplier.id
    ), 5.0) / 5.0) * 15;
    
    -- Qualidade (peso 20%)
    v_score := v_score + (COALESCE((
      SELECT quality_rating FROM suppliers WHERE id = v_supplier.id
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
    supplier_id := v_supplier.id;
    supplier_name := v_supplier.name;
    rating := v_supplier.rating;
    on_time_rate := v_supplier.on_time_delivery_rate;
    last_purchase_date := v_supplier.last_purchase_date;
    last_price := v_supplier.last_price;
    delivery_days := v_supplier.delivery_days;
    is_preferred := v_supplier.is_preferred;
    score := v_score;
    
    RETURN NEXT;
  END LOOP;
  
  -- Ordenar por score e limitar resultados
  RETURN QUERY
  SELECT * FROM (
    SELECT DISTINCT ON (s.supplier_id)
      s.supplier_id,
      s.supplier_name,
      s.rating,
      s.on_time_rate,
      s.last_purchase_date,
      s.last_price,
      s.delivery_days,
      s.is_preferred,
      s.score
    FROM (
      SELECT 
        supplier_id,
        supplier_name,
        rating,
        on_time_rate,
        last_purchase_date,
        last_price,
        delivery_days,
        is_preferred,
        score
      FROM suggest_suppliers_for_part(p_org_id, p_part_code, p_category, p_limit)
    ) s
    ORDER BY s.supplier_id, s.score DESC
  ) ranked
  ORDER BY ranked.score DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- 8. TRIGGER: Recalcular rating após avaliação
-- =====================================================
CREATE OR REPLACE FUNCTION public.trigger_recalculate_supplier_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Recalcular rating do fornecedor
  PERFORM recalculate_supplier_rating(NEW.supplier_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_supplier_evaluation_rating
  AFTER INSERT ON public.supplier_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_supplier_rating();

-- =====================================================
-- 9. TRIGGER: Atualizar updated_at
-- =====================================================
CREATE TRIGGER update_supplier_contacts_updated_at
  BEFORE UPDATE ON public.supplier_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================
COMMENT ON TABLE public.supplier_contacts IS 
'Múltiplos contatos por fornecedor. Permite ter vendedor, gerente, financeiro, etc.';

COMMENT ON TABLE public.supplier_evaluations IS 
'Histórico de avaliações de fornecedores após recebimento de pedidos. Usado para calcular rating automático.';

COMMENT ON FUNCTION public.recalculate_supplier_rating(UUID) IS 
'Recalcula automaticamente o rating de um fornecedor baseado nas avaliações dos últimos 12 meses.';

COMMENT ON FUNCTION public.suggest_suppliers_for_part(UUID, TEXT, TEXT, INTEGER) IS 
'Sugere os melhores fornecedores para uma peça baseado em histórico, rating e algoritmo de score.';

-- =====================================================
-- 11. GRANTS (Permissões)
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_contacts TO authenticated;
GRANT SELECT, INSERT ON public.supplier_evaluations TO authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
