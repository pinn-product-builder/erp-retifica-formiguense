import { supabase } from '@/integrations/supabase/client';

export interface EngineData {
  id: string;
  org_id: string;
  type: string;
  brand: string;
  model: string;
  fuel_type: string;
  serial_number: string | null;
  is_complete: boolean;
  assembly_state: string;
  has_block: boolean;
  has_head: boolean;
  has_crankshaft: boolean;
  has_piston: boolean;
  has_connecting_rod: boolean;
  turns_manually: boolean;
  removed_by_company: boolean | null;
  removed_by_employee_name: string | null;
  engine_type_id: string | null;
  created_at: string;
  updated_at: string;
  engine_type?: {
    id: string;
    name: string;
    category: string;
  } | null;
  orders?: Array<{
    id: string;
    order_number: string;
    status: string;
    customer?: {
      name: string;
    } | null;
  }>;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EngineFilters {
  searchTerm?: string;
  fuelType?: string;
  assemblyState?: string;
}

export interface EngineModel {
  brand: string;
  model: string;
  fuel_type: string;
  count: number;
}

export class EngineService {
  static async getUniqueEngineModels(params: {
    orgId: string;
    engineTypeId?: string;
  }): Promise<{ models: EngineModel[] }> {
    let query = supabase
      .from('engines')
      .select('brand, model, fuel_type')
      .eq('org_id', params.orgId);

    if (params.engineTypeId) {
      query = query.eq('engine_type_id', params.engineTypeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar modelos de motores:', error);
      throw new Error('Erro ao buscar modelos de motores');
    }

    const map = new Map<string, EngineModel>();

    (data || []).forEach((row) => {
      const brand = row.brand || '';
      const model = row.model || '';
      const fuelType = row.fuel_type || '';
      const key = `${brand}__${model}__${fuelType}`;
      const existing = map.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          brand,
          model,
          fuel_type: fuelType,
          count: 1,
        });
      }
    });

    const models = Array.from(map.values()).sort((a, b) => {
      if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
      if (a.model !== b.model) return a.model.localeCompare(b.model);
      return a.fuel_type.localeCompare(b.fuel_type);
    });

    return { models };
  }

  static formatEngineModelLabel(model: EngineModel): string {
    return `${model.brand} - ${model.model} (${model.fuel_type})`;
  }

  static formatEngineModelWithCount(model: EngineModel): string {
    return `${EngineService.formatEngineModelLabel(model)} (${model.count})`;
  }

  static validateEngineModel(model: EngineModel): boolean {
    return Boolean(model.brand && model.model && model.fuel_type);
  }

  static async getEnginesByOrganization(
    orgId: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: EngineFilters
  ): Promise<PaginatedResult<EngineData>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('engines')
      .select(
        `
        *,
        engine_type:engine_types(id, name, category),
        orders(
          id,
          order_number,
          status,
          customer:customers(name)
        )
      `,
        { count: 'exact' }
      )
      .eq('org_id', orgId);

    if (filters?.searchTerm) {
      query = query.or(
        `brand.ilike.%${filters.searchTerm}%,model.ilike.%${filters.searchTerm}%,serial_number.ilike.%${filters.searchTerm}%,type.ilike.%${filters.searchTerm}%`
      );
    }

    if (filters?.fuelType && filters.fuelType !== 'todos') {
      query = query.eq('fuel_type', filters.fuelType);
    }

    if (filters?.assemblyState && filters.assemblyState !== 'todos') {
      query = query.eq('assembly_state', filters.assemblyState);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Erro ao buscar motores:', error);
      throw new Error('Erro ao buscar motores');
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return {
      data: (data || []) as unknown as EngineData[],
      count: count || 0,
      page,
      pageSize,
      totalPages,
    };
  }

  static async getEngineById(engineId: string, orgId: string): Promise<EngineData | null> {
    const { data, error } = await supabase
      .from('engines')
      .select(`
        *,
        engine_type:engine_types(id, name, category),
        orders(
          id,
          order_number,
          status,
          customer:customers(name)
        )
      `)
      .eq('id', engineId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      console.error('Erro ao buscar motor:', error);
      throw new Error('Erro ao buscar motor');
    }

    return data as unknown as EngineData;
  }

  static async getEngineStats(orgId: string) {
    const { data: allEngines, error } = await supabase
      .from('engines')
      .select('is_complete, assembly_state')
      .eq('org_id', orgId);

    if (error) {
      console.error('Erro ao buscar estatísticas de motores:', error);
      throw new Error('Erro ao buscar estatísticas de motores');
    }

    const engines = allEngines || [];

    return {
      total: engines.length,
      completos: engines.filter((e) => e.is_complete).length,
      montados: engines.filter((e) => e.assembly_state === 'montado').length,
      parciais: engines.filter((e) => e.assembly_state === 'parcialmente_montado').length,
      desmontados: engines.filter((e) => e.assembly_state === 'desmontado').length,
    };
  }
}
