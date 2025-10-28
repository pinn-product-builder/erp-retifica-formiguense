-- =====================================================
-- MÓDULO: Financeiro - Contas a Pagar
-- TRIGGERS E FUNCTIONS
-- =====================================================

-- =====================================================
-- FUNCTION: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_payable_accounts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger para updated_at em payable_accounts
DROP TRIGGER IF EXISTS trigger_update_payable_accounts_updated_at ON public.payable_accounts;
CREATE TRIGGER trigger_update_payable_accounts_updated_at
  BEFORE UPDATE ON public.payable_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payable_accounts_updated_at();

-- Trigger para updated_at em expense_categories
DROP TRIGGER IF EXISTS trigger_update_expense_categories_updated_at ON public.expense_categories;
CREATE TRIGGER trigger_update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FUNCTION: Atualizar status para 'overdue'
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_overdue_payable_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.payable_accounts
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$;

COMMENT ON FUNCTION public.update_overdue_payable_accounts() IS 
'Atualiza status de contas pendentes para vencidas. Deve ser executada diariamente via cron/edge function.';

-- =====================================================
-- FUNCTION: Registrar pagamento
-- =====================================================
CREATE OR REPLACE FUNCTION public.register_payment(
  p_account_id UUID,
  p_amount_paid DECIMAL,
  p_paid_at DATE,
  p_payment_method VARCHAR,
  p_notes TEXT,
  p_registered_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_account RECORD;
  v_payment_id UUID;
  v_result JSONB;
BEGIN
  -- Buscar conta
  SELECT * INTO v_account
  FROM payable_accounts
  WHERE id = p_account_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Conta não encontrada'
    );
  END IF;
  
  IF v_account.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Conta já está paga'
    );
  END IF;
  
  IF v_account.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Conta está cancelada'
    );
  END IF;
  
  -- Iniciar transaction
  BEGIN
    -- Inserir histórico de pagamento
    INSERT INTO payment_history (
      payable_account_id,
      amount_paid,
      paid_at,
      payment_method,
      notes,
      registered_by
    ) VALUES (
      p_account_id,
      p_amount_paid,
      p_paid_at,
      p_payment_method,
      p_notes,
      p_registered_by
    )
    RETURNING id INTO v_payment_id;
    
    -- Atualizar conta
    UPDATE payable_accounts
    SET 
      status = 'paid',
      paid_at = p_paid_at,
      paid_amount = p_amount_paid,
      payment_method = p_payment_method,
      paid_by = p_registered_by,
      updated_at = NOW()
    WHERE id = p_account_id;
    
    -- Retornar sucesso
    v_result := jsonb_build_object(
      'success', true,
      'payment_id', v_payment_id,
      'account_id', p_account_id
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$;

COMMENT ON FUNCTION public.register_payment IS 
'Registra pagamento de uma conta a pagar, criando histórico e atualizando status.';

-- =====================================================
-- FUNCTION: Cancelar conta
-- =====================================================
CREATE OR REPLACE FUNCTION public.cancel_payable_account(
  p_account_id UUID,
  p_reason TEXT,
  p_cancelled_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_account RECORD;
BEGIN
  SELECT * INTO v_account
  FROM payable_accounts
  WHERE id = p_account_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Conta não encontrada'
    );
  END IF;
  
  IF v_account.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Não é possível cancelar conta já paga'
    );
  END IF;
  
  UPDATE payable_accounts
  SET 
    status = 'cancelled',
    notes = COALESCE(notes || E'\n\n', '') || 
            'CANCELADA em ' || CURRENT_DATE::TEXT || 
            ' - Motivo: ' || p_reason,
    updated_at = NOW()
  WHERE id = p_account_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'account_id', p_account_id
  );
END;
$$;

-- =====================================================
-- FUNCTION: Calcular totais por categoria
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_payables_by_category(
  p_org_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  category_id UUID,
  category_name VARCHAR,
  total_amount DECIMAL,
  paid_amount DECIMAL,
  pending_amount DECIMAL,
  count_total BIGINT,
  count_paid BIGINT,
  count_pending BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id as category_id,
    ec.name as category_name,
    COALESCE(SUM(pa.amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN pa.status = 'paid' THEN pa.paid_amount ELSE 0 END), 0) as paid_amount,
    COALESCE(SUM(CASE WHEN pa.status IN ('pending', 'overdue') THEN pa.amount ELSE 0 END), 0) as pending_amount,
    COUNT(pa.id) as count_total,
    COUNT(CASE WHEN pa.status = 'paid' THEN 1 END) as count_paid,
    COUNT(CASE WHEN pa.status IN ('pending', 'overdue') THEN 1 END) as count_pending
  FROM expense_categories ec
  LEFT JOIN payable_accounts pa ON pa.category_id = ec.id
    AND pa.org_id = p_org_id
    AND (p_start_date IS NULL OR pa.due_date >= p_start_date)
    AND (p_end_date IS NULL OR pa.due_date <= p_end_date)
  WHERE ec.org_id = p_org_id
    AND ec.is_active = true
  GROUP BY ec.id, ec.name
  ORDER BY total_amount DESC;
END;
$$;
