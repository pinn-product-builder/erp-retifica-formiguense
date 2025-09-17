# Correções na Estrutura do Banco de Dados

## 🚨 Problemas Identificados

Após análise da documentação na pasta `proj_docs` e comparação com as migrações atuais, foram identificadas várias inconsistências na estrutura do banco de dados.

### 1. **Tabela `profiles` - Estrutura Conflitante**

#### Problema:
Duas migrações criaram estruturas diferentes para a mesma tabela:

**Migração 1** (`20250722125137`):
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,  -- PK = user_id
  name TEXT,
  email TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'user'
);
```

**Migração 2** (`20250724135517`):
```sql
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,           -- PK ≠ user_id
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),          -- FK separada
  name TEXT,
  role TEXT DEFAULT 'employee'
);
```

#### Solução:
Padronizar com a estrutura da Migração 2 (mais correta):
- `id`: UUID próprio (PK)
- `user_id`: Referência para `auth.users(id)` (FK)

### 2. **Inconsistência nos Nomes de Colunas**

#### Problema:
- **Documentação**: `org_id` 
- **Implementação**: `organization_id`

#### Solução:
Manter `organization_id` (já implementado nas migrações)

### 3. **Hook `useUserManagement` Usando Estrutura Incorreta**

#### Problema:
O hook estava fazendo join incorreto com a tabela `profiles`:
```typescript
profiles!inner(
  user_id,  // Pode não existir se usando estrutura da Migração 1
  name,
  email
)
```

#### Solução:
Atualizado para usar a estrutura correta:
```typescript
profiles!inner(
  id,
  user_id,
  name,
  email
)
```

## 🔧 Correções Implementadas

### 1. **Migração de Correção**
Criado arquivo: `supabase/migrations/fix_user_tables_structure.sql`

**O que faz:**
- ✅ Recria a tabela `profiles` com estrutura consistente
- ✅ Garante que `organization_users` tem todas as colunas necessárias
- ✅ Atualiza funções SQL para usar nomes corretos
- ✅ Cria índices para performance
- ✅ Configura RLS policies corretas

### 2. **Hook `useUserManagement` Atualizado**
- ✅ Corrigido join com tabela `profiles`
- ✅ Removida criação manual de perfil (usa trigger automático)
- ✅ Estrutura de dados consistente

### 3. **Script de Aplicação**
Criado: `scripts/fix-database-structure.ts`
- ✅ Aplica a migração automaticamente
- ✅ Verifica a estrutura após aplicação
- ✅ Testa funções do banco

## 📋 Estrutura Final Correta

### Tabela `profiles`
```sql
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### Tabela `organization_users`
```sql
CREATE TABLE public.organization_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  invited_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
```

## 🚀 Como Aplicar as Correções

### Opção 1: Usando Supabase CLI
```bash
# Aplicar a migração
supabase db push

# Regenerar types
npm run types:generate
```

### Opção 2: Usando o Script
```bash
# Executar script de correção
npx tsx scripts/fix-database-structure.ts

# Regenerar types
npm run types:generate
```

### Opção 3: Manual via Dashboard
1. Abrir Supabase Dashboard
2. Ir em SQL Editor
3. Copiar conteúdo de `fix_user_tables_structure.sql`
4. Executar

## ✅ Verificações Pós-Aplicação

Após aplicar as correções, verificar:

1. **Estrutura das Tabelas**
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name IN ('profiles', 'organization_users') 
   AND table_schema = 'public';
   ```

2. **Funções SQL**
   ```sql
   SELECT current_org_id();
   SELECT is_org_member('uuid-da-org');
   ```

3. **Tela de Gestão de Usuários**
   - Acessar `/gestao-usuarios`
   - Testar criação de usuário
   - Verificar listagem

4. **Regenerar Types**
   ```bash
   npm run types:generate
   ```

## 🔒 Impacto na Segurança

As correções **mantêm** todas as políticas de segurança:
- ✅ RLS habilitado
- ✅ Políticas de isolamento por organização
- ✅ Verificações de permissão
- ✅ Triggers de auditoria

## 📝 Documentação Atualizada

A documentação em `proj_docs/architecture/database-schema.md` está **correta** e reflete a estrutura final após as correções.

## ⚠️ Cuidados

1. **Backup**: Sempre fazer backup antes de aplicar
2. **Teste**: Testar em ambiente de desenvolvimento primeiro
3. **Types**: Regenerar types do TypeScript após aplicar
4. **Cache**: Limpar cache do navegador se necessário

## 🎯 Resultado Final

Após aplicar as correções:
- ✅ Estrutura consistente entre documentação e implementação
- ✅ Tela de Gestão de Usuários funcionando corretamente
- ✅ Sistema de permissões integrado
- ✅ Performance otimizada com índices
- ✅ Segurança mantida com RLS
