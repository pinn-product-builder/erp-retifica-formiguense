import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { PaginatedResult } from './InventoryService';

type AlertRow = Database['public']['Tables']['stock_alerts']['Row'];

export type AlertUrgency = 'critical' | 'high' | 'medium' | 'low';

export interface StockAlert extends AlertRow {
  urgency?: AlertUrgency;
}

export interface AlertFilters {
  urgency?: AlertUrgency;
  alert_type?: string;
  is_active?: boolean;
  search?: string;
}

export interface AlertStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  active: number;
}

function computeUrgency(alert: AlertRow): AlertUrgency {
  if (alert.current_stock === 0) return 'critical';
  const ratio = alert.current_stock / (alert.minimum_stock || 1);
  if (ratio <= 0.25) return 'critical';
  if (ratio <= 0.5) return 'high';
  if (ratio <= 0.75) return 'medium';
  return 'low';
}

class StockAlertService {
  async listAlerts(
    orgId: string,
    filters?: AlertFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<StockAlert>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('stock_alerts')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.alert_type) {
      query = query.eq('alert_type', filters.alert_type);
    }

    if (filters?.search) {
      query = query.or(
        `part_name.ilike.%${filters.search}%,part_code.ilike.%${filters.search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    let alerts = ((data ?? []) as AlertRow[]).map((a) => ({
      ...a,
      urgency: computeUrgency(a),
    }));

    if (filters?.urgency) {
      alerts = alerts.filter((a) => a.urgency === filters.urgency);
    }

    const total = count ?? 0;
    return {
      data: alerts,
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getActiveAlerts(orgId: string): Promise<StockAlert[]> {
    const { data, error } = await supabase
      .from('stock_alerts')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as AlertRow[]).map((a) => ({ ...a, urgency: computeUrgency(a) }));
  }

  async getAlertStats(orgId: string): Promise<AlertStats> {
    const { data, error } = await supabase
      .from('stock_alerts')
      .select('*')
      .eq('org_id', orgId);

    if (error) throw error;

    const alerts = ((data ?? []) as AlertRow[]).map((a) => ({
      ...a,
      urgency: computeUrgency(a),
    }));

    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.urgency === 'critical').length,
      high: alerts.filter((a) => a.urgency === 'high').length,
      medium: alerts.filter((a) => a.urgency === 'medium').length,
      low: alerts.filter((a) => a.urgency === 'low').length,
      active: alerts.filter((a) => a.is_active).length,
    };
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('stock_alerts')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  async resolveAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('stock_alerts')
      .update({
        is_active: false,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  async createPurchaseNeedFromAlert(
    orgId: string,
    alert: StockAlert
  ): Promise<string> {
    const partCode = alert.part_code ?? 'N/A';
    const priorityLevel =
      alert.urgency === 'critical' ? 'critical' :
      alert.urgency === 'high' ? 'high' : 'medium';

    const { data: existing } = await supabase
      .from('purchase_needs')
      .select('id')
      .eq('org_id', orgId)
      .eq('part_code', partCode)
      .in('status', ['pending', 'in_quotation', 'ordered'])
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('purchase_needs')
        .update({
          required_quantity: (alert.minimum_stock ?? 1) * 2,
          available_quantity: alert.current_stock,
          priority_level: priorityLevel,
        })
        .eq('id', existing.id);

      if (error) throw error;
      return existing.id;
    }

    const { data, error } = await supabase
      .from('purchase_needs')
      .insert({
        org_id: orgId,
        part_code: partCode,
        part_name: alert.part_name,
        required_quantity: (alert.minimum_stock ?? 1) * 2,
        available_quantity: alert.current_stock,
        priority_level: priorityLevel,
        need_type: 'stock_replenishment',
        related_orders: [],
        suggested_suppliers: [],
        estimated_cost: 0,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }
}

export const stockAlertService = new StockAlertService();
