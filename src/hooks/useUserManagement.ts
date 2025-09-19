import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

// Interface para contornar limitações do TypeScript com tabelas não tipadas
interface ExtendedSupabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      in: (column: string, values: string[]) => Promise<{ data: unknown; error: unknown }>;
    };
    insert: (data: Record<string, unknown>) => Promise<{ error: unknown }>;
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
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
      toast.error('Erro ao carregar usuários', {
        description: 'Falha ao carregar usuários da organização'
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  // Criar usuário sem fazer login automático
  const createUser = async (userData: CreateUserData): Promise<boolean> => {
    console.log('Criando usuário:', userData);
    if (!currentOrganization?.id) return false;

    setCreateLoading(true);
    try {
      console.log('🔍 Tentando criar usuário via Edge Function:', userData);
      
      // Gerar senha temporária padrão
      const tempPassword = 'RetificaTemp2024!';

      // Chamar a Edge Function para criar o usuário sem fazer login automático
      const { data, error } = await supabase.functions.invoke('create-user-admin', {
        body: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          organizationId: currentOrganization.id,
          tempPassword: tempPassword,
          profileId: userData.profile_id || null
        }
      });

      if (error) {
        console.error('Error from create-user-admin function:', error);
        throw error;
      }

      if (!data.success) {
        console.log('🔴 ERRO RETORNADO PELA EDGE FUNCTION:');
        console.log('- Error:', data.error);
        console.log('- Message:', data.message);
        
        // Verificar se é usuário já existente
        if (data.error === 'user_already_exists') {
          console.log('🚨 EXIBINDO TOAST DE USUÁRIO JÁ EXISTS');
          toast.error('Usuário já cadastrado', {
            description: 'Este email já está cadastrado no sistema.'
          });
          console.log('✅ Toast exibido, retornando false');
          return false;
        }
        
        // Para outros erros
        console.log('🚨 EXIBINDO TOAST DE ERRO GENÉRICO');
        toast.error('Erro ao criar usuário', {
          description: data.message || 'Falha ao criar usuário. Tente novamente.'
        });
        console.log('✅ Toast de erro genérico exibido, retornando false');
        return false;
      }

      console.log('🎉 USUÁRIO CRIADO COM SUCESSO - EXIBINDO TOAST');
      toast.success('Usuário criado com sucesso', {
        description: `${userData.name} foi adicionado à organização. Senha temporária: ${tempPassword} (será solicitada alteração no primeiro login)`,
        duration: 8000, // 8 segundos para dar tempo de copiar
      });
      console.log('✅ Toast de sucesso exibido');

      console.log('📝 Atualizando lista de usuários sem recarregar...');
      // Atualizar lista sem recarregar página - usar os dados retornados pela Edge Function
      setUsers(prev => [data.user, ...prev]);
      console.log('✅ Lista de usuários atualizada - retornando true');
      return true;
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário', {
        description: error instanceof Error ? error.message : 'Falha ao criar usuário'
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
      toast.error('Ação não permitida', {
        description: 'Você não pode alterar sua própria role.'
      });
      return false;
    }
    
    if (!canEditUser(userId)) {
      toast.error('Acesso Negado', {
        description: 'Você não tem permissão para alterar a role deste usuário.'
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

      toast.success('Role atualizado', {
        description: `Role do usuário foi alterado para ${newRole}`
      });

      await fetchUsers(); // Recarregar lista
      return true;
    } catch (error: unknown) {
      console.error('Error updating user role:', error);
      toast.error('Erro ao atualizar role', {
        description: error instanceof Error ? error.message : 'Falha ao atualizar role do usuário'
      });
      return false;
    }
  };

  // Ativar/desativar usuário
  const toggleUserStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
    if (!currentOrganization?.id) return false;
    
    // Verificar se o usuário está tentando desativar a si mesmo
    if (currentUser?.id === userId && !isActive) {
      toast.error('Ação não permitida', {
        description: 'Você não pode desativar sua própria conta.'
      });
      return false;
    }
    
    if (!canEditUser(userId)) {
      toast.error('Acesso Negado', {
        description: 'Você não tem permissão para alterar o status deste usuário.'
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

      toast.success(isActive ? 'Usuário ativado' : 'Usuário desativado', {
        description: `Usuário foi ${isActive ? 'ativado' : 'desativado'} com sucesso`
      });

      await fetchUsers(); // Recarregar lista
      return true;
    } catch (error: unknown) {
      console.error('Error toggling user status:', error);
      toast.error('Erro ao alterar status', {
        description: error instanceof Error ? error.message : 'Falha ao alterar status do usuário'
      });
      return false;
    }
  };

  // Remover usuário completamente (da organização e do sistema)
  const removeUser = async (userId: string): Promise<boolean> => {
    if (!currentOrganization?.id) return false;
    
    // Verificar se o usuário está tentando remover a si mesmo
    if (currentUser?.id === userId) {
      toast.error('Ação não permitida', {
        description: 'Você não pode remover sua própria conta.'
      });
      return false;
    }
    
    if (!canEditUser(userId)) {
      toast.error('Acesso Negado', {
        description: 'Você não tem permissão para remover este usuário.'
      });
      return false;
    }

    try {
      console.log('🗑️ Iniciando remoção de usuário:', userId);
      
      // Chamar a Edge Function para deletar o usuário completamente
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          userId: userId,
          organizationId: currentOrganization.id
        }
      });

      if (error) {
        console.error('Error from delete-user function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao deletar usuário');
      }

      console.log('✅ Usuário removido:', data);

      // Mostrar toast apropriado baseado no resultado
      if (data.deletedCompletely) {
        toast.success('Usuário removido completamente', {
          description: 'Usuário foi removido completamente do sistema.'
        });
      } else {
        toast.success('Usuário removido da organização', {
          description: 'Usuário foi removido desta organização mas permanece em outras.'
        });
      }

      // Atualizar lista sem recarregar a página
      setUsers(prev => prev.filter(u => u.user_id !== userId));
      return true;
    } catch (error: unknown) {
      console.error('Error removing user:', error);
      toast.error('Erro ao remover usuário', {
        description: error instanceof Error ? error.message : 'Falha ao remover usuário'
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
