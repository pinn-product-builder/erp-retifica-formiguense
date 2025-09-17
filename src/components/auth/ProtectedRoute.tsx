import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions, type AppRole, type ModuleName, type PermissionLevel } from '@/hooks/usePermissions';
import { Loader2, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  // Verificação por role
  requiredRole?: AppRole | AppRole[];
  
  // Verificação por módulo
  module?: ModuleName;
  level?: PermissionLevel;
  
  // Verificação customizada
  condition?: boolean;
  
  // Comportamento de redirecionamento
  redirectTo?: string;
  
  // Componente de fallback customizado
  fallback?: React.ReactNode;
  
  // Mostrar página de erro ao invés de redirecionar
  showErrorPage?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  module,
  level,
  condition,
  redirectTo = '/dashboard',
  fallback,
  showErrorPage = false
}) => {
  const { user, loading } = useAuth();
  const permissions = usePermissions();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Not part of any organization
  if (!permissions.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <ShieldX className="h-4 w-4" />
          <AlertTitle>Organização Necessária</AlertTitle>
          <AlertDescription className="mt-2">
            Você precisa fazer parte de uma organização para acessar esta página.
            Entre em contato com um administrador para ser convidado.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check permissions
  let hasPermission = true;

  if (condition !== undefined) {
    hasPermission = condition;
  } else if (requiredRole) {
    hasPermission = permissions.hasRole(requiredRole);
  } else if (module && level) {
    hasPermission = permissions.hasModulePermission(module, level);
  } else if (module) {
    hasPermission = permissions.canAccessModule(module);
  }

  // Permission denied
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showErrorPage) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <Alert variant="destructive" className="mb-4">
              <ShieldX className="h-4 w-4" />
              <AlertTitle>Acesso Negado</AlertTitle>
              <AlertDescription className="mt-2">
                Você não tem permissão para acessar esta página.
                {requiredRole && (
                  <div className="mt-2">
                    <strong>Permissão necessária:</strong> {Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole}
                  </div>
                )}
                {module && (
                  <div className="mt-2">
                    <strong>Módulo:</strong> {module} ({level || 'read'})
                  </div>
                )}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="mr-2"
            >
              Voltar
            </Button>
            <Button 
              onClick={() => window.location.href = redirectTo}
            >
              Ir para Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return <Navigate to={redirectTo} replace />;
  }

  // Render protected content
  return <>{children}</>;
};

// Componentes específicos para casos comuns
export const AdminRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole'>> = (props) => (
  <ProtectedRoute {...props} requiredRole={['owner', 'admin']} />
);

export const OwnerRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole'>> = (props) => (
  <ProtectedRoute {...props} requiredRole="owner" />
);

export const ManagerRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole'>> = (props) => (
  <ProtectedRoute {...props} requiredRole={['owner', 'admin', 'manager']} />
);

export const ModuleRoute: React.FC<Omit<ProtectedRouteProps, 'module' | 'level'> & { 
  module: ModuleName; 
  level?: PermissionLevel; 
}> = ({ module, level = 'read', ...props }) => (
  <ProtectedRoute {...props} module={module} level={level} />
);
