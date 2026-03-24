DROP POLICY IF EXISTS "Admins can manage expense categories for their organization" ON public.expense_categories;

CREATE POLICY "Users can insert expense categories for their organization"
ON public.expense_categories FOR INSERT
TO authenticated
WITH CHECK (org_id IS NOT NULL AND org_id = current_org_id());

CREATE POLICY "Users can update expense categories for their organization"
ON public.expense_categories FOR UPDATE
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete expense categories for their organization"
ON public.expense_categories FOR DELETE
TO authenticated
USING (org_id = current_org_id());

UPDATE public.cash_flow cf
SET org_id = ar.org_id
FROM public.accounts_receivable ar
WHERE cf.accounts_receivable_id = ar.id AND cf.org_id IS NULL AND ar.org_id IS NOT NULL;

UPDATE public.cash_flow cf
SET org_id = ap.org_id
FROM public.accounts_payable ap
WHERE cf.accounts_payable_id = ap.id AND cf.org_id IS NULL AND ap.org_id IS NOT NULL;

UPDATE public.cash_flow cf
SET org_id = o.org_id
FROM public.orders o
WHERE cf.order_id = o.id AND cf.org_id IS NULL AND o.org_id IS NOT NULL;

UPDATE public.cash_flow cf
SET org_id = ba.org_id
FROM public.bank_accounts ba
WHERE cf.bank_account_id = ba.id AND cf.org_id IS NULL AND ba.org_id IS NOT NULL;
