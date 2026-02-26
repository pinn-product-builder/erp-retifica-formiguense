import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import {
  BuyerDashboardService,
  type BuyerDashboardData,
} from '@/services/BuyerDashboardService';

const EMPTY_DATA: BuyerDashboardData = {
  counters: {
    quotations:   { pending_proposals: 0, ready_to_compare: 0, expired: 0 },
    orders:       { pending_approval: 0, approved: 0, receiving: 0 },
    conditionals: { awaiting_receipt: 0, in_analysis: 0, overdue: 0 },
    needs:        { pending: 0, urgent: 0 },
  },
  pending_quotations:  [],
  pending_approvals:   [],
  urgent_conditionals: [],
  purchase_needs:      [],
  metrics: { month_purchases: 0, avg_lead_time: 0, savings_percentage: 0 },
};

export function useBuyerDashboard() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const [data,      setData]      = useState<BuyerDashboardData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      setIsLoading(true);
      const result = await BuyerDashboardService.fetchAll(currentOrganization.id);
      setData(result);
      setLastUpdated(new Date());
    } catch {
      toast({
        title: 'Erro ao carregar dashboard',
        description: 'Não foi possível buscar os dados do dashboard.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return { data, isLoading, lastUpdated, refresh: fetchDashboard };
}
