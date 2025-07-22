-- Inserir mais dados de demonstração para o sistema ficar funcional

-- Motores exemplo
INSERT INTO public.engines (brand, model, type, fuel_type, serial_number, assembly_state, has_block, has_head, has_crankshaft, has_piston, has_connecting_rod, turns_manually, is_complete) VALUES
('Volkswagen', 'AP 1.6', 'Aspirado', 'Gasolina', 'VW001', 'Desmontado', true, true, true, false, false, false, false),
('Chevrolet', 'Família I', 'Aspirado', 'Flex', 'GM002', 'Montado', true, true, true, true, true, true, true),
('Ford', 'Zetec Rocam', 'Aspirado', 'Flex', 'FD003', 'Semi-montado', true, true, false, true, true, false, false)
ON CONFLICT DO NOTHING;

-- Ordens de serviço exemplo
INSERT INTO public.orders (customer_id, consultant_id, engine_id, collection_date, collection_time, collection_location, driver_name, failure_reason, initial_observations, status, estimated_delivery, order_number) 
SELECT 
  c.id,
  cons.id,
  e.id,
  CURRENT_DATE - INTERVAL '15 days',
  '09:00:00',
  'Oficina Auto Center Silva',
  'João Motorista',
  'Motor batendo pino, consumo de óleo excessivo',
  'Cliente reporta ruído no motor e fumaça azul no escapamento',
  'ativa',
  CURRENT_DATE + INTERVAL '30 days',
  'RF-2024-0001'
FROM public.customers c, public.consultants cons, public.engines e
WHERE c.name = 'Auto Center Silva' AND cons.name = 'João Silva' AND e.brand = 'Volkswagen'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.orders (customer_id, consultant_id, engine_id, collection_date, collection_time, collection_location, driver_name, failure_reason, initial_observations, status, estimated_delivery, order_number) 
SELECT 
  c.id,
  cons.id,
  e.id,
  CURRENT_DATE - INTERVAL '10 days',
  '14:30:00',
  'Residência do Cliente',
  'Pedro Entregador',
  'Motor não pega, problemas na partida',
  'Motor parou de funcionar repentinamente',
  'ativa',
  CURRENT_DATE + INTERVAL '25 days',
  'RF-2024-0002'
FROM public.customers c, public.consultants cons, public.engines e
WHERE c.name = 'Carlos Oliveira' AND cons.name = 'Maria Santos' AND e.brand = 'Chevrolet'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Orçamentos exemplo
INSERT INTO public.budgets (order_id, component, description, labor_cost, parts_cost, total_cost, status, notes)
SELECT 
  o.id,
  'bloco',
  'Retífica completa do bloco do motor - usinagem dos cilindros',
  800.00,
  450.00,
  1250.00,
  'aprovado',
  'Orçamento aprovado pelo cliente via WhatsApp'
FROM public.orders o
WHERE o.order_number = 'RF-2024-0001'
ON CONFLICT DO NOTHING;

INSERT INTO public.budgets (order_id, component, description, labor_cost, parts_cost, total_cost, status, notes)
SELECT 
  o.id,
  'cabecote',
  'Retífica do cabeçote - troca de válvulas e sedes',
  600.00,
  380.00,
  980.00,
  'pendente',
  'Aguardando aprovação do cliente'
FROM public.orders o
WHERE o.order_number = 'RF-2024-0001'
ON CONFLICT DO NOTHING;

-- Contas a receber exemplo (baseadas nos orçamentos aprovados)
INSERT INTO public.accounts_receivable (customer_id, order_id, budget_id, amount, due_date, status, installment_number, total_installments, invoice_number, notes)
SELECT 
  o.customer_id,
  o.id,
  b.id,
  b.total_cost,
  CURRENT_DATE + INTERVAL '30 days',
  'pending',
  1,
  1,
  'RF-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(ROW_NUMBER() OVER()::TEXT, 4, '0'),
  'Pagamento referente ao serviço de retífica do bloco'
FROM public.orders o
JOIN public.budgets b ON b.order_id = o.id
WHERE b.status = 'aprovado'
ON CONFLICT DO NOTHING;

-- Contas a pagar exemplo
INSERT INTO public.accounts_payable (supplier_name, supplier_document, description, amount, due_date, status, expense_category_id, invoice_number, notes)
SELECT 
  'Distribuidora de Peças Ltda',
  '98.765.432/0001-10',
  'Compra de peças para estoque',
  2500.00,
  CURRENT_DATE + INTERVAL '15 days',
  'pending',
  ec.id,
  'NF-45678',
  'Peças para motor Volkswagen AP'
FROM public.expense_categories ec
WHERE ec.name = 'Peças e Componentes'
ON CONFLICT DO NOTHING;

INSERT INTO public.accounts_payable (supplier_name, supplier_document, description, amount, due_date, status, expense_category_id, invoice_number, notes)
SELECT 
  'Imobiliária Centro',
  '12.345.678/0001-90',
  'Aluguel mensal da oficina',
  3200.00,
  CURRENT_DATE + INTERVAL '5 days',
  'pending',
  ec.id,
  'RC-' || TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
  'Aluguel referente ao mês de ' || TO_CHAR(CURRENT_DATE, 'MM/YYYY')
FROM public.expense_categories ec
WHERE ec.name = 'Aluguel'
ON CONFLICT DO NOTHING;

