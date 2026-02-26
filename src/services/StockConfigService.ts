import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { PaginatedResult } from './InventoryService';

type ConfigRow = Database['public']['Tables']['parts_stock_config']['Row'];

export interface StockConfig extends ConfigRow {}

export interface StockConfigFilters {
  search?: string;
  abc_classification?: string;
  is_critical?: boolean;
}

export interface UpsertStockConfigInput {
  part_code: string;
  part_name: string;
  minimum_stock?: number;
  maximum_stock?: number;
  reorder_point?: number;
  safety_stock?: number;
  lead_time_days?: number;
  economic_order_quantity?: number;
  auto_reorder_enabled?: boolean;
  is_critical?: boolean;
  abc_classification?: string;
  rotation_frequency?: string;
  preferred_supplier_id?: string;
}

class StockConfigService {
  async listConfigs(
    orgId: string,
    filters?: StockConfigFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<StockConfig>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('parts_stock_config')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('part_name')
      .range(from, to);

    if (filters?.search) {
      query = query.or(
        `part_name.ilike.%${filters.search}%,part_code.ilike.%${filters.search}%`
      );
    }

    if (filters?.abc_classification) {
      query = query.eq('abc_classification', filters.abc_classification);
    }

    if (filters?.is_critical !== undefined) {
      query = query.eq('is_critical', filters.is_critical);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    return {
      data: (data ?? []) as StockConfig[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getConfigByPartCode(partCode: string, orgId: string): Promise<StockConfig | null> {
    const { data, error } = await supabase
      .from('parts_stock_config')
      .select('*')
      .eq('part_code', partCode)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data as StockConfig | null;
  }

  async upsertConfig(orgId: string, userId: string, input: UpsertStockConfigInput): Promise<StockConfig> {
    const existing = await this.getConfigByPartCode(input.part_code, orgId);

    if (existing) {
      const { data, error } = await supabase
        .from('parts_stock_config')
        .update({
          ...input,
          updated_by: userId,
          last_updated: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as StockConfig;
    }

    const { data, error } = await supabase
      .from('parts_stock_config')
      .insert({
        ...input,
        org_id: orgId,
        updated_by: userId,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as StockConfig;
  }

  async deleteConfig(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('parts_stock_config')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
  }

  async bulkUpsertConfigs(
    orgId: string,
    userId: string,
    configs: UpsertStockConfigInput[]
  ): Promise<number> {
    let count = 0;
    for (const config of configs) {
      await this.upsertConfig(orgId, userId, config);
      count++;
    }
    return count;
  }

  async syncFromInventory(orgId: string): Promise<StockConfig[]> {
    const { data: parts, error } = await supabase
      .from('parts_inventory')
      .select('part_code, part_name')
      .eq('org_id', orgId)
      .not('part_code', 'is', null);

    if (error) throw error;

    const { data: existing } = await supabase
      .from('parts_stock_config')
      .select('part_code')
      .eq('org_id', orgId);

    const existingCodes = new Set((existing ?? []).map((c) => c.part_code));
    const toCreate = (parts ?? []).filter((p) => p.part_code && !existingCodes.has(p.part_code));

    if (toCreate.length === 0) return [];

    const rows = toCreate.map((p) => ({
      org_id: orgId,
      part_code: p.part_code!,
      part_name: p.part_name,
      minimum_stock: 1,
      maximum_stock: 10,
      reorder_point: 2,
      safety_stock: 1,
    }));

    const { data: created, error: insertError } = await supabase
      .from('parts_stock_config')
      .insert(rows)
      .select();

    if (insertError) throw insertError;
    return (created ?? []) as StockConfig[];
  }
}

export const stockConfigService = new StockConfigService();
