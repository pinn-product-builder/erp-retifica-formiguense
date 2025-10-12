# 🚀 Guia de Deploy - Módulos de Estoque e Compras

**Status:** ✅ Código implementado - ⏳ Aguardando aplicação de migrations

---

## ✅ O Que Já Foi Feito

### Frontend
- ✅ **Rota adicionada** em `src/App.tsx` → `/inventario`
- ✅ **4 Hooks** criados e prontos
- ✅ **7 Componentes** criados e prontos
- ✅ **Página Inventario** criada e roteada
- ✅ **Tipagem TypeScript** completa

### Backend
- ✅ **4 Migrations** criadas (arquivos .sql prontos)
- ⏳ **Migrations ainda não aplicadas** no banco de dados

---

## 📋 Migrations a Serem Aplicadas

**Execute na ordem:**

### 1. Sistema de Movimentação de Estoque
```
📄 supabase/migrations/20250112000000_inventory_movements_system.sql
```
**Cria:**
- Tabela `inventory_movements`
- Trigger `validate_inventory_movement`
- Trigger `update_inventory_on_movement`
- Functions de validação e atualização automática

---

### 2. Sistema de Inventário Físico
```
📄 supabase/migrations/20250112000001_inventory_counts_system.sql
```
**Cria:**
- Tabela `inventory_counts`
- Tabela `inventory_count_items`
- Function `generate_inventory_count_number()`
- Function `process_inventory_count_adjustments()`

---

### 3. Sistema de Recebimento de Compras
```
📄 supabase/migrations/20250112000002_purchase_receipts_system.sql
```
**Cria:**
- Tabela `purchase_receipts`
- Tabela `purchase_receipt_items`
- Function `generate_receipt_number()`
- Trigger `update_po_on_receipt`

---

### 4. Integração Compras → Estoque
```
📄 supabase/migrations/20250112000003_purchase_inventory_integration.sql
```
**Cria:**
- Campo `part_id` em `purchase_order_items`
- Trigger `create_inventory_entry` (entrada automática no estoque)
- Function `create_inventory_entry_on_receipt()`

---

## 🔧 Como Aplicar as Migrations

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Para cada arquivo de migration (na ordem):
   - Abra o arquivo `.sql` localmente
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em **Run**
   - Aguarde confirmação de sucesso

**Ordem de execução:**
```
1. 20250112000000_inventory_movements_system.sql
2. 20250112000001_inventory_counts_system.sql
3. 20250112000002_purchase_receipts_system.sql
4. 20250112000003_purchase_inventory_integration.sql
```

---

### Opção 2: Via Supabase CLI

Se você tem o Supabase CLI instalado:

```bash
# 1. Navegar para o diretório do projeto
cd /Users/danielvictor/Desktop/projetos/erp-retifica-formiguense

# 2. Garantir que está linkado ao projeto correto
supabase link --project-ref YOUR_PROJECT_REF

# 3. Aplicar todas as migrations pendentes
supabase db push

# Ou aplicar migration específica
supabase db execute --file supabase/migrations/20250112000000_inventory_movements_system.sql
```

---

### Opção 3: Via MCP (Limitado)

⚠️ **Nota:** O MCP Supabase não possui comando para executar migrations completas, apenas queries individuais. Para migrations, use Dashboard ou CLI.

---

## ✅ Verificação Pós-Deploy

Execute estas queries no SQL Editor para confirmar:

```sql
-- 1. Verificar se tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'inventory_movements',
    'inventory_counts',
    'inventory_count_items',
    'purchase_receipts',
    'purchase_receipt_items'
  );

-- 2. Verificar functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN (
    'generate_inventory_count_number',
    'process_inventory_count_adjustments',
    'generate_receipt_number',
    'create_inventory_entry_on_receipt',
    'update_inventory_on_movement',
    'validate_inventory_movement'
  );

-- 3. Verificar triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_validate_inventory_movement',
    'trigger_update_inventory_on_movement',
    'trigger_create_inventory_entry',
    'trigger_update_po_on_receipt'
  );

-- 4. Verificar RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'inventory_movements',
    'inventory_counts',
    'purchase_receipts'
  );
```

**Resultado esperado:**
- ✅ 5 tabelas criadas
- ✅ 6 functions criadas
- ✅ 4 triggers ativos
- ✅ Múltiplas RLS policies (pelo menos 2 por tabela)

---

## 🧪 Teste Básico Após Deploy

### 1. Testar Frontend
```
# No navegador
http://localhost:5173/inventario
```
**Esperado:** Página carrega sem erros

---

### 2. Testar Movimentação no Banco

