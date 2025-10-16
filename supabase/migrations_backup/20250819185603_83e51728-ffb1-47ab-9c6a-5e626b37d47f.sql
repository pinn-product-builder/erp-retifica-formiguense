-- Fix the previous migration by allowing NULL org_id for default data
-- Update KPIs table to allow NULL org_id for default data
ALTER TABLE public.kpis ALTER COLUMN org_id DROP NOT NULL;

-- Update quick_actions table to allow NULL org_id for default data  
ALTER TABLE public.quick_actions ALTER COLUMN org_id DROP NOT NULL;

-- Update status_config table to allow NULL org_id for default data
ALTER TABLE public.status_config ALTER COLUMN org_id DROP NOT NULL;

-- Update notification_types table to allow NULL org_id for default data
ALTER TABLE public.notification_types ALTER COLUMN org_id DROP NOT NULL;

-- Update search_sources table to allow NULL org_id for default data
ALTER TABLE public.search_sources ALTER COLUMN org_id DROP NOT NULL;

-- Update RLS policies to handle NULL org_id (global/default data)
DROP POLICY IF EXISTS "Users can manage KPIs for their organization" ON public.kpis;
CREATE POLICY "Users can manage KPIs for their organization"
ON public.kpis FOR ALL
USING (org_id = current_org_id() OR org_id IS NULL)
WITH CHECK (org_id = current_org_id());

DROP POLICY IF EXISTS "Users can manage quick actions for their organization" ON public.quick_actions;
CREATE POLICY "Users can manage quick actions for their organization"
ON public.quick_actions FOR ALL
USING (org_id = current_org_id() OR org_id IS NULL)
WITH CHECK (org_id = current_org_id());

DROP POLICY IF EXISTS "Users can manage status config for their organization" ON public.status_config;
CREATE POLICY "Users can manage status config for their organization"
ON public.status_config FOR ALL
USING (org_id = current_org_id() OR org_id IS NULL)
WITH CHECK (org_id = current_org_id());

DROP POLICY IF EXISTS "Users can manage notification types for their organization" ON public.notification_types;
CREATE POLICY "Users can manage notification types for their organization"
ON public.notification_types FOR ALL
USING (org_id = current_org_id() OR org_id IS NULL)
WITH CHECK (org_id = current_org_id());

DROP POLICY IF EXISTS "Users can manage search sources for their organization" ON public.search_sources;
CREATE POLICY "Users can manage search sources for their organization"
ON public.search_sources FOR ALL
USING (org_id = current_org_id() OR org_id IS NULL)
WITH CHECK (org_id = current_org_id());

-- Now insert the default data
INSERT INTO public.kpis (org_id, code, name, description, calculation_formula, unit, icon, color) VALUES
(NULL, 'total_orders', 'Total de Pedidos', 'Número total de pedidos no período', 'COUNT(orders)', 'number', 'Package', 'blue'),
(NULL, 'orders_in_progress', 'Pedidos em Andamento', 'Pedidos atualmente sendo processados', 'COUNT(orders WHERE status IN (''ativa'', ''em_andamento''))', 'number', 'Clock', 'orange'),
(NULL, 'completed_orders', 'Pedidos Concluídos', 'Pedidos finalizados no período', 'COUNT(orders WHERE status = ''concluida'')', 'number', 'CheckCircle', 'green'),
(NULL, 'pending_budget_approvals', 'Aprovações Pendentes', 'Orçamentos aguardando aprovação', 'COUNT(budgets WHERE status = ''pendente'')', 'number', 'AlertCircle', 'yellow');

INSERT INTO public.quick_actions (org_id, title, description, icon, href, variant, is_featured, display_order) VALUES
(NULL, 'Novo Pedido', 'Criar um novo pedido de serviço', 'Plus', '/coleta', 'default', true, 1),
(NULL, 'Consultar Status', 'Verificar status de pedidos', 'Search', '/workflow', 'outline', false, 2),
(NULL, 'Relatório DRE', 'Gerar demonstrativo de resultados', 'FileText', '/dre', 'outline', false, 3),
(NULL, 'Contas a Receber', 'Gerenciar recebimentos', 'CreditCard', '/contas-receber', 'outline', false, 4),
(NULL, 'Configurações', 'Acessar configurações do sistema', 'Settings', '/configuracoes', 'ghost', false, 5),
(NULL, 'Módulo Fiscal', 'Gerenciar questões fiscais', 'Calculator', '/modulo-fiscal', 'outline', true, 6);

INSERT INTO public.status_config (org_id, entity_type, status_key, status_label, badge_variant, color) VALUES
(NULL, 'order', 'ativa', 'Ativa', 'default', 'blue'),
(NULL, 'order', 'em_andamento', 'Em Andamento', 'secondary', 'orange'),
(NULL, 'order', 'concluida', 'Concluída', 'secondary', 'green'),
(NULL, 'order', 'cancelada', 'Cancelada', 'destructive', 'red'),
(NULL, 'priority', 'alta', 'Alta', 'destructive', 'red'),
(NULL, 'priority', 'media', 'Média', 'default', 'orange'),
(NULL, 'priority', 'baixa', 'Baixa', 'outline', 'green');

INSERT INTO public.notification_types (org_id, code, name, description, icon, color) VALUES
(NULL, 'order_status', 'Status de Pedido', 'Notificações sobre mudanças de status', 'Package', 'blue'),
(NULL, 'budget_approval', 'Aprovação de Orçamento', 'Notificações sobre aprovações pendentes', 'DollarSign', 'green'),
(NULL, 'system_alert', 'Alerta do Sistema', 'Alertas importantes do sistema', 'AlertTriangle', 'red'),
(NULL, 'reminder', 'Lembrete', 'Lembretes e tarefas pendentes', 'Clock', 'yellow');

INSERT INTO public.search_sources (org_id, source_name, source_type, table_name, search_fields, display_fields, result_template) VALUES
(NULL, 'pedidos', 'table', 'orders', '["order_number", "failure_reason"]', '["order_number", "status", "collection_date"]', 'Pedido {order_number} - {status}'),
(NULL, 'clientes', 'table', 'customers', '["name", "document", "email"]', '["name", "document", "phone"]', '{name} - {document}'),
(NULL, 'motores', 'table', 'engines', '["brand", "model", "serial_number"]', '["brand", "model", "type"]', '{brand} {model} - {type}');