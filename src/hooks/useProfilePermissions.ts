import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions, type AppRole, type ModuleName, type PermissionLevel } from '@/hooks/usePermissions';

// Interface para permissões de página
interface PagePermission {
  id: string;
  profile_id: string;
  page_id: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  page?: {
    id: string;
    name: string;
    display_name: string;
    route_path: string;
    module?: string;
    icon?: string;
    is_active: boolean;
  };
}

// Interface para perfil do usuário
interface UserProfileData {
  id: string;
  name: string;
  description?: string;
  sector_id?: string;
  org_id: string;
  is_active: boolean;
  sector?: {
    id: string;
    name: string;
    color: string;
  };
}

// Interface para atribuição de perfil
interface ProfileAssignment {
  id: string;
  user_id: string;
  profile_id: string;
  org_id: string;
  is_active: boolean;
  profile?: UserProfileData;
}

// Mapeamento de páginas para módulos
const PAGE_MODULE_MAPPING: Record<string, ModuleName> = {
  '/dashboard': 'reports',
  '/relatorios': 'reports',
  '/coleta': 'workflow',
  '/checkin': 'workflow',
  '/workflow': 'workflow',
  '/pcp': 'production',
  '/ordens-servico': 'orders',
  '/orcamentos': 'orders',
  '/diagnosticos': 'production',
  '/clientes': 'admin',
  '/consultores': 'admin',
  '/funcionarios': 'hr',
  '/gestao-funcionarios': 'hr',
  '/estoque': 'inventory',
  '/compras': 'purchasing',
  '/pedidos-compra': 'purchasing',
  '/aprovacoes-pedidos': 'purchasing',
  '/financeiro': 'financial',
  '/contas-receber': 'financial',
  '/contas-pagar': 'financial',
  '/fluxo-caixa': 'financial',
  '/dre': 'financial',
  '/modulo-fiscal': 'fiscal',
  '/gestao-usuarios': 'admin',
  '/configuracoes': 'admin',
};

