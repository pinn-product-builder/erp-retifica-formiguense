import { supabase } from '@/integrations/supabase/client';

export type SupplierClassificationHint = {
  supplierId: string;
  label: string;
  default_expense_category_id: string | null;
  default_cost_center_id: string | null;
};

export class ReconciliationHintsService {
  static async matchSupplierByDescription(
    orgId: string,
    description: string
  ): Promise<SupplierClassificationHint | null> {
    const t = description.trim().toLowerCase();
    if (t.length < 3) return null;
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, trade_name, name, default_expense_category_id, default_cost_center_id')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .or('blocked.is.null,blocked.eq.false');
    if (error) throw new Error(error.message);
    for (const s of data ?? []) {
      const row = s as {
        id: string;
        trade_name: string | null;
        name: string;
        default_expense_category_id: string | null;
        default_cost_center_id: string | null;
      };
      const cand = (row.trade_name || row.name || '').trim().toLowerCase();
      if (cand.length >= 3 && t.includes(cand)) {
        return {
          supplierId: row.id,
          label: row.trade_name || row.name,
          default_expense_category_id: row.default_expense_category_id,
          default_cost_center_id: row.default_cost_center_id,
        };
      }
    }
    return null;
  }
}
