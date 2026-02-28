import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import {
  stockAccountingService,
  type AccountingConfig,
  type AccountingEntry,
  type StockProvision,
  type EntryFilters,
} from '@/services/StockAccountingService';
import type { PaginatedResult } from '@/services/InventoryService';

const PAGE_SIZE = 10;

export interface AccountingStats {
  total: number;
  draft: number;
  posted: number;
  reversed: number;
  total_amount: number;
}

export function useStockAccounting() {
  const [configs, setConfigs] = useState<AccountingConfig[]>([]);
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [provisions, setProvisions] = useState<StockProvision[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResult<AccountingEntry>, 'data'>>({
    count: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1,
  });
  const [provisionsPagination, setProvisionsPagination] = useState<Omit<PaginatedResult<StockProvision>, 'data'>>({
    count: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1,
  });
  const [stats, setStats] = useState<AccountingStats>({
    total: 0, draft: 0, posted: 0, reversed: 0, total_amount: 0,
  });
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchConfigs = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      const data = await stockAccountingService.listConfigs(currentOrganization.id);
      setConfigs(data);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível carregar as configurações', variant: 'destructive' });
    }
  }, [currentOrganization?.id, toast]);

  const fetchEntries = useCallback(
    async (filters?: EntryFilters, page = 1) => {
      if (!currentOrganization?.id) return;
      try {
        setLoading(true);
        const result = await stockAccountingService.listEntries(currentOrganization.id, filters, page, PAGE_SIZE);
        setEntries(result.data);
        setPagination({ count: result.count, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages });
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível carregar os lançamentos', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, toast]
  );

  const fetchStats = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      const data = await stockAccountingService.getEntriesStats(currentOrganization.id);
      setStats(data);
    } catch {
      // non-critical
    }
  }, [currentOrganization?.id]);

  const fetchProvisions = useCallback(
    async (page = 1) => {
      if (!currentOrganization?.id) return;
      try {
        const result = await stockAccountingService.listProvisions(currentOrganization.id, page, PAGE_SIZE);
        setProvisions(result.data);
        setProvisionsPagination({ count: result.count, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages });
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível carregar as provisões', variant: 'destructive' });
      }
    },
    [currentOrganization?.id, toast]
  );

  const saveConfig = useCallback(
    async (config: Omit<AccountingConfig, 'id' | 'org_id' | 'created_at'>): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        await stockAccountingService.upsertConfig(currentOrganization.id, config);
        toast({ title: 'Configuração salva', description: 'Configuração contábil atualizada' });
        await fetchConfigs();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível salvar a configuração', variant: 'destructive' });
        return false;
      }
    },
    [currentOrganization?.id, fetchConfigs, toast]
  );

  const initDefaultConfigs = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      await stockAccountingService.initDefaultConfigs(currentOrganization.id);
      await fetchConfigs();
    } catch {
      // non-critical
    }
  }, [currentOrganization?.id, fetchConfigs]);

  const postEntry = useCallback(
    async (entryId: string, userId: string): Promise<boolean> => {
      try {
        await stockAccountingService.postEntry(entryId, userId);
        toast({ title: 'Lançamento contabilizado', description: 'Lançamento marcado como contabilizado' });
        await Promise.all([fetchEntries(), fetchStats()]);
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível contabilizar o lançamento', variant: 'destructive' });
        return false;
      }
    },
    [fetchEntries, fetchStats, toast]
  );

  const reverseEntry = useCallback(
    async (entryId: string, userId: string): Promise<boolean> => {
      try {
        await stockAccountingService.reverseEntry(entryId, userId);
        toast({ title: 'Lançamento estornado', description: 'Lançamento estornado com sucesso' });
        await Promise.all([fetchEntries(), fetchStats()]);
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível estornar o lançamento', variant: 'destructive' });
        return false;
      }
    },
    [fetchEntries, fetchStats, toast]
  );

  const approveProvision = useCallback(
    async (provisionId: string, userId: string): Promise<boolean> => {
      try {
        await stockAccountingService.approveProvision(provisionId, userId);
        toast({ title: 'Provisão aprovada', description: 'Provisão aprovada com sucesso' });
        await fetchProvisions();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível aprovar a provisão', variant: 'destructive' });
        return false;
      }
    },
    [fetchProvisions, toast]
  );

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchConfigs();
      fetchEntries();
      fetchStats();
      fetchProvisions();
      initDefaultConfigs();
    }
  }, [currentOrganization?.id, fetchConfigs, fetchEntries, fetchStats, fetchProvisions, initDefaultConfigs]);

  return {
    configs,
    entries,
    provisions,
    pagination,
    provisionsPagination,
    stats,
    loading,
    fetchConfigs,
    fetchEntries,
    fetchStats,
    fetchProvisions,
    saveConfig,
    postEntry,
    reverseEntry,
    approveProvision,
  };
}