export const useProfilePermissions = () => {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [pagePermissions, setPagePermissions] = useState<PagePermission[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const basePermissions = usePermissions();

  // Buscar perfil do usuário atual
  const fetchUserProfile = useCallback(async () => {
    if (!user?.id || !currentOrganization?.id) {
      setUserProfile(null);
      setPagePermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar atribuição de perfil do usuário
      const { data: assignment, error: assignmentError } = await supabase
        .from('user_profile_assignments')
        .select(`
          id,
          user_id,
          profile_id,
          org_id,
          is_active,
          profile:user_profiles (
            id,
            name,
            description,
            sector_id,
            org_id,
            is_active,
            sector:user_sectors (
              id,
              name,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('org_id', currentOrganization.id)
        .eq('is_active', true)
        .maybeSingle();

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil do usuário:', assignmentError);
        setUserProfile(null);
        setPagePermissions([]);
        return;
      }

      if (!assignment || !assignment.profile) {
        setUserProfile(null);
        setPagePermissions([]);
        return;
      }

      const profileData = assignment.profile as UserProfileData;
      setUserProfile(profileData);

      // Buscar permissões de páginas do perfil
      const { data: permissions, error: permissionsError } = await supabase
        .from('profile_page_permissions')
        .select(`
          id,
          profile_id,
          page_id,
          can_view,
          can_edit,
          can_delete,
          page:system_pages (
            id,
            name,
            display_name,
            route_path,
            module,
            icon,
            is_active
          )
        `)
        .eq('profile_id', profileData.id);

      if (permissionsError) {
        console.error('Erro ao buscar permissões de páginas:', permissionsError);
        setPagePermissions([]);
        return;
      }

      setPagePermissions(permissions as PagePermission[] || []);

    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      setUserProfile(null);
      setPagePermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentOrganization?.id]);

  // Carregar dados quando usuário ou organização mudarem
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Verificar se pode acessar uma página específica
  const canAccessPage = useCallback((routePath: string): boolean => {
    // Se não está logado, negar acesso
    if (!user) {
      return false;
    }

    // Se não tem organização, permitir acesso ao dashboard para seleção de organização
    if (!currentOrganization) {
      return routePath === '/dashboard';
    }

    // Para páginas administrativas, sempre usar permissões de role
    const adminPages = ['/gestao-usuarios', '/configuracoes'];
    if (adminPages.includes(routePath)) {
      return basePermissions.isAdmin();
    }

    // Se não tem perfil específico, usar permissões baseadas em role
    if (!userProfile || pagePermissions.length === 0) {
      const module = PAGE_MODULE_MAPPING[routePath];
      if (module) {
        return basePermissions.canAccessModule(module);
      }
      // Se não tem mapeamento, permitir acesso básico
      return true;
    }

    // Verificar permissões específicas do perfil
    const pagePermission = pagePermissions.find(
      p => p.page?.route_path === routePath && p.page?.is_active
    );

    if (pagePermission) {
      return pagePermission.can_view;
    }

    // Se não tem permissão específica, usar permissões de role como fallback
    const module = PAGE_MODULE_MAPPING[routePath];
    if (module) {
      return basePermissions.canAccessModule(module);
    }

    // Por padrão, permitir acesso se não tem restrições específicas
    return true;
  }, [user, currentOrganization, userProfile, pagePermissions, basePermissions]);

  // Verificar se pode editar uma página específica
  const canEditPage = useCallback((routePath: string): boolean => {
    // Se não está logado ou não tem organização, negar edição
    if (!user || !currentOrganization) {
      return false;
    }

    // Para páginas administrativas, sempre usar permissões de role
    const adminPages = ['/gestao-usuarios', '/configuracoes'];
    if (adminPages.includes(routePath)) {
      return basePermissions.isAdmin();
    }

    if (!userProfile || pagePermissions.length === 0) {
      const module = PAGE_MODULE_MAPPING[routePath];
      if (module) {
        return basePermissions.canEditModule(module);
      }
      return basePermissions.canWrite();
    }

    const pagePermission = pagePermissions.find(
      p => p.page?.route_path === routePath && p.page?.is_active
    );

    if (pagePermission) {
      return pagePermission.can_edit;
    }

    const module = PAGE_MODULE_MAPPING[routePath];
    if (module) {
      return basePermissions.canEditModule(module);
    }

    return false;
  }, [user, currentOrganization, userProfile, pagePermissions, basePermissions]);

  // Verificar se pode deletar uma página específica
  const canDeletePage = useCallback((routePath: string): boolean => {
    // Se não está logado ou não tem organização, negar exclusão
    if (!user || !currentOrganization) {
      return false;
    }

    if (!userProfile || pagePermissions.length === 0) {
      const module = PAGE_MODULE_MAPPING[routePath];
      if (module) {
        return basePermissions.canAdminModule(module);
      }
      return basePermissions.isAdmin();
    }

    const pagePermission = pagePermissions.find(
      p => p.page?.route_path === routePath && p.page?.is_active
    );

    if (pagePermission) {
      return pagePermission.can_delete;
    }

    const module = PAGE_MODULE_MAPPING[routePath];
    if (module) {
      return basePermissions.canAdminModule(module);
    }

    return false;
  }, [user, currentOrganization, userProfile, pagePermissions, basePermissions]);

  // Obter todas as páginas que o usuário pode acessar
  const getAccessiblePages = useCallback((): string[] => {
    if (!userProfile || pagePermissions.length === 0) {
      // Se não tem perfil específico, retornar páginas baseadas em role
      return Object.keys(PAGE_MODULE_MAPPING).filter(path => {
        const module = PAGE_MODULE_MAPPING[path];
        return basePermissions.canAccessModule(module);
      });
    }

    // Retornar páginas com permissão específica
    const profilePages = pagePermissions
      .filter(p => p.can_view && p.page?.is_active)
      .map(p => p.page?.route_path)
      .filter(Boolean) as string[];

    // Adicionar páginas administrativas se tiver role adequado
    const adminPages = ['/gestao-usuarios', '/configuracoes'];
    adminPages.forEach(page => {
      if (basePermissions.isAdmin() && !profilePages.includes(page)) {
        profilePages.push(page);
      }
    });

    return profilePages;
  }, [userProfile, pagePermissions, basePermissions]);

  // Verificar se pode acessar módulo (compatibilidade com sistema atual)
  const canAccessModule = useCallback((module: ModuleName): boolean => {
    // Sempre usar permissões de role para módulos
    return basePermissions.canAccessModule(module);
  }, [basePermissions]);

  const isAuthenticated = Boolean(user);
  
  // Debug logs temporários
  console.log('useProfilePermissions:', {
    user: !!user,
    currentOrganization: !!currentOrganization,
    basePermissionsAuth: basePermissions.isAuthenticated,
    overrideAuth: isAuthenticated,
    loading,
    hasUserProfile: Boolean(userProfile)
  });

  return {
    // Estado
    userProfile,
    pagePermissions,
    loading,
    
    // Permissões baseadas em role (fallback) - mas com isAuthenticated corrigido
    ...basePermissions,
    // Sobrescrever isAuthenticated para considerar apenas se o usuário está logado
    isAuthenticated,
    
    // Permissões específicas de páginas
    canAccessPage,
    canEditPage,
    canDeletePage,
    getAccessiblePages,
    
    // Compatibilidade
    canAccessModule,
    
    // Utilitários
    hasUserProfile: Boolean(userProfile),
    refreshProfile: fetchUserProfile,
    
    // Informações do perfil
    profileName: userProfile?.name,
    profileSector: userProfile?.sector?.name,
    profileSectorColor: userProfile?.sector?.color,
  };
};
