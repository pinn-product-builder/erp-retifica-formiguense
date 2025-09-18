import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type SuperUserType = 'platform_admin' | 'organization_creator';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface SuperUser {
  id: string;
  user_id: string;
  super_user_type: SuperUserType;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  notes: string | null;
}

export interface SuperUserSignupRequest {
  id: string;
  email: string;
  name: string;
  company_name: string;
  phone: string | null;
  message: string | null;
  requested_type: SuperUserType;
  status: RequestStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
}

export interface CreateSuperUserData {
  user_id: string;
  super_user_type: SuperUserType;
  notes?: string;
}

export const useSuperUser = () => {
  const [currentUserSuperUser, setCurrentUserSuperUser] = useState<SuperUser | null>(null);
  const [superUsers, setSuperUsers] = useState<SuperUser[]>([]);
  const [signupRequests, setSignupRequests] = useState<SuperUserSignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if current user is a super user
  const fetchCurrentUserSuperUser = useCallback(async () => {
    if (!user?.id) {
      setCurrentUserSuperUser(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('super_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error('Error fetching current user super user status:', error);
        return;
      }

      setCurrentUserSuperUser(data || null);
    } catch (error) {
      console.error('Error fetching current user super user status:', error);
      setCurrentUserSuperUser(null);
    }
  }, [user?.id]);

  // Fetch all super users (only for platform admins)
  const fetchSuperUsers = useCallback(async () => {
    if (!currentUserSuperUser || currentUserSuperUser.super_user_type !== 'platform_admin') {
      setSuperUsers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('super_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching super users:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar lista de super usuários",
          variant: "destructive",
        });
        return;
      }

      setSuperUsers(data || []);
    } catch (error) {
      console.error('Error fetching super users:', error);
      setSuperUsers([]);
    }
  }, [currentUserSuperUser, toast]);

  // Fetch signup requests (only for platform admins)
  const fetchSignupRequests = useCallback(async () => {
    if (!currentUserSuperUser || currentUserSuperUser.super_user_type !== 'platform_admin') {
      setSignupRequests([]);
      return;
    }

    setRequestsLoading(true);
    try {
      const { data, error } = await supabase
        .from('super_user_signup_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching signup requests:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar solicitações de cadastro",
          variant: "destructive",
        });
        return;
      }

      setSignupRequests(data || []);
    } catch (error) {
      console.error('Error fetching signup requests:', error);
      setSignupRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, [currentUserSuperUser, toast]);

  // Create super user
  const createSuperUser = async (data: CreateSuperUserData): Promise<boolean> => {
    if (!currentUserSuperUser || currentUserSuperUser.super_user_type !== 'platform_admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores da plataforma podem criar super usuários",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('super_users')
        .insert({
          user_id: data.user_id,
          super_user_type: data.super_user_type,
          notes: data.notes,
          created_by: user?.id,
        });

      if (error) {
        console.error('Error creating super user:', error);
        
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Usuário já é super usuário",
            description: "Este usuário já possui privilégios de super usuário",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao criar super usuário",
            description: "Falha ao criar super usuário. Tente novamente.",
            variant: "destructive",
          });
        }
        return false;
      }

      toast({
        title: "Super usuário criado",
        description: "Super usuário criado com sucesso",
      });

      // Refresh data
      await fetchSuperUsers();
      return true;
    } catch (error) {
      console.error('Error creating super user:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar super usuário",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update super user
  const updateSuperUser = async (id: string, updates: Partial<SuperUser>): Promise<boolean> => {
    if (!currentUserSuperUser || currentUserSuperUser.super_user_type !== 'platform_admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores da plataforma podem atualizar super usuários",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('super_users')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating super user:', error);
        toast({
          title: "Erro ao atualizar super usuário",
          description: "Falha ao atualizar super usuário. Tente novamente.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Super usuário atualizado",
        description: "Super usuário atualizado com sucesso",
      });

      // Refresh data
      await fetchSuperUsers();
      return true;
    } catch (error) {
      console.error('Error updating super user:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar super usuário",
        variant: "destructive",
      });
      return false;
    }
  };

  // Approve signup request
  const approveSignupRequest = async (requestId: string, reviewNotes?: string): Promise<boolean> => {
    if (!currentUserSuperUser || currentUserSuperUser.super_user_type !== 'platform_admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores da plataforma podem aprovar solicitações",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('super_user_signup_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          review_notes: reviewNotes,
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error approving signup request:', error);
        toast({
          title: "Erro ao aprovar solicitação",
          description: "Falha ao aprovar solicitação. Tente novamente.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Solicitação aprovada",
        description: "Solicitação aprovada com sucesso. O usuário receberá instruções por email.",
      });

      // Refresh data
      await fetchSignupRequests();
      return true;
    } catch (error) {
      console.error('Error approving signup request:', error);
      toast({
        title: "Erro",
        description: "Falha ao aprovar solicitação",
        variant: "destructive",
      });
      return false;
    }
  };

  // Reject signup request
  const rejectSignupRequest = async (requestId: string, reviewNotes?: string): Promise<boolean> => {
    if (!currentUserSuperUser || currentUserSuperUser.super_user_type !== 'platform_admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores da plataforma podem rejeitar solicitações",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('super_user_signup_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          review_notes: reviewNotes,
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting signup request:', error);
        toast({
          title: "Erro ao rejeitar solicitação",
          description: "Falha ao rejeitar solicitação. Tente novamente.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Solicitação rejeitada",
        description: "Solicitação rejeitada com sucesso.",
      });

      // Refresh data
      await fetchSignupRequests();
      return true;
    } catch (error) {
      console.error('Error rejecting signup request:', error);
      toast({
        title: "Erro",
        description: "Falha ao rejeitar solicitação",
        variant: "destructive",
      });
      return false;
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCurrentUserSuperUser();
      setLoading(false);
    };

    loadData();
  }, [fetchCurrentUserSuperUser]);

  // Load additional data when current user super user status changes
  useEffect(() => {
    if (currentUserSuperUser?.super_user_type === 'platform_admin') {
      fetchSuperUsers();
      fetchSignupRequests();
    }
  }, [currentUserSuperUser, fetchSuperUsers, fetchSignupRequests]);

  // Helper functions
  const isSuperUser = currentUserSuperUser !== null;
  const isPlatformAdmin = currentUserSuperUser?.super_user_type === 'platform_admin';
  const canCreateOrganizations = isSuperUser;

  return {
    // State
    currentUserSuperUser,
    superUsers,
    signupRequests,
    loading,
    requestsLoading,

    // Computed values
    isSuperUser,
    isPlatformAdmin,
    canCreateOrganizations,

    // Actions
    createSuperUser,
    updateSuperUser,
    approveSignupRequest,
    rejectSignupRequest,
    
    // Refresh functions
    refreshCurrentUser: fetchCurrentUserSuperUser,
    refreshSuperUsers: fetchSuperUsers,
    refreshSignupRequests: fetchSignupRequests,
  };
};
