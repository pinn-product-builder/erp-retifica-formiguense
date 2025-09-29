import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

// Tipos para o sistema de perfis
export interface UserSector {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface SystemPage {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  route_path: string;
  module?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  description?: string;
  sector_id?: string;
  org_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sector?: UserSector;
}

export interface ProfilePagePermission {
  id: string;
  profile_id: string;
  page_id: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
  page?: SystemPage;
}

export interface UserProfileAssignment {
  id: string;
  user_id: string;
  profile_id: string;
  org_id: string;
  assigned_by?: string;
  assigned_at: string;
  is_active: boolean;
  profile?: UserProfile;
}

export interface CreateUserProfileData {
  name: string;
  description?: string;
  sector_id?: string;
  page_permissions: Array<{
    page_id: string;
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
  }>;
}

export interface CreateSectorData {
  name: string;
  description?: string;
  color: string;
}

// Interface para contornar limitações do TypeScript com tabelas não tipadas
interface ExtendedSupabaseClient {
  from: (table: string) => {
    select: (columns: string) => any;
    insert: (data: any) => any;
    update: (data: any) => any;
    delete: () => any;
    eq: (column: string, value: any) => any;
    in: (column: string, values: any[]) => any;
  };
}

export const useUserProfiles = () => {
  const [sectors, setSectors] = useState<UserSector[]>([]);
  const [systemPages, setSystemPages] = useState<SystemPage[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [profileAssignments, setProfileAssignments] = useState<UserProfileAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  const { currentOrganization, userRole } = useOrganization();
  const { toast } = useToast();

  // Buscar setores da organização
  const fetchSectors = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_sectors')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('is_active', true);

      if (error) throw error;
      setSectors((data as UserSector[]) || []);
    } catch (error) {
      console.warn('Error fetching sectors:', error);
      setSectors([]);
    }
  }, [currentOrganization?.id]);

  // Buscar páginas do sistema
  const fetchSystemPages = useCallback(async () => {
    try {
      const { data, error } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('system_pages')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setSystemPages((data as SystemPage[]) || []);
    } catch (error) {
      console.warn('Error fetching system pages:', error);
      setSystemPages([]);
    }
  }, []);

  // Buscar perfis da organização
  const fetchProfiles = useCallback(async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const { data, error } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_profiles')
        .select(`
          *,
          sector:user_sectors(*)
        `)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;
      setProfiles((data as UserProfile[]) || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar perfis de usuário',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  // Buscar permissões de um perfil
  const fetchProfilePermissions = useCallback(async (profileId: string): Promise<ProfilePagePermission[]> => {
    try {
      const { data, error } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('profile_page_permissions')
        .select(`
          *,
          page:system_pages(*)
        `)
        .eq('profile_id', profileId);

      if (error) throw error;
      return (data as ProfilePagePermission[]) || [];
    } catch (error) {
      console.error('Error fetching profile permissions:', error);
      return [];
    }
  }, []);

  // Criar setor
  const createSector = async (sectorData: CreateSectorData): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    // Validações
    if (!sectorData.name?.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do setor é obrigatório',
        variant: 'destructive',
      });
      return false;
    }

    if (sectorData.name.trim().length < 2) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do setor deve ter pelo menos 2 caracteres',
        variant: 'destructive',
      });
      return false;
    }

    if (sectorData.name.trim().length > 100) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do setor deve ter no máximo 100 caracteres',
        variant: 'destructive',
      });
      return false;
    }

    // Verificar se já existe um setor com o mesmo nome na organização
    const existingSector = sectors.find(sector => 
      sector.name.toLowerCase().trim() === sectorData.name.toLowerCase().trim()
    );
    
    if (existingSector) {
      toast({
        title: 'Erro de validação',
        description: 'Já existe um setor com este nome na organização',
        variant: 'destructive',
      });
      return false;
    }

    setCreateLoading(true);
    try {
      const { error } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_sectors')
        .insert({
          name: sectorData.name.trim(),
          description: sectorData.description?.trim() || null,
          color: sectorData.color,
          org_id: currentOrganization.id,
        });

      if (error) throw error;

      toast({
        title: 'Setor criado',
        description: `Setor "${sectorData.name}" foi criado com sucesso`,
      });

      await fetchSectors();
      return true;
    } catch (error: unknown) {
      console.error('Error creating sector:', error);
      
      let errorMessage = 'Falha ao criar setor';
      
      if (error instanceof Error) {
        if (error.message.includes('Já existe um setor com este nome')) {
          errorMessage = 'Já existe um setor com este nome na organização';
        } else if (error.message.includes('unique_violation')) {
          errorMessage = 'Já existe um setor com este nome na organização';
        } else if (error.message.includes('check_sector_name_not_empty')) {
          errorMessage = 'O nome do setor é obrigatório';
        } else if (error.message.includes('check_sector_name_length')) {
          errorMessage = 'O nome do setor deve ter entre 2 e 100 caracteres';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erro ao criar setor',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  // Criar perfil
  const createProfile = async (profileData: CreateUserProfileData): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    // Validações
    if (!profileData.name?.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do perfil é obrigatório',
        variant: 'destructive',
      });
      return false;
    }

    if (profileData.name.trim().length < 2) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do perfil deve ter pelo menos 2 caracteres',
        variant: 'destructive',
      });
      return false;
    }

    if (profileData.name.trim().length > 100) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do perfil deve ter no máximo 100 caracteres',
        variant: 'destructive',
      });
      return false;
    }

    if (!profileData.sector_id?.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O setor é obrigatório para o perfil',
        variant: 'destructive',
      });
      return false;
    }

    // Verificar se o setor existe
    const sectorExists = sectors.find(sector => sector.id === profileData.sector_id);
    if (!sectorExists) {
      toast({
        title: 'Erro de validação',
        description: 'O setor selecionado não existe',
        variant: 'destructive',
      });
      return false;
    }

    // Verificar se já existe um perfil com o mesmo nome na organização
    const existingProfile = profiles.find(profile => 
      profile.name.toLowerCase().trim() === profileData.name.toLowerCase().trim()
    );
    
    if (existingProfile) {
      toast({
        title: 'Erro de validação',
        description: 'Já existe um perfil com este nome na organização',
        variant: 'destructive',
      });
      return false;
    }

    setCreateLoading(true);
    try {
      // Criar o perfil
      const { data: profileResult, error: profileError } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_profiles')
        .insert({
          name: profileData.name.trim(),
          description: profileData.description?.trim() || null,
          sector_id: profileData.sector_id,
          org_id: currentOrganization.id,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      const newProfile = profileResult as UserProfile;

      // Criar permissões de páginas
      if (profileData.page_permissions.length > 0) {
        const permissions = profileData.page_permissions.map(perm => ({
          ...perm,
          profile_id: newProfile.id,
        }));

        const { error: permissionsError } = await (supabase as unknown as ExtendedSupabaseClient)
          .from('profile_page_permissions')
          .insert(permissions);

        if (permissionsError) throw permissionsError;
      }

      toast({
        title: 'Perfil criado',
        description: `Perfil "${profileData.name}" foi criado com sucesso`,
      });

      await fetchProfiles();
      return true;
    } catch (error: unknown) {
      console.error('Error creating profile:', error);
      
      let errorMessage = 'Falha ao criar perfil';
      
      if (error instanceof Error) {
        if (error.message.includes('Já existe um perfil com este nome')) {
          errorMessage = 'Já existe um perfil com este nome na organização';
        } else if (error.message.includes('unique_violation')) {
          errorMessage = 'Já existe um perfil com este nome na organização';
        } else if (error.message.includes('check_profile_name_not_empty')) {
          errorMessage = 'O nome do perfil é obrigatório';
        } else if (error.message.includes('check_profile_name_length')) {
          errorMessage = 'O nome do perfil deve ter entre 2 e 100 caracteres';
        } else if (error.message.includes('foreign_key_violation')) {
          errorMessage = 'O setor selecionado não existe ou não está ativo';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erro ao criar perfil',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  // Atribuir perfil a usuário
  const assignProfileToUser = async (userId: string, profileId: string): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      const { error } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_profile_assignments')
        .insert({
          user_id: userId,
          profile_id: profileId,
          org_id: currentOrganization.id,
        });

      if (error) throw error;

      toast({
        title: 'Perfil atribuído',
        description: 'Perfil foi atribuído ao usuário com sucesso',
      });

      return true;
    } catch (error: unknown) {
      console.error('Error assigning profile:', error);
      toast({
        title: 'Erro ao atribuir perfil',
        description: error instanceof Error ? error.message : 'Falha ao atribuir perfil',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Atualizar perfil
  const updateProfile = async (profileId: string, profileData: Partial<CreateUserProfileData>): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    // Validações básicas
    if (profileData.name && !profileData.name.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do perfil é obrigatório',
        variant: 'destructive',
      });
      return false;
    }

    if (profileData.name && profileData.name.trim().length < 2) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do perfil deve ter pelo menos 2 caracteres',
        variant: 'destructive',
      });
      return false;
    }

    if (profileData.name && profileData.name.trim().length > 100) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do perfil deve ter no máximo 100 caracteres',
        variant: 'destructive',
      });
      return false;
    }

    // Verificar se já existe um perfil com o mesmo nome (exceto o atual)
    if (profileData.name) {
      const existingProfile = profiles.find(profile => 
        profile.id !== profileId &&
        profile.name.toLowerCase().trim() === profileData.name!.toLowerCase().trim()
      );
      
      if (existingProfile) {
        toast({
          title: 'Erro de validação',
          description: 'Já existe um perfil com este nome na organização',
          variant: 'destructive',
        });
        return false;
      }
    }

    setCreateLoading(true);
    try {
      // Atualizar o perfil
      const updateData: any = {};
      if (profileData.name) updateData.name = profileData.name.trim();
      if (profileData.description !== undefined) updateData.description = profileData.description?.trim() || null;
      if (profileData.sector_id) updateData.sector_id = profileData.sector_id;

      const { error: profileError } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_profiles')
        .update(updateData)
        .eq('id', profileId)
        .eq('org_id', currentOrganization.id);

      if (profileError) throw profileError;

      // Atualizar permissões se fornecidas
      if (profileData.page_permissions) {
        // Remover permissões existentes
        const { error: deleteError } = await (supabase as unknown as ExtendedSupabaseClient)
          .from('profile_page_permissions')
          .delete()
          .eq('profile_id', profileId);

        if (deleteError) throw deleteError;

        // Inserir novas permissões
        if (profileData.page_permissions.length > 0) {
          const permissions = profileData.page_permissions.map(perm => ({
            ...perm,
            profile_id: profileId,
          }));

          const { error: permissionsError } = await (supabase as unknown as ExtendedSupabaseClient)
            .from('profile_page_permissions')
            .insert(permissions);

          if (permissionsError) throw permissionsError;
        }
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Perfil foi atualizado com sucesso',
      });

      await fetchProfiles();
      return true;
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      
      let errorMessage = 'Falha ao atualizar perfil';
      
      if (error instanceof Error) {
        if (error.message.includes('unique_violation')) {
          errorMessage = 'Já existe um perfil com este nome na organização';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erro ao atualizar perfil',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  // Deletar perfil
  const deleteProfile = async (profileId: string): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    setCreateLoading(true);
    try {
      // Verificar se o perfil tem usuários atribuídos
      const { data: assignments, error: checkError } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_profile_assignments')
        .select('id')
        .eq('profile_id', profileId)
        .eq('is_active', true);

      if (checkError) throw checkError;

      if (assignments && assignments.length > 0) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este perfil possui usuários atribuídos. Remova os usuários primeiro.',
          variant: 'destructive',
        });
        return false;
      }

      // Deletar permissões do perfil
      const { error: permissionsError } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('profile_page_permissions')
        .delete()
        .eq('profile_id', profileId);

      if (permissionsError) throw permissionsError;

      // Deletar o perfil
      const { error: profileError } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_profiles')
        .delete()
        .eq('id', profileId)
        .eq('org_id', currentOrganization.id);

      if (profileError) throw profileError;

      toast({
        title: 'Perfil excluído',
        description: 'Perfil foi excluído com sucesso',
      });

      await fetchProfiles();
      return true;
    } catch (error: unknown) {
      console.error('Error deleting profile:', error);
      
      toast({
        title: 'Erro ao excluir perfil',
        description: error instanceof Error ? error.message : 'Falha ao excluir perfil',
        variant: 'destructive',
      });
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  // Alternar status do perfil
  const toggleProfileStatus = async (profileId: string, currentStatus: boolean): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      const { error } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', profileId)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Perfil foi ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`,
      });

      await fetchProfiles();
      return true;
    } catch (error: unknown) {
      console.error('Error toggling profile status:', error);
      
      toast({
        title: 'Erro ao alterar status',
        description: error instanceof Error ? error.message : 'Falha ao alterar status do perfil',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Atualizar setor
  const updateSector = async (sectorId: string, sectorData: Partial<CreateSectorData>): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    // Validações básicas
    if (sectorData.name && !sectorData.name.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do setor é obrigatório',
        variant: 'destructive',
      });
      return false;
    }

    if (sectorData.name && sectorData.name.trim().length < 2) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do setor deve ter pelo menos 2 caracteres',
        variant: 'destructive',
      });
      return false;
    }

    if (sectorData.name && sectorData.name.trim().length > 100) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do setor deve ter no máximo 100 caracteres',
        variant: 'destructive',
      });
      return false;
    }

    // Verificar se já existe um setor com o mesmo nome (exceto o atual)
    if (sectorData.name) {
      const existingSector = sectors.find(sector => 
        sector.id !== sectorId &&
        sector.name.toLowerCase().trim() === sectorData.name!.toLowerCase().trim()
      );
      
      if (existingSector) {
        toast({
          title: 'Erro de validação',
          description: 'Já existe um setor com este nome na organização',
          variant: 'destructive',
        });
        return false;
      }
    }

    setCreateLoading(true);
    try {
      const updateData: any = {};
      if (sectorData.name) updateData.name = sectorData.name.trim();
      if (sectorData.description !== undefined) updateData.description = sectorData.description?.trim() || null;
      if (sectorData.color) updateData.color = sectorData.color;

      const { error } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_sectors')
        .update(updateData)
        .eq('id', sectorId)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      toast({
        title: 'Setor atualizado',
        description: 'Setor foi atualizado com sucesso',
      });

      await fetchSectors();
      return true;
    } catch (error: unknown) {
      console.error('Error updating sector:', error);
      
      let errorMessage = 'Falha ao atualizar setor';
      
      if (error instanceof Error) {
        if (error.message.includes('unique_violation')) {
          errorMessage = 'Já existe um setor com este nome na organização';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erro ao atualizar setor',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  // Deletar setor
  const deleteSector = async (sectorId: string): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    setCreateLoading(true);
    try {
      // Verificar se o setor tem perfis atribuídos
      const { data: profiles, error: checkError } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_profiles')
        .select('id')
        .eq('sector_id', sectorId)
        .eq('is_active', true);

      if (checkError) throw checkError;

      if (profiles && profiles.length > 0) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este setor possui perfis atribuídos. Remova os perfis primeiro.',
          variant: 'destructive',
        });
        return false;
      }

      // Deletar o setor
      const { error: sectorError } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_sectors')
        .delete()
        .eq('id', sectorId)
        .eq('org_id', currentOrganization.id);

      if (sectorError) throw sectorError;

      toast({
        title: 'Setor excluído',
        description: 'Setor foi excluído com sucesso',
      });

      await fetchSectors();
      return true;
    } catch (error: unknown) {
      console.error('Error deleting sector:', error);
      
      toast({
        title: 'Erro ao excluir setor',
        description: error instanceof Error ? error.message : 'Falha ao excluir setor',
        variant: 'destructive',
      });
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  // Alternar status do setor
  const toggleSectorStatus = async (sectorId: string, currentStatus: boolean): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      const { error } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_sectors')
        .update({ is_active: !currentStatus })
        .eq('id', sectorId)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Setor foi ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`,
      });

      await fetchSectors();
      return true;
    } catch (error: unknown) {
      console.error('Error toggling sector status:', error);
      
      toast({
        title: 'Erro ao alterar status',
        description: error instanceof Error ? error.message : 'Falha ao alterar status do setor',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Verificar se pode gerenciar perfis
  const canManageProfiles = (): boolean => {
    return ['owner', 'admin'].includes(userRole || '');
  };

  // Carregar dados quando a organização mudar
  useEffect(() => {
    if (currentOrganization?.id) {
      fetchSectors();
      fetchProfiles();
    }
  }, [currentOrganization?.id, fetchSectors, fetchProfiles]);

  // Carregar páginas do sistema uma vez
  useEffect(() => {
    fetchSystemPages();
  }, [fetchSystemPages]);

  return {
    // Estado
    sectors,
    systemPages,
    profiles,
    profileAssignments,
    loading,
    createLoading,

    // Ações
    fetchSectors,
    fetchSystemPages,
    fetchProfiles,
    fetchProfilePermissions,
    createSector,
    updateSector,
    deleteSector,
    toggleSectorStatus,
    createProfile,
    updateProfile,
    deleteProfile,
    toggleProfileStatus,
    assignProfileToUser,

    // Verificações
    canManageProfiles,

    // Contexto
    currentOrganization,
    userRole,
  };
};
