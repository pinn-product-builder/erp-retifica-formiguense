# Sistema de Multitenancy

## Visão Geral

O ERP Retífica foi projetado desde o início com arquitetura multitenancy, permitindo que múltiplas organizações utilizem o mesmo sistema de forma completamente isolada e segura.

## Estrutura de Organizações

### Tabelas Principais

#### `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `organization_users`
```sql
CREATE TABLE organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Isolamento de Dados

### Row Level Security (RLS)

Todas as tabelas do sistema implementam RLS com base no `org_id`:

```sql
-- Exemplo de política RLS
CREATE POLICY "org_isolation_select" ON table_name
  FOR SELECT USING (org_id = current_org_id());

CREATE POLICY "org_isolation_insert" ON table_name
  FOR INSERT WITH CHECK (org_id = current_org_id());
```

### Função `current_org_id()`

```sql
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT org_id 
    FROM organization_users 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Contexto de Organização

### OrganizationContext

```typescript
interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  switchOrganization: (orgId: string) => Promise<void>;
  isLoading: boolean;
}
```

### Seletor de Organização

O componente `OrganizationSelector` permite que usuários alternem entre organizações das quais fazem parte.

## Níveis de Acesso

### Roles por Organização

- **owner**: Proprietário da organização (acesso total)
- **admin**: Administrador (acesso a configurações)
- **manager**: Gerente (acesso a relatórios e gestão)
- **user**: Usuário padrão (acesso operacional)
- **viewer**: Visualizador (somente leitura)

### Permissões por Módulo

Cada módulo pode ter permissões específicas:

```typescript
interface ModulePermissions {
  fiscal: PermissionLevel;
  financial: PermissionLevel;
  production: PermissionLevel;
  workflow: PermissionLevel;
  // ... outros módulos
}

type PermissionLevel = 'none' | 'read' | 'write' | 'admin';
```

## Configurações por Organização

### Personalização

Cada organização pode personalizar:

- **Branding**: Logo, cores, nome
- **Módulos**: Habilitar/desabilitar funcionalidades
- **Workflow**: Configurar processos específicos
- **Relatórios**: Personalizar dashboards

### Exemplo de Settings

```json
{
  "branding": {
    "logo": "url-do-logo",
    "primaryColor": "#1a365d",
    "companyName": "Retífica ABC"
  },
  "modules": {
    "fiscal": true,
    "financial": true,
    "production": false
  },
  "preferences": {
    "dateFormat": "dd/MM/yyyy",
    "currency": "BRL",
    "timezone": "America/Sao_Paulo"
  }
}
```

## Migração e Backup

### Backup por Organização

```sql
-- Backup de uma organização específica
pg_dump --where="org_id='org-uuid'" database_name
```

### Migração de Dados

O sistema suporta migração de dados entre organizações com ferramentas dedicadas para:

- Exportação de dados
- Importação com mapeamento
- Validação de integridade

## Monitoramento

### Métricas por Organização

- Número de usuários ativos
- Volume de transações
- Uso de storage
- Performance por tenant

### Auditoria

Todas as ações são auditadas com contexto organizacional:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Escalabilidade

### Estratégias de Otimização

1. **Índices por Organização**: Todos os índices incluem `org_id`
2. **Particionamento**: Tabelas grandes podem ser particionadas por organização
3. **Cache**: Cache específico por tenant
4. **Rate Limiting**: Limites por organização

### Considerações de Performance

- Consultas sempre filtradas por `org_id`
- Conexões dedicadas para organizações grandes
- Monitoramento de performance por tenant