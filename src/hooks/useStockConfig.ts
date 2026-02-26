import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  stockConfigService,
  type StockConfig,
  type StockConfigFilters,
  type UpsertStockConfigInput,
} from '@/services/StockConfigService';
import type { PaginatedResult } from '@/services/InventoryService';

const PAGE_SIZE = 20;

export function useStockConfig() {
  const [configs, setConfigs] = useState<StockConfig[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResult<StockConfig>, 'data'>>({
    count: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<StockConfigFilters>({});
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchConfigs = useCallback(
    async (newFilters?: StockConfigFilters, page = 1) => {
      if (!currentOrganization?.id) return;
      try {
        setLoading(true);
        const activeFilters = newFilters ?? filters;
        const result = await stockConfigService.listConfigs(
          currentOrganization.id,
          activeFilters,
          page,
          PAGE_SIZE
        );
        setConfigs(result.data);
        setPagination({ count: result.count, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages });
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível carregar as configurações', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, filters, toast]
  );

  const saveConfig = useCallback(
    async (input: UpsertStockConfigInput): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        await stockConfigService.upsertConfig(
          currentOrganization.id,
          userData.user?.id ?? '',
          input
        );
        toast({ title: 'Configuração salva', description: `Parâmetros de ${input.part_name} atualizados` });
        await fetchConfigs();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível salvar a configuração', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchConfigs, toast]
  );

  const deleteConfig = useCallback(
    async (id: string): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        await stockConfigService.deleteConfig(id, currentOrganization.id);
        toast({ title: 'Configuração removida' });
        await fetchConfigs();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível remover a configuração', variant: 'destructive' });
        return false;
      }
    },
    [currentOrganization?.id, fetchConfigs, toast]
  );

  const syncFromInventory = useCallback(async () => {
    if (!currentOrganization?.id) return 0;
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const created = await stockConfigService.syncFromInventory(
        currentOrganization.id,
        userData.user?.id ?? ''
      );
      if (created.length > 0) {
        toast({ title: `${created.length} peças sincronizadas`, description: 'Configurações padrão criadas para novas peças' });
      } else {
        toast({ title: 'Sincronizado', description: 'Todas as peças já possuem configuração' });
      }
      await fetchConfigs();
      return created.length;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível sincronizar', variant: 'destructive' });
      return 0;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, fetchConfigs, toast]);

  const applyFilters = useCallback(
    (newFilters: StockConfigFilters) => {
      setFilters(newFilters);
      fetchConfigs(newFilters, 1);
    },
    [fetchConfigs]
  );

  const goToPage = useCallback(
    (page: number) => {
      fetchConfigs(filters, page);
    },
    [filters, fetchConfigs]
  );

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchConfigs(filters, 1);
    }
  }, [currentOrganization?.id]);

  return {
    configs,
    pagination,
    loading,
    filters,
    fetchConfigs,
    saveConfig,
    deleteConfig,
    syncFromInventory,
    applyFilters,
    goToPage,
  };
}

export type { StockConfig, StockConfigFilters, UpsertStockConfigInput };
