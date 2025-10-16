-- Create RLS policies for all dashboard tables
CREATE POLICY "Users can manage dashboard preferences for their organization"
ON public.dashboard_preferences FOR ALL
USING (org_id = current_org_id() OR org_id IS NULL)
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can view KPIs for their organization"
ON public.kpis FOR SELECT
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Admins can manage KPIs for their organization"
ON public.kpis FOR ALL
USING (org_id = current_org_id() AND has_org_role(org_id, 'admin'::app_role))
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can view KPI targets for their organization"
ON public.kpi_targets FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.kpis k 
  WHERE k.id = kpi_targets.kpi_id 
  AND (k.org_id = current_org_id() OR k.org_id IS NULL)
));

CREATE POLICY "Admins can manage KPI targets for their organization"
ON public.kpi_targets FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.kpis k 
  WHERE k.id = kpi_targets.kpi_id 
  AND k.org_id = current_org_id()
  AND has_org_role(k.org_id, 'admin'::app_role)
));

CREATE POLICY "Users can view quick actions for their organization"
ON public.quick_actions FOR SELECT
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Admins can manage quick actions for their organization"
ON public.quick_actions FOR ALL
USING (org_id = current_org_id() AND has_org_role(org_id, 'admin'::app_role))
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can view status config for their organization"
ON public.status_config FOR SELECT
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Admins can manage status config for their organization"
ON public.status_config FOR ALL
USING (org_id = current_org_id() AND has_org_role(org_id, 'admin'::app_role))
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can view notification types for their organization"
ON public.notification_types FOR SELECT
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Admins can manage notification types for their organization"
ON public.notification_types FOR ALL
USING (org_id = current_org_id() AND has_org_role(org_id, 'admin'::app_role))
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can view notifications for their organization"
ON public.notifications FOR SELECT
USING (org_id = current_org_id() AND (is_global = true OR user_id = auth.uid()));

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (org_id = current_org_id() AND user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can view search sources for their organization"
ON public.search_sources FOR SELECT
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Admins can manage search sources for their organization"
ON public.search_sources FOR ALL
USING (org_id = current_org_id() AND has_org_role(org_id, 'admin'::app_role))
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can view alerts for their organization"
ON public.alerts FOR SELECT
USING (org_id = current_org_id());

CREATE POLICY "Admins can manage alerts for their organization"
ON public.alerts FOR ALL
USING (org_id = current_org_id() AND has_org_role(org_id, 'admin'::app_role))
WITH CHECK (org_id = current_org_id());

-- Add update triggers
CREATE TRIGGER update_dashboard_preferences_updated_at
  BEFORE UPDATE ON public.dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at
  BEFORE UPDATE ON public.kpis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kpi_targets_updated_at
  BEFORE UPDATE ON public.kpi_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quick_actions_updated_at
  BEFORE UPDATE ON public.quick_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_status_config_updated_at
  BEFORE UPDATE ON public.status_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_types_updated_at
  BEFORE UPDATE ON public.notification_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_search_sources_updated_at
  BEFORE UPDATE ON public.search_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default data
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