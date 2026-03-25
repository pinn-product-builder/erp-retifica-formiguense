import { supabase } from '@/integrations/supabase/client';
import { ApprovalApService } from '@/services/financial/approvalApService';
import type { Database } from '@/integrations/supabase/types';

type Row = Database['public']['Tables']['ap_recurring_schedules']['Row'];

export class ApRecurringService {
  static async list(orgId: string): Promise<Row[]> {
    const { data, error } = await supabase
      .from('ap_recurring_schedules')
      .select('*')
      .eq('org_id', orgId)
      .order('next_run_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as Row[]) ?? [];
  }

  static async save(
    row: Database['public']['Tables']['ap_recurring_schedules']['Insert']
  ): Promise<{ data: Row | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('ap_recurring_schedules')
      .upsert(row)
      .select()
      .single();
    return { data: data as Row | null, error: error ? new Error(error.message) : null };
  }

  static async remove(orgId: string, id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('ap_recurring_schedules')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  }

  static async generateNextPayable(
    orgId: string,
    scheduleId: string
  ): Promise<{ error: Error | null }> {
    const { data: sch, error: e1 } = await supabase
      .from('ap_recurring_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('org_id', orgId)
      .single();
    if (e1 || !sch) return { error: new Error(e1?.message ?? 'Recorrência não encontrada') };

    const cycleKey = sch.next_run_date.slice(0, 10);
    if (sch.last_generated_cycle_key === cycleKey) {
      return { error: null };
    }

    let supplierName = '';
    if (sch.supplier_id) {
      const { data: sup } = await supabase
        .from('suppliers')
        .select('name, trade_name')
        .eq('id', sch.supplier_id)
        .maybeSingle();
      supplierName = sup?.trade_name || sup?.name || 'Fornecedor';
    } else {
      supplierName = 'Recorrente';
    }

    const approvalStatus = await ApprovalApService.computeInitialApprovalStatus(
      orgId,
      Number(sch.amount)
    );
    const { error: e2 } = await supabase.from('accounts_payable').insert({
      org_id: orgId,
      supplier_id: sch.supplier_id,
      supplier_name: supplierName,
      expense_category_id: sch.expense_category_id,
      description: sch.description_template || 'Despesa recorrente',
      amount: sch.amount,
      due_date: sch.next_run_date,
      competence_date: sch.next_run_date,
      payment_method: sch.payment_method,
      status: 'pending',
      approval_status: approvalStatus,
    });
    if (e2) return { error: new Error(e2.message) };

    const next = new Date(sch.next_run_date + 'T12:00:00');
    next.setMonth(next.getMonth() + 1);
    const { error: e3 } = await supabase
      .from('ap_recurring_schedules')
      .update({
        next_run_date: next.toISOString().slice(0, 10),
        last_generated_cycle_key: cycleKey,
      })
      .eq('id', scheduleId);
    return { error: e3 ? new Error(e3.message) : null };
  }
}
