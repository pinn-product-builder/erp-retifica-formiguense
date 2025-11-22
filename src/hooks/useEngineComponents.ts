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
    'tampa_bloco': 'Tampa do Bloco',
    'parafusos_bloco': 'Parafusos do Bloco',
    'eixo': 'Eixo',
    'virabrequim': 'Eixo Virabrequim',
    'engrenagem_virabrequim': 'Engrenagem do Virabrequim',
    'polia_motor': 'Polia do Motor',
    'comando': 'Eixo de Comando',
    'engrenagem_comando': 'Engrenagem do Comando',
    'biela': 'Biela',
    'pistao': 'Pistão',
    'cabecote': 'Cabeçote do Motor',
    'molas_cabecote': 'Molas do Cabeçote',
    'valvulas': 'Válvulas',
    'chapeletas': 'Chapeletas',
    'alca_icamento': 'Alça de Içamento',
    'tampa_valvulas': 'Tampa de Válvulas',
    'tampa_oleo': 'Tampa de Óleo',
    'balancim': 'Balancim',
    'tucho': 'Tucho',
    'vareta_valvula': 'Vareta de Válvula',
    'volante_motor': 'Volante do Motor',
    'prensa_motor': 'Prensa do Motor',
    'disco_embreagem': 'Disco de Embreagem',
    'carcaca_embreagem': 'Carcaça/Lata de Embreagem',
    'rolamento_embreagem': 'Rolamento de Embreagem',
    'suporte_motor': 'Suporte do Motor',
    'suporte_alternador': 'Suporte do Alternador',
    'suporte_bomba_hidraulica': 'Suporte da Bomba Hidráulica',
    'alternador': 'Alternador',
    'motor_arranque': 'Motor de Arranque',
    'bomba_hidraulica': 'Bomba Hidráulica',
    'radiador_oleo': 'Radiador de óleo/Trocador de Calor',
    'filtro_lubrificante': 'Filtro Lubrificante',
    'correia': 'Correia',
    'tensor_correia': 'Tensor(es) da Correia',
    'bomba_oleo': 'Bomba de Óleo',
    'pescador_bomba_oleo': 'Pescador da Bomba de Óleo',
    'carter': 'Cárter',
    'coletor_admissao': 'Coletor de Admissão',
    'coletor_escape': 'Coletor de Escape',
    'flauta': 'Flauta',
    'bicos_injetores': 'Bicos Injetores',
    'respiro_motor': 'Respiro do Motor',
    'mangueira': 'Mangueira',
    'bomba_agua': 'Bomba d\'água',
    'polia_bomba_agua': 'Polia da Bomba d\'água',
    'cachimbo_agua': 'Cachimbo d\'água',
    'cano_agua': 'Cano d\'água',
    'velas_ignicao': 'Velas de Ignição',
    'cano': 'Cano',
    'vareta_nivel_oleo': 'Vareta do Nível de Óleo',
    'correia_acessorios': 'Correia de Acessórios',
    'esticador_correia_acessorios': 'Esticador da Correia de Acessórios',
    'tensor_esticador': 'Tensor com Esticador',
    'sensores': 'Sensores',
    'sensor_temperatura': 'Sensor de Temperatura',
    'sensor_oleo': 'Sensor de Óleo',
    'sensor_rotacao': 'Sensor de Rotação',
    'sensor_admissao': 'Sensor de Admissão',
    'sensor_fase': 'Sensor de Fase',
    'sensor_detonacao': 'Sensor de Detonação',
    'sonda_lambda': 'Sonda Lâmbda (descarga)',
    'corrente_distribuicao': 'Corrente de Distribuição + Tensor',
    'bobinas_ignicao': 'Bobinas de Ignição',
    'cabos_velas': 'Cabos de Velas',
    'bomba_gasolina': 'Bomba de Gasolina',
    'corpo_borboleta': 'Corpo de Borboleta',
    'carburador': 'Carburador',
    'protecao': 'Proteção',
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
    'bloco', 'tampa_bloco', 'parafusos_bloco', 'eixo', 'virabrequim', 'engrenagem_virabrequim',
    'polia_motor', 'comando', 'engrenagem_comando', 'biela', 'pistao', 'cabecote',
    'molas_cabecote', 'valvulas', 'chapeletas', 'alca_icamento', 'tampa_valvulas',
    'tampa_oleo', 'balancim', 'tucho', 'vareta_valvula', 'volante_motor', 'prensa_motor',
    'disco_embreagem', 'carcaca_embreagem', 'rolamento_embreagem', 'suporte_motor',
    'suporte_alternador', 'suporte_bomba_hidraulica', 'alternador', 'motor_arranque',
    'bomba_hidraulica', 'radiador_oleo', 'filtro_lubrificante', 'correia', 'tensor_correia',
    'bomba_oleo', 'pescador_bomba_oleo', 'carter', 'coletor_admissao', 'coletor_escape',
    'flauta', 'bicos_injetores', 'respiro_motor', 'mangueira', 'bomba_agua', 'polia_bomba_agua',
    'cachimbo_agua', 'cano_agua', 'velas_ignicao', 'cano', 'vareta_nivel_oleo',
    'correia_acessorios', 'esticador_correia_acessorios', 'tensor_esticador', 'sensores',
    'sensor_temperatura', 'sensor_oleo', 'sensor_rotacao', 'sensor_admissao', 'sensor_fase',
    'sensor_detonacao', 'sonda_lambda', 'corrente_distribuicao', 'bobinas_ignicao',
    'cabos_velas', 'bomba_gasolina', 'corpo_borboleta', 'carburador', 'protecao',
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