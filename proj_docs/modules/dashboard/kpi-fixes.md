# Correções de KPIs - Dashboard

## 🐛 Problemas Identificados

### 1. **KPIs não filtravam por organização**
- **Sintoma**: Total de pedidos mostrava 17 para todas as organizações
- **Causa**: Hook buscava KPIs com `org_id = currentOrganization.id`, mas todos os KPIs tinham `org_id = NULL`
- **Impacto**: Todas as organizações viam os mesmos dados

### 2. **Cards mudavam sem ações do usuário**
- **Sintoma**: Valores dos KPIs mudavam aleatoriamente
- **Causa**: `refetchInterval: 2 * 60 * 1000` estava fazendo polling a cada 2 minutos
- **Impacto**: Experiência ruim do usuário, dados "piscando"

### 3. **WebSocket não funcionava**
- **Sintoma**: Atualizações em tempo real não aconteciam
- **Causa**: Filtro usava `organization_id` mas a coluna é `org_id`
- **Causa 2**: Monitorava tabela `budgets` mas os dados estão em `detailed_budgets`
- **Impacto**: Dados não atualizavam quando havia mudanças reais

## ✅ Correções Implementadas

### 1. **Arquitetura de KPIs Corrigida**

**Antes:**
```typescript
// ❌ Tentava buscar KPIs específicos da organização
.eq('org_id', currentOrganization.id)
```

**Depois:**
```typescript
// ✅ Busca templates globais (org_id = NULL)
.is('org_id', null)
```

**Explicação:**
- KPIs com `org_id = NULL` são **templates globais** (configuração)
- Os **valores** são calculados dinamicamente por organização via RPC
- Cada organização vê os mesmos KPIs, mas com seus próprios dados

### 2. **Polling Desabilitado**

**Antes:**
```typescript
// ❌ Polling a cada 2 minutos causava mudanças aleatórias
refetchInterval: 2 * 60 * 1000,
staleTime: 1 * 60 * 1000,
```

**Depois:**
```typescript
// ✅ Apenas WebSocket para atualizações reais
refetchInterval: false,
staleTime: 5 * 60 * 1000,
gcTime: 10 * 60 * 1000,
```

**Benefícios:**
- Dados só atualizam quando há mudanças reais
- Melhor performance (menos queries)
- Experiência do usuário mais estável

### 3. **WebSocket Corrigido**

**Antes:**
```typescript
// ❌ Coluna e tabela erradas
table: 'budgets',
filter: `organization_id=eq.${currentOrganization.id}`
```

**Depois:**
```typescript
// ✅ Coluna e tabela corretas
table: 'detailed_budgets',
filter: `org_id=eq.${currentOrganization.id}`
```

**Melhorias:**
- Canal único por organização: `kpi-updates-${orgId}`
- Logs para debug: `console.log('Orders change detected')`
- Monitora tabelas corretas: `orders` e `detailed_budgets`

## 🧪 Testes de Validação

### Teste 1: Isolamento por Organização
```sql
-- Organização Padrão: 13 pedidos
-- Favarini Motores: 3 pedidos
SELECT 
  'Organização Padrão' as org_name,
  calculate_kpi_value('total_orders', '51aaf595-83b5-4c1c-a3cc-da644ca19c86', 'current') as total_orders
UNION ALL
SELECT 
  'Favarini Motores' as org_name,
  calculate_kpi_value('total_orders', '7217960b-ed55-416b-8ef7-f68a728c7bad', 'current') as total_orders;
```

**Resultado Esperado:**
- Organização Padrão: 13
- Favarini Motores: 3

✅ **Confirmado**: Cada organização vê apenas seus dados

### Teste 2: Estabilidade dos Dados
**Antes da correção:**
- Dados mudavam a cada 2 minutos
- Valores "piscavam" na tela

**Depois da correção:**
- Dados permanecem estáveis
- Só atualizam com mudanças reais via WebSocket

✅ **Confirmado**: Dados estáveis

## 📊 Dados Reais por Organização

### Organização Padrão (51aaf595-83b5-4c1c-a3cc-da644ca19c86)
- **Total de Pedidos**: 13
- **Pedidos em Andamento**: 13
- **Pedidos Concluídos**: 0
- **Orçamentos Pendentes**: 3
- **Receita Aprovada**: R$ 43.883,52
- **Ticket Médio**: R$ 10.970,88

### Favarini Motores (7217960b-ed55-416b-8ef7-f68a728c7bad)
- **Total de Pedidos**: 3
- **Pedidos em Andamento**: 3
- **Pedidos Concluídos**: 0

## 🔧 Arquitetura Final

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           useRealtimeKPIs Hook                       │   │
│  │                                                       │   │
│  │  1. Busca templates KPIs (org_id = NULL)            │   │
│  │  2. Calcula valores por org via RPC                 │   │
│  │  3. Escuta WebSocket para updates                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  kpis (templates)│  │  RPC Functions   │                │
│  │  org_id = NULL   │  │  - calculate_kpi │                │
│  │  - total_orders  │  │  - calculate_trend│               │
│  │  - revenue       │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  orders          │  │  detailed_budgets│                │
│  │  (dados reais)   │  │  (dados reais)   │                │
│  │  org_id: UUID    │  │  org_id: UUID    │                │
│  └──────────────────┘  └──────────────────┘                │
│           │                      │                           │
│           └──────────┬───────────┘                          │
│                      ▼                                       │
│            ┌──────────────────┐                             │
│            │  WebSocket       │                             │
│            │  Real-time       │                             │
│            └──────────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Benefícios das Correções

1. **✅ Isolamento Correto**
   - Cada organização vê apenas seus dados
   - Segurança: RLS aplicado nas tabelas de dados

2. **✅ Performance Melhorada**
   - Sem polling desnecessário
   - Cache inteligente (5 minutos)
   - Atualizações apenas quando necessário

3. **✅ UX Melhorada**
   - Dados estáveis (não "piscam")
   - Atualizações em tempo real quando há mudanças
   - Indicador de conexão WebSocket

4. **✅ Manutenibilidade**
   - Logs para debug
   - Arquitetura clara (templates vs dados)
   - Código documentado

## 📝 Próximos Passos

1. **Monitorar em Produção**
   - Verificar logs do WebSocket
   - Confirmar isolamento entre organizações
   - Validar performance

2. **Melhorias Futuras**
   - Adicionar retry logic no WebSocket
   - Implementar fallback se WebSocket falhar
   - Adicionar métricas de performance

3. **Documentação**
   - Atualizar README com arquitetura de KPIs
   - Documentar processo de adicionar novos KPIs
   - Criar guia de troubleshooting

---

**Data**: 2025-10-06  
**Versão**: 1.0  
**Status**: ✅ Implementado e Testado
