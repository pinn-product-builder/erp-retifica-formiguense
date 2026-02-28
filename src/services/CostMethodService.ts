import { supabase } from '@/integrations/supabase/client';
import type { PaginatedResult } from './InventoryService';

export type CostMethod = 'moving_avg' | 'fifo' | 'specific_id';

export interface CostLayer {
  id: string;
  org_id: string;
  part_id: string;
  batch_id: string | null;
  movement_id: string | null;
  quantity_original: number;
  quantity_remaining: number;
  unit_cost: number;
  total_cost: number;
  entry_date: string;
  created_at: string;
}

export interface CostDetail {
  id: string;
  movement_id: string;
  cost_type: 'price' | 'freight' | 'insurance' | 'tax_non_recoverable' | 'other';
  amount: number;
  description: string | null;
  created_at: string;
}

export interface CostMethodChange {
  id: string;
  org_id: string;
  part_id: string;
  old_method: CostMethod;
  new_method: CostMethod;
  justification: string;
  requested_by: string;
  approved_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  resolved_at: string | null;
}

export const COST_METHOD_LABELS: Record<CostMethod, string> = {
  moving_avg: 'Média Móvel',
  fifo: 'FIFO (PEPS)',
  specific_id: 'Identificação Específica',
};

class CostMethodService {
  async listCostLayers(
    orgId: string,
    partId: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResult<CostLayer>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('cost_layers' as never)
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('part_id', partId)
      .gt('quantity_remaining', 0)
      .order('entry_date', { ascending: true })
      .range(from, to);

    if (error) throw error;
    const total = count ?? 0;
    return {
      data: (data ?? []) as CostLayer[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createCostLayer(orgId: string, input: Omit<CostLayer, 'id' | 'org_id' | 'total_cost' | 'created_at'>): Promise<CostLayer> {
    const { data, error } = await supabase
      .from('cost_layers' as never)
      .insert({ ...input, org_id: orgId } as never)
      .select()
      .single();

    if (error) throw error;
    return data as CostLayer;
  }

  async requestMethodChange(
    orgId: string,
    partId: string,
    currentMethod: CostMethod,
    newMethod: CostMethod,
    justification: string,
    requestedBy: string
  ): Promise<CostMethodChange> {
    const { data, error } = await supabase
      .from('cost_method_changes' as never)
      .insert({
        org_id: orgId,
        part_id: partId,
        old_method: currentMethod,
        new_method: newMethod,
        justification,
        requested_by: requestedBy,
        status: 'pending',
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as CostMethodChange;
  }

  async approveMethodChange(
    changeId: string,
    approvedBy: string
  ): Promise<void> {
    const { data: change, error: fetchError } = await supabase
      .from('cost_method_changes' as never)
      .select('*')
      .eq('id', changeId)
      .single();

    if (fetchError) throw fetchError;
    const c = change as CostMethodChange;

    const { error: updateChangeError } = await supabase
      .from('cost_method_changes' as never)
      .update({
        status: 'approved',
        approved_by: approvedBy,
        resolved_at: new Date().toISOString(),
      } as never)
      .eq('id', changeId);

    if (updateChangeError) throw updateChangeError;

    const { error: updatePartError } = await supabase
      .from('parts_inventory')
      .update({
        cost_method: c.new_method,
        cost_method_changed_at: new Date().toISOString(),
        cost_method_changed_by: approvedBy,
      })
      .eq('id', c.part_id);

    if (updatePartError) throw updatePartError;
  }

  async rejectMethodChange(changeId: string, approvedBy: string): Promise<void> {
    const { error } = await supabase
      .from('cost_method_changes' as never)
      .update({
        status: 'rejected',
        approved_by: approvedBy,
        resolved_at: new Date().toISOString(),
      } as never)
      .eq('id', changeId);

    if (error) throw error;
  }

  async listPendingChanges(orgId: string): Promise<CostMethodChange[]> {
    const { data, error } = await supabase
      .from('cost_method_changes' as never)
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as CostMethodChange[];
  }

  async getCostLayerSummary(orgId: string, partId: string): Promise<{
    total_layers: number;
    total_quantity: number;
    total_cost: number;
    avg_cost: number;
    next_layer_cost: number | null;
  }> {
    const { data, error } = await supabase
      .from('cost_layers' as never)
      .select('quantity_remaining, unit_cost, entry_date')
      .eq('org_id', orgId)
      .eq('part_id', partId)
      .gt('quantity_remaining', 0)
      .order('entry_date', { ascending: true });

    if (error) throw error;

    const layers = (data ?? []) as Pick<CostLayer, 'quantity_remaining' | 'unit_cost' | 'entry_date'>[];
    const totalQty = layers.reduce((s, l) => s + l.quantity_remaining, 0);
    const totalCost = layers.reduce((s, l) => s + l.quantity_remaining * l.unit_cost, 0);

    return {
      total_layers: layers.length,
      total_quantity: totalQty,
      total_cost: totalCost,
      avg_cost: totalQty > 0 ? totalCost / totalQty : 0,
      next_layer_cost: layers.length > 0 ? layers[0].unit_cost : null,
    };
  }

  async listCostDetails(movementId: string): Promise<CostDetail[]> {
    const { data, error } = await supabase
      .from('cost_details' as never)
      .select('*')
      .eq('movement_id', movementId);

    if (error) throw error;
    return (data ?? []) as CostDetail[];
  }

  async saveCostDetails(movementId: string, details: Omit<CostDetail, 'id' | 'created_at'>[]): Promise<void> {
    await supabase
      .from('cost_details' as never)
      .delete()
      .eq('movement_id', movementId);

    if (details.length === 0) return;

    const { error } = await supabase
      .from('cost_details' as never)
      .insert(details as never);

    if (error) throw error;
  }
}

export const costMethodService = new CostMethodService();
