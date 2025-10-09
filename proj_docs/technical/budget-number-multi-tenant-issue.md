# 🚨 Problema: Colisão de `budget_number` entre Organizações

## ❌ **Problema Identificado**

### **Cenário:**
Duas organizações diferentes criando seu primeiro orçamento do ano **ao mesmo tempo** podem gerar o **mesmo número**!

```
Organização A               Organização B
─────────────               ─────────────
Criar orçamento             Criar orçamento
    ↓                           ↓
Buscar MAX(...)             Buscar MAX(...)
    ↓                           ↓
Não encontra nada           Não encontra nada
    ↓                           ↓
0 + 1 = 1                   0 + 1 = 1
    ↓                           ↓
ORC-2025-0001 ✅            ORC-2025-0001 ✅
```

### **Resultado:**
```sql
-- Ambas organizações terão o mesmo número!
SELECT budget_number, org_id FROM detailed_budgets;

budget_number  | org_id
─────────────────────────────────────────────────
ORC-2025-0001  | org_A  ← DUPLICADO!
ORC-2025-0001  | org_B  ← DUPLICADO!
```

---

## 🔍 **Por Que Isso Acontece?**

### **Constraint UNIQUE Atual:**
```sql
ALTER TABLE detailed_budgets
ADD CONSTRAINT detailed_budgets_budget_number_key 
UNIQUE (budget_number);
```

**Problema:** O constraint é apenas em `budget_number`, **SEM considerar `org_id`**!

### **O Que Está Acontecendo:**

1. ✅ Função filtra corretamente por `org_id`
2. ✅ Cada organização busca seu próprio MAX()
3. ❌ **MAS** o constraint UNIQUE bloqueia globalmente
4. ❌ Segunda organização não consegue inserir `ORC-2025-0001`

---

## ✅ **Solução: Unique Constraint Composto**

### **Mudança Necessária:**

```sql
-- Remover constraint antigo (apenas budget_number)
ALTER TABLE detailed_budgets
DROP CONSTRAINT detailed_budgets_budget_number_key;

-- Criar constraint composto (budget_number + org_id)
ALTER TABLE detailed_budgets
ADD CONSTRAINT detailed_budgets_budget_number_org_id_key 
UNIQUE (budget_number, org_id);
```

### **Com Isso:**

```sql
-- ✅ PERMITIDO: Mesmo número em organizações diferentes
INSERT: ORC-2025-0001, org_A  ← OK
INSERT: ORC-2025-0001, org_B  ← OK
INSERT: ORC-2025-0001, org_C  ← OK

-- ❌ BLOQUEADO: Número duplicado na MESMA organização
INSERT: ORC-2025-0001, org_A  ← ERRO (já existe)
```

---

## 📊 **Comparação Visual**

### **❌ ANTES (Constraint Simples):**

```
┌─────────────────────────────────────┐
│  Constraint UNIQUE                  │
│  (budget_number)                    │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ORC-2025-0001  (org_A)  ✅         │
│  ORC-2025-0001  (org_B)  ❌ ERRO!  │
│  ORC-2025-0002  (org_A)  ✅         │
│  ORC-2025-0002  (org_B)  ❌ ERRO!  │
└─────────────────────────────────────┘
```

### **✅ DEPOIS (Constraint Composto):**

```
┌─────────────────────────────────────┐
│  Constraint UNIQUE                  │
│  (budget_number, org_id)            │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ORC-2025-0001  (org_A)  ✅         │
│  ORC-2025-0001  (org_B)  ✅         │
│  ORC-2025-0002  (org_A)  ✅         │
│  ORC-2025-0002  (org_B)  ✅         │
│  ORC-2025-0001  (org_A)  ❌ ERRO!  │ ← Duplicata na MESMA org
└─────────────────────────────────────┘
```

---

## 🎯 **Exemplo Prático**

### **Cenário Real:**

