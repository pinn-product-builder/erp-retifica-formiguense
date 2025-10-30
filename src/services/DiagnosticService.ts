import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticSearchParams {
  orgId: string;
  searchTerm?: string;
  status?: 'pending' | 'completed' | 'approved' | 'todos';
  component?: string | 'todos';
}

export interface DiagnosticResponse {
  id: string;
  order_id: string;
  checklist_id: string;
  component: string;
  status: 'pending' | 'completed' | 'approved';
  diagnosed_at: string;
  diagnosed_by: string;
  diagnosed_by_name?: string;
  responses?: Record<string, string | number | boolean>;
  order?: {
    order_number: string;
    customer?: { name: string };
    engine?: { type: string; brand: string; model: string };
  };
  checklist?: { name: string };
}

export class DiagnosticService {
  static async getResponsesWithOrderData(orgId: string): Promise<DiagnosticResponse[]> {
    const { data: responses, error } = await supabase
      .from('diagnostic_checklist_responses')
      .select('*')
      .eq('org_id', orgId);

    if (error) throw error;

    const base = (responses || []) as unknown as DiagnosticResponse[];
    const enriched = await Promise.all(
      base.map(async (response) => {
        try {
          const { data: orderData } = await supabase
            .from('orders')
            .select(`
              order_number,
              customer:customers(name),
              engine:engines(type, brand, model)
            `)
            .eq('id', response.order_id)
            .eq('org_id', orgId)
            .single();

          return { ...response, order: orderData as any } as DiagnosticResponse;
        } catch (_e) {
          return response;
        }
      })
    );

    return enriched;
  }

  static async getDiagnosticResponses(params: DiagnosticSearchParams): Promise<DiagnosticResponse[]> {
    const { orgId, searchTerm, status, component } = params;

    // Base query com joins necessários
    let query = supabase
      .from('diagnostic_checklist_responses')
      .select(`
        id,
        order_id,
        checklist_id,
        component,
        status,
        diagnosed_at,
        diagnosed_by,
        diagnosed_by_name,
        responses,
        orders(
          order_number,
          customer:customers(name),
          engine:engines(type, brand, model),
          org_id
        ),
        checklist:diagnostic_checklists(name)
      `)
      .eq('orders.org_id', orgId)
      .order('diagnosed_at', { ascending: false });

    if (status && status !== 'todos') {
      query = query.eq('status', status);
    }

    if (component && component !== 'todos') {
      query = query.eq('component', component);
    }
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim();
      const { data: orderMatches } = await supabase
        .from('orders')
        .select('id')
        .eq('org_id', orgId)
        .or(`order_number.ilike.%${term}%,customers.name.ilike.%${term}%` as any);

      const orderIds = (orderMatches || []).map(o => o.id);

      if (orderIds.length === 0) {
        // 2) Tentar por checklist name
        const { data: checklistMatches } = await supabase
          .from('diagnostic_checklists')
          .select('id')
          .ilike('name', `%${term}%`);

        const checklistIds = (checklistMatches || []).map(c => c.id);

        if (checklistIds.length === 0) {
          return [];
        }

        query = query.in('checklist_id', checklistIds);
      } else {
        query = query.in('order_id', orderIds);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown) as DiagnosticResponse[];
  }
}


