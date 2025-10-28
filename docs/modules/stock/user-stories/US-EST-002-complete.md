# US-EST-002: Controlar Saldo de Estoque

**ID:** US-EST-002  
**Epic:** Estoque  
**Sprint:** 5  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente de estoque  
**Quero** visualizar saldos atualizados em tempo real  
**Para** tomar decisões de compra e atendimento de pedidos

---

## 🎯 Business Objective

Garantir visibilidade em tempo real dos saldos de estoque considerando físico, reservado e disponível.

---

## ✅ Acceptance Criteria

**AC01:** Card resumo: estoque total, reservado, disponível  
**AC02:** Lista de peças com saldo por tipo  
**AC03:** Badge de status: normal, baixo, crítico, zerado  
**AC04:** Atualização automática após movimentações  
**AC05:** Filtro por status de estoque  
**AC06:** Exportar relatório de saldos

---

## 📐 Business Rules

### RN-EST-007: Cálculo de Saldo
```typescript
interface StockBalance {
  part_id: string;
  physical_stock: number;        // Estoque físico
  reserved_stock: number;        // Reservado (orçamentos aprovados)
  available_stock: number;       // Disponível = físico - reservado
  in_transit: number;            // Em trânsito (pedidos de compra)
  committed: number;             // Comprometido (OS em produção)
}

// Fórmula
available_stock = physical_stock - reserved_stock - committed
```

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
