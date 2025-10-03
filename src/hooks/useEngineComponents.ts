import { useState, useEffect, useCallback } from 'react';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

export type EngineComponent = Database['public']['Enums']['engine_component'];

interface ComponentOption {
  value: EngineComponent;
  label: string;
}

export function useEngineComponents() {
  const [components, setComponents] = useState<ComponentOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Mapeamento de componentes para labels em português
  const componentLabels: Record<string, string> = {
    'bloco': 'Bloco',
    'eixo': 'Eixo',
    'biela': 'Biela',
    'comando': 'Comando',
    'cabecote': 'Cabeçote',
    'virabrequim': 'Virabrequim',
    'pistao': 'Pistão'
  };

  // Buscar componentes da tabela engine_types
  const fetchComponents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar todos os componentes únicos da tabela engine_types
      const { data, error } = await supabase
        .from('engine_types')
        .select('required_components')
        .eq('is_active', true);

      if (error) {
        console.warn('Erro ao buscar componentes da tabela engine_types, usando valores padrão:', error);
        // Fallback: usar valores hardcoded se a consulta falhar
        const defaultComponents = [
          'bloco', 'eixo', 'biela', 'comando', 'cabecote', 'virabrequim', 'pistao'
        ] as EngineComponent[];
        
        const componentOptions = defaultComponents.map(component => ({
          value: component,
          label: componentLabels[component] || component
        }));
        
        setComponents(componentOptions);
        return;
      }

      // Extrair todos os componentes únicos dos tipos de motor
      const allComponents = new Set<EngineComponent>();
      
      (data || []).forEach((item: any) => {
        if (item.required_components && Array.isArray(item.required_components)) {
          item.required_components.forEach((component: EngineComponent) => {
            allComponents.add(component);
          });
        }
      });

      // Se não encontrou componentes na tabela, usar valores padrão
      if (allComponents.size === 0) {
        const defaultComponents = [
          'bloco', 'eixo', 'biela', 'comando', 'cabecote', 'virabrequim', 'pistao'
        ] as EngineComponent[];
        
        const componentOptions = defaultComponents.map(component => ({
          value: component,
          label: componentLabels[component] || component
        }));
        
        setComponents(componentOptions);
        return;
      }

      // Converter Set para Array e mapear para opções do select
      const componentOptions = Array.from(allComponents).map(component => ({
        value: component,
        label: componentLabels[component] || component
      }));

      setComponents(componentOptions);
    } catch (error) {
      console.error('Erro ao buscar componentes:', error);
      
      // Fallback em caso de erro
      const defaultComponents = [
        'bloco', 'eixo', 'biela', 'comando', 'cabecote', 'virabrequim', 'pistao'
      ] as EngineComponent[];
      
      const componentOptions = defaultComponents.map(component => ({
        value: component,
        label: componentLabels[component]
      }));
      
      setComponents(componentOptions);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar componentes na inicialização
  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  return {
    components,
    loading,
    refetch: fetchComponents
  };
}