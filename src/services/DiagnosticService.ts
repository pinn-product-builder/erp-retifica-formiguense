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
      query = query.eq('component', component as "bloco" | "eixo" | "biela" | "comando" | "cabecote" | "virabrequim" | "pistao");
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

  static async getOrderEngineType(orderId: string, orgId: string): Promise<string | null> {
    const { data: orderData, error } = await supabase
      .from('orders')
      .select(`
        engine_id,
        engines(
          engine_type_id
        )
      `)
      .eq('id', orderId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      console.error('Erro ao buscar tipo de motor da ordem:', error);
      return null;
    }

    const enginesData = orderData?.engines;
    const engine = Array.isArray(enginesData) ? enginesData[0] : enginesData;
    
    return engine?.engine_type_id || null;
  }

  static async getChecklistsByComponent(
    orgId: string,
    component: string,
    engineTypeId?: string
  ): Promise<any | null> {
    let query = supabase
      .from('diagnostic_checklists')
      .select(`
        *,
        items:diagnostic_checklist_items(*)
      `)
      .eq('org_id', orgId)
      .eq('component', component as "bloco" | "eixo" | "biela" | "comando" | "cabecote" | "virabrequim" | "pistao")
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (engineTypeId) {
      query = query.or(`engine_type_id.is.null,engine_type_id.eq.${engineTypeId}`);
    } else {
      query = query.is('engine_type_id', null);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error(`Erro ao buscar checklist para ${component}:`, error);
      return null;
    }

    if (!data && engineTypeId) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('diagnostic_checklists')
        .select(`
          *,
          items:diagnostic_checklist_items(*)
        `)
        .eq('org_id', orgId)
        .eq('component', component as "bloco" | "eixo" | "biela" | "comando" | "cabecote" | "virabrequim" | "pistao")
        .eq('is_active', true)
        .is('engine_type_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackError && fallbackError.code !== 'PGRST116') {
        console.error(`Erro ao buscar checklist genérico para ${component}:`, fallbackError);
        return null;
      }

      return fallbackData;
    }

    return data;
  }

  static async saveChecklistResponse(params: {
    orderId: string;
    checklistId: string;
    component: string;
    responses: Record<string, unknown>;
    photos: Array<Record<string, unknown>>;
    generatedServices: Array<Record<string, unknown>>;
    diagnosedBy: string;
    additionalParts?: unknown;
    additionalServices?: unknown;
  }): Promise<any> {
    const { data, error } = await supabase
      .from('diagnostic_checklist_responses')
      .insert({
        order_id: params.orderId,
        checklist_id: params.checklistId,
        component: params.component as "bloco" | "eixo" | "biela" | "comando" | "cabecote" | "virabrequim" | "pistao",
        responses: params.responses,
        photos: params.photos,
        generated_services: params.generatedServices,
        diagnosed_by: params.diagnosedBy,
        status: 'completed',
        additional_parts: params.additionalParts || null,
        additional_services: params.additionalServices || null,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async uploadChecklistPhoto(
    file: File,
    responseId: string,
    itemId: string
  ): Promise<{ url: string; name: string; size: number } | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `checklist-photos/${responseId}/${itemId}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diagnostic-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('diagnostic-photos')
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        name: file.name,
        size: file.size
      };
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    }
  }

  static async getDiagnosticDataForBudget(
    orderId: string,
    orgId: string
  ): Promise<Array<{
    additional_parts?: unknown;
    additional_services?: unknown;
    generated_services?: Array<Record<string, unknown>>;
  }>> {
    const { data: diagnosticResponses, error } = await supabase
      .from('diagnostic_checklist_responses')
      .select(`
        additional_parts,
        additional_services,
        generated_services,
        order:orders!inner(id, org_id)
      `)
      .eq('order.id', orderId)
      .eq('order.org_id', orgId)
      .eq('status', 'completed')
      .order('diagnosed_at', { ascending: false });

    if (error) throw error;
    return (diagnosticResponses || []) as Array<{
      additional_parts?: unknown;
      additional_services?: unknown;
      generated_services?: Array<Record<string, unknown>>;
    }>;
  }

  static async getCurrentUser(): Promise<{ id: string } | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? { id: user.id } : null;
  }
}


