import { useOrganization } from './useOrganization';
import { useToast } from './use-toast';
import { useQuery } from '@tanstack/react-query';
import { EngineService, EngineData, EngineFilters } from '@/services/EngineService';

export type Engine = EngineData;

interface UseEnginesParams {
  page?: number;
  pageSize?: number;
  filters?: EngineFilters;
}

export function useEngines(params?: UseEnginesParams) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const searchTerm = params?.filters?.searchTerm;
  const fuelType = params?.filters?.fuelType;
  const assemblyState = params?.filters?.assemblyState;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['engines', currentOrganization?.id, page, pageSize, searchTerm, fuelType, assemblyState],
    queryFn: async () => {
      if (!currentOrganization?.id) {
        return {
          data: [],
          count: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }

      try {
        return await EngineService.getEnginesByOrganization(
          currentOrganization.id,
          page,
          pageSize,
          params?.filters
        );
      } catch (error) {
        console.error('Erro ao buscar motores:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar motores',
          variant: 'destructive',
        });
        return {
          data: [],
          count: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }
    },
    enabled: !!currentOrganization?.id,
  });

  return {
    engines: data?.data || [],
    count: data?.count || 0,
    page: data?.page || page,
    pageSize: data?.pageSize || pageSize,
    totalPages: data?.totalPages || 0,
    loading: isLoading,
    refetch,
  };
}
