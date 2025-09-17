import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from '@/hooks/usePermissions';

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: AppRole;
  invited_at: string | null;
  joined_at: string | null;
  invited_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Dados do usuário (via join com auth.users através de profiles)
  user?: {
    id: string;
    email: string;
    name?: string;
    created_at: string;
  };
}

export interface CreateUserData {
  email: string;
  name: string;
  role: AppRole;
}

export interface UserPermissions {
  user_id: string;
  role: AppRole;
  permissions: {
    fiscal: 'none' | 'read' | 'write' | 'admin';
    financial: 'none' | 'read' | 'write' | 'admin';
    production: 'none' | 'read' | 'write' | 'admin';
    workflow: 'none' | 'read' | 'write' | 'admin';
    orders: 'none' | 'read' | 'write' | 'admin';
    purchasing: 'none' | 'read' | 'write' | 'admin';
    inventory: 'none' | 'read' | 'write' | 'admin';
    hr: 'none' | 'read' | 'write' | 'admin';
    reports: 'none' | 'read' | 'write' | 'admin';
    admin: 'none' | 'read' | 'write' | 'admin';
  };
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const { currentOrganization, userRole } = useOrganization();
  const { toast } = useToast();

  // Buscar usuários da organização
  const fetchUsers = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      // Buscar usuários da organização com dados do perfil
      const { data, error } = await supabase
        .from('organization_users')
        .select(`
          *,
          profiles!inner(
            id,
            user_id,
            name,
            email
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar os dados para incluir informações do usuário
      const usersWithProfile = data?.map(orgUser => ({
        ...orgUser,
        user: {
          id: orgUser.profiles.user_id,
          email: orgUser.profiles.email || '',
          name: orgUser.profiles.name || '',
          created_at: orgUser.created_at
        }
      })) || [];

      setUsers(usersWithProfile);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar usuários da organização',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar usuário diretamente (sem convite)
  const createUser = async (userData: CreateUserData): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    setCreateLoading(true);
    try {
      // Verificar se o usuário já existe
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        // Verificar se já está na organização
        const { data: existingOrgUser } = await supabase
          .from('organization_users')
          .select('id')
          .eq('organization_id', currentOrganization.id)
          .eq('user_id', existingUser.user_id)
          .single();

        if (existingOrgUser) {
          toast({
            title: 'Usuário já existe',
            description: 'Este usuário já faz parte da organização',
            variant: 'destructive',
          });
          return false;
        }

        // Adicionar usuário existente à organização
        const { error: orgUserError } = await supabase
          .from('organization_users')
          .insert({
            organization_id: currentOrganization.id,
            user_id: existingUser.user_id,
            role: userData.role,
            joined_at: new Date().toISOString(),
            is_active: true
          });

        if (orgUserError) throw orgUserError;
      } else {
        // Criar novo usuário (apenas para desenvolvimento - em produção seria via convite)
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: 'temp123456', // Senha temporária
          email_confirm: true,
          user_metadata: {
            name: userData.name
          }
        });

        if (authError) throw authError;

        // O perfil será criado automaticamente pelo trigger handle_new_user
        // Vamos apenas aguardar um pouco para garantir que foi criado
        await new Promise(resolve => setTimeout(resolve, 100));

        // Adicionar à organização
        const { error: orgUserError } = await supabase
          .from('organization_users')
          .insert({
            organization_id: currentOrganization.id,
            user_id: authUser.user.id,
            role: userData.role,
            joined_at: new Date().toISOString(),
            is_active: true
          });

        if (orgUserError) throw orgUserError;
      }

      toast({
        title: 'Usuário criado',
        description: `Usuário ${userData.name} foi adicionado com role ${userData.role}`,
      });

      await fetchUsers(); // Recarregar lista
      return true;
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: error.message || 'Falha ao criar usuário',
        variant: 'destructive',
      });
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  // Atualizar role do usuário
  const updateUserRole = async (userId: string, newRole: AppRole): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      const { error } = await supabase
        .from('organization_users')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Role atualizado',
        description: `Role do usuário foi alterado para ${newRole}`,
      });

      await fetchUsers(); // Recarregar lista
      return true;
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Erro ao atualizar role',
        description: error.message || 'Falha ao atualizar role do usuário',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Ativar/desativar usuário
  const toggleUserStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      const { error } = await supabase
        .from('organization_users')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: isActive ? 'Usuário ativado' : 'Usuário desativado',
        description: `Usuário foi ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      });

      await fetchUsers(); // Recarregar lista
      return true;
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: error.message || 'Falha ao alterar status do usuário',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Remover usuário da organização
  const removeUser = async (userId: string): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      const { error } = await supabase
        .from('organization_users')
        .delete()
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Usuário removido',
        description: 'Usuário foi removido da organização',
      });

      await fetchUsers(); // Recarregar lista
      return true;
    } catch (error: any) {
      console.error('Error removing user:', error);
      toast({
        title: 'Erro ao remover usuário',
        description: error.message || 'Falha ao remover usuário',
        variant: 'destructive',
      });
      return false;
    }
  };


  // Verificar se o usuário atual pode gerenciar outros usuários
  const canManageUsers = () => {
    return ['owner', 'admin'].includes(userRole || '');
  };

  // Verificar se pode editar um usuário específico
  const canEditUser = (targetUserId: string, targetRole: AppRole) => {
    if (!canManageUsers()) return false;
    
    // Owner pode editar qualquer um
    if (userRole === 'owner') return true;
    
    // Admin pode editar todos exceto owner
    if (userRole === 'admin' && targetRole !== 'owner') return true;
    
    return false;
  };

  // Carregar usuários quando a organização mudar
  useEffect(() => {
    if (currentOrganization?.id) {
      fetchUsers();
    }
  }, [currentOrganization?.id]);

  return {
    // Estado
    users,
    loading,
    createLoading,
    
    // Ações
    fetchUsers,
    createUser,
    updateUserRole,
    toggleUserStatus,
    removeUser,
    
    // Verificações de permissão
    canManageUsers,
    canEditUser,
    
    // Dados da organização
    currentOrganization,
    userRole
  };
};
