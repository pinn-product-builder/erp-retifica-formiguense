import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DreRow = Database['public']['Tables']['monthly_dre']['Row'];

export class DreService {
  static async list(orgId: string, year?: number): Promise<DreRow[]> {
    let q = supabase
      .from('monthly_dre')
      .select('*')
      .eq('org_id', orgId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (year) q = q.eq('year', year);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as DreRow[]) ?? [];
  }
}
