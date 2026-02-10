import { supabase } from '@/integrations/supabase/client';
import { PaginatedResult } from './EngineService';

export interface EngineTemplatePart {
  id: string;
  template_id: string;
  part_id: string;
  quantity: number;
  notes: string | null;
  display_order: number;
  part?: {
    id: string;
    part_code: string;
    part_name: string;
    unit_cost: number;
    macro_component_id?: string | null;
  };
}

export interface IEngineTemplateService {
  id: string;
  template_id: string;
  service_id: string;
  quantity: number;
  notes: string | null;
  display_order: number;
  service?: {
    id: string;
    description: string;
    value: number;
    macro_component_id?: string | null;
  };
}

export interface EngineTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  labor_cost: number | null;
  engine_brand: string;
  engine_model: string;
  engine_type_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  engine_type?: {
    id: string;
    name: string;
    category: string;
  } | null;
  parts?: EngineTemplatePart[];
  services?: IEngineTemplateService[];
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  labor_cost?: number;
  engine_brand: string;
  engine_model: string;
  engine_type_id?: string;
  parts: Array<{
    part_id: string;
    quantity: number;
    notes?: string;
  }>;
  services: Array<{
    service_id: string;
    quantity: number;
    notes?: string;
  }>;
}

export interface TemplateFilters {
  searchTerm?: string;
  engineTypeId?: string;
}

export class EngineTemplateService {
  static async getTemplates(
    orgId: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: TemplateFilters
  ): Promise<PaginatedResult<EngineTemplate>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('engine_templates')
      .select(
        `
        *,
        engine_type:engine_types(id, name, category),
        parts:engine_template_parts(
          id,
          part_id,
          quantity,
          notes,
          display_order,
          part:parts_inventory(id, part_code, part_name, unit_cost, macro_component_id)
        ),
        services:engine_template_services(
          id,
          service_id,
          quantity,
          notes,
          display_order,
          service:additional_services(id, description, value, macro_component_id)
        )
      `,
        { count: 'exact' }
      )
      .eq('org_id', orgId);

    if (filters?.searchTerm) {
      query = query.or(
        `name.ilike.%${filters.searchTerm}%,engine_brand.ilike.%${filters.searchTerm}%,engine_model.ilike.%${filters.searchTerm}%`
      );
    }

    if (filters?.engineTypeId && filters.engineTypeId !== 'todos') {
      query = query.eq('engine_type_id', filters.engineTypeId);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Erro ao buscar templates:', error);
      throw new Error('Erro ao buscar templates');
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return {
      data: (data || []) as unknown as EngineTemplate[],
      count: count || 0,
      page,
      pageSize,
      totalPages,
    };
  }

