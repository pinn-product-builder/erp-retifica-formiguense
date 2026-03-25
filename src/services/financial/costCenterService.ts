import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type CcRow = Database['public']['Tables']['cost_centers']['Row'];

export class CostCenterService {
  static async list(orgId: string): Promise<CcRow[]> {
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('name');
    if (error) throw new Error(error.message);
    return (data as CcRow[]) ?? [];
  }

  static async hasAnyActive(orgId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('cost_centers')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_active', true);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }

  static async create(
    orgId: string,
    code: string,
    name: string,
    parentId?: string | null
  ): Promise<{ data: CcRow | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('cost_centers')
      .insert({
        org_id: orgId,
        code,
        name,
        is_active: true,
        parent_id: parentId ?? null,
      })
      .select()
      .single();
    return { data: data as CcRow | null, error: error ? new Error(error.message) : null };
  }
}
