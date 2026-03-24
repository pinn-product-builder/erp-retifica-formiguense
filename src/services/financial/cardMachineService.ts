import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Row = Database['public']['Tables']['card_machine_configs']['Row'];

export class CardMachineService {
  static async list(orgId: string): Promise<Row[]> {
    const { data, error } = await supabase
      .from('card_machine_configs')
      .select('*')
      .eq('org_id', orgId)
      .order('name');
    if (error) throw new Error(error.message);
    return (data as Row[]) ?? [];
  }

  static async save(
    row: Database['public']['Tables']['card_machine_configs']['Insert']
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('card_machine_configs').upsert(row);
    return { error: error ? new Error(error.message) : null };
  }
}
