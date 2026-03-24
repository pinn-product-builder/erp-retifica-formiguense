import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { receiptRecordSchema, type ReceiptRecordInput } from '@/services/financial/schemas';

type RhRow = Database['public']['Tables']['receipt_history']['Row'];

export class ReceiptHistoryService {
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
      .select('id, amount, status')
      .eq('id', v.receivable_account_id)
      .eq('org_id', orgId)
      .single();
    if (arErr || !ar) return { error: new Error(arErr?.message ?? 'Conta a receber não encontrada') };

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
    const target = Number(ar.amount);
    const newStatus = totalReceived >= target ? 'paid' : 'pending';

    const { error: upErr } = await supabase
      .from('accounts_receivable')
      .update({
        status: newStatus,
        payment_date: newStatus === 'paid' ? v.received_at : null,
        updated_by: userId ?? undefined,
      })
      .eq('id', v.receivable_account_id)
      .eq('org_id', orgId);
    return { error: upErr ? new Error(upErr.message) : null };
  }
}
