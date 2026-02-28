import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import {
  costMethodService,
  type CostLayer,
  type CostMethodChange,
  type CostMethod,
} from '@/services/CostMethodService';
import type { PaginatedResult } from '@/services/InventoryService';

const PAGE_SIZE = 10;

export interface CostLayerSummary {
  total_layers: number;
  total_quantity: number;
  total_cost: number;
  avg_cost: number;
  next_layer_cost: number | null;
}

export function useCostMethod(partId?: string) {
  const [layers, setLayers] = useState<CostLayer[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResult<CostLayer>, 'data'>>({
    count: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1,
  });
  const [pendingChanges, setPendingChanges] = useState<CostMethodChange[]>([]);
  const [summary, setSummary] = useState<CostLayerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchLayers = useCallback(
    async (pid: string, page = 1) => {
      if (!currentOrganization?.id) return;
      try {
        setLoading(true);
        const result = await costMethodService.listCostLayers(currentOrganization.id, pid, page, PAGE_SIZE);
        setLayers(result.data);
        setPagination({ count: result.count, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages });
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível carregar as camadas de custo', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, toast]
  );

  const fetchSummary = useCallback(
    async (pid: string) => {
      if (!currentOrganization?.id) return;
      try {
        const data = await costMethodService.getCostLayerSummary(currentOrganization.id, pid);
        setSummary(data);
      } catch {
        // summary is non-critical
      }
    },
    [currentOrganization?.id]
  );

  const fetchPendingChanges = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      const data = await costMethodService.listPendingChanges(currentOrganization.id);
      setPendingChanges(data);
    } catch {
      // non-critical
    }
  }, [currentOrganization?.id]);

  const requestMethodChange = useCallback(
    async (
      pid: string,
      currentMethod: CostMethod,
      newMethod: CostMethod,
      justification: string,
      userId: string
    ): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        await costMethodService.requestMethodChange(
          currentOrganization.id, pid, currentMethod, newMethod, justification, userId
        );
        toast({ title: 'Solicitação enviada', description: 'Aguardando aprovação gerencial' });
        await fetchPendingChanges();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível solicitar a alteração', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchPendingChanges, toast]
  );

  const approveMethodChange = useCallback(
    async (changeId: string, userId: string): Promise<boolean> => {
      try {
        setLoading(true);
        await costMethodService.approveMethodChange(changeId, userId);
        toast({ title: 'Alteração aprovada', description: 'Método de custeio atualizado com sucesso' });
        await fetchPendingChanges();
        if (partId) await fetchLayers(partId);
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível aprovar a alteração', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchPendingChanges, fetchLayers, partId, toast]
  );

  const rejectMethodChange = useCallback(
    async (changeId: string, userId: string): Promise<boolean> => {
      try {
        await costMethodService.rejectMethodChange(changeId, userId);
        toast({ title: 'Solicitação rejeitada', description: 'A solicitação foi rejeitada' });
        await fetchPendingChanges();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível rejeitar a solicitação', variant: 'destructive' });
        return false;
      }
    },
    [fetchPendingChanges, toast]
  );

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchPendingChanges();
      if (partId) {
        fetchLayers(partId);
        fetchSummary(partId);
      }
    }
  }, [currentOrganization?.id, fetchPendingChanges, fetchLayers, fetchSummary, partId]);

  return {
    layers,
    pagination,
    pendingChanges,
    summary,
    loading,
    fetchLayers,
    fetchSummary,
    fetchPendingChanges,
    requestMethodChange,
    approveMethodChange,
    rejectMethodChange,
  };
}
