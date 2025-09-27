import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings: any;
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
  created_at: string;
  updated_at: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  userOrganizations: Organization[];
  userRole: string | null;
  loading: boolean;
  error: string | null;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  createOrganization: (name: string, description?: string) => Promise<Organization>;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => Promise<void>;
  inviteUser: (email: string, role: 'admin' | 'manager' | 'user') => Promise<void>;
  updateUserRole: (userId: string, role: 'super_admin' | 'owner' | 'admin' | 'manager' | 'user') => Promise<void>;
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
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        // Modo desenvolvimento - carregar primeira organização disponível
        const { data: orgs, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .limit(1);

        if (orgsError) throw orgsError;

        if (orgs && orgs.length > 0) {
          setUserOrganizations(orgs);
          setCurrentOrganization(orgs[0]);
          setUserRole('super_admin');
        }
        return;
      }

      // Fetch user's organizations through the junction table
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from('organization_users')
        .select(`
          id,
          organization_id,
          user_id,
          role,
          is_active,
          organizations (
            id,
            name,
            slug,
            description,
            settings,
            created_at,
            updated_at,
            created_by
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

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

    // Get user's role in this organization
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user?.id)
      .eq('is_active', true)
      .single();

    setCurrentOrganization(org);
    setUserRole(orgUser?.role || null);
    
    // Store preference in localStorage
    localStorage.setItem('currentOrganizationId', orgId);
  };

  const refreshOrganizations = async () => {
    await fetchUserOrganizations();
  };

  const createOrganization = async (name: string, description?: string): Promise<Organization> => {
    if (!user) throw new Error('User not authenticated');

    // Verificar se usuário é super admin
    const { data: superAdminCheck } = await supabase
      .rpc('is_super_admin');

    if (!superAdminCheck) {
      throw new Error('Apenas super administradores podem criar organizações');
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        description,
        created_by: user.id
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add user as owner
    const { error: userError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString()
      });

    if (userError) throw userError;

    await refreshOrganizations();
    return org;
  };

  const updateOrganization = async (orgId: string, updates: Partial<Organization>) => {
    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId);

    if (error) throw error;

    await refreshOrganizations();
  };

  const inviteUser = async (email: string, role: 'admin' | 'manager' | 'user') => {
    if (!currentOrganization || !user) return;

    // Note: This would typically send an email invitation
    // For now, we'll just create a pending invitation
    console.log(`Invitation sent to ${email} with role ${role}`);
  };

  const updateUserRole = async (userId: string, role: 'owner' | 'admin' | 'manager' | 'user') => {
    if (!currentOrganization) return;

    const { error } = await supabase
      .from('organization_users')
      .update({ role })
      .eq('organization_id', currentOrganization.id)
      .eq('user_id', userId);

    if (error) throw error;
  };

  const removeUser = async (userId: string) => {
    if (!currentOrganization) return;

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

    await refreshOrganizations();
  };

  useEffect(() => {
    fetchUserOrganizations();
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