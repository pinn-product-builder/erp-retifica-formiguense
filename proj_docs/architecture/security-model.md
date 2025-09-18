# Modelo de Segurança

## Visão Geral

O ERP Retífica implementa um modelo de segurança multicamadas, combinando autenticação robusta, autorização granular e isolamento de dados através de Row Level Security (RLS).

## Autenticação

### Supabase Auth

O sistema utiliza Supabase Auth como provedor principal de autenticação, oferecendo:

- **Email/Senha**: Autenticação tradicional
- **OAuth**: Google, GitHub, Azure AD
- **Magic Links**: Acesso sem senha
- **2FA**: Autenticação de dois fatores (opcional)

### Configuração de Autenticação

```typescript
// Configuração do cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
```

### Sessões e Tokens

- **Access Token**: JWT com validade de 1 hora
- **Refresh Token**: Token de longa duração para renovação
- **Rotação Automática**: Tokens são renovados automaticamente

## Autorização

### Criação de Organizações

#### Sistema de Super Usuários

**Apenas Super Usuários podem criar organizações:**

```sql
-- Nova política: apenas super usuários podem criar organizações
CREATE POLICY "super_users_can_create_organizations" ON public.organizations
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND 
    public.can_create_organizations(auth.uid())
  );
```

#### Tipos de Super Usuário

```sql
CREATE TYPE public.super_user_type AS ENUM ('platform_admin', 'organization_creator');
```

- **`platform_admin`**: Administrador da plataforma
  - Pode criar organizações
  - Pode gerenciar outros super usuários
  - Pode aprovar/rejeitar solicitações de acesso
  - Acesso total ao sistema

- **`organization_creator`**: Criador de organizações
  - Pode criar organizações
  - Não pode gerenciar outros super usuários
  - Foco na criação e gestão de organizações

#### Processo de Solicitação

1. **Usuário acessa** `/super-user-signup`
2. **Preenche formulário** com justificativa
3. **Solicitação é enviada** para análise
4. **Platform Admin** revisa e aprova/rejeita
5. **Se aprovado**, usuário recebe instruções para criar conta

```typescript
// Fluxo de solicitação
const submitSuperUserRequest = async (data: SuperUserSignupData) => {
  const { error } = await supabase
    .from('super_user_signup_requests')
    .insert({
      email: data.email,
      name: data.name,
      company_name: data.company_name,
      requested_type: data.requested_type,
      message: data.message
    });
};
```

#### Processo de Criação de Organização (Atualizado)

1. **Super usuário** inicia criação
2. **Sistema verifica** se é super usuário ativo
3. **Se autorizado**, cria organização
4. **Criador torna-se OWNER** da organização
5. **Pode convidar outros usuários** com diferentes roles

```typescript
// Processo atualizado com verificação
const createOrganization = async (name: string, description?: string) => {
  // 1. Verificar se é super usuário
  const { data: canCreate } = await supabase
    .rpc('can_create_organizations', { user_uuid: user.id });

  if (!canCreate) {
    throw new Error('Apenas super usuários podem criar organizações');
  }

  // 2. Criar organização
  const org = await supabase
    .from('organizations')
    .insert({ name, slug: generateSlug(name), description, created_by: user.id });

  // 3. Adicionar criador como OWNER
  await supabase
    .from('organization_users')
    .insert({ organization_id: org.id, user_id: user.id, role: 'owner' });
};
```

#### Implicações de Segurança

- 🔒 **Restritivo**: Apenas super usuários podem criar organizações
- ✅ **Controlado**: Processo de aprovação manual
- ✅ **Auditável**: Todas as solicitações são registradas
- ✅ **Escalável**: Permite diferentes tipos de super usuários
- ⚠️ **Processo Manual**: Requer aprovação de platform admin

### Modelo RBAC (Role-Based Access Control)

#### Níveis de Acesso por Organização

```typescript
type OrganizationRole = 
  | 'owner'    // Proprietário (acesso total)
  | 'admin'    // Administrador (gestão completa)
  | 'manager'  // Gerente (supervisão e relatórios)
  | 'user'     // Usuário padrão (operacional)
  | 'viewer'   // Visualizador (somente leitura)
```

#### Permissões por Módulo

