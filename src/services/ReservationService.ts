import { supabase } from '@/integrations/supabase/client';

export interface PartReservation {
  id: string;
  org_id: string;
  part_id?: string;
  part_code: string;
  part_name: string;
  budget_id?: string;
  order_id?: string;
  quantity_reserved: number;
  quantity_separated?: number;
  quantity_applied?: number;
  unit_cost?: number;
  total_reserved_cost?: number;
  reservation_status: 'reserved' | 'partial' | 'separated' | 'applied' | 'expired' | 'cancelled';
  reserved_at: string;
  expires_at?: string;
  reserved_by?: string;
  separated_at?: string;
  separated_by?: string;
  applied_at?: string;
  applied_by?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: unknown;
  part?: { id: string; part_name: string; part_code: string; quantity: number };
  budget?: { id: string; budget_number: string };
  order?: { id: string; order_number: string; customer?: { name: string } | null };
}

export interface ReservationResult {
  success: boolean;
  reservations: Array<{
    reservation_id: string;
    part_id: string;
    part_name: string;
    quantity_reserved: number;
    status: 'reserved' | 'partial';
  }>;
  needs: Array<{
    need_id: string;
    part_id: string;
    part_name: string;
    quantity_needed: number;
    status: 'need_created';
  }>;
}

export interface ReservationFilters {
  status?: string;
  order_id?: string;
  budget_id?: string;
  part_id?: string;
}

export interface ReservationStats {
  total: number;
  active: number;
  applied: number;
  expired: number;
  cancelled: number;
  totalQuantityReserved: number;
  totalQuantityApplied: number;
}

export interface PaginatedReservations {
  data: PartReservation[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

class ReservationService {
  async listReservations(
    orgId: string,
    filters?: ReservationFilters,
    page = 1,
    pageSize = PAGE_SIZE
  ): Promise<PaginatedReservations> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('parts_reservations')
      .select(
        `*,
        part:parts_inventory(id, part_name, part_code, quantity),
        budget:detailed_budgets(id, budget_number),
        order:orders(id, order_number)`,
        { count: 'exact' }
      )
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.status) query = query.eq('reservation_status', filters.status);
    if (filters?.order_id) query = query.eq('order_id', filters.order_id);
    if (filters?.budget_id) query = query.eq('budget_id', filters.budget_id);
    if (filters?.part_id) query = query.eq('part_id', filters.part_id);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    return {
      data: (data ?? []) as PartReservation[],
      count: total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async listForSeparation(
    orgId: string,
    status: string,
    page = 1,
    pageSize = PAGE_SIZE
  ): Promise<PaginatedReservations> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('parts_reservations')
      .select(
        `*,
        order:orders(
          order_number,
          customer:customers(name)
        )`,
        { count: 'exact' }
      )
      .eq('org_id', orgId)
      .order('reserved_at', { ascending: false })
      .range(from, to);

    if (status !== 'all') query = query.eq('reservation_status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    return {
      data: (data ?? []) as unknown as PartReservation[],
      count: total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getExpiringReservations(orgId: string, daysAhead = 7): Promise<PartReservation[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('parts_reservations')
      .select(`
        *,
        part:parts_inventory(id, part_name, part_code),
        order:orders(id, order_number)
      `)
      .eq('org_id', orgId)
      .in('reservation_status', ['reserved', 'partial', 'separated'])
      .lt('expires_at', expiryDate.toISOString())
      .not('expires_at', 'is', null)
      .order('expires_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as PartReservation[];
  }

  async getStats(orgId: string): Promise<ReservationStats | null> {
    const { data, error } = await supabase
      .from('parts_reservations')
      .select('reservation_status, quantity_reserved, quantity_applied')
      .eq('org_id', orgId)
      .neq('reservation_status', 'cancelled');

    if (error) throw error;

    return {
      total: data.length,
      active: data.filter((r) => ['reserved', 'partial', 'separated'].includes(r.reservation_status)).length,
      applied: data.filter((r) => r.reservation_status === 'applied').length,
      expired: data.filter((r) => r.reservation_status === 'expired').length,
      cancelled: data.filter((r) => r.reservation_status === 'cancelled').length,
      totalQuantityReserved: data
        .filter((r) => ['reserved', 'partial', 'separated'].includes(r.reservation_status))
        .reduce((sum, r) => sum + (r.quantity_reserved - (r.quantity_applied ?? 0)), 0),
      totalQuantityApplied: data.reduce((sum, r) => sum + (r.quantity_applied ?? 0), 0),
    };
  }

  async reservePartsFromBudget(budgetId: string): Promise<ReservationResult> {
    // @ts-expect-error - RPC function not in generated types
    const { data, error } = await supabase.rpc('reserve_parts_from_budget', {
      p_budget_id: budgetId,
    });
    if (error) throw error;
    return data as unknown as ReservationResult;
  }

  async consumeReservedParts(
    orderId: string,
    parts: Array<{ part_code: string; quantity: number }>
  ): Promise<{ success: boolean; consumed: unknown[]; errors: unknown[] }> {
    // @ts-expect-error - RPC function not in generated types
    const { data, error } = await supabase.rpc('consume_reserved_parts', {
      p_order_id: orderId,
      p_parts: parts,
    });
    if (error) throw error;
    return data as { success: boolean; consumed: unknown[]; errors: unknown[] };
  }

  async cancelReservation(
    reservationId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string; quantity_released?: number }> {
    // @ts-expect-error - RPC function not in generated types
    const { data, error } = await supabase.rpc('cancel_reservation', {
      p_reservation_id: reservationId,
      p_reason: reason ?? null,
    });
    if (error) throw error;
    return data as { success: boolean; error?: string; quantity_released?: number };
  }

  async extendReservation(
    reservationId: string,
    additionalDays: number
  ): Promise<{ success: boolean; error?: string; new_expires_at?: string }> {
    // @ts-expect-error - RPC function not in generated types
    const { data, error } = await supabase.rpc('extend_reservation', {
      p_reservation_id: reservationId,
      p_additional_days: additionalDays,
    });
    if (error) throw error;
    return data as { success: boolean; error?: string; new_expires_at?: string };
  }

  async separateReservedParts(
    reservationId: string,
    quantityToSeparate: number
  ): Promise<{ success: boolean; error?: string; quantity_separated?: number }> {
    // @ts-expect-error - RPC function not in generated types
    const { data, error } = await supabase.rpc('separate_reserved_parts', {
      p_reservation_id: reservationId,
      p_quantity_to_separate: quantityToSeparate,
    });
    if (error) throw error;
    return data as { success: boolean; error?: string; quantity_separated?: number };
  }

  async separatePart(
    reservationId: string,
    orgId: string,
    quantityReserved: number,
    notes: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('parts_reservations')
      .update({
        quantity_separated: quantityReserved,
        reservation_status: 'separated',
        separated_at: new Date().toISOString(),
        separated_by: userId || null,
        notes: notes || null,
      } as unknown as Record<string, unknown>)
      .eq('id', reservationId)
      .eq('org_id', orgId);

    if (error) throw error;
  }
}

export const reservationService = new ReservationService();
