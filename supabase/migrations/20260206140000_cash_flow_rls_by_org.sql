DROP POLICY IF EXISTS "Users can manage cash flow for their organization" ON public.cash_flow;
DROP POLICY IF EXISTS "Authenticated users can view cash flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Authenticated users can manage cash flow" ON public.cash_flow;

CREATE POLICY "Users can select cash flow for their organization"
ON public.cash_flow FOR SELECT
TO authenticated
USING (org_id = current_org_id());

CREATE POLICY "Users can insert cash flow for their organization"
ON public.cash_flow FOR INSERT
TO authenticated
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update cash flow for their organization"
ON public.cash_flow FOR UPDATE
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete cash flow for their organization"
ON public.cash_flow FOR DELETE
TO authenticated
USING (org_id = current_org_id());
