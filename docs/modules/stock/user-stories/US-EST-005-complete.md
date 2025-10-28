# US-EST-005: Reservar Peças para Orçamento

**ID:** US-EST-005  
**Epic:** Estoque  
**Sprint:** 6  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente comercial  
**Quero** reservar peças automaticamente ao aprovar orçamento  
**Para** garantir disponibilidade e evitar venda sem estoque

---

## 🎯 Business Objective

Sincronizar orçamentos aprovados com estoque através de reserva automática.

---

## ✅ Acceptance Criteria

**AC01:** Ao aprovar orçamento, reservar peças automaticamente  
**AC02:** Exibir saldo disponível (descontando reservas)  
**AC03:** Liberar reserva se orçamento for rejeitado  
**AC04:** Consumir reserva ao iniciar OS  
**AC05:** Alerta se estoque insuficiente para reserva  
**AC06:** Lista de reservas ativas por peça

---

## 📐 Business Rules

### RN-EST-018: Reserva
```typescript
interface StockReservation {
  id: string;
  org_id: string;
  budget_id: string;
  part_id: string;
  quantity: number;
  status: 'active' | 'consumed' | 'cancelled';
  reserved_at: Date;
  consumed_at?: Date;
}
```

### RN-EST-019: Gatilhos
- Criar reserva: orçamento `status = 'approved'`
- Liberar reserva: orçamento `status = 'rejected'`
- Consumir reserva: OS inicia produção

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
