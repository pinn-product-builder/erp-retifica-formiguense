import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { PaginatedResult } from '@/services/financial/types';

type CustomerRow = Database['public']['Tables']['customers']['Row'];

export class CustomerLookupService {
  static async search(
    orgId: string,
    search: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<CustomerRow>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('name')
      .range(from, to);
    if (search.trim()) {
      const s = search.trim();
      q = q.or(`name.ilike.%${s}%,document.ilike.%${s}%`);
    }
    const { data, error, count } = await q;
    if (error) throw new Error(error.message);
    const total = count ?? 0;
    return {
      data: (data as CustomerRow[]) ?? [],
      count: total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
