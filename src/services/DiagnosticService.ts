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

    // Buscar nomes dos usuários que fizeram os diagnósticos
    const userIds = [...new Set((responses || []).map(r => r.diagnosed_by).filter(Boolean))] as string[];
    let userNames: Record<string, string> = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('user_basic_info')
        .select('user_id, name')
        .in('user_id', userIds);
        
      userNames = (users || []).reduce((acc, user) => ({
        ...acc,
        [user.user_id]: user.name
      }), {}) as Record<string, string>;
    }

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

          // Adicionar nome do usuário que diagnosticou
          const diagnosedByName = response.diagnosed_by 
            ? (userNames[response.diagnosed_by] || response.diagnosed_by || 'Usuário não identificado')
            : 'N/A';

          return { 
            ...response, 
            order: orderData as any,
            diagnosed_by_name: diagnosedByName
          } as DiagnosticResponse;
        } catch (_e) {
          // Mesmo em caso de erro, adicionar o nome do usuário se disponível
          const diagnosedByName = response.diagnosed_by 
            ? (userNames[response.diagnosed_by] || response.diagnosed_by || 'Usuário não identificado')
            : 'N/A';
          
          return { 
            ...response,
            diagnosed_by_name: diagnosedByName
          } as DiagnosticResponse;
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

    // Buscar nomes dos usuários que fizeram os diagnósticos
    const userIds = [...new Set((data || []).map((r: any) => r.diagnosed_by).filter(Boolean))] as string[];
    let userNames: Record<string, string> = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('user_basic_info')
        .select('user_id, name')
        .in('user_id', userIds);
        
      userNames = (users || []).reduce((acc, user) => ({
        ...acc,
        [user.user_id]: user.name
      }), {}) as Record<string, string>;
    }

    // Mapear os dados para incluir o nome do usuário
    const enrichedData = (data || []).map((response: any) => ({
      ...response,
      diagnosed_by_name: response.diagnosed_by 
        ? (userNames[response.diagnosed_by] || response.diagnosed_by || 'Usuário não identificado')
        : 'N/A'
    }));

    return enrichedData as DiagnosticResponse[];
  }
}


