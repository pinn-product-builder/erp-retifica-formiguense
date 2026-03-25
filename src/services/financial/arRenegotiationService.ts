import { supabase } from '@/integrations/supabase/client';
import { AccountsReceivableService } from '@/services/financial/accountsReceivableService';

export class ArRenegotiationService {
  static async rescheduleOpenBalance(input: {
    orgId: string;
    userId: string | null;
    receivableIds: string[];
    newInstallments: number;
    firstDueDate: string;
    competenceDate: string;
    reason: string | null;
  }): Promise<{ error: Error | null; newRowsCount: number }> {
    if (input.newInstallments < 1 || input.newInstallments > 24) {
      return { error: new Error('Parcelas entre 1 e 24'), newRowsCount: 0 };
    }
    const { data: rows, error } = await supabase
      .from('accounts_receivable')
      .select('id, customer_id, order_id, budget_id, amount, status, payment_method, cost_center_id')
      .eq('org_id', input.orgId)
      .in('id', input.receivableIds);
    if (error) return { error: new Error(error.message), newRowsCount: 0 };
    const list = rows ?? [];
    if (!list.length) return { error: new Error('Nenhum título encontrado'), newRowsCount: 0 };
    const customerId = (list[0] as { customer_id: string }).customer_id;
    for (const r of list) {
      const row = r as { customer_id: string; status: string };
      if (row.customer_id !== customerId) {
        return { error: new Error('Todos os títulos devem ser do mesmo cliente'), newRowsCount: 0 };
      }
      if (row.status === 'paid' || row.status === 'cancelled') {
        return { error: new Error('Não renegocie títulos pagos ou cancelados'), newRowsCount: 0 };
      }
    }
    let totalOpen = 0;
    for (const r of list) {
      const ar = r as { id: string; amount: number };
      const { data: hist } = await supabase
        .from('receipt_history')
        .select('amount_received')
        .eq('receivable_account_id', ar.id)
        .eq('org_id', input.orgId);
      const paid =
        hist?.reduce((s, h) => s + Number((h as { amount_received: number }).amount_received), 0) ?? 0;
      const open = Math.max(0, Number(ar.amount) - paid);
      totalOpen += open;
    }
    if (totalOpen <= 0) return { error: new Error('Saldo em aberto zero'), newRowsCount: 0 };

    const pm = (list[0] as { payment_method: string | null }).payment_method as
      | 'cash'
      | 'pix'
      | 'credit_card'
      | 'debit_card'
      | 'bank_transfer'
      | 'check'
      | 'boleto'
      | null
      | undefined;

    let created: { id: string }[] = [];
    if (input.newInstallments === 1) {
      const r0 = await AccountsReceivableService.create(
        input.orgId,
        {
          customer_id: customerId,
          order_id: (list[0] as { order_id: string | null }).order_id,
          budget_id: (list[0] as { budget_id: string | null }).budget_id,
          amount: Math.round(totalOpen * 100) / 100,
          due_date: input.firstDueDate,
          competence_date: input.competenceDate,
          payment_method: pm ?? null,
          notes: input.reason,
          installment_number: 1,
          total_installments: 1,
          source: 'manual',
          source_id: null,
          cost_center_id: (list[0] as { cost_center_id: string | null }).cost_center_id,
        },
        input.userId
      );
      if (r0.error || !r0.data) {
        return { error: r0.error ?? new Error('Falha ao criar título'), newRowsCount: 0 };
      }
      created = [{ id: r0.data.id }];
    } else {
      const firstNew = await AccountsReceivableService.createInstallmentPlan(
        input.orgId,
        {
          customer_id: customerId,
          order_id: (list[0] as { order_id: string | null }).order_id,
          budget_id: (list[0] as { budget_id: string | null }).budget_id,
          total_amount: Math.round(totalOpen * 100) / 100,
          first_due_date: input.firstDueDate,
          competence_date: input.competenceDate,
          installments: input.newInstallments,
          payment_method: pm ?? undefined,
          notes: input.reason ?? undefined,
          source: 'manual',
          source_id: null,
          cost_center_id: (list[0] as { cost_center_id: string | null }).cost_center_id,
        },
        input.userId
      );
      if (firstNew.error || !firstNew.data?.length) {
        return { error: firstNew.error ?? new Error('Falha ao gerar parcelas'), newRowsCount: 0 };
      }
      created = firstNew.data.map((x) => ({ id: x.id }));
    }
    const firstId = created[0].id;

    for (const r of list) {
      const ar = r as { id: string; amount: number };
      await supabase
        .from('accounts_receivable')
        .update({
          status: 'cancelled',
          is_renegotiated: true,
          notes: `Renegociado — novos títulos a partir de ${firstId}`,
          updated_by: input.userId ?? undefined,
        })
        .eq('id', ar.id)
        .eq('org_id', input.orgId);
      await supabase.from('ar_renegotiations').insert({
        org_id: input.orgId,
        original_ar_id: ar.id,
        new_ar_id: firstId,
        original_amount: ar.amount,
        new_amount: totalOpen,
        reason: input.reason,
        created_by: input.userId,
      });
    }

    return { error: null, newRowsCount: created.length };
  }
}
