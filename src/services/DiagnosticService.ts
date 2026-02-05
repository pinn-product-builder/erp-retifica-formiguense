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
    const { data: responses, error} = await supabase
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

          const { data: additionalParts } = await supabase
            .from('diagnostic_additional_parts' as any)
            .select('*')
            .eq('diagnostic_response_id', response.id)
            .eq('org_id', orgId);

          const { data: additionalServices } = await supabase
            .from('diagnostic_additional_services' as any)
            .select('*')
            .eq('diagnostic_response_id', response.id)
            .eq('org_id', orgId);

          const diagnosedByName = response.diagnosed_by 
            ? (userNames[response.diagnosed_by] || response.diagnosed_by || 'Usuário não identificado')
            : 'N/A';

          return { 
            ...response, 
            order: orderData as any,
            diagnosed_by_name: diagnosedByName,
            additional_parts: additionalParts || [],
            additional_services: additionalServices || []
          } as DiagnosticResponse;
        } catch (_e) {
          const diagnosedByName = response.diagnosed_by 
            ? (userNames[response.diagnosed_by] || response.diagnosed_by || 'Usuário não identificado')
            : 'N/A';
          
          return { 
            ...response,
            diagnosed_by_name: diagnosedByName,
            additional_parts: [],
            additional_services: []
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

  static async getOrderEngineInfo(orderId: string, orgId: string): Promise<{ brand: string; model: string } | null> {
    const { data: orderData, error } = await supabase
      .from('orders')
      .select(`
        engine_id,
        engines(
          brand,
          model
        )
      `)
      .eq('id', orderId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      console.error('Erro ao buscar informações do motor da ordem:', error);
      return null;
    }

    const enginesData = orderData?.engines;
    const engine = Array.isArray(enginesData) ? enginesData[0] : enginesData;
    
    if (!engine?.brand || !engine?.model) {
      return null;
    }

    return {
      brand: engine.brand,
      model: engine.model
    };
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
    additionalParts?: Array<{
      id?: string;
      part_code: string;
      part_name: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    additionalServices?: Array<{
      id?: string;
      description: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    technicalObservations?: string;
    extraServices?: string;
    finalOpinion?: string;
  }): Promise<any> {
    const { data: diagnosticResponse, error: diagnosticError } = await supabase
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
        technical_observations: params.technicalObservations || null,
        extra_services: params.extraServices || null,
        final_opinion: params.finalOpinion || null,
      } as any)
      .select()
      .single();

    if (diagnosticError) throw diagnosticError;
    if (!diagnosticResponse) throw new Error('Failed to create diagnostic response');

    const diagnosticResponseId = diagnosticResponse.id;

    if (params.additionalParts && params.additionalParts.length > 0) {
      const partsToInsert = params.additionalParts.map(part => ({
        diagnostic_response_id: diagnosticResponseId,
        part_code: part.part_code,
        part_name: part.part_name,
        quantity: part.quantity,
        unit_price: part.unit_price,
        total: part.total,
      }));

      const { error: partsError } = await supabase
        .from('diagnostic_additional_parts' as any)
        .insert(partsToInsert as any);

      if (partsError) {
        console.error('Error inserting additional parts:', partsError);
      }
    }

    if (params.additionalServices && params.additionalServices.length > 0) {
      const servicesToInsert = params.additionalServices.map(service => ({
        diagnostic_response_id: diagnosticResponseId,
        service_id: service.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(service.id) 
          ? service.id 
          : null,
        description: service.description,
        quantity: service.quantity,
        unit_price: service.unit_price,
        total: service.total,
      }));

      const { error: servicesError } = await supabase
        .from('diagnostic_additional_services' as any)
        .insert(servicesToInsert as any);

      if (servicesError) {
        console.error('Error inserting additional services:', servicesError);
      }
    }

    return diagnosticResponse;
  }

  static async saveAdditionalPartsAndServices(params: {
    orderId: string;
    component: string;
    diagnosedBy: string;
    orgId: string;
    additionalParts?: Array<{
      id?: string;
      part_code: string;
      part_name: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    additionalServices?: Array<{
      id?: string;
      description: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    technicalObservations?: string;
    extraServices?: string;
    finalOpinion?: string;
  }): Promise<any> {
    const { data: existingResponse, error: checkError } = await supabase
      .from('diagnostic_checklist_responses')
      .select('id')
      .eq('order_id', params.orderId)
      .eq('component', params.component)
      .eq('org_id', params.orgId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let diagnosticResponseId: string;

    if (existingResponse) {
      diagnosticResponseId = existingResponse.id;
      
      const { error: updateError } = await supabase
        .from('diagnostic_checklist_responses')
        .update({
          technical_observations: params.technicalObservations || null,
          extra_services: params.extraServices || null,
          final_opinion: params.finalOpinion || null,
        } as any)
        .eq('id', diagnosticResponseId);

      if (updateError) {
        console.error('Error updating observations:', updateError);
      }
    } else {
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, org_id')
        .eq('id', params.orderId)
        .single();

      if (!orderData) {
        throw new Error('Order not found');
      }

      const { data: newResponse, error: createError } = await supabase
        .from('diagnostic_checklist_responses')
        .insert({
          order_id: params.orderId,
          checklist_id: null,
          component: params.component as "bloco" | "eixo" | "biela" | "comando" | "cabecote" | "virabrequim" | "pistao",
          responses: {},
          photos: [],
          generated_services: [],
          diagnosed_by: params.diagnosedBy,
          status: 'pending',
          org_id: params.orgId,
          technical_observations: params.technicalObservations || null,
          extra_services: params.extraServices || null,
          final_opinion: params.finalOpinion || null,
        } as any)
        .select()
        .single();

      if (createError) throw createError;
      if (!newResponse) throw new Error('Failed to create diagnostic response');

      diagnosticResponseId = newResponse.id;
    }

    if (params.additionalParts && params.additionalParts.length > 0) {
      const { error: deletePartsError } = await supabase
        .from('diagnostic_additional_parts' as any)
        .delete()
        .eq('diagnostic_response_id', diagnosticResponseId)
        .eq('org_id', params.orgId);

      if (deletePartsError) {
        console.error('Error deleting existing parts:', deletePartsError);
      }

      const partsToInsert = params.additionalParts.map(part => ({
        diagnostic_response_id: diagnosticResponseId,
        part_code: part.part_code,
        part_name: part.part_name,
        quantity: part.quantity,
        unit_price: part.unit_price,
        total: part.total,
        org_id: params.orgId,
      }));

      const { error: partsError } = await supabase
        .from('diagnostic_additional_parts' as any)
        .insert(partsToInsert as any);

      if (partsError) {
        console.error('Error inserting additional parts:', partsError);
        throw partsError;
      }
    } else {
      const { error: deletePartsError } = await supabase
        .from('diagnostic_additional_parts' as any)
        .delete()
        .eq('diagnostic_response_id', diagnosticResponseId)
        .eq('org_id', params.orgId);

      if (deletePartsError) {
        console.error('Error deleting parts:', deletePartsError);
      }
    }

    if (params.additionalServices && params.additionalServices.length > 0) {
      const { error: deleteServicesError } = await supabase
        .from('diagnostic_additional_services' as any)
        .delete()
        .eq('diagnostic_response_id', diagnosticResponseId)
        .eq('org_id', params.orgId);

      if (deleteServicesError) {
        console.error('Error deleting existing services:', deleteServicesError);
      }

      const servicesToInsert = params.additionalServices.map(service => ({
        diagnostic_response_id: diagnosticResponseId,
        service_id: service.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(service.id) 
          ? service.id 
          : null,
        description: service.description,
        quantity: service.quantity,
        unit_price: service.unit_price,
        total: service.total,
        org_id: params.orgId,
      }));

      const { error: servicesError } = await supabase
        .from('diagnostic_additional_services' as any)
        .insert(servicesToInsert as any);

      if (servicesError) {
        console.error('Error inserting additional services:', servicesError);
        throw servicesError;
      }
    } else {
      const { error: deleteServicesError } = await supabase
        .from('diagnostic_additional_services' as any)
        .delete()
        .eq('diagnostic_response_id', diagnosticResponseId)
        .eq('org_id', params.orgId);

      if (deleteServicesError) {
        console.error('Error deleting services:', deleteServicesError);
      }
    }

    const { data: updatedResponse } = await supabase
      .from('diagnostic_checklist_responses')
      .select('*')
      .eq('id', diagnosticResponseId)
      .single();

    return updatedResponse;
  }

  static async uploadChecklistPhoto(
    file: File,
    responseId: string,
    itemId: string
  ): Promise<{ url: string; name: string; size: number; path: string } | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `checklist-photos/${responseId}/${itemId}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diagnostic-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: signedUrl } = await supabase.storage
        .from('diagnostic-photos')
        .createSignedUrl(fileName, 3600);

      return {
        url: signedUrl?.signedUrl || fileName,
        path: fileName,
        name: file.name,
        size: file.size
      };
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    }
  }

  static async getDiagnosticPhotoUrl(path: string): Promise<string | null> {
    try {
      const { data: signedUrl } = await supabase.storage
        .from('diagnostic-photos')
        .createSignedUrl(path, 3600);
      
      return signedUrl?.signedUrl || null;
    } catch (error) {
      console.error('Erro ao gerar URL assinada da foto:', error);
      return null;
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
        id,
        generated_services,
        order:orders!inner(id, org_id)
      `)
      .eq('order.id', orderId)
      .eq('order.org_id', orgId)
      .in('status', ['completed', 'pending'])
      .order('diagnosed_at', { ascending: false });

    if (error) throw error;
    if (!diagnosticResponses || diagnosticResponses.length === 0) return [];

    const responseIds = diagnosticResponses.map((r: any) => r.id);

    const [partsResult, servicesResult] = await Promise.all([
      supabase
        .from('diagnostic_additional_parts' as any)
        .select('*')
        .in('diagnostic_response_id', responseIds)
        .eq('org_id', orgId),
      supabase
        .from('diagnostic_additional_services' as any)
        .select('*')
        .in('diagnostic_response_id', responseIds)
        .eq('org_id', orgId)
    ]);

    const allParts = partsResult.data || [];
    const allServices = servicesResult.data || [];

    const partsByResponseId = new Map<string, unknown[]>();
    const servicesByResponseId = new Map<string, unknown[]>();

    allParts.forEach((part: any) => {
      const responseId = part.diagnostic_response_id;
      if (!partsByResponseId.has(responseId)) {
        partsByResponseId.set(responseId, []);
      }
      partsByResponseId.get(responseId)!.push(part);
    });

    allServices.forEach((service: any) => {
      const responseId = service.diagnostic_response_id;
      if (!servicesByResponseId.has(responseId)) {
        servicesByResponseId.set(responseId, []);
      }
      servicesByResponseId.get(responseId)!.push(service);
    });

    const enrichedResponses = diagnosticResponses.map((response: any) => ({
      additional_parts: partsByResponseId.get(response.id) || [],
      additional_services: servicesByResponseId.get(response.id) || [],
      generated_services: response.generated_services || []
    }));

    return enrichedResponses;
  }

  static async getCurrentUser(): Promise<{ id: string } | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? { id: user.id } : null;
  }
}