
-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para profiles - usuários podem ver/editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Função de segurança para obter ID do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Atualizar políticas RLS existentes para usar autenticação
-- Remover política antiga e criar nova para customers
DROP POLICY IF EXISTS "Enable all access for development" ON public.customers;
CREATE POLICY "Users can manage own customers" ON public.customers
  FOR ALL USING (true); -- Por enquanto permitir acesso geral, depois refinar por empresa

-- Atualizar demais tabelas
DROP POLICY IF EXISTS "Enable all access for development" ON public.orders;
CREATE POLICY "Users can manage orders" ON public.orders
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for development" ON public.accounts_receivable;
CREATE POLICY "Users can manage accounts receivable" ON public.accounts_receivable
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for development" ON public.accounts_payable;
CREATE POLICY "Users can manage accounts payable" ON public.accounts_payable
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for development" ON public.cash_flow;
CREATE POLICY "Users can manage cash flow" ON public.cash_flow
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for development" ON public.consultants;
CREATE POLICY "Users can manage consultants" ON public.consultants
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for development" ON public.engines;
CREATE POLICY "Users can manage engines" ON public.engines
  FOR ALL USING (true);

-- Inserir dados de demonstração
-- Consultores exemplo
INSERT INTO public.consultants (name, phone, email, commission_rate, active) VALUES
('João Silva', '(11) 99999-1111', 'joao@exemplo.com', 5.00, true),
('Maria Santos', '(11) 99999-2222', 'maria@exemplo.com', 4.50, true),
('Pedro Costa', '(11) 99999-3333', 'pedro@exemplo.com', 5.50, true)
ON CONFLICT DO NOTHING;

-- Clientes exemplo
INSERT INTO public.customers (type, name, document, phone, email, address) VALUES
('oficina', 'Auto Center Silva', '12.345.678/0001-90', '(11) 3333-1111', 'contato@autosilva.com', 'Rua das Oficinas, 123'),
('direto', 'Carlos Oliveira', '123.456.789-00', '(11) 99999-4444', 'carlos@gmail.com', 'Rua dos Clientes, 456'),
('oficina', 'Mecânica do Bairro', '98.765.432/0001-10', '(11) 3333-2222', 'mecanica@bairro.com', 'Av. Principal, 789')
ON CONFLICT DO NOTHING;

-- Categorias de despesas exemplo
INSERT INTO public.expense_categories (name, category, description, is_active) VALUES
('Aluguel', 'operational', 'Aluguel do estabelecimento', true),
('Energia Elétrica', 'operational', 'Conta de luz', true),
('Telefone/Internet', 'operational', 'Telecomunicações', true),
('Material de Escritório', 'operational', 'Materiais diversos', true),
('Peças e Componentes', 'direct', 'Peças para reparos', true),
('Mão de Obra Terceirizada', 'direct', 'Serviços externos', true)
ON CONFLICT DO NOTHING;

-- Formas de pagamento exemplo
INSERT INTO public.payment_methods (name, method, fee_percentage, fee_fixed, is_active) VALUES
('Dinheiro', 'cash', 0.00, 0.00, true),
('PIX', 'pix', 0.00, 0.00, true),
('Cartão de Débito', 'debit_card', 1.50, 0.00, true),
('Cartão de Crédito', 'credit_card', 3.50, 0.00, true),
('Transferência Bancária', 'bank_transfer', 0.00, 0.00, true)
ON CONFLICT DO NOTHING;

-- Contas bancárias exemplo
INSERT INTO public.bank_accounts (bank_name, agency, account_number, account_type, balance, is_active) VALUES
('Banco do Brasil', '1234-5', '12345-6', 'checking', 25000.00, true),
('Itaú', '5678-9', '98765-4', 'savings', 15000.00, true)
ON CONFLICT DO NOTHING;
