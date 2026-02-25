import { useState, useCallback } from 'react';
import { useOrganization } from './useOrganization';
import { useToast } from './use-toast';
import {
  PurchasingReportsService,
  type FiltrosRelatorio,
  type PurchasingReportData,
  type SupplierPerformance,
  type LeadTimeDetail,
  type TopItem,
  type AuditData,
  type PeriodoAnalise,
} from '@/services/PurchasingReportsService';

const DEFAULT_FILTERS: FiltrosRelatorio = { period: 'mes' };

export function usePurchasingReports() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const [isLoading, setIsLoading]                       = useState(false);
  const [data, setData]                                 = useState<PurchasingReportData | null>(null);
  const [supplierPerformance, setSupplierPerformance]   = useState<SupplierPerformance[]>([]);
  const [leadTimeDetails, setLeadTimeDetails]           = useState<LeadTimeDetail[]>([]);
  const [topItems, setTopItems]                         = useState<TopItem[]>([]);
  const [auditData, setAuditData]                       = useState<AuditData | null>(null);
  const [filters, setFilters]                           = useState<FiltrosRelatorio>(DEFAULT_FILTERS);

  const fetchAll = useCallback(
    async (overrideFilters?: FiltrosRelatorio) => {
      if (!currentOrganization?.id) return;
      const active = overrideFilters ?? filters;
      setIsLoading(true);
      try {
        const [dashboard, perf, lead, items, audit] = await Promise.all([
          PurchasingReportsService.fetchDashboardData(currentOrganization.id, active),
          PurchasingReportsService.fetchSupplierPerformance(currentOrganization.id),
          PurchasingReportsService.fetchLeadTimeDetails(currentOrganization.id, active),
          PurchasingReportsService.fetchTopItems(currentOrganization.id, active),
          PurchasingReportsService.fetchAuditData(currentOrganization.id, active),
        ]);
        setData(dashboard);
        setSupplierPerformance(perf);
        setLeadTimeDetails(lead);
        setTopItems(items);
        setAuditData(audit);
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
      fetchAll(merged);
    },
    [filters, fetchAll],
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
    supplierPerformance,
    leadTimeDetails,
    topItems,
    auditData,
    filters,
    fetchAll,
    setPeriod,
    applyFilters,
    printReport,
  };
}

export const PERIOD_LABELS: Record<string, string> = {
  hoje:          'Hoje',
  semana:        'Esta Semana',
  mes:           'Este Mês',
  trimestre:     'Último Trimestre',
  ano:           'Este Ano',
  personalizado: 'Personalizado',
};
