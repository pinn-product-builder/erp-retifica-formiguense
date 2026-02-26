import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { PaginatedResult } from './InventoryService';

type MovementRow = Database['public']['Tables']['inventory_movements']['Row'];

export type MovementType = 'entrada' | 'saida' | 'ajuste' | 'transferencia' | 'reserva' | 'baixa';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface InventoryMovement extends MovementRow {
  movement_type: MovementType;
  created_by_name?: string;
  approved_by_name?: string;
  part_name?: string;
  part_code?: string;
  current_stock?: number;
  order_number?: string;
  approval_status?: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  requires_approval?: boolean;
}

export interface CreateMovementInput {
  part_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number;
  order_id?: string;
  budget_id?: string;
  reason: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface MovementFilters {
  part_id?: string;
  movement_type?: MovementType;
  start_date?: string;
  end_date?: string;
  order_id?: string;
  budget_id?: string;
}

export const ENTRY_REASONS = [
  { code: 'ENT-001', label: 'Compra de fornecedor' },
  { code: 'ENT-002', label: 'Devolução de cliente' },
  { code: 'ENT-003', label: 'Transferência entre depósitos' },
  { code: 'ENT-004', label: 'Ajuste de inventário (positivo)' },
  { code: 'ENT-005', label: 'Retorno de produção' },
  { code: 'ENT-006', label: 'Devolução interna' },
  { code: 'ENT-007', label: 'Outro' },
];

export const EXIT_REASONS = [
  { code: 'SAI-001', label: 'Aplicação em OS' },
  { code: 'SAI-002', label: 'Venda direta' },
  { code: 'SAI-003', label: 'Transferência entre depósitos' },
  { code: 'SAI-004', label: 'Ajuste de inventário (negativo)' },
  { code: 'SAI-005', label: 'Outro' },
];

export const WRITEOFF_REASONS = [
  { code: 'BAI-001', label: 'Dano/quebra' },
  { code: 'BAI-002', label: 'Obsolescência' },
  { code: 'BAI-003', label: 'Perda/furto' },
  { code: 'BAI-004', label: 'Vencimento' },
  { code: 'BAI-005', label: 'Não conforme' },
  { code: 'BAI-006', label: 'Outro' },
];

class StockMovementService {
  async listMovements(
    orgId: string,
    filters?: MovementFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<InventoryMovement>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
      .from('inventory_movements_with_users')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.part_id) query = query.eq('part_id', filters.part_id);
    if (filters?.movement_type) query = query.eq('movement_type', filters.movement_type);
    if (filters?.start_date && filters?.end_date) {
      query = query.gte('created_at', filters.start_date).lte('created_at', filters.end_date);
    }
    if (filters?.order_id) query = query.eq('order_id', filters.order_id);
    if (filters?.budget_id) query = query.eq('budget_id', filters.budget_id);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    return {
      data: (data ?? []) as unknown as InventoryMovement[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createMovement(
    orgId: string,
    userId: string,
    input: CreateMovementInput
  ): Promise<InventoryMovement> {
    const { data: part, error: partError } = await supabase
      .from('parts_inventory')
      .select('quantity, part_name, unit_cost')
      .eq('id', input.part_id)
      .eq('org_id', orgId)
      .single();

    if (partError) throw partError;
    if (!part) throw new Error('Peça não encontrada');

    let newQuantity = part.quantity;
    const qty = Math.abs(input.quantity);

    switch (input.movement_type) {
      case 'entrada':
        newQuantity += qty;
        break;
      case 'saida':
      case 'baixa':
      case 'reserva':
        newQuantity -= qty;
        break;
      case 'ajuste':
        newQuantity += input.quantity;
        break;
      case 'transferencia':
        newQuantity -= qty;
        break;
    }

    if (newQuantity < 0) {
      throw new Error(
        `Estoque insuficiente. Disponível: ${part.quantity}. Operação: ${input.movement_type} de ${qty}`
      );
    }

    let avgCost = part.unit_cost ?? 0;
    if (input.movement_type === 'entrada' && input.unit_cost) {
      const currentValue = part.quantity * (part.unit_cost ?? 0);
      const incomingValue = qty * input.unit_cost;
      const newQtyAfter = part.quantity + qty;
      avgCost = newQtyAfter > 0 ? (currentValue + incomingValue) / newQtyAfter : input.unit_cost;
    }

    const { data: movement, error: movError } = await supabase
      .from('inventory_movements')
      .insert([
        {
          part_id: input.part_id,
          movement_type: input.movement_type,
          quantity: qty,
          previous_quantity: part.quantity,
          new_quantity: newQuantity,
          unit_cost: input.unit_cost,
          order_id: input.order_id ?? null,
          budget_id: input.budget_id ?? null,
          reason: input.reason,
          notes: input.notes ?? null,
          metadata: input.metadata ?? null,
          org_id: orgId,
          created_by: userId,
        } as unknown,
      ])
      .select()
      .single();

    if (movError) throw movError;

    const updateData: Record<string, unknown> = { quantity: newQuantity };
    if (input.movement_type === 'entrada' && input.unit_cost) {
      updateData.unit_cost = Math.round(avgCost * 100) / 100;
    }

    await supabase
      .from('parts_inventory')
      .update(updateData)
      .eq('id', input.part_id)
      .eq('org_id', orgId);

    return movement as unknown as InventoryMovement;
  }

  async fetchPendingApprovals(orgId: string): Promise<InventoryMovement[]> {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`*, part:parts_inventory(part_name, part_code, quantity)`)
      .eq('org_id', orgId)
      .eq('approval_status' as unknown as 'org_id', 'pending' as unknown as string)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as unknown as InventoryMovement[];
  }

  async approveMovement(movementId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_movements')
      .update({
        approval_status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      } as unknown as Record<string, unknown>)
      .eq('id', movementId);

    if (error) throw error;
  }

  async rejectMovement(movementId: string, userId: string, rejectionReason: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_movements')
      .update({
        approval_status: 'rejected',
        approved_by: userId,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      } as unknown as Record<string, unknown>)
      .eq('id', movementId);

    if (error) throw error;
  }
}

export const stockMovementService = new StockMovementService();
