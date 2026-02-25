import { supabase } from '@/integrations/supabase/client';

export type PeriodoAnalise = 'hoje' | 'semana' | 'mes' | 'trimestre' | 'ano' | 'personalizado';

export interface FiltrosRelatorio {
  period: PeriodoAnalise;
  startDate?: string;
  endDate?: string;
}

export interface PurchasingKPIs {
  totalValue: number;
  totalOrders: number;
  averageOrderValue: number;
  avgLeadTimeDays: number;
  savingsFromQuotations: number;
  savingsPercentage: number;
  activeSuppliers: number;
  returnRate: number;
}

export interface VolumeByMonth {
  month: string;
  total_value: number;
  total_orders: number;
}

export interface SupplierVolume {
  supplier_id: string;
  supplier_name: string;
  total_orders: number;
  total_value: number;
  avg_lead_time_days: number | null;
}

export interface PurchasingReportData {
  kpis: PurchasingKPIs;
  volumeByMonth: VolumeByMonth[];
  topSuppliers: SupplierVolume[];
}

function getDateRange(filters: FiltrosRelatorio): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  if (filters.period === 'personalizado' && filters.startDate && filters.endDate) {
    return { start: filters.startDate, end: filters.endDate };
  }

  const end = fmt(now);

  if (filters.period === 'hoje') {
    return { start: end, end };
  }

  if (filters.period === 'semana') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { start: fmt(d), end };
  }

  if (filters.period === 'mes') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: fmt(d), end };
  }

  if (filters.period === 'trimestre') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 2);
    d.setDate(1);
    return { start: fmt(d), end };
  }

  const d = new Date(now.getFullYear(), 0, 1);
  return { start: fmt(d), end };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const PurchasingReportsService = {
  async fetchDashboardData(orgId: string, filters: FiltrosRelatorio): Promise<PurchasingReportData> {
    const { start, end } = getDateRange(filters);

    const [ordersRes, volumeRes, suppliersRes, quotSavingsRes, returnsRes, receiptsRes] =
      await Promise.all([
        db
          .from('purchase_orders')
          .select('id, total_value, order_date, actual_delivery, supplier_id, status')
          .eq('org_id', orgId)
          .gte('order_date', start)
          .lte('order_date', end)
          .not('status', 'in', '("cancelled","draft")'),

        db
          .from('purchase_orders_monthly')
          .select('month, total_value, total_orders')
          .eq('org_id', orgId)
          .gte('month', `${start.slice(0, 7)}-01`)
          .lte('month', `${end.slice(0, 7)}-01`)
          .order('month', { ascending: true }),

        db
          .from('supplier_purchase_volume')
          .select('supplier_id, supplier_name, total_orders, total_value, avg_lead_time_days')
          .eq('org_id', orgId)
          .order('total_value', { ascending: false })
          .limit(5),

        db
          .from('quotation_savings_by_item')
          .select('savings, max_price')
          .eq('org_id', orgId),

        db
          .from('supplier_returns')
          .select('id')
          .eq('org_id', orgId)
          .gte('return_date', start)
          .lte('return_date', end),

        db
          .from('purchase_receipts')
          .select('id')
          .eq('org_id', orgId)
          .gte('receipt_date', start)
          .lte('receipt_date', end),
      ]);

    const orders: Array<{
      id: string;
      total_value: number;
      order_date: string;
      actual_delivery: string | null;
      supplier_id: string;
    }> = ordersRes.data ?? [];

    const totalValue    = orders.reduce((s, o) => s + (Number(o.total_value) || 0), 0);
    const totalOrders   = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    const leadTimesOrders = orders.filter(o => o.actual_delivery != null);
    const avgLeadTimeDays =
      leadTimesOrders.length > 0
        ? leadTimesOrders.reduce((s, o) => {
            const diff =
              (new Date(o.actual_delivery!).getTime() - new Date(o.order_date).getTime()) /
              86_400_000;
            return s + diff;
          }, 0) / leadTimesOrders.length
        : 0;

    const activeSuppliers = new Set(orders.map(o => o.supplier_id)).size;

    const savings: Array<{ savings: number; max_price: number }> = quotSavingsRes.data ?? [];
    const savingsFromQuotations = savings.reduce((s, r) => s + (Number(r.savings) || 0), 0);
    const totalMaxPrice = savings.reduce((s, r) => s + (Number(r.max_price) || 0), 0);
    const savingsPercentage = totalMaxPrice > 0 ? (savingsFromQuotations / totalMaxPrice) * 100 : 0;

    const returnsCount  = (returnsRes.data ?? []).length;
    const receiptsCount = (receiptsRes.data ?? []).length;
    const returnRate    = receiptsCount > 0 ? (returnsCount / receiptsCount) * 100 : 0;

    const volumeByMonth: VolumeByMonth[] = (volumeRes.data ?? []).map(
      (r: { month: string; total_value: number; total_orders: number }) => ({
        month:        new Date(r.month).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        total_value:  Number(r.total_value) || 0,
        total_orders: Number(r.total_orders) || 0,
      }),
    );

    const topSuppliers: SupplierVolume[] = (suppliersRes.data ?? []).map(
      (r: SupplierVolume) => ({
        supplier_id:        r.supplier_id,
        supplier_name:      r.supplier_name,
        total_orders:       Number(r.total_orders) || 0,
        total_value:        Number(r.total_value) || 0,
        avg_lead_time_days: r.avg_lead_time_days != null ? Number(r.avg_lead_time_days) : null,
      }),
    );

    return {
      kpis: {
        totalValue,
        totalOrders,
        averageOrderValue,
        avgLeadTimeDays,
        savingsFromQuotations,
        savingsPercentage,
        activeSuppliers,
        returnRate,
      },
      volumeByMonth,
      topSuppliers,
    };
  },

  buildPrintHTML(
    data: PurchasingReportData,
    orgName: string,
    period: string,
  ): string {
    const fmt = (v: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const pct = (v: number) => `${v.toFixed(1)}%`;
    const num = (v: number) => v.toFixed(1);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Compras</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;color:#111;background:#fff;line-height:1.4}
  .wrap{max-width:960px;margin:0 auto;padding:24px}
  .header{text-align:center;border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:24px}
  .header h1{font-size:22px;font-weight:700}
  .header p{font-size:13px;color:#555;margin-top:4px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
  .kpi{background:#f5f5f5;border:1px solid #ddd;border-radius:6px;padding:14px;text-align:center}
  .kpi-val{font-size:18px;font-weight:700;color:#111}
  .kpi-lbl{font-size:11px;color:#666;margin-top:3px}
  h2{font-size:16px;font-weight:600;margin-bottom:10px;border-bottom:1px solid #ccc;padding-bottom:4px}
  section{margin-bottom:24px}
  table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #ccc;padding:7px 10px;font-size:12px;text-align:left}
  th{background:#f0f0f0;font-weight:600}
  .r{text-align:right}.c{text-align:center}
  .footer{margin-top:32px;border-top:2px solid #333;padding-top:12px;text-align:center;font-size:11px;color:#666}
  @media print{.wrap{padding:8px;max-width:none}}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>RELATÓRIO DE COMPRAS</h1>
    <p>${orgName} — Período: ${period}</p>
    <p>Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>

  <section>
    <h2>KPIs PRINCIPAIS</h2>
    <div class="kpis">
      <div class="kpi"><div class="kpi-val">${fmt(data.kpis.totalValue)}</div><div class="kpi-lbl">Total de Compras</div></div>
      <div class="kpi"><div class="kpi-val">${data.kpis.totalOrders}</div><div class="kpi-lbl">Pedidos</div></div>
      <div class="kpi"><div class="kpi-val">${fmt(data.kpis.savingsFromQuotations)}</div><div class="kpi-lbl">Economia (${pct(data.kpis.savingsPercentage)})</div></div>
      <div class="kpi"><div class="kpi-val">${num(data.kpis.avgLeadTimeDays)} dias</div><div class="kpi-lbl">Lead Time Médio</div></div>
      <div class="kpi"><div class="kpi-val">${data.kpis.activeSuppliers}</div><div class="kpi-lbl">Fornecedores Ativos</div></div>
      <div class="kpi"><div class="kpi-val">${fmt(data.kpis.averageOrderValue)}</div><div class="kpi-lbl">Ticket Médio</div></div>
      <div class="kpi"><div class="kpi-val">${pct(data.kpis.returnRate)}</div><div class="kpi-lbl">Taxa de Devolução</div></div>
    </div>
  </section>

  <section>
    <h2>VOLUME POR MÊS</h2>
    <table>
      <thead><tr><th>Mês</th><th class="c">Pedidos</th><th class="r">Valor Total</th></tr></thead>
      <tbody>${data.volumeByMonth.map(r => `<tr><td>${r.month}</td><td class="c">${r.total_orders}</td><td class="r">${fmt(r.total_value)}</td></tr>`).join('') || '<tr><td colspan="3" class="c">Sem dados</td></tr>'}</tbody>
    </table>
  </section>

  <section>
    <h2>TOP 5 FORNECEDORES</h2>
    <table>
      <thead><tr><th>Fornecedor</th><th class="c">Pedidos</th><th class="r">Valor Total</th><th class="c">Lead Time Médio</th></tr></thead>
      <tbody>${data.topSuppliers.map(r => `<tr><td>${r.supplier_name}</td><td class="c">${r.total_orders}</td><td class="r">${fmt(r.total_value)}</td><td class="c">${r.avg_lead_time_days != null ? `${r.avg_lead_time_days.toFixed(1)} dias` : '—'}</td></tr>`).join('') || '<tr><td colspan="4" class="c">Sem dados</td></tr>'}</tbody>
    </table>
  </section>

  <div class="footer"><p>Sistema ERP Retífica Formiguense</p></div>
</div>
</body>
</html>`;
  },
};
