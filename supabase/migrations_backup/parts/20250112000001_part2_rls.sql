-- =====================================================
-- PARTE 2/3: RLS POLICIES
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

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.inventory_counts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_count_items TO authenticated;

