# US-MET-010: Dashboard de KPIs de Metrologia

**ID:** US-MET-010  
**Epic:** Metrologia  
**Sprint:** 4  
**Prioridade:** Baixa  
**Estimativa:** 5 pontos  
**Status:** To Do  

---

## 📋 User Story

**Como** gerente ou administrador  
**Quero** visualizar KPIs e métricas do processo de metrologia  
**Para** monitorar eficiência, qualidade e gargalos da análise técnica

---

## 🎯 Business Objective

Fornecer visão gerencial do módulo de Metrologia, permitindo identificar padrões, otimizar processos e melhorar qualidade das análises.

---

## 📐 Business Rules

### RN001: KPIs Principais

**Cards de Métricas:**
- **Total de Análises Realizadas** (mês atual)
- **Tempo Médio de Conclusão** (em dias)
- **Taxa de Conclusão** (concluídas / iniciadas %)
- **Componentes Reprovados** (fora de tolerância %)

**Gráficos:**
1. **Análises por Período** (linha - últimos 6 meses)
2. **Status de Componentes** (pizza - Bom/Regular/Ruim/Crítico)
3. **Top 5 Problemas Identificados** (barra horizontal)
4. **Tempo por Etapa** (barra - tempo médio em cada etapa)
5. **Técnicos Mais Produtivos** (ranking)

### RN002: Filtros Disponíveis
- Período (últimos 7 dias, 30 dias, 90 dias, ano, customizado)
- Técnico responsável
- Marca/modelo do motor
- Status da análise (completa, em andamento, pendente)

### RN003: Insights Automáticos
Sistema exibe alertas inteligentes:
- ⚠️ "Taxa de conclusão abaixo da meta (68% vs 85%)"
- 📈 "Aumento de 23% em componentes críticos no último mês"
- ⏱️ "Tempo médio de análise aumentou 12% (atenção à Etapa 4)"
- 👤 "João Silva concluiu 15 análises neste mês (líder do time)"

### RN004: Exportação
- Botão "Exportar Relatório" (PDF)
- Inclui todos os KPIs, gráficos e insights
- Período selecionado no filtro

---

## ✅ Acceptance Criteria

**AC1:** Dashboard acessível via menu principal  
**AC2:** 4 cards de KPIs exibidos no topo  
**AC3:** 5 gráficos renderizados corretamente  
**AC4:** Filtros funcionais e atualizam dados em tempo real  
**AC5:** Insights automáticos exibidos em alertas  
**AC6:** Exportação de PDF funcional  
**AC7:** Responsivo (desktop e tablet)

---

## 🛠️ Definition of Done

- [ ] Página `MetrologyDashboard.tsx` criada
- [ ] Hook `useMetrologyKPIs.ts` implementado
- [ ] Componentes de gráficos (Recharts) configurados
- [ ] Query Supabase para agregações
- [ ] Sistema de insights implementado
- [ ] Exportação de PDF configurada
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/pages/
  └── MetrologyDashboard.tsx        (NEW)

src/components/metrologia/
  ├── KPICards.tsx                  (NEW)
  ├── MetrologyCharts.tsx           (NEW)
  └── InsightsPanel.tsx             (NEW)

src/hooks/
  └── useMetrologyKPIs.ts           (NEW)
```

---

## 🗄️ Database Queries

```sql
-- View para KPIs de Metrologia
CREATE OR REPLACE VIEW v_metrology_kpis AS
WITH metrology_stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE generated_at IS NOT NULL) as total_completed,
    COUNT(*) as total_started,
    AVG(EXTRACT(EPOCH FROM (generated_at - created_at)) / 86400) as avg_days_to_complete,
    DATE_TRUNC('month', generated_at) as month
  FROM metrology_reports
  GROUP BY DATE_TRUNC('month', generated_at)
),
component_stats AS (
  SELECT 
    general_condition,
    COUNT(*) as count
  FROM motor_dna
  WHERE general_condition IS NOT NULL
  GROUP BY general_condition
),
out_of_tolerance AS (
  SELECT 
    COUNT(*) as total_measurements,
    COUNT(*) FILTER (WHERE measurements::text LIKE '%"status":"fora_tolerancia"%') as out_of_tolerance_count
  FROM motor_dna
  WHERE measurements IS NOT NULL
)
SELECT *
FROM metrology_stats
CROSS JOIN component_stats
CROSS JOIN out_of_tolerance;

-- Função para gerar insights automáticos
CREATE OR REPLACE FUNCTION generate_metrology_insights(
  p_period_days INTEGER DEFAULT 30
) RETURNS JSON AS $$
DECLARE
  v_completion_rate DECIMAL;
  v_avg_time_current DECIMAL;
  v_avg_time_previous DECIMAL;
  v_critical_increase DECIMAL;
  v_insights JSON;
