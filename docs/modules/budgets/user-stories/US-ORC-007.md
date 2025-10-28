# US-ORC-007: Relatórios de Orçamentos

**ID:** US-ORC-007  
**Epic:** Orçamentos  
**Sprint:** 5  
**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente comercial  
**Quero** visualizar relatórios analíticos de orçamentos  
**Para** acompanhar taxa de conversão, valores e desempenho comercial

---

## 🎯 Business Objective

Fornecer insights sobre desempenho de orçamentos, identificando padrões de aprovação, rejeição e oportunidades de melhoria no processo comercial.

---

## 📐 Business Rules

### RN043: Tipos de Relatórios
```typescript
type ReportType =
  | 'conversion_funnel'     // Funil de conversão
  | 'by_status'             // Por status
  | 'by_component'          // Por componente
  | 'by_customer'           // Por cliente
  | 'by_period'             // Evolução temporal
  | 'rejection_analysis'    // Análise de rejeições
  | 'average_values';       // Valores médios
```

### RN044: Métricas Principais
```typescript
interface BudgetMetrics {
  // Contadores
  total_budgets: number;
  drafts: number;
  sent: number;
  approved: number;
  partially_approved: number;
  rejected: number;
  
  // Taxa de conversão
  conversion_rate: number;          // approved / sent * 100
  partial_conversion_rate: number;  // partially_approved / sent * 100
  rejection_rate: number;           // rejected / sent * 100
  
  // Valores
  total_value: number;              // Soma de todos orçamentos
  approved_value: number;           // Soma dos aprovados
  rejected_value: number;           // Soma dos rejeitados
  average_budget_value: number;     // Média por orçamento
  average_approval_time: number;    // Tempo médio até aprovação (dias)
  
  // Componentes
  most_quoted_component: string;
  highest_approval_component: string;
  
  // Temporal
  budgets_by_month: Record<string, number>;
  approval_trend: 'increasing' | 'stable' | 'decreasing';
}
```

### RN045: Filtros Disponíveis
```typescript
interface ReportFilters {
  date_range: {
    start_date: Date;
    end_date: Date;
  };
  status?: BudgetStatus[];
  component?: ComponentType[];
  customer_id?: string;
  created_by?: string;
  min_value?: number;
  max_value?: number;
  approval_method?: ApprovalMethod[];
}
```

### RN046: Funil de Conversão
**Visualização em cascata:**
```
Rascunhos (draft)              100 orçamentos (100%)
    ↓
Enviados (pending_customer)     85 orçamentos ( 85%)
    ↓
Aprovados parcial/total         68 orçamentos ( 68%)
    ↓  
Finalizados (approved)          65 orçamentos ( 65%)
```

**Taxas calculadas:**
- Taxa de envio: `sent / drafts * 100`
- Taxa de conversão: `approved / sent * 100`
- Taxa de abandono: `drafts_not_sent / drafts * 100`

### RN047: Análise de Rejeições
**Categorização de motivos:**
```typescript
interface RejectionAnalysis {
  total_rejections: number;
  reasons: {
    category: string;          // Ex: "Preço alto", "Prazo longo"
    count: number;
    percentage: number;
    average_value: number;     // Valor médio rejeitado nesta categoria
  }[];
  most_common_reason: string;
  suggestions: string[];       // Sugestões de melhoria
}
```

### RN048: Comparativo por Componente
**Tabela de desempenho:**
```
Componente    | Qtd | Aprovados | Taxa | Valor Médio | Tempo Médio
Bloco         |  45 |    38     | 84%  |  R$ 2.850   |  3.2 dias
Cabeçote      |  32 |    28     | 88%  |  R$ 1.120   |  2.8 dias
Virabrequim   |  28 |    20     | 71%  |  R$ 1.450   |  4.1 dias
Biela         |  19 |    15     | 79%  |    R$ 890   |  3.5 dias
```

### RN049: Exportação
**Formatos suportados:**
- **PDF:** Relatório formatado com gráficos
- **Excel:** Dados tabulares para análise
- **CSV:** Dados brutos para importação

---

## ✅ Acceptance Criteria

**AC45:** Dashboard mostra métricas principais em cards  
**AC46:** Gráfico de funil de conversão é exibido  
**AC47:** Filtros permitem segmentar por período, status, componente  
**AC48:** Tabela de orçamentos detalhada é gerada  
**AC49:** Análise de rejeições identifica padrões  
**AC50:** Relatórios podem ser exportados em PDF/Excel  
**AC51:** Gráficos interativos permitem drill-down

