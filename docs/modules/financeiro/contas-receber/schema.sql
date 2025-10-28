-- =====================================================
-- MÓDULO: Financeiro - Contas a Receber
-- SCHEMA: Tabelas principais
-- =====================================================

-- =====================================================
-- TABLE: accounts_receivable
-- Já existe no banco, apenas documentando
-- =====================================================

COMMENT ON TABLE public.accounts_receivable IS 
'Contas a receber vinculadas a clientes e ordens de serviço. Suporta parcelamento.';

COMMENT ON COLUMN public.accounts_receivable.installment_number IS 
'Número da parcela atual (ex: 1 de 3)';

COMMENT ON COLUMN public.accounts_receivable.total_installments IS 
'Total de parcelas (ex: 3)';

COMMENT ON COLUMN public.accounts_receivable.late_fee IS 
'Valor de juros e multa por atraso';

COMMENT ON COLUMN public.accounts_receivable.discount IS 
'Valor de desconto aplicado';

-- =====================================================
-- TABLE: receipt_history
-- Histórico de recebimentos (pagamentos parciais/totais)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.receipt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_account_id UUID NOT NULL REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
  
  amount_received DECIMAL(10,2) NOT NULL CHECK (amount_received > 0),
  received_at DATE NOT NULL,
  
  payment_method VARCHAR(50) NOT NULL,
  
  late_fee_charged DECIMAL(10,2) DEFAULT 0,
  discount_applied DECIMAL(10,2) DEFAULT 0,
  
  notes TEXT,
  
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT receipt_history_payment_method_check 
    CHECK (payment_method IN ('dinheiro', 'pix', 'transferencia', 'boleto', 'cartao_credito', 'cartao_debito'))
);

COMMENT ON TABLE public.receipt_history IS 
'Histórico de recebimentos de contas a receber. Permite registrar pagamentos parciais.';

-- =====================================================
-- TABLE: customer_credit_limits
-- Limites de crédito por cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customer_credit_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  credit_limit DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT customer_credit_limits_org_customer_key UNIQUE(org_id, customer_id)
);

COMMENT ON TABLE public.customer_credit_limits IS 
'Controle de limite de crédito e bloqueio de clientes inadimplentes.';
