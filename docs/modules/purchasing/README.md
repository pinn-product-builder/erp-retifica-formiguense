# Módulo de Compras

## 📋 Visão Geral

Sistema completo de gestão de compras, desde análise de necessidades até recebimento de mercadorias, com controle de fornecedores, cotações e pedidos.

## 🎯 Objetivo

Otimizar processo de compras, garantir melhores preços, controlar fornecedores e manter rastreabilidade completa das aquisições.

## 📊 Funcionalidades Principais

### Gestão de Fornecedores
- Cadastro completo (nome, CNPJ, contato)
- Rating e avaliação
- Condições de pagamento
- Prazo de entrega padrão
- Histórico de fornecimentos

### Necessidades de Compra
- Análise automática de estoque mínimo
- Sugestões de reposição
- Priorização por criticidade

### Requisições de Compra
- Criação por departamento
- Múltiplos itens por requisição
- Nível de prioridade (baixa, média, alta, urgente, crítica)
- Justificativa obrigatória
- Workflow de aprovação

### Sistema de Cotações
- Múltiplas cotações por requisição
- Comparativo automático
- Seleção de melhor oferta
- Histórico de cotações

### Pedidos de Compra
- Geração automática a partir de cotação
- Acompanhamento de status
- Previsão de entrega
- Notificações

### Recebimentos
- Registro de entrada
- Conferência de quantidade
- Qualidade dos itens
- Notas fiscais

### Avaliações de Fornecedores
- Critérios: qualidade, prazo, preço, atendimento
- Notas de 1-5
- Comentários
- Histórico de avaliações

## 🔗 Integração com Outros Módulos

- **Estoque**: Alertas de estoque mínimo
- **Financeiro**: Contas a pagar
- **Orçamentos**: Peças necessárias

## 🧪 Implementação Atual

**Componente Principal:** `src/pages/Compras.tsx`  
**Hook:** `src/hooks/usePurchasing.ts`

**Componentes Especializados:**
- `PurchaseNeedsManager` - Análise de necessidades
- `QuotationManager` - Gestão de cotações
- `PurchaseOrderManager` - Pedidos de compra
- `ReceiptManager` - Recebimentos
- `SupplierEvaluation` - Avaliação de fornecedores

**Tabelas:**
- `suppliers` - Fornecedores
- `purchase_needs` - Necessidades identificadas
- `purchase_requisitions` - Requisições
- `purchase_requisition_items` - Itens das requisições
- `quotations` - Cotações
- `quotation_items` - Itens cotados
- `purchase_orders` - Pedidos de compra
- `purchase_order_items` - Itens do pedido
- `purchase_receipts` - Recebimentos
- `supplier_evaluations` - Avaliações

### Interfaces Principais
```typescript
interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  rating: number; // 1.0 - 5.0
  payment_terms?: string;
  delivery_days: number;
  is_active: boolean;
  org_id: string;
}

interface PurchaseRequisition {
  id: string;
  requisition_number: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  justification: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  total_estimated_value: number;
  org_id: string;
  created_at: string;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  status: 'draft' | 'sent' | 'confirmed' | 'completed' | 'cancelled';
  total_value: number;
  expected_delivery_date?: string;
  notes?: string;
  org_id: string;
  created_at: string;
}
```

### Métodos Disponíveis
- `createSupplier(data)` - Cadastrar fornecedor
- `createRequisition(data, items)` - Criar requisição
- `updateRequisitionStatus(id, status)` - Aprovar/rejeitar
- `createQuotation(requisitionId, supplierId, items)` - Criar cotação
- `createPurchaseOrder(quotationId)` - Gerar pedido
- `recordReceipt(orderId, items)` - Registrar recebimento
- `evaluateSupplier(supplierId, evaluation)` - Avaliar fornecedor

## 📋 Workflow de Compras

```
1. Necessidade identificada → Requisição criada
2. Requisição → Aprovação
3. Requisição aprovada → Cotações
4. Melhor cotação → Pedido de Compra
5. Pedido enviado → Acompanhamento
6. Mercadoria chega → Recebimento
7. Recebimento OK → Entrada no Estoque + Conta a Pagar
8. Após fornecimento → Avaliação do Fornecedor
```

## 📅 Última Atualização

**Data**: 28/10/2025  
**Status**: ✅ Em Produção
