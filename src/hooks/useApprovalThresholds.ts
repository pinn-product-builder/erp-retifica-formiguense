import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  ApprovalThresholdService,
  ApprovalThreshold,
  ThresholdFormData,
} from '@/services/ApprovalThresholdService';

export function useApprovalThresholds() {
  const { currentOrganization } = useOrganization();
  const [thresholds,  setThresholds]  = useState<ApprovalThreshold[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);

  const fetchThresholds = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setIsLoading(true);
    try {
      const data = await ApprovalThresholdService.list(currentOrganization.id);
      setThresholds(data);
    } catch {
      toast.error('Erro ao carregar faixas de aprovação');
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  const createThreshold = useCallback(async (input: ThresholdFormData): Promise<boolean> => {
    if (!currentOrganization?.id) return false;
    setIsSaving(true);
    try {
      await ApprovalThresholdService.create(currentOrganization.id, input, thresholds);
      toast.success('Faixa de aprovação criada');
      await fetchThresholds();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar faixa');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [currentOrganization?.id, thresholds, fetchThresholds]);

  const updateThreshold = useCallback(async (id: string, input: ThresholdFormData): Promise<boolean> => {
    setIsSaving(true);
    try {
      await ApprovalThresholdService.update(id, input, thresholds);
      toast.success('Faixa de aprovação atualizada');
      await fetchThresholds();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar faixa');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [thresholds, fetchThresholds]);

  const removeThreshold = useCallback(async (id: string): Promise<boolean> => {
    setIsSaving(true);
    try {
      await ApprovalThresholdService.remove(id);
      toast.success('Faixa removida');
      await fetchThresholds();
      return true;
    } catch {
      toast.error('Erro ao remover faixa');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [fetchThresholds]);

  return {
    thresholds,
    isLoading,
    isSaving,
    fetchThresholds,
    createThreshold,
    updateThreshold,
    removeThreshold,
  };
}
