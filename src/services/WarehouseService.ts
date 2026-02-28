import { supabase } from '@/integrations/supabase/client';
import type { PaginatedResult } from './InventoryService';

export interface Warehouse {
  id: string;
  org_id: string;
  code: string;
  name: string;
  address: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  code: string;
  aisle: string | null;
  rack: string | null;
  bin: string | null;
  is_active: boolean;
  max_capacity: number | null;
  created_at: string;
}

export type CreateWarehouseInput = Omit<Warehouse, 'id' | 'org_id' | 'created_at'>;
export type CreateLocationInput = Omit<WarehouseLocation, 'id' | 'created_at'>;

export interface WarehouseStats {
  part_count: number;
  total_value: number;
  location_count: number;
}

class WarehouseService {
  async listWarehouses(orgId: string): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from('warehouses' as never)
      .select('*')
      .eq('org_id', orgId)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) throw error;
    return (data ?? []) as Warehouse[];
  }

  async getWarehouse(id: string, orgId: string): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from('warehouses' as never)
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) throw error;
    return data as Warehouse;
  }

  async createWarehouse(orgId: string, input: CreateWarehouseInput): Promise<Warehouse> {
    if (input.is_default) {
      await supabase
        .from('warehouses' as never)
        .update({ is_default: false } as never)
        .eq('org_id', orgId);
    }

    const { data, error } = await supabase
      .from('warehouses' as never)
      .insert({ ...input, org_id: orgId } as never)
      .select()
      .single();

    if (error) throw error;
    return data as Warehouse;
  }

  async updateWarehouse(id: string, orgId: string, input: Partial<CreateWarehouseInput>): Promise<Warehouse> {
    if (input.is_default) {
      await supabase
        .from('warehouses' as never)
        .update({ is_default: false } as never)
        .eq('org_id', orgId)
        .neq('id', id);
    }

    const { data, error } = await supabase
      .from('warehouses' as never)
      .update(input as never)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data as Warehouse;
  }

  async deleteWarehouse(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('warehouses' as never)
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
  }

  async listLocations(warehouseId: string): Promise<WarehouseLocation[]> {
    const { data, error } = await supabase
      .from('warehouse_locations' as never)
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('code');

    if (error) throw error;
    return (data ?? []) as WarehouseLocation[];
  }

  async listAllLocations(orgId: string): Promise<(WarehouseLocation & { warehouse_name: string })[]> {
    const { data, error } = await supabase
      .from('warehouse_locations' as never)
      .select('*, warehouse:warehouses(name)')
      .eq('warehouses.org_id' as never, orgId)
      .order('code');

    if (error) throw error;
    return ((data ?? []) as unknown[]).map((loc: unknown) => {
      const l = loc as WarehouseLocation & { warehouse: { name: string } | null };
      return { ...l, warehouse_name: l.warehouse?.name ?? '' };
    });
  }

  async createLocation(input: CreateLocationInput): Promise<WarehouseLocation> {
    const { data, error } = await supabase
      .from('warehouse_locations' as never)
      .insert(input as never)
      .select()
      .single();

    if (error) throw error;
    return data as WarehouseLocation;
  }

  async updateLocation(id: string, input: Partial<CreateLocationInput>): Promise<WarehouseLocation> {
    const { data, error } = await supabase
      .from('warehouse_locations' as never)
      .update(input as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as WarehouseLocation;
  }

  async deleteLocation(id: string): Promise<void> {
    const { error } = await supabase
      .from('warehouse_locations' as never)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getWarehousesWithStats(orgId: string): Promise<(Warehouse & { location_count: number })[]> {
    const warehouses = await this.listWarehouses(orgId);

    const withStats = await Promise.all(
      warehouses.map(async (wh) => {
        const { count } = await supabase
          .from('warehouse_locations' as never)
          .select('*', { count: 'exact', head: true })
          .eq('warehouse_id', wh.id);

        return { ...wh, location_count: count ?? 0 };
      })
    );

    return withStats;
  }

  async listWarehousesPaginated(
    orgId: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResult<Warehouse>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('warehouses' as never)
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('is_default', { ascending: false })
      .order('name')
      .range(from, to);

    if (error) throw error;
    const total = count ?? 0;
    return {
      data: (data ?? []) as Warehouse[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

export const warehouseService = new WarehouseService();
