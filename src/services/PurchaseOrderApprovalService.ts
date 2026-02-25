import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderService } from './PurchaseOrderService';

export const REJECTION_REASON_MIN_LENGTH = 10;

export const rejectionReasonSchema = z
  .string()
  .min(REJECTION_REASON_MIN_LENGTH, `O motivo deve ter no mínimo ${REJECTION_REASON_MIN_LENGTH} caracteres`);

export type RejectionReason = z.infer<typeof rejectionReasonSchema>;

export interface PendingApprovalRow {
  id: string;
  po_number: string;
  org_id: string;
  supplier_id: string;
  status: string;
  order_date: string | null;
  expected_delivery: string | null;
  total_value: number | null;
  created_by: string | null;
  created_at: string;
  supplier_name: string;
  required_level: 'auto' | 'gerente' | 'admin';
  items_count?: number;
  items_preview?: Array<{ item_name: string; quantity: number; unit_price: number }>;
}

export interface ApprovalHistoryRow {
  id: string;
  order_id: string;
  action: 'enviado' | 'aprovado' | 'rejeitado' | 'escalado';
  performed_by: string;
  performed_at: string;
  required_level: string;
  notes?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  performer_name?: string;
}

export type AppRole = 'owner' | 'admin' | 'manager' | 'user' | 'super_admin';

function getRequiredLevel(totalValue: number): 'auto' | 'gerente' | 'admin' {
  if (totalValue < 1000) return 'auto';
  if (totalValue < 5000) return 'gerente';
  return 'admin';
}

function canApproveAtLevel(role: AppRole | null, requiredLevel: 'auto' | 'gerente' | 'admin'): boolean {
  if (!role) return false;
  if (requiredLevel === 'auto') return true;
  if (requiredLevel === 'gerente') {
    return ['manager', 'admin', 'owner', 'super_admin'].includes(role);
  }
  return ['admin', 'owner', 'super_admin'].includes(role);
}

export const PurchaseOrderApprovalService = {
  async listPending(orgId: string): Promise<PendingApprovalRow[]> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        id, po_number, org_id, supplier_id, status,
        order_date, expected_delivery, total_value, created_by, created_at,
        supplier:suppliers(name),
        items:purchase_order_items(id, item_name, quantity, unit_price)
      `)
      .eq('org_id', orgId)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row: Record<string, unknown>) => {
      const items = (row.items as Array<{ id: string; item_name: string; quantity: number; unit_price: number }>) ?? [];
      return {
        id: row.id,
        po_number: row.po_number,
        org_id: row.org_id,
        supplier_id: row.supplier_id,
        status: row.status,
        order_date: row.order_date,
        expected_delivery: row.expected_delivery,
        total_value: row.total_value ?? 0,
        created_by: row.created_by,
        created_at: row.created_at,
        supplier_name: (row.supplier as { name?: string })?.name ?? '',
        required_level: getRequiredLevel(Number(row.total_value) || 0),
        items_count: items.length,
        items_preview: items.slice(0, 3).map((i) => ({
          item_name: i.item_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      };
    }) as PendingApprovalRow[];
  },

  async listHistory(orderId: string): Promise<ApprovalHistoryRow[]> {
    const { data, error } = await supabase
      .from('purchase_order_approvals')
      .select('id, order_id, action, performed_by, performed_at, required_level, notes, rejection_reason, created_at')
      .eq('order_id', orderId)
      .order('performed_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ApprovalHistoryRow[];
  },

  async sendForApproval(orderId: string, totalValue: number, userId: string): Promise<'approved' | 'pending_approval'> {
    const level = getRequiredLevel(totalValue);

    if (level === 'auto') {
      await PurchaseOrderService.approve(orderId, userId);
      await this.recordApproval(orderId, 'aprovado', userId, 'auto');
      return 'approved';
    }

    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'pending_approval',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    await this.recordApproval(orderId, 'enviado', userId, level);
    return 'pending_approval';
  },

  async approve(
    orderId: string,
    userId: string,
    userRole: AppRole | null,
    totalValue: number,
  ): Promise<void> {
    const level = getRequiredLevel(totalValue);
    if (!canApproveAtLevel(userRole, level)) {
      throw new Error('Você não tem permissão para aprovar este pedido');
    }

    await PurchaseOrderService.approve(orderId, userId);
    await this.recordApproval(orderId, 'aprovado', userId, level);
  },

  async reject(
    orderId: string,
    userId: string,
    userRole: AppRole | null,
    totalValue: number,
    reason: RejectionReason,
  ): Promise<void> {
    const level = getRequiredLevel(totalValue);
    if (!canApproveAtLevel(userRole, level)) {
      throw new Error('Você não tem permissão para rejeitar este pedido');
    }

    const validated = rejectionReasonSchema.parse(reason);

    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'rejected',
        rejection_reason: validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    await this.recordApproval(orderId, 'rejeitado', userId, level, validated);
  },

  async recordApproval(
    orderId: string,
    action: 'enviado' | 'aprovado' | 'rejeitado' | 'escalado',
    performedBy: string,
    requiredLevel: string,
    rejectionReason?: string,
  ): Promise<void> {
    const { error } = await supabase.from('purchase_order_approvals').insert({
      order_id: orderId,
      action,
      performed_by: performedBy,
      required_level: requiredLevel,
      rejection_reason: rejectionReason ?? null,
    });

    if (error) throw error;
  },

  getRequiredLevel,
  canApproveAtLevel,
};