BEGIN
  -- Calcula taxa de conclusão
  SELECT 
    (COUNT(*) FILTER (WHERE generated_at IS NOT NULL)::DECIMAL / COUNT(*)) * 100
  INTO v_completion_rate
  FROM metrology_reports
  WHERE created_at >= CURRENT_DATE - p_period_days;

  -- Compara tempo médio
  SELECT 
    AVG(EXTRACT(EPOCH FROM (generated_at - created_at)) / 86400)
  INTO v_avg_time_current
  FROM metrology_reports
  WHERE generated_at >= CURRENT_DATE - p_period_days;

  SELECT 
    AVG(EXTRACT(EPOCH FROM (generated_at - created_at)) / 86400)
  INTO v_avg_time_previous
  FROM metrology_reports
  WHERE generated_at >= CURRENT_DATE - (p_period_days * 2)
  AND generated_at < CURRENT_DATE - p_period_days;

  -- Constrói JSON de insights
  v_insights := json_build_object(
    'completion_rate', v_completion_rate,
    'completion_alert', CASE 
      WHEN v_completion_rate < 85 THEN true 
      ELSE false 
    END,
    'avg_time_change', ((v_avg_time_current - v_avg_time_previous) / v_avg_time_previous) * 100,
    'time_alert', CASE 
      WHEN v_avg_time_current > v_avg_time_previous * 1.1 THEN true 
      ELSE false 
    END
  );

  RETURN v_insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Dashboard de Metrologia                          [← Voltar] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Filtros: [Últimos 30 dias ▼] [Todos os Técnicos ▼] [Filtrar]  │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐│
│  │ Análises    │ │ Tempo Médio │ │ Taxa de     │ │ Componentes  ││
│  │ Realizadas  │ │ Conclusão   │ │ Conclusão   │ │ Reprovados   ││
│  │             │ │             │ │             │ │              ││
│  │     42      │ │   5.2 dias  │ │     68%     │ │     23%      ││
│  │   📈 +12%   │ │   ⚠️ +0.8d  │ │   ⚠️ -17%   │ │   📈 +5%     ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────────┘│
│                                                                   │
│  ⚠️ Insights Automáticos:                                        │
│  • Taxa de conclusão abaixo da meta (68% vs 85%)                 │
│  • Tempo médio aumentou 15% - atenção à Etapa 4 (Medições)       │
│                                                                   │
│  ┌─ Análises Concluídas por Mês ────────────────────────────────┐│
│  │                                                               ││
│  │  50 │                                              ●          ││
│  │  40 │                            ●          ●                 ││
│  │  30 │              ●       ●                                  ││
│  │  20 │       ●                                                 ││
│  │  10 │                                                         ││
│  │   0 └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───         ││
│  │      Jan Feb Mar Abr Mai Jun Jul Ago Set Out Nov Dez        ││
│  └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─ Status de Componentes ──┐  ┌─ Top 5 Problemas ──────────────┐│
│  │                          │  │                                 ││
│  │       [Gráfico Pizza]    │  │  Fora de Tolerância  ████████  ││
│  │                          │  │  Desgaste Excessivo  ██████     ││
│  │  🟢 Bom: 42%             │  │  Trincas             ████       ││
│  │  🟡 Regular: 31%         │  │  Necessita Retífica  ███        ││
│  │  🟠 Ruim: 18%            │  │  Crítico             ██         ││
│  │  🔴 Crítico: 9%          │  │                                 ││
│  └──────────────────────────┘  └─────────────────────────────────┘│
│                                                                   │
│  ┌─ Técnicos Mais Produtivos (Este Mês) ──────────────────────────┐│
│  │  1º João Silva           15 análises      ⭐⭐⭐⭐⭐        ││
│  │  2º Maria Santos         12 análises      ⭐⭐⭐⭐          ││
│  │  3º Carlos Oliveira       9 análises      ⭐⭐⭐            ││
│  └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│                                          [📄 Exportar Relatório] │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Visualizar Dashboard
```gherkin
Given que sou gerente logado
When navego para "/metrologia/dashboard"
Then vejo 4 cards de KPIs no topo
And vejo gráfico de análises por mês
And vejo gráfico de pizza com status de componentes
And vejo ranking de técnicos
```

### E2E Test 2: Filtrar por Período
```gherkin
Given que estou no dashboard de metrologia
When seleciono filtro "Últimos 7 dias"
And clico em "Filtrar"
Then todos os KPIs são atualizados
And gráficos exibem dados dos últimos 7 dias
```

### E2E Test 3: Insights Automáticos
```gherkin
Given que taxa de conclusão está em 68%
And meta é 85%
When dashboard carrega
Then vejo alerta "Taxa de conclusão abaixo da meta (68% vs 85%)"
And alerta tem ícone de ⚠️
```

### E2E Test 4: Exportar Relatório PDF
```gherkin
Given que estou no dashboard com filtros aplicados
When clico em "Exportar Relatório"
Then PDF é gerado com:
  - Período selecionado no título
  - Todos os KPIs
  - Capturas dos gráficos
  - Lista de insights
And arquivo é baixado automaticamente
```

---

## 🚫 Negative Scope

**Não inclui:**
- Drill-down em gráficos para ver detalhes
- Alertas em tempo real (push notifications)
- Comparação entre técnicos (avaliação de desempenho)
- Previsão de demanda futura (machine learning)

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-MET-006 (Geração de relatórios - dados necessários)
- US-MET-009 (Integração com OrderDetails)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
