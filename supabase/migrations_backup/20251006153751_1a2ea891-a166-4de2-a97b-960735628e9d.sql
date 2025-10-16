-- Inserir dados de teste triplicados para Favarini Motores
-- org_id: 7217960b-ed55-416b-8ef7-f68a728c7bad

-- ====================================
-- 1. FUNCIONÁRIOS (6)
-- ====================================
INSERT INTO employees (id, org_id, employee_number, full_name, position, department, email, phone, cpf, hire_date, salary, is_active) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'EMP-001', 'Roberto Silva', 'Mecânico Sênior', 'Produção', 'roberto.silva@favarini.com', '(11) 98765-4321', '123.456.789-01', '2020-03-15', 4500.00, true),
('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'EMP-002', 'Ana Costa', 'Supervisora de Qualidade', 'Qualidade', 'ana.costa@favarini.com', '(11) 98765-4322', '234.567.890-12', '2019-07-20', 5200.00, true),
('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'EMP-003', 'Carlos Mendes', 'Torneiro Mecânico', 'Produção', 'carlos.mendes@favarini.com', '(11) 98765-4323', '345.678.901-23', '2021-01-10', 3800.00, true),
('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'EMP-004', 'Juliana Santos', 'Técnica de Metrologia', 'Qualidade', 'juliana.santos@favarini.com', '(11) 98765-4324', '456.789.012-34', '2020-11-05', 4200.00, true),
('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'EMP-005', 'Pedro Oliveira', 'Auxiliar de Produção', 'Produção', 'pedro.oliveira@favarini.com', '(11) 98765-4325', '567.890.123-45', '2022-05-18', 2800.00, true),
('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'EMP-006', 'Mariana Lima', 'Coordenadora de Compras', 'Compras', 'mariana.lima@favarini.com', '(11) 98765-4326', '678.901.234-56', '2019-02-12', 4800.00, true);

-- ====================================
-- 2. FORNECEDORES (6)
-- ====================================
INSERT INTO suppliers (id, org_id, name, cnpj, email, phone, address, contact_person, payment_terms, delivery_days, rating, is_active) VALUES
('11111111-2222-3333-4444-555555555551', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Peças Premium Ltda', '12.345.678/0001-90', 'contato@pecaspremium.com.br', '(11) 3456-7890', 'Av. Industrial, 1234 - São Paulo/SP', 'João Ferreira', 'Net 30', 5, 9.5, true),
('11111111-2222-3333-4444-555555555552', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Distribuidora Central de Autopeças', '23.456.789/0001-01', 'vendas@centralautopecas.com.br', '(11) 3456-7891', 'Rua Comercial, 567 - São Paulo/SP', 'Maria Souza', 'Net 45', 7, 8.8, true),
('11111111-2222-3333-4444-555555555553', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Importadora Nordic Parts', '34.567.890/0001-12', 'info@nordicparts.com.br', '(11) 3456-7892', 'Av. Europa, 890 - São Paulo/SP', 'Lars Anderson', 'Net 60', 15, 9.2, true),
('11111111-2222-3333-4444-555555555554', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Comercial Diesel Brasil', '45.678.901/0001-23', 'comercial@dieselbrasil.com.br', '(11) 3456-7893', 'Rod. Anchieta, km 15 - São Paulo/SP', 'Carlos Alberto', 'Net 30', 8, 8.5, true),
('11111111-2222-3333-4444-555555555555', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Autopeças Europa Imports', '56.789.012/0001-34', 'vendas@europaimports.com.br', '(11) 3456-7894', 'Av. Paulista, 2000 - São Paulo/SP', 'Ricardo Almeida', 'Net 45', 12, 9.0, true),
('11111111-2222-3333-4444-555555555556', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Fornecedor Master Diesel', '67.890.123/0001-45', 'atendimento@masterdiesel.com.br', '(11) 3456-7895', 'Rua das Máquinas, 456 - São Paulo/SP', 'Paulo Santos', 'Net 30', 6, 8.7, true);

-- ====================================
-- 3. PEÇAS NO INVENTÁRIO (15)
-- ====================================
INSERT INTO parts_inventory (id, org_id, part_code, part_name, quantity, unit_cost, supplier, status) VALUES
('22222222-3333-4444-5555-666666666661', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BIELA-SCANIA-DC13', 'Biela Scania DC13', 15, 850.00, 'Peças Premium Ltda', 'disponivel'),
('22222222-3333-4444-5555-666666666662', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'PISTAO-SCANIA-DC13', 'Pistão Scania DC13', 12, 650.00, 'Peças Premium Ltda', 'disponivel'),
('22222222-3333-4444-5555-666666666663', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BRONZINA-SCANIA-DC13', 'Bronzina Scania DC13', 20, 380.00, 'Peças Premium Ltda', 'disponivel'),
('22222222-3333-4444-5555-666666666664', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'PISTAO-VOLVO-D12', 'Pistão Volvo D12', 8, 720.00, 'Distribuidora Central de Autopeças', 'disponivel'),
('22222222-3333-4444-5555-666666666665', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BIELA-VOLVO-D12', 'Biela Volvo D12', 10, 890.00, 'Distribuidora Central de Autopeças', 'disponivel'),
('22222222-3333-4444-5555-666666666666', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'ANEL-VOLVO-D12', 'Anel Volvo D12', 18, 290.00, 'Distribuidora Central de Autopeças', 'disponivel'),
('22222222-3333-4444-5555-666666666667', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BRONZINA-MAN-D26', 'Bronzina MAN D26', 25, 420.00, 'Importadora Nordic Parts', 'disponivel'),
('22222222-3333-4444-5555-666666666668', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'VIRABREQUIM-MAN-D26', 'Virabrequim MAN D26', 3, 3200.00, 'Importadora Nordic Parts', 'disponivel'),
('22222222-3333-4444-5555-666666666669', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'COMANDO-VALVULAS-MAN-D26', 'Comando Válvulas MAN D26', 5, 1850.00, 'Importadora Nordic Parts', 'disponivel'),
('22222222-3333-4444-5555-666666666670', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'ANEL-CUMMINS-ISX15', 'Anel Cummins ISX15', 12, 340.00, 'Comercial Diesel Brasil', 'disponivel'),
('22222222-3333-4444-5555-666666666671', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BRONZINA-CUMMINS-ISX15', 'Bronzina Cummins ISX15', 22, 460.00, 'Comercial Diesel Brasil', 'disponivel'),
('22222222-3333-4444-5555-666666666672', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'PISTAO-CUMMINS-ISX15', 'Pistão Cummins ISX15', 9, 780.00, 'Comercial Diesel Brasil', 'disponivel'),
('22222222-3333-4444-5555-666666666673', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'JUNTA-CABECOTE-IVECO-CURSOR13', 'Junta Cabeçote Iveco Cursor 13', 6, 520.00, 'Autopeças Europa Imports', 'disponivel'),
('22222222-3333-4444-5555-666666666674', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BIELA-IVECO-CURSOR13', 'Biela Iveco Cursor 13', 7, 920.00, 'Autopeças Europa Imports', 'disponivel'),
('22222222-3333-4444-5555-666666666675', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'ANEL-IVECO-CURSOR13', 'Anel Iveco Cursor 13', 14, 310.00, 'Autopeças Europa Imports', 'disponivel');

-- ====================================
-- 4. CONFIGURAÇÕES DE ESTOQUE (15)
-- ====================================
INSERT INTO parts_stock_config (id, org_id, part_code, part_name, minimum_stock, maximum_stock, reorder_point, economic_order_quantity, lead_time_days, preferred_supplier_id) VALUES
('33333333-4444-5555-6666-777777777771', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BIELA-SCANIA-DC13', 'Biela Scania DC13', 5, 25, 8, 15, 7, '11111111-2222-3333-4444-555555555551'),
('33333333-4444-5555-6666-777777777772', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'PISTAO-SCANIA-DC13', 'Pistão Scania DC13', 5, 20, 7, 12, 7, '11111111-2222-3333-4444-555555555551'),
('33333333-4444-5555-6666-777777777773', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BRONZINA-SCANIA-DC13', 'Bronzina Scania DC13', 8, 30, 12, 20, 5, '11111111-2222-3333-4444-555555555551'),
('33333333-4444-5555-6666-777777777774', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'PISTAO-VOLVO-D12', 'Pistão Volvo D12', 3, 15, 5, 10, 10, '11111111-2222-3333-4444-555555555552'),
('33333333-4444-5555-6666-777777777775', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BIELA-VOLVO-D12', 'Biela Volvo D12', 4, 18, 6, 12, 10, '11111111-2222-3333-4444-555555555552'),
('33333333-4444-5555-6666-777777777776', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'ANEL-VOLVO-D12', 'Anel Volvo D12', 6, 25, 10, 18, 8, '11111111-2222-3333-4444-555555555552'),
('33333333-4444-5555-6666-777777777777', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BRONZINA-MAN-D26', 'Bronzina MAN D26', 10, 35, 15, 25, 15, '11111111-2222-3333-4444-555555555553'),
('33333333-4444-5555-6666-777777777778', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'VIRABREQUIM-MAN-D26', 'Virabrequim MAN D26', 1, 5, 2, 3, 20, '11111111-2222-3333-4444-555555555553'),
('33333333-4444-5555-6666-777777777779', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'COMANDO-VALVULAS-MAN-D26', 'Comando Válvulas MAN D26', 2, 8, 3, 5, 18, '11111111-2222-3333-4444-555555555553'),
('33333333-4444-5555-6666-777777777780', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'ANEL-CUMMINS-ISX15', 'Anel Cummins ISX15', 5, 20, 8, 12, 12, '11111111-2222-3333-4444-555555555554'),
('33333333-4444-5555-6666-777777777781', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BRONZINA-CUMMINS-ISX15', 'Bronzina Cummins ISX15', 8, 30, 12, 22, 12, '11111111-2222-3333-4444-555555555554'),
('33333333-4444-5555-6666-777777777782', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'PISTAO-CUMMINS-ISX15', 'Pistão Cummins ISX15', 4, 15, 6, 9, 14, '11111111-2222-3333-4444-555555555554'),
('33333333-4444-5555-6666-777777777783', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'JUNTA-CABECOTE-IVECO-CURSOR13', 'Junta Cabeçote Iveco Cursor 13', 3, 12, 5, 8, 10, '11111111-2222-3333-4444-555555555555'),
('33333333-4444-5555-6666-777777777784', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'BIELA-IVECO-CURSOR13', 'Biela Iveco Cursor 13', 3, 12, 5, 8, 12, '11111111-2222-3333-4444-555555555555'),
('33333333-4444-5555-6666-777777777785', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'ANEL-IVECO-CURSOR13', 'Anel Iveco Cursor 13', 6, 22, 9, 14, 11, '11111111-2222-3333-4444-555555555555');

-- ====================================
-- 5. CLIENTES (6 novos)
-- ====================================
INSERT INTO customers (id, org_id, name, type, document, email, phone, address) VALUES
('44444444-5555-6666-7777-888888888881', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Transportadora Rápida Express', 'direto', '12.345.678/0001-99', 'contato@rapidaexpress.com.br', '(11) 2345-6789', 'Av. Logística, 1500 - São Paulo/SP'),
('44444444-5555-6666-7777-888888888882', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Logística Santos & Cia', 'direto', '23.456.789/0001-00', 'logistica@santoscia.com.br', '(13) 3456-7890', 'Rod. Anchieta, km 25 - Santos/SP'),
('44444444-5555-6666-7777-888888888883', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Frota Pesada Transportes', 'direto', '34.567.890/0001-11', 'frotas@frotapesada.com.br', '(11) 4567-8901', 'Av. dos Caminhoneiros, 800 - Guarulhos/SP'),
('44444444-5555-6666-7777-888888888884', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'AutoMecânica Silva & Filhos', 'oficina', '45.678.901/0001-22', 'contato@silvafilhos.com.br', '(11) 5678-9012', 'Rua das Oficinas, 234 - São Paulo/SP'),
('44444444-5555-6666-7777-888888888885', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Retífica Precisa Diesel', 'oficina', '56.789.012/0001-33', 'atendimento@precisadiesel.com.br', '(11) 6789-0123', 'Av. Industrial, 567 - São Bernardo/SP'),
('44444444-5555-6666-7777-888888888886', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Oficina Turbo Diesel', 'oficina', '67.890.123/0001-44', 'vendas@turbodiesel.com.br', '(11) 7890-1234', 'Rua do Comércio, 890 - Diadema/SP');

-- ====================================
-- 6. MOTORES (6 novos)
-- ====================================
INSERT INTO engines (id, org_id, brand, model, type, fuel_type, serial_number) VALUES
('55555555-6666-7777-8888-999999999991', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Scania', 'DC13', 'V8', 'Diesel', 'SCANIA-DC13-2023-001'),
('55555555-6666-7777-8888-999999999992', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Volvo', 'D12', 'In-Line 6', 'Diesel', 'VOLVO-D12-2022-045'),
('55555555-6666-7777-8888-999999999993', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'MAN', 'D26', 'In-Line 6', 'Diesel', 'MAN-D26-2023-078'),
('55555555-6666-7777-8888-999999999994', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Cummins', 'ISX15', 'In-Line 6', 'Diesel', 'CUMMINS-ISX15-2021-112'),
('55555555-6666-7777-8888-999999999995', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Iveco', 'Cursor 13', 'In-Line 6', 'Diesel', 'IVECO-CUR13-2022-089'),
('55555555-6666-7777-8888-999999999996', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Mercedes-Benz', 'OM457', 'In-Line 6', 'Diesel', 'MB-OM457-2023-034');

-- ====================================
-- 7. CONTAS BANCÁRIAS (3)
-- ====================================
INSERT INTO bank_accounts (id, org_id, bank_name, agency, account_number, account_type, balance, is_active) VALUES
('66666666-7777-8888-9999-000000000001', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Banco do Brasil', '1234-5', '12345678-9', 'checking', 125000.00, true),
('66666666-7777-8888-9999-000000000002', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Itaú', '0567', '98765432-1', 'business', 85000.00, true),
('66666666-7777-8888-9999-000000000003', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Santander', '2345', '11223344-5', 'checking', 52000.00, true);

-- ====================================
-- 8. CATEGORIAS DE DESPESAS (6)
-- ====================================
INSERT INTO expense_categories (id, org_id, name, category, description, is_active) VALUES
('77777777-8888-9999-0000-111111111111', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Aquisição de Peças', 'supplier', 'Compra de peças e componentes', true),
('77777777-8888-9999-0000-111111111112', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Manutenção Preventiva', 'maintenance', 'Manutenção de máquinas e equipamentos', true),
('77777777-8888-9999-0000-111111111113', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Ferramentas e Equipamentos', 'equipment', 'Compra de ferramentas e novos equipamentos', true),
('77777777-8888-9999-0000-111111111114', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Salários e Encargos', 'salary', 'Folha de pagamento e encargos trabalhistas', true),
('77777777-8888-9999-0000-111111111115', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Custos Fixos', 'fixed', 'Aluguel, energia, água e outros custos fixos', true),
('77777777-8888-9999-0000-111111111116', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'Custos Variáveis', 'variable', 'Materiais diversos e outros custos variáveis', true);