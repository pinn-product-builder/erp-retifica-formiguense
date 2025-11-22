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
  formattedValue?: string; // Valor formatado para exibição
  calculationInfo?: string; // Descrição de como o cálculo é feito
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
  count?: number; // Contador dinâmico
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

  // Função para formatar valores baseado na unidade
  const formatValue = (value: number, unit: string): string => {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value);
      
      case 'percentage':
        return new Intl.NumberFormat('pt-BR', {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(value / 100);
      
      case 'number':
      default:
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(value);
    }
  };

  // Função para obter descrição do cálculo do KPI
  const getCalculationInfo = (kpiCode: string): string => {
    const calculationDescriptions: Record<string, string> = {
      'total_orders': 'Conta todos os pedidos da sua organização criados nos últimos 30 dias.',
      'orders_in_progress': 'Conta pedidos com situação "ativa" ou "em andamento" nos últimos 30 dias.',
      'completed_orders': 'Conta pedidos com situação "concluída" ou "entregue" nos últimos 30 dias.',
      'pending_budget_approvals': 'Conta orçamentos detalhados com situação "rascunho" ou "pendente" nos últimos 30 dias.',
      'revenue_current_month': 'Soma o valor total de todos os orçamentos com situação "aprovado" nos últimos 30 dias.',
      'average_order_value': 'Calcula a média dos valores de orçamentos aprovados nos últimos 30 dias.',
      'customer_satisfaction': 'Índice de satisfação do cliente (em desenvolvimento - será calculado com base em avaliações futuras).',
      'orders_today': 'Conta pedidos criados hoje.',
      'pending_orders': 'Conta pedidos com situação "pendente".',
      'completed_today': 'Conta pedidos concluídos hoje (com data de entrega real igual a hoje).'
    };
    
    return calculationDescriptions[kpiCode] || 'Cálculo personalizado baseado nos dados da sua organização.';
  };

  // Calculate actual KPI values using RPC functions
  const calculateKPIValues = async (kpiList: KPI[]) => {
    if (!currentOrganization) return kpiList;

    const kpisWithValues = await Promise.all(
      kpiList.map(async (kpi) => {
        let value = 0;
        let subtitle = '';
        let trend = undefined;

        try {
          // Use RPC function to calculate KPI value filtered by organization
          const { data: trendData, error: trendError } = await supabase
            .rpc('calculate_kpi_trend', {
              kpi_code: kpi.code,
              organization_id: currentOrganization.id,
              current_period: 'current',
              comparison_period: 'previous'
            });

          if (trendError) {
            console.error(`Error calculating KPI ${kpi.code}:`, trendError);
          } else if (trendData && trendData.length > 0) {
            const trendResult = trendData[0];
            value = Number(trendResult.current_value) || 0;
            
            // Calculate trend
            const changePercentage = Number(trendResult.change_percentage) || 0;
            if (changePercentage !== 0) {
              trend = {
                value: Math.abs(changePercentage),
                isPositive: trendResult.trend_direction === 'up'
              };
            }
          }

          // Set subtitle based on KPI type
          switch (kpi.code) {
            case 'total_orders':
              subtitle = 'Total geral';
              break;
            case 'orders_in_progress':
              subtitle = 'Em processamento';
              break;
            case 'completed_orders':
              subtitle = 'Finalizados';
              break;
            case 'pending_budget_approvals':
              subtitle = 'Aguardando';
              break;
            case 'revenue_current_month':
              subtitle = 'Receita aprovada';
              break;
            case 'average_order_value':
              subtitle = 'Ticket médio';
              break;
            default:
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
          formattedValue: formatValue(value, kpi.unit),
          calculationInfo: getCalculationInfo(kpi.code),
          subtitle,
          trend,
        };
      })
    );

    return kpisWithValues;
  };

  // Fetch recent services from orders filtered by organization
  const fetchRecentServices = async () => {
    if (!currentOrganization) return;

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
        .eq('org_id', currentOrganization.id) // Filtrar por organização
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

  // Calcular contadores dinâmicos para ações rápidas
  const calculateActionCounters = async (actions: QuickAction[]): Promise<QuickAction[]> => {
    if (!currentOrganization) return actions;

    const actionsWithCounters = await Promise.all(
      actions.map(async (action) => {
        let count = 0;

        try {
          switch (action.href) {
            case '/coleta':
              {
              // Contar pedidos pendentes
              const { count: pendingOrders } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', currentOrganization.id)
                .eq('status', 'pendente');
              count = pendingOrders || 0;
              break;
            }
            case '/workflow':{
              // Contar pedidos em andamento
              const { count: inProgressOrders } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', currentOrganization.id)
                .in('status', ['ativa', 'em_andamento']);
              count = inProgressOrders || 0;
              break;
            }
            case '/dre':{
              // Contar DREs do mês atual que ainda não foram finalizados
              const currentMonth = new Date().getMonth() + 1;
              const currentYear = new Date().getFullYear();
              const { count: pendingDRE } = await supabase
                .from('monthly_dre')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', currentOrganization.id)
                .eq('month', currentMonth)
                .eq('year', currentYear);
              // Se não existe DRE para o mês atual, contar como 1 pendente
              count = pendingDRE === 0 ? 1 : 0;
              break;
            }
            case '/contas-receber':
            {
              // Contar contas a receber vencidas ou a vencer nos próximos 7 dias
              const today = new Date().toISOString().split('T')[0];
              const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              const { count: receivables } = await supabase
                .from('accounts_receivable')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', currentOrganization.id)
                .in('status', ['pending', 'overdue'])
                .lte('due_date', nextWeek);
              count = receivables || 0;
              break;
            }
            default:
              count = 0;
          }
        } catch (error) {
          console.error(`Error calculating counter for ${action.title}:`, error);
          count = 0;
        }

        return {
          ...action,
          count
        };
      })
    );

    return actionsWithCounters;
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch KPIs (templates globais)
      const { data: kpisData, error: kpisError } = await supabase
        .from('kpis')
        .select('*')
        .is('org_id', null) // Buscar apenas templates globais
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
      
      // Calcular contadores dinâmicos
      const actionsWithCounters = await calculateActionCounters((actionsData || []).map(action => ({
        ...action,
        permissions: Array.isArray(action.permissions) 
          ? (action.permissions as string[])
          : []
      })));
      
      setQuickActions(actionsWithCounters);

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

      // Disparar evento de refresh após atualizar todos os dados
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      }

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
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

  // WebSocket para atualização em tempo real dos contadores
  useEffect(() => {
    if (!currentOrganization) return;

    const channel = supabase
      .channel(`dashboard-counters-${currentOrganization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `org_id=eq.${currentOrganization.id}`
        },
        async (payload) => {
          console.log('Orders change detected for counters:', payload);
          // Recalcular contadores das ações
          if (quickActions.length > 0) {
            const updatedActions = await calculateActionCounters(quickActions);
            setQuickActions(updatedActions);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts_receivable',
          filter: `org_id=eq.${currentOrganization.id}`
        },
        async (payload) => {
          console.log('Accounts receivable change detected:', payload);
          // Recalcular contadores das ações
          if (quickActions.length > 0) {
            const updatedActions = await calculateActionCounters(quickActions);
            setQuickActions(updatedActions);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monthly_dre',
          filter: `org_id=eq.${currentOrganization.id}`
        },
        async (payload) => {
          console.log('Monthly DRE change detected:', payload);
          // Recalcular contadores das ações
          if (quickActions.length > 0) {
            const updatedActions = await calculateActionCounters(quickActions);
            setQuickActions(updatedActions);
          }
        }
      )
      .subscribe((status) => {
        console.log('Dashboard counters WebSocket status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization, quickActions]);

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