# O que Gera os Alertas Inteligentes no Sistema

## 📊 Visão Geral

Os **Alertas Inteligentes** são gerados automaticamente pelo sistema através de **triggers** e **funções** no banco de dados PostgreSQL. Eles são exibidos no componente `IntelligentAlerts.tsx` no Dashboard.

---

## 🔄 Tipos de Alertas e Suas Origens

### 1. **Alertas de Necessidades de Compra** (`alert_type: 'purchase_need'`)

#### ✅ **IMPLEMENTADO**

**O que gera:**
- Quando uma necessidade de compra (`purchase_needs`) é criada ou atualizada

**Como funciona:**
1. **Trigger:** `trg_create_purchase_need_alert_insert` e `trg_create_purchase_need_alert_update`
2. **Função:** `create_purchase_need_alert()`
3. **Localização:** `supabase/migrations/20251020000000_create_purchase_needs_alerts.sql`

**Quando é criado:**
- ✅ Quando um orçamento é aprovado e há estoque insuficiente (`fn_process_budget_approval`)
- ✅ Quando o estoque de uma peça fica abaixo do mínimo configurado (`check_stock_and_create_purchase_need`)
- ✅ Quando uma necessidade de compra é criada manualmente
- ✅ Quando o status do `purchase_need` é `pending` ou `in_quotation`

**Quando é desativado:**
- Quando o status do `purchase_need` muda para `completed`, `cancelled` ou `ordered`

**Severidade:**
- `critical` → `error` (vermelho)
- `high` → `warning` (amarelo)
- `medium` → `warning` (amarelo)
- `normal` → `info` (azul)

**Estrutura do alerta:**
```json
{
  "alert_type": "purchase_need",
  "title": "Necessidade de Compra: [Nome da Peça]",
  "message": "Necessário comprar X unidades de [Nome] (Estoque atual: Y) - Urgência: DD/MM/YYYY",
  "severity": "error|warning|info",
  "action_label": "Ver Necessidades",
  "action_url": "/compras",
  "metadata": {
    "purchase_need_id": "uuid",
    "part_code": "string",
    "part_name": "string",
    "required_quantity": number,
    "available_quantity": number,
    "priority_level": "critical|high|medium|normal",
    "status": "pending|in_quotation"
  }
}
```

---

### 2. **Alertas de Estoque Baixo** (`stock_alerts`)

#### ⚠️ **OBSERVAÇÃO IMPORTANTE**

**Status Atual:** Existem alertas na tabela `stock_alerts`, mas **NÃO** são convertidos automaticamente para a tabela `alerts` (usada pelo componente `IntelligentAlerts`).

**O que gera:**
- Quando o estoque de uma peça fica abaixo do mínimo
- Quando o estoque é esgotado
- Quando o estoque atinge o mínimo configurado

**Como funciona atualmente:**
1. **Triggers:**
   - `check_minimum_stock_levels()` - Trigger em `parts_inventory`
   - `check_stock_alerts()` - Trigger em `inventory_movements`
   - `update_inventory_on_movement()` - Trigger em `inventory_movements`

2. **Localização:** 
   - `supabase/migrations/parts/20250112000000_part4_triggers.sql`
   - `supabase/migrations/20250103000000_inventory_movements_system.sql`

**Problema identificado:**
- ❌ Os alertas são criados na tabela `stock_alerts`, mas **NÃO** aparecem no componente `IntelligentAlerts`
- ❌ O componente `IntelligentAlerts` busca apenas da tabela `alerts` (não de `stock_alerts`)

**Solução necessária:**
- Criar trigger/função para converter `stock_alerts` em `alerts`
- OU modificar `IntelligentAlerts` para buscar também de `stock_alerts`

---

### 3. **Outros Tipos de Alertas (Potenciais)**

#### ❌ **NÃO IMPLEMENTADOS**

Baseado na estrutura da tabela `alerts`, o sistema pode suportar outros tipos, mas não estão implementados:

- **Alertas de Orçamento** (`budget_alerts`) - Existe tabela, mas não cria alertas na tabela `alerts`
- **Alertas de Workflow** - Não implementado
- **Alertas de Produção** (`production_alerts`) - Existe tabela, mas não cria alertas na tabela `alerts`
- **Alertas de Qualidade** - Não implementado
- **Alertas de Garantia** - Não implementado

---

## 🔍 Fluxo Completo de Geração de Alertas

### Para Alertas de Necessidades de Compra:

