import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { receiptRecordSchema, type ReceiptRecordInput } from '@/services/financial/schemas';
import { CashFlowService } from '@/services/financial/cashFlowService';
import { AccountsReceivableService } from '@/services/financial/accountsReceivableService';

type RhRow = Database['public']['Tables']['receipt_history']['Row'];

export type ReceivableSettlementSnapshot = {
  totalDue: number;
  totalReceived: number;
  remaining: number;
};

export class ReceiptHistoryService {
  static async getSettlementSnapshot(
    orgId: string,
    receivableId: string
  ): Promise<{ data: ReceivableSettlementSnapshot | null; error: Error | null }> {
    const { data: ar, error: arErr } = await supabase
      .from('accounts_receivable')
      .select('amount, late_fee')
      .eq('id', receivableId)
      .eq('org_id', orgId)
      .maybeSingle();
    if (arErr || !ar) return { data: null, error: arErr ? new Error(arErr.message) : new Error('Título não encontrado') };
    const row = ar as { amount: number; late_fee: number | null };
    const totalDue = Number(row.amount) + Number(row.late_fee ?? 0);
    const { data: hist, error: hErr } = await supabase
      .from('receipt_history')
      .select('amount_received')
      .eq('receivable_account_id', receivableId)
      .eq('org_id', orgId);
    if (hErr) return { data: null, error: new Error(hErr.message) };
    const totalReceived =
      hist?.reduce((s, h) => s + Number((h as { amount_received: number }).amount_received), 0) ?? 0;
    const remaining = Math.max(0, Math.round((totalDue - totalReceived) * 100) / 100);
    return { data: { totalDue, totalReceived, remaining }, error: null };
  }

  static async listByReceivable(
    orgId: string,
    receivableId: string
  ): Promise<{ data: RhRow[]; error: Error | null }> {
    const { data, error } = await supabase
      .from('receipt_history')
      .select('*')
      .eq('org_id', orgId)
      .eq('receivable_account_id', receivableId)
      .order('received_at', { ascending: false });
    return { data: (data as RhRow[]) ?? [], error: error ? new Error(error.message) : null };
  }

  static async recordPayment(
    orgId: string,
    input: ReceiptRecordInput,
    userId: string | null
  ): Promise<{ error: Error | null }> {
    const parsed = receiptRecordSchema.safeParse(input);
    if (!parsed.success) {
      return { error: new Error(parsed.error.errors.map((e) => e.message).join('; ')) };
    }
    const v = parsed.data;

    const { data: ar, error: arErr } = await supabase
      .from('accounts_receivable')
      .select('id, amount, late_fee, status, cost_center_id, invoice_number, payment_method, due_date')
      .eq('id', v.receivable_account_id)
      .eq('org_id', orgId)
      .single();
    if (arErr || !ar) return { error: new Error(arErr?.message ?? 'Conta a receber não encontrada') };

    const arPre = ar as { amount: number; late_fee: number | null };
    const totalDue = Number(arPre.amount) + Number(arPre.late_fee ?? 0);
    const { data: histBefore } = await supabase
      .from('receipt_history')
      .select('amount_received')
      .eq('receivable_account_id', v.receivable_account_id)
      .eq('org_id', orgId);
    const receivedBefore =
      histBefore?.reduce((s, h) => s + Number((h as { amount_received: number }).amount_received), 0) ?? 0;
    const remainingBefore = Math.max(0, totalDue - receivedBefore);
    if (v.amount_received > remainingBefore + 0.051) {
      return {
        error: new Error(
          `Valor acima do saldo em aberto (${remainingBefore.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).`
        ),
      };
    }

    const { error: insErr } = await supabase.from('receipt_history').insert({
      org_id: orgId,
      receivable_account_id: v.receivable_account_id,
      amount_received: v.amount_received,
      received_at: v.received_at,
      payment_method: v.payment_method ?? null,
      late_fee_charged: v.late_fee_charged ?? 0,
      discount_applied: v.discount_applied ?? 0,
      notes: v.notes ?? null,
      registered_by: userId,
    });
    if (insErr) return { error: new Error(insErr.message) };

    const { data: hist } = await supabase
      .from('receipt_history')
      .select('amount_received')
      .eq('receivable_account_id', v.receivable_account_id)
      .eq('org_id', orgId);

    const totalReceived =
      hist?.reduce((s, h) => s + Number((h as { amount_received: number }).amount_received), 0) ?? 0;
    const target = totalDue;
    const tolerance = 0.05;
    const arRowDue = ar as { due_date: string };
    const dueDay = new Date(arRowDue.due_date);
    dueDay.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let newStatus: 'paid' | 'pending' | 'overdue' =
      totalReceived + tolerance >= target ? 'paid' : 'pending';
    if (newStatus === 'pending' && dueDay < today) {
      newStatus = 'overdue';
    }

    const { error: upErr } = await supabase
      .from('accounts_receivable')
      .update({
        status: newStatus,
        payment_date: newStatus === 'paid' ? v.received_at : null,
        updated_by: userId ?? undefined,
      })
      .eq('id', v.receivable_account_id)
      .eq('org_id', orgId);
    if (upErr) return { error: new Error(upErr.message) };

    await AccountsReceivableService.refreshOverdue(orgId);

    const arRowCf = ar as {
      cost_center_id: string | null;
      invoice_number: string | null;
      payment_method: Database['public']['Enums']['payment_method'] | null;
    };
    const cf = await CashFlowService.create(orgId, {
      transaction_type: 'income',
      amount: v.amount_received,
      description: `Recebimento ${arRowCf.invoice_number?.trim() ? `NF ${arRowCf.invoice_number}` : 'conta a receber'}`,
      transaction_date: v.received_at,
      payment_method: v.payment_method ?? arRowCf.payment_method ?? null,
      bank_account_id: null,
      accounts_receivable_id: v.receivable_account_id,
      accounts_payable_id: null,
      order_id: null,
      category_id: null,
      cost_center_id: arRowCf.cost_center_id ?? null,
      notes: v.notes ?? null,
      reconciled: false,
    });
    return { error: cf.error };
  }
}
