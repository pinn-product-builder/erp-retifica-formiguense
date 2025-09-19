import { useState, useEffect } from 'react';
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
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_super_admin')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking super admin status:', error);
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(profile?.is_super_admin || false);
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

  return {
    isSuperAdmin,
    loading
  };
};

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
      // Verificar se o usuário atual é super admin
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('user_id', user.id)
        .single();

      if (!currentProfile?.is_super_admin) {
        toast.error('Apenas super administradores podem promover outros usuários');
        return false;
      }

      // Promover o usuário
      const { error } = await supabase
        .from('profiles')
        .update({ is_super_admin: true })
        .eq('user_id', userId);

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
      // Verificar se o usuário atual é super admin
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('user_id', user.id)
        .single();

      if (!currentProfile?.is_super_admin) {
        toast.error('Apenas super administradores podem revogar permissões');
        return false;
      }

      // Não permitir revogar próprias permissões
      if (userId === user.id) {
        toast.error('Você não pode revogar suas próprias permissões de super admin');
        return false;
      }

      // Revogar permissões
      const { error } = await supabase
        .from('profiles')
        .update({ is_super_admin: false })
        .eq('user_id', userId);

      if (error) {
        toast.error('Erro ao revogar permissões: ' + error.message);
        return false;
      }

      toast.success('Permissões de super administrador revogadas');
      return true;
    } catch (error) {
      console.error('Error revoking super admin:', error);
      toast.error('Erro inesperado ao revogar permissões');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAllOrganizations = async () => {
    if (!user) return [];

    try {
      // Verificar se é super admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile?.is_super_admin) {
        toast.error('Apenas super administradores podem visualizar todas as organizações');
        return [];
      }

      // Buscar todas as organizações
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Erro ao buscar organizações: ' + error.message);
        return [];
      }

      // Buscar usuários de cada organização separadamente
      const orgsWithUsers = await Promise.all(
        (organizations || []).map(async (org) => {
          const { data: orgUsers } = await supabase
            .from('organization_users')
            .select('id, user_id, role')
            .eq('organization_id', org.id);

          // Buscar nomes dos usuários da tabela profiles
          const usersWithProfiles = await Promise.all(
            (orgUsers || []).map(async (orgUser) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('user_id', orgUser.user_id)
                .single();

              return {
                ...orgUser,
                profiles: profile ? { name: profile.name || 'Nome não disponível' } : null
              };
            })
          );

          return {
            ...org,
            organization_users: usersWithProfiles
          };
        })
      );

      return orgsWithUsers;
    } catch (error) {
      console.error('Error fetching all organizations:', error);
      toast.error('Erro inesperado ao buscar organizações');
      return [];
    }
  };

  return {
    loading,
    promoteToSuperAdmin,
    revokeSupeAdmin,
    getAllOrganizations
  };
};
