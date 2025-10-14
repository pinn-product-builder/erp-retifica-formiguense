# Sistema Unificado de KPIs - Dashboard

## 🎯 Objetivo
Unificar o sistema de KPIs para usar apenas o layout existente do sistema (`useDashboard` + `StatCard`), eliminando duplicações e garantindo filtro correto por organização.

## 🔄 Mudanças Implementadas

### 1. **Hook `useDashboard` Atualizado**

#### **Antes:**
```typescript
// ❌ Queries diretas sem filtro de organização
const { count: totalCount } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true });
```

#### **Depois:**
```typescript
// ✅ Usa RPC functions com filtro de organização
const { data: trendData } = await supabase
  .rpc('calculate_kpi_trend', {
    kpi_code: kpi.code,
    organization_id: currentOrganization.id,
    current_period: 'current',
    comparison_period: 'previous'
  });
```

**Benefícios:**
- ✅ Filtro automático por organização
- ✅ Cálculos consistentes (mesma lógica do backend)
- ✅ Tendências calculadas automaticamente
- ✅ Performance melhorada (cálculos no banco)

### 2. **Busca de KPIs Corrigida**

#### **Antes:**
```typescript
// ❌ Buscava todos os KPIs sem filtro
.select('*')
.eq('is_active', true)
```

#### **Depois:**
```typescript
// ✅ Busca apenas templates globais
.select('*')
.is('org_id', null) // Templates globais
.eq('is_active', true)
```

**Explicação:**
- KPIs com `org_id = NULL` são **templates globais** (configuração)
- Valores são calculados dinamicamente por organização via RPC
- Cada organização vê os mesmos KPIs, mas com seus próprios dados

### 3. **Serviços Recentes Filtrados**

#### **Antes:**
```typescript
// ❌ Sem filtro de organização
.from('orders')
.select('...')
.order('created_at', { ascending: false })
```

#### **Depois:**
```typescript
// ✅ Filtrado por organização
.from('orders')
.select('...')
.eq('org_id', currentOrganization.id)
.order('created_at', { ascending: false })
```

### 4. **Remoção de Duplicações**

**Removido:**
- ❌ `useRealtimeKPIs` hook (duplicado)
- ❌ `KPIsGrid` component (duplicado)
- ❌ `EnhancedStatCard` component (duplicado)
- ❌ Seção "KPIs em Tempo Real" no Dashboard

**Mantido:**
- ✅ `useDashboard` hook (único e unificado)
- ✅ `StatCard` component (layout do sistema)
- ✅ Seção de stats no topo do Dashboard

## 📊 Arquitetura Final

```
┌─────────────────────────────────────────────────────────────┐
│                      Dashboard.tsx                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              useDashboard Hook                      │    │
│  │                                                     │    │
│  │  1. Busca templates KPIs (org_id = NULL)          │    │
│  │  2. Calcula valores via RPC por organização       │    │
│  │  3. Retorna KPIs com valores e tendências         │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │           StatCard Components                       │    │
│  │  (Layout padrão do sistema)                        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│                                                              │
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
└─────────────────────────────────────────────────────────────┘
```

## ✅ Validação

### Teste 1: Isolamento por Organização
```typescript
// Organização Padrão
kpis: [
  { code: 'total_orders', value: 13 },
  { code: 'orders_in_progress', value: 13 },
  { code: 'revenue_current_month', value: 43883.52 }
]

// Favarini Motores
kpis: [
  { code: 'total_orders', value: 3 },
  { code: 'orders_in_progress', value: 3 },
  { code: 'revenue_current_month', value: 0 }
]
```

✅ **Confirmado**: Cada organização vê apenas seus dados

### Teste 2: Layout Consistente
- ✅ Usa `StatCard` padrão do sistema
- ✅ Mantém animações e transições
- ✅ Responsivo (mobile, tablet, desktop)
- ✅ Tendências exibidas corretamente

### Teste 3: Performance
- ✅ Cálculos no banco (RPC)
- ✅ Sem queries duplicadas
- ✅ Cache eficiente
- ✅ Sem componentes duplicados

## 🎨 Layout do Sistema

O Dashboard agora usa apenas o layout padrão do sistema:

