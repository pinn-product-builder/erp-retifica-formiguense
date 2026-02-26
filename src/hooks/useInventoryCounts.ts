import { useState, useCallback } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  inventoryCountService,
  type InventoryCount,
  type InventoryCountItem,
  type CountStatus,
  type CountType,
  type CreateCountData,
  type UpdateCountItemData,
  type PaginatedCounts,
  type DivergenceReport,
} from '@/services/InventoryCountService';

export type { InventoryCount, InventoryCountItem, CountStatus, CountType, CreateCountData, UpdateCountItemData, DivergenceReport };

export interface CountPagination {
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useInventoryCounts() {
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [pagination, setPagination] = useState<CountPagination>({
    count: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const [currentCount, setCurrentCount] = useState<InventoryCount | null>(null);
  const [countItems, setCountItems] = useState<InventoryCountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const applyPagination = (result: PaginatedCounts) => {
    setCounts(result.data);
    setPagination({
      count: result.count,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  };

  const fetchCounts = useCallback(
    async (status?: CountStatus, page = 1) => {
      if (!currentOrganization?.id) return [];
      try {
        setLoading(true);
        const result = await inventoryCountService.listCounts(currentOrganization.id, status, page);
        applyPagination(result);
        return result.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível carregar as contagens';
        toast({ title: 'Erro', description: msg, variant: 'destructive' });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, toast]
  );

  const fetchCountById = useCallback(
    async (countId: string) => {
      if (!currentOrganization?.id) return null;
      try {
        setLoading(true);
        const result = await inventoryCountService.getCountById(countId, currentOrganization.id);
        if (!result) return null;
        setCurrentCount(result.count);
        setCountItems(result.items);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível carregar a contagem';
        toast({ title: 'Erro', description: msg, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, toast]
  );

  const createCount = useCallback(
    async (countData: CreateCountData) => {
      if (!currentOrganization?.id) {
        toast({ title: 'Erro', description: 'Organização não encontrada', variant: 'destructive' });
        return null;
      }
      try {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        const count = await inventoryCountService.createCount(
          currentOrganization.id,
          userData.user?.id ?? '',
          countData
        );
        const partsCount = (count as unknown as { _partsCount?: number })._partsCount ?? 0;
        toast({
          title: 'Sucesso',
          description: `Contagem ${countData.count_type.toUpperCase()} criada com ${partsCount} itens`,
        });
        await fetchCounts();
        return count;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível criar a contagem';
        toast({ title: 'Erro', description: msg, variant: 'destructive' });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchCounts, toast]
  );

  const startCount = useCallback(
    async (countId: string) => {
      try {
        await inventoryCountService.startCount(countId);
        toast({ title: 'Contagem Iniciada', description: 'A contagem está agora em andamento' });
        await fetchCounts();
        if (currentCount?.id === countId) await fetchCountById(countId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível iniciar a contagem';
        toast({ title: 'Erro', description: msg, variant: 'destructive' });
      }
    },
    [fetchCounts, fetchCountById, currentCount?.id, toast]
  );

  const updateCountItem = useCallback(
    async (updateData: UpdateCountItemData) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        await inventoryCountService.updateCountItem(updateData, userData.user?.id ?? '');
        if (currentCount) await fetchCountById(currentCount.id);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível atualizar o item';
        toast({ title: 'Erro', description: msg, variant: 'destructive' });
        return false;
      }
    },
    [currentCount, fetchCountById, toast]
  );

  const processCount = useCallback(
    async (countId: string) => {
      try {
        setLoading(true);
        await inventoryCountService.processCount(countId);
        toast({ title: 'Contagem Processada', description: 'Ajustes de inventário foram criados automaticamente' });
        await fetchCounts();
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível processar a contagem';
        toast({ title: 'Erro', description: msg, variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchCounts, toast]
  );

  const cancelCount = useCallback(
    async (countId: string) => {
      try {
        await inventoryCountService.cancelCount(countId);
        toast({ title: 'Contagem Cancelada', description: 'A contagem foi cancelada' });
        await fetchCounts();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível cancelar a contagem';
        toast({ title: 'Erro', description: msg, variant: 'destructive' });
      }
    },
    [fetchCounts, toast]
  );

  const getDivergenceReport = useCallback(
    (items: InventoryCountItem[]): DivergenceReport => inventoryCountService.getDivergenceReport(items),
    []
  );

  const getUserName = useCallback(
    (userId: string | null | undefined): Promise<string> => inventoryCountService.getUserName(userId),
    []
  );

  return {
    counts,
    pagination,
    currentCount,
    countItems,
    loading,
    fetchCounts,
    fetchCountById,
    createCount,
    startCount,
    updateCountItem,
    processCount,
    cancelCount,
    getDivergenceReport,
    getUserName,
  };
}
