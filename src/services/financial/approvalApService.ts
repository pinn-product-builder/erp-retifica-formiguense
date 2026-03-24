import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TierRow = Database['public']['Tables']['approval_tiers_ap']['Row'];
type ApRow = Database['public']['Tables']['accounts_payable']['Row'];

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

  static async listPendingApproval(orgId: string): Promise<ApRow[]> {
    const { data, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('org_id', orgId)
      .eq('approval_status', 'pending_approval')
      .order('due_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ApRow[]) ?? [];
  }

  static async approvePayable(orgId: string, id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('accounts_payable')
      .update({ approval_status: 'approved' })
      .eq('id', id)
      .eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  }
}
