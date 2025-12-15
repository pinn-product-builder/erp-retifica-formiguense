import { useEngineComponents } from './useEngineComponents';

/**
 * Hook para trabalhar com labels e cores de componentes
 */
export function useComponentHelpers() {
  const { components: engineComponents } = useEngineComponents();

  /**
   * Obtém o label legível de um componente pelo seu valor
   */
  const getComponentLabel = (componentValue: string): string => {
    const component = engineComponents.find(c => c.value === componentValue);
    return component?.label || componentValue;
  };

  return {
    getComponentLabel,
    components: engineComponents
  };
}
