import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import {
  EngineTemplateService,
  EngineTemplate,
  CreateTemplateData,
  TemplateFilters,
} from '@/services/EngineTemplateService';
import { toast } from 'sonner';

interface UseEngineTemplatesParams {
  page?: number;
  pageSize?: number;
  filters?: TemplateFilters;
}

export function useEngineTemplates(params?: UseEngineTemplatesParams) {
  const { currentOrganization } = useOrganization();
  const { page = 1, pageSize = 10, filters } = params || {};

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['engine-templates', currentOrganization?.id, page, pageSize, filters],
    queryFn: async () => {
      if (!currentOrganization?.id)
        return { data: [], count: 0, page: 1, pageSize: 10, totalPages: 0 };
      return EngineTemplateService.getTemplates(
        currentOrganization.id,
        page,
        pageSize,
        filters
      );
    },
    enabled: !!currentOrganization?.id,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5,
  });

  return {
    templates: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    refetch,
  };
}

export function useUsedEngineTypeIds() {
  const { currentOrganization } = useOrganization();

  const { data, isLoading } = useQuery({
    queryKey: ['engine-templates-used-type-ids', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      return EngineTemplateService.getUsedEngineTypeIds(currentOrganization.id);
    },
    enabled: !!currentOrganization?.id,
    staleTime: 1000 * 60 * 2,
  });

  const usedSet = new Set(data || []);
  return { usedEngineTypeIds: data || [], usedSet, isLoading };
}

export function useEngineTemplate(templateId: string | null) {
  const { currentOrganization } = useOrganization();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['engine-template', templateId, currentOrganization?.id],
    queryFn: async () => {
      if (!templateId || !currentOrganization?.id) return null;
      return EngineTemplateService.getTemplateById(templateId, currentOrganization.id);
    },
    enabled: !!templateId && !!currentOrganization?.id,
    staleTime: 1000 * 60 * 5,
  });

  return {
    template: data,
    isLoading,
    error,
    refetch,
  };
}

export function useEngineTemplateByEngineType(engineTypeId?: string | null) {
  const { currentOrganization } = useOrganization();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'engine-template-by-engine-type',
      currentOrganization?.id,
      engineTypeId,
    ],
    queryFn: async () => {
      if (!currentOrganization?.id || !engineTypeId) return null;
      return EngineTemplateService.getTemplateByEngineType(
        currentOrganization.id,
        engineTypeId
      );
    },
    enabled: !!currentOrganization?.id && !!engineTypeId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    template: data,
    isLoading,
    error,
    refetch,
  };
}

export function useCreateEngineTemplate() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: CreateTemplateData) => {
      if (!currentOrganization?.id || !user?.id) {
        throw new Error('Organização ou usuário não encontrado');
      }
      return EngineTemplateService.createTemplate(
        currentOrganization.id,
        user.id,
        templateData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engine-templates'] });
      queryClient.invalidateQueries({ queryKey: ['engine-templates-used-type-ids'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: unknown) => {
      console.error('Erro ao criar template:', error);
      const code = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : null;
      if (code === '23505') {
        toast.error('Já existe um template para este tipo de motor.');
      } else {
        toast.error('Erro ao criar template');
      }
    },
  });
}

export function useUpdateEngineTemplate() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      templateData,
    }: {
      templateId: string;
      templateData: Partial<CreateTemplateData>;
    }) => {
      if (!currentOrganization?.id) {
        throw new Error('Organização não encontrada');
      }
      return EngineTemplateService.updateTemplate(
        templateId,
        currentOrganization.id,
        templateData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engine-templates'] });
      queryClient.invalidateQueries({ queryKey: ['engine-template'] });
      queryClient.invalidateQueries({ queryKey: ['engine-templates-used-type-ids'] });
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error: unknown) => {
      console.error('Erro ao atualizar template:', error);
      const code = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : null;
      if (code === '23505') {
        toast.error('Já existe um template para este tipo de motor.');
      } else {
        toast.error('Erro ao atualizar template');
      }
    },
  });
}

export function useDeleteEngineTemplate() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      if (!currentOrganization?.id) {
        throw new Error('Organização não encontrada');
      }
      return EngineTemplateService.deleteTemplate(templateId, currentOrganization.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engine-templates'] });
      queryClient.invalidateQueries({ queryKey: ['engine-templates-used-type-ids'] });
      toast.success('Template excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    },
  });
}

export function useDuplicateEngineTemplate() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      newName,
      newEngineTypeId,
    }: {
      templateId: string;
      newName: string;
      newEngineTypeId: string;
    }) => {
      if (!currentOrganization?.id || !user?.id) {
        throw new Error('Organização ou usuário não encontrado');
      }
      return EngineTemplateService.duplicateTemplate(
        templateId,
        currentOrganization.id,
        user.id,
        newName,
        newEngineTypeId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engine-templates'] });
      queryClient.invalidateQueries({ queryKey: ['engine-templates-used-type-ids'] });
      toast.success('Template duplicado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao duplicar template:', error);
      toast.error('Erro ao duplicar template');
    },
  });
}
