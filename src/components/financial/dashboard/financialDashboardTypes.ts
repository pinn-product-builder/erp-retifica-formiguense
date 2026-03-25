import type { Database } from '@/integrations/supabase/types';

export type FinancialDashboardArRow = Database['public']['Tables']['accounts_receivable']['Row'] & {
  customers?: { id?: string; name?: string; document?: string | null } | null;
  orders?: { id?: string; order_number?: string | null } | null;
};

export type FinancialDashboardApRow = Database['public']['Tables']['accounts_payable']['Row'];

export type FinancialDashboardCfRow = Database['public']['Tables']['cash_flow']['Row'];
