/**
 * Verifica pendências financeiras (CR em aberto) de um cliente.
 *
 * Usado para bloquear:
 * - abertura de OS (task 86agymx3a)
 * - emissão de NF / faturamento (task 86agymx5z)
 *
 * Decisão: o check é por organização. Em modo consolidado/multi-empresa, a chamada deve
 * informar o orgId específico onde a OS/NF está sendo emitida.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ArRow = Database['public']['Tables']['accounts_receivable']['Row'];

export type CustomerPendingItem = {
  id: string;
  amount: number;
  dueDate: string;
  status: ArRow['status'];
  invoiceNumber: string | null;
  isOverdue: boolean;
};

export type CustomerPendingResult = {
  hasPending: boolean;
  totalOpen: number;
  totalOverdue: number;
  items: CustomerPendingItem[];
};

const OPEN_STATUSES: Array<ArRow['status']> = ['pending', 'overdue', 'renegotiated'];

export class CustomerPendingService {
  /**
   * Retorna os títulos em aberto do cliente na organização informada,
   * já com totais agregados (open / overdue).
   */
  static async check(orgId: string, customerId: string): Promise<CustomerPendingResult> {
    if (!orgId || !customerId) {
      return { hasPending: false, totalOpen: 0, totalOverdue: 0, items: [] };
    }

    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('id, amount, due_date, status, invoice_number')
      .eq('org_id', orgId)
      .eq('customer_id', customerId)
      .in('status', OPEN_STATUSES)
      .order('due_date', { ascending: true });

    if (error) throw new Error(error.message);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);

    let totalOpen = 0;
    let totalOverdue = 0;
    const items: CustomerPendingItem[] = ((data ?? []) as Array<
      Pick<ArRow, 'id' | 'amount' | 'due_date' | 'status' | 'invoice_number'>
    >).map((r) => {
      const amount = Number(r.amount);
      const dueIso = String(r.due_date).slice(0, 10);
      const isOverdue = r.status === 'overdue' || (r.status === 'pending' && dueIso < todayIso);
      if (isOverdue) totalOverdue += amount;
      totalOpen += amount;
      return {
        id: r.id,
        amount,
        dueDate: dueIso,
        status: r.status,
        invoiceNumber: r.invoice_number,
        isOverdue,
      };
    });

    return {
      hasPending: items.length > 0,
      totalOpen,
      totalOverdue,
      items,
    };
  }
}
