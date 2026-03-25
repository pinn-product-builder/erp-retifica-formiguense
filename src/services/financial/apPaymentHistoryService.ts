import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Row = Database['public']['Tables']['ap_payment_history']['Row'];

export class ApPaymentHistoryService {
  static async listByPayable(orgId: string, payableId: string): Promise<Row[]> {
    const { data, error } = await supabase
      .from('ap_payment_history')
      .select('*')
      .eq('org_id', orgId)
      .eq('payable_id', payableId)
      .order('paid_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Row[]) ?? [];
  }

  static async record(
    orgId: string,
    payableId: string,
    amountPaid: number,
    paidAt: string,
    paymentMethod: Database['public']['Enums']['payment_method'] | null,
    userId: string | null,
    notes?: string | null
  ): Promise<void> {
    const { error } = await supabase.from('ap_payment_history').insert({
      org_id: orgId,
      payable_id: payableId,
      amount_paid: amountPaid,
      paid_at: paidAt,
      payment_method: paymentMethod,
      notes: notes ?? null,
      registered_by: userId,
    });
    if (error) throw new Error(error.message);
  }
}
