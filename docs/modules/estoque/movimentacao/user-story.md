# US-EST-002: Movimentação de Estoque

**ID:** US-EST-002  
**Módulo:** Estoque  
**Sprint:** 9  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** almoxarife  
**Quero** registrar entradas e saídas de peças  
**Para** manter controle preciso do inventário

---

## 🎯 Objetivo de Negócio

Rastreabilidade completa de movimentações com auditoria, motivos e vínculo a processos (OS, compras).

---

## ✅ Critérios de Aceitação

**AC01:** Registrar entrada (compra, devolução, ajuste)  
**AC02:** Registrar saída (venda, consumo OS, perda)  
**AC03:** Informar quantidade e motivo  
**AC04:** Vincular a OS ou ordem de compra  
**AC05:** Atualizar estoque automaticamente  
**AC06:** Histórico de movimentações  
**AC07:** Filtrar por período, tipo, peça  
**AC08:** Exportar relatório de movimentações

---

## 📐 Regras de Negócio

### RN-EST-002-A: Entrada
- Tipos: compra, devolução_cliente, ajuste_positivo, transferência_entrada
- Atualiza custo médio ponderado
- Gera registro de auditoria

### RN-EST-002-B: Saída
- Tipos: venda, consumo_os, perda, ajuste_negativo, transferência_saída
- Não pode resultar em estoque negativo
- Requer motivo obrigatório

### RN-EST-002-C: Cálculo de Custo Médio
```
Custo Médio = (Estoque Atual × Custo Atual + Quantidade Entrada × Custo Entrada) / (Estoque Atual + Quantidade Entrada)
```

---

## 📊 Validação de Dados

### Zod Schema

```typescript
import { z } from 'zod';

export const inventoryMovementSchema = z.object({
  part_id: z.string().uuid(),
  
  movement_type: z.enum([
    'purchase',
    'customer_return',
    'positive_adjustment',
    'sale',
    'order_consumption',
    'loss',
    'negative_adjustment',
    'transfer_in',
    'transfer_out'
  ]),
  
  quantity: z.number().positive(),
  
  unit_cost: z.number().positive().optional(),
  
  reason: z.string().min(3).max(500),
  
  order_id: z.string().uuid().optional(),
  purchase_order_id: z.string().uuid().optional(),
  
  notes: z.string().max(1000).optional()
});
```

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
