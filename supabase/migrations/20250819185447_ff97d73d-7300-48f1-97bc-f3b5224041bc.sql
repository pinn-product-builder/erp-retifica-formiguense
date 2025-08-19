-- Create dashboard preferences table
CREATE TABLE public.dashboard_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  user_id UUID,
  preference_type TEXT NOT NULL CHECK (preference_type IN ('layout', 'theme', 'widgets', 'filters')),
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL DEFAULT '{}',
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, preference_type, preference_key)
);

-- Create KPIs configuration table
CREATE TABLE public.kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  calculation_formula TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'number',
  icon TEXT NOT NULL DEFAULT 'TrendingUp',
  color TEXT NOT NULL DEFAULT 'primary',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, code)
);

-- Create KPI targets table
CREATE TABLE public.kpi_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kpi_id UUID NOT NULL REFERENCES public.kpis(id) ON DELETE CASCADE,
  target_value NUMERIC NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quick actions configuration table
CREATE TABLE public.quick_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Plus',
  href TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'outline',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create status configuration table
CREATE TABLE public.status_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  status_key TEXT NOT NULL,
  status_label TEXT NOT NULL,
  badge_variant TEXT NOT NULL DEFAULT 'default',
  color TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, entity_type, status_key)
);

-- Create notification types table
CREATE TABLE public.notification_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Bell',
  color TEXT NOT NULL DEFAULT 'blue',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, code)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  user_id UUID,
  notification_type_id UUID NOT NULL REFERENCES public.notification_types(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_global BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification rules table
CREATE TABLE public.notification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  notification_type_id UUID NOT NULL REFERENCES public.notification_types(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  condition_expression TEXT NOT NULL,
  target_users JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user notification preferences table
CREATE TABLE public.user_notification_prefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  org_id UUID NOT NULL,
  notification_type_id UUID NOT NULL REFERENCES public.notification_types(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  browser_enabled BOOLEAN NOT NULL DEFAULT true,
  mobile_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id, notification_type_id)
);

-- Create search sources table
CREATE TABLE public.search_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('table', 'view', 'function', 'external')),
  table_name TEXT,
  search_fields JSONB NOT NULL DEFAULT '[]',
  display_fields JSONB NOT NULL DEFAULT '[]',
  result_template TEXT,
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  weight INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, source_name)
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_dismissible BOOLEAN NOT NULL DEFAULT true,
  auto_dismiss_after INTEGER, -- minutes
  target_users JSONB DEFAULT '[]',
  action_label TEXT,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dashboard_preferences
CREATE POLICY "Users can manage dashboard preferences for their organization"
ON public.dashboard_preferences FOR ALL
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

-- Create RLS policies for kpis
CREATE POLICY "Users can manage KPIs for their organization"
ON public.kpis FOR ALL
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

-- Create RLS policies for kpi_targets
CREATE POLICY "Users can manage KPI targets for their organization"
ON public.kpi_targets FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.kpis k 
  WHERE k.id = kpi_targets.kpi_id 
  AND k.org_id = current_org_id()
));

-- Create RLS policies for quick_actions
CREATE POLICY "Users can manage quick actions for their organization"
ON public.quick_actions FOR ALL
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

-- Create RLS policies for status_config
CREATE POLICY "Users can manage status config for their organization"
ON public.status_config FOR ALL
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

-- Create RLS policies for notification_types
CREATE POLICY "Users can manage notification types for their organization"
ON public.notification_types FOR ALL
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

