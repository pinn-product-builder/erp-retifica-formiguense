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

    setCreateLoading(true);
    try {
      const { error } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_sectors')
        .insert({
          ...sectorData,
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
      toast({
        title: 'Erro ao criar setor',
        description: error instanceof Error ? error.message : 'Falha ao criar setor',
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

    setCreateLoading(true);
    try {
      // Criar o perfil
      const { data: profileResult, error: profileError } = await (supabase as unknown as ExtendedSupabaseClient)
        .from('user_profiles')
        .insert({
          name: profileData.name,
          description: profileData.description,
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
      toast({
        title: 'Erro ao criar perfil',
        description: error instanceof Error ? error.message : 'Falha ao criar perfil',
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
    createProfile,
    assignProfileToUser,

    // Verificações
    canManageProfiles,

    // Contexto
    currentOrganization,
    userRole,
  };
};
