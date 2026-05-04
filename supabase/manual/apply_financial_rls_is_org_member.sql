-- Complemento após organization_groups: RLS financeiro com is_org_member para .in('org_id', ...).
-- Rodar no SQL Editor depois de apply_organization_groups.sql (se as migrations não foram aplicadas).

-- Idempotência: remove policies novas antes de recriar
DROP POLICY IF EXISTS "org_member_all_cash_flow" ON public.cash_flow;
DROP POLICY IF EXISTS "org_member_all_bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "org_member_all_accounts_payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "org_member_all_accounts_receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "org_member_all_monthly_dre" ON public.monthly_dre;
DROP POLICY IF EXISTS "org_member_expense_categories_select" ON public.expense_categories;
DROP POLICY IF EXISTS "org_member_expense_categories_insert" ON public.expense_categories;
DROP POLICY IF EXISTS "org_member_expense_categories_update" ON public.expense_categories;
DROP POLICY IF EXISTS "org_member_expense_categories_delete" ON public.expense_categories;

-- ========== cash_flow ==========
DROP POLICY IF EXISTS "Users can select cash flow for their organization" ON public.cash_flow;
DROP POLICY IF EXISTS "Users can insert cash flow for their organization" ON public.cash_flow;
DROP POLICY IF EXISTS "Users can update cash flow for their organization" ON public.cash_flow;
DROP POLICY IF EXISTS "Users can delete cash flow for their organization" ON public.cash_flow;

CREATE POLICY "org_member_all_cash_flow"
  ON public.cash_flow
  FOR ALL
  TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

-- ========== bank_accounts ==========
DROP POLICY IF EXISTS "Users can manage bank accounts for their organization" ON public.bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can view bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can manage bank accounts" ON public.bank_accounts;

CREATE POLICY "org_member_all_bank_accounts"
  ON public.bank_accounts
  FOR ALL
  TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

-- ========== accounts_payable ==========
DROP POLICY IF EXISTS "Users can manage accounts payable for their organization" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can view accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can manage accounts payable" ON public.accounts_payable;

CREATE POLICY "org_member_all_accounts_payable"
  ON public.accounts_payable
  FOR ALL
  TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

-- ========== accounts_receivable ==========
DROP POLICY IF EXISTS "Users can manage accounts receivable for their organization" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Users can manage accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can view accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can manage accounts receivable" ON public.accounts_receivable;

CREATE POLICY "org_member_all_accounts_receivable"
  ON public.accounts_receivable
  FOR ALL
  TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

-- ========== monthly_dre ==========
DROP POLICY IF EXISTS "Authenticated users can view monthly DRE" ON public.monthly_dre;
DROP POLICY IF EXISTS "Authenticated users can manage monthly DRE" ON public.monthly_dre;

CREATE POLICY "org_member_all_monthly_dre"
  ON public.monthly_dre
  FOR ALL
  TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

-- ========== expense_categories (org_id pode ser NULL = catálogo compartilhado legado) ==========
DROP POLICY IF EXISTS "Users can insert expense categories for their organization" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update expense categories for their organization" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete expense categories for their organization" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can view expense categories for their organization" ON public.expense_categories;
DROP POLICY IF EXISTS "Admins can manage expense categories for their organization" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can view expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can manage expense categories" ON public.expense_categories;

CREATE POLICY "org_member_expense_categories_select"
  ON public.expense_categories
  FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR org_id IS NULL
    OR public.is_org_member(org_id)
  );

CREATE POLICY "org_member_expense_categories_insert"
  ON public.expense_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
  );

CREATE POLICY "org_member_expense_categories_update"
  ON public.expense_categories
  FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
    OR (org_id IS NULL AND public.is_super_admin())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
    OR (org_id IS NULL AND public.is_super_admin())
  );

CREATE POLICY "org_member_expense_categories_delete"
  ON public.expense_categories
  FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
  );
