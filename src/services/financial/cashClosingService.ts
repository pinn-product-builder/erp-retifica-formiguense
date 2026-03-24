import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Row = Database['public']['Tables']['cash_closings']['Row'];

export class CashClosingService {
  static async list(orgId: string, limit = 30): Promise<Row[]> {
    const { data, error } = await supabase
      .from('cash_closings')
      .select('*')
      .eq('org_id', orgId)
      .order('closing_date', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as Row[]) ?? [];
  }

  static async create(
    row: Database['public']['Tables']['cash_closings']['Insert']
  ): Promise<{ data: Row | null; error: Error | null }> {
    const { data, error } = await supabase.from('cash_closings').insert(row).select().single();
    return { data: data as Row | null, error: error ? new Error(error.message) : null };
  }
}