```typescript
interface ModulePermissions {
  fiscal: PermissionLevel;
  financial: PermissionLevel;
  production: PermissionLevel;
  workflow: PermissionLevel;
  orders: PermissionLevel;
  purchasing: PermissionLevel;
  inventory: PermissionLevel;
  hr: PermissionLevel;
  reports: PermissionLevel;
  admin: PermissionLevel;
}

type PermissionLevel = 'none' | 'read' | 'write' | 'admin';
```

### Matriz de Permissões

| Role | Fiscal | Financeiro | Produção | Workflow | Admin |
|------|--------|------------|----------|----------|-------|
| owner | admin | admin | admin | admin | admin |
| admin | admin | admin | admin | admin | write |
| manager | write | read | write | write | none |
| user | read | none | write | write | none |
| viewer | read | read | read | read | none |

### Sistema de Perfis de Usuário (Profile-Based Permissions)

#### Visão Geral

O sistema implementa um modelo híbrido que combina **RBAC tradicional** com **permissões específicas por página** através de perfis de usuário:

```typescript
interface UserProfile {
  id: string;
  name: string;
  description?: string;
  sector_id: string;
  org_id: string;
  is_active: boolean;
}

interface ProfilePagePermission {
  profile_id: string;
  page_id: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}
```

#### Estrutura do Sistema de Perfis

1. **Setores de Usuário** (`user_sectors`)
   - Agrupam perfis por departamento/área
   - Permitem organização visual (cores)
   - Facilitam gestão hierárquica

2. **Perfis de Usuário** (`user_profiles`)
   - Definem conjuntos específicos de permissões
   - Vinculados a um setor
   - Podem ter permissões granulares por página

3. **Páginas do Sistema** (`system_pages`)
   - Cadastro centralizado de todas as rotas
   - Mapeamento para módulos existentes
   - Controle de ativação/desativação

4. **Permissões de Página** (`profile_page_permissions`)
   - Granularidade: visualizar, editar, excluir
   - Específicas por perfil e página
   - Sobrepõem permissões de role quando definidas

#### Fluxo de Autorização

```typescript
// Ordem de verificação de permissões
const canAccessPage = (routePath: string): boolean => {
  // 1. Verificar se usuário está autenticado
  if (!user) return false;

  // 2. Se não tem organização, apenas dashboard
  if (!currentOrganization) return routePath === '/dashboard';

  // 3. Se tem perfil específico, usar permissões do perfil
  if (userProfile && pagePermissions.length > 0) {
    const pagePermission = pagePermissions.find(p => p.page?.route_path === routePath);
    if (pagePermission) {
      return pagePermission.can_view;
    }
  }

  // 4. Fallback para permissões baseadas em role
  const module = PAGE_MODULE_MAPPING[routePath];
  if (module) {
    return basePermissions.canAccessModule(module);
  }

  // 5. Permitir acesso por padrão se não há restrições
  return true;
};
```

#### Vantagens do Sistema Híbrido

- **Flexibilidade**: Combina roles gerais com permissões específicas
- **Granularidade**: Controle fino por página/funcionalidade
- **Escalabilidade**: Fácil adição de novas páginas e permissões
- **Compatibilidade**: Mantém sistema RBAC existente como fallback
- **Organização**: Setores facilitam gestão hierárquica

## Row Level Security (RLS)

### Isolamento por Organização

Todas as tabelas implementam RLS para garantir isolamento completo entre organizações:

```sql
-- Exemplo de política RLS padrão
CREATE POLICY "org_isolation_policy" ON table_name
  FOR ALL USING (org_id = current_org_id());
```

### Função `current_org_id()`

```sql
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS UUID AS $$
DECLARE
  org_uuid UUID;
BEGIN
  SELECT org_id INTO org_uuid
  FROM organization_users 
  WHERE user_id = auth.uid()
  AND is_active = TRUE
  LIMIT 1;
  
  RETURN org_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Políticas Específicas por Módulo

#### Módulo Financeiro

```sql
-- Usuários só veem dados financeiros se tiverem permissão
CREATE POLICY "financial_access_policy" ON financial_entries
  FOR SELECT USING (
    org_id = current_org_id() AND
    user_has_permission(auth.uid(), 'financial', 'read')
  );
```

#### Módulo de Workflow

```sql
-- Usuários só veem tarefas atribuídas a eles ou públicas
CREATE POLICY "workflow_task_visibility" ON workflow_tasks
  FOR SELECT USING (
    org_id = current_org_id() AND (
      assigned_to = auth.uid() OR
      is_public = TRUE OR
      user_has_permission(auth.uid(), 'workflow', 'admin')
    )
  );
