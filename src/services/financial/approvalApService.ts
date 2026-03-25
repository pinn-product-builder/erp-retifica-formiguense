import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { PaginatedResult } from '@/services/financial/types';

type TierRow = Database['public']['Tables']['approval_tiers_ap']['Row'];
type ApRow = Database['public']['Tables']['accounts_payable']['Row'];
type EventRow = Database['public']['Tables']['accounts_payable_approval_events']['Row'];

const PENDING_STATUSES = ['pending_approval', 'awaiting_approval'] as const;

export class ApprovalApService {
  static async listTiers(orgId: string): Promise<TierRow[]> {
    const { data, error } = await supabase
      .from('approval_tiers_ap')
      .select('*')
      .eq('org_id', orgId)
      .order('sequence_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as TierRow[]) ?? [];
  }

  static async saveTier(
    row: Database['public']['Tables']['approval_tiers_ap']['Insert']
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('approval_tiers_ap').upsert(row);
    return { error: error ? new Error(error.message) : null };
  }

  static async deleteTier(orgId: string, id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('approval_tiers_ap')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  }

  static resolveTierForAmount(tiers: TierRow[], amount: number): TierRow | null {
    const sorted = [...tiers].sort((a, b) => a.sequence_order - b.sequence_order);
    for (const t of sorted) {
      const min = Number(t.min_amount);
      const max = Number(t.max_amount);
      if (amount >= min && amount <= max) return t;
    }
    return null;
  }

  static initialApprovalStatusWithTiers(tiers: TierRow[], amount: number): string {
    if (tiers.length === 0) return 'approved';
    const tier = ApprovalApService.resolveTierForAmount(tiers, amount);
    if (!tier) return 'approved';
    const role = tier.approver_role?.trim();
    if (role) return 'awaiting_approval';
    return 'approved';
  }

  static async computeInitialApprovalStatus(orgId: string, amount: number): Promise<string> {
    const tiers = await ApprovalApService.listTiers(orgId);
    return ApprovalApService.initialApprovalStatusWithTiers(tiers, amount);
  }

  static async listPendingApproval(orgId: string): Promise<ApRow[]> {
    const { data, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('org_id', orgId)
      .in('approval_status', [...PENDING_STATUSES])
      .order('due_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ApRow[]) ?? [];
  }

  static async listPendingApprovalPaginated(
    orgId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<ApRow>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from('accounts_payable')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .in('approval_status', [...PENDING_STATUSES])
      .order('due_date', { ascending: true })
      .range(from, to);
    if (error) throw new Error(error.message);
    const total = count ?? 0;
    return {
      data: (data as ApRow[]) ?? [],
      count: total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  static async listEvents(orgId: string, payableId: string): Promise<EventRow[]> {
    const { data, error } = await supabase
      .from('accounts_payable_approval_events')
      .select('*')
      .eq('org_id', orgId)
      .eq('payable_id', payableId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as EventRow[]) ?? [];
  }

  static async approvePayable(
    orgId: string,
    id: string,
    userId: string | null
  ): Promise<{ error: Error | null }> {
    const { error: uerr } = await supabase
      .from('accounts_payable')
      .update({ approval_status: 'approved' })
      .eq('id', id)
      .eq('org_id', orgId);
    if (uerr) return { error: new Error(uerr.message) };
    const { error: eerr } = await supabase.from('accounts_payable_approval_events').insert({
      org_id: orgId,
      payable_id: id,
      user_id: userId,
      action: 'approve',
      reason: null,
    });
    return { error: eerr ? new Error(eerr.message) : null };
  }

  static async rejectPayable(
    orgId: string,
    id: string,
    userId: string | null,
    reason: string
  ): Promise<{ error: Error | null }> {
    const { error: uerr } = await supabase
      .from('accounts_payable')
      .update({ approval_status: 'rejected' })
      .eq('id', id)
      .eq('org_id', orgId);
    if (uerr) return { error: new Error(uerr.message) };
    const { error: eerr } = await supabase.from('accounts_payable_approval_events').insert({
      org_id: orgId,
      payable_id: id,
      user_id: userId,
      action: 'reject',
      reason: reason.trim() || null,
    });
    return { error: eerr ? new Error(eerr.message) : null };
  }
}

export function isAccountsPayableApprovedForPayment(approvalStatus: string | null | undefined): boolean {
  if (approvalStatus == null || approvalStatus === '') return true;
  return approvalStatus === 'approved';
}
