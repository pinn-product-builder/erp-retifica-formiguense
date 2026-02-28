import { supabase } from '@/integrations/supabase/client';
import type { PaginatedResult } from './InventoryService';

export interface StockBatch {
  id: string;
  org_id: string;
  part_id: string;
  batch_number: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  best_before_date: string | null;
  supplier_id: string | null;
  purchase_receipt_id: string | null;
  quantity: number;
  reserved_quantity: number;
  unit_cost: number | null;
  status: 'available' | 'reserved' | 'quarantine' | 'expired' | 'consumed';
  quarantine_until: string | null;
  quarantine_reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface StockSerial {
  id: string;
  org_id: string;
  part_id: string;
  batch_id: string | null;
  serial_number: string;
  status: 'available' | 'reserved' | 'sold' | 'returned' | 'scrapped';
  current_location_id: string | null;
  purchase_receipt_id: string | null;
  sale_order_id: string | null;
  warranty_expires_at: string | null;
  notes: string | null;
  created_at: string;
  sold_at: string | null;
}

export type CreateBatchInput = Omit<StockBatch, 'id' | 'org_id' | 'created_at'>;
export type CreateSerialInput = Omit<StockSerial, 'id' | 'org_id' | 'created_at'>;

export type BatchStatus = StockBatch['status'];

export interface BatchFilters {
  part_id?: string;
  status?: BatchStatus | 'todos';
  search?: string;
  expiring_in_days?: number;
}

export interface ExpiryAlertLevel {
  level: 'critical' | 'high' | 'warning' | 'ok';
  label: string;
  daysToExpiry: number | null;
}

function computeExpiryAlert(expiryDate: string | null): ExpiryAlertLevel {
  if (!expiryDate) return { level: 'ok', label: 'Sem validade', daysToExpiry: null };

  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - today.getTime();
  const daysToExpiry = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysToExpiry < 0) return { level: 'critical', label: 'Vencido', daysToExpiry };
  if (daysToExpiry <= 30) return { level: 'critical', label: `Vence em ${daysToExpiry}d`, daysToExpiry };
  if (daysToExpiry <= 60) return { level: 'high', label: `Vence em ${daysToExpiry}d`, daysToExpiry };
  if (daysToExpiry <= 90) return { level: 'warning', label: `Vence em ${daysToExpiry}d`, daysToExpiry };
  return { level: 'ok', label: `Vence em ${daysToExpiry}d`, daysToExpiry };
}

export type StockBatchWithAlert = StockBatch & { expiry_alert: ExpiryAlertLevel };

class StockBatchService {
  async listBatches(
    orgId: string,
    filters?: BatchFilters,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResult<StockBatchWithAlert>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('stock_batches' as never)
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .range(from, to);

    if (filters?.part_id) {
      query = query.eq('part_id', filters.part_id);
    }

    if (filters?.status && filters.status !== 'todos') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.ilike('batch_number', `%${filters.search}%`);
    }

    if (filters?.expiring_in_days !== undefined) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + filters.expiring_in_days);
      query = query.lte('expiry_date', deadline.toISOString().split('T')[0]);
      query = query.gte('expiry_date', new Date().toISOString().split('T')[0]);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const batches = ((data ?? []) as StockBatch[]).map((b) => ({
      ...b,
      expiry_alert: computeExpiryAlert(b.expiry_date),
    }));

    const total = count ?? 0;
    return { data: batches, count: total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getBatchById(id: string, orgId: string): Promise<StockBatchWithAlert | null> {
    const { data, error } = await supabase
      .from('stock_batches' as never)
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) throw error;
    const b = data as StockBatch;
    return { ...b, expiry_alert: computeExpiryAlert(b.expiry_date) };
  }

  async createBatch(orgId: string, input: CreateBatchInput): Promise<StockBatch> {
    const { data, error } = await supabase
      .from('stock_batches' as never)
      .insert({ ...input, org_id: orgId } as never)
      .select()
      .single();

    if (error) throw error;
    return data as StockBatch;
  }

  async updateBatch(id: string, orgId: string, input: Partial<CreateBatchInput>): Promise<StockBatch> {
    const { data, error } = await supabase
      .from('stock_batches' as never)
      .update(input as never)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data as StockBatch;
  }

  async getFEFOSuggestion(orgId: string, partId: string): Promise<StockBatchWithAlert | null> {
    const { data, error } = await supabase
      .from('stock_batches' as never)
      .select('*')
      .eq('org_id', orgId)
      .eq('part_id', partId)
      .eq('status', 'available')
      .gt('quantity', 0)
      .not('expiry_date', 'is', null)
      .order('expiry_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    const b = data as StockBatch;
    return { ...b, expiry_alert: computeExpiryAlert(b.expiry_date) };
  }

  async getBatchStats(orgId: string): Promise<{
    total_batches: number;
    expiring_30: number;
    expiring_60: number;
    expired: number;
    quarantine: number;
  }> {
    const { data, error } = await supabase
      .from('stock_batches' as never)
      .select('expiry_date, status')
      .eq('org_id', orgId);

    if (error) throw error;

    const batches = (data ?? []) as Pick<StockBatch, 'expiry_date' | 'status'>[];
    const today = new Date();
    const d30 = new Date(); d30.setDate(today.getDate() + 30);
    const d60 = new Date(); d60.setDate(today.getDate() + 60);

    return {
      total_batches: batches.length,
      expired: batches.filter((b) => b.status === 'expired').length,
      quarantine: batches.filter((b) => b.status === 'quarantine').length,
      expiring_30: batches.filter((b) => {
        if (!b.expiry_date || b.status !== 'available') return false;
        const exp = new Date(b.expiry_date);
        return exp >= today && exp <= d30;
      }).length,
      expiring_60: batches.filter((b) => {
        if (!b.expiry_date || b.status !== 'available') return false;
        const exp = new Date(b.expiry_date);
        return exp > d30 && exp <= d60;
      }).length,
    };
  }

  async listSerials(
    orgId: string,
    partId?: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResult<StockSerial>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('stock_serials' as never)
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (partId) {
      query = query.eq('part_id', partId);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    return {
      data: (data ?? []) as StockSerial[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createSerial(orgId: string, input: CreateSerialInput): Promise<StockSerial> {
    const { data, error } = await supabase
      .from('stock_serials' as never)
      .insert({ ...input, org_id: orgId } as never)
      .select()
      .single();

    if (error) throw error;
    return data as StockSerial;
  }
}

export const stockBatchService = new StockBatchService();
