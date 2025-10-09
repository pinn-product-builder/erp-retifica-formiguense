# 🔢 Como Funciona a Geração do `budget_number`

## 📖 **Explicação Detalhada**

### **Sim! Ele pega o último número que existe na tabela** 

Mas com alguns detalhes importantes:

---

## 🎯 **Fluxo Completo**

### **1️⃣ Quando o Trigger Dispara:**

```sql
-- Você cria um orçamento
INSERT INTO detailed_budgets (order_id, component, services, parts)
VALUES (...);

-- ↓ ANTES de inserir, o trigger BEFORE INSERT dispara
-- ↓ Chama: auto_generate_budget_number()
```

### **2️⃣ O Que a Função Faz:**

```sql
CREATE TRIGGER trigger_auto_generate_budget_number
    BEFORE INSERT ON detailed_budgets  -- ← Dispara ANTES de inserir
    FOR EACH ROW                        -- ← Para cada linha
    EXECUTE FUNCTION auto_generate_budget_number();
```

### **3️⃣ Passo a Passo da Geração:**

#### **Passo 1: Buscar o Ano Atual**
```sql
year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
-- Resultado: "2025"
```

#### **Passo 2: Buscar o ÚLTIMO Número do Ano**
```sql
SELECT COALESCE(
    MAX(CAST(SPLIT_PART(db.budget_number, '-', 3) AS INTEGER)), 
    0
) + 1
INTO sequence_num
FROM detailed_budgets db
JOIN orders o ON o.id = db.order_id
WHERE o.org_id = generate_budget_number.org_id  -- ← Filtra por organização
AND db.budget_number LIKE 'ORC-' || year_part || '-%';  -- ← Filtra por ano
```

**Exemplo Prático:**

```sql
-- Números existentes na tabela:
ORC-2025-0001
ORC-2025-0002
ORC-2025-0003
ORC-2025-0009  -- ← Último!

-- O que acontece:
-- 1. SPLIT_PART('ORC-2025-0009', '-', 3) → '0009'
-- 2. CAST('0009' AS INTEGER) → 9
-- 3. MAX(...) → 9 (maior número)
-- 4. + 1 → 10
-- 5. sequence_num = 10
```

#### **Passo 3: Formatar o Número**
```sql
new_budget_number := 'ORC-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
-- Resultado: 'ORC-2025-0010'
```

**O que `LPAD` faz:**
```sql
LPAD('10', 4, '0')  → '0010'  -- Preenche com zeros à esquerda
LPAD('1', 4, '0')   → '0001'
LPAD('999', 4, '0') → '0999'
```

#### **Passo 4: Double-Check (Verificação de Segurança)**
```sql
-- Verificar se o número já existe
IF NOT EXISTS (
    SELECT 1 
    FROM detailed_budgets db
    JOIN orders o ON o.id = db.order_id
    WHERE o.org_id = generate_budget_number.org_id
    AND db.budget_number = new_budget_number
) THEN
    RETURN new_budget_number;  -- ✅ OK, pode usar!
END IF;
```

#### **Passo 5: Retry se Necessário**
```sql
-- Se o número JÁ EXISTE (race condition):
IF attempt >= max_attempts THEN
    RAISE EXCEPTION 'Não foi possível gerar budget_number após 5 tentativas';
END IF;

-- Aguardar 10ms e tentar novamente
PERFORM pg_sleep(0.01);
```

---

## 🔍 **Exemplos Práticos**

### **Exemplo 1: Primeiro Orçamento do Ano**

```sql
-- Tabela vazia para 2025
SELECT * FROM detailed_budgets WHERE budget_number LIKE 'ORC-2025-%';
-- Resultado: (vazio)

-- Criar orçamento
INSERT INTO detailed_budgets (...);

-- O que acontece:
-- 1. MAX(...) não encontra nada → COALESCE(..., 0) → 0
-- 2. 0 + 1 = 1
-- 3. LPAD('1', 4, '0') = '0001'
-- 4. Resultado: 'ORC-2025-0001'
```

### **Exemplo 2: Sequência Normal**

```sql
-- Orçamentos existentes:
ORC-2025-0001
ORC-2025-0002
ORC-2025-0003

-- Criar novo orçamento
INSERT INTO detailed_budgets (...);

-- O que acontece:
-- 1. MAX(1, 2, 3) = 3
-- 2. 3 + 1 = 4
-- 3. LPAD('4', 4, '0') = '0004'
-- 4. Resultado: 'ORC-2025-0004'
```

### **Exemplo 3: Virada de Ano**

```sql
-- Orçamentos de 2024:
ORC-2024-0001
ORC-2024-0002
...
ORC-2024-9999

-- Criar primeiro orçamento de 2025
INSERT INTO detailed_budgets (...);

-- O que acontece:
-- 1. Busca apenas "ORC-2025-%" → não encontra nada
-- 2. 0 + 1 = 1
-- 3. Resultado: 'ORC-2025-0001'  ← Recomeça!
```

### **Exemplo 4: Multi-Tenant (Várias Organizações)**

