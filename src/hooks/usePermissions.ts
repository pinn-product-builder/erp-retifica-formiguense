import { useOrganization } from '@/contexts/OrganizationContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';

export type AppRole = 'super_admin' | 'owner' | 'admin' | 'manager' | 'user' | 'viewer';
export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';
export type ModuleName = 'fiscal' | 'financial' | 'production' | 'workflow' | 'orders' | 'purchasing' | 'inventory' | 'hr' | 'reports' | 'admin' | 'settings';

// Matriz de permissões baseada na documentação do sistema
const PERMISSION_MATRIX: Record<AppRole, Record<ModuleName, PermissionLevel>> = {
  super_admin: {
    fiscal: 'admin',
    financial: 'admin',
    production: 'admin',
    workflow: 'admin',
    orders: 'admin',
    purchasing: 'admin',
    inventory: 'admin',
    hr: 'admin',
    reports: 'admin',
    admin: 'admin',
    settings: 'admin'
  },
  owner: {
    fiscal: 'admin',
    financial: 'admin', 
    production: 'admin',
    workflow: 'admin',
    orders: 'admin',
    purchasing: 'admin',
    inventory: 'admin',
    hr: 'admin',
    reports: 'admin',
    admin: 'admin',
    settings: 'admin'
  },
  admin: {
    fiscal: 'admin',
    financial: 'admin',
    production: 'admin', 
    workflow: 'admin',
    orders: 'admin',
    purchasing: 'admin',
    inventory: 'admin',
    hr: 'admin',
    reports: 'admin',
    admin: 'write',
    settings: 'admin'
  },
  manager: {
    fiscal: 'write',
    financial: 'read',
    production: 'write',
    workflow: 'write', 
    orders: 'write',
    purchasing: 'write',
    inventory: 'write',
    hr: 'read',
    reports: 'write',
    admin: 'none',
    settings: 'read'
  },
  user: {
    fiscal: 'read',
    financial: 'none',
    production: 'write',
    workflow: 'write',
    orders: 'write', 
    purchasing: 'read',
    inventory: 'read',
    hr: 'none',
    reports: 'read',
    admin: 'none',
    settings: 'none'
  },
  viewer: {
    fiscal: 'read',
    financial: 'read',
    production: 'read',
    workflow: 'read',
    orders: 'read',
    purchasing: 'read', 
    inventory: 'read',
    hr: 'read',
    reports: 'read',
    admin: 'none',
    settings: 'none'
  }
};

export const usePermissions = () => {
  const { userRole, currentOrganization } = useOrganization();
  const { isSuperAdmin: isRealSuperAdmin } = useSuperAdmin();

  const currentRole = userRole as AppRole | null;

  // Verificações básicas de role
  const isSuperAdmin = () => isRealSuperAdmin || currentRole === 'super_admin';
  const isOwner = () => currentRole === 'owner';
  const isAdmin = () => isRealSuperAdmin || ['super_admin', 'owner', 'admin'].includes(currentRole || '');
  const isManager = () => isRealSuperAdmin || ['super_admin', 'owner', 'admin', 'manager'].includes(currentRole || '');
  const canWrite = () => isRealSuperAdmin || ['super_admin', 'owner', 'admin', 'manager', 'user'].includes(currentRole || '');
  const canRead = () => Boolean(isRealSuperAdmin || (currentRole && (currentOrganization || isSuperAdmin())));

  // Verificação de permissão por módulo
  const hasModulePermission = (module: ModuleName, requiredLevel: PermissionLevel): boolean => {
    if (!isRealSuperAdmin && (!currentRole || (!currentOrganization && !isSuperAdmin()))) return false;

    // Super admin sempre tem permissão admin em todos os módulos
    if (isRealSuperAdmin) {
      const permissionLevels = ['none', 'read', 'write', 'admin'];
      const requiredLevelIndex = permissionLevels.indexOf(requiredLevel);
      const adminLevelIndex = permissionLevels.indexOf('admin');
      return adminLevelIndex >= requiredLevelIndex;
    }

    const userPermission = PERMISSION_MATRIX[currentRole!][module];
    
    // Hierarquia de permissões: admin > write > read > none
    const permissionLevels = ['none', 'read', 'write', 'admin'];
    const userLevel = permissionLevels.indexOf(userPermission);
    const requiredLevelIndex = permissionLevels.indexOf(requiredLevel);

    return userLevel >= requiredLevelIndex;
  };

  // Verificações específicas por módulo
  const canAccessModule = (module: ModuleName) => hasModulePermission(module, 'read');
  const canEditModule = (module: ModuleName) => hasModulePermission(module, 'write');
  const canAdminModule = (module: ModuleName) => hasModulePermission(module, 'admin');

  // Verificações específicas para funcionalidades
  const canManageUsers = () => isAdmin();
  const canManageOrganization = () => isAdmin();
  const canCreateOrganizations = () => isSuperAdmin();
  const canDeleteOrganizations = () => isSuperAdmin();
  const canViewAllOrganizations = () => isSuperAdmin();
  const canViewReports = () => canAccessModule('reports');
  const canCreateReports = () => canEditModule('reports');
  const canManageSystem = () => canAdminModule('admin');
  const canAccessFiscal = () => canAccessModule('fiscal');
  const canEditFiscal = () => canEditModule('fiscal');
  const canAccessFinancial = () => canAccessModule('financial');
  const canEditFinancial = () => canEditModule('financial');
  const canEditOrderIdentity = () => hasModulePermission('orders', 'admin');

  // Verificação genérica de role
  const hasRole = (requiredRole: AppRole | AppRole[]): boolean => {
    if (!currentRole) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(currentRole);
    }
    
    return currentRole === requiredRole;
  };

  // Verificação se pode acessar uma funcionalidade específica
  const canAccess = (requirement: {
    roles?: AppRole[];
    module?: ModuleName;
    level?: PermissionLevel;
  }): boolean => {
    if (!isRealSuperAdmin && (!currentRole || !currentOrganization)) return false;

    // Super admin sempre tem acesso
    if (isRealSuperAdmin) return true;

    // Verificar role se especificado
    if (requirement.roles && !requirement.roles.includes(currentRole!)) {
      return false;
    }

    // Verificar permissão de módulo se especificado
    if (requirement.module && requirement.level) {
      return hasModulePermission(requirement.module, requirement.level);
    }

    return true;
  };

  return {
    // Estado
    currentRole,
    currentOrganization,
    isAuthenticated: Boolean(isRealSuperAdmin || (currentRole && currentOrganization)),

    // Verificações básicas
    isSuperAdmin,
    isOwner,
    isAdmin,
    isManager,
    canWrite,
    canRead,
    hasRole,
    canAccess,

    // Verificações por módulo
    hasModulePermission,
    canAccessModule,
    canEditModule,
    canAdminModule,

    // Verificações específicas
    canManageUsers,
    canManageOrganization,
    canCreateOrganizations,
    canDeleteOrganizations,
    canViewAllOrganizations,
    canViewReports,
    canCreateReports,
    canManageSystem,
    canAccessFiscal,
    canEditFiscal,
    canAccessFinancial,
    canEditFinancial,
    canEditOrderIdentity,

    // Utilitários
    getModulePermission: (module: ModuleName) => {
      if (isRealSuperAdmin) return 'admin';
      if (!currentRole) return 'none';
      return PERMISSION_MATRIX[currentRole][module];
    },
    
    getAllPermissions: () => {
      if (isRealSuperAdmin) return PERMISSION_MATRIX['super_admin'];
      if (!currentRole) return null;
      return PERMISSION_MATRIX[currentRole];
    }
  };
};
