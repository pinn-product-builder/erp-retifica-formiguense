-- =====================================================
-- FASE 2: SISTEMA DE INVENTÁRIO FÍSICO E CONTAGEM
-- =====================================================
-- Implementação do sistema de contagem física de inventário
-- conforme documentado em proj_docs/modules/inventory/implementation-plan.md
--
-- Criado: 2025-01-12
-- Autor: Sistema ERP Retifica Formiguense
-- =====================================================

-- =====================================================
-- 1. TABELA: inventory_counts (Cabeçalho da Contagem)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.inventory_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Identificação da contagem
  count_number TEXT NOT NULL,
  count_date DATE NOT NULL,
  
  -- Status do processo
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'in_progress', 'completed', 'cancelled')
  ),
  
  -- Responsáveis
  counted_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  
  -- Observações
  notes TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint de unicidade
  CONSTRAINT unique_count_number_per_org UNIQUE (org_id, count_number)
);

-- =====================================================
-- 2. TABELA: inventory_count_items (Itens Contados)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.inventory_count_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  count_id UUID NOT NULL REFERENCES public.inventory_counts(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts_inventory(id) ON DELETE CASCADE,
  
  -- Quantidades
  expected_quantity INTEGER NOT NULL, -- Quantidade no sistema
  counted_quantity INTEGER, -- Quantidade contada fisicamente (NULL = ainda não contado)
  
  -- Diferença calculada automaticamente
  difference INTEGER GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
  
  -- Custo para cálculo de impacto financeiro
  unit_cost DECIMAL(10,2),
  
  -- Observações da contagem
  notes TEXT,
  
  -- Responsável pela contagem deste item
  counted_by UUID REFERENCES auth.users(id),
  counted_at TIMESTAMPTZ,
  
  -- Constraint de unicidade (uma peça por contagem)
  CONSTRAINT unique_part_per_count UNIQUE (count_id, part_id)
);

-- =====================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_inventory_counts_org_id 
  ON public.inventory_counts(org_id);

CREATE INDEX IF NOT EXISTS idx_inventory_counts_status 
  ON public.inventory_counts(status);

CREATE INDEX IF NOT EXISTS idx_inventory_counts_count_date 
  ON public.inventory_counts(count_date DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_count_items_count_id 
  ON public.inventory_count_items(count_id);

CREATE INDEX IF NOT EXISTS idx_inventory_count_items_part_id 
  ON public.inventory_count_items(part_id);

-- =====================================================
-- 4. RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;

-- Policies para inventory_counts
CREATE POLICY "Users can view counts from their org"
  ON public.inventory_counts 
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY "Users can create counts in their org"
  ON public.inventory_counts 
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update counts in their org"
  ON public.inventory_counts 
  FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Policies para inventory_count_items
CREATE POLICY "Users can view count items from their org"
  ON public.inventory_count_items 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inventory_counts 
      WHERE id = count_id 
        AND org_id IN (
          SELECT organization_id 
          FROM public.organization_users 
          WHERE user_id = auth.uid() 
            AND is_active = true
        )
    )
  );

CREATE POLICY "Users can manage count items in their org"
  ON public.inventory_count_items 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM inventory_counts 
      WHERE id = count_id 
        AND org_id IN (
          SELECT organization_id 
          FROM public.organization_users 
          WHERE user_id = auth.uid() 
            AND is_active = true
        )
    )
  );

-- =====================================================
-- 5. FUNCTION: Gerar número do inventário
-- =====================================================
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
  -- Ano atual
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Buscar o próximo número sequencial para este ano
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(count_number FROM 'INV-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM inventory_counts
  WHERE org_id = p_org_id
    AND count_number LIKE 'INV-' || v_year || '-%';
  
  -- Gerar número no formato INV-2025-0001
  v_count_number := 'INV-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_count_number;
END;
$$;

-- =====================================================
-- 6. FUNCTION: Processar ajustes após contagem
-- =====================================================
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
  v_adjustment_count INTEGER := 0;
BEGIN
  -- Buscar informações da contagem
  SELECT org_id, count_number, counted_by, status
  INTO v_org_id, v_count_number, v_counted_by, v_item
  FROM inventory_counts
  WHERE id = p_count_id;
  
  -- Validar se a contagem existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contagem não encontrada';
  END IF;
  
  -- Validar se a contagem já foi processada
  IF v_item.status = 'completed' THEN
    RAISE EXCEPTION 'Contagem já foi processada anteriormente';
  END IF;
  
  -- Validar se a contagem está em andamento
  IF v_item.status != 'in_progress' THEN
    RAISE EXCEPTION 'Apenas contagens em andamento podem ser processadas';
  END IF;
  
  -- Para cada item com diferença (contado != esperado)
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
    -- Criar movimentação de ajuste
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
  
  -- Log do processo
  RAISE NOTICE 'Processamento concluído: % ajustes criados para contagem %', 
    v_adjustment_count, v_count_number;
END;
$$;

-- =====================================================
-- 7. TRIGGER: Atualizar updated_at
-- =====================================================
-- Criar função genérica se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_inventory_counts_updated_at
  BEFORE UPDATE ON public.inventory_counts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================
COMMENT ON TABLE public.inventory_counts IS 
'Cabeçalho das contagens físicas de inventário. Status: draft (rascunho), in_progress (em andamento), completed (concluída), cancelled (cancelada).';

COMMENT ON TABLE public.inventory_count_items IS 
'Itens individuais de cada contagem física. Registra quantidade esperada vs contada, com diferença calculada automaticamente.';

COMMENT ON COLUMN public.inventory_count_items.difference IS 
'Diferença calculada automaticamente: counted_quantity - expected_quantity. Positivo = sobra, Negativo = falta.';

COMMENT ON FUNCTION public.generate_inventory_count_number(UUID) IS 
'Gera número sequencial para contagem de inventário no formato INV-YYYY-NNNN por organização e ano.';

COMMENT ON FUNCTION public.process_inventory_count_adjustments(UUID) IS 
'Processa os ajustes de uma contagem física concluída, criando movimentações de ajuste para todas as divergências encontradas.';

-- =====================================================
-- 9. GRANTS (Permissões)
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON public.inventory_counts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_count_items TO authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

