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

export interface SupplierPerformance {
  supplier_id: string;
  supplier_name: string;
  delivery_rating: number;
  quality_rating: number;
  price_rating: number;
  overall_rating: number;
  on_time_rate: number;
  quality_issue_rate: number;
  total_evaluations: number;
}

export interface LeadTimeDetail {
  supplier_id: string;
  supplier_name: string;
  avg_days: number;
  min_days: number;
  max_days: number;
  total_orders: number;
}

export interface TopItem {
  item_name: string;
  total_purchased: number;
  avg_unit_price: number;
  min_unit_price: number;
  max_unit_price: number;
  times_purchased: number;
}

export interface AuditFlag {
  type: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
}

export interface AuditData {
  totalOrders: number;
  ordersWithQuotation: number;
  ordersWithoutQuotation: number;
  emergencyRate: number;
  avgApprovalDays: number;
  flags: AuditFlag[];
  flaggedOrders: Array<{
    po_number: string;
    supplier_name: string;
    total_value: number;
    order_date: string;
    flag: string;
    severity: 'high' | 'medium' | 'low';
  }>;
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

  async fetchSupplierPerformance(orgId: string): Promise<SupplierPerformance[]> {
    const { data, error } = await db
      .from('supplier_evaluations')
      .select(`
        supplier_id,
        delivery_rating, quality_rating, price_rating, overall_rating,
        delivered_on_time, had_quality_issues,
        supplier:suppliers(name)
      `)
      .eq('org_id', orgId);

    if (error) throw error;

    const grouped = new Map<string, {
      name: string;
      deliveries: number[];
      qualities: number[];
      prices: number[];
      overalls: number[];
      on_time: number;
      quality_issues: number;
      count: number;
    }>();

    for (const row of (data ?? [])) {
      const id   = row.supplier_id as string;
      const name = (row.supplier as { name?: string } | null)?.name ?? id;
      if (!grouped.has(id)) {
        grouped.set(id, { name, deliveries: [], qualities: [], prices: [], overalls: [], on_time: 0, quality_issues: 0, count: 0 });
      }
      const g = grouped.get(id)!;
      g.deliveries.push(Number(row.delivery_rating) || 0);
      g.qualities.push(Number(row.quality_rating) || 0);
      g.prices.push(Number(row.price_rating) || 0);
      g.overalls.push(Number(row.overall_rating) || 0);
      if (row.delivered_on_time) g.on_time++;
      if (row.had_quality_issues) g.quality_issues++;
      g.count++;
    }

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return Array.from(grouped.entries()).map(([id, g]) => ({
      supplier_id:        id,
      supplier_name:      g.name,
      delivery_rating:    avg(g.deliveries),
      quality_rating:     avg(g.qualities),
      price_rating:       avg(g.prices),
      overall_rating:     avg(g.overalls),
      on_time_rate:       g.count > 0 ? (g.on_time / g.count) * 100 : 0,
      quality_issue_rate: g.count > 0 ? (g.quality_issues / g.count) * 100 : 0,
      total_evaluations:  g.count,
    })).sort((a, b) => b.overall_rating - a.overall_rating);
  },

  async fetchLeadTimeDetails(orgId: string, filters: FiltrosRelatorio): Promise<LeadTimeDetail[]> {
    const { start, end } = getDateRange(filters);

    const { data, error } = await db
      .from('purchase_orders')
      .select('supplier_id, order_date, actual_delivery, supplier:suppliers(name)')
      .eq('org_id', orgId)
      .gte('order_date', start)
      .lte('order_date', end)
      .not('actual_delivery', 'is', null)
      .not('status', 'in', '("cancelled","draft")');

    if (error) throw error;

    const grouped = new Map<string, { name: string; diffs: number[] }>();

    for (const row of (data ?? [])) {
      const id   = row.supplier_id as string;
      const name = (row.supplier as { name?: string } | null)?.name ?? id;
      const diff = (new Date(row.actual_delivery).getTime() - new Date(row.order_date).getTime()) / 86_400_000;
      if (!grouped.has(id)) grouped.set(id, { name, diffs: [] });
      grouped.get(id)!.diffs.push(diff);
    }

    return Array.from(grouped.entries())
      .map(([id, g]) => ({
        supplier_id:   id,
        supplier_name: g.name,
        avg_days:      g.diffs.reduce((a, b) => a + b, 0) / g.diffs.length,
        min_days:      Math.min(...g.diffs),
        max_days:      Math.max(...g.diffs),
        total_orders:  g.diffs.length,
      }))
      .sort((a, b) => a.avg_days - b.avg_days);
  },

