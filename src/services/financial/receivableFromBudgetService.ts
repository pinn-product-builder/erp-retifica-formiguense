import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { AccountsReceivableService } from '@/services/financial/accountsReceivableService';

const paymentConditionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('avista'),
    first_due_date: z.string().min(1),
    competence_date: z.string().min(1),
  }),
  z.object({
    kind: z.literal('parcelado'),
    first_due_date: z.string().min(1),
    competence_date: z.string().min(1),
    installments: z.number().int().min(2).max(12),
  }),
  z.object({
    kind: z.literal('sinal_saldo'),
    signal_amount: z.number().positive(),
    signal_due_date: z.string().min(1),
    balance_due_date: z.string().min(1),
    competence_date: z.string().min(1),
  }),
]);

export type BudgetPaymentConditionInput = z.infer<typeof paymentConditionSchema>;

const paramsSchema = z.object({
  orgId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  budgetId: z.string().uuid(),
  orderId: z.string().uuid().nullable(),
  customerId: z.string().uuid(),
  approvedAmount: z.number().positive(),
  condition: paymentConditionSchema,
  payment_method: z
    .enum(['cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'boleto'])
    .optional()
    .nullable(),
});

export class ReceivableFromBudgetService {
  static async hasPendingTitlesForBudget(orgId: string, budgetId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('id')
      .eq('org_id', orgId)
      .eq('budget_id', budgetId)
      .in('status', ['pending', 'overdue', 'renegotiated'])
      .limit(1);
    if (error) throw new Error(error.message);
    return (data?.length ?? 0) > 0;
  }

  static async createForApprovedBudget(
    raw: z.infer<typeof paramsSchema>
  ): Promise<{ error: Error | null }> {
    const parsed = paramsSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: new Error(parsed.error.errors.map((e) => e.message).join('; ')) };
    }
    const p = parsed.data;
    const exists = await this.hasPendingTitlesForBudget(p.orgId, p.budgetId);
    if (exists) {
      return { error: null };
    }

    if (p.condition.kind === 'sinal_saldo') {
      const balance = Math.round((p.approvedAmount - p.condition.signal_amount) * 100) / 100;
      if (balance <= 0) {
        return { error: new Error('Valor do sinal deve ser menor que o total aprovado') };
      }
      const baseNotes = 'Gerado na aprovação do orçamento';
      const r1 = await AccountsReceivableService.create(
        p.orgId,
        {
          customer_id: p.customerId,
          order_id: p.orderId,
          budget_id: p.budgetId,
          amount: p.condition.signal_amount,
          due_date: p.condition.signal_due_date,
          competence_date: p.condition.competence_date,
          payment_method: p.payment_method ?? null,
          notes: `${baseNotes} (sinal)`,
          installment_number: 1,
          total_installments: 2,
          source: 'budget',
          source_id: p.budgetId,
        },
        p.userId
      );
      if (r1.error) return { error: r1.error };
      const r2 = await AccountsReceivableService.create(
        p.orgId,
        {
          customer_id: p.customerId,
          order_id: p.orderId,
          budget_id: p.budgetId,
          amount: balance,
          due_date: p.condition.balance_due_date,
          competence_date: p.condition.competence_date,
          payment_method: p.payment_method ?? null,
          notes: `${baseNotes} (saldo)`,
          installment_number: 2,
          total_installments: 2,
          source: 'budget',
          source_id: p.budgetId,
        },
        p.userId
      );
      return { error: r2.error };
    }

    if (p.condition.kind === 'avista') {
      const r = await AccountsReceivableService.create(
        p.orgId,
        {
          customer_id: p.customerId,
          order_id: p.orderId,
          budget_id: p.budgetId,
          amount: p.approvedAmount,
          due_date: p.condition.first_due_date,
          competence_date: p.condition.competence_date,
          payment_method: p.payment_method ?? null,
          notes: 'Gerado na aprovação do orçamento',
          installment_number: 1,
          total_installments: 1,
          source: 'budget',
          source_id: p.budgetId,
        },
        p.userId
      );
      return { error: r.error };
    }

    const inst = await AccountsReceivableService.createInstallmentPlan(
      p.orgId,
      {
        customer_id: p.customerId,
        order_id: p.orderId,
        budget_id: p.budgetId,
        total_amount: p.approvedAmount,
        first_due_date: p.condition.first_due_date,
        competence_date: p.condition.competence_date,
        installments: p.condition.installments,
        payment_method: p.payment_method ?? null,
        notes: 'Gerado na aprovação do orçamento',
        source: 'budget',
        source_id: p.budgetId,
      },
      p.userId
    );
    return { error: inst.error };
  }

  static async syncOnOrderCompleted(
    orgId: string,
    orderId: string,
    userId: string | null
  ): Promise<{ error: Error | null }> {
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('id, customer_id')
      .eq('id', orderId)
      .eq('org_id', orgId)
      .single();
    if (oErr || !order?.customer_id) {
      return { error: oErr ? new Error(oErr.message) : new Error('OS sem cliente') };
    }

    const { data: budget } = await supabase
      .from('detailed_budgets')
      .select('id')
      .eq('order_id', orderId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let target = 0;
    if (budget?.id) {
      const { data: appr } = await supabase
        .from('budget_approvals')
        .select('approved_amount')
        .eq('budget_id', budget.id)
        .order('approved_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      target = Number(appr?.approved_amount ?? 0);
    }
    if (target <= 0) {
      return { error: null };
    }

    const { data: ars, error: arErr } = await supabase
      .from('accounts_receivable')
      .select('amount, status')
      .eq('order_id', orderId)
      .eq('org_id', orgId);
    if (arErr) return { error: new Error(arErr.message) };

    const rows = ars ?? [];
    let covered = 0;
    for (const r of rows) {
      const st = r.status as string;
      if (st === 'pending' || st === 'overdue' || st === 'paid' || st === 'renegotiated') {
        covered += Number(r.amount);
      }
    }
    if (covered >= target - 0.02) {
      return { error: null };
    }
    const diff = Math.round((target - covered) * 100) / 100;
    if (diff <= 0.02) {
      return { error: null };
    }

    const today = new Date().toISOString().slice(0, 10);
    const created = await AccountsReceivableService.create(
      orgId,
      {
        customer_id: order.customer_id,
        order_id: orderId,
        budget_id: budget?.id ?? null,
        amount: diff,
        due_date: today,
        competence_date: today,
        payment_method: null,
        notes: 'Complemento — OS concluída',
        installment_number: 1,
        total_installments: 1,
        source: 'order',
        source_id: orderId,
      },
      userId
    );
    return { error: created.error };
  }
}
