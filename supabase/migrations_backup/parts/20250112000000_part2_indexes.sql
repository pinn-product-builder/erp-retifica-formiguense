-- =====================================================
-- PARTE 2/4: ÍNDICES E PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_inventory_movements_org_id 
  ON public.inventory_movements(org_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_part_id 
  ON public.inventory_movements(part_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at 
  ON public.inventory_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_type 
  ON public.inventory_movements(movement_type);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_order_id 
  ON public.inventory_movements(order_id) 
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_budget_id 
  ON public.inventory_movements(budget_id) 
  WHERE budget_id IS NOT NULL;

