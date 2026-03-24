import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Row = Database['public']['Tables']['cash_flow_projection']['Row'];

export class ProjectionService {
  static async listByOrg(orgId: string, days = 90): Promise<Row[]> {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    const { data, error } = await supabase
      .from('cash_flow_projection')
      .select('*')
      .eq('org_id', orgId)
      .gte('projection_date', start.toISOString().slice(0, 10))
      .lte('projection_date', end.toISOString().slice(0, 10))
      .order('projection_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as Row[]) ?? [];
  }

  static async upsert(
    rows: Database['public']['Tables']['cash_flow_projection']['Insert'][]
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('cash_flow_projection').upsert(rows);
    return { error: error ? new Error(error.message) : null };
  }
}
