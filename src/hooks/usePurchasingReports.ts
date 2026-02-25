import { useState, useCallback } from 'react';
import { useOrganization } from './useOrganization';
import { useToast } from './use-toast';
import {
  PurchasingReportsService,
  type FiltrosRelatorio,
  type PurchasingReportData,
  type PeriodoAnalise,
} from '@/services/PurchasingReportsService';

const DEFAULT_FILTERS: FiltrosRelatorio = { period: 'mes' };

export function usePurchasingReports() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const [isLoading, setIsLoading]   = useState(false);
  const [data, setData]             = useState<PurchasingReportData | null>(null);
  const [filters, setFilters]       = useState<FiltrosRelatorio>(DEFAULT_FILTERS);

  const fetch = useCallback(
    async (overrideFilters?: FiltrosRelatorio) => {
      if (!currentOrganization?.id) return;
      const activeFilters = overrideFilters ?? filters;
      setIsLoading(true);
      try {
        const result = await PurchasingReportsService.fetchDashboardData(
          currentOrganization.id,
          activeFilters,
        );
        setData(result);
      } catch (err) {
        console.error('usePurchasingReports:', err);
        toast({ title: 'Erro', description: 'Falha ao carregar relatório de compras', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [currentOrganization?.id, filters, toast],
  );

  const applyFilters = useCallback(
    (next: Partial<FiltrosRelatorio>) => {
      const merged = { ...filters, ...next };
      setFilters(merged);
      fetch(merged);
    },
    [filters, fetch],
  );

  const setPeriod = useCallback(
    (period: PeriodoAnalise) => applyFilters({ period }),
    [applyFilters],
  );

  const printReport = useCallback(() => {
    if (!data) return;
    const html = PurchasingReportsService.buildPrintHTML(
      data,
      currentOrganization?.name ?? 'Organização',
      PERIOD_LABELS[filters.period],
    );
    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => setTimeout(() => { win.print(); win.close(); }, 400);
  }, [data, currentOrganization?.name, filters.period]);

  return {
    isLoading,
    data,
    filters,
    fetch,
    setPeriod,
    applyFilters,
    printReport,
  };
}

export const PERIOD_LABELS: Record<string, string> = {
  hoje:         'Hoje',
  semana:       'Esta Semana',
  mes:          'Este Mês',
  trimestre:    'Último Trimestre',
  ano:          'Este Ano',
  personalizado: 'Personalizado',
};
