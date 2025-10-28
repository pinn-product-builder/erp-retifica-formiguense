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
**Quero** receber alertas automáticos de estoque baixo  
**Para** evitar rupturas e garantir disponibilidade

---

## 🎯 Business Objective

Sistema proativo de alertas com sugestões automáticas de reposição para prevenir faltas.

---

## ✅ Acceptance Criteria

**AC01:** Widget no dashboard com alertas críticos  
**AC02:** Badge numérico de alertas  
**AC03:** Lista completa de alertas  
**AC04:** Níveis: crítico (zerado), urgente (ponto pedido), baixo (mínimo)  
**AC05:** Sugestão automática de quantidade de compra  
**AC06:** Botão direto para criar pedido de compra  
**AC07:** Email para alertas críticos

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
  part_id: string;
  alert_level: AlertLevel;
  current_stock: number;
  minimum_stock: number;
  reorder_point: number;
  shortage: number;
  suggested_order: number;
  days_until_stockout?: number;
}
```

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
