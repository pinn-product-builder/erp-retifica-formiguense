import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProfilePermissions } from '@/hooks/useProfilePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldX, Loader2 } from 'lucide-react';

interface ProfileProtectedRouteProps {
  children: React.ReactNode;
  
  // Rota específica para verificar permissão (opcional, usa location atual se não fornecido)
  routePath?: string;
  
  // Nível de permissão necessário
  level?: 'view' | 'edit' | 'delete';
  
  // Redirect personalizado
  redirectTo?: string;
  
  // Componente de fallback
  fallback?: React.ReactNode;
  
  // Mostrar página de erro ao invés de redirecionar
  showErrorPage?: boolean;
  
  // Mensagem de erro personalizada
  errorMessage?: string;
}

export const ProfileProtectedRoute: React.FC<ProfileProtectedRouteProps> = ({
  children,
  routePath,
  level = 'view',
  redirectTo = '/dashboard',
  fallback,
  showErrorPage = false,
  errorMessage
}) => {
  const location = useLocation();
  const permissions = useProfilePermissions();
  
  const currentPath = routePath || location.pathname;

  // Loading state
  if (permissions.loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!permissions.isAuthenticated) {
    console.log('ProfileProtectedRoute: Not authenticated, redirecting to /auth', {
      isAuthenticated: permissions.isAuthenticated,
      currentPath,
      loading: permissions.loading
    });
    return <Navigate to="/auth" replace />;
  }

  // Check permissions based on level
  let hasPermission = false;
  
  switch (level) {
    case 'view':
      hasPermission = permissions.canAccessPage(currentPath);
      break;
    case 'edit':
      hasPermission = permissions.canEditPage(currentPath);
      break;
    case 'delete':
      hasPermission = permissions.canDeletePage(currentPath);
      break;
    default:
      hasPermission = permissions.canAccessPage(currentPath);
  }

  // Permission denied
  if (!hasPermission) {
    if (showErrorPage) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert className="max-w-md" variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription className="mt-2">
              {errorMessage || `Você não tem permissão para ${
                level === 'view' ? 'visualizar' : 
                level === 'edit' ? 'editar' : 
                'excluir conteúdo de'
              } esta página.`}
              {permissions.hasUserProfile && (
                <div className="mt-2 text-xs">
                  <strong>Seu perfil:</strong> {permissions.profileName}
                  {permissions.profileSector && (
                    <span> ({permissions.profileSector})</span>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    return fallback || <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

// Componente de conveniência para páginas que só precisam de visualização
export const ProfileViewRoute: React.FC<Omit<ProfileProtectedRouteProps, 'level'>> = (props) => (
  <ProfileProtectedRoute {...props} level="view" />
);

// Componente de conveniência para páginas que precisam de edição
export const ProfileEditRoute: React.FC<Omit<ProfileProtectedRouteProps, 'level'>> = (props) => (
  <ProfileProtectedRoute {...props} level="edit" />
);

// Componente de conveniência para páginas que precisam de exclusão
export const ProfileDeleteRoute: React.FC<Omit<ProfileProtectedRouteProps, 'level'>> = (props) => (
  <ProfileProtectedRoute {...props} level="delete" />
);

// HOC para aplicar proteção de perfil em componentes
export const withProfileProtection = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProfileProtectedRouteProps, 'children'>
) => {
  return (props: P) => (
    <ProfileProtectedRoute {...options}>
      <Component {...props} />
    </ProfileProtectedRoute>
  );
};
