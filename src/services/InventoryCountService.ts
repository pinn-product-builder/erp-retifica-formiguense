import { supabase } from '@/integrations/supabase/client';

export type CountStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';
export type CountType = 'total' | 'partial' | 'cyclic';

export interface InventoryCount {
  id: string;
  org_id: string;
  count_number: string;
  count_type: CountType;
  count_date: string;
  status: CountStatus;
  category_filter?: string;
  location_filter?: string;
  high_rotation_only: boolean;
  counted_by?: string;
  reviewed_by?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  completed_at?: string;
  updated_at: string;
  counted_by_user?: { name: string };
  items?: InventoryCountItem[];
}

export interface InventoryCountItem {
  id: string;
  count_id: string;
  part_id: string;
  expected_quantity: number;
  counted_quantity?: number;
  difference?: number;
  unit_cost?: number;
  notes?: string;
  counted_by?: string;
  counted_at?: string;
  part?: { part_code: string; part_name: string; quantity: number };
}

export interface CreateCountData {
  count_type: CountType;
  count_date: string;
  notes?: string;
  include_all_parts?: boolean;
  part_ids?: string[];
  category_filter?: string;
  location_filter?: string;
  high_rotation_only?: boolean;
}

export interface UpdateCountItemData {
  item_id: string;
  counted_quantity: number;
  notes?: string;
}

export interface PaginatedCounts {
  data: InventoryCount[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DivergenceReport {
  totalItems: number;
  totalCounted: number;
  totalDivergences: number;
  totalIncrease: number;
  totalDecrease: number;
  financialImpact: number;
  divergences: InventoryCountItem[];
}

const PAGE_SIZE = 10;

class InventoryCountService {
  async listCounts(orgId: string, status?: CountStatus, page = 1, pageSize = PAGE_SIZE): Promise<PaginatedCounts> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('inventory_counts')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    return {
      data: (data ?? []) as InventoryCount[],
      count: total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getCountById(countId: string, orgId: string): Promise<{ count: InventoryCount; items: InventoryCountItem[] } | null> {
    const { data: countData, error: countError } = await supabase
      .from('inventory_counts')
      .select('*')
      .eq('id', countId)
      .eq('org_id', orgId)
      .single();

    if (countError) throw countError;

    const { data: itemsData, error: itemsError } = await supabase
      .from('inventory_count_items')
      .select(`
        *,
        part:parts_inventory(part_code, part_name, quantity)
      `)
      .eq('count_id', countId)
      .order('part(part_name)');

    if (itemsError) throw itemsError;

    return {
      count: countData as InventoryCount,
      items: (itemsData ?? []) as InventoryCountItem[],
    };
  }

  async createCount(orgId: string, userId: string, countData: CreateCountData): Promise<InventoryCount> {
    const { data: countNumber, error: numberError } = await supabase
      .rpc('generate_inventory_count_number', { p_org_id: orgId });

    if (numberError) throw numberError;

    const { data: count, error: countError } = await supabase
      .from('inventory_counts')
      .insert({
        org_id: orgId,
        count_number: countNumber,
        count_type: countData.count_type,
        count_date: countData.count_date,
        status: 'draft',
        category_filter: countData.category_filter,
        location_filter: countData.location_filter,
        high_rotation_only: countData.high_rotation_only ?? false,
        notes: countData.notes,
        created_by: userId,
        counted_by: userId,
      })
      .select()
      .single();

    if (countError) throw countError;

    let partsQuery = supabase
      .from('parts_inventory')
      .select('id, part_code, part_name, quantity, unit_cost, component')
      .eq('org_id', orgId);

    if (countData.count_type === 'partial') {
      if (countData.category_filter) {
        // @ts-expect-error - component type narrowing
        partsQuery = partsQuery.eq('component', countData.category_filter);
      }
      if (countData.part_ids?.length) {
        partsQuery = partsQuery.in('id', countData.part_ids);
      }
    } else if (countData.count_type === 'cyclic' && countData.high_rotation_only) {
      partsQuery = partsQuery.gt('quantity', 0);
    }

    const { data: parts, error: partsError } = await partsQuery;
    if (partsError) throw partsError;

    if (parts?.length) {
      const items = parts.map((part) => ({
        count_id: count.id,
        part_id: part.id,
        expected_quantity: part.quantity,
        unit_cost: part.unit_cost,
      }));

      const { error: itemsError } = await supabase
        .from('inventory_count_items')
        .insert(items);

      if (itemsError) throw itemsError;
    }

    return { ...count, _partsCount: parts?.length ?? 0 } as unknown as InventoryCount;
  }

  async startCount(countId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_counts')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', countId);

    if (error) throw error;
  }

  async cancelCount(countId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_counts')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', countId);

    if (error) throw error;
  }

  async updateCountItem(data: UpdateCountItemData, userId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_count_items')
      .update({
        counted_quantity: data.counted_quantity,
        notes: data.notes,
        counted_by: userId,
        counted_at: new Date().toISOString(),
      })
      .eq('id', data.item_id);

    if (error) throw error;
  }

  async processCount(countId: string): Promise<void> {
    const { error } = await supabase
      .rpc('process_inventory_count_adjustments', { p_count_id: countId });

    if (error) throw error;
  }

  async getUserName(userId: string | null | undefined): Promise<string> {
    if (!userId) return 'N/A';
    const { data } = await supabase
      .from('user_basic_info')
      .select('name')
      .eq('user_id', userId)
      .single();
    return data?.name ?? 'Usuário';
  }

  getDivergenceReport(items: InventoryCountItem[]): DivergenceReport {
    const divergences = items.filter(
      (item) => item.counted_quantity !== undefined && item.difference !== 0
    );

    return {
      totalItems: items.length,
      totalCounted: items.filter((item) => item.counted_quantity !== undefined).length,
      totalDivergences: divergences.length,
      totalIncrease: divergences
        .filter((item) => (item.difference ?? 0) > 0)
        .reduce((sum, item) => sum + (item.difference ?? 0), 0),
      totalDecrease: divergences
        .filter((item) => (item.difference ?? 0) < 0)
        .reduce((sum, item) => sum + Math.abs(item.difference ?? 0), 0),
      financialImpact: divergences.reduce(
        (sum, item) => sum + ((item.difference ?? 0) * (item.unit_cost ?? 0)),
        0
      ),
      divergences,
    };
  }
}

export const inventoryCountService = new InventoryCountService();
