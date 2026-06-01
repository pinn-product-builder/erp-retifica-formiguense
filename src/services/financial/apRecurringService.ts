import { supabase } from '@/integrations/supabase/client';
import { ApprovalApService } from '@/services/financial/approvalApService';
import type { Database } from '@/integrations/supabase/types';

type Row = Database['public']['Tables']['ap_recurring_schedules']['Row'];
type ApRow = Database['public']['Tables']['accounts_payable']['Row'];

export type ResolveForecastInput = {
  actualAmount: number;
  invoiceNumber: string | null;
  paymentMethod?: Database['public']['Enums']['payment_method'] | null;
  competenceDate?: string | null;
  supplierDocument?: string | null;
  notes?: string | null;
};

export type ForecastVariance = {
  predicted: number;
  actual: number;
  delta: number;
  deltaPct: number;
};

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
      is_forecast: true,
      forecast_recurring_schedule_id: sch.id,
      forecast_original_amount: sch.amount,
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

  /**
   * Lista AP em estado de previsão (recorrente, ainda não confirmado com NF real).
   */
  static async listForecasts(orgId: string): Promise<ApRow[]> {
    const { data, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_forecast', true)
      .is('forecast_resolved_at', null)
      .order('due_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ApRow[]) ?? [];
  }

  /**
   * Confirma uma previsão de CP com dados reais (NF chegou).
   * - Atualiza amount (valor real), invoice_number, supplier_document, payment_method
   * - Mantém forecast_original_amount como snapshot para variância
   * - Marca forecast_resolved_at = now
   */
  static async resolveForecast(
    orgId: string,
    payableId: string,
    input: ResolveForecastInput
  ): Promise<{ variance: ForecastVariance }> {
    const { data: current, error: ce } = await supabase
      .from('accounts_payable')
      .select('amount, forecast_original_amount, is_forecast, forecast_resolved_at')
      .eq('id', payableId)
      .eq('org_id', orgId)
      .single();
    if (ce || !current) throw new Error(ce?.message ?? 'Conta a pagar não encontrada');

    const row = current as {
      amount: number;
      forecast_original_amount: number | null;
      is_forecast: boolean;
      forecast_resolved_at: string | null;
    };
    if (!row.is_forecast) {
      throw new Error('Esta conta a pagar não é uma previsão recorrente');
    }
    if (row.forecast_resolved_at) {
      throw new Error('Esta previsão já foi confirmada anteriormente');
    }

    const predicted = Number(row.forecast_original_amount ?? row.amount);
    const actual = Number(input.actualAmount);
    if (!Number.isFinite(actual) || actual <= 0) {
      throw new Error('Informe um valor real positivo');
    }

    const patch: Database['public']['Tables']['accounts_payable']['Update'] = {
      amount: actual,
      invoice_number: input.invoiceNumber?.trim() || null,
      supplier_document: input.supplierDocument?.trim() || null,
      payment_method: input.paymentMethod ?? null,
      competence_date: input.competenceDate ?? null,
      notes: input.notes?.trim() || null,
      forecast_resolved_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('accounts_payable')
      .update(patch)
      .eq('id', payableId)
      .eq('org_id', orgId);
    if (error) throw new Error(error.message);

    const delta = Math.round((actual - predicted) * 100) / 100;
    const deltaPct =
      predicted > 0 ? Math.round((delta / predicted) * 10000) / 100 : 0;
    return {
      variance: { predicted, actual, delta, deltaPct },
    };
  }
}
