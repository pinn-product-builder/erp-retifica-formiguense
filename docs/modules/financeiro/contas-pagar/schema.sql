-- =====================================================
-- MÓDULO: Financeiro - Contas a Pagar
-- TABELA: payable_accounts
-- =====================================================

-- Tabela principal de contas a pagar
CREATE TABLE IF NOT EXISTS public.payable_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Vínculos
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Valores
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  
  -- Descrição
  description TEXT NOT NULL CHECK (char_length(description) >= 3),
  notes TEXT,
  
  -- Nota Fiscal
  invoice_number VARCHAR(100),
  invoice_file_url TEXT,
  
  -- Status e Pagamento
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'cancelled', 'overdue')
  ),
  
  paid_at DATE,
  paid_amount DECIMAL(12,2) CHECK (paid_amount > 0),
  payment_method VARCHAR(50) CHECK (
    payment_method IN (
      'dinheiro', 'pix', 'transferencia', 'boleto',
      'cartao_credito', 'cartao_debito', 'cheque'
    )
  ),
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT paid_fields_required CHECK (
    (status = 'paid' AND paid_at IS NOT NULL AND paid_amount IS NOT NULL AND payment_method IS NOT NULL)
    OR (status != 'paid')
  ),
  
  CONSTRAINT paid_amount_valid CHECK (
    paid_amount IS NULL OR paid_amount <= amount * 1.1
  )
);

-- Comentários
COMMENT ON TABLE public.payable_accounts IS 
'Registro de todas as contas a pagar da organização com controle de vencimentos e pagamentos.';

COMMENT ON COLUMN public.payable_accounts.status IS 
'Status: pending (a pagar), paid (paga), cancelled (cancelada), overdue (vencida)';

COMMENT ON COLUMN public.payable_accounts.paid_amount IS 
'Valor efetivamente pago - pode diferir do amount devido a descontos/juros';

COMMENT ON COLUMN public.payable_accounts.invoice_file_url IS 
'URL do arquivo da nota fiscal armazenado no Supabase Storage bucket "invoices"';

-- Tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payable_account_id UUID NOT NULL REFERENCES public.payable_accounts(id) ON DELETE CASCADE,
  
  amount_paid DECIMAL(12,2) NOT NULL CHECK (amount_paid > 0),
  paid_at DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  notes TEXT,
  
  registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payment_history IS 
'Histórico de pagamentos - permite registrar pagamentos parciais e histórico completo.';

-- Tabela de categorias de despesas
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_category_name_per_org UNIQUE (org_id, name)
);

COMMENT ON TABLE public.expense_categories IS 
'Categorias para classificação de despesas (Peças, Mão de Obra, Aluguel, etc).';

-- Inserir categorias padrão (será executado via seed.sql)