-- Movimentações de fluxo de caixa exemplo
INSERT INTO public.cash_flow (transaction_type, description, amount, transaction_date, payment_method, bank_account_id, notes)
SELECT 
  'income',
  'Recebimento de serviço - RF-2024-0001',
  1250.00,
  CURRENT_DATE - INTERVAL '5 days',
  'pix',
  ba.id,
  'Pagamento à vista via PIX'
FROM public.bank_accounts ba
WHERE ba.bank_name = 'Banco do Brasil'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.cash_flow (transaction_type, description, amount, transaction_date, payment_method, bank_account_id, notes)
SELECT 
  'expense',
  'Pagamento de energia elétrica',
  450.00,
  CURRENT_DATE - INTERVAL '3 days',
  'debit_card',
  ba.id,
  'Conta de energia do mês'
FROM public.bank_accounts ba
WHERE ba.bank_name = 'Banco do Brasil'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.cash_flow (transaction_type, description, amount, transaction_date, payment_method, bank_account_id, notes)
SELECT 
  'expense',
  'Compra de material de limpeza',
  85.00,
  CURRENT_DATE - INTERVAL '1 day',
  'cash',
  ba.id,
  'Produtos de limpeza para oficina'
FROM public.bank_accounts ba
WHERE ba.bank_name = 'Banco do Brasil'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Atualizar saldos das contas bancárias baseado nas movimentações
UPDATE public.bank_accounts 
SET balance = (
  SELECT COALESCE(
    (SELECT SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END)
     FROM public.cash_flow 
     WHERE bank_account_id = bank_accounts.id), 
    0
  ) + 25000.00  -- Saldo inicial
)
WHERE bank_name = 'Banco do Brasil';

-- Função para calcular DRE automaticamente
CREATE OR REPLACE FUNCTION public.calculate_monthly_dre(target_year INTEGER, target_month INTEGER)
RETURNS VOID AS $$
DECLARE
    total_revenue NUMERIC := 0;
    direct_costs NUMERIC := 0;
    operational_expenses NUMERIC := 0;
    gross_profit NUMERIC := 0;
    net_profit NUMERIC := 0;
    profit_margin NUMERIC := 0;
BEGIN
    -- Calcular receita total (entradas no fluxo de caixa)
    SELECT COALESCE(SUM(amount), 0) INTO total_revenue
    FROM public.cash_flow
    WHERE transaction_type = 'income'
    AND EXTRACT(YEAR FROM transaction_date) = target_year
    AND EXTRACT(MONTH FROM transaction_date) = target_month;
    
    -- Calcular custos diretos (despesas relacionadas à produção)
    SELECT COALESCE(SUM(cf.amount), 0) INTO direct_costs
    FROM public.cash_flow cf
    LEFT JOIN public.accounts_payable ap ON cf.accounts_payable_id = ap.id
    LEFT JOIN public.expense_categories ec ON ap.expense_category_id = ec.id
    WHERE cf.transaction_type = 'expense'
    AND (ec.category = 'direct' OR ec.category IS NULL)
    AND EXTRACT(YEAR FROM cf.transaction_date) = target_year
    AND EXTRACT(MONTH FROM cf.transaction_date) = target_month;
    
    -- Calcular despesas operacionais
    SELECT COALESCE(SUM(cf.amount), 0) INTO operational_expenses
    FROM public.cash_flow cf
    LEFT JOIN public.accounts_payable ap ON cf.accounts_payable_id = ap.id
    LEFT JOIN public.expense_categories ec ON ap.expense_category_id = ec.id
    WHERE cf.transaction_type = 'expense'
    AND ec.category = 'operational'
    AND EXTRACT(YEAR FROM cf.transaction_date) = target_year
    AND EXTRACT(MONTH FROM cf.transaction_date) = target_month;
    
    -- Calcular lucros
    gross_profit := total_revenue - direct_costs;
    net_profit := gross_profit - operational_expenses;
    
    -- Calcular margem de lucro
    IF total_revenue > 0 THEN
        profit_margin := (net_profit / total_revenue) * 100;
    END IF;
    
    -- Inserir/atualizar DRE
    INSERT INTO public.monthly_dre (year, month, total_revenue, direct_costs, operational_expenses, gross_profit, net_profit, profit_margin)
    VALUES (target_year, target_month, total_revenue, direct_costs, operational_expenses, gross_profit, net_profit, profit_margin)
    ON CONFLICT (year, month) DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        direct_costs = EXCLUDED.direct_costs,
        operational_expenses = EXCLUDED.operational_expenses,
        gross_profit = EXCLUDED.gross_profit,
        net_profit = EXCLUDED.net_profit,
        profit_margin = EXCLUDED.profit_margin,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Calcular DRE para os últimos 6 meses
SELECT public.calculate_monthly_dre(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER);
SELECT public.calculate_monthly_dre(EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER);
SELECT public.calculate_monthly_dre(EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER);

-- Trigger para recalcular DRE automaticamente quando houver movimentação financeira
CREATE OR REPLACE FUNCTION public.trigger_dre_calculation()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular DRE do mês da transação
    PERFORM public.calculate_monthly_dre(
        EXTRACT(YEAR FROM NEW.transaction_date)::INTEGER,
        EXTRACT(MONTH FROM NEW.transaction_date)::INTEGER
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dre_on_cash_flow
    AFTER INSERT OR UPDATE OR DELETE ON public.cash_flow
    FOR EACH ROW EXECUTE FUNCTION public.trigger_dre_calculation();