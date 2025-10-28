# US-COM-002: Cotação de Preços

**ID:** US-COM-002  
**Módulo:** Compras  
**Sprint:** 9  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** comprador  
**Quero** solicitar cotações a múltiplos fornecedores  
**Para** comparar preços e condições antes de comprar

---

## 🎯 Objetivo de Negócio

Processo estruturado de cotação com comparativo automático para garantir melhor custo-benefício nas compras.

---

## ✅ Critérios de Aceitação

**AC01:** Criar solicitação de cotação com lista de itens  
**AC02:** Selecionar múltiplos fornecedores  
**AC03:** Enviar por email automaticamente  
**AC04:** Fornecedores respondem com preços  
**AC05:** Quadro comparativo automático  
**AC06:** Destacar menor preço por item  
**AC07:** Aprovar cotação vencedora  
**AC08:** Gerar ordem de compra automaticamente

---

## 📐 Regras de Negócio

### RN-COM-002-A: Solicitação
- Mínimo 3 fornecedores (se disponíveis)
- Prazo de resposta: 3 a 7 dias úteis
- Itens devem ter especificação clara

### RN-COM-002-B: Comparação
- Ordenar por menor preço
- Considerar prazo de entrega
- Considerar condições de pagamento
- Cálculo de custo total (preço + frete)

### RN-COM-002-C: Aprovação
- Apenas 1 fornecedor vencedor por item
- Registrar justificativa se não for menor preço
- Histórico de decisão

---

## 📊 Validação de Dados

### Zod Schema

```typescript
import { z } from 'zod';

export const quotationRequestSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(1000).optional(),
  
  items: z.array(z.object({
    part_id: z.string().uuid().optional(),
    description: z.string().min(3),
    quantity: z.number().positive(),
    unit: z.string()
  })).min(1),
  
  supplier_ids: z.array(z.string().uuid()).min(1),
  
  deadline: z.date(),
  
  delivery_location: z.string().max(500),
  payment_terms: z.string().max(200).optional(),
  notes: z.string().max(1000).optional()
});

export const quotationResponseSchema = z.object({
  request_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  
  items: z.array(z.object({
    item_id: z.string().uuid(),
    unit_price: z.number().positive(),
    delivery_days: z.number().int().positive(),
    notes: z.string().optional()
  })),
  
  shipping_cost: z.number().min(0).default(0),
  payment_terms: z.string().max(200).optional(),
  validity_days: z.number().int().positive().default(30)
});
```

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
