-- =====================================================
-- MÓDULO: Financeiro - Contas a Pagar
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice composto principal: org + status (mais usado)
CREATE INDEX IF NOT EXISTS idx_payable_accounts_org_status 
  ON public.payable_accounts(org_id, status);

-- Índice para busca por vencimento (alertas e listagens)
CREATE INDEX IF NOT EXISTS idx_payable_accounts_due_date 
  ON public.payable_accounts(due_date DESC) 
  WHERE status IN ('pending', 'overdue');

-- Índice para contas vencidas (query frequente)
CREATE INDEX IF NOT EXISTS idx_payable_accounts_overdue 
  ON public.payable_accounts(org_id, due_date) 
  WHERE status = 'pending' AND due_date < CURRENT_DATE;

-- Índice por fornecedor
CREATE INDEX IF NOT EXISTS idx_payable_accounts_supplier 
  ON public.payable_accounts(supplier_id);

-- Índice por categoria
CREATE INDEX IF NOT EXISTS idx_payable_accounts_category 
  ON public.payable_accounts(category_id);

-- Índice por ordem de serviço (quando vinculada)
CREATE INDEX IF NOT EXISTS idx_payable_accounts_order 
  ON public.payable_accounts(order_id) 
  WHERE order_id IS NOT NULL;

-- Índice para busca full-text em descrição
CREATE INDEX IF NOT EXISTS idx_payable_accounts_description_fts 
  ON public.payable_accounts USING GIN(to_tsvector('portuguese', description));

-- Índice para histórico de pagamentos
CREATE INDEX IF NOT EXISTS idx_payment_history_account 
  ON public.payment_history(payable_account_id);

CREATE INDEX IF NOT EXISTS idx_payment_history_date 
  ON public.payment_history(paid_at DESC);

-- Índice para categorias
CREATE INDEX IF NOT EXISTS idx_expense_categories_org 
  ON public.expense_categories(org_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_expense_categories_code 
  ON public.expense_categories(org_id, code) 
  WHERE code IS NOT NULL;

-- Índice para auditoria
CREATE INDEX IF NOT EXISTS idx_payable_accounts_created_by 
  ON public.payable_accounts(created_by);

CREATE INDEX IF NOT EXISTS idx_payable_accounts_created_at 
  ON public.payable_accounts(created_at DESC);

-- Índice para relatórios mensais
CREATE INDEX IF NOT EXISTS idx_payable_accounts_month 
  ON public.payable_accounts(org_id, date_trunc('month', due_date));

-- =====================================================
-- ANÁLISE DE PERFORMANCE
-- =====================================================

-- Queries mais comuns e seus índices:

-- 1. Listar contas pendentes da org: idx_payable_accounts_org_status
--    SELECT * FROM payable_accounts WHERE org_id = ? AND status = 'pending'

-- 2. Alertas de vencimento: idx_payable_accounts_overdue
--    SELECT * WHERE org_id = ? AND status = 'pending' AND due_date BETWEEN ? AND ?

-- 3. Busca por fornecedor: idx_payable_accounts_supplier
--    SELECT * WHERE supplier_id = ?

-- 4. Relatório por categoria: idx_payable_accounts_category
--    SELECT category_id, SUM(amount) WHERE org_id = ? GROUP BY category_id

-- 5. Histórico de pagamentos: idx_payment_history_account
--    SELECT * FROM payment_history WHERE payable_account_id = ?
