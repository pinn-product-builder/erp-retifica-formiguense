# US-EST-009: Relatórios de Movimentação

**ID:** US-EST-009  
**Epic:** Estoque  
**Sprint:** 8  
**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente de estoque  
**Quero** gerar relatórios analíticos de movimentações  
**Para** analisar consumo, giro e performance do estoque

---

## 🎯 Business Objective

Fornecer insights sobre utilização de estoque através de relatórios detalhados e indicadores de performance.

---

## 📐 Business Rules

### RN-EST-026: Tipos de Relatório
```typescript
type ReportType =
  | 'movement_summary'     // Resumo de movimentações
  | 'turnover_analysis'    // Análise de giro
  | 'consumption_by_order' // Consumo por OS
  | 'loss_analysis'        // Análise de perdas
  | 'stock_valuation';     // Valoração de estoque

interface StockMetrics {
  total_entries: number;
  total_exits: number;
  average_stock_value: number;
  turnover_ratio: number;        // Giro de estoque
  days_of_stock: number;         // Dias de estoque
  loss_percentage: number;
}
```

---

## 🗄️ Database Schema

```sql
-- View de métricas de estoque
CREATE VIEW stock_metrics AS
SELECT 
  org_id,
  DATE_TRUNC('month', created_at) AS period,
  
  COUNT(*) FILTER (WHERE movement_type IN ('purchase', 'return', 'production')) AS total_entries,
  COUNT(*) FILTER (WHERE movement_type IN ('sale', 'consumption', 'loss')) AS total_exits,
  
  SUM(total_cost) FILTER (WHERE movement_type IN ('purchase', 'return')) AS total_value_in,
  SUM(total_cost) FILTER (WHERE movement_type IN ('sale', 'consumption')) AS total_value_out,
  
  SUM(quantity) FILTER (WHERE movement_type = 'loss') AS total_losses,
  
  COUNT(DISTINCT part_id) AS parts_moved
FROM inventory_movements
GROUP BY org_id, DATE_TRUNC('month', created_at);
```

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
