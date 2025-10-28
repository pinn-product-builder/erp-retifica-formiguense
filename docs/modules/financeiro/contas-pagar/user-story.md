# US-FIN-001: Contas a Pagar

**ID:** US-FIN-001  
**Módulo:** Financeiro  
**Sprint:** 8  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** Em Desenvolvimento

---

## 📋 User Story

**Como** gestor financeiro  
**Quero** cadastrar e gerenciar contas a pagar  
**Para** controlar despesas e prazos de pagamento

---

## 🎯 Objetivo de Negócio

Sistema completo de controle de contas a pagar com categorização, controle de vencimentos e histórico de pagamentos para gestão financeira eficiente.

---

## ✅ Critérios de Aceitação

**AC01:** Cadastrar conta a pagar com fornecedor, valor, vencimento  
**AC02:** Categorizar por tipo (peças, mão de obra, aluguel, etc)  
**AC03:** Vincular a uma OS (opcional)  
**AC04:** Permitir anexar NF-e  
**AC05:** Marcar como paga (data + forma de pagamento)  
**AC06:** Listar contas (pendentes, pagas, vencidas)  
**AC07:** Filtrar por período, fornecedor, categoria  
**AC08:** Dashboard com totais e alertas

---

## 📐 Regras de Negócio

### RN-FIN-001: Validação de Conta
- Valor deve ser maior que zero
- Data de vencimento não pode ser retroativa ao criar
- Fornecedor obrigatório
- Categoria obrigatória

### RN-FIN-002: Pagamento
- Só pode marcar como paga se estiver pendente
- Data de pagamento não pode ser futura
- Forma de pagamento obrigatória ao pagar
- Após pagar, não pode editar valores

### RN-FIN-003: Alertas
- Alerta 7 dias antes do vencimento
- Alerta no dia do vencimento
- Conta vencida fica em vermelho

### RN-FIN-004: Anexos
- Máximo 5MB por arquivo
- Formatos: PDF, XML, JPG, PNG
- Armazenamento em storage bucket 'invoices'

---

## 🔐 Permissões

- **admin**: CRUD completo
- **manager**: CRUD completo
- **employee**: Apenas visualização

---

## 📊 Validação de Dados

### Zod Schema

```typescript
import { z } from 'zod';

export const payableAccountSchema = z.object({
  supplier_id: z.string().uuid('Fornecedor inválido'),
  category_id: z.string().uuid('Categoria inválida'),
  order_id: z.string().uuid().optional(),
  
  amount: z.number()
    .positive('Valor deve ser maior que zero')
    .max(999999.99, 'Valor muito alto'),
  
  due_date: z.date()
    .refine((date) => date >= new Date(), {
      message: 'Data de vencimento não pode ser passada'
    }),
  
  description: z.string()
    .min(3, 'Descrição muito curta')
    .max(500, 'Descrição muito longa'),
  
  notes: z.string().max(1000).optional(),
  
  invoice_number: z.string().max(100).optional(),
  invoice_file_url: z.string().url().optional(),
  
  payment_method: z.enum([
    'dinheiro',
    'pix',
    'transferencia',
    'boleto',
    'cartao_credito',
    'cartao_debito'
  ]).optional(),
  
  paid_at: z.date().optional(),
  paid_amount: z.number().positive().optional()
});
```

---

## 🎨 Componentes UI

- `PayableAccountForm` - Formulário de cadastro/edição
- `PayableAccountsList` - Lista com filtros
- `PayableAccountCard` - Card individual
- `PaymentModal` - Modal para registrar pagamento
- `InvoiceUploader` - Upload de notas fiscais
- `PayablesDashboard` - Dashboard com resumos

---

## 🔗 Integrações

- **Fornecedores**: Busca de fornecedores cadastrados
- **Categorias**: Classificação de despesas
- **Ordens de Serviço**: Vínculo opcional com OS
- **Storage**: Upload de NF-e no bucket 'invoices'

---

## 📱 Responsividade

- Desktop: Tabela completa com filtros laterais
- Tablet: Tabela compacta, filtros em drawer
- Mobile: Cards empilhados, filtros em modal

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