  async fetchTopItems(orgId: string, filters: FiltrosRelatorio): Promise<TopItem[]> {
    const { start, end } = getDateRange(filters);

    const { data, error } = await db
      .from('purchase_order_items')
      .select(`
        item_name, unit_price, quantity,
        po:purchase_orders!po_id(org_id, order_date, status)
      `)
      .gte('po.order_date', start)
      .lte('po.order_date', end);

    if (error) throw error;

    const grouped = new Map<string, { prices: number[]; qty: number; times: number }>();

    for (const row of (data ?? [])) {
      const po = row.po as { org_id?: string; status?: string } | null;
      if (!po || po.org_id !== orgId) continue;
      if (po.status === 'cancelled' || po.status === 'draft') continue;

      const name = (row.item_name as string) || '(sem nome)';
      if (!grouped.has(name)) grouped.set(name, { prices: [], qty: 0, times: 0 });
      const g = grouped.get(name)!;
      g.prices.push(Number(row.unit_price) || 0);
      g.qty  += Number(row.quantity) || 0;
      g.times++;
    }

    return Array.from(grouped.entries())
      .map(([name, g]) => ({
        item_name:       name,
        total_purchased: g.qty,
        avg_unit_price:  g.prices.length > 0 ? g.prices.reduce((a, b) => a + b, 0) / g.prices.length : 0,
        min_unit_price:  g.prices.length > 0 ? Math.min(...g.prices) : 0,
        max_unit_price:  g.prices.length > 0 ? Math.max(...g.prices) : 0,
        times_purchased: g.times,
      }))
      .sort((a, b) => b.total_purchased * b.avg_unit_price - a.total_purchased * a.avg_unit_price)
      .slice(0, 10);
  },

  async fetchAuditData(orgId: string, filters: FiltrosRelatorio): Promise<AuditData> {
    const { start, end } = getDateRange(filters);

    const { data: orders, error } = await db
      .from('purchase_orders')
      .select(`
        id, po_number, quotation_id, total_value, order_date,
        approved_at, created_at, status, requires_approval,
        supplier:suppliers(name)
      `)
      .eq('org_id', orgId)
      .gte('order_date', start)
      .lte('order_date', end)
      .not('status', 'in', '("cancelled","draft")');

    if (error) throw error;

    const rows = (orders ?? []) as Array<{
      id: string;
      po_number: string;
      quotation_id: string | null;
      total_value: number;
      order_date: string;
      approved_at: string | null;
      created_at: string;
      status: string;
      requires_approval: boolean;
      supplier: { name?: string } | null;
    }>;

    const totalOrders            = rows.length;
    const ordersWithQuotation    = rows.filter(r => r.quotation_id != null).length;
    const ordersWithoutQuotation = totalOrders - ordersWithQuotation;
    const emergencyRate          = totalOrders > 0 ? (ordersWithoutQuotation / totalOrders) * 100 : 0;

    const approvedWithDelay = rows.filter(r => r.requires_approval && r.approved_at != null);
    const avgApprovalDays =
      approvedWithDelay.length > 0
        ? approvedWithDelay.reduce((s, r) => {
            return s + (new Date(r.approved_at!).getTime() - new Date(r.created_at).getTime()) / 86_400_000;
          }, 0) / approvedWithDelay.length
        : 0;

    const flags = [
      { type: 'Sem cotação',       count: ordersWithoutQuotation,                                           severity: 'high'   },
      { type: 'Aprovação tardia',  count: approvedWithDelay.filter(r => {
          const d = (new Date(r.approved_at!).getTime() - new Date(r.created_at).getTime()) / 86_400_000;
          return d > 2;
        }).length,                                                                                            severity: 'medium' },
      { type: 'Alto valor (>R$20k)', count: rows.filter(r => Number(r.total_value) > 20_000).length,        severity: 'medium' },
    ].filter(f => f.count > 0);

    const flaggedOrders = rows
      .filter(r => r.quotation_id == null || Number(r.total_value) > 20_000)
      .slice(0, 10)
      .map(r => ({
        po_number:     r.po_number,
        supplier_name: r.supplier?.name ?? '—',
        total_value:   Number(r.total_value) || 0,
        order_date:    r.order_date,
        flag:          r.quotation_id == null ? 'Sem cotação' : 'Alto valor',
        severity:      (r.quotation_id == null ? 'high' : 'medium') as 'high' | 'medium' | 'low',
      }));

    return { totalOrders, ordersWithQuotation, ordersWithoutQuotation, emergencyRate, avgApprovalDays, flags: flags as AuditFlag[], flaggedOrders };
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
