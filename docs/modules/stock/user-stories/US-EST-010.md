# US-EST-010: Curva ABC de Peças

**ID:** US-EST-010  
**Epic:** Estoque  
**Sprint:** 8  
**Prioridade:** Baixa  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente de estoque  
**Quero** visualizar curva ABC das peças  
**Para** priorizar gestão de itens mais importantes

---

## 🎯 Business Objective

Otimizar gestão de estoque através de classificação ABC, focando esforços em itens críticos.

---

## 📐 Business Rules

### RN-EST-027: Classificação ABC
```typescript
type ABCClass = 'A' | 'B' | 'C';

interface ABCAnalysis {
  part_id: string;
  annual_consumption_value: number;
  accumulated_percentage: number;
  abc_class: ABCClass;  // A: 80%, B: 15%, C: 5%
  movement_frequency: number;
}

// Classificação
// Classe A: 20% dos itens, 80% do valor
// Classe B: 30% dos itens, 15% do valor  
// Classe C: 50% dos itens, 5% do valor
```

---

## 🗄️ Database Schema

```sql
-- View de análise ABC
CREATE VIEW abc_analysis AS
WITH part_consumption AS (
  SELECT 
    im.part_id,
    SUM(im.quantity * im.unit_cost) AS annual_value,
    COUNT(*) AS movement_count
  FROM inventory_movements im
  WHERE im.created_at >= CURRENT_DATE - INTERVAL '12 months'
  AND im.movement_type = 'consumption'
  GROUP BY im.part_id
),
ranked_parts AS (
  SELECT 
    pc.*,
    SUM(pc.annual_value) OVER (ORDER BY pc.annual_value DESC) / 
    SUM(pc.annual_value) OVER () * 100 AS accumulated_percentage
  FROM part_consumption pc
)
SELECT 
  rp.*,
  CASE 
    WHEN rp.accumulated_percentage <= 80 THEN 'A'
    WHEN rp.accumulated_percentage <= 95 THEN 'B'
    ELSE 'C'
  END AS abc_class
FROM ranked_parts rp;
```

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