---

## 🛠️ Definition of Done

- [ ] Componente `BudgetReports.tsx` implementado
- [ ] Hook `useBudgetReports.ts` criado
- [ ] Gráficos de funil implementados
- [ ] Análise de rejeições funcional
- [ ] Filtros dinâmicos operacionais
- [ ] Exportação PDF implementada
- [ ] Exportação Excel/CSV implementada
- [ ] View `budget_metrics` criada
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/budgets/
  ├── BudgetReports.tsx            (NEW)
  ├── ConversionFunnelChart.tsx    (NEW)
  ├── ComponentPerformanceTable.tsx(NEW)
  └── RejectionAnalysis.tsx        (NEW)

src/hooks/
  └── useBudgetReports.ts          (NEW)

src/lib/
  ├── reportGenerator.ts           (NEW)
  └── chartHelpers.ts              (NEW)
```

---

## 🗄️ Database Schema

```sql
-- View para métricas agregadas de orçamentos
CREATE OR REPLACE VIEW budget_metrics AS
SELECT 
  org_id,
  
  -- Contadores
  COUNT(*) AS total_budgets,
  COUNT(*) FILTER (WHERE status = 'draft') AS drafts,
  COUNT(*) FILTER (WHERE status = 'pending_customer') AS sent,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved,
  COUNT(*) FILTER (WHERE status = 'partially_approved') AS partially_approved,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
  
  -- Taxas de conversão
  ROUND(
    COUNT(*) FILTER (WHERE status = 'approved')::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE status = 'pending_customer'), 0) * 100,
    2
  ) AS conversion_rate,
  
  ROUND(
    COUNT(*) FILTER (WHERE status = 'rejected')::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE status = 'pending_customer'), 0) * 100,
    2
  ) AS rejection_rate,
  
  -- Valores
  SUM(total) AS total_value,
  SUM(total) FILTER (WHERE status = 'approved') AS approved_value,
  SUM(total) FILTER (WHERE status = 'rejected') AS rejected_value,
  ROUND(AVG(total), 2) AS average_budget_value,
  
  -- Tempo médio até aprovação (em dias)
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (
        (SELECT approved_at FROM budget_approvals ba 
         WHERE ba.budget_id = db.id 
         ORDER BY approved_at DESC LIMIT 1) - db.created_at
      )) / 86400
    ) FILTER (WHERE status IN ('approved', 'customer_approved')),
    1
  ) AS average_approval_time_days

FROM detailed_budgets db
JOIN orders o ON o.id = db.order_id
GROUP BY org_id;

-- View para análise por componente
CREATE OR REPLACE VIEW budget_by_component AS
SELECT 
  o.org_id,
  db.component,
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE db.status = 'approved') AS approved_count,
  ROUND(
    COUNT(*) FILTER (WHERE db.status = 'approved')::NUMERIC / 
    COUNT(*) * 100,
    1
  ) AS approval_rate,
  ROUND(AVG(db.total), 2) AS average_value,
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (
        (SELECT approved_at FROM budget_approvals ba 
         WHERE ba.budget_id = db.id 
         ORDER BY approved_at DESC LIMIT 1) - db.created_at
      )) / 86400
    ) FILTER (WHERE db.status IN ('approved', 'customer_approved')),
    1
  ) AS average_approval_days
FROM detailed_budgets db
JOIN orders o ON o.id = db.order_id
GROUP BY o.org_id, db.component;

-- View para evolução temporal
CREATE OR REPLACE VIEW budget_by_month AS
SELECT 
  o.org_id,
  DATE_TRUNC('month', db.created_at) AS month,
  COUNT(*) AS total_budgets,
  COUNT(*) FILTER (WHERE db.status = 'approved') AS approved_budgets,
  SUM(db.total) AS total_value,
  SUM(db.total) FILTER (WHERE db.status = 'approved') AS approved_value
FROM detailed_budgets db
JOIN orders o ON o.id = db.order_id
GROUP BY o.org_id, DATE_TRUNC('month', db.created_at)
ORDER BY month DESC;

-- View para análise de rejeições
CREATE OR REPLACE VIEW budget_rejections_analysis AS
SELECT 
  o.org_id,
  ba.rejection_reason,
  COUNT(*) AS rejection_count,
  ROUND(AVG(db.total), 2) AS average_rejected_value,
  ARRAY_AGG(db.component) AS rejected_components
