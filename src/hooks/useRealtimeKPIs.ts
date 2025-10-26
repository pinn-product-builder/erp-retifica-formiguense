import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface KPIValue {
  id: string;
  code: string;
  name: string;
  value: number;
  previousValue: number;
  changePercentage: number;
  trendDirection: 'up' | 'down' | 'stable';
  lastUpdated: string;
  icon: string;
  color: string;
  unit: string;
}

interface KPITrend {
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  trendDirection: 'up' | 'down' | 'stable';
}

export const useRealtimeKPIs = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  // Buscar configuração de KPIs (templates globais)
  const { data: kpiConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ['kpis', 'config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .is('org_id', null) // Buscar apenas templates globais
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Calcular valores dos KPIs
  const calculateKPIValues = useCallback(async (configs: Array<Record<string, unknown>>): Promise<KPIValue[]> => {
    if (!currentOrganization || !configs.length) return [];

    const kpiValues = await Promise.all(
      configs.map(async (config) => {
        try {
          // Buscar valor atual e tendência
          const { data: trendData, error: trendError } = await supabase
            .rpc('calculate_kpi_trend', {
              kpi_code: config.code,
              organization_id: currentOrganization.id,
              current_period: 'current',
              comparison_period: 'previous'
            });

          if (trendError) throw trendError;

          const trendRaw = trendData?.[0] as unknown;
          const trend: KPITrend = trendRaw ? {
            currentValue: trendRaw.current_value || 0,
            previousValue: trendRaw.previous_value || 0,
            changePercentage: trendRaw.change_percentage || 0,
            trendDirection: (trendRaw.trend_direction || 'stable') as 'up' | 'down' | 'stable'
          } : {
            currentValue: 0,
            previousValue: 0,
            changePercentage: 0,
            trendDirection: 'stable'
          };

          return {
            id: config.id,
            code: config.code,
            name: config.name,
            value: trend.currentValue,
            previousValue: trend.previousValue,
            changePercentage: trend.changePercentage,
            trendDirection: trend?.trendDirection || 'stable',
            lastUpdated: new Date().toISOString(),
            icon: config.icon,
            color: config.color,
            unit: config.unit
          };
        } catch (error) {
          console.error(`Error calculating KPI ${config.code}:`, error);
          return {
            id: config.id,
            code: config.code,
            name: config.name,
            value: 0,
            previousValue: 0,
            changePercentage: 0,
            trendDirection: 'stable' as const,
            lastUpdated: new Date().toISOString(),
            icon: config.icon,
            color: config.color,
            unit: config.unit
          };
        }
      })
    );

    return kpiValues;
  }, [currentOrganization]);

  // Query principal para valores dos KPIs
  const { data: kpiValues, isLoading: valuesLoading, error } = useQuery({
    queryKey: ['kpis', 'values', currentOrganization?.id],
    queryFn: () => calculateKPIValues(kpiConfigs || []),
    enabled: !!kpiConfigs?.length && !!currentOrganization,
    refetchInterval: false, // Desabilitar polling automático, usar apenas WebSocket
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
  });

  // WebSocket para atualizações em tempo real
  useEffect(() => {
    if (!currentOrganization) return;

    const channel = supabase
      .channel(`kpi-updates-${currentOrganization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `org_id=eq.${currentOrganization.id}` // Corrigido: org_id
        },
        (payload) => {
          console.log('Orders change detected:', payload);
          // Invalidar cache quando houver mudanças nas ordens
          queryClient.invalidateQueries({ queryKey: ['kpis', 'values', currentOrganization.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'detailed_budgets', // Corrigido: detailed_budgets
          filter: `org_id=eq.${currentOrganization.id}` // Corrigido: org_id
        },
        (payload) => {
          console.log('Budgets change detected:', payload);
          // Invalidar cache quando houver mudanças nos orçamentos
          queryClient.invalidateQueries({ queryKey: ['kpis', 'values', currentOrganization.id] });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        console.log('WebSocket status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization, queryClient]);

  // Função para refresh manual
  const refreshKPIs = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['kpis', 'values', currentOrganization?.id] });
  }, [queryClient, currentOrganization?.id]);

  return {
    kpis: kpiValues || [],
    isLoading: configsLoading || valuesLoading,
    error,
    isConnected,
    refreshKPIs,
    lastUpdated: kpiValues?.[0]?.lastUpdated
  };
};
