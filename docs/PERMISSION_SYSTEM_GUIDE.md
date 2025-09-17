# Guia do Sistema de Permissões Frontend

## Visão Geral

Este guia documenta como usar o sistema de permissões implementado no frontend do ERP Retífica Formiguense. O sistema complementa a robusta arquitetura de backend com RLS (Row Level Security) e RBAC (Role-Based Access Control).

## Arquitetura

### Roles Disponíveis
- **owner**: Proprietário da organização (acesso total)
- **admin**: Administrador (gestão completa)
- **manager**: Gerente (supervisão e relatórios)
- **user**: Usuário padrão (operacional)
- **viewer**: Visualizador (somente leitura)

### Módulos do Sistema
- **fiscal**: Módulo fiscal
- **financial**: Módulo financeiro
- **production**: Módulo de produção
- **workflow**: Módulo de workflow
- **orders**: Módulo de pedidos
- **purchasing**: Módulo de compras
- **inventory**: Módulo de estoque
- **hr**: Recursos humanos
- **reports**: Relatórios
- **admin**: Administração do sistema

### Níveis de Permissão
- **none**: Sem acesso
- **read**: Somente leitura
- **write**: Leitura e escrita
- **admin**: Acesso administrativo completo

## Componentes e Hooks

### 1. usePermissions

Hook principal para verificações de permissão.

```typescript
import { usePermissions } from '@/hooks/usePermissions';

const MyComponent = () => {
  const permissions = usePermissions();

  // Verificações básicas
  const isAdmin = permissions.isAdmin();
  const canWrite = permissions.canWrite();
  
  // Verificações por módulo
  const canEditFiscal = permissions.canEditFiscal();
  const canViewReports = permissions.canViewReports();
  
  // Verificações genéricas
  const hasRole = permissions.hasRole(['admin', 'owner']);
  const hasModuleAccess = permissions.hasModulePermission('fiscal', 'write');

  return (
    <div>
      {isAdmin && <AdminPanel />}
      {canEditFiscal && <FiscalEditForm />}
    </div>
  );
};
```

### 2. PermissionGate

Componente para controlar renderização baseada em permissões.

```typescript
import { PermissionGate, AdminOnly } from '@/components/auth/PermissionGate';

// Exemplo básico
<PermissionGate requiredRole={['admin', 'owner']}>
  <AdminPanel />
</PermissionGate>

// Por módulo
<PermissionGate module="fiscal" level="write">
  <FiscalEditForm />
</PermissionGate>

// Com fallback
<PermissionGate 
  requiredRole="owner"
  fallback={<div>Acesso negado</div>}
>
  <OwnerSettings />
</PermissionGate>

// Ocultar quando negado
<PermissionGate requiredRole="admin" hideOnDenied>
  <AdminMenu />
</PermissionGate>

// Componentes de conveniência
<AdminOnly>
  <AdminContent />
</AdminOnly>
```

### 3. useRoleGuard

Hook para proteção de rotas com redirecionamento.

```typescript
import { useAdminGuard, useModuleGuard } from '@/hooks/useRoleGuard';

const AdminPage = () => {
  // Redireciona se não for admin
  const { hasPermission } = useAdminGuard();
  
  if (!hasPermission) return null;
  
  return <AdminContent />;
};

const FiscalPage = () => {
  // Redireciona se não tiver acesso ao módulo fiscal
  const { hasPermission } = useModuleGuard('fiscal', 'read');
  
  if (!hasPermission) return null;
  
  return <FiscalContent />;
};
```

### 4. ProtectedRoute

Componente para proteção de rotas no React Router.

```typescript
import { ProtectedRoute, AdminRoute } from '@/components/auth/ProtectedRoute';

// No App.tsx ou router
<Routes>
  <Route path="/admin" element={
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  } />
  
  <Route path="/fiscal" element={
    <ProtectedRoute module="fiscal" level="read">
      <FiscalModule />
    </ProtectedRoute>
  } />
</Routes>
```

## Exemplos Práticos

### 1. Componente Admin com Proteção

```typescript
import { useAdminGuard } from '@/hooks/useRoleGuard';

export const UserManagement = () => {
  const { hasPermission } = useAdminGuard({
    toastMessage: 'Acesso restrito a administradores.'
  });

  if (!hasPermission) return null;

  return (
    <div>
      <h1>Gerenciamento de Usuários</h1>
      {/* Conteúdo admin */}
    </div>
  );
};
```

### 2. Menu Condicional

```typescript
import { PermissionGate } from '@/components/auth/PermissionGate';

export const Sidebar = () => {
  return (
    <nav>
      {/* Item sempre visível */}
      <MenuItem to="/dashboard">Dashboard</MenuItem>
      
      {/* Item condicional por módulo */}
      <PermissionGate module="fiscal" hideOnDenied>
        <MenuItem to="/fiscal">Módulo Fiscal</MenuItem>
      </PermissionGate>
      
      {/* Item apenas para admins */}
      <PermissionGate requiredRole={['admin', 'owner']} hideOnDenied>
        <MenuItem to="/admin">Administração</MenuItem>
      </PermissionGate>
    </nav>
  );
};
```

### 3. Botões Condicionais

