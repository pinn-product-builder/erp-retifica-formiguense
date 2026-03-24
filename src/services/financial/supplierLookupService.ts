import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { PaginatedResult } from '@/services/financial/types';

type SupplierRow = Database['public']['Tables']['suppliers']['Row'];

export class SupplierLookupService {
  static async search(
    orgId: string,
    search: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<SupplierRow>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .or('is_active.eq.true,is_active.is.null')
      .order('name')
      .range(from, to);
    if (search.trim()) {
      const s = search.trim();
      q = q.or(`name.ilike.%${s}%,trade_name.ilike.%${s}%,document.ilike.%${s}%`);
    }
    const { data, error, count } = await q;
    if (error) throw new Error(error.message);
    const total = count ?? 0;
    return {
      data: (data as SupplierRow[]) ?? [],
      count: total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
