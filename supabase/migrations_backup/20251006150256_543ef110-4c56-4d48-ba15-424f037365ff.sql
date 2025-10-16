-- Cadastro de dados mínimos para testes E2E - Organização: Cadastro Organização
-- Org ID: e6a72c5a-afbf-444b-aace-8d2b37eef5c4

-- 1. FUNCIONÁRIOS (Employees)
INSERT INTO employees (
  org_id, 
  full_name, 
  employee_number, 
  position, 
  department,
  phone, 
  email, 
  cpf,
  hire_date,
  salary,
  hourly_rate,
  is_active
) VALUES (
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'João Silva',
  'FUNC-001',
  'Técnico Mecânico',
  'Operações',
  '11987654321',
  'joao.silva@teste.com',
  '12345678900',
  CURRENT_DATE - INTERVAL '1 year',
  3500.00,
  25.00,
  true
), (
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'Maria Santos',
  'FUNC-002',
  'Gerente de Operações',
  'Operações',
  '11987654322',
  'maria.santos@teste.com',
  '98765432100',
  CURRENT_DATE - INTERVAL '2 years',
  6500.00,
  NULL,
  true
);

-- Atualizar commission_rate para o gerente
UPDATE employees 
SET commission_rate = 5.00 
WHERE employee_number = 'FUNC-002' 
AND org_id = 'e6a72c5a-afbf-444b-aace-8d2b37eef5c4';

-- 2. PEÇAS NO ESTOQUE (Parts Inventory)
INSERT INTO parts_inventory (
  org_id,
  part_code,
  part_name,
  quantity,
  unit_cost,
  status
) VALUES 
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'PIST-001',
  'Pistão 0.25 AP 1.6',
  20,
  85.50,
  'disponivel'
),
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'BRON-001',
  'Bronzina de Biela 0.25',
  15,
  45.00,
  'disponivel'
),
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'ANEL-001',
  'Jogo de Anéis 0.50',
  10,
  95.00,
  'disponivel'
),
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'JUNT-001',
  'Junta do Cabeçote',
  8,
  120.00,
  'disponivel'
),
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'RET-001',
  'Retentor de Válvula (unidade)',
  50,
  8.50,
  'disponivel'
);

-- 3. CONFIGURAÇÃO DE ESTOQUE MÍNIMO (Parts Stock Config)
INSERT INTO parts_stock_config (
  org_id,
  part_code,
  part_name,
  minimum_stock,
  maximum_stock,
  reorder_point,
  economic_order_quantity,
  lead_time_days
) VALUES 
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'PIST-001',
  'Pistão 0.25 AP 1.6',
  5,
  50,
  10,
  20,
  7
),
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'BRON-001',
  'Bronzina de Biela 0.25',
  5,
  40,
  8,
  15,
  7
),
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'ANEL-001',
  'Jogo de Anéis 0.50',
  3,
  30,
  5,
  10,
  10
),
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'JUNT-001',
  'Junta do Cabeçote',
  3,
  25,
  5,
  10,
  14
),
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'RET-001',
  'Retentor de Válvula (unidade)',
  10,
  100,
  20,
  50,
  5
);

-- 4. CLIENTE ADICIONAL (Customers)
INSERT INTO customers (
  org_id,
  name,
  document,
  type,
  phone,
  email,
  address
) VALUES (
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'Auto Mecânica São Paulo',
  '12345678000190',
  'oficina',
  '1133334444',
  'contato@automecanicasp.com.br',
  'Rua das Oficinas, 123 - São Paulo/SP'
);

-- 5. MOTOR ADICIONAL (Engines)
INSERT INTO engines (
  org_id,
  brand,
  model,
  type,
  fuel_type,
  serial_number,
  has_block,
  has_head,
  has_crankshaft,
  has_connecting_rod,
  has_piston,
  is_complete,
  turns_manually,
  assembly_state,
  engine_type_id
) VALUES (
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'Fiat',
  'Fire 1.0',
  '4 cilindros',
  'flex',
  'FIRE123456',
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  'parcialmente_montado',
  (SELECT id FROM engine_types WHERE org_id = 'e6a72c5a-afbf-444b-aace-8d2b37eef5c4' LIMIT 1)
);

-- 6. FORNECEDORES (Suppliers)
INSERT INTO suppliers (
  org_id,
  name,
  cnpj,
  contact_person,
  phone,
  email,
  address,
  payment_terms,
  delivery_days,
  rating,
  is_active
) VALUES 
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'Distribuidora de Peças Automotivas Ltda',
  '98765432000111',
  'Carlos Oliveira',
  '1144445555',
  'vendas@distribuidora.com.br',
  'Av. Industrial, 500 - São Paulo/SP',
  '30 dias',
  7,
  8.5,
  true
),
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'Auto Peças Premium',
  '11223344000155',
  'Ana Costa',
  '1155556666',
  'contato@autopecas.com.br',
  'Rua das Peças, 200 - São Paulo/SP',
  '45 dias',
  10,
  9.0,
  true
);

-- 7. CONTAS BANCÁRIAS (Bank Accounts)
INSERT INTO bank_accounts (
  org_id,
  bank_name,
  agency,
  account_number,
  account_type,
  balance,
  is_active
) VALUES (
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'Banco do Brasil',
  '1234-5',
  '12345678-9',
  'checking',
  50000.00,
  true
);

-- 8. CATEGORIAS DE DESPESAS (Expense Categories)
INSERT INTO expense_categories (
  org_id,
  name,
  category,
  description,
  is_active
) VALUES 
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'Compra de Peças',
  'supplier',
  'Aquisição de peças para estoque',
  true
),
(
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4',
  'Manutenção de Equipamentos',
  'maintenance',
  'Manutenção de máquinas e ferramentas',
  true
);