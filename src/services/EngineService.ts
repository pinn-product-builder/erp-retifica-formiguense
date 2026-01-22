import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Engine = Database['public']['Tables']['engines']['Row'];

export interface EngineModel {
  brand: string;
  model: string;
  fuel_type: string;
  engine_type_id: string | null;
  count: number;
}

export interface EngineModelSearchParams {
  orgId: string;
  engineTypeId?: string;
}

export interface EngineModelSearchResult {
  models: EngineModel[];
  totalCount: number;
}

export class EngineService {
  static async getUniqueEngineModels(
    params: EngineModelSearchParams
  ): Promise<EngineModelSearchResult> {
    const { orgId, engineTypeId } = params;

    try {
      let query = supabase
        .from('engines')
        .select('brand, model, fuel_type, engine_type_id')
        .eq('org_id', orgId)
        .not('brand', 'is', null)
        .not('model', 'is', null)
        .order('brand')
        .order('model');

      if (engineTypeId) {
        query = query.eq('engine_type_id', engineTypeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar modelos de motores:', error);
        throw new Error(`Erro ao buscar modelos de motores: ${error.message}`);
      }

      const uniqueModels = this.aggregateEngineModels(data || []);

      return {
        models: uniqueModels,
        totalCount: uniqueModels.length,
      };
    } catch (error) {
      console.error('Erro no EngineService.getUniqueEngineModels:', error);
      throw error;
    }
  }

  private static aggregateEngineModels(
    engines: Pick<Engine, 'brand' | 'model' | 'fuel_type' | 'engine_type_id'>[]
  ): EngineModel[] {
    const modelMap = new Map<string, EngineModel>();

    engines.forEach((engine) => {
      const key = `${engine.brand}|${engine.model}|${engine.fuel_type}|${engine.engine_type_id || 'null'}`;

      if (modelMap.has(key)) {
        const existing = modelMap.get(key)!;
        existing.count += 1;
      } else {
        modelMap.set(key, {
          brand: engine.brand,
          model: engine.model,
          fuel_type: engine.fuel_type,
          engine_type_id: engine.engine_type_id,
          count: 1,
        });
      }
    });

    return Array.from(modelMap.values()).sort((a, b) => {
      const brandCompare = a.brand.localeCompare(b.brand);
      if (brandCompare !== 0) return brandCompare;
      return a.model.localeCompare(b.model);
    });
  }

  static async getEngineById(engineId: string, orgId: string): Promise<Engine | null> {
    try {
      const { data, error } = await supabase
        .from('engines')
        .select('*')
        .eq('id', engineId)
        .eq('org_id', orgId)
        .single();

      if (error) {
        console.error('Erro ao buscar motor:', error);
        throw new Error(`Erro ao buscar motor: ${error.message}`);
      }

      return data as Engine;
    } catch (error) {
      console.error('Erro no EngineService.getEngineById:', error);
      return null;
    }
  }

  static async searchEngines(
    orgId: string,
    searchTerm: string,
    limit: number = 10
  ): Promise<Engine[]> {
    try {
      const { data, error } = await supabase
        .from('engines')
        .select('*')
        .eq('org_id', orgId)
        .or(
          `brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%`
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar motores:', error);
        throw new Error(`Erro ao buscar motores: ${error.message}`);
      }

      return (data as Engine[]) || [];
    } catch (error) {
      console.error('Erro no EngineService.searchEngines:', error);
      return [];
    }
  }

  static validateEngineModel(model: EngineModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!model.brand || model.brand.trim().length === 0) {
      errors.push('Marca é obrigatória');
    }

    if (!model.model || model.model.trim().length === 0) {
      errors.push('Modelo é obrigatório');
    }

    if (!model.fuel_type || model.fuel_type.trim().length === 0) {
      errors.push('Tipo de combustível é obrigatório');
    }

    const validFuelTypes = ['gasolina', 'etanol', 'flex', 'diesel', 'gnv'];
    if (model.fuel_type && !validFuelTypes.includes(model.fuel_type.toLowerCase())) {
      errors.push('Tipo de combustível inválido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static formatEngineModelLabel(model: EngineModel): string {
    return `${model.brand} - ${model.model} (${model.fuel_type})`;
  }

  static formatEngineModelWithCount(model: EngineModel): string {
    return `${this.formatEngineModelLabel(model)} | Usado ${model.count}x`;
  }
}
