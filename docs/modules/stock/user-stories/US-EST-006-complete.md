# US-EST-006: Baixa Automática por OS

**ID:** US-EST-006  
**Epic:** Estoque  
**Sprint:** 6  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** almoxarife  
**Quero** que peças sejam baixadas automaticamente ao iniciar OS  
**Para** manter estoque sincronizado com consumo real

---

## 🎯 Business Objective

Automatizar baixa de estoque baseada em orçamentos aprovados, consumindo reservas e atualizando saldo.

---

## ✅ Acceptance Criteria

**AC01:** Ao OS entrar em produção, baixar peças automaticamente  
**AC02:** Consumir reservas vinculadas ao orçamento  
**AC03:** Gerar movimentação de saída (consumo)  
**AC04:** Atualizar saldo disponível  
**AC05:** Permitir ajuste manual de quantidade  
**AC06:** Registrar justificativa se divergir do orçamento

---

## 📐 Business Rules

### RN-EST-020: Baixa Automática
```typescript
async function consumeStockForOrder(orderId: string): Promise<void> {
  // 1. Busca orçamento aprovado
  const budget = await getApprovedBudget(orderId);
  
  // 2. Para cada peça do orçamento
  for (const part of budget.parts) {
    // 3. Busca reserva ativa
    const reservation = await getActiveReservation(budget.id, part.id);
    
    // 4. Baixa estoque
    await createMovement({
      part_id: part.id,
      movement_type: 'consumption',
      quantity: -part.quantity,
      order_id: orderId,
    });
    
    // 5. Marca reserva como consumida
    await updateReservation(reservation.id, { status: 'consumed' });
  }
}
```

### RN-EST-021: Ajuste Manual
- Permitir alterar quantidade consumida
- Exigir justificativa se divergir > 10% do orçado

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