```sql
-- Retífica Formiguense (org_A)
ORC-2025-0001  → Motor Fusca
ORC-2025-0002  → Motor Gol
ORC-2025-0003  → Motor Kombi

-- Favarini Motores (org_B)
ORC-2025-0001  → Motor Palio
ORC-2025-0002  → Motor Uno
ORC-2025-0003  → Motor Strada

-- ✅ Cada organização tem sua própria sequência!
-- ✅ Não há conflito entre elas!
```

---

## 🔧 **Migration Necessária**

```sql
-- Migration: Corrigir unique constraint para multi-tenant

-- 1. Remover constraint antigo
ALTER TABLE detailed_budgets
DROP CONSTRAINT IF EXISTS detailed_budgets_budget_number_key;

-- 2. Adicionar constraint composto
ALTER TABLE detailed_budgets
ADD CONSTRAINT detailed_budgets_budget_number_org_id_key 
UNIQUE (budget_number, org_id);

-- 3. Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_detailed_budgets_org_budget 
ON detailed_budgets(org_id, budget_number);

-- 4. Comentário explicativo
COMMENT ON CONSTRAINT detailed_budgets_budget_number_org_id_key 
ON detailed_budgets IS 
'Garante que budget_number é único por organização. 
Permite que organizações diferentes tenham o mesmo número.';
```

---

## 🧪 **Testar Após Correção**

```sql
-- Teste 1: Criar primeiro orçamento de cada organização
SELECT 
  generate_budget_number('org_A_id') as org_A,
  generate_budget_number('org_B_id') as org_B,
  generate_budget_number('org_C_id') as org_C;

-- Resultado esperado:
-- org_A: ORC-2025-0001
-- org_B: ORC-2025-0001  ← Mesmo número, org diferente
-- org_C: ORC-2025-0001  ← Mesmo número, org diferente

-- Teste 2: Tentar duplicar na mesma org (deve falhar)
INSERT INTO detailed_budgets (order_id, budget_number, ...)
VALUES ('order_da_org_A', 'ORC-2025-0001', ...);
-- ❌ ERRO: duplicate key value (correto!)
```

---

## 📝 **Impacto da Mudança**

### **Positivo:**
- ✅ Cada organização tem sua própria sequência
- ✅ Não há conflito entre organizações
- ✅ Mais natural para multi-tenant
- ✅ Permite crescimento independente

### **Observações:**
- ⚠️ `budget_number` NÃO é mais globalmente único
- ⚠️ Precisa sempre filtrar por `org_id` nas consultas
- ⚠️ Relatórios devem considerar organização

---

## 🔄 **Alternativa: Prefixo por Organização**

Se você REALMENTE quiser números únicos globalmente:

```sql
-- Cada organização tem seu próprio prefixo
Retífica Formiguense: RF-2025-0001
Favarini Motores:     FM-2025-0001
Empresa ABC:          AB-2025-0001
```

**Vantagens:**
- Número é globalmente único
- Fácil identificar a organização pelo prefixo

**Desvantagens:**
- Mais complexo implementar
- Precisa gerenciar prefixos
- Números mais longos

---

## 💡 **Recomendação**

### **Opção 1: Constraint Composto (RECOMENDADO)**
✅ Mais simples  
✅ Padrão multi-tenant  
✅ Cada org é independente  

### **Opção 2: Prefixo por Org**
⚠️ Mais complexo  
✅ Números globalmente únicos  
⚠️ Requer mais manutenção  

---

## 🚀 **Qual Escolher?**

**Para 99% dos casos: Opção 1 (Constraint Composto)**

Razões:
1. Mais comum em sistemas multi-tenant
2. Mais simples de implementar
3. Cada organização é independente
4. Melhor performance
5. Mais fácil de escalar

**Use Opção 2 apenas se:**
- Precisa compartilhar números entre orgs
- Precisa de rastreamento global único
- Regulamentações exigem numeração única

---

## 📚 **Conclusão**

O problema não está na **função** (ela filtra corretamente por `org_id`), mas sim no **constraint UNIQUE** que bloqueia números duplicados globalmente.

**Solução:** Mudar de `UNIQUE (budget_number)` para `UNIQUE (budget_number, org_id)`.

---

**Vou aplicar a correção agora? 🚀**
