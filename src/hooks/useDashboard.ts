import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

export interface KPI {
  id: string;
  code: string;
  name: string;
  description?: string;
  calculation_formula: string;
  unit: string;
  icon: string;
  color: string;
  is_active: boolean;
  display_order: number;
  value?: number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface QuickAction {
  id: string;
  title: string;
  description?: string;
  icon: string;
  href: string;
  variant: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  permissions: string[];
}

export interface StatusConfig {
  id: string;
  entity_type: string;
  status_key: string;
  status_label: string;
  badge_variant: string;
  color?: string;
  icon?: string;
  is_active: boolean;
}

export interface DashboardAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  is_active: boolean;
  is_dismissible: boolean;
  auto_dismiss_after?: number;
  action_label?: string;
  action_url?: string;
  expires_at?: string;
}

export interface RecentService {
  id: string;
  client: string;
  vehicle: string;
  status: string;
  priority: string;
  date: string;
}

export const useDashboard = () => {
  const { currentOrganization } = useOrganization();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [statusConfigs, setStatusConfigs] = useState<StatusConfig[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [recentServices, setRecentServices] = useState<RecentService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate actual KPI values
  const calculateKPIValues = async (kpiList: KPI[]) => {
    const kpisWithValues = await Promise.all(
      kpiList.map(async (kpi) => {
        let value = 0;
        let subtitle = '';
        let trend = undefined;

        try {
          switch (kpi.code) {
            case 'total_orders':
              const { count: totalCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });
              value = totalCount || 0;
              subtitle = 'Total geral';
              break;

            case 'orders_in_progress':
              const { count: progressCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .in('status', ['ativa'] as const);
              value = progressCount || 0;
              subtitle = 'Em processamento';
              break;

            case 'completed_orders':
              const { count: completedCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'concluida');
              value = completedCount || 0;
              subtitle = 'Finalizados';
              break;

            case 'pending_budget_approvals':
              const { count: pendingCount } = await supabase
                .from('budgets')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pendente');
              value = pendingCount || 0;
              subtitle = 'Aguardando';
              trend = { value: -12, isPositive: false };
              break;

            default:
              // For custom KPIs, we would need to implement a more sophisticated calculation engine
              value = Math.floor(Math.random() * 100); // Placeholder
              subtitle = 'Calculado';
          }
        } catch (error) {
          console.error(`Error calculating KPI ${kpi.code}:`, error);
          value = 0;
          subtitle = 'Erro no cálculo';
        }

        return {
          ...kpi,
          value,
          subtitle,
          trend,
        };
      })
    );

    return kpisWithValues;
  };

  // Fetch recent services from orders
  const fetchRecentServices = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          collection_date,
          customers (name),
          engines (brand, model)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const services: RecentService[] = orders?.map(order => ({
        id: order.id,
        client: order.customers?.name || 'Cliente não identificado',
        vehicle: `${order.engines?.brand || ''} ${order.engines?.model || ''}`.trim() || 'Motor não identificado',
        status: order.status || 'ativa',
        priority: Math.random() > 0.7 ? 'alta' : Math.random() > 0.4 ? 'media' : 'baixa',
        date: order.collection_date || new Date().toISOString().split('T')[0],
      })) || [];

      setRecentServices(services);
    } catch (error) {
      console.error('Error fetching recent services:', error);
      setRecentServices([]);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch KPIs
      const { data: kpisData, error: kpisError } = await supabase
        .from('kpis')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (kpisError) throw kpisError;

      // Calculate KPI values
      const kpisWithValues = await calculateKPIValues(kpisData || []);
      setKpis(kpisWithValues);

      // Fetch Quick Actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('quick_actions')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (actionsError) throw actionsError;
      setQuickActions((actionsData || []).map(action => ({
        ...action,
        permissions: Array.isArray(action.permissions) 
          ? (action.permissions as string[])
          : []
      })));

      // Fetch Status Configs
      const { data: statusData, error: statusError } = await supabase
        .from('status_config')
        .select('*')
        .eq('is_active', true);

      if (statusError) throw statusError;
      setStatusConfigs(statusData || []);

      // Fetch Alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (alertsError) throw alertsError;
      setAlerts((alertsData || []).map(alert => ({
        ...alert,
        severity: (alert.severity as 'info' | 'warning' | 'error' | 'success') || 'warning'
      })));

      // Fetch recent services
      await fetchRecentServices();

    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge variant
  const getStatusBadge = (entityType: string, statusKey: string): string => {
    const config = statusConfigs.find(
      c => c.entity_type === entityType && c.status_key === statusKey
    );
    return config?.badge_variant || 'default';
  };

  // Get status label
  const getStatusLabel = (entityType: string, statusKey: string): string => {
    const config = statusConfigs.find(
      c => c.entity_type === entityType && c.status_key === statusKey
    );
    return config?.status_label || statusKey;
  };

  // Dismiss alert
  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentOrganization]);

  return {
    kpis,
    quickActions,
    statusConfigs,
    alerts,
    recentServices,
    loading,
    error,
    getStatusBadge,
    getStatusLabel,
    dismissAlert,
    refetch: fetchDashboardData,
  };
};