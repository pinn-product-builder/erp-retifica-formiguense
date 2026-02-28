import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import {
  stockBatchService,
  type StockBatchWithAlert,
  type StockSerial,
  type CreateBatchInput,
  type BatchFilters,
} from '@/services/StockBatchService';
import type { PaginatedResult } from '@/services/InventoryService';

const PAGE_SIZE = 10;

export interface BatchStats {
  total_batches: number;
  expiring_30: number;
  expiring_60: number;
  expired: number;
  quarantine: number;
}

export function useStockBatches(partId?: string) {
  const [batches, setBatches] = useState<StockBatchWithAlert[]>([]);
  const [serials, setSerials] = useState<StockSerial[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResult<StockBatchWithAlert>, 'data'>>({
    count: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1,
  });
  const [serialsPagination, setSerialsPagination] = useState<Omit<PaginatedResult<StockSerial>, 'data'>>({
    count: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1,
  });
  const [stats, setStats] = useState<BatchStats>({
    total_batches: 0, expiring_30: 0, expiring_60: 0, expired: 0, quarantine: 0,
  });
  const [fefoSuggestion, setFefoSuggestion] = useState<StockBatchWithAlert | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchBatches = useCallback(
    async (filters?: BatchFilters, page = 1) => {
      if (!currentOrganization?.id) return;
      try {
        setLoading(true);
        const result = await stockBatchService.listBatches(
          currentOrganization.id,
          { ...filters, part_id: partId ?? filters?.part_id },
          page,
          PAGE_SIZE
        );
        setBatches(result.data);
        setPagination({ count: result.count, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages });
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível carregar os lotes', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, partId, toast]
  );

  const fetchStats = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      const data = await stockBatchService.getBatchStats(currentOrganization.id);
      setStats(data);
    } catch {
      // stats are non-critical
    }
  }, [currentOrganization?.id]);

  const fetchFefoSuggestion = useCallback(
    async (pid: string) => {
      if (!currentOrganization?.id) return;
      try {
        const suggestion = await stockBatchService.getFEFOSuggestion(currentOrganization.id, pid);
        setFefoSuggestion(suggestion);
      } catch {
        // suggestion is non-critical
      }
    },
    [currentOrganization?.id]
  );

  const fetchSerials = useCallback(
    async (page = 1) => {
      if (!currentOrganization?.id) return;
      try {
        const result = await stockBatchService.listSerials(currentOrganization.id, partId, page, PAGE_SIZE);
        setSerials(result.data);
        setSerialsPagination({ count: result.count, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages });
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível carregar os seriais', variant: 'destructive' });
      }
    },
    [currentOrganization?.id, partId, toast]
  );

  const createBatch = useCallback(
    async (input: CreateBatchInput): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        await stockBatchService.createBatch(currentOrganization.id, input);
        toast({ title: 'Lote criado', description: `Lote ${input.batch_number} criado com sucesso` });
        await Promise.all([fetchBatches(), fetchStats()]);
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível criar o lote', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchBatches, fetchStats, toast]
  );

  const updateBatch = useCallback(
    async (id: string, input: Partial<CreateBatchInput>): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        await stockBatchService.updateBatch(id, currentOrganization.id, input);
        toast({ title: 'Lote atualizado', description: 'Lote atualizado com sucesso' });
        await Promise.all([fetchBatches(), fetchStats()]);
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível atualizar o lote', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchBatches, fetchStats, toast]
  );

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchBatches();
      fetchStats();
      fetchSerials();
      if (partId) fetchFefoSuggestion(partId);
    }
  }, [currentOrganization?.id, fetchBatches, fetchStats, fetchSerials, fetchFefoSuggestion, partId]);

  return {
    batches,
    serials,
    pagination,
    serialsPagination,
    stats,
    fefoSuggestion,
    loading,
    fetchBatches,
    fetchSerials,
    fetchStats,
    fetchFefoSuggestion,
    createBatch,
    updateBatch,
  };
}
