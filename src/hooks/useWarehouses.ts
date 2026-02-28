import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import {
  warehouseService,
  type Warehouse,
  type WarehouseLocation,
  type CreateWarehouseInput,
  type CreateLocationInput,
} from '@/services/WarehouseService';
import type { PaginatedResult } from '@/services/InventoryService';

const PAGE_SIZE = 10;

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<(Warehouse & { location_count: number })[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResult<Warehouse>, 'data'>>({
    count: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchWarehouses = useCallback(
    async (page = 1) => {
      if (!currentOrganization?.id) return;
      try {
        setLoading(true);
        const withStats = await warehouseService.getWarehousesWithStats(currentOrganization.id);
        const result = await warehouseService.listWarehousesPaginated(currentOrganization.id, page, PAGE_SIZE);
        const statsMap = Object.fromEntries(withStats.map((w) => [w.id, w.location_count]));
        setWarehouses(result.data.map((w) => ({ ...w, location_count: statsMap[w.id] ?? 0 })));
        setPagination({ count: result.count, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages });
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível carregar os depósitos', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, toast]
  );

  const fetchLocations = useCallback(
    async (warehouseId: string) => {
      try {
        const data = await warehouseService.listLocations(warehouseId);
        setLocations(data);
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível carregar as localizações', variant: 'destructive' });
      }
    },
    [toast]
  );

  const createWarehouse = useCallback(
    async (input: CreateWarehouseInput): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        await warehouseService.createWarehouse(currentOrganization.id, input);
        toast({ title: 'Depósito criado', description: `${input.name} foi criado com sucesso` });
        await fetchWarehouses();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível criar o depósito', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchWarehouses, toast]
  );

  const updateWarehouse = useCallback(
    async (id: string, input: Partial<CreateWarehouseInput>): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        await warehouseService.updateWarehouse(id, currentOrganization.id, input);
        toast({ title: 'Depósito atualizado', description: 'Informações atualizadas com sucesso' });
        await fetchWarehouses();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível atualizar o depósito', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchWarehouses, toast]
  );

  const deleteWarehouse = useCallback(
    async (id: string): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        await warehouseService.deleteWarehouse(id, currentOrganization.id);
        toast({ title: 'Depósito removido', description: 'Depósito removido com sucesso' });
        await fetchWarehouses();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível remover o depósito', variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchWarehouses, toast]
  );

  const createLocation = useCallback(
    async (input: CreateLocationInput): Promise<boolean> => {
      try {
        await warehouseService.createLocation(input);
        toast({ title: 'Localização criada', description: `${input.code} adicionada com sucesso` });
        await fetchLocations(input.warehouse_id);
        await fetchWarehouses();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível criar a localização', variant: 'destructive' });
        return false;
      }
    },
    [fetchLocations, fetchWarehouses, toast]
  );

  const updateLocation = useCallback(
    async (id: string, input: Partial<CreateLocationInput>, warehouseId: string): Promise<boolean> => {
      try {
        await warehouseService.updateLocation(id, input);
        toast({ title: 'Localização atualizada', description: 'Localização atualizada com sucesso' });
        await fetchLocations(warehouseId);
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível atualizar a localização', variant: 'destructive' });
        return false;
      }
    },
    [fetchLocations, toast]
  );

  const deleteLocation = useCallback(
    async (id: string, warehouseId: string): Promise<boolean> => {
      try {
        await warehouseService.deleteLocation(id);
        toast({ title: 'Localização removida', description: 'Localização removida com sucesso' });
        await fetchLocations(warehouseId);
        await fetchWarehouses();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível remover a localização', variant: 'destructive' });
        return false;
      }
    },
    [fetchLocations, fetchWarehouses, toast]
  );

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchWarehouses();
    }
  }, [currentOrganization?.id, fetchWarehouses]);

  return {
    warehouses,
    pagination,
    locations,
    loading,
    fetchWarehouses,
    fetchLocations,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    createLocation,
    updateLocation,
    deleteLocation,
  };
}
