
-- Criar tipos enumerados para o sistema financeiro
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'check');
CREATE TYPE expense_category AS ENUM ('fixed', 'variable', 'tax', 'supplier', 'salary', 'equipment', 'maintenance');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Tabela de formas de pagamento
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  method payment_method NOT NULL,
  fee_percentage DECIMAL(5,2) DEFAULT 0.00,
  fee_fixed DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de categorias de despesas
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category expense_category NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de contas bancárias
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  agency TEXT,
  account_number TEXT NOT NULL,
  account_type TEXT DEFAULT 'checking',
  balance DECIMAL(15,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de contas a receber
CREATE TABLE public.accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  budget_id UUID REFERENCES public.budgets(id),
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  invoice_number TEXT,
  installment_number INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status payment_status DEFAULT 'pending',
  payment_method payment_method,
  late_fee DECIMAL(15,2) DEFAULT 0.00,
  discount DECIMAL(15,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de contas a pagar
CREATE TABLE public.accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  supplier_document TEXT,
  expense_category_id UUID REFERENCES public.expense_categories(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status payment_status DEFAULT 'pending',
  payment_method payment_method,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de fluxo de caixa
CREATE TABLE public.cash_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  payment_method payment_method,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  accounts_receivable_id UUID REFERENCES public.accounts_receivable(id),
  accounts_payable_id UUID REFERENCES public.accounts_payable(id),
  order_id UUID REFERENCES public.orders(id),
  category_id UUID REFERENCES public.expense_categories(id),
  notes TEXT,
  reconciled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de projeção de fluxo de caixa
CREATE TABLE public.cash_flow_projection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projection_date DATE NOT NULL,
  projected_income DECIMAL(15,2) DEFAULT 0.00,
  projected_expenses DECIMAL(15,2) DEFAULT 0.00,
  projected_balance DECIMAL(15,2) DEFAULT 0.00,
  actual_income DECIMAL(15,2) DEFAULT 0.00,
  actual_expenses DECIMAL(15,2) DEFAULT 0.00,
  actual_balance DECIMAL(15,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de DRE mensal
CREATE TABLE public.monthly_dre (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_revenue DECIMAL(15,2) DEFAULT 0.00,
  direct_costs DECIMAL(15,2) DEFAULT 0.00,
  operational_expenses DECIMAL(15,2) DEFAULT 0.00,
  gross_profit DECIMAL(15,2) DEFAULT 0.00,
  net_profit DECIMAL(15,2) DEFAULT 0.00,
  profit_margin DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(month, year)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_projection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_dre ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para desenvolvimento (permitir tudo)
CREATE POLICY "Enable all access for development" ON public.payment_methods FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.expense_categories FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.bank_accounts FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.accounts_receivable FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.accounts_payable FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.cash_flow FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.cash_flow_projection FOR ALL USING (true);
CREATE POLICY "Enable all access for development" ON public.monthly_dre FOR ALL USING (true);

-- Inserir dados iniciais para formas de pagamento
INSERT INTO public.payment_methods (name, method, fee_percentage, fee_fixed) VALUES
('Dinheiro', 'cash', 0.00, 0.00),
('PIX', 'pix', 0.00, 0.00),
('Cartão de Débito', 'debit_card', 1.50, 0.00),
('Cartão de Crédito', 'credit_card', 2.99, 0.00),
('Transferência Bancária', 'bank_transfer', 0.00, 8.00),
('Cheque', 'check', 0.00, 0.00);

-- Inserir categorias de despesas iniciais
INSERT INTO public.expense_categories (name, category, description) VALUES
('Salários', 'salary', 'Pagamento de funcionários'),
('Aluguel', 'fixed', 'Aluguel do espaço físico'),
('Energia Elétrica', 'fixed', 'Conta de luz'),
('Telefone/Internet', 'fixed', 'Telecomunicações'),
('Peças e Insumos', 'variable', 'Materiais para serviços'),
('Combustível', 'variable', 'Combustível para veículos'),
('Manutenção Equipamentos', 'maintenance', 'Manutenção de máquinas'),
('DAS', 'tax', 'Documento de Arrecadação do Simples'),
('ISS', 'tax', 'Imposto sobre Serviços'),
('INSS', 'tax', 'Contribuição previdenciária'),
('Fornecedores', 'supplier', 'Pagamentos a fornecedores');

-- Inserir conta bancária padrão
INSERT INTO public.bank_accounts (bank_name, account_number, account_type) VALUES
('Conta Principal', '12345-6', 'checking');

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_receivable_updated_at BEFORE UPDATE ON public.accounts_receivable FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_payable_updated_at BEFORE UPDATE ON public.accounts_payable FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_flow_updated_at BEFORE UPDATE ON public.cash_flow FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_flow_projection_updated_at BEFORE UPDATE ON public.cash_flow_projection FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_dre_updated_at BEFORE UPDATE ON public.monthly_dre FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar contas a receber automaticamente quando orçamento for aprovado
CREATE OR REPLACE FUNCTION generate_accounts_receivable()
RETURNS TRIGGER AS $$
BEGIN
    -- Só gera se o status mudou para aprovado
    IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
        INSERT INTO public.accounts_receivable (
            budget_id,
            order_id,
            customer_id,
            amount,
            due_date,
            installment_number,
            total_installments
        )
        SELECT 
            NEW.id,
            NEW.order_id,
            o.customer_id,
            NEW.total_cost,
            CURRENT_DATE + INTERVAL '30 days',
            1,
            1
        FROM public.orders o
        WHERE o.id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para gerar contas a receber automaticamente
CREATE TRIGGER trigger_generate_accounts_receivable 
    AFTER UPDATE ON public.budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION generate_accounts_receivable();
