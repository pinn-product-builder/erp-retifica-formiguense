-- =====================================================
-- MÓDULO: Financeiro - Contas a Receber
-- TRIGGERS E FUNCTIONS
-- =====================================================

-- =====================================================
-- FUNCTION: Atualizar status para 'overdue'
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_overdue_receivable_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.accounts_receivable
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$;

-- =====================================================
-- FUNCTION: Registrar recebimento
-- =====================================================
CREATE OR REPLACE FUNCTION public.register_receipt(
  p_account_id UUID,
  p_amount_received DECIMAL,
  p_received_at DATE,
  p_payment_method VARCHAR,
  p_late_fee DECIMAL DEFAULT 0,
  p_discount DECIMAL DEFAULT 0,
  p_notes TEXT DEFAULT NULL,
  p_registered_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_account RECORD;
  v_receipt_id UUID;
  v_total_received DECIMAL;
  v_result JSONB;
BEGIN
  -- Buscar conta
  SELECT * INTO v_account
  FROM accounts_receivable
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
  
  -- Inserir histórico
  INSERT INTO receipt_history (
    receivable_account_id,
    amount_received,
    received_at,
    payment_method,
    late_fee_charged,
    discount_applied,
    notes,
    registered_by
  ) VALUES (
    p_account_id,
    p_amount_received,
    p_received_at,
    p_payment_method,
    p_late_fee,
    p_discount,
    p_notes,
    p_registered_by
  )
  RETURNING id INTO v_receipt_id;
  
  -- Calcular total recebido
  SELECT COALESCE(SUM(amount_received), 0) INTO v_total_received
  FROM receipt_history
  WHERE receivable_account_id = p_account_id;
  
  -- Atualizar conta
  IF v_total_received >= v_account.amount THEN
    UPDATE accounts_receivable
    SET 
      status = 'paid',
      payment_date = p_received_at,
      payment_method = p_payment_method,
      late_fee = p_late_fee,
      discount = p_discount
    WHERE id = p_account_id;
  ELSE
    UPDATE accounts_receivable
    SET 
      late_fee = p_late_fee,
      discount = p_discount
    WHERE id = p_account_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'receipt_id', v_receipt_id,
    'total_received', v_total_received,
    'is_fully_paid', v_total_received >= v_account.amount
  );
END;
$$;

-- =====================================================
-- FUNCTION: Calcular juros e multa
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_late_fee(
  p_amount DECIMAL,
  p_due_date DATE,
  p_payment_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  v_days_overdue INTEGER;
  v_late_fee DECIMAL;
BEGIN
  v_days_overdue := p_payment_date - p_due_date;
  
  IF v_days_overdue <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Multa: 2% + Juros: 0.033% ao dia
  v_late_fee := p_amount * 0.02; -- Multa fixa
  v_late_fee := v_late_fee + (p_amount * 0.00033 * v_days_overdue); -- Juros diários
  
  RETURN ROUND(v_late_fee, 2);
END;
$$;

-- =====================================================
-- FUNCTION: Bloquear cliente inadimplente
-- =====================================================
CREATE OR REPLACE FUNCTION public.block_overdue_customers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Bloquear clientes com contas vencidas há mais de 30 dias
  INSERT INTO customer_credit_limits (org_id, customer_id, is_blocked, blocked_reason, blocked_at)
  SELECT DISTINCT
    ar.org_id,
    ar.customer_id,
    TRUE,
    'Cliente com contas vencidas há mais de 30 dias',
    NOW()
  FROM accounts_receivable ar
  WHERE ar.status = 'overdue'
    AND ar.due_date < CURRENT_DATE - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM customer_credit_limits ccl
      WHERE ccl.customer_id = ar.customer_id
        AND ccl.is_blocked = TRUE
    )
  ON CONFLICT (org_id, customer_id) DO UPDATE
  SET 
    is_blocked = TRUE,
    blocked_reason = 'Cliente com contas vencidas há mais de 30 dias',
    blocked_at = NOW();
END;
$$;
