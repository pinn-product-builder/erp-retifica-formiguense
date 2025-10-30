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
    'bloco': 'Bloco do Motor',
    'eixo': 'Eixo',
    'biela': 'Biela',
    'comando': 'Comando',
    'cabecote': 'Cabeçote',
    'virabrequim': 'Virabrequim',
    'pistao': 'Pistão',
    'pistao_com_anel': 'Pistão c/anel',
    'anel': 'Anel',
    'camisas': 'Camisas',
    'bucha_comando': 'Bucha Comando',
    'retentores_dianteiro': 'Retentores Dianteiro',
    'retentores_traseiro': 'Retentores Traseiro',
    'pista_virabrequim': 'Pista Virabrequim',
    'selo_comando': 'Selo do Comando',
    'gaxeta': 'Gaxeta',
    'selo_dagua': 'Selo D\'agua',
    'borrachas_camisa': 'Borrachas de Camisa',
    'calco_camisas': 'Calço das camisas',
    'bujao_carter': 'Bujão do Cárter',
    'tubo_bloco': 'Tubo do Bloco'
  };

  // Lista completa padrão (usada sempre como base)
  const defaultComponentsFull = [
    'bloco', 'eixo', 'biela', 'comando', 'cabecote', 'virabrequim', 'pistao',
    'pistao_com_anel', 'anel', 'camisas', 'bucha_comando', 'retentores_dianteiro',
    'retentores_traseiro', 'pista_virabrequim', 'selo_comando', 'gaxeta', 'selo_dagua',
    'borrachas_camisa', 'calco_camisas', 'bujao_carter', 'tubo_bloco'
  ] as EngineComponent[];

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
        // Fallback: usar lista completa padrão
        const componentOptions = defaultComponentsFull.map(component => ({
          value: component,
          label: componentLabels[component] || component
        }));
        
        setComponents(componentOptions);
        return;
      }

      // Extrair todos os componentes únicos dos tipos de motor + sempre incluir os padrões
      const allComponents = new Set<EngineComponent>(defaultComponentsFull);
      
      (data || []).forEach((item: any) => {
        if (item.required_components && Array.isArray(item.required_components)) {
          item.required_components.forEach((component: EngineComponent) => {
            allComponents.add(component);
          });
        }
      });

      // Converter Set para Array e mapear para opções do select
      const componentOptions = Array.from(allComponents).map(component => ({
        value: component,
        label: componentLabels[component] || component
      }));

      setComponents(componentOptions);
    } catch (error) {
      console.error('Erro ao buscar componentes:', error);
      
      // Fallback em caso de erro: lista mínima mas funcional
      const componentOptions = defaultComponentsFull.map(component => ({
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