```

## Auditoria e Logs

### Sistema de Auditoria

Todas as operações são registradas na tabela `audit_logs`:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'SELECT'
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Trigger de Auditoria

```sql
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  -- Registra todas as operações de modificação
  IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
    INSERT INTO audit_logs (
      org_id, user_id, action, table_name, record_id,
      old_data, new_data, ip_address
    ) VALUES (
      COALESCE(NEW.org_id, OLD.org_id),
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) END,
      CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) END,
      inet_client_addr()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Proteção de Dados

### LGPD Compliance

#### Dados Pessoais Identificados

```typescript
interface PersonalDataFields {
  // Dados claramente pessoais
  cpf: string;
  email: string;
  phone: string;
  name: string;
  
  // Dados sensíveis
  salary: number;
  healthData?: any;
  biometricData?: any;
}
```

#### Direitos dos Titulares

```typescript
interface DataSubjectRights {
  access: () => Promise<PersonalData>;      // Direito de acesso
  rectification: (data: any) => Promise<void>; // Direito de retificação
  erasure: () => Promise<void>;             // Direito ao esquecimento
  portability: () => Promise<ExportData>;   // Portabilidade
  objection: () => Promise<void>;           // Direito de oposição
}
```

### Criptografia

#### Dados em Trânsito

- **HTTPS/TLS 1.3**: Todas as comunicações
- **Certificate Pinning**: Aplicações móveis
- **HSTS**: Headers de segurança

#### Dados em Repouso

```sql
-- Campos sensíveis criptografados
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Exemplo de campo criptografado
ALTER TABLE employees 
ADD COLUMN encrypted_salary TEXT;

-- Função para criptografar
CREATE OR REPLACE FUNCTION encrypt_salary(salary DECIMAL)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_encrypt(salary::TEXT, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql;
```

## Segurança da API

### Rate Limiting

```typescript
// Configuração de rate limiting por usuário/IP
const rateLimits = {
  general: { requests: 100, window: '15m' },
  auth: { requests: 5, window: '15m' },
  sensitive: { requests: 10, window: '1h' }
};
```

### Validação de Entrada

```typescript
// Validação com Zod
const userSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional()
});
```

### Headers de Segurança

```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

## Monitoramento de Segurança

### Alertas Automáticos

```sql
-- Detectar tentativas de acesso suspeitas
CREATE OR REPLACE FUNCTION detect_suspicious_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Múltiplas tentativas de login falhidas
  IF (SELECT COUNT(*) FROM auth_failures 
      WHERE user_id = NEW.user_id 
      AND created_at > NOW() - INTERVAL '15 minutes') > 5 THEN
    
    INSERT INTO security_alerts (
      alert_type, user_id, description, severity
    ) VALUES (
      'BRUTE_FORCE', NEW.user_id, 
      'Multiple failed login attempts', 'HIGH'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Dashboard de Segurança

Métricas monitoradas:

- **Tentativas de login falhadas**
- **Acessos de IPs suspeitos**
- **Operações sensíveis**
- **Violações de RLS**
- **Uso anômalo de recursos**

## Incident Response

### Plano de Resposta

1. **Detecção**: Alertas automáticos e monitoramento
2. **Análise**: Investigação inicial do incidente
3. **Contenção**: Bloqueio imediato de ameaças
4. **Erradicação**: Remoção da causa raiz
5. **Recuperação**: Restauração dos serviços
6. **Lições Aprendidas**: Documentação e melhorias

### Procedimentos de Emergency

```sql
-- Suspender usuário em caso de comprometimento
CREATE OR REPLACE FUNCTION emergency_suspend_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE organization_users 
  SET is_active = FALSE 
  WHERE user_id = user_uuid;
  
  INSERT INTO security_alerts (
    alert_type, user_id, description, severity
  ) VALUES (
    'EMERGENCY_SUSPENSION', user_uuid,
    'User suspended due to security incident', 'CRITICAL'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Compliance e Certificações

### Frameworks Seguidos

- **LGPD**: Lei Geral de Proteção de Dados
- **ISO 27001**: Gestão de Segurança da Informação
- **OWASP Top 10**: Vulnerabilidades web mais críticas
- **SOC 2**: Controles de segurança organizacional

### Auditorias Regulares

- **Pentests**: Testes de penetração trimestrais
- **Code Review**: Revisão de código de segurança
- **Vulnerability Scanning**: Scans automatizados
- **Compliance Audits**: Auditorias de conformidade