# Verificação de Banco de Dados (Supabase)

## 🎯 Objetivo
Garantir que todas as mudanças no banco de dados sejam bem planejadas, documentadas e não causem duplicações ou conflitos.

## 📋 Checklist Antes de Criar Estruturas

### Antes de criar novas tabelas, colunas, policies ou relacionamentos:

1. **Verifique o schema existente no Supabase**
   - Use `mcp_supabase_list_tables` para listar tabelas
   - Use `mcp_supabase_execute_sql` para consultar estruturas
   - Consulte `information_schema.columns` para verificar colunas
   - Consulte `information_schema.tables` para verificar tabelas

2. **Confirme se já existe uma estrutura ou campo que atenda à necessidade**
   - Procure por tabelas com nomes similares
   - Verifique se colunas já existem em outras tabelas
   - Analise se é possível reutilizar estruturas existentes

3. **Analise dependências**
   - Foreign keys: Verifique relacionamentos existentes
   - Views: Identifique views que podem ser afetadas
   - Triggers: Verifique triggers relacionados
   - Functions RPC: Analise funções que usam as tabelas

4. **Evite duplicar estruturas ou nomes semelhantes**
   - Não crie `budgets` se já existe `detailed_budgets`
   - Não use `total_value` se já existe `total_amount`
   - Mantenha consistência de nomenclatura

## 🔧 Se for necessária alteração de schema:

### 1. Proposta de Migration
```sql
-- Nome descritivo: YYYYMMDDHHMMSS_descricao_clara.sql
-- Exemplo: 20251006120000_add_customer_feedback_table.sql

-- Comentário explicando o propósito
-- Impacto: [Descrever impacto em tabelas, views, functions]
-- Justificativa: [Por que essa mudança é necessária]

-- Migration code here
```

### 2. Documentação
- Atualize a documentação do módulo afetado
- Documente novos campos e seus propósitos
- Atualize diagramas ER se aplicável

### 3. Policies (RLS)
- Se criar novas tabelas, crie policies RLS
- Verifique se policies existentes precisam ser atualizadas
- Teste as policies com diferentes perfis de usuário

### 4. Rastreabilidade
- Toda mudança deve ter uma migration
- Migrations devem ser reversíveis quando possível
- Documente o motivo da mudança no commit

## ✅ Exemplo de Verificação Correta

```sql
-- 1. Verificar se a tabela já existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%feedback%';

-- 2. Verificar estrutura de tabelas relacionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 3. Verificar relacionamentos
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'orders';
```

## ❌ Erros Comuns a Evitar

1. **Assumir nomes de colunas sem verificar**
   - ❌ Usar `total_value` sem verificar
   - ✅ Consultar schema e usar `total_amount`

2. **Criar tabelas duplicadas**
   - ❌ Criar `budgets` quando `detailed_budgets` já existe
   - ✅ Verificar tabelas existentes primeiro

3. **Ignorar relacionamentos**
   - ❌ Criar coluna sem foreign key
   - ✅ Analisar dependências e criar constraints

4. **Não documentar mudanças**
   - ❌ Migration sem comentários
   - ✅ Migration bem documentada com impacto e justificativa

## 🔍 Ferramentas Disponíveis

### MCP Supabase Tools
- `mcp_supabase_list_tables` - Lista todas as tabelas
- `mcp_supabase_execute_sql` - Executa queries SQL
- `mcp_supabase_apply_migration` - Aplica migrations
- `mcp_supabase_list_migrations` - Lista migrations aplicadas

### Queries Úteis
```sql
-- Listar todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Listar colunas de uma tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'nome_da_tabela'
ORDER BY ordinal_position;

-- Listar foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- Listar functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

## 📝 Template de Migration

```sql
-- Migration: [Nome Descritivo]
-- Data: [YYYY-MM-DD]
-- Autor: [Nome]
-- 
-- Descrição:
-- [Descrever o que a migration faz]
--
-- Impacto:
-- - Tabelas afetadas: [listar]
-- - Views afetadas: [listar]
-- - Functions afetadas: [listar]
-- - Políticas RLS afetadas: [listar]
--
-- Justificativa:
-- [Por que essa mudança é necessária]
--
-- Reversão:
-- [Como reverter se necessário]

-- Migration code
BEGIN;

-- Seu código aqui

COMMIT;
```

## 🎓 Lições Aprendidas

### Caso 1: Ordens sem valor total
- **Problema**: Assumimos que `orders` tinha `total_value`
- **Realidade**: Valores estão em `detailed_budgets.total_amount`
- **Lição**: Sempre verificar schema antes de criar queries

### Caso 2: Status de orçamentos
- **Problema**: Assumimos status `aprovado`
- **Realidade**: Status é `approved` (em inglês)
- **Lição**: Verificar valores reais nas tabelas, não apenas estrutura

### Caso 3: Filtro por organização
- **Problema**: Algumas tabelas têm `org_id`, outras não
- **Realidade**: `budgets` não tem `org_id`, mas `detailed_budgets` tem
- **Lição**: Verificar relacionamentos para entender como filtrar

---

**Última atualização**: 2025-10-06
**Versão**: 1.0
