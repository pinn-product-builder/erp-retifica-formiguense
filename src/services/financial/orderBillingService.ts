import { supabase } from '@/integrations/supabase/client';
import { AccountsReceivableService } from '@/services/financial/accountsReceivableService';

export class OrderBillingService {
  static async createReceivableFromOrder(
    orgId: string,
    orderId: string,
    amount: number,
    dueDate: string,
    competenceDate: string,
    userId: string | null
  ): Promise<{ error: Error | null }> {
    const { data: order, error: oerr } = await supabase
      .from('orders')
      .select('id, customer_id, org_id')
      .eq('id', orderId)
      .eq('org_id', orgId)
      .single();
    if (oerr || !order?.customer_id) {
      return { error: new Error(oerr?.message ?? 'OS sem cliente') };
    }

    const { data: budget } = await supabase
      .from('detailed_budgets')
      .select('id')
      .eq('order_id', orderId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await AccountsReceivableService.create(
      orgId,
      {
        customer_id: order.customer_id,
        order_id: orderId,
        budget_id: budget?.id ?? null,
        amount,
        due_date: dueDate,
        competence_date: competenceDate,
      },
      userId
    );
    return { error: error ?? null };
  }
}
