import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import {
  inventoryService,
  type InventoryPart,
  type PartFilters,
  type CreatePartInput,
  type UpdatePartInput,
  type PaginatedResult,
} from '@/services/InventoryService';
import type { Database } from '@/integrations/supabase/types';

export type ComponentType = Database['public']['Enums']['engine_component'];
export type PartStatus = 'disponivel' | 'reservado' | 'usado' | 'pendente';

export type PartInventory = InventoryPart & {
  macro_component_id?: string | null;
};

export type CreatePartData = Omit<CreatePartInput, never> & {
  macro_component_id?: string;
};

const PAGE_SIZE = 20;

export function usePartsInventory() {
  const [parts, setParts] = useState<PartInventory[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResult<PartInventory>, 'data'>>({
    count: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchParts = useCallback(
    async (filters?: PartFilters, page = 1) => {
      if (!currentOrganization?.id) return;
      try {
        setLoading(true);
        const result = await inventoryService.listParts(
          currentOrganization.id,
          filters,
          page,
          PAGE_SIZE
        );
        setParts(result.data as PartInventory[]);
        setPagination({
          count: result.count,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        });
      } catch {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o estoque',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, toast]
  );

  const createPart = useCallback(
    async (partData: CreatePartData): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        const { macro_component_id: _ignored, ...rest } = partData;
        await inventoryService.createPart(currentOrganization.id, rest as CreatePartInput);
        toast({ title: 'Peça adicionada', description: `${partData.part_name} foi adicionada ao estoque` });
        await fetchParts();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível adicionar a peça', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchParts, toast]
  );

  const updatePart = useCallback(
    async (partId: string, partData: Partial<CreatePartData>): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        const { macro_component_id: _ignored, ...rest } = partData;
        await inventoryService.updatePart(partId, currentOrganization.id, rest as UpdatePartInput);
        toast({ title: 'Peça atualizada', description: 'As informações da peça foram atualizadas' });
        await fetchParts();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível atualizar a peça', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchParts, toast]
  );

  const deletePart = useCallback(
    async (partId: string): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        await inventoryService.deletePart(partId, currentOrganization.id);
        toast({ title: 'Peça removida', description: 'A peça foi removida do estoque' });
        await fetchParts();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível remover a peça', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchParts, toast]
  );

  const updateQuantity = useCallback(
    async (partId: string, newQuantity: number): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        await inventoryService.updatePart(partId, currentOrganization.id, { quantity: newQuantity });
        toast({ title: 'Quantidade atualizada', description: `Quantidade alterada para ${newQuantity}` });
        await fetchParts();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível atualizar a quantidade', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchParts, toast]
  );

  const clonePart = useCallback(
    async (partId: string): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        const cloned = await inventoryService.clonePart(partId, currentOrganization.id);
        toast({ title: 'Peça clonada', description: `${cloned.part_name} foi criada` });
        await fetchParts();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível clonar a peça', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchParts, toast]
  );

  const getAvailableParts = useCallback(
    async (component?: string, _macroComponentId?: string): Promise<PartInventory[]> => {
      if (!currentOrganization?.id) return [];
      try {
        const data = await inventoryService.getAvailableParts(currentOrganization.id, component);
        return data as PartInventory[];
      } catch {
        return [];
      }
    },
    [currentOrganization?.id]
  );

  const getPartsForSelection = useCallback(
    async (search?: string): Promise<PartInventory[]> => {
      if (!currentOrganization?.id) return [];
      try {
        const data = await inventoryService.getAllParts(currentOrganization.id, search ? { search } : undefined);
        return data as PartInventory[];
      } catch {
        return [];
      }
    },
    [currentOrganization?.id]
  );

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchParts();
    }
  }, [currentOrganization?.id, fetchParts]);

  return {
    parts,
    pagination,
    loading,
    fetchParts,
    createPart,
    updatePart,
    deletePart,
    updateQuantity,
    clonePart,
    getAvailableParts,
    getPartsForSelection,
  };
}
