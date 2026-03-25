import { z } from 'zod';

const paymentMethodSchema = z.enum([
  'cash',
  'pix',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'check',
  'boleto',
]);

const paymentStatusSchema = z.enum([
  'pending',
  'paid',
  'overdue',
  'cancelled',
  'renegotiated',
]);

export const accountsReceivableCreateSchema = z
  .object({
    customer_id: z.string().uuid(),
    order_id: z.string().uuid().optional().nullable(),
    budget_id: z.string().uuid().optional().nullable(),
    amount: z.number().positive(),
    due_date: z.string(),
    competence_date: z.string(),
    payment_method: paymentMethodSchema.optional().nullable(),
    notes: z.string().optional().nullable(),
    invoice_number: z.string().optional().nullable(),
    installment_number: z.number().int().min(1).optional().nullable(),
    total_installments: z.number().int().min(1).optional().nullable(),
    cost_center_id: z.string().uuid().optional().nullable(),
    source: z.enum(['budget', 'order', 'manual']).optional().nullable(),
    source_id: z.string().uuid().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const due = new Date(data.due_date);
    const comp = new Date(data.competence_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vencimento não pode ser anterior à data atual',
        path: ['due_date'],
      });
    }
    if (comp > due) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Competência não pode ser posterior ao vencimento',
        path: ['competence_date'],
      });
    }
  });

export const accountsReceivableInstallmentsSchema = z
  .object({
    customer_id: z.string().uuid(),
    order_id: z.string().uuid().optional().nullable(),
    budget_id: z.string().uuid().optional().nullable(),
    total_amount: z.number().positive(),
    first_due_date: z.string(),
    competence_date: z.string(),
    installments: z.number().int().min(2).max(60),
    payment_method: paymentMethodSchema.optional().nullable(),
    notes: z.string().optional().nullable(),
    source: z.enum(['budget', 'order', 'manual']).optional().nullable(),
    source_id: z.string().uuid().optional().nullable(),
    cost_center_id: z.string().uuid().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const due = new Date(data.first_due_date);
    const comp = new Date(data.competence_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '1º vencimento não pode ser anterior à data atual',
        path: ['first_due_date'],
      });
    }
    if (comp > due) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Competência não pode ser posterior ao vencimento',
        path: ['competence_date'],
      });
    }
  });

export const receiptRecordSchema = z.object({
  receivable_account_id: z.string().uuid(),
  amount_received: z.number().positive(),
  received_at: z.string(),
  payment_method: paymentMethodSchema.optional().nullable(),
  late_fee_charged: z.number().min(0).optional(),
  discount_applied: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export const accountsPayableCreateSchema = z
  .object({
    supplier_id: z.string().uuid().optional().nullable(),
    supplier_name: z.string().min(1),
    supplier_document: z.string().optional().nullable(),
    expense_category_id: z.string().uuid().optional().nullable(),
    description: z.string().min(1),
    amount: z.number().positive(),
    due_date: z.string(),
    competence_date: z.string().optional().nullable(),
    payment_method: paymentMethodSchema.optional().nullable(),
    invoice_number: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    cost_center_id: z.string().uuid().optional().nullable(),
    purchase_order_id: z.string().uuid().optional().nullable(),
    approval_status: z.string().optional(),
    invoice_file_url: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const comp = data.competence_date ? new Date(data.competence_date) : null;
    const due = new Date(data.due_date);
    if (comp && comp > due) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Competência não pode ser posterior ao vencimento',
        path: ['competence_date'],
      });
    }
  });

export const cashFlowCreateSchema = z.object({
  transaction_type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().min(1),
  transaction_date: z.string(),
  payment_method: paymentMethodSchema.optional().nullable(),
  bank_account_id: z.string().uuid().optional().nullable(),
  accounts_receivable_id: z.string().uuid().optional().nullable(),
  accounts_payable_id: z.string().uuid().optional().nullable(),
  order_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  cost_center_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  reconciled: z.boolean().optional(),
});

export type AccountsReceivableCreateInput = z.infer<typeof accountsReceivableCreateSchema>;
export type AccountsReceivableInstallmentsInput = z.infer<typeof accountsReceivableInstallmentsSchema>;
export type ReceiptRecordInput = z.infer<typeof receiptRecordSchema>;
export type AccountsPayableCreateInput = z.infer<typeof accountsPayableCreateSchema>;
export type CashFlowCreateInput = z.infer<typeof cashFlowCreateSchema>;
