import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from './useOrganization';
import { EngineService, EngineModel } from '@/services/EngineService';
import { useToast } from './use-toast';

export function useEngineModels() {
  const [engineModels, setEngineModels] = useState<EngineModel[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchEngineModels = useCallback(async (engineTypeId?: string) => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const result = await EngineService.getUniqueEngineModels({
        orgId: currentOrganization.id,
        engineTypeId,
      });

      setEngineModels(result.models);
    } catch (error) {
      console.error('Erro ao buscar modelos de motores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os modelos de motores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  useEffect(() => {
    fetchEngineModels();
  }, [fetchEngineModels]);

  const formatModelLabel = useCallback((model: EngineModel) => {
    return EngineService.formatEngineModelLabel(model);
  }, []);

  const formatModelWithCount = useCallback((model: EngineModel) => {
    return EngineService.formatEngineModelWithCount(model);
  }, []);

  const validateModel = useCallback((model: EngineModel) => {
    return EngineService.validateEngineModel(model);
  }, []);

  return {
    engineModels,
    loading,
    fetchEngineModels,
    formatModelLabel,
    formatModelWithCount,
    validateModel,
  };
}
