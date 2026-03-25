import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Row = Database['public']['Tables']['partner_withdrawals']['Row'];

export class PartnerWithdrawalService {
  static async list(orgId: string): Promise<Row[]> {
    const { data, error } = await supabase
      .from('partner_withdrawals')
      .select('*')
      .eq('org_id', orgId)
      .order('withdrawal_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Row[]) ?? [];
  }

  static async create(
    row: Database['public']['Tables']['partner_withdrawals']['Insert']
  ): Promise<{ data: Row | null; error: Error | null }> {
    const { data, error } = await supabase.from('partner_withdrawals').insert(row).select().single();
    return { data: data as Row | null, error: error ? new Error(error.message) : null };
  }

  static async update(
    orgId: string,
    id: string,
    patch: Database['public']['Tables']['partner_withdrawals']['Update']
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('partner_withdrawals')
      .update(patch)
      .eq('id', id)
      .eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  }

  static async remove(orgId: string, id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('partner_withdrawals')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  }
}