```sql
-- Inserir uma peça de teste (se não existir)
INSERT INTO parts_inventory (
  org_id,
  part_code,
  part_name,
  quantity,
  unit_cost,
  status
) VALUES (
  'sua-org-id-aqui',
  'TEST-001',
  'Peça de Teste',
  10,
  50.00,
  'disponivel'
) RETURNING id;

-- Testar movimentação (use o ID retornado acima)
INSERT INTO inventory_movements (
  org_id,
  part_id,
  movement_type,
  quantity,
  previous_quantity,
  new_quantity,
  reason,
  created_by
) VALUES (
  'sua-org-id-aqui',
  'id-da-peca-acima',
  'entrada',
  5,
  10,
  15,
  'Teste de entrada',
  auth.uid()
);

-- Verificar se o trigger atualizou a quantidade
SELECT part_name, quantity 
FROM parts_inventory 
WHERE part_code = 'TEST-001';

-- Resultado esperado: quantity = 15
```

---

## 🔐 Verificar Segurança (RLS)

```sql
-- 1. Confirmar que RLS está ativado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename = 'inventory_movements';

-- Resultado esperado: rowsecurity = true

-- 2. Testar acesso multi-tenant
-- (como usuário autenticado de uma org)
SELECT * FROM inventory_movements LIMIT 1;

-- Deve retornar apenas movimentações da organização do usuário
```

---

## 🚨 Troubleshooting

### Erro: "relation already exists"
**Causa:** Tabela já existe (migration foi aplicada antes)  
**Solução:** Verificar se migration foi aplicada corretamente

### Erro: "function does not exist"
**Causa:** Migration anterior falhou  
**Solução:** Aplicar migrations na ordem correta

### Erro: "permission denied"
**Causa:** RLS bloqueando acesso  
**Solução:** Verificar se usuário está vinculado a uma organização

### Frontend não carrega dados
**Causa:** Tabelas não criadas ou RLS mal configurado  
**Solução:** 
1. Verificar migrations aplicadas
2. Verificar console do navegador
3. Verificar network tab

---

## 📊 Monitoramento Pós-Deploy

### Queries Úteis

```sql
-- Contagem de movimentações por tipo
SELECT 
  movement_type, 
  COUNT(*) 
FROM inventory_movements 
GROUP BY movement_type;

-- Contagens de inventário por status
SELECT 
  status, 
  COUNT(*) 
FROM inventory_counts 
GROUP BY status;

-- Recebimentos com divergências
SELECT 
  COUNT(*) 
FROM purchase_receipts 
WHERE has_divergence = true;

-- Performance dos triggers (tempo de execução)
SELECT 
  schemaname, 
  tablename, 
  n_tup_ins, 
  n_tup_upd 
FROM pg_stat_user_tables 
WHERE tablename IN (
  'inventory_movements', 
  'parts_inventory'
);
```

---

## 📝 Checklist de Deploy

- [ ] **Backup do banco** realizado antes de aplicar migrations
- [ ] **Migration 1** aplicada (inventory_movements)
- [ ] **Migration 2** aplicada (inventory_counts)
- [ ] **Migration 3** aplicada (purchase_receipts)
- [ ] **Migration 4** aplicada (integration)
- [ ] **Verificação** executada (5 tabelas + functions + triggers)
- [ ] **Teste básico** executado (inserir movimentação)
- [ ] **RLS** verificado (acesso multi-tenant)
- [ ] **Frontend** testado (página /inventario carrega)
- [ ] **Rota** confirmada no App.tsx
- [ ] **Documentação** lida pela equipe

---

## ✅ Próximos Passos Após Deploy

1. **Treinamento de Usuários**
   - Demonstrar fluxo de movimentação
   - Demonstrar contagem de inventário
   - Demonstrar recebimento de compras

2. **Monitoramento**
   - Acompanhar performance dos triggers
   - Verificar logs de erros
   - Monitorar uso de storage

3. **Ajustes Finos**
   - Ajustar thresholds de estoque baixo
   - Configurar alertas personalizados
   - Otimizar queries se necessário

---

## 📞 Suporte

**Dúvidas sobre Deploy:**
- Verificar logs do Supabase Dashboard
- Consultar documentação: `IMPLEMENTATION_SUMMARY.md`
- Testar em ambiente de desenvolvimento primeiro

**Em caso de rollback:**
```sql
-- Remover tabelas na ordem inversa
DROP TABLE IF EXISTS purchase_receipt_items CASCADE;
DROP TABLE IF EXISTS purchase_receipts CASCADE;
DROP TABLE IF EXISTS inventory_count_items CASCADE;
DROP TABLE IF EXISTS inventory_counts CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;

-- Remover functions
DROP FUNCTION IF EXISTS create_inventory_entry_on_receipt CASCADE;
DROP FUNCTION IF EXISTS process_inventory_count_adjustments CASCADE;
DROP FUNCTION IF EXISTS generate_receipt_number CASCADE;
DROP FUNCTION IF EXISTS generate_inventory_count_number CASCADE;
DROP FUNCTION IF EXISTS update_inventory_on_movement CASCADE;
DROP FUNCTION IF EXISTS validate_inventory_movement CASCADE;
```

---

**🎉 Boa sorte com o deploy!**

**Última Atualização:** 12/01/2025

