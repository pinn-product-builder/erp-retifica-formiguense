-- =====================================================
-- PARTE 3/4: RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Visualizar movimentações da própria organização
CREATE POLICY "Users can view movements from their org"
  ON public.inventory_movements 
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Policy: Criar movimentações na própria organização
CREATE POLICY "Users can create movements in their org"
  ON public.inventory_movements 
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

-- Grants
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;

