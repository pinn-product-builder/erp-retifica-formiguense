-- =====================================================
-- MÓDULO: Financeiro - Contas a Receber
-- VIEWS PARA CONSULTAS OTIMIZADAS
-- =====================================================

-- =====================================================
-- VIEW: Contas a Receber com Detalhes
-- =====================================================
CREATE OR REPLACE VIEW public.v_receivable_accounts_details AS
SELECT 
  ar.id,
  ar.org_id,
  ar.amount,
  ar.due_date,
  ar.payment_date,
  ar.installment_number,
  ar.total_installments,
  ar.invoice_number,
  ar.status,
  ar.payment_method,
  ar.late_fee,
  ar.discount,
  ar.notes,
  ar.created_at,
  ar.updated_at,
  
  -- Cliente
  c.id as customer_id,
  c.name as customer_name,
  c.document as customer_document,
  c.phone as customer_phone,
  c.email as customer_email,
  
  -- Ordem de Serviço
  o.id as order_id,
  o.order_number,
  
  -- Orçamento
  b.id as budget_id,
  
  -- Histórico de recebimentos
  (SELECT COALESCE(SUM(rh.amount_received), 0)
   FROM receipt_history rh
   WHERE rh.receivable_account_id = ar.id) as total_received,
  
  -- Cálculos
  CASE 
    WHEN ar.status = 'pending' AND ar.due_date < CURRENT_DATE THEN 'overdue'
    ELSE ar.status
  END as computed_status,
  
  CURRENT_DATE - ar.due_date as days_overdue,
  ar.due_date - CURRENT_DATE as days_until_due,
  
  ar.amount - COALESCE(
    (SELECT SUM(rh.amount_received)
     FROM receipt_history rh
     WHERE rh.receivable_account_id = ar.id), 
    0
  ) as balance_due

FROM public.accounts_receivable ar
INNER JOIN public.customers c ON c.id = ar.customer_id
LEFT JOIN public.orders o ON o.id = ar.order_id
LEFT JOIN public.budgets b ON b.id = ar.budget_id;

GRANT SELECT ON public.v_receivable_accounts_details TO authenticated;

-- =====================================================
-- VIEW: Dashboard de Contas a Receber
-- =====================================================
CREATE OR REPLACE VIEW public.v_receivables_dashboard AS
SELECT 
  org_id,
  
  -- Totais
  COUNT(*) as total_accounts,
  SUM(amount) as total_amount,
  
  -- Por status
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) as pending_amount,
  
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
  COALESCE(SUM(CASE WHEN status = 'paid' THEN amount - late_fee + discount END), 0) as paid_amount,
  
  COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
  COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount END), 0) as overdue_amount,
  
  -- Vencimentos próximos (7 dias)
  COUNT(CASE 
    WHEN status = 'pending' 
    AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    THEN 1 
  END) as due_soon_count,
  
  COALESCE(SUM(CASE 
    WHEN status = 'pending' 
    AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    THEN amount 
  END), 0) as due_soon_amount

FROM public.accounts_receivable
GROUP BY org_id;

GRANT SELECT ON public.v_receivables_dashboard TO authenticated;

-- =====================================================
-- VIEW: Contas Vencidas por Cliente
-- =====================================================
CREATE OR REPLACE VIEW public.v_overdue_by_customer AS
SELECT 
  ar.org_id,
  c.id as customer_id,
  c.name as customer_name,
  c.document as customer_document,
  c.phone as customer_phone,
  c.email as customer_email,
  
  COUNT(ar.id) as overdue_count,
  SUM(ar.amount) as total_overdue,
  MIN(ar.due_date) as oldest_due_date,
  MAX(CURRENT_DATE - ar.due_date) as max_days_overdue,
  
  COALESCE(ccl.is_blocked, FALSE) as is_blocked,
  ccl.blocked_reason

FROM public.accounts_receivable ar
INNER JOIN public.customers c ON c.id = ar.customer_id
LEFT JOIN public.customer_credit_limits ccl ON ccl.customer_id = c.id AND ccl.org_id = ar.org_id
WHERE ar.status IN ('pending', 'overdue')
  AND ar.due_date < CURRENT_DATE
GROUP BY ar.org_id, c.id, c.name, c.document, c.phone, c.email, ccl.is_blocked, ccl.blocked_reason
ORDER BY total_overdue DESC;

GRANT SELECT ON public.v_overdue_by_customer TO authenticated;

-- =====================================================
-- VIEW: Fluxo de Recebimentos (Últimos 30 dias)
-- =====================================================
CREATE OR REPLACE VIEW public.v_receipts_flow AS
SELECT 
  ar.org_id,
  DATE(rh.received_at) as receipt_date,
  COUNT(rh.id) as receipt_count,
  SUM(rh.amount_received) as total_received,
  AVG(rh.amount_received) as average_receipt

FROM public.receipt_history rh
INNER JOIN public.accounts_receivable ar ON ar.id = rh.receivable_account_id
WHERE rh.received_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ar.org_id, DATE(rh.received_at)
ORDER BY receipt_date DESC;

GRANT SELECT ON public.v_receipts_flow TO authenticated;