```
┌─────────────────────────────────────────────────────────┐
│ EVENTO (Aprovação de Orçamento / Estoque Baixo)        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Criação de purchase_need (INSERT ou UPDATE)          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Trigger: trg_create_purchase_need_alert_insert      │
│    ou trg_create_purchase_need_alert_update              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Função: create_purchase_need_alert()                 │
│    - Verifica se status é 'pending' ou 'in_quotation'  │
│    - Determina severidade baseada em priority_level     │
│    - Cria título e mensagem                             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. INSERT ou UPDATE na tabela alerts                    │
│    - Se já existe alerta ativo → UPDATE                 │
│    - Se não existe → INSERT                             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Realtime Subscription detecta mudança                │
│    (via Supabase Realtime)                              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Componente IntelligentAlerts busca alertas ativos     │
│    - Filtra por org_id                                  │
│    - Filtra por is_active = true                        │
│    - Filtra por expires_at (se não expirado)             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Alerta exibido no Dashboard                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Tabelas Envolvidas

### 1. **Tabela `alerts`** (Principal)
- **Uso:** Armazena alertas exibidos no componente `IntelligentAlerts`
- **Campos principais:**
  - `alert_type`: Tipo do alerta (ex: `'purchase_need'`)
  - `title`: Título do alerta
  - `message`: Mensagem do alerta
  - `severity`: Severidade (`'info'`, `'warning'`, `'error'`, `'success'`)
  - `is_active`: Se o alerta está ativo
  - `metadata`: JSONB com dados adicionais

### 2. **Tabela `purchase_needs`** (Origem dos alertas de compra)
- **Uso:** Armazena necessidades de compra
- **Triggers:** `trg_create_purchase_need_alert_insert`, `trg_create_purchase_need_alert_update`

### 3. **Tabela `stock_alerts`** (Não integrada)
- **Uso:** Armazena alertas de estoque baixo
- **Problema:** Não é convertida automaticamente para `alerts`
- **Triggers:** `check_minimum_stock_levels()`, `check_stock_alerts()`

### 4. **Tabela `alert_history`** (Histórico)
- **Uso:** Armazena alertas dispensados
- **Trigger:** `trigger_archive_dismissed_alert()` (arquiva quando `is_active` muda para `false`)

---

## 🔧 Funções e Triggers Principais

### Funções que Criam Alertas:

1. **`create_purchase_need_alert()`**
   - Cria alertas a partir de `purchase_needs`
   - Localização: `supabase/migrations/20251020000000_create_purchase_needs_alerts.sql`

2. **`check_minimum_stock_levels()`**
   - Cria alertas em `stock_alerts` (não integrado com `alerts`)
   - Localização: `dump.sql` (linhas 1383-1432)

3. **`check_stock_alerts()`**
   - Verifica estoque após movimentação e cria `stock_alerts`
   - Localização: `supabase/migrations/20250103000000_inventory_movements_system.sql`

4. **`update_inventory_on_movement()`**
   - Atualiza estoque e cria `stock_alerts` se necessário
   - Localização: `supabase/migrations/parts/20250112000000_part4_triggers.sql`

### Triggers Principais:

| Trigger | Tabela | Função | Descrição |
|---------|--------|--------|-----------|
| `trg_create_purchase_need_alert_insert` | `purchase_needs` | `create_purchase_need_alert()` | Cria alerta quando purchase_need é criado |
| `trg_create_purchase_need_alert_update` | `purchase_needs` | `create_purchase_need_alert()` | Atualiza/desativa alerta quando purchase_need é atualizado |
| `trigger_check_minimum_stock` | `parts_inventory` | `check_minimum_stock_levels()` | Cria `stock_alerts` quando estoque fica baixo |
| `trigger_check_stock_alerts` | `inventory_movements` | `check_stock_alerts()` | Verifica estoque após movimentação |
| `trigger_update_inventory_on_movement` | `inventory_movements` | `update_inventory_on_movement()` | Atualiza estoque e cria `stock_alerts` |
| `trigger_archive_dismissed_alert` | `alerts` | `archive_dismissed_alert()` | Arquiva alertas quando são dispensados |

---

## 🎯 Resumo: O que Gera os Alertas Inteligentes

### ✅ **Atualmente Funcionando:**

1. **Necessidades de Compra (`purchase_need`)**
   - ✅ Gerado automaticamente quando orçamento é aprovado e há estoque insuficiente
   - ✅ Gerado automaticamente quando estoque fica abaixo do mínimo
   - ✅ Atualizado automaticamente quando purchase_need muda
   - ✅ Desativado automaticamente quando purchase_need é resolvido

### ⚠️ **Não Funcionando (mas deveria):**

2. **Estoque Baixo (`stock_alerts`)**
   - ⚠️ Alertas são criados na tabela `stock_alerts`
   - ❌ **NÃO** são convertidos para a tabela `alerts`
   - ❌ **NÃO** aparecem no componente `IntelligentAlerts`

### ❌ **Não Implementados:**

3. **Outros tipos de alertas**
   - Orçamentos pendentes
   - Workflows bloqueados
   - Produção atrasada
   - Qualidade
   - Garantia

---

## 🚀 Recomendações para Melhorias

### Prioridade ALTA 🔴

1. **Integrar `stock_alerts` com `alerts`**
   - Criar função/trigger para converter `stock_alerts` em `alerts`
   - OU modificar `IntelligentAlerts` para buscar também de `stock_alerts`

2. **Documentar todos os tipos de alertas suportados**
   - Criar enum ou tabela de referência para `alert_type`
   - Documentar quais tipos estão implementados

### Prioridade MÉDIA 🟡

3. **Criar alertas para outros eventos**
   - Orçamentos pendentes de aprovação
   - Workflows bloqueados por checklists
   - Ordens com atraso

### Prioridade BAIXA 🟢

4. **Melhorar visualização**
   - Agrupar alertas por tipo
   - Adicionar ações rápidas
   - Melhorar filtros

---

## 📝 Verificação Rápida

### Verificar se os triggers estão funcionando:

```sql
-- Verificar triggers de purchase_needs
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'purchase_needs'
  AND trigger_name LIKE '%purchase_need_alert%';
```

### Verificar alertas criados:

```sql
-- Ver alertas ativos
SELECT 
    alert_type,
    title,
    severity,
    is_active,
    created_at
FROM alerts
WHERE is_active = true
ORDER BY created_at DESC;
```

### Verificar purchase_needs pendentes:

```sql
-- Ver purchase_needs que deveriam ter alertas
SELECT 
    id,
    part_name,
    priority_level,
    status,
    created_at
FROM purchase_needs
WHERE status IN ('pending', 'in_quotation')
ORDER BY 
    CASE priority_level
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END,
    created_at DESC;
```

