import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Json } from '@/integrations/supabase/types';
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'super_admin' | 'owner' | 'admin' | 'manager' | 'user';
  invited_at?: string;
  joined_at?: string;
  invited_by?: string;
  is_active: boolean;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  userOrganizations: Organization[];
  userRole: string | null;
  loading: boolean;
  error: string | null;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  createOrganization: (name: string, description?: string) => Promise<void>;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => Promise<void>;
  inviteUser: (email: string, role: string) => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  leaveOrganization: () => Promise<void>;
}

export const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserOrganizations = async () => {
    if (!user) return;

    console.log('fetchUserOrganizations chamado para usuário:', user.id);
    try {
      setLoading(true);
      setError(null);

      // Fetch user's organizations through the junction table
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from('organization_users')
        .select(`
          id,
          organization_id,
          user_id,
          role,
          is_active,
          organizations!inner (
            id,
            name,
            slug,
            description,
            settings,
            is_active,
            created_at,
            updated_at,
            created_by
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('organizations.is_active', true);

      console.log('Consulta Supabase - orgUsers:', orgUsers);
      console.log('Consulta Supabase - error:', orgUsersError);

      if (orgUsersError) throw orgUsersError;

      const organizations = orgUsers?.map(ou => ou.organizations).filter(Boolean) as Organization[];
      setUserOrganizations(organizations);

      // Set current organization (first one if none set)
      if (organizations.length > 0 && !currentOrganization) {
        const currentOrgData = orgUsers?.find(ou => ou.organization_id === organizations[0].id);
        setCurrentOrganization(organizations[0]);
        setUserRole(currentOrgData?.role || null);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Falha ao carregar organizações');
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    const org = userOrganizations.find(o => o.id === orgId);
    if (!org) return;

    setCurrentOrganization(org);
    localStorage.setItem('currentOrganizationId', orgId);

    // Fetch user role for this organization
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user?.id)
      .eq('is_active', true)
      .single();

    setUserRole(orgUser?.role || null);
  };

  const refreshOrganizations = async () => {
    await fetchUserOrganizations();
  };

  const createOrganization = async (name: string, description?: string) => {
    if (!user) throw new Error('User not authenticated');

    // Verificar se é super admin
    const { data: superAdminCheck, error: checkError } = await supabase
      .rpc('is_super_admin');

    if (checkError || !superAdminCheck) {
      throw new Error('Apenas super administradores podem criar organizações');
    }

    // Validações
    if (!name?.trim()) {
      throw new Error('Nome da organização é obrigatório');
    }

    if (name.trim().length < 2) {
      throw new Error('Nome da organização deve ter pelo menos 2 caracteres');
    }

    if (name.trim().length > 100) {
      throw new Error('Nome da organização deve ter no máximo 100 caracteres');
    }

    if (description && description.length > 500) {
      throw new Error('Descrição deve ter no máximo 500 caracteres');
    }

    // Verificar se já existe uma organização com o mesmo nome
    const { data: existingOrgs } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', name.trim())
      .eq('is_active', true);

    if (existingOrgs && existingOrgs.length > 0) {
      throw new Error('Já existe uma organização com este nome');
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        created_by: user.id,
        settings: {}
      })
      .select()
      .single();

    if (error) throw error;

    // Add user as owner
    const { error: orgUserError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: data.id,
        user_id: user.id,
        role: 'owner' as const,
        is_active: true
      });

    if (orgUserError) throw orgUserError;

    // Refresh organizations
    await fetchUserOrganizations();
  };

  const updateOrganization = async (orgId: string, updates: Partial<Organization>) => {
    const { error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', orgId);

    if (error) throw error;

    // Refresh organizations
    await fetchUserOrganizations();
  };

  const inviteUser = async (email: string, role: string) => {
    if (!currentOrganization) throw new Error('No organization selected');

      const { error } = await supabase
        .from('organization_users')
        .insert([{
          organization_id: currentOrganization.id,
          user_id: email, // This should be the actual user ID after they accept the invitation
          role: role as unknown,
          is_active: false // Will be activated when they accept
        }]);

    if (error) throw error;
  };

  const updateUserRole = async (userId: string, role: string) => {
    if (!currentOrganization) throw new Error('No organization selected');

    const { error } = await supabase
      .from('organization_users')
      .update({ role: role as unknown })
      .eq('organization_id', currentOrganization.id)
      .eq('user_id', userId);

    if (error) throw error;
  };

  const removeUser = async (userId: string) => {
    if (!currentOrganization) throw new Error('No organization selected');

    const { error } = await supabase
      .from('organization_users')
      .update({ is_active: false })
      .eq('organization_id', currentOrganization.id)
      .eq('user_id', userId);

    if (error) throw error;
  };

  const leaveOrganization = async () => {
    if (!currentOrganization || !user) return;

    const { error } = await supabase
      .from('organization_users')
      .update({ is_active: false })
      .eq('organization_id', currentOrganization.id)
      .eq('user_id', user.id);

    if (error) throw error;

    // Switch to another organization or clear current
    const remainingOrgs = userOrganizations.filter(org => org.id !== currentOrganization.id);
    if (remainingOrgs.length > 0) {
      await switchOrganization(remainingOrgs[0].id);
    } else {
      setCurrentOrganization(null);
      setUserRole(null);
    }
  };

  // Load organizations when user changes
  useEffect(() => {
    if (user) {
      fetchUserOrganizations();
    } else {
      setCurrentOrganization(null);
      setUserOrganizations([]);
      setUserRole(null);
      setLoading(false);
    }
  }, [user]);

  // Load preferred organization from localStorage
  useEffect(() => {
    const savedOrgId = localStorage.getItem('currentOrganizationId');
    if (savedOrgId && userOrganizations.length > 0) {
      const savedOrg = userOrganizations.find(org => org.id === savedOrgId);
      if (savedOrg) {
        switchOrganization(savedOrgId);
      }
    }
  }, [userOrganizations]);

  const value: OrganizationContextType = {
    currentOrganization,
    userOrganizations,
    userRole,
    loading,
    error,
    switchOrganization,
    refreshOrganizations,
    createOrganization,
    updateOrganization,
    inviteUser,
    updateUserRole,
    removeUser,
    leaveOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};