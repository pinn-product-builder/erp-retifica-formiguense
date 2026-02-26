import { supabase } from '@/integrations/supabase/client';

export type PriceHistoryPeriod = '3m' | '6m' | '12m' | '24m';

export interface PriceHistoryEntry {
  date: string;
  supplier_id: string;
  supplier_name: string;
  unit_price: number;
  quantity: number;
  po_number: string;
}

export interface SupplierPriceStats {
  supplier_id: string;
  supplier_name: string;
  last_price: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  times_purchased: number;
  trend: 'subindo' | 'estavel' | 'caindo';
  variation_percentage: number;
}

export interface PriceHistoryStats {
  min_price: number;
  max_price: number;
  avg_price: number;
  current_price: number;
  current_supplier: string;
  trend: 'subindo' | 'estavel' | 'caindo';
  variation_percentage: number;
}

export interface PriceHistoryChartPoint {
  date: string;
  [supplierName: string]: string | number;
}

export interface PriceHistoryData {
  item_name: string;
  entries: PriceHistoryEntry[];
  stats: PriceHistoryStats;
  by_supplier: SupplierPriceStats[];
  chart_data: PriceHistoryChartPoint[];
  supplier_names: string[];
}

function getDateMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

function calcTrend(entries: PriceHistoryEntry[]): { trend: 'subindo' | 'estavel' | 'caindo'; variation: number } {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return { trend: 'estavel', variation: 0 };
  const first = sorted[0].unit_price;
  const last = sorted[sorted.length - 1].unit_price;
  if (first === 0) return { trend: 'estavel', variation: 0 };
  const variation = ((last - first) / first) * 100;
  const trend = variation > 5 ? 'subindo' : variation < -5 ? 'caindo' : 'estavel';
  return { trend, variation };
}

function emptyResult(itemName: string): PriceHistoryData {
  return {
    item_name: itemName,
    entries: [],
    stats: { min_price: 0, max_price: 0, avg_price: 0, current_price: 0, current_supplier: '', trend: 'estavel', variation_percentage: 0 },
    by_supplier: [],
    chart_data: [],
    supplier_names: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const PriceHistoryService = {
  async fetchAllItems(orgId: string): Promise<string[]> {
    const { data: orders, error: ordersError } = await db
      .from('purchase_orders')
      .select('id')
      .eq('org_id', orgId)
      .not('status', 'in', '("cancelled","draft")');

    if (ordersError) throw ordersError;

    const orderIds = (orders ?? []).map((o: { id: string }) => o.id) as string[];
    if (orderIds.length === 0) return [];

    const { data: items, error: itemsError } = await db
      .from('purchase_order_items')
      .select('item_name')
      .in('po_id', orderIds)
      .order('item_name', { ascending: true });

    if (itemsError) throw itemsError;

    const unique = new Set<string>((items ?? []).map((i: { item_name: string }) => i.item_name));
    return Array.from(unique);
  },

  async fetchPriceHistory(
    orgId: string,
    itemName: string,
    period: PriceHistoryPeriod = '12m',
  ): Promise<PriceHistoryData> {
    const monthsMap: Record<PriceHistoryPeriod, number> = { '3m': 3, '6m': 6, '12m': 12, '24m': 24 };
    const startDate = getDateMonthsAgo(monthsMap[period]);

    const { data: orders, error: ordersError } = await db
      .from('purchase_orders')
      .select('id, order_date, po_number, supplier_id, supplier:suppliers(id, name)')
      .eq('org_id', orgId)
      .gte('order_date', startDate)
      .not('status', 'in', '("cancelled","draft")')
      .order('order_date', { ascending: true });

    if (ordersError) throw ordersError;

    const orderIds = (orders ?? []).map((o: { id: string }) => o.id) as string[];
    if (orderIds.length === 0) return emptyResult(itemName);

    const { data: items, error: itemsError } = await db
      .from('purchase_order_items')
      .select('item_name, unit_price, quantity, po_id')
      .eq('item_name', itemName)
      .in('po_id', orderIds);

    if (itemsError) throw itemsError;

    type OrderRow = {
      id: string;
      order_date: string;
      po_number: string;
      supplier_id: string;
      supplier: { id: string; name: string } | null;
    };

    const orderMap = new Map<string, OrderRow>();
    for (const o of (orders ?? []) as OrderRow[]) {
      orderMap.set(o.id, o);
    }

    type ItemRow = { item_name: string; unit_price: number; quantity: number; po_id: string };

    const entries: PriceHistoryEntry[] = ((items ?? []) as ItemRow[])
      .map(row => {
        const po = orderMap.get(row.po_id);
        if (!po) return null;
        return {
          date: po.order_date,
          supplier_id: po.supplier_id,
          supplier_name: po.supplier?.name ?? po.supplier_id,
          unit_price: Number(row.unit_price) || 0,
          quantity: Number(row.quantity) || 0,
          po_number: po.po_number,
        };
      })
      .filter((e): e is PriceHistoryEntry => e !== null)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (entries.length === 0) return emptyResult(itemName);

    const allPrices = entries.map(e => e.unit_price);
    const { trend, variation } = calcTrend(entries);
    const lastEntry = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];

    const supplierMap = new Map<string, PriceHistoryEntry[]>();
    for (const e of entries) {
      if (!supplierMap.has(e.supplier_id)) supplierMap.set(e.supplier_id, []);
      supplierMap.get(e.supplier_id)!.push(e);
    }

    const by_supplier: SupplierPriceStats[] = Array.from(supplierMap.entries())
      .map(([id, supEntries]) => {
        const prices = supEntries.map(e => e.unit_price);
        const { trend: sTrend, variation: sVariation } = calcTrend(supEntries);
        const sorted = [...supEntries].sort((a, b) => b.date.localeCompare(a.date));
        return {
          supplier_id: id,
          supplier_name: supEntries[0].supplier_name,
          last_price: sorted[0]?.unit_price ?? 0,
          avg_price: prices.reduce((a, b) => a + b, 0) / prices.length,
          min_price: Math.min(...prices),
          max_price: Math.max(...prices),
          times_purchased: supEntries.length,
          trend: sTrend,
          variation_percentage: sVariation,
        };
      })
      .sort((a, b) => a.last_price - b.last_price);

    const supplierNames = Array.from(new Set(entries.map(e => e.supplier_name)));

    const dateSupplierMap = new Map<string, Map<string, number>>();
    for (const e of entries) {
      if (!dateSupplierMap.has(e.date)) dateSupplierMap.set(e.date, new Map());
      dateSupplierMap.get(e.date)!.set(e.supplier_name, e.unit_price);
    }

    const chart_data: PriceHistoryChartPoint[] = Array.from(dateSupplierMap.keys())
      .sort()
      .map(date => {
        const row: PriceHistoryChartPoint = {
          date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        };
        for (const [supplier, price] of dateSupplierMap.get(date)!) {
          row[supplier] = price;
        }
        return row;
      });

    return {
      item_name: itemName,
      entries,
      stats: {
        min_price: Math.min(...allPrices),
        max_price: Math.max(...allPrices),
        avg_price: allPrices.reduce((a, b) => a + b, 0) / allPrices.length,
        current_price: lastEntry.unit_price,
        current_supplier: lastEntry.supplier_name,
        trend,
        variation_percentage: variation,
      },
      by_supplier,
      chart_data,
      supplier_names: supplierNames,
    };
  },
};