```typescript
import { usePermissions } from '@/hooks/usePermissions';

export const ActionButtons = () => {
  const permissions = usePermissions();

  return (
    <div>
      <Button 
        disabled={!permissions.canEditFiscal()}
        onClick={editFiscalData}
      >
        Editar Dados Fiscais
      </Button>
      
      {permissions.isAdmin() && (
        <Button onClick={deleteRecord}>
          Excluir
        </Button>
      )}
    </div>
  );
};
```

### 4. Verificação sem Renderização

```typescript
import { usePermissionCheck } from '@/hooks/useRoleGuard';

export const DataTable = () => {
  const canDelete = usePermissionCheck({ 
    requiredRole: ['admin', 'owner'] 
  });
  
  const canEdit = usePermissionCheck({ 
    module: 'fiscal', 
    level: 'write' 
  });

  return (
    <Table>
      {/* ... colunas da tabela */}
      <Column>
        {canEdit && <EditButton />}
        {canDelete && <DeleteButton />}
      </Column>
    </Table>
  );
};
```

## Boas Práticas

### 1. Segurança em Camadas
- ✅ Sempre use verificações no backend (RLS)
- ✅ Use verificações no frontend para UX
- ❌ Não confie apenas no frontend

### 2. Verificação Consistente
```typescript
// ✅ Bom: Verificação consistente
<PermissionGate module="fiscal" level="write">
  <FiscalEditForm />
</PermissionGate>

// ❌ Ruim: Verificação inconsistente
{someRandomCondition && <FiscalEditForm />}
```

### 3. Feedback ao Usuário
```typescript
// ✅ Bom: Feedback claro
<PermissionGate 
  requiredRole="admin"
  showError
  errorMessage="Apenas administradores podem acessar esta área"
>
  <AdminPanel />
</PermissionGate>

// ❌ Ruim: Sem feedback
<PermissionGate requiredRole="admin" hideOnDenied>
  <AdminPanel />
</PermissionGate>
```

### 4. Performance
```typescript
// ✅ Bom: Verificação única no topo
const MyComponent = () => {
  const { hasPermission } = useAdminGuard();
  
  if (!hasPermission) return null;
  
  return <AdminContent />;
};

// ❌ Ruim: Múltiplas verificações
const MyComponent = () => {
  const permissions = usePermissions();
  
  return (
    <div>
      {permissions.isAdmin() && <Section1 />}
      {permissions.isAdmin() && <Section2 />}
      {permissions.isAdmin() && <Section3 />}
    </div>
  );
};
```

## Matriz de Permissões

| Role | Fiscal | Financeiro | Produção | Workflow | Admin |
|------|--------|------------|----------|----------|-------|
| owner | admin | admin | admin | admin | admin |
| admin | admin | admin | admin | admin | write |
| manager | write | read | write | write | none |
| user | read | none | write | write | none |
| viewer | read | read | read | read | none |

## Troubleshooting

### Problema: Permissão não funciona
1. Verifique se o usuário está autenticado
2. Verifique se o usuário pertence a uma organização
3. Verifique se o role está correto na tabela `organization_users`
4. Verifique se a verificação está usando os parâmetros corretos

### Problema: Redirecionamento infinito
1. Verifique se a rota de redirecionamento não tem proteção
2. Use `showErrorPage` ao invés de redirecionamento
3. Verifique se há conflitos entre guards

### Problema: Performance lenta
1. Use `hideOnDenied` para evitar renderização desnecessária
2. Faça verificações no topo do componente
3. Use `usePermissionCheck` para verificações simples

## Migração de Componentes Existentes

Para migrar componentes existentes:

1. **Identifique a proteção necessária**
   - Que roles podem acessar?
   - Que módulo/nível é necessário?

2. **Adicione as importações**
   ```typescript
   import { PermissionGate } from '@/components/auth/PermissionGate';
   import { useAdminGuard } from '@/hooks/useRoleGuard';
   ```

3. **Aplique a proteção**
   ```typescript
   // Antes
   export const AdminComponent = () => {
     return <AdminContent />;
   };
   
   // Depois
   export const AdminComponent = () => {
     const { hasPermission } = useAdminGuard();
     
     if (!hasPermission) return null;
     
     return <AdminContent />;
   };
   ```

4. **Teste as permissões**
   - Teste com diferentes roles
   - Verifique redirecionamentos
   - Confirme feedback ao usuário

## Arquivos Criados/Modificados

### Novos Arquivos
- `src/hooks/usePermissions.ts` - Hook principal de permissões
- `src/components/auth/PermissionGate.tsx` - Componente de controle de acesso
- `src/hooks/useRoleGuard.ts` - Hooks para proteção de rotas
- `src/components/auth/ProtectedRoute.tsx` - Componente de rota protegida melhorado
- `src/examples/PermissionExamples.tsx` - Exemplos de uso

### Arquivos Modificados
- `src/components/AppSidebar.tsx` - Adicionados guards nos menus
- `src/components/admin/KPIAdmin.tsx` - Adicionada proteção admin
- `src/components/admin/ReportCatalogAdmin.tsx` - Adicionada proteção admin

Este sistema de permissões fornece uma camada robusta de controle de acesso no frontend, complementando perfeitamente a segurança implementada no backend com Supabase RLS.
