import { supabase } from '@/integrations/supabase/client';

export type ArAgingBucket = 'a_vencer' | 'd0_30' | 'd31_60' | 'd61_90' | 'd90_plus';

export type ArAgingLine = {
  receivable_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  due_date: string;
  bucket: ArAgingBucket;
};

function bucketFor(dueYmd: string, refYmd: string): ArAgingBucket {
  const d = new Date(`${dueYmd}T12:00:00`);
  const r = new Date(`${refYmd}T12:00:00`);
  if (d.getTime() >= r.getTime()) return 'a_vencer';
  const late = Math.floor((r.getTime() - d.getTime()) / 86400000);
  if (late <= 30) return 'd0_30';
  if (late <= 60) return 'd31_60';
  if (late <= 90) return 'd61_90';
  return 'd90_plus';
}

const BUCKET_ORDER: ArAgingBucket[] = ['a_vencer', 'd0_30', 'd31_60', 'd61_90', 'd90_plus'];

export class ArAgingService {
  static async listOpenLines(orgId: string, refDate: string): Promise<ArAgingLine[]> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select(
        `
        id,
        amount,
        due_date,
        customer_id,
        customers ( name, workshop_name )
      `
      )
      .eq('org_id', orgId)
      .in('status', ['pending', 'overdue', 'renegotiated']);
    if (error) throw new Error(error.message);

    const out: ArAgingLine[] = [];
    for (const row of data ?? []) {
      const r = row as {
        id: string;
        amount: number;
        due_date: string;
        customer_id: string;
        customers: { name?: string; workshop_name?: string | null } | null;
      };
      const cust = r.customers;
      const customerName = (cust?.workshop_name || cust?.name || 'Cliente').trim();
      out.push({
        receivable_id: r.id,
        customer_id: r.customer_id,
        customer_name: customerName,
        amount: Number(r.amount),
        due_date: r.due_date,
        bucket: bucketFor(r.due_date, refDate),
      });
    }
    out.sort((a, b) => a.due_date.localeCompare(b.due_date));
    return out;
  }

  static summarizeByBucket(lines: ArAgingLine[]): Record<ArAgingBucket, number> {
    const acc: Record<ArAgingBucket, number> = {
      a_vencer: 0,
      d0_30: 0,
      d31_60: 0,
      d61_90: 0,
      d90_plus: 0,
    };
    for (const l of lines) {
      acc[l.bucket] += l.amount;
    }
    return acc;
  }

  static summarizeByCustomer(lines: ArAgingLine[]): { customer_id: string; customer_name: string; total: number }[] {
    const map = new Map<string, { customer_id: string; customer_name: string; total: number }>();
    for (const l of lines) {
      const cur = map.get(l.customer_id);
      if (cur) cur.total += l.amount;
      else
        map.set(l.customer_id, {
          customer_id: l.customer_id,
          customer_name: l.customer_name,
          total: l.amount,
        });
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }

  static bucketLabel(b: ArAgingBucket): string {
    const labels: Record<ArAgingBucket, string> = {
      a_vencer: 'A vencer',
      d0_30: '1–30 dias',
      d31_60: '31–60 dias',
      d61_90: '61–90 dias',
      d90_plus: 'Acima de 90 dias',
    };
    return labels[b];
  }

  static orderedBuckets(): ArAgingBucket[] {
    return BUCKET_ORDER;
  }
}
