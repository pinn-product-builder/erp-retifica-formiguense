# US-FIN-002: Contas a Receber

**ID:** US-FIN-002  
**Módulo:** Financeiro  
**Sprint:** 8  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** gestor financeiro  
**Quero** cadastrar e gerenciar contas a receber  
**Para** controlar receitas e prazos de recebimento

---

## 🎯 Objetivo de Negócio

Sistema completo de controle de contas a receber com parcelamento, controle de inadimplência e histórico de recebimentos.

---

## ✅ Critérios de Aceitação

**AC01:** Cadastrar conta a receber vinculada a cliente e OS  
**AC02:** Suportar parcelamento (ex: 3x R$ 100,00)  
**AC03:** Registrar pagamento parcial ou total  
**AC04:** Calcular juros e multas por atraso  
**AC05:** Aplicar descontos  
**AC06:** Listar contas (pendentes, pagas, vencidas)  
**AC07:** Filtrar por período, cliente, status  
**AC08:** Dashboard com totais e inadimplência

---

## 📐 Regras de Negócio

### RN-FIN-002-A: Validação de Conta
- Valor deve ser maior que zero
- Cliente obrigatório
- Vínculo com OS ou Orçamento
- Data de vencimento não pode ser retroativa

### RN-FIN-002-B: Parcelamento
- Mínimo 1x, máximo 12x
- Parcelas devem ter vencimentos mensais
- Valor total = soma das parcelas

### RN-FIN-002-C: Recebimento
- Aceitar pagamento parcial
- Calcular juros automáticos (2% + 0,033%/dia)
- Permitir descontos manuais
- Data de recebimento não pode ser futura

### RN-FIN-002-D: Inadimplência
- Conta vencida há mais de 30 dias = inadimplente
- Bloquear novos orçamentos para clientes inadimplentes
- Alerta automático a cada 7 dias

---

## 📊 Validação de Dados

### Zod Schema

```typescript
import { z } from 'zod';

export const receivableAccountSchema = z.object({
  customer_id: z.string().uuid('Cliente inválido'),
  order_id: z.string().uuid().optional(),
  budget_id: z.string().uuid().optional(),
  
  amount: z.number()
    .positive('Valor deve ser maior que zero')
    .max(999999.99, 'Valor muito alto'),
  
  due_date: z.date()
    .refine((date) => date >= new Date(), {
      message: 'Data de vencimento não pode ser passada'
    }),
  
  installment_number: z.number().min(1).max(12).default(1),
  total_installments: z.number().min(1).max(12).default(1),
  
  invoice_number: z.string().max(100).optional(),
  
  payment_method: z.enum([
    'dinheiro',
    'pix',
    'transferencia',
    'boleto',
    'cartao_credito',
    'cartao_debito'
  ]).optional(),
  
  late_fee: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  
  notes: z.string().max(1000).optional()
});
```

---

## 🎨 Componentes UI

- `ReceivableAccountForm` - Formulário de cadastro
- `ReceivableAccountsList` - Lista com filtros
- `ReceivableAccountCard` - Card individual
- `PaymentReceiptModal` - Modal para registrar recebimento
- `InstallmentCalculator` - Calculadora de parcelas
- `OverdueAlert` - Alerta de inadimplência

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
