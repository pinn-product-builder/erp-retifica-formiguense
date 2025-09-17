import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions, type AppRole, type ModuleName, type PermissionLevel } from '@/hooks/usePermissions';
import { toast } from '@/hooks/use-toast';

interface RoleGuardConfig {
  // Verificação por role
  requiredRole?: AppRole | AppRole[];
  
  // Verificação por módulo
  module?: ModuleName;
  level?: PermissionLevel;
  
  // Verificação customizada
  condition?: boolean;
  
  // Comportamento
  redirectTo?: string;
  showToast?: boolean;
  toastMessage?: string;
  blockAccess?: boolean; // Se true, bloqueia completamente o acesso
}

export const useRoleGuard = (config: RoleGuardConfig) => {
  const permissions = usePermissions();
  const navigate = useNavigate();

  const {
    requiredRole,
    module,
    level,
    condition,
    redirectTo = '/dashboard',
    showToast = true,
    toastMessage,
    blockAccess = false
  } = config;

  useEffect(() => {
    // Se não está autenticado, redirecionar para login
    if (!permissions.isAuthenticated) {
      navigate('/auth');
      return;
    }

    let hasPermission = true;

    // Verificar condição customizada
    if (condition !== undefined) {
      hasPermission = condition;
    }
    // Verificar role específico
    else if (requiredRole) {
      hasPermission = permissions.hasRole(requiredRole);
    }
    // Verificar permissão por módulo
    else if (module && level) {
      hasPermission = permissions.hasModulePermission(module, level);
    }
    // Verificar apenas módulo (nível read por padrão)
    else if (module) {
      hasPermission = permissions.canAccessModule(module);
    }

    // Se não tem permissão
    if (!hasPermission) {
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Acesso Negado",
          description: toastMessage || 'Você não tem permissão para acessar esta página.',
        });
      }

      if (blockAccess) {
        // Bloquear completamente o acesso
        navigate('/dashboard');
      } else {
        // Redirecionar para página especificada
        navigate(redirectTo);
      }
    }
  }, [
    permissions.isAuthenticated,
    permissions.currentRole,
    permissions.currentOrganization,
    requiredRole,
    module,
    level,
    condition,
    redirectTo,
    showToast,
    toastMessage,
    blockAccess,
    navigate
  ]);

  return {
    hasPermission: (() => {
      if (!permissions.isAuthenticated) return false;
      
      if (condition !== undefined) return condition;
      if (requiredRole) return permissions.hasRole(requiredRole);
      if (module && level) return permissions.hasModulePermission(module, level);
      if (module) return permissions.canAccessModule(module);
      
      return true;
    })(),
    permissions,
    isLoading: permissions.currentRole === null && permissions.currentOrganization === null
  };
};

// Hooks específicos para casos comuns
export const useAdminGuard = (options?: Omit<RoleGuardConfig, 'requiredRole'>) => {
  return useRoleGuard({
    ...options,
    requiredRole: ['owner', 'admin'],
    toastMessage: 'Acesso restrito a administradores.',
    ...options
  });
};

export const useOwnerGuard = (options?: Omit<RoleGuardConfig, 'requiredRole'>) => {
  return useRoleGuard({
    ...options,
    requiredRole: 'owner',
    toastMessage: 'Acesso restrito ao proprietário da organização.',
    ...options
  });
};

export const useManagerGuard = (options?: Omit<RoleGuardConfig, 'requiredRole'>) => {
  return useRoleGuard({
    ...options,
    requiredRole: ['owner', 'admin', 'manager'],
    toastMessage: 'Acesso restrito a gerentes ou superiores.',
    ...options
  });
};

export const useModuleGuard = (
  module: ModuleName, 
  level: PermissionLevel = 'read',
  options?: Omit<RoleGuardConfig, 'module' | 'level'>
) => {
  return useRoleGuard({
    ...options,
    module,
    level,
    toastMessage: `Você não tem permissão para acessar o módulo ${module}.`,
    ...options
  });
};

// Hook para verificação sem redirecionamento (apenas retorna boolean)
export const usePermissionCheck = (config: Omit<RoleGuardConfig, 'redirectTo' | 'showToast' | 'blockAccess'>) => {
  const permissions = usePermissions();
  
  const {
    requiredRole,
    module,
    level,
    condition
  } = config;

  if (!permissions.isAuthenticated) return false;
  
  if (condition !== undefined) return condition;
  if (requiredRole) return permissions.hasRole(requiredRole);
  if (module && level) return permissions.hasModulePermission(module, level);
  if (module) return permissions.canAccessModule(module);
  
  return true;
};