FROM budget_approvals ba
JOIN detailed_budgets db ON db.id = ba.budget_id
JOIN orders o ON o.id = db.order_id
WHERE ba.approval_type = 'rejected'
GROUP BY o.org_id, ba.rejection_reason;

-- Função para gerar relatório de funil
CREATE OR REPLACE FUNCTION get_budget_funnel(
  p_org_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
  stage TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH funnel_data AS (
    SELECT 
      CASE 
        WHEN status = 'draft' THEN 1
        WHEN status = 'pending_customer' THEN 2
        WHEN status IN ('customer_approved', 'partially_approved') THEN 3
        WHEN status = 'approved' THEN 4
        ELSE 0
      END AS stage_order,
      CASE 
        WHEN status = 'draft' THEN 'Rascunhos'
        WHEN status = 'pending_customer' THEN 'Enviados'
        WHEN status IN ('customer_approved', 'partially_approved') THEN 'Em Aprovação'
        WHEN status = 'approved' THEN 'Finalizados'
        ELSE 'Outros'
      END AS stage_name,
      COUNT(*) AS stage_count
    FROM detailed_budgets db
    JOIN orders o ON o.id = db.order_id
    WHERE o.org_id = p_org_id
    AND (p_start_date IS NULL OR db.created_at::DATE >= p_start_date)
    AND (p_end_date IS NULL OR db.created_at::DATE <= p_end_date)
    GROUP BY stage_order, stage_name
  ),
  total_base AS (
    SELECT MAX(stage_count) AS base_count
    FROM funnel_data
    WHERE stage_order = 1
  )
  SELECT 
    fd.stage_name,
    fd.stage_count,
    ROUND((fd.stage_count::NUMERIC / tb.base_count * 100), 1)
  FROM funnel_data fd
  CROSS JOIN total_base tb
  WHERE fd.stage_order > 0
  ORDER BY fd.stage_order;
END;
$$ LANGUAGE plpgsql;

-- Permissões
GRANT SELECT ON budget_metrics TO authenticated;
GRANT SELECT ON budget_by_component TO authenticated;
GRANT SELECT ON budget_by_month TO authenticated;
GRANT SELECT ON budget_rejections_analysis TO authenticated;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Relatórios de Orçamentos                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Filtros:                                                     │
│  Período: [📅 01/01/2025] a [📅 31/01/2025]                 │
│  Status: [Todos ▼]  Componente: [Todos ▼]                   │
│                    [🔍 Aplicar Filtros]  [📥 Exportar PDF]  │
│                                                               │
│  ┌─ MÉTRICAS PRINCIPAIS ────────────────────────────────────┐│
│  │                                                          ││
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        ││
│  │  │ Total      │  │ Aprovados  │  │ Conversão  │        ││
│  │  │ 127        │  │ 89         │  │ 70.1%      │        ││
│  │  │ orçamentos │  │ orçamentos │  │ ▲ +5.2%    │        ││
│  │  └────────────┘  └────────────┘  └────────────┘        ││
│  │                                                          ││
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        ││
│  │  │ Rejeitados │  │ Valor Médio│  │ Tempo Médio│        ││
│  │  │ 18         │  │ R$ 1.245   │  │ 3.5 dias   │        ││
│  │  │ orçamentos │  │ por orçam. │  │ aprovação  │        ││
│  │  └────────────┘  └────────────┘  └────────────┘        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ FUNIL DE CONVERSÃO ──────────────────────────────────────┐│
│  │                                                          ││
│  │  Rascunhos              ████████████████████  127 (100%)││
│  │                          ↓ 85%                           ││
│  │  Enviados               ████████████████      108 ( 85%)││
│  │                          ↓ 82%                           ││
│  │  Em Aprovação           ███████████████        89 ( 70%)││
│  │                          ↓ 99%                           ││
│  │  Finalizados            ███████████████        88 ( 69%)││
│  │                                                          ││
│  │  Taxa de Conversão Final: 70.1%                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ DESEMPENHO POR COMPONENTE ──────────────────────────────┐│
│  │                                                          ││
│  │ Componente   | Qtd | Aprov | Taxa | Valor Médio | Tempo ││
│  │ Cabeçote     |  45 |   39  | 87%  |  R$ 1.120   | 2.8d  ││
│  │ Bloco        |  38 |   32  | 84%  |  R$ 2.850   | 3.2d  ││
│  │ Biela        |  19 |   15  | 79%  |    R$ 890   | 3.5d  ││
│  │ Virabrequim  |  18 |   12  | 67%  |  R$ 1.450   | 4.1d  ││
│  │ Pistão       |   7 |    6  | 86%  |    R$ 780   | 2.5d  ││
│  │                                                          ││
│  │ 📊 Melhor taxa: Cabeçote (87%)                           ││
│  │ 💰 Maior valor: Bloco (R$ 2.850)                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ ANÁLISE DE REJEIÇÕES (18 no período) ───────────────────┐│
│  │                                                          ││
│  │ Motivo              | Qtd |  %   | Valor Médio          ││
│  │ Valor acima orçado  |   8 | 44%  | R$ 1.980             ││
│  │ Prazo muito longo   |   5 | 28%  | R$ 1.120             ││
│  │ Cliente desistiu    |   3 | 17%  |   R$ 890             ││
│  │ Outros              |   2 | 11%  |   R$ 750             ││
│  │                                                          ││
│  │ 💡 Sugestões:                                            ││
│  │ • Revisar precificação para valores acima de R$ 1.800   ││
│  │ • Negociar prazos mais curtos com fornecedores          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ EVOLUÇÃO TEMPORAL ────────────────────────────────────────┐│
│  │                                                          ││
│  │  R$                                                      ││
│  │  30k │                                          ●        ││
│  │  25k │                                 ●        │        ││
│  │  20k │                        ●        │        │        ││
│  │  15k │               ●        │        │        │        ││
│  │  10k │      ●        │        │        │        │        ││
│  │   5k │      │        │        │        │        │        ││
│  │      └──────┴────────┴────────┴────────┴────────┴────   ││
│  │      Set    Out     Nov      Dez      Jan                ││
│  │                                                          ││
│  │  Tendência: ▲ Crescente (+15% vs mês anterior)          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Visualizar Dashboard de Métricas
```gherkin
Given que tenho orçamentos no sistema
When acesso "Relatórios de Orçamentos"
Then vejo cards com métricas principais:
  - Total de orçamentos
  - Taxa de conversão
  - Valor médio
  - Tempo médio de aprovação
```

### E2E Test 2: Filtrar por Período
```gherkin
Given que estou no dashboard de relatórios
When seleciono período "01/01/2025 a 31/01/2025"
And clico em "Aplicar Filtros"
Then todas as métricas são recalculadas
And mostram apenas dados do período selecionado
```

### E2E Test 3: Visualizar Funil de Conversão
```gherkin
Given que apliquei filtros
When visualizo seção "Funil de Conversão"
Then vejo gráfico em cascata mostrando:
  - Rascunhos (100%)
  - Enviados (X%)
  - Em Aprovação (Y%)
  - Finalizados (Z%)
And taxa de conversão final é exibida
```

### E2E Test 4: Analisar Desempenho por Componente
```gherkin
Given que tenho orçamentos de vários componentes
When visualizo tabela "Desempenho por Componente"
Then vejo para cada componente:
  - Quantidade total
  - Quantidade aprovada
  - Taxa de aprovação
  - Valor médio
  - Tempo médio
And componente com melhor taxa é destacado
```

### E2E Test 5: Análise de Rejeições
```gherkin
Given que tenho 18 orçamentos rejeitados
When visualizo "Análise de Rejeições"
Then motivos são categorizados e contados
And percentual de cada motivo é exibido
And sugestões de melhoria são apresentadas
```

### E2E Test 6: Exportar Relatório em PDF
```gherkin
Given que configurei filtros e visualizei relatórios
When clico em "Exportar PDF"
Then PDF é gerado com:
  - Cabeçalho com logo e data
  - Métricas principais
  - Gráficos (funil, evolução)
  - Tabelas (componentes, rejeições)
And download inicia automaticamente
```

### E2E Test 7: Drill-down em Componente
```gherkin
Given que visualizo tabela de componentes
When clico em "Bloco" (84% aprovação)
Then modal/página abre com:
  - Lista de todos orçamentos de bloco
  - Status individual de cada um
  - Filtros adicionais
```

---

## 🚫 Negative Scope

**Não inclui:**
- Comparativo entre períodos (YoY, MoM)
- Previsão de vendas com IA
- Análise de margem de lucro
- Relatórios personalizáveis (criação pelo usuário)
- Dashboard em tempo real (auto-refresh)

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-ORC-001 a US-ORC-006 (dados completos)

**Related:**
- US-REL-001 (Sistema de Relatórios Gerais)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
