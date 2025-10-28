-- =====================================================
-- MÓDULO: Financeiro - Contas a Receber
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- =====================================================
-- ACCOUNTS_RECEIVABLE
-- =====================================================

-- Índice composto: org + status (consultas filtradas)
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_org_status 
  ON public.accounts_receivable(org_id, status);

-- Índice: data de vencimento (alertas e vencidas)
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date 
  ON public.accounts_receivable(due_date);

-- Índice: cliente (histórico por cliente)
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer 
  ON public.accounts_receivable(customer_id);

-- Índice composto: org + cliente + status
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_org_customer_status 
  ON public.accounts_receivable(org_id, customer_id, status);

-- Índice: ordem de serviço
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_order 
  ON public.accounts_receivable(order_id);

-- Índice: data de pagamento
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_payment_date 
  ON public.accounts_receivable(payment_date) 
  WHERE payment_date IS NOT NULL;

-- Índice parcial: contas pendentes
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_pending 
  ON public.accounts_receivable(org_id, due_date) 
  WHERE status = 'pending';

-- Índice parcial: contas vencidas
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_overdue 
  ON public.accounts_receivable(org_id, customer_id, due_date) 
  WHERE status = 'overdue';

-- =====================================================
-- RECEIPT_HISTORY
-- =====================================================

-- Índice: conta a receber (histórico)
CREATE INDEX IF NOT EXISTS idx_receipt_history_account 
  ON public.receipt_history(receivable_account_id);

-- Índice: data de recebimento
CREATE INDEX IF NOT EXISTS idx_receipt_history_received_at 
  ON public.receipt_history(received_at);

-- Índice: registrado por
CREATE INDEX IF NOT EXISTS idx_receipt_history_registered_by 
  ON public.receipt_history(registered_by);

-- =====================================================
-- CUSTOMER_CREDIT_LIMITS
-- =====================================================

-- Índice: org + cliente (busca rápida)
CREATE INDEX IF NOT EXISTS idx_customer_credit_limits_org_customer 
  ON public.customer_credit_limits(org_id, customer_id);

-- Índice parcial: clientes bloqueados
CREATE INDEX IF NOT EXISTS idx_customer_credit_limits_blocked 
  ON public.customer_credit_limits(org_id, customer_id) 
  WHERE is_blocked = TRUE;

-- =====================================================
-- ANÁLISE E OTIMIZAÇÃO
-- =====================================================

-- Analisar tabelas após criação de índices
ANALYZE public.accounts_receivable;
ANALYZE public.receipt_history;
ANALYZE public.customer_credit_limits;
