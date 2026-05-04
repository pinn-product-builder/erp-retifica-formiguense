/**
 * Posição consolidada de AR por cliente (multi-organização).
 *
 * Decisão de produto (MVP, sem migration):
 * - Status exibido deriva de `payment_status` no banco.
 * - "Adiantado": título quitado com `payment_date` < `due_date`.
 * - Protesto / jurídico: não persistidos ainda; quando existirem, preferir coluna
 *   `collection_status` ou extensão do enum — não misturar com liquidação.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { AccountsReceivableService } from '@/services/financial/accountsReceivableService';
import { customerArPositionSearchSchema } from '@/services/financial/customerArPositionSchemas';
import { paymentMethodLabel } from '@/lib/financialFormat';

type ArRow = Database['public']['Tables']['accounts_receivable']['Row'];
type RhRow = Database['public']['Tables']['receipt_history']['Row'];
type PaymentStatus = Database['public']['Enums']['payment_status'];

export type OrganizationRef = { id: string; name: string };

export type CustomerArMatch = {
  customerId: string;
  customerName: string;
  document: string;
  orgId: string;
  organizationName: string;
};

export type CustomerArLine = {
  id: string;
  orgId: string;
  organizationName: string;
  customerId: string;
  customerName: string;
  issueDate: string | null;
  dueDate: string;
  paymentDate: string | null;
  originalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  statusRaw: PaymentStatus | null;
  displayStatus: string;
  paymentMethod: string | null;
  paymentMethodLabel: string;
  invoiceNumber: string | null;
  receiptLines: RhRow[];
};

export type CustomerArSummary = {
  /** Saldo em aberto com vencimento >= hoje (pendente “em dia”). */
  pendingOnTime: number;
  /** Saldo em aberto vencido (atrasado). */
  overdue: number;
  /** Total já recebido (soma dos recebimentos registrados). */
  totalReceived: number;
  /** Média de dias de atraso na quitação (apenas títulos pagos após o vencimento). */
  avgDelayDaysPaidLate: number | null;
  countPaidLate: number;
};

const BASE_STATUS_PT: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
  renegotiated: 'Renegociado',
};

function normalizeDocument(raw: string): string {
  return raw.replace(/\D/g, '');
}

function dateOnly(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return String(iso).slice(0, 10);
}

function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: string, b: string): number {
  const da = parseLocalDate(a);
  const db = parseLocalDate(b);
  return Math.round((db.getTime() - da.getTime()) / (24 * 60 * 60 * 1000));
}

function deriveDisplayStatus(row: ArRow): string {
  const st = row.status ?? '';
  const payDt = dateOnly(row.payment_date);
  const due = dateOnly(row.due_date);
  if (st === 'paid' && payDt && due && payDt < due) {
    return 'Adiantado';
  }
  return BASE_STATUS_PT[st] ?? st ?? '—';
}

function settlement(
  amount: number,
  lateFee: number | null,
  history: RhRow[]
): { totalDue: number; totalReceived: number; remaining: number } {
  const totalDue = Number(amount) + Number(lateFee ?? 0);
  const totalReceived = history.reduce((s, h) => s + Number(h.amount_received), 0);
  const remaining = Math.max(0, Math.round((totalDue - totalReceived) * 100) / 100);
  return { totalDue, totalReceived, remaining };
}

export class CustomerArPositionService {
  static normalizeDocument = normalizeDocument;

