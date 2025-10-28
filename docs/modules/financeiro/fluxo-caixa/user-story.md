# US-FIN-003: Fluxo de Caixa

**ID:** US-FIN-003  
**Módulo:** Financeiro  
**Sprint:** 8  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** gestor financeiro  
**Quero** visualizar fluxo de caixa diário  
**Para** monitorar entradas, saídas e saldo disponível

---

## 🎯 Objetivo de Negócio

Dashboard de fluxo de caixa com visão consolidada de todas as movimentações financeiras, projeções e alertas de saldo baixo.

---

## ✅ Critérios de Aceitação

**AC01:** Visualizar saldo atual consolidado  
**AC02:** Gráfico de entradas vs saídas (últimos 30 dias)  
**AC03:** Listagem de movimentações por data  
**AC04:** Filtrar por tipo (entrada/saída), categoria, período  
**AC05:** Projeção de saldo futuro (7, 15, 30 dias)  
**AC06:** Alerta quando saldo projetado for negativo  
**AC07:** Exportar relatório em Excel/PDF  
**AC08:** Conciliação bancária (marcar como reconciliado)

---

## 📐 Regras de Negócio

### RN-FIN-003-A: Cálculo de Saldo
- Saldo Inicial + Entradas - Saídas = Saldo Atual
- Considera apenas transações confirmadas/pagas
- Atualização em tempo real

### RN-FIN-003-B: Projeção
- Projeção = Saldo Atual + Contas a Receber - Contas a Pagar
- Considerar apenas vencimentos no período
- Destacar períodos de saldo negativo

### RN-FIN-003-C: Conciliação
- Apenas transações pagas podem ser reconciliadas
- Uma vez reconciliado, não pode ser editado
- Registro de auditoria (quem e quando)

---

## 📊 Validação de Dados

### Zod Schema

```typescript
import { z } from 'zod';

export const cashFlowFilterSchema = z.object({
  start_date: z.date(),
  end_date: z.date(),
  transaction_type: z.enum(['income', 'expense', 'all']).default('all'),
  category_id: z.string().uuid().optional(),
  bank_account_id: z.string().uuid().optional(),
  reconciled: z.boolean().optional()
});

export const reconcileTransactionSchema = z.object({
  transaction_id: z.string().uuid(),
  reconciled_at: z.date().default(() => new Date()),
  notes: z.string().max(500).optional()
});
```

---

## 🎨 Componentes UI

- `CashFlowDashboard` - Dashboard principal
- `CashFlowChart` - Gráfico entradas vs saídas
- `TransactionsList` - Lista de movimentações
- `CashFlowProjection` - Projeção de saldo
- `ReconciliationModal` - Modal de conciliação
- `CashFlowFilters` - Filtros avançados
- `BalanceCard` - Card de saldo consolidado

---

## 🔗 Integrações

- **Contas a Pagar**: Despesas
- **Contas a Receber**: Receitas
- **Ordens de Serviço**: Recebimentos
- **Contas Bancárias**: Saldo por conta

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
