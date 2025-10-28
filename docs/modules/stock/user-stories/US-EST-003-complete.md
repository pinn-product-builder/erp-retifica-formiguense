# US-EST-003: Registrar Movimentações

**ID:** US-EST-003  
**Epic:** Estoque  
**Sprint:** 6  
**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** almoxarife  
**Quero** registrar todas entradas e saídas de estoque  
**Para** manter rastreabilidade completa

---

## 🎯 Business Objective

Criar histórico auditável de todas movimentações com atualização automática de saldo e custo médio.

---

## ✅ Acceptance Criteria

**AC01:** Formulário de movimentação (entrada/saída)  
**AC02:** Tipos: compra, venda, ajuste, transferência, consumo, devolução  
**AC03:** Campos: peça, quantidade, custo unitário, motivo  
**AC04:** Atualização automática do custo médio (entrada)  
**AC05:** Validação de estoque disponível (saída)  
**AC06:** Histórico completo de movimentações  
**AC07:** Filtros: período, tipo, peça  
**AC08:** Função admin: estornar movimentação

---

## 📐 Business Rules

### RN-EST-011: Tipos de Movimentação
```typescript
type MovementType =
  | 'purchase'       // Compra
  | 'sale'           // Venda
  | 'consumption'    // Consumo em OS
  | 'return'         // Devolução
  | 'adjustment_in'  // Ajuste entrada
  | 'adjustment_out' // Ajuste saída
  | 'transfer_in'    // Transferência entrada
  | 'transfer_out'   // Transferência saída
  | 'production'     // Produção
  | 'loss';          // Perda

interface InventoryMovement {
  id: string;
  org_id: string;
  part_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number;
  total_cost: number;
  
  previous_quantity: number;
  new_quantity: number;
  
  reason: string;
  notes?: string;
  
  // Relacionamentos
  order_id?: string;
  budget_id?: string;
  supplier_id?: string;
  transfer_to_location?: string;
  
  // Rastreabilidade
  batch?: string;
  manufacturing_date?: Date;
  expiration_date?: Date;
  
  // Audit
  created_by: string;
  created_at: Date;
}
```

### RN-EST-012: Custo Médio Ponderado
```typescript
function calculateWeightedAverage(
  currentStock: number,
  currentAvgCost: number,
  incomingQty: number,
  incomingCost: number
): number {
  const totalValue = (currentStock * currentAvgCost) + (incomingQty * incomingCost);
  const totalQty = currentStock + incomingQty;
  return totalValue / totalQty;
}
```

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