  static async load(params: {
    accessibleOrgs: OrganizationRef[];
    document: string;
  }): Promise<{
    matches: CustomerArMatch[];
    lines: CustomerArLine[];
    summary: CustomerArSummary;
  }> {
    const parsed = customerArPositionSearchSchema.safeParse({ document: params.document });
    if (!parsed.success) {
      throw new Error(parsed.error.errors.map((e) => e.message).join('; '));
    }

    const { accessibleOrgs } = params;
    const documentRaw = parsed.data.document.trim();
    if (!accessibleOrgs.length) {
      return { matches: [], lines: [], summary: emptySummary() };
    }

    const norm = normalizeDocument(documentRaw);
    if (norm.length !== 11 && norm.length !== 14) {
      throw new Error('Informe CPF (11 dígitos) ou CNPJ (14 dígitos)');
    }

    const orgIds = accessibleOrgs.map((o) => o.id);
    const orgNameById = new Map(accessibleOrgs.map((o) => [o.id, o.name]));

    const { data: custRows, error: cErr } = await supabase
      .from('customers')
      .select('id, name, document, org_id')
      .in('org_id', orgIds);

    if (cErr) throw new Error(cErr.message);

    const matches: CustomerArMatch[] = [];
    for (const c of custRows ?? []) {
      const row = c as { id: string; name: string; document: string; org_id: string };
      if (normalizeDocument(row.document) !== norm) continue;
      const orgName = orgNameById.get(row.org_id) ?? '—';
      matches.push({
        customerId: row.id,
        customerName: row.name,
        document: row.document,
        orgId: row.org_id,
        organizationName: orgName,
      });
    }

    if (matches.length === 0) {
      return { matches: [], lines: [], summary: emptySummary() };
    }

    await Promise.all(
      [...new Set(matches.map((m) => m.orgId))].map((oid) => AccountsReceivableService.refreshOverdue(oid))
    );

    const customerIds = matches.map((m) => m.customerId);
    const { data: arData, error: arErr } = await supabase
      .from('accounts_receivable')
      .select('*')
      .in('customer_id', customerIds)
      .order('due_date', { ascending: false })
      .order('id', { ascending: false });

    if (arErr) throw new Error(arErr.message);

    const arRows = (arData ?? []) as ArRow[];
    if (arRows.length === 0) {
      return { matches, lines: [], summary: emptySummary() };
    }

    const receivableIds = arRows.map((r) => r.id);
    const { data: rhData, error: rhErr } = await supabase
      .from('receipt_history')
      .select('*')
      .in('receivable_account_id', receivableIds);

    if (rhErr) throw new Error(rhErr.message);

    const rhByReceivable = new Map<string, RhRow[]>();
    for (const h of (rhData ?? []) as RhRow[]) {
      const list = rhByReceivable.get(h.receivable_account_id) ?? [];
      list.push(h);
      rhByReceivable.set(h.receivable_account_id, list);
    }

    const customerNameById = new Map(matches.map((m) => [m.customerId, m.customerName]));

    const lines: CustomerArLine[] = arRows.map((row) => {
      const hist = rhByReceivable.get(row.id) ?? [];
      const { totalDue, totalReceived, remaining } = settlement(
        Number(row.amount),
        row.late_fee,
        hist
      );
      const orgId = row.org_id ?? '';
      const organizationName = orgNameById.get(orgId) ?? '—';
      const issueDate = row.competence_date ?? dateOnly(row.created_at);

      return {
        id: row.id,
        orgId,
        organizationName,
        customerId: row.customer_id,
        customerName: customerNameById.get(row.customer_id) ?? '—',
        issueDate,
        dueDate: row.due_date,
        paymentDate: dateOnly(row.payment_date),
        originalAmount: totalDue,
        pendingAmount: remaining,
        paidAmount: totalReceived,
        statusRaw: row.status,
        displayStatus: deriveDisplayStatus(row),
        paymentMethod: row.payment_method,
        paymentMethodLabel: paymentMethodLabel(row.payment_method),
        invoiceNumber: row.invoice_number,
        receiptLines: [...hist].sort(
          (a, b) => String(b.received_at).localeCompare(String(a.received_at))
        ),
      };
    });

    const summary = buildSummary(lines);
    return { matches, lines, summary };
  }

  /** Recalcula totais a partir de um subconjunto (após filtro de empresa/status na UI). */
  static summarizeFilteredLines(lines: CustomerArLine[]): CustomerArSummary {
    return buildSummary(lines);
  }
}

function emptySummary(): CustomerArSummary {
  return {
    pendingOnTime: 0,
    overdue: 0,
    totalReceived: 0,
    avgDelayDaysPaidLate: null,
    countPaidLate: 0,
  };
}

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildSummary(lines: CustomerArLine[]): CustomerArSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = localDateString(today);

  let pendingOnTime = 0;
  let overdue = 0;
  let totalReceived = 0;
  const lateDelays: number[] = [];

  for (const L of lines) {
    totalReceived += L.paidAmount;

    const st = L.statusRaw;
    if (st === 'cancelled' || st === 'renegotiated') continue;

    if (st === 'paid') continue;

    const due = dateOnly(L.dueDate);
    if (!due) continue;

    if (due >= todayStr) {
      pendingOnTime += L.pendingAmount;
    } else {
      overdue += L.pendingAmount;
    }
  }

  for (const L of lines) {
    if (L.statusRaw !== 'paid') continue;
    const pay = L.paymentDate;
    const due = dateOnly(L.dueDate);
    if (!pay || !due) continue;
    const delay = daysBetween(due, pay);
    if (delay > 0) lateDelays.push(delay);
  }

  const avgDelayDaysPaidLate =
    lateDelays.length > 0
      ? Math.round((lateDelays.reduce((a, b) => a + b, 0) / lateDelays.length) * 10) / 10
      : null;

  return {
    pendingOnTime,
    overdue,
    totalReceived,
    avgDelayDaysPaidLate,
    countPaidLate: lateDelays.length,
  };
}
