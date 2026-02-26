import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PartRow = Database['public']['Tables']['parts_inventory']['Row'];
type PartInsert = Database['public']['Tables']['parts_inventory']['Insert'];
type PartUpdate = Database['public']['Tables']['parts_inventory']['Update'];

export type InventoryPart = PartRow;

export interface PartFilters {
  status?: string;
  component?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type CreatePartInput = Omit<PartInsert, 'org_id' | 'id' | 'created_at'>;
export type UpdatePartInput = PartUpdate;

class InventoryService {
  async listParts(
    orgId: string,
    filters?: PartFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<PartRow>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('parts_inventory')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.status && filters.status !== 'todos') {
      query = query.eq('status', filters.status);
    }

    if (filters?.component && filters.component !== 'todos') {
      query = query.eq('component', filters.component as PartRow['component']);
    }

    if (filters?.search) {
      query = query.or(
        `part_name.ilike.%${filters.search}%,part_code.ilike.%${filters.search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    return {
      data: (data ?? []) as PartRow[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getAllParts(orgId: string, filters?: PartFilters): Promise<PartRow[]> {
    let query = supabase
      .from('parts_inventory')
      .select('*')
      .eq('org_id', orgId)
      .order('part_name');

    if (filters?.status && filters.status !== 'todos') {
      query = query.eq('status', filters.status);
    }

    if (filters?.component && filters.component !== 'todos') {
      query = query.eq('component', filters.component as PartRow['component']);
    }

    if (filters?.search) {
      query = query.or(
        `part_name.ilike.%${filters.search}%,part_code.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as PartRow[];
  }

  async getPartById(id: string, orgId: string): Promise<PartRow | null> {
    const { data, error } = await supabase
      .from('parts_inventory')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) throw error;
    return data as PartRow;
  }

  async createPart(orgId: string, partData: CreatePartInput): Promise<PartRow> {
    const { data, error } = await supabase
      .from('parts_inventory')
      .insert({ ...partData, org_id: orgId, status: partData.status || 'disponivel' })
      .select()
      .single();

    if (error) throw error;
    return data as PartRow;
  }

  async updatePart(id: string, orgId: string, partData: UpdatePartInput): Promise<PartRow> {
    const { data, error } = await supabase
      .from('parts_inventory')
      .update(partData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data as PartRow;
  }

  async deletePart(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('parts_inventory')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
  }

  async clonePart(id: string, orgId: string): Promise<PartRow> {
    const original = await this.getPartById(id, orgId);
    if (!original) throw new Error('Peça não encontrada');

    const { id: _id, created_at: _ca, ...rest } = original;
    const clone: PartInsert = {
      ...rest,
      part_name: `${original.part_name} (Cópia)`,
      part_code: original.part_code ? `${original.part_code}-CPY` : null,
      quantity: 0,
      org_id: orgId,
    };

    const { data, error } = await supabase
      .from('parts_inventory')
      .insert(clone)
      .select()
      .single();

    if (error) throw error;
    return data as PartRow;
  }

  async getAvailableParts(orgId: string, component?: string): Promise<PartRow[]> {
    let query = supabase
      .from('parts_inventory')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'disponivel')
      .gt('quantity', 0)
      .order('part_name');

    if (component) {
      query = query.eq('component', component as PartRow['component']);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as PartRow[];
  }

  async getDashboardStats(orgId: string): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    entriesThisMonth: number;
    exitsThisMonth: number;
    movementsThisMonth: number;
  }> {
    const [inventoryResult, lowStockResult, movementsResult] = await Promise.all([
      supabase
        .from('parts_inventory')
        .select('quantity, unit_cost')
        .eq('org_id', orgId),
      supabase
        .from('stock_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('alert_type', 'low_stock')
        .eq('is_active', true),
      supabase
        .from('inventory_movements')
        .select('movement_type')
        .eq('org_id', orgId)
        .gte(
          'created_at',
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        ),
    ]);

    if (inventoryResult.error) throw inventoryResult.error;
    if (movementsResult.error) throw movementsResult.error;

    const inventory = inventoryResult.data ?? [];
    const movements = movementsResult.data ?? [];

    return {
      totalItems: inventory.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: inventory.reduce(
        (sum, item) => sum + item.quantity * (item.unit_cost ?? 0),
        0
      ),
      lowStockItems: lowStockResult.count ?? 0,
      entriesThisMonth: movements.filter((m) => m.movement_type === 'entrada').length,
      exitsThisMonth: movements.filter((m) =>
        ['saida', 'baixa'].includes(m.movement_type)
      ).length,
      movementsThisMonth: movements.length,
    };
  }

  async getTopMovedParts(
    orgId: string,
    limit = 5
  ): Promise<Array<{ part_name: string; part_code: string; total_movements: number; last_movement: string }>> {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`part_id, created_at, part:parts_inventory(part_name, part_code)`)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const partCounts: Record<string, { name: string; code: string; count: number; lastMovement: string }> = {};

    (data ?? []).forEach((movement: unknown) => {
      const m = movement as { part_id: string; created_at: string; part: { part_name: string; part_code: string } | null };
      if (!m.part_id) return;
      if (!partCounts[m.part_id]) {
        partCounts[m.part_id] = {
          name: m.part?.part_name ?? 'N/A',
          code: m.part?.part_code ?? 'N/A',
          count: 0,
          lastMovement: m.created_at,
        };
      }
      partCounts[m.part_id].count++;
    });

    return Object.values(partCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((p) => ({
        part_name: p.name,
        part_code: p.code,
        total_movements: p.count,
        last_movement: p.lastMovement,
      }));
  }
}

export const inventoryService = new InventoryService();
