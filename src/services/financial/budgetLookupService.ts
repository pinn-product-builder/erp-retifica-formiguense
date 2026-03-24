import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { PaginatedResult } from '@/services/financial/types';

type DbRow = Database['public']['Tables']['detailed_budgets']['Row'];

export interface BudgetListItem extends DbRow {
  orders?: { order_number: string | null } | null;
}

export class BudgetLookupService {
  static async search(
    orgId: string,
    search: string,
    page: number,
    pageSize: number,
    status?: string
  ): Promise<PaginatedResult<BudgetListItem>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase
      .from('detailed_budgets')
      .select(`*, orders (order_number)`, { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (status) q = q.eq('status', status);
    if (search.trim()) {
      q = q.ilike('budget_number', `%${search.trim()}%`);
    }
    const { data, error, count } = await q;
    if (error) throw new Error(error.message);
    const total = count ?? 0;
    return {
      data: (data as BudgetListItem[]) ?? [],
      count: total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
