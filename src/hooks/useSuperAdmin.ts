import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SuperAdminInfo {
  isSuperAdmin: boolean;
  loading: boolean;
}

export const useSuperAdmin = (): SuperAdminInfo => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_super_admin');
        
        if (error) {
          console.error('Error checking super admin status:', error);
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(data || false);
        }
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkSuperAdminStatus();
  }, [user]);

  return { isSuperAdmin, loading };
};

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'super_admin' | 'owner' | 'admin' | 'manager' | 'user';
  invited_at?: string;
  joined_at?: string;
  invited_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  organization_users?: OrganizationUser[];
}

export const useSuperAdminActions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const promoteToSuperAdmin = async (userId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      // Verificar se é super admin
      const { data: superAdminCheck, error: checkError } = await supabase
        .rpc('is_super_admin');

      if (checkError || !superAdminCheck) {
        toast.error('Apenas super administradores podem promover usuários');
        return false;
      }

      // Promover usuário a super admin
      const { error } = await supabase
        .rpc('promote_user_to_super_admin', { user_id: userId });

      if (error) {
        toast.error('Erro ao promover usuário: ' + error.message);
        return false;
      }

      toast.success('Usuário promovido a super administrador');
      return true;
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error('Erro inesperado ao promover usuário');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const revokeSupeAdmin = async (userId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      // Verificar se é super admin
      const { data: superAdminCheck, error: checkError } = await supabase
        .rpc('is_super_admin');

      if (checkError || !superAdminCheck) {
        toast.error('Apenas super administradores podem revogar privilégios');
        return false;
      }

      // Revogar privilégios de super admin
      const { error } = await supabase
        .rpc('revoke_user_super_admin', { user_id: userId });

      if (error) {
        toast.error('Erro ao revogar privilégios: ' + error.message);
        return false;
      }

      toast.success('Privilégios de super administrador revogados');
      return true;
    } catch (error) {
      console.error('Error revoking super admin:', error);
      toast.error('Erro inesperado ao revogar privilégios');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAllOrganizations = useCallback(async (includeInactive: boolean = false) => {
    if (!user) return [];

    try {
      // Verificar se é super admin
      const { data: superAdminCheck, error: checkError } = await supabase
        .rpc('is_super_admin');

      if (checkError || !superAdminCheck) {
        toast.error('Apenas super administradores podem visualizar todas as organizações');
        return [];
      }

      // Buscar organizações com filtro de status
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Erro ao buscar organizações: ' + error.message);
        return [];
      }

      // Filtrar organizações por status se necessário
      const filteredOrganizations = includeInactive 
        ? organizations 
        : organizations?.filter(org => (org as any).is_active === true) || [];

      // Buscar todos os usuários das organizações de uma vez (OTIMIZAÇÃO)
      const orgIds = filteredOrganizations?.map(org => org.id) || [];
      let allOrgUsers: Array<{id: string, organization_id: string, user_id: string, role: string}> = [];
      let allUserProfiles: Array<{user_id: string, name: string}> = [];

      if (orgIds.length > 0) {
        // Buscar todos os organization_users de uma vez
        const { data: orgUsersData } = await supabase
          .from('organization_users')
          .select('id, organization_id, user_id, role')
          .in('organization_id', orgIds)
          .eq('is_active', true);

        allOrgUsers = orgUsersData || [];

        // Buscar todos os user_basic_info de uma vez
        const userIds = allOrgUsers.map(ou => ou.user_id);
        if (userIds.length > 0) {
          const { data: userProfilesData } = await supabase
            .from('user_basic_info')
            .select('user_id, name')
            .in('user_id', userIds);

          allUserProfiles = userProfilesData || [];
        }
      }

      // Agrupar usuários por organização
      const orgsWithUsers = (filteredOrganizations || []).map(org => {
        const orgUsers = allOrgUsers.filter(ou => ou.organization_id === org.id);
        
        const usersWithProfiles = orgUsers.map(orgUser => {
          const userProfile = allUserProfiles.find(up => up.user_id === orgUser.user_id);
          
          return {
            ...orgUser,
            profiles: userProfile ? { name: userProfile.name || 'Nome não disponível' } : null
          };
        });

        return {
          ...org,
          organization_users: usersWithProfiles
        };
      });

      return orgsWithUsers;
    } catch (error) {
      console.error('Error fetching all organizations:', error);
      toast.error('Erro inesperado ao buscar organizações');
      return [];
    }
  }, [user]);

  const createOrganization = async (organizationData: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      // Verificar se é super admin
      const { data: superAdminCheck, error: checkError } = await supabase
        .rpc('is_super_admin');

      if (checkError || !superAdminCheck) {
        toast.error('Apenas super administradores podem criar organizações');
        return false;
      }

      // Criar organização
      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert([{
          ...organizationData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar organização: ' + error.message);
        return false;
      }

      // Vincular o super admin como owner da organização
      const { error: orgUserError } = await supabase
        .from('organization_users')
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'owner',
          is_active: true
        });

      if (orgUserError) {
        toast.error('Erro ao vincular usuário à organização: ' + orgUserError.message);
        return false;
      }

      toast.success('Organização criada com sucesso');
      return true;
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Erro inesperado ao criar organização');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = async (organizationId: string, organizationData: {
    name?: string;
    slug?: string;
    description?: string;
  }): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      // Verificar se é super admin
      const { data: superAdminCheck, error: checkError } = await supabase
        .rpc('is_super_admin');

      if (checkError || !superAdminCheck) {
        toast.error('Apenas super administradores podem editar organizações');
        return false;
      }

      // Atualizar organização
      const { error } = await supabase
        .from('organizations')
        .update({
          ...organizationData,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (error) {
        toast.error('Erro ao atualizar organização: ' + error.message);
        return false;
      }

      toast.success('Organização atualizada com sucesso');
      return true;
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Erro inesperado ao atualizar organização');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reactivateOrganization = async (organizationId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      // Verificar se é super admin
      const { data: superAdminCheck, error: checkError } = await supabase
        .rpc('is_super_admin');

      if (checkError || !superAdminCheck) {
        toast.error('Apenas super administradores podem reativar organizações');
        return false;
      }

      // Reativar organização
      const { error } = await supabase
        .from('organizations')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (error) {
        toast.error('Erro ao reativar organização: ' + error.message);
        return false;
      }

      toast.success('Organização reativada com sucesso');
      return true;
    } catch (error) {
      console.error('Error reactivating organization:', error);
      toast.error('Erro inesperado ao reativar organização');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteOrganization = async (organizationId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      // Verificar se é super admin
      const { data: superAdminCheck, error: checkError } = await supabase
        .rpc('is_super_admin');

      if (checkError || !superAdminCheck) {
        toast.error('Apenas super administradores podem inativar organizações');
        return false;
      }

      // Verificar se a organização tem usuários ativos
      const { data: orgUsers, error: usersError } = await supabase
        .from('organization_users')
        .select('id, user_id, role, is_active')
        .eq('organization_id', organizationId);

      if (usersError) {
        toast.error('Erro ao verificar usuários da organização: ' + usersError.message);
        return false;
      }

      console.log('Usuários da organização:', orgUsers);
      
      const activeUsers = orgUsers?.filter(user => user.is_active === true) || [];
      
      if (activeUsers.length > 0) {
        // Inativar todos os usuários da organização primeiro
        console.log('Inativando usuários da organização antes de inativar a organização');
        
        const { error: usersUpdateError } = await supabase
          .from('organization_users')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', organizationId)
          .eq('is_active', true);

        if (usersUpdateError) {
          toast.error('Erro ao inativar usuários da organização: ' + usersUpdateError.message);
          return false;
        }

        toast.success(`${activeUsers.length} usuário(s) inativado(s) da organização`);
      }

      // Inativar organização (soft delete)
      console.log('Tentando inativar organização:', organizationId);
      
      const { data: updateResult, error } = await supabase
        .from('organizations')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)
        .select();

      console.log('Resultado da atualização:', updateResult, error);

      if (error) {
        toast.error('Erro ao inativar organização: ' + error.message);
        return false;
      }

      if (!updateResult || updateResult.length === 0) {
        toast.error('Organização não encontrada ou já foi inativada');
        return false;
      }

      toast.success('Organização inativada com sucesso');
      return true;
    } catch (error) {
      console.error('Error deactivating organization:', error);
      toast.error('Erro inesperado ao inativar organização');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    promoteToSuperAdmin,
    revokeSupeAdmin,
    getAllOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    reactivateOrganization
  };
};