/**
 * Exemplos de uso do sistema de permissões
 * 
 * Este arquivo demonstra como usar os hooks e componentes de permissão
 * implementados no sistema.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PermissionGate, 
  AdminOnly, 
  OwnerOnly, 
  ManagerOrAbove,
  usePermissionGate 
} from '@/components/auth/PermissionGate';
import { 
  usePermissions
} from '@/hooks/usePermissions';
import { useAdminGuard } from '@/hooks/useRoleGuard';

// Exemplo 1: Usando PermissionGate para controlar renderização
export const PermissionGateExamples = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Exemplos de PermissionGate</h3>
      
      {/* Exemplo básico - apenas admins podem ver */}
      <PermissionGate requiredRole={['owner', 'admin']}>
        <Card>
          <CardHeader>
            <CardTitle>Painel Administrativo</CardTitle>
            <CardDescription>Visível apenas para admins</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Configurar Sistema</Button>
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Exemplo com módulo específico */}
      <PermissionGate module="fiscal" level="write">
        <Card>
          <CardHeader>
            <CardTitle>Edição Fiscal</CardTitle>
            <CardDescription>Requer permissão de escrita no módulo fiscal</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Editar Dados Fiscais</Button>
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Exemplo com fallback personalizado */}
      <PermissionGate 
        requiredRole="owner"
        fallback={
          <Card className="opacity-50">
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>Acesso restrito ao proprietário</CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled>Sem Permissão</Button>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Configurações Avançadas</CardTitle>
            <CardDescription>Configurações do proprietário</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Configurar</Button>
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Exemplo com componentes de conveniência */}
      <AdminOnly>
        <Card>
          <CardHeader>
            <CardTitle>Área de Administração</CardTitle>
            <CardDescription>Usando componente AdminOnly</CardDescription>
          </CardHeader>
        </Card>
      </AdminOnly>

      <OwnerOnly showError errorMessage="Apenas o proprietário pode acessar esta área">
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Proprietário</CardTitle>
            <CardDescription>Usando componente OwnerOnly</CardDescription>
          </CardHeader>
        </Card>
      </OwnerOnly>

      <ManagerOrAbove hideOnDenied>
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Gerenciais</CardTitle>
            <CardDescription>Visível para gerentes ou superiores</CardDescription>
          </CardHeader>
        </Card>
      </ManagerOrAbove>
    </div>
  );
};

// Exemplo 2: Usando hooks de permissão
export const PermissionHookExamples = () => {
  const permissions = usePermissions();
  const { canRenderAdmin, canRenderModule } = usePermissionGate();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Exemplos de Hooks de Permissão</h3>
      
      <Card>
        <CardHeader>
          <CardTitle>Status do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Role atual:</strong> {permissions.currentRole || 'Não definido'}</p>
          <p><strong>É Admin?</strong> {permissions.isAdmin() ? 'Sim' : 'Não'}</p>
          <p><strong>É Owner?</strong> {permissions.isOwner() ? 'Sim' : 'Não'}</p>
          <p><strong>Pode escrever?</strong> {permissions.canWrite() ? 'Sim' : 'Não'}</p>
          <p><strong>Organização:</strong> {permissions.currentOrganization?.name || 'Nenhuma'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissões por Módulo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Fiscal (leitura):</strong> {permissions.canAccessFiscal() ? 'Sim' : 'Não'}</p>
          <p><strong>Fiscal (escrita):</strong> {permissions.canEditFiscal() ? 'Sim' : 'Não'}</p>
          <p><strong>Financeiro (leitura):</strong> {permissions.canAccessFinancial() ? 'Sim' : 'Não'}</p>
          <p><strong>Financeiro (escrita):</strong> {permissions.canEditFinancial() ? 'Sim' : 'Não'}</p>
          <p><strong>Relatórios:</strong> {permissions.canViewReports() ? 'Sim' : 'Não'}</p>
          <p><strong>Sistema:</strong> {permissions.canManageSystem() ? 'Sim' : 'Não'}</p>
        </CardContent>
      </Card>

      {/* Renderização condicional usando hooks */}
      {canRenderAdmin() && (
        <Card>
          <CardHeader>
            <CardTitle>Ações Administrativas</CardTitle>
            <CardDescription>Renderizado condicionalmente para admins</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Gerenciar Usuários</Button>
          </CardContent>
        </Card>
      )}

      {canRenderModule('reports', 'write') && (
        <Card>
          <CardHeader>
            <CardTitle>Criação de Relatórios</CardTitle>
            <CardDescription>Renderizado para usuários com permissão de escrita em relatórios</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Criar Relatório</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Exemplo 3: Componente com guard de rota
export const AdminPanelExample = () => {
  // Este hook irá redirecionar se o usuário não for admin
  const { hasPermission } = useAdminGuard();

  if (!hasPermission) {
    return null; // Não renderiza nada se não tem permissão
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Painel Administrativo</h3>
      <p>Este componente só é renderizado para administradores.</p>
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Editar Configurações</Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Exemplo 4: Verificação de permissão sem redirecionamento
export const ConditionalActionsExample = () => {
  const permissions = usePermissions();
  
  const canManageUsers = permissions.isAdmin() || permissions.isOwner();
  const canEditFiscal = permissions.canEditFiscal();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Ações Condicionais</h3>
      
      <Card>
        <CardHeader>
          <CardTitle>Ações Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button disabled={!canManageUsers}>
            {canManageUsers ? 'Gerenciar Usuários' : 'Sem Permissão para Usuários'}
          </Button>
          
          <Button disabled={!canEditFiscal}>
            {canEditFiscal ? 'Editar Dados Fiscais' : 'Sem Permissão para Editar Fiscal'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente principal com todos os exemplos
export const PermissionSystemExamples = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sistema de Permissões</h1>
        <p className="text-muted-foreground mb-6">
          Exemplos de uso do sistema de permissões implementado no ERP.
        </p>
      </div>

      <PermissionGateExamples />
      <PermissionHookExamples />
      <AdminPanelExample />
      <ConditionalActionsExample />

      <Card>
        <CardHeader>
          <CardTitle>Documentação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Para mais informações sobre como usar o sistema de permissões, 
            consulte a documentação em <code>proj_docs/architecture/security-model.md</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