  static async getUsedEngineBrandModels(
    orgId: string
  ): Promise<{ engine_brand: string; engine_model: string }[]> {
    const { data, error } = await supabase
      .from('engine_templates')
      .select('engine_brand, engine_model')
      .eq('org_id', orgId);

    if (error) {
      console.error('Erro ao buscar marcas/modelos em uso:', error);
      throw new Error('Erro ao buscar marcas/modelos em uso');
    }

    const seen = new Set<string>();
    return (data || []).filter((row) => {
      const key = `${row.engine_brand}|${row.engine_model}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  static async getTemplateById(templateId: string, orgId: string): Promise<EngineTemplate | null> {
    const { data, error } = await supabase
      .from('engine_templates')
      .select(
        `
        *,
        engine_type:engine_types(id, name, category),
        parts:engine_template_parts(
          id,
          part_id,
          quantity,
          notes,
          display_order,
          part:parts_inventory(id, part_code, part_name, unit_cost, macro_component_id)
        ),
        services:engine_template_services(
          id,
          service_id,
          quantity,
          notes,
          display_order,
          service:additional_services(id, description, value, macro_component_id)
        )
      `
      )
      .eq('id', templateId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      console.error('Erro ao buscar template:', error);
      throw new Error('Erro ao buscar template');
    }

    return data as unknown as EngineTemplate;
  }

  static async getTemplateByEngine(
    orgId: string,
    engineBrand: string,
    engineModel: string
  ): Promise<EngineTemplate | null> {
    const { data, error } = await supabase
      .from('engine_templates')
      .select(
        `
        *,
        engine_type:engine_types(id, name, category),
        parts:engine_template_parts(
          id,
          part_id,
          quantity,
          notes,
          display_order,
          part:parts_inventory(id, part_code, part_name, unit_cost, macro_component_id)
        ),
        services:engine_template_services(
          id,
          service_id,
          quantity,
          notes,
          display_order,
          service:additional_services(id, description, value, macro_component_id)
        )
      `
      )
      .eq('org_id', orgId)
      .eq('engine_brand', engineBrand)
      .eq('engine_model', engineModel)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar template por motor:', error);
      return null;
    }

    return data as unknown as EngineTemplate;
  }

  static async createTemplate(
    orgId: string,
    userId: string,
    templateData: CreateTemplateData
  ): Promise<EngineTemplate> {
    const { data: template, error: templateError } = await supabase
      .from('engine_templates')
      .insert({
        org_id: orgId,
        name: templateData.name,
        description: templateData.description,
        labor_cost: templateData.labor_cost ?? 0,
        engine_brand: templateData.engine_brand,
        engine_model: templateData.engine_model,
        engine_type_id: templateData.engine_type_id,
        created_by: userId,
      })
      .select()
      .single();

    if (templateError) {
      console.error('Erro ao criar template:', templateError);
      const err = new Error(templateError.message) as Error & { code?: string };
      err.code = templateError.code;
      throw err;
    }

    if (templateData.parts.length > 0) {
      const partsToInsert = templateData.parts.map((part, index) => ({
        template_id: template.id,
        part_id: part.part_id,
        quantity: part.quantity,
        notes: part.notes,
        display_order: index,
      }));

      const { error: partsError } = await supabase
        .from('engine_template_parts')
        .insert(partsToInsert);

      if (partsError) {
        console.error('Erro ao adicionar peças ao template:', partsError);
        throw new Error('Erro ao adicionar peças ao template');
      }
    }

    if (templateData.services.length > 0) {
      const servicesToInsert = templateData.services.map((service, index) => ({
        template_id: template.id,
        service_id: service.service_id,
        quantity: service.quantity,
        notes: service.notes,
        display_order: index,
      }));

      const { error: servicesError } = await supabase
        .from('engine_template_services')
        .insert(servicesToInsert);

      if (servicesError) {
        console.error('Erro ao adicionar serviços ao template:', servicesError);
        throw new Error('Erro ao adicionar serviços ao template');
      }
    }

    return this.getTemplateById(template.id, orgId) as Promise<EngineTemplate>;
  }

  static async updateTemplate(
    templateId: string,
    orgId: string,
    templateData: Partial<CreateTemplateData>
  ): Promise<EngineTemplate> {
    const updateData: Record<string, unknown> = {};
    if (templateData.name) updateData.name = templateData.name;
    if (templateData.description !== undefined) updateData.description = templateData.description;
    if (templateData.labor_cost !== undefined) updateData.labor_cost = templateData.labor_cost;
    if (templateData.engine_brand) updateData.engine_brand = templateData.engine_brand;
    if (templateData.engine_model) updateData.engine_model = templateData.engine_model;
    if (templateData.engine_type_id !== undefined)
      updateData.engine_type_id = templateData.engine_type_id;

    if (Object.keys(updateData).length > 0) {
      const { error: templateError } = await supabase
        .from('engine_templates')
        .update(updateData)
        .eq('id', templateId)
        .eq('org_id', orgId);

      if (templateError) {
        console.error('Erro ao atualizar template:', templateError);
        const err = new Error(templateError.message) as Error & { code?: string };
        err.code = templateError.code;
        throw err;
      }
    }

    if (templateData.parts) {
      await supabase.from('engine_template_parts').delete().eq('template_id', templateId);

      if (templateData.parts.length > 0) {
        const partsToInsert = templateData.parts.map((part, index) => ({
          template_id: templateId,
          part_id: part.part_id,
          quantity: part.quantity,
          notes: part.notes,
          display_order: index,
        }));

        const { error: partsError } = await supabase
          .from('engine_template_parts')
          .insert(partsToInsert);

        if (partsError) {
          console.error('Erro ao atualizar peças do template:', partsError);
          throw new Error('Erro ao atualizar peças do template');
        }
      }
    }

    if (templateData.services) {
      await supabase.from('engine_template_services').delete().eq('template_id', templateId);

      if (templateData.services.length > 0) {
        const servicesToInsert = templateData.services.map((service, index) => ({
          template_id: templateId,
          service_id: service.service_id,
          quantity: service.quantity,
          notes: service.notes,
          display_order: index,
        }));

        const { error: servicesError } = await supabase
          .from('engine_template_services')
          .insert(servicesToInsert);

        if (servicesError) {
          console.error('Erro ao atualizar serviços do template:', servicesError);
          throw new Error('Erro ao atualizar serviços do template');
        }
      }
    }

    return this.getTemplateById(templateId, orgId) as Promise<EngineTemplate>;
  }

  static async deleteTemplate(templateId: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('engine_templates')
      .delete()
      .eq('id', templateId)
      .eq('org_id', orgId);

    if (error) {
      console.error('Erro ao deletar template:', error);
      throw new Error('Erro ao deletar template');
    }
  }

  static async duplicateTemplate(
    templateId: string,
    orgId: string,
    userId: string,
    newName: string,
    newBrand: string,
    newModel: string
  ): Promise<EngineTemplate> {
    const originalTemplate = await this.getTemplateById(templateId, orgId);

    if (!originalTemplate) {
      throw new Error('Template original não encontrado');
    }

    const newTemplateData: CreateTemplateData = {
      name: newName,
      description: originalTemplate.description || undefined,
      labor_cost: originalTemplate.labor_cost ?? 0,
      engine_brand: newBrand,
      engine_model: newModel,
      engine_type_id: originalTemplate.engine_type_id || undefined,
      parts:
        originalTemplate.parts?.map((p) => ({
          part_id: p.part_id,
          quantity: p.quantity,
          notes: p.notes || undefined,
        })) || [],
      services:
        originalTemplate.services?.map((s) => ({
          service_id: s.service_id,
          quantity: s.quantity,
          notes: s.notes || undefined,
        })) || [],
    };

    return this.createTemplate(orgId, userId, newTemplateData);
  }
}
