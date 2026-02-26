import { supabase } from '@/integrations/supabase/client';
import type { Quotation } from './QuotationService';
import type { PurchaseOrderRow } from './PurchaseOrderService';
import type { ConditionalOrder } from './ConditionalOrderService';
import type { PurchaseNeed } from '@/hooks/usePurchaseNeeds';

export interface DashboardCounters {
  quotations: {
    pending_proposals: number;
    ready_to_compare:  number;
    expired:           number;
  };
  orders: {
    pending_approval: number;
    approved:         number;
    receiving:        number;
  };
  conditionals: {
    awaiting_receipt: number;
    in_analysis:      number;
    overdue:          number;
  };
  needs: {
    pending: number;
    urgent:  number;
  };
}

export interface DashboardMetrics {
  month_purchases:    number;
  avg_lead_time:      number;
  savings_percentage: number;
}

export interface BuyerDashboardData {
  counters:             DashboardCounters;
  pending_quotations:   Quotation[];
  pending_approvals:    PurchaseOrderRow[];
  urgent_conditionals:  ConditionalOrder[];
  purchase_needs:       PurchaseNeed[];
  metrics:              DashboardMetrics;
}

export const BuyerDashboardService = {
  async fetchCounters(orgId: string): Promise<DashboardCounters> {
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: pendingProposals },
      { count: readyToCompare },
      { count: expired },
      { count: pendingApproval },
      { count: approvedOrders },
      { count: receiving },
      { count: awaitingReceipt },
      { count: inAnalysis },
      { count: overdueConditionals },
      { count: pendingNeeds },
      { count: urgentNeeds },
    ] = await Promise.all([
      supabase
        .from('purchase_quotations')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'waiting_proposals'),

      supabase
        .from('purchase_quotations')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'responded'),

      supabase
        .from('purchase_quotations')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .lt('due_date', today)
        .not('status', 'in', '("approved","rejected","cancelled")'),

      supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'pending_approval'),

      supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'approved'),

      supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .in('status', ['confirmed', 'in_transit']),

      supabase
        .from('conditional_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'pending'),

      supabase
        .from('conditional_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'in_analysis'),

      supabase
        .from('conditional_orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'overdue'),

      supabase
        .from('purchase_needs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'pending'),

      supabase
        .from('purchase_needs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'pending')
        .eq('priority_level', 'critical'),
    ]);

    return {
      quotations: {
        pending_proposals: pendingProposals ?? 0,
        ready_to_compare:  readyToCompare  ?? 0,
        expired:           expired          ?? 0,
      },
      orders: {
        pending_approval: pendingApproval ?? 0,
        approved:         approvedOrders  ?? 0,
        receiving:        receiving        ?? 0,
      },
      conditionals: {
        awaiting_receipt: awaitingReceipt    ?? 0,
        in_analysis:      inAnalysis         ?? 0,
        overdue:          overdueConditionals ?? 0,
      },
      needs: {
        pending: pendingNeeds ?? 0,
        urgent:  urgentNeeds  ?? 0,
      },
    };
  },

  async fetchPendingQuotations(orgId: string): Promise<Quotation[]> {
    const { data } = await supabase
      .from('purchase_quotation_details')
      .select('*')
      .eq('org_id', orgId)
      .in('status', ['waiting_proposals', 'sent'])
      .order('due_date', { ascending: true })
      .limit(5);
    return (data ?? []) as Quotation[];
  },

  async fetchPendingApprovals(orgId: string): Promise<PurchaseOrderRow[]> {
    const { data } = await supabase
      .from('purchase_orders')
      .select('*, supplier:suppliers(id, name, cnpj, email, phone, contact_person), items:purchase_order_items(*)')
      .eq('org_id', orgId)
      .eq('status', 'pending_approval')
      .order('total_value', { ascending: false })
      .limit(5);
    return (data ?? []) as PurchaseOrderRow[];
  },

  async fetchUrgentConditionals(orgId: string): Promise<ConditionalOrder[]> {
    const { data } = await supabase
      .from('conditional_orders')
      .select('*, supplier:suppliers(name, document), items:conditional_order_items(*)')
      .eq('org_id', orgId)
      .in('status', ['pending', 'in_analysis', 'overdue'])
      .order('expiry_date', { ascending: true })
      .limit(5);
    return (data ?? []) as ConditionalOrder[];
  },

  async fetchPurchaseNeeds(orgId: string): Promise<PurchaseNeed[]> {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const { data } = await supabase
      .from('purchase_needs')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .order('priority_level', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(5);

    const sorted = (data ?? []).sort(
      (a, b) =>
        (priorityOrder[a.priority_level as keyof typeof priorityOrder] ?? 3) -
        (priorityOrder[b.priority_level as keyof typeof priorityOrder] ?? 3),
    );
    return sorted as PurchaseNeed[];
  },

  async fetchMetrics(orgId: string): Promise<DashboardMetrics> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [{ data: monthOrders }, { data: deliveredOrders }] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select('total_value')
        .eq('org_id', orgId)
        .not('status', 'in', '("cancelled","rejected","draft")')
        .gte('order_date', monthStart),

      supabase
        .from('purchase_orders')
        .select('order_date, actual_delivery')
        .eq('org_id', orgId)
        .eq('status', 'delivered')
        .not('actual_delivery', 'is', null)
        .gte('order_date', new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString()),
    ]);

    const month_purchases = (monthOrders ?? []).reduce(
      (sum, o) => sum + (o.total_value ?? 0),
      0,
    );

    const leadTimes = (deliveredOrders ?? [])
      .filter(o => o.actual_delivery)
      .map(o => {
        const days = Math.ceil(
          (new Date(o.actual_delivery!).getTime() - new Date(o.order_date).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return days;
      })
      .filter(d => d > 0);

    const avg_lead_time =
      leadTimes.length > 0
        ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
        : 0;

    return { month_purchases, avg_lead_time, savings_percentage: 0 };
  },

  async fetchAll(orgId: string): Promise<BuyerDashboardData> {
    const [counters, pending_quotations, pending_approvals, urgent_conditionals, purchase_needs, metrics] =
      await Promise.all([
        BuyerDashboardService.fetchCounters(orgId),
        BuyerDashboardService.fetchPendingQuotations(orgId),
        BuyerDashboardService.fetchPendingApprovals(orgId),
        BuyerDashboardService.fetchUrgentConditionals(orgId),
        BuyerDashboardService.fetchPurchaseNeeds(orgId),
        BuyerDashboardService.fetchMetrics(orgId),
      ]);
    return { counters, pending_quotations, pending_approvals, urgent_conditionals, purchase_needs, metrics };
  },
};
