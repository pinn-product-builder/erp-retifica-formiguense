import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve IDs de organizations no mesmo grupo econômico que `currentOrgId`,
 * **intersectados** com as organizations às quais o usuário tem acesso.
 * Se não houver grupo ou RPC vazio, retorna apenas `[currentOrgId]`.
 */
export class OrganizationGroupService {
  static async listAccessibleGroupOrgIds(
    currentOrgId: string,
    userAccessibleOrgIds: readonly string[]
  ): Promise<string[]> {
    const accessible = new Set(userAccessibleOrgIds);
    const { data, error } = await supabase.rpc('org_ids_in_same_group', {
      p_org_id: currentOrgId,
    });
    if (error) throw new Error(error.message);
    const raw = data as string[] | null;
    if (!raw?.length) return [currentOrgId];

    const filtered = raw.filter((id) => accessible.has(id)).sort();
    if (filtered.length === 0) return [currentOrgId];
    return filtered;
  }
}
