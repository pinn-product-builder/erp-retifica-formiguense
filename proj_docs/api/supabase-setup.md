# Configuração do Supabase

## Visão Geral

Este guia detalha a configuração completa do Supabase para o ERP Retífica, incluindo database setup, autenticação, edge functions e políticas de segurança.

## Configuração Inicial

### 1. Criação do Projeto

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Link com projeto existente
supabase link --project-ref your-project-ref
```

### 2. Configuração Local

```bash
# Inicializar projeto local
supabase init

# Iniciar containers locais
supabase start

# Status dos serviços
supabase status
```

## Configuração do Banco de Dados

### Schema Principal

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função para current_org_id
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT org_id 
    FROM organization_users 
    WHERE user_id = auth.uid()
    AND is_active = TRUE
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Migrações

```bash
# Criar nova migração
supabase migration new create_organizations_table

# Aplicar migrações
supabase db push

# Reset database (desenvolvimento)
supabase db reset
```

## Configuração de Autenticação

### Providers OAuth

```sql
-- Configurar providers no dashboard
-- Google OAuth
INSERT INTO auth.providers (name, enabled) VALUES ('google', true);

-- Azure AD
INSERT INTO auth.providers (name, enabled) VALUES ('azure', true);
```

### Email Templates

```html
<!-- Confirmação de email -->
<h2>Confirme seu email</h2>
<p>Clique no link abaixo para confirmar sua conta:</p>
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
```

### Hooks de Autenticação

```sql
-- Trigger para criar perfil automático
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Edge Functions

### Setup Básico

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Função de Exemplo

```typescript
// supabase/functions/generate-report/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { method } = req

  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabase
      .from('financial_entries')
      .select('*')
      .eq('org_id', req.headers.get('org-id'))

    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

## Row Level Security (RLS)

### Políticas Padrão

```sql
-- Template para todas as tabelas
CREATE POLICY "Enable read access for organization users" ON table_name
  FOR SELECT USING (org_id = current_org_id());

CREATE POLICY "Enable insert for organization users" ON table_name
  FOR INSERT WITH CHECK (org_id = current_org_id());

CREATE POLICY "Enable update for organization users" ON table_name
  FOR UPDATE USING (org_id = current_org_id());

CREATE POLICY "Enable delete for organization users" ON table_name
  FOR DELETE USING (org_id = current_org_id());
```

### Políticas Específicas

```sql
-- Acesso baseado em role
CREATE POLICY "Admin full access" ON sensitive_table
  FOR ALL USING (
    org_id = current_org_id() AND
    user_role() IN ('owner', 'admin')
  );

-- Acesso a próprios registros
CREATE POLICY "Own records only" ON user_specific_table
  FOR ALL USING (
    org_id = current_org_id() AND
    user_id = auth.uid()
  );
```

## Storage

### Buckets Configuration

```sql
-- Criar buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('documents', 'documents', false),
  ('reports', 'reports', false);
```

### Políticas de Storage

```sql
-- Avatars públicos
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Documentos privados por organização
CREATE POLICY "Organization documents access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = current_org_id()::text
  );
```

## Configuração de Produção

### Variáveis de Ambiente

```env
# Projeto
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Edge Functions
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

### Rate Limiting

```sql
-- Configurar rate limiting
ALTER ROLE authenticator SET pgrst.db_max_rows = 1000;
```

### Monitoring

```sql
-- Query para monitorar performance
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;
```

## Backup e Recovery

### Backup Automático

```bash
# Backup via CLI
supabase db dump --file backup.sql

# Restore
psql -h db.your-ref.supabase.co -U postgres -d postgres -f backup.sql
```

### Point-in-Time Recovery

```sql
-- Configurar retenção de WAL
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
```

## Troubleshooting

### Problemas Comuns

1. **RLS não funcionando**
   ```sql
   -- Verificar se RLS está habilitado
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'your_table';
   ```

2. **Edge Function timeout**
   ```typescript
   // Aumentar timeout (máx 300s)
   const controller = new AbortController();
   setTimeout(() => controller.abort(), 25000);
   ```

3. **Rate limiting**
   ```typescript
   // Implementar retry com backoff
   const retryWithBackoff = async (fn: Function, retries = 3) => {
     for (let i = 0; i < retries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
       }
     }
   };
   ```

## Comandos Úteis

```bash
# Ver logs em tempo real
supabase functions logs --follow

# Deploy function específica
supabase functions deploy function-name

# Ver status do banco
supabase db status

# Gerar tipos TypeScript
supabase gen types typescript --local > src/types/database.types.ts
```