-- Inserir dados de demonstração corrigindo o erro da coluna gerada

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

-- Orçamentos exemplo (sem especificar total_cost que é calculado automaticamente)
INSERT INTO public.budgets (order_id, component, description, labor_cost, parts_cost, status, notes)
SELECT 
  o.id,
  'bloco',
  'Retífica completa do bloco do motor - usinagem dos cilindros',
  800.00,
  450.00,
  'aprovado',
  'Orçamento aprovado pelo cliente via WhatsApp'
FROM public.orders o
WHERE o.order_number = 'RF-2024-0001'
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
LIMIT 1
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

INSERT INTO public.cash_flow (transaction_type, description, amount, transaction_date, payment_method, notes)
VALUES 
('expense', 'Pagamento de energia elétrica', 450.00, CURRENT_DATE - INTERVAL '3 days', 'debit_card', 'Conta de energia do mês'),
('expense', 'Compra de material de limpeza', 85.00, CURRENT_DATE - INTERVAL '1 day', 'cash', 'Produtos de limpeza para oficina'),
('income', 'Entrada de caixa inicial', 25000.00, CURRENT_DATE - INTERVAL '30 days', 'bank_transfer', 'Capital inicial')
ON CONFLICT DO NOTHING;