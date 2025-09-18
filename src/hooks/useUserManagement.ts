import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

// Interface para contornar limitações do TypeScript com tabelas não tipadas
interface ExtendedSupabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      in: (column: string, values: string[]) => Promise<{ data: unknown; error: unknown }>;
    };
    insert: (data: Record<string, unknown>) => Promise<{ error: unknown }>;
  };
}

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
  profile_id?: string;
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
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // Buscar usuários da organização
  const fetchUsers = useCallback(async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      // Buscar usuários da organização
      const { data: orgUsers, error: orgError } = await supabase
        .from('organization_users')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (orgError) throw orgError;

      // Buscar informações básicas dos usuários
      const userIds = orgUsers?.map(u => u.user_id) || [];
      let userBasicInfo: Array<{ user_id: string; email: string; name: string }> = [];
      
      if (userIds.length > 0) {
        // Tentar buscar da tabela user_basic_info (se existir)
        try {
          const { data: basicInfoData, error: basicInfoError } = await (supabase as unknown as ExtendedSupabaseClient)
            .from('user_basic_info')
            .select('user_id, email, name')
            .in('user_id', userIds);
            
            if (!basicInfoError && basicInfoData) {
              userBasicInfo = basicInfoData as Array<{ user_id: string; email: string; name: string }>;
            }
        } catch (error) {
          console.warn('user_basic_info table not available, using fallback');
        }

        // Fallback: tentar buscar da tabela profiles (temporário)
        if (userBasicInfo.length === 0) {
          try {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('user_id, name')
              .in('user_id', userIds);
              
            if (profilesData) {
              userBasicInfo = profilesData.map(p => ({
                user_id: p.user_id,
                name: p.name || 'Nome não disponível',
                email: 'Email via profiles' // Placeholder
              }));
            }
          } catch (error) {
            console.warn('Profiles table also not available');
          }
        }
      }

      // Transformar os dados para incluir informações do usuário
      const usersWithProfile = orgUsers?.map(orgUser => {
        const basicInfo = userBasicInfo.find(u => u.user_id === orgUser.user_id);
        
        return {
          ...orgUser,
          user: {
            id: orgUser.user_id,
            email: basicInfo?.email || `user_${orgUser.user_id.substring(0, 8)}@temp.com`,
            name: basicInfo?.name || 'Nome não disponível',
            created_at: orgUser.created_at
          }
        };
      }) || [];

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
  }, [currentOrganization?.id, toast]);

  // Criar usuário sem fazer login automático
  const createUser = async (userData: CreateUserData): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    setCreateLoading(true);
    try {
      // Salvar a sessão atual para restaurar depois
      const currentSession = await supabase.auth.getSession();
      
      // Gerar senha temporária padrão
      const tempPassword = 'RetificaTemp2024!';
      
      // Criar novo usuário usando signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: tempPassword,
        options: {
          emailRedirectTo: undefined, // Não enviar email de confirmação
          data: {
            name: userData.name,
            full_name: userData.name, // Garantir que o nome seja salvo
            needs_password_change: true // Flag para forçar mudança de senha
          }
        }
      });

      if (signUpError) {
        // Se o usuário já existe, o Supabase retorna um erro específico
        if (signUpError.message.includes('User already registered')) {
          toast({
            title: 'Usuário já existe',
            description: 'Este email já está cadastrado no sistema.',
            variant: 'destructive',
          });
          return false;
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('Falha ao criar usuário');
      }

      // Importante: Fazer logout do usuário recém-criado para não afetar a sessão atual
      await supabase.auth.signOut();
      
      // Restaurar a sessão original se existia
      if (currentSession.data.session) {
        await supabase.auth.setSession(currentSession.data.session);
      }

      // Tentar inserir informações básicas do usuário na tabela user_basic_info
      try {
        const basicInfoData = {
          user_id: signUpData.user.id,
          email: userData.email,
          name: userData.name
        };
        
        const { error: basicInfoError } = await (supabase as unknown as ExtendedSupabaseClient)
          .from('user_basic_info')
          .insert(basicInfoData);

        if (basicInfoError) {
          console.warn('Error inserting user basic info:', basicInfoError);
        }
      } catch (error) {
        console.warn('user_basic_info table not available, skipping insert');
      }

      // Adicionar à organização
      const { error: orgUserError } = await supabase
        .from('organization_users')
        .insert({
          organization_id: currentOrganization.id,
          user_id: signUpData.user.id,
          role: userData.role,
          joined_at: new Date().toISOString(),
          is_active: true
        });

      if (orgUserError) throw orgUserError;

      toast({
        title: 'Usuário criado com sucesso',
        description: `${userData.name} foi adicionado à organização. Senha temporária: ${tempPassword}`,
      });

      await fetchUsers(); // Recarregar lista
      return true;
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: error instanceof Error ? error.message : 'Falha ao criar usuário',
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
    
    // Verificar se o usuário está tentando alterar sua própria role
    if (currentUser?.id === userId) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode alterar sua própria role.',
        variant: 'destructive',
      });
      return false;
    }
    
    if (!canEditUser(userId)) {
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão para alterar a role deste usuário.',
        variant: 'destructive',
      });
      return false;
    }

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
    } catch (error: unknown) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Erro ao atualizar role',
        description: error instanceof Error ? error.message : 'Falha ao atualizar role do usuário',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Ativar/desativar usuário
  const toggleUserStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
    if (!currentOrganization?.id) return false;
    
    // Verificar se o usuário está tentando desativar a si mesmo
    if (currentUser?.id === userId && !isActive) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode desativar sua própria conta.',
        variant: 'destructive',
      });
      return false;
    }
    
    if (!canEditUser(userId)) {
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão para alterar o status deste usuário.',
        variant: 'destructive',
      });
      return false;
    }

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
    } catch (error: unknown) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: error instanceof Error ? error.message : 'Falha ao alterar status do usuário',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Remover usuário da organização
  const removeUser = async (userId: string): Promise<boolean> => {
    if (!currentOrganization?.id) return false;
    
    // Verificar se o usuário está tentando remover a si mesmo
    if (currentUser?.id === userId) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode remover sua própria conta.',
        variant: 'destructive',
      });
      return false;
    }
    
    if (!canEditUser(userId)) {
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão para remover este usuário.',
        variant: 'destructive',
      });
      return false;
    }

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
    } catch (error: unknown) {
      console.error('Error removing user:', error);
      toast({
        title: 'Erro ao remover usuário',
        description: error instanceof Error ? error.message : 'Falha ao remover usuário',
        variant: 'destructive',
      });
      return false;
    }
  };


  // Verificar se o usuário atual pode gerenciar outros usuários
  const canManageUsers = () => {
    return ['owner', 'admin'].includes(userRole || '');
  };

  // Verificar se é o próprio usuário
  const isSelfUser = (targetUserId: string): boolean => {
    return currentUser?.id === targetUserId;
  };

  // Verificar se pode editar um usuário específico
  const canEditUser = (targetUserId: string): boolean => {
    if (!canManageUsers()) return false;
    
    // Não pode editar a si mesmo
    if (isSelfUser(targetUserId)) return false;
    
    // Buscar o usuário alvo para verificar sua role
    const targetUser = users.find(u => u.user_id === targetUserId);
    if (!targetUser) return false;
    
    // Owner pode editar qualquer um (exceto a si mesmo, já verificado acima)
    if (userRole === 'owner') return true;
    
    // Admin pode editar todos exceto owner
    if (userRole === 'admin' && targetUser.role !== 'owner') return true;
    
    return false;
  };

  // Carregar usuários quando a organização mudar
  useEffect(() => {
    if (currentOrganization?.id) {
      fetchUsers();
    }
  }, [currentOrganization?.id, fetchUsers]);

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
    isSelfUser,
    
    // Dados da organização
    currentOrganization,
    userRole
  };
};
