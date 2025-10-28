-- =====================================================
-- MÓDULO: Financeiro - Contas a Pagar
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- =====================================================
-- PAYABLE_ACCOUNTS
-- =====================================================

ALTER TABLE public.payable_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Ver contas da própria organização
CREATE POLICY "Users can view payable accounts from their org"
  ON public.payable_accounts
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Policy: INSERT - Criar contas na própria organização
CREATE POLICY "Users can create payable accounts in their org"
  ON public.payable_accounts
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

-- Policy: UPDATE - Editar contas da própria organização
-- Permite apenas admins e managers editarem
CREATE POLICY "Admins and managers can update payable accounts"
  ON public.payable_accounts
  FOR UPDATE
  USING (
    org_id IN (
      SELECT ou.organization_id 
      FROM public.organization_users ou
      INNER JOIN public.profiles p ON p.user_id = ou.user_id
      WHERE ou.user_id = auth.uid() 
        AND ou.is_active = true
        AND p.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT ou.organization_id 
      FROM public.organization_users ou
      INNER JOIN public.profiles p ON p.user_id = ou.user_id
      WHERE ou.user_id = auth.uid() 
        AND ou.is_active = true
        AND p.role IN ('admin', 'manager')
    )
  );

-- Policy: DELETE - Excluir contas (apenas admin)
CREATE POLICY "Only admins can delete payable accounts"
  ON public.payable_accounts
  FOR DELETE
  USING (
    org_id IN (
      SELECT ou.organization_id 
      FROM public.organization_users ou
      INNER JOIN public.profiles p ON p.user_id = ou.user_id
      WHERE ou.user_id = auth.uid() 
        AND ou.is_active = true
        AND p.role = 'admin'
    )
  );

-- =====================================================
-- PAYMENT_HISTORY
-- =====================================================

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Ver histórico de pagamentos da org
CREATE POLICY "Users can view payment history from their org"
  ON public.payment_history
  FOR SELECT
  USING (
    payable_account_id IN (
      SELECT pa.id
      FROM public.payable_accounts pa
      INNER JOIN public.organization_users ou ON ou.organization_id = pa.org_id
      WHERE ou.user_id = auth.uid()
        AND ou.is_active = true
    )
  );

-- Policy: INSERT - Criar histórico (automático via função)
CREATE POLICY "System can insert payment history"
  ON public.payment_history
  FOR INSERT
  WITH CHECK (true); -- Controlado pela função register_payment

-- =====================================================
-- EXPENSE_CATEGORIES
-- =====================================================

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Ver categorias da própria org
CREATE POLICY "Users can view expense categories from their org"
  ON public.expense_categories
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Policy: INSERT - Criar categorias (apenas admins)
CREATE POLICY "Admins can create expense categories"
  ON public.expense_categories
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT ou.organization_id 
      FROM public.organization_users ou
      INNER JOIN public.profiles p ON p.user_id = ou.user_id
      WHERE ou.user_id = auth.uid() 
        AND ou.is_active = true
        AND p.role = 'admin'
    )
  );

-- Policy: UPDATE - Editar categorias (apenas admins)
CREATE POLICY "Admins can update expense categories"
  ON public.expense_categories
  FOR UPDATE
  USING (
    org_id IN (
      SELECT ou.organization_id 
      FROM public.organization_users ou
      INNER JOIN public.profiles p ON p.user_id = ou.user_id
      WHERE ou.user_id = auth.uid() 
        AND ou.is_active = true
        AND p.role = 'admin'
    )
  );

-- Policy: DELETE - Soft delete apenas (desativar via UPDATE)

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.payable_accounts TO authenticated;
GRANT SELECT ON public.payment_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.expense_categories TO authenticated;

-- Grants para as funções
GRANT EXECUTE ON FUNCTION public.register_payment TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_payable_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payables_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_overdue_payable_accounts TO authenticated;
