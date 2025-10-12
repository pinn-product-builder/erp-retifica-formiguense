-- =====================================================
-- PARTE 1/3: TABELAS inventory_counts
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

CREATE TABLE IF NOT EXISTS public.inventory_count_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  count_id UUID NOT NULL REFERENCES public.inventory_counts(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts_inventory(id) ON DELETE CASCADE,
  
  -- Quantidades
  expected_quantity INTEGER NOT NULL,
  counted_quantity INTEGER,
  
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

-- Índices
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

