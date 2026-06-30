import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ChartAccountRow = Database['public']['Tables']['chart_of_accounts']['Row'];

export interface ChartAccountInput {
  conta_contabil: string;
  grupo?: string | null;
  nivel?: string | null;
  tipo?: string | null;
  is_active?: boolean;
}

export const ChartOfAccountsService = {
  async list(orgId: string): Promise<ChartAccountRow[]> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('org_id', orgId)
      .order('tipo', { ascending: true })
      .order('conta_contabil', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async create(orgId: string, input: ChartAccountInput): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('chart_of_accounts').insert({
      org_id: orgId,
      conta_contabil: input.conta_contabil.trim(),
      grupo: input.grupo?.trim() || null,
      nivel: input.nivel?.trim() || null,
      tipo: input.tipo?.trim() || null,
      is_active: input.is_active ?? true,
    });
    return { error: error ? new Error(error.message) : null };
  },

  async update(id: string, orgId: string, patch: Partial<ChartAccountInput>): Promise<{ error: Error | null }> {
    const updateData: Record<string, unknown> = {};
    if (patch.conta_contabil !== undefined) updateData.conta_contabil = patch.conta_contabil.trim();
    if (patch.grupo !== undefined) updateData.grupo = patch.grupo?.trim() || null;
    if (patch.nivel !== undefined) updateData.nivel = patch.nivel?.trim() || null;
    if (patch.tipo !== undefined) updateData.tipo = patch.tipo?.trim() || null;
    if (patch.is_active !== undefined) updateData.is_active = patch.is_active;

    const { error } = await supabase
      .from('chart_of_accounts')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  },

  async remove(id: string, orgId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('chart_of_accounts')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  },
};
