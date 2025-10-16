-- =====================================================
-- PARTE 1/4: TABELA inventory_movements
-- =====================================================
-- Criação da tabela principal de movimentações

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts_inventory(id) ON DELETE CASCADE,
  
  -- Tipo de movimentação
  movement_type TEXT NOT NULL CHECK (
    movement_type IN ('entrada', 'saida', 'ajuste', 'transferencia', 'reserva', 'baixa')
  ),
  
  -- Quantidades
  quantity INTEGER NOT NULL CHECK (quantity != 0),
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  
  -- Custo (opcional, usado em entradas)
  unit_cost DECIMAL(10,2),
  
  -- Vínculos com outras entidades
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  budget_id UUID REFERENCES public.detailed_budgets(id) ON DELETE SET NULL,
  
  -- Justificativa e observações
  reason TEXT NOT NULL,
  notes TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadados adicionais (JSON para flexibilidade futura)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Comentários
COMMENT ON TABLE public.inventory_movements IS 
'Registra todas as movimentações de estoque (entradas, saídas, ajustes, etc.) com auditoria completa.';

COMMENT ON COLUMN public.inventory_movements.movement_type IS 
'Tipo: entrada (recebimento), saida (venda/uso), ajuste (correção), transferencia (entre locais), reserva (bloqueio), baixa (descarte)';

