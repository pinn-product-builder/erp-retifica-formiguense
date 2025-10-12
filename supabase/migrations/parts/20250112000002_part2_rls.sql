-- =====================================================
-- PARTE 2/3: RLS POLICIES
-- =====================================================

ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipt_items ENABLE ROW LEVEL SECURITY;

-- Policies para purchase_receipts
CREATE POLICY "Users can view receipts from their org"
  ON public.purchase_receipts 
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY "Users can create receipts in their org"
  ON public.purchase_receipts 
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

CREATE POLICY "Users can update receipts in their org"
  ON public.purchase_receipts 
  FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Policies para purchase_receipt_items
CREATE POLICY "Users can view receipt items from their org"
  ON public.purchase_receipt_items 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchase_receipts 
      WHERE id = receipt_id 
        AND org_id IN (
          SELECT organization_id 
          FROM public.organization_users 
          WHERE user_id = auth.uid() 
            AND is_active = true
        )
    )
  );

CREATE POLICY "Users can manage receipt items in their org"
  ON public.purchase_receipt_items 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM purchase_receipts 
      WHERE id = receipt_id 
        AND org_id IN (
          SELECT organization_id 
          FROM public.organization_users 
          WHERE user_id = auth.uid() 
            AND is_active = true
        )
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.purchase_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_receipt_items TO authenticated;

