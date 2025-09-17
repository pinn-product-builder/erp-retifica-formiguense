import React from 'react';
import { usePermissions, type AppRole, type ModuleName, type PermissionLevel } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface PermissionGateProps {
  children: React.ReactNode;
  
  // Verificação por role específico
  requiredRole?: AppRole | AppRole[];
  
  // Verificação por módulo e nível
  module?: ModuleName;
  level?: PermissionLevel;
  
  // Verificação customizada
  condition?: boolean;
  
  // Componentes de fallback
  fallback?: React.ReactNode;
  showError?: boolean;
  errorMessage?: string;
  
  // Comportamento
  hideOnDenied?: boolean; // Se true, não renderiza nada quando negado
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  requiredRole,
  module,
  level,
  condition,
  fallback,
  showError = false,
  errorMessage,
  hideOnDenied = false
}) => {
  const permissions = usePermissions();

  // Verificar se o usuário está autenticado
  if (!permissions.isAuthenticated) {
    if (hideOnDenied) return null;
    
    return fallback || (showError ? (
      <Alert variant="destructive">
        <ShieldX className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você precisa estar logado para acessar este conteúdo.
        </AlertDescription>
      </Alert>
    ) : null);
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
    if (hideOnDenied) return null;
    
    return fallback || (showError ? (
      <Alert variant="destructive">
        <ShieldX className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          {errorMessage || 'Você não tem permissão para acessar este conteúdo.'}
        </AlertDescription>
      </Alert>
    ) : null);
  }

  // Renderizar conteúdo se tem permissão
  return <>{children}</>;
};

// Componentes de conveniência para casos específicos
export const AdminOnly: React.FC<Omit<PermissionGateProps, 'requiredRole'>> = (props) => (
  <PermissionGate {...props} requiredRole={['owner', 'admin']} />
);

export const OwnerOnly: React.FC<Omit<PermissionGateProps, 'requiredRole'>> = (props) => (
  <PermissionGate {...props} requiredRole="owner" />
);

export const ManagerOrAbove: React.FC<Omit<PermissionGateProps, 'requiredRole'>> = (props) => (
  <PermissionGate {...props} requiredRole={['owner', 'admin', 'manager']} />
);

// Hook para uso condicional em componentes
export const usePermissionGate = () => {
  const permissions = usePermissions();
  
  return {
    canRender: (requirement: {
      roles?: AppRole[];
      module?: ModuleName;
      level?: PermissionLevel;
      condition?: boolean;
    }) => {
      if (!permissions.isAuthenticated) return false;
      
      if (requirement.condition !== undefined) {
        return requirement.condition;
      }
      
      if (requirement.roles) {
        return permissions.hasRole(requirement.roles);
      }
      
      if (requirement.module && requirement.level) {
        return permissions.hasModulePermission(requirement.module, requirement.level);
      }
      
      if (requirement.module) {
        return permissions.canAccessModule(requirement.module);
      }
      
      return true;
    },
    
    // Helpers específicos
    canRenderAdmin: () => permissions.isAdmin(),
    canRenderOwner: () => permissions.isOwner(),
    canRenderManager: () => permissions.isManager(),
    canRenderModule: (module: ModuleName, level: PermissionLevel = 'read') => 
      permissions.hasModulePermission(module, level)
  };
};