-- Create RLS policies for notifications
CREATE POLICY "Users can view notifications for their organization"
ON public.notifications FOR SELECT
USING (org_id = current_org_id() AND (is_global = true OR user_id = auth.uid()));

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (org_id = current_org_id() AND user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (org_id = current_org_id());

-- Create RLS policies for notification_rules
CREATE POLICY "Users can manage notification rules for their organization"
ON public.notification_rules FOR ALL
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

-- Create RLS policies for user_notification_prefs
CREATE POLICY "Users can manage their own notification preferences"
ON public.user_notification_prefs FOR ALL
USING (user_id = auth.uid() AND org_id = current_org_id())
WITH CHECK (user_id = auth.uid() AND org_id = current_org_id());

-- Create RLS policies for search_sources
CREATE POLICY "Users can manage search sources for their organization"
ON public.search_sources FOR ALL
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

-- Create RLS policies for alerts
CREATE POLICY "Users can view alerts for their organization"
ON public.alerts FOR SELECT
USING (org_id = current_org_id());

CREATE POLICY "Admins can manage alerts for their organization"
ON public.alerts FOR ALL
USING (org_id = current_org_id() AND has_org_role(org_id, 'admin'::app_role))
WITH CHECK (org_id = current_org_id() AND has_org_role(org_id, 'admin'::app_role));

-- Create triggers for updated_at
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

CREATE TRIGGER update_notification_rules_updated_at
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_notification_prefs_updated_at
  BEFORE UPDATE ON public.user_notification_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_search_sources_updated_at
  BEFORE UPDATE ON public.search_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default KPIs for organizations
INSERT INTO public.kpis (org_id, code, name, description, calculation_formula, unit, icon, color) VALUES
(NULL, 'total_orders', 'Total de Pedidos', 'Número total de pedidos no período', 'COUNT(orders)', 'number', 'Package', 'blue'),
(NULL, 'orders_in_progress', 'Pedidos em Andamento', 'Pedidos atualmente sendo processados', 'COUNT(orders WHERE status IN (''ativa'', ''em_andamento''))', 'number', 'Clock', 'orange'),
(NULL, 'completed_orders', 'Pedidos Concluídos', 'Pedidos finalizados no período', 'COUNT(orders WHERE status = ''concluida'')', 'number', 'CheckCircle', 'green'),
(NULL, 'pending_budget_approvals', 'Aprovações Pendentes', 'Orçamentos aguardando aprovação', 'COUNT(budgets WHERE status = ''pendente'')', 'number', 'AlertCircle', 'yellow');

-- Insert default quick actions
INSERT INTO public.quick_actions (org_id, title, description, icon, href, variant, is_featured, display_order) VALUES
(NULL, 'Novo Pedido', 'Criar um novo pedido de serviço', 'Plus', '/coleta', 'default', true, 1),
(NULL, 'Consultar Status', 'Verificar status de pedidos', 'Search', '/workflow', 'outline', false, 2),
(NULL, 'Relatório DRE', 'Gerar demonstrativo de resultados', 'FileText', '/dre', 'outline', false, 3),
(NULL, 'Contas a Receber', 'Gerenciar recebimentos', 'CreditCard', '/contas-receber', 'outline', false, 4),
(NULL, 'Configurações', 'Acessar configurações do sistema', 'Settings', '/configuracoes', 'ghost', false, 5),
(NULL, 'Módulo Fiscal', 'Gerenciar questões fiscais', 'Calculator', '/modulo-fiscal', 'outline', true, 6);

-- Insert default status configurations
INSERT INTO public.status_config (org_id, entity_type, status_key, status_label, badge_variant, color) VALUES
(NULL, 'order', 'ativa', 'Ativa', 'default', 'blue'),
(NULL, 'order', 'em_andamento', 'Em Andamento', 'secondary', 'orange'),
(NULL, 'order', 'concluida', 'Concluída', 'secondary', 'green'),
(NULL, 'order', 'cancelada', 'Cancelada', 'destructive', 'red'),
(NULL, 'priority', 'alta', 'Alta', 'destructive', 'red'),
(NULL, 'priority', 'media', 'Média', 'default', 'orange'),
(NULL, 'priority', 'baixa', 'Baixa', 'outline', 'green');

-- Insert default notification types
INSERT INTO public.notification_types (org_id, code, name, description, icon, color) VALUES
(NULL, 'order_status', 'Status de Pedido', 'Notificações sobre mudanças de status', 'Package', 'blue'),
(NULL, 'budget_approval', 'Aprovação de Orçamento', 'Notificações sobre aprovações pendentes', 'DollarSign', 'green'),
(NULL, 'system_alert', 'Alerta do Sistema', 'Alertas importantes do sistema', 'AlertTriangle', 'red'),
(NULL, 'reminder', 'Lembrete', 'Lembretes e tarefas pendentes', 'Clock', 'yellow');

-- Insert default search sources
INSERT INTO public.search_sources (org_id, source_name, source_type, table_name, search_fields, display_fields, result_template) VALUES
(NULL, 'pedidos', 'table', 'orders', '["order_number", "failure_reason"]', '["order_number", "status", "collection_date"]', 'Pedido {order_number} - {status}'),
(NULL, 'clientes', 'table', 'customers', '["name", "document", "email"]', '["name", "document", "phone"]', '{name} - {document}'),
(NULL, 'motores', 'table', 'engines', '["brand", "model", "serial_number"]', '["brand", "model", "type"]', '{brand} {model} - {type}');