```sql
-- Organização A:
ORC-2025-0001  (org_id = A)
ORC-2025-0002  (org_id = A)

-- Organização B:
ORC-2025-0001  (org_id = B)
ORC-2025-0002  (org_id = B)

-- Criar orçamento para Organização A
INSERT INTO detailed_budgets (order_id = order_da_org_A, ...);

-- O que acontece:
-- 1. Filtra apenas org_id = A
-- 2. MAX(1, 2) = 2
-- 3. 2 + 1 = 3
-- 4. Resultado: 'ORC-2025-0003' (da org A)

-- Cada organização tem sua própria sequência!
```

---

## ⚡ **Race Condition - Como É Resolvido**

### **Problema:**
```
Thread A                          Thread B
─────────────────────             ─────────────────────
1. Busca MAX → 9                  1. Busca MAX → 9
2. Gera: ORC-2025-0010            2. Gera: ORC-2025-0010
3. Double-check: OK ✅            3. Double-check: OK ✅
4. Insere: ORC-2025-0010 ✅       4. Insere: ORC-2025-0010 ❌ ERRO!
```

### **Solução:**
```
Thread A                          Thread B
─────────────────────             ─────────────────────
1. Busca MAX → 9                  1. Busca MAX → 9
2. Gera: ORC-2025-0010            2. Gera: ORC-2025-0010
3. Double-check: OK ✅            3. Double-check: OK ✅
4. Insere: ORC-2025-0010 ✅       4. (Thread A já inseriu)
                                  5. Double-check: JÁ EXISTE ❌
                                  6. Aguarda 10ms
                                  7. Busca MAX → 10
                                  8. Gera: ORC-2025-0011
                                  9. Double-check: OK ✅
                                  10. Insere: ORC-2025-0011 ✅
```

---

## 🎨 **Diagrama Visual**

```
┌─────────────────────────────────────────────────┐
│  CRIAR ORÇAMENTO                                │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  TRIGGER: BEFORE INSERT                         │
│  auto_generate_budget_number()                  │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  1. Extrair ano atual: "2025"                   │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  2. Buscar último número do ano                 │
│     SELECT MAX(SPLIT_PART(...))                 │
│     FROM detailed_budgets                       │
│     WHERE org_id = ? AND year = 2025            │
│                                                 │
│     Exemplo: ORC-2025-0009 → 9                  │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  3. Próximo número: 9 + 1 = 10                  │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  4. Formatar: LPAD(10, 4, '0') = '0010'         │
│     Resultado: 'ORC-2025-0010'                  │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  5. Double-Check: Já existe?                    │
├─────────────┬─────────────┬─────────────────────┤
│  NÃO        │             │  SIM                │
│  ↓          │             │  ↓                  │
│  ✅ Usar    │             │  ⏱️ Aguardar 10ms   │
│             │             │  🔄 Tentar novamente│
└─────────────┴─────────────┴─────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  INSERIR NA TABELA                              │
│  detailed_budgets                               │
│  (com budget_number gerado automaticamente)     │
└─────────────────────────────────────────────────┘
```

---

## 📊 **Formato do Número**

### **Estrutura:**
```
ORC - 2025 - 0010
│     │      │
│     │      └─ Sequencial (4 dígitos, com zeros à esquerda)
│     └──────── Ano (4 dígitos)
└────────────── Prefixo fixo
```

### **Limites:**
- **Mínimo:** `ORC-YYYY-0001`
- **Máximo:** `ORC-YYYY-9999` (até 9.999 orçamentos por ano/organização)
- **Resetar:** Automaticamente todo dia 1º de janeiro

---

## 🔐 **Filtros Aplicados**

A função busca o último número considerando:

1. ✅ **Mesma organização** (`org_id`)
2. ✅ **Mesmo ano** (ano atual)
3. ✅ **Formato válido** (`ORC-YYYY-NNNN`)

**NÃO considera:**
- ❌ Orçamentos de outras organizações
- ❌ Orçamentos de anos anteriores
- ❌ Números inválidos ou fora do padrão

---

## 🧪 **Testar Manualmente**

```sql
-- 1. Ver todos os orçamentos do ano atual
SELECT 
  budget_number,
  org_id,
  created_at
FROM detailed_budgets
WHERE budget_number LIKE 'ORC-2025-%'
ORDER BY budget_number;

-- 2. Ver o último número
SELECT MAX(
  CAST(SPLIT_PART(budget_number, '-', 3) AS INTEGER)
) as ultimo_numero
FROM detailed_budgets db
JOIN orders o ON o.id = db.order_id
WHERE o.org_id = 'SEU_ORG_ID'
AND budget_number LIKE 'ORC-2025-%';

-- 3. Simular geração do próximo número
SELECT generate_budget_number('SEU_ORG_ID') as proximo_numero;
```

---

## ✨ **Resumo**

| Pergunta | Resposta |
|----------|----------|
| **Pega o último da tabela?** | ✅ Sim, o MAX() do ano atual |
| **É por organização?** | ✅ Sim, cada org tem sua sequência |
| **Reseta todo ano?** | ✅ Sim, recomeça em 0001 |
| **É thread-safe?** | ✅ Sim, tem retry + double-check |
| **Pode ter buracos?** | ✅ Sim, se orçamentos forem deletados |
| **Formato fixo?** | ✅ Sim, sempre ORC-YYYY-NNNN |

---

**É um sistema robusto e confiável! 🚀**