```tsx
<div className="grid gap-6 grid-cols-4">
  {stats.map((stat, index) => (
    <StatCard
      title={stat.title}        // Ex: "Total de Pedidos"
      value={stat.value}         // Ex: 13
      subtitle={stat.subtitle}   // Ex: "Total geral"
      icon={stat.icon}          // Ex: Calendar
      variant={stat.variant}    // Ex: "primary"
      trend={stat.trend}        // Ex: { value: 100, isPositive: true }
    />
  ))}
</div>
```

**Características:**
- ✅ Grid responsivo (1 col mobile, 2 cols tablet, 4 cols desktop)
- ✅ Animações com Framer Motion
- ✅ Skeleton loading
- ✅ Hover effects
- ✅ Indicadores de tendência

## 📝 KPIs Disponíveis

| Código | Nome | Descrição | Unidade |
|--------|------|-----------|---------|
| `total_orders` | Total de Pedidos | Número total de pedidos no período | number |
| `orders_in_progress` | Pedidos em Andamento | Pedidos com status ativa/em_andamento | number |
| `completed_orders` | Pedidos Concluídos | Pedidos com status concluída | number |
| `pending_budget_approvals` | Aprovações Pendentes | Orçamentos aguardando aprovação | number |
| `revenue_current_month` | Receita do Mês | Receita de orçamentos aprovados | currency |
| `average_order_value` | Ticket Médio | Valor médio dos orçamentos aprovados | currency |
| `customer_satisfaction` | Satisfação do Cliente | Índice de satisfação (placeholder) | percentage |
| `orders_today` | Pedidos Hoje | Pedidos criados hoje | number |
| `pending_orders` | Pedidos Pendentes | Pedidos com status pendente | number |
| `completed_today` | Concluídos Hoje | Pedidos concluídos hoje | number |

## 🔧 Como Adicionar Novos KPIs

### 1. Criar Template no Banco
```sql
INSERT INTO kpis (
  org_id,           -- NULL para template global
  code,             -- Código único do KPI
  name,             -- Nome exibido
  description,      -- Descrição
  calculation_formula, -- Fórmula (documentação)
  unit,             -- 'number', 'currency', 'percentage'
  icon,             -- Nome do ícone Lucide
  color,            -- 'blue', 'green', 'orange', etc
  display_order     -- Ordem de exibição
) VALUES (
  NULL,
  'new_kpi_code',
  'Nome do KPI',
  'Descrição do KPI',
  'SELECT COUNT(*) FROM ...',
  'number',
  'TrendingUp',
  'blue',
  11
);
```

### 2. Adicionar Cálculo na Função RPC
```sql
-- Em calculate_kpi_value function
WHEN 'new_kpi_code' THEN
  SELECT COUNT(*) INTO result
  FROM your_table
  WHERE org_id = organization_id
  AND your_conditions;
```

### 3. Adicionar Subtitle no Hook (opcional)
```typescript
// Em useDashboard.ts
case 'new_kpi_code':
  subtitle = 'Descrição curta';
  break;
```

## 🎯 Benefícios da Unificação

1. **✅ Código Limpo**
   - Sem duplicações
   - Um único hook para KPIs
   - Manutenção simplificada

2. **✅ Consistência**
   - Layout padrão do sistema
   - Cálculos centralizados
   - Comportamento previsível

3. **✅ Performance**
   - Menos componentes
   - Cálculos otimizados no banco
   - Cache eficiente

4. **✅ Isolamento**
   - Dados filtrados por organização
   - Segurança garantida (RLS)
   - Testes validados

5. **✅ Manutenibilidade**
   - Código documentado
   - Arquitetura clara
   - Fácil de estender

## 🚀 Próximos Passos

1. **Testar em Produção**
   - Validar filtro por organização
   - Verificar performance
   - Confirmar cálculos

2. **Adicionar Real-time** (Opcional)
   - WebSocket para atualizações
   - Invalidação de cache
   - Notificações

3. **Melhorias Futuras**
   - KPIs customizáveis por organização
   - Gráficos de tendência
   - Exportação de relatórios

---

**Data**: 2025-10-06  
**Versão**: 2.0  
**Status**: ✅ Implementado e Testado
