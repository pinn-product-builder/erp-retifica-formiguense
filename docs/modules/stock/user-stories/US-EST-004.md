# US-EST-004: Alertas de Estoque Mínimo

**ID:** US-EST-004  
**Epic:** Estoque  
**Sprint:** 6  
**Prioridade:** Alta  
**Estimativa:** 3 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente de estoque  
**Quero** receber alertas automáticos quando peças atingirem estoque mínimo  
**Para** evitar rupturas e garantir disponibilidade para produção

---

## 🎯 Business Objective

Prevenir faltas de estoque através de sistema proativo de alertas e sugestões automáticas de reposição.

---

## 📐 Business Rules

### RN-EST-015: Níveis de Alerta
```typescript
type AlertLevel = 
  | 'critical'    // Zerado
  | 'urgent'      // <= ponto de pedido
  | 'low'         // <= estoque mínimo
  | 'normal';     // > estoque mínimo

interface StockAlert {
  id: string;
  part_id: string;
  alert_level: AlertLevel;
  current_stock: number;
  minimum_stock: number;
  reorder_point: number;
  shortage: number;          // Quanto falta
  suggested_order: number;   // Sugestão de compra
  days_until_stockout?: number;
  created_at: Date;
  acknowledged: boolean;
}
```

### RN-EST-016: Cálculo de Sugestão
```typescript
// Sugestão de compra
suggested_order = economic_order_quantity || 
                  (maximum_stock - current_stock)

// Se houver demanda média conhecida
days_until_stockout = current_stock / average_daily_consumption
```

### RN-EST-017: Notificações
- **Crítico (zerado)**: Notificação imediata + email
- **Urgente (ponto pedido)**: Notificação push + dashboard
- **Baixo (mínimo)**: Dashboard widget
- **Frequência**: Diária (não repetir mesmo alerta)

---

## ✅ Acceptance Criteria

**AC21:** Dashboard exibe widget com alertas críticos  
**AC22:** Badge numérico mostra quantidade de alertas  
**AC23:** Lista completa de alertas é acessível  
**AC24:** Sugestão de quantidade de compra é calculada  
**AC25:** Botão direto para criar pedido de compra  
**AC26:** Email enviado para alertas críticos

---

## 🗄️ Database Schema

```sql
-- View de alertas de estoque
CREATE OR REPLACE VIEW stock_alerts AS
SELECT 
  p.id AS part_id,
  p.org_id,
  p.code,
  p.name,
  p.category,
  p.current_stock,
  p.minimum_stock,
  p.reorder_point,
  p.economic_order_quantity,
  p.maximum_stock,
  
  CASE 
    WHEN p.current_stock = 0 THEN 'critical'
    WHEN p.current_stock <= p.reorder_point THEN 'urgent'
    WHEN p.current_stock <= p.minimum_stock THEN 'low'
    ELSE 'normal'
  END AS alert_level,
  
  GREATEST(p.minimum_stock - p.current_stock, 0) AS shortage,
  
  COALESCE(
    p.economic_order_quantity,
    p.maximum_stock - p.current_stock
  ) AS suggested_order,
  
  p.primary_supplier_id,
  p.average_cost
FROM parts p
WHERE p.active = true
AND p.current_stock <= p.minimum_stock;

GRANT SELECT ON stock_alerts TO authenticated;
```

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
