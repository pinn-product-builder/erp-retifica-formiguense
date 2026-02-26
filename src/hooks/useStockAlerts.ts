import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  stockAlertService,
  type StockAlert,
  type AlertFilters,
  type AlertStats,
  type AlertUrgency,
} from '@/services/StockAlertService';
import type { PaginatedResult } from '@/services/InventoryService';

const PAGE_SIZE = 20;

export function useStockAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    active: 0,
  });
  const [pagination, setPagination] = useState<Omit<PaginatedResult<StockAlert>, 'data'>>({
    count: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AlertFilters>({ is_active: true });
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchAlerts = useCallback(
    async (newFilters?: AlertFilters, page = 1) => {
      if (!currentOrganization?.id) return;
      try {
        setLoading(true);
        const activeFilters = newFilters ?? filters;
        const result = await stockAlertService.listAlerts(
          currentOrganization.id,
          activeFilters,
          page,
          PAGE_SIZE
        );
        setAlerts(result.data);
        setPagination({ count: result.count, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages });
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível carregar os alertas', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, filters, toast]
  );

  const fetchStats = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      const s = await stockAlertService.getAlertStats(currentOrganization.id);
      setStats(s);
    } catch {
      // silent
    }
  }, [currentOrganization?.id]);

  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      if (!currentOrganization?.id) return false;
      try {
        const { data: userData } = await supabase.auth.getUser();
        await stockAlertService.acknowledgeAlert(alertId, userData.user?.id ?? '');
        toast({ title: 'Alerta reconhecido' });
        await fetchAlerts();
        await fetchStats();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível reconhecer o alerta', variant: 'destructive' });
        return false;
      }
    },
    [currentOrganization?.id, fetchAlerts, fetchStats, toast]
  );

  const resolveAlert = useCallback(
    async (alertId: string) => {
      if (!currentOrganization?.id) return false;
      try {
        await stockAlertService.resolveAlert(alertId);
        toast({ title: 'Alerta resolvido' });
        await fetchAlerts();
        await fetchStats();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível resolver o alerta', variant: 'destructive' });
        return false;
      }
    },
    [currentOrganization?.id, fetchAlerts, fetchStats, toast]
  );

  const createPurchaseNeed = useCallback(
    async (alert: StockAlert) => {
      if (!currentOrganization?.id) return null;
      try {
        const needId = await stockAlertService.createPurchaseNeedFromAlert(currentOrganization.id, alert);
        toast({ title: 'Necessidade de compra', description: `Necessidade registrada para ${alert.part_name}` });
        return needId;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível criar necessidade de compra', variant: 'destructive' });
        return null;
      }
    },
    [currentOrganization?.id, toast]
  );

  const applyFilters = useCallback(
    (newFilters: AlertFilters) => {
      setFilters(newFilters);
      fetchAlerts(newFilters, 1);
    },
    [fetchAlerts]
  );

  const goToPage = useCallback(
    (page: number) => {
      fetchAlerts(filters, page);
    },
    [filters, fetchAlerts]
  );

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchAlerts(filters, 1);
      fetchStats();
    }
  }, [currentOrganization?.id]);

  return {
    alerts,
    stats,
    pagination,
    loading,
    filters,
    fetchAlerts,
    fetchStats,
    acknowledgeAlert,
    resolveAlert,
    createPurchaseNeed,
    applyFilters,
    goToPage,
  };
}

export type { StockAlert, AlertFilters, AlertStats, AlertUrgency };
