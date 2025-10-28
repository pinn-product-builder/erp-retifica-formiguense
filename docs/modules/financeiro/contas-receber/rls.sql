-- =====================================================
-- MÓDULO: Financeiro - Contas a Receber
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- =====================================================
-- RECEIPT_HISTORY
-- =====================================================

ALTER TABLE public.receipt_history ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT
CREATE POLICY "Users can view receipt history from their org"
  ON public.receipt_history
  FOR SELECT
  USING (
    receivable_account_id IN (
      SELECT ar.id
      FROM public.accounts_receivable ar
      INNER JOIN public.organization_users ou ON ou.organization_id = ar.org_id
      WHERE ou.user_id = auth.uid()
        AND ou.is_active = true
    )
  );

-- Policy: INSERT (via função)
CREATE POLICY "System can insert receipt history"
  ON public.receipt_history
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- CUSTOMER_CREDIT_LIMITS
-- =====================================================

ALTER TABLE public.customer_credit_limits ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT
CREATE POLICY "Users can view credit limits from their org"
  ON public.customer_credit_limits
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Policy: INSERT
CREATE POLICY "Admins can create credit limits"
  ON public.customer_credit_limits
  FOR INSERT
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

-- Policy: UPDATE
CREATE POLICY "Admins can update credit limits"
  ON public.customer_credit_limits
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
  );

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON public.receipt_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customer_credit_limits TO authenticated;

-- Grants para funções
GRANT EXECUTE ON FUNCTION public.register_receipt TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_late_fee TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_overdue_receivable_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_overdue_customers TO authenticated;
