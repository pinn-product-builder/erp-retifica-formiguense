import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export interface PurchaseInvoice {
  id:                string;
  purchase_order_id: string;
  receipt_id:        string | null;
  invoice_number:    string;
  invoice_series:    string | null;
  issue_date:        string;
  access_key:        string | null;
  total_products:    number;
  total_freight:     number;
  total_taxes:       number;
  total_discount:    number;
  total_invoice:     number;
  payment_condition: string | null;
  due_dates:         string[] | null;
  xml_url:           string | null;
  pdf_url:           string | null;
  status:            'pending' | 'validated' | 'divergent';
  validation_notes:  string | null;
  org_id:            string;
  created_by:        string | null;
  created_at:        string;
  updated_at:        string;
  purchase_order?:   { po_number: string; total_value: number; supplier?: { name: string } };
}

export const INVOICE_STATUS_LABELS: Record<PurchaseInvoice['status'], string> = {
  pending:   'Pendente',
  validated: 'Validada',
  divergent: 'Divergente',
};

export const INVOICE_STATUS_COLORS: Record<PurchaseInvoice['status'], string> = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  validated: 'bg-green-100 text-green-700 border-green-200',
  divergent: 'bg-red-100 text-red-700 border-red-200',
};

export const invoiceSchema = z.object({
  purchase_order_id: z.string().uuid('Selecione um pedido de compra'),
  receipt_id:        z.string().uuid().nullable().optional(),
  invoice_number:    z.string().min(1, 'Número da NF é obrigatório'),
  invoice_series:    z.string().optional(),
  issue_date:        z.string().min(1, 'Data de emissão é obrigatória'),
  access_key:        z
    .string()
    .regex(/^\d{44}$/, 'Chave de acesso deve ter exatamente 44 dígitos numéricos')
    .optional()
    .or(z.literal('')),
  total_products:    z.number().min(0),
  total_freight:     z.number().min(0).default(0),
  total_taxes:       z.number().min(0).default(0),
  total_discount:    z.number().min(0).default(0),
  total_invoice:     z.number().positive('Valor total deve ser maior que zero'),
  payment_condition: z.string().optional(),
  due_dates:         z.array(z.string()).default([]),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

export interface InvoiceDivergence {
  field:        string;
  order_value:  number;
  invoice_value: number;
  diff_pct:     number;
}

export const TOLERANCE_PCT = 1;

export function checkDivergences(
  orderTotalValue: number,
  invoiceTotalValue: number,
): InvoiceDivergence[] {
  const divergences: InvoiceDivergence[] = [];

  if (orderTotalValue > 0) {
    const diffPct = Math.abs((invoiceTotalValue - orderTotalValue) / orderTotalValue) * 100;
    if (diffPct > TOLERANCE_PCT) {
      divergences.push({
        field:         'Valor Total',
        order_value:   orderTotalValue,
        invoice_value: invoiceTotalValue,
        diff_pct:      Number(diffPct.toFixed(2)),
      });
    }
  }

  return divergences;
}

export function calcDueDates(issueDate: string, paymentCondition: string): string[] {
  if (!paymentCondition.trim()) return [];

  const base = new Date(issueDate);
  const terms = paymentCondition
    .split(/[,/]/)
    .map((t) => parseInt(t.trim(), 10))
    .filter((t) => !isNaN(t) && t > 0);

  return terms.map((days) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  });
}

const db = () => supabase as any;

export const PurchaseInvoiceService = {
  async list(orgId: string): Promise<PurchaseInvoice[]> {
    const { data, error } = await db().from('purchase_invoices')
      .select(`
        *,
        purchase_order:purchase_orders(po_number, total_value, supplier:suppliers(name))
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100) as unknown as { data: PurchaseInvoice[] | null; error: unknown };

    if (error) throw error;
    return (data ?? []) as PurchaseInvoice[];
  },

  async getByOrder(purchaseOrderId: string): Promise<PurchaseInvoice[]> {
    const { data, error } = await db().from('purchase_invoices')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false }) as unknown as { data: PurchaseInvoice[] | null; error: unknown };

    if (error) throw error;
    return (data ?? []) as PurchaseInvoice[];
  },

  async create(
    orgId: string,
    userId: string,
    input: InvoiceFormData,
    orderTotalValue: number,
  ): Promise<PurchaseInvoice> {
    const validated = invoiceSchema.parse(input);

    const divergences = checkDivergences(orderTotalValue, validated.total_invoice);
    const status: PurchaseInvoice['status'] = divergences.length > 0 ? 'divergent' : 'validated';
    const validation_notes = divergences.length > 0
      ? divergences.map((d) => `${d.field}: pedido R$${d.order_value.toFixed(2)}, NF R$${d.invoice_value.toFixed(2)} (${d.diff_pct > 0 ? '+' : ''}${d.diff_pct}%)`).join('; ')
      : null;

    const due_dates = validated.payment_condition
      ? calcDueDates(validated.issue_date, validated.payment_condition)
      : (validated.due_dates ?? []);

    const { data, error } = await db().from('purchase_invoices')
      .insert({
        org_id:            orgId,
        created_by:        userId,
        purchase_order_id: validated.purchase_order_id,
        receipt_id:        validated.receipt_id ?? null,
        invoice_number:    validated.invoice_number,
        invoice_series:    validated.invoice_series ?? null,
        issue_date:        validated.issue_date,
        access_key:        validated.access_key || null,
        total_products:    validated.total_products,
        total_freight:     validated.total_freight,
        total_taxes:       validated.total_taxes,
        total_discount:    validated.total_discount,
        total_invoice:     validated.total_invoice,
        payment_condition: validated.payment_condition ?? null,
        due_dates,
        status,
        validation_notes,
      })
      .select()
      .single() as unknown as { data: PurchaseInvoice | null; error: unknown };

    if (error) throw error;
    return data as PurchaseInvoice;
  },

  checkDivergences,
  calcDueDates,

  /**
   * Gera contas a pagar para cada parcela da NF (US-PUR-037)
   */
  async generateAccountsPayable(
    orgId:     string,
    invoice:   PurchaseInvoice,
    supplierName: string,
  ): Promise<void> {
    const dates = invoice.due_dates ?? [];
    if (dates.length === 0) return;

    const total   = invoice.total_invoice;
    const n       = dates.length;
    const base    = parseFloat((total / n).toFixed(2));
    const adjust  = parseFloat((total - base * (n - 1)).toFixed(2));

    const rows = dates.map((due_date, i) => ({
      org_id:        orgId,
      supplier_name: supplierName,
      description:   `NF ${invoice.invoice_number} — Parcela ${i + 1}/${n}`,
      amount:        i === n - 1 ? adjust : base,
      due_date,
      status:        'pending',
      invoice_number: invoice.invoice_number,
      notes:         `Pedido de compra vinculado: ${invoice.purchase_order?.po_number ?? invoice.purchase_order_id}`,
    }));

    const { error } = await db().from('accounts_payable')
      .insert(rows as any);
    if (error) console.error('Erro ao gerar contas a pagar:', error);
  },
};
