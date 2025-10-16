-- Popular tabela de páginas do sistema
INSERT INTO public.system_pages (name, display_name, description, route_path, module, icon) VALUES
-- Dashboard
('dashboard', 'Dashboard', 'Painel principal do sistema', '/dashboard', 'dashboard', 'LayoutDashboard'),

-- Fiscal
('fiscal-dashboard', 'Dashboard Fiscal', 'Painel de controle fiscal', '/fiscal', 'fiscal', 'FileText'),
('tax-calculations', 'Cálculos Fiscais', 'Cálculos de impostos', '/fiscal/calculations', 'fiscal', 'Calculator'),
('fiscal-obligations', 'Obrigações Fiscais', 'Gerenciar obrigações fiscais', '/fiscal/obligations', 'fiscal', 'ClipboardList'),
('fiscal-reports', 'Relatórios Fiscais', 'Relatórios fiscais e tributários', '/fiscal/reports', 'fiscal', 'FileBarChart'),

-- Financeiro
('financial-dashboard', 'Dashboard Financeiro', 'Painel financeiro', '/financial', 'financial', 'DollarSign'),
('accounts-payable', 'Contas a Pagar', 'Gerenciar contas a pagar', '/financial/payable', 'financial', 'CreditCard'),
('accounts-receivable', 'Contas a Receber', 'Gerenciar contas a receber', '/financial/receivable', 'financial', 'Banknote'),
('cash-flow', 'Fluxo de Caixa', 'Controle de fluxo de caixa', '/financial/cash-flow', 'financial', 'TrendingUp'),
('bank-accounts', 'Contas Bancárias', 'Gerenciar contas bancárias', '/financial/banks', 'financial', 'Building2'),

-- Produção
('production-dashboard', 'Dashboard Produção', 'Painel de produção', '/production', 'production', 'Factory'),
('orders', 'Ordens de Serviço', 'Gerenciar ordens de serviço', '/production/orders', 'production', 'ClipboardCheck'),
('workflow', 'Fluxo de Trabalho', 'Controle do fluxo de produção', '/production/workflow', 'production', 'GitBranch'),
('production-schedule', 'Cronograma', 'Programação da produção', '/production/schedule', 'production', 'Calendar'),
('quality-control', 'Controle de Qualidade', 'Controle de qualidade', '/production/quality', 'production', 'CheckCircle'),

-- Estoque
('inventory-dashboard', 'Dashboard Estoque', 'Painel de estoque', '/inventory', 'inventory', 'Package'),
('parts-inventory', 'Estoque de Peças', 'Gerenciar estoque de peças', '/inventory/parts', 'inventory', 'Wrench'),
('inventory-movements', 'Movimentações', 'Movimentações de estoque', '/inventory/movements', 'inventory', 'ArrowRightLeft'),

-- Compras
('purchasing-dashboard', 'Dashboard Compras', 'Painel de compras', '/purchasing', 'purchasing', 'ShoppingCart'),
('purchase-requisitions', 'Requisições', 'Requisições de compra', '/purchasing/requisitions', 'purchasing', 'FileText'),
('purchase-orders', 'Ordens de Compra', 'Ordens de compra', '/purchasing/orders', 'purchasing', 'ShoppingBag'),
('suppliers', 'Fornecedores', 'Gerenciar fornecedores', '/purchasing/suppliers', 'purchasing', 'Truck'),
('quotations', 'Cotações', 'Gerenciar cotações', '/purchasing/quotations', 'purchasing', 'FileSearch'),

-- Recursos Humanos
('hr-dashboard', 'Dashboard RH', 'Painel de recursos humanos', '/hr', 'hr', 'Users'),
('employees', 'Funcionários', 'Gerenciar funcionários', '/hr/employees', 'hr', 'User'),
('time-tracking', 'Controle de Ponto', 'Controle de ponto dos funcionários', '/hr/time-tracking', 'hr', 'Clock'),
('performance-reviews', 'Avaliações', 'Avaliações de desempenho', '/hr/performance', 'hr', 'Star'),
('commissions', 'Comissões', 'Cálculo de comissões', '/hr/commissions', 'hr', 'Percent'),

-- Clientes
('customers', 'Clientes', 'Gerenciar clientes', '/customers', 'customers', 'UserCheck'),

-- Relatórios
('reports-dashboard', 'Dashboard Relatórios', 'Painel de relatórios', '/reports', 'reports', 'BarChart3'),
('financial-reports', 'Relatórios Financeiros', 'Relatórios financeiros', '/reports/financial', 'reports', 'TrendingUp'),
('production-reports', 'Relatórios Produção', 'Relatórios de produção', '/reports/production', 'reports', 'Factory'),
('kpi-dashboard', 'KPIs', 'Indicadores de performance', '/reports/kpis', 'reports', 'Target'),

-- Administração
('admin-dashboard', 'Dashboard Admin', 'Painel administrativo', '/admin', 'admin', 'Settings'),
('user-management', 'Gestão de Usuários', 'Gerenciar usuários do sistema', '/gestao-usuarios', 'admin', 'Users'),
('user-profiles', 'Perfis de Usuário', 'Gerenciar perfis e permissões', '/gestao-usuarios/perfis', 'admin', 'UserCog'),
('system-config', 'Configurações', 'Configurações do sistema', '/admin/config', 'admin', 'Settings'),
('system-alerts', 'Alertas do Sistema', 'Gerenciar alertas', '/admin/alerts', 'admin', 'Bell'),

-- Configurações
('organization-settings', 'Configurações Org.', 'Configurações da organização', '/settings/organization', 'settings', 'Building');

-- Atualizar páginas para ativas
UPDATE public.system_pages SET is_active = true;
