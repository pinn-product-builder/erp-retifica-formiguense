# Módulo de Compras

**Epic:** Compras  
**Versão:** 1.0  
**Última atualização:** 2025-01-27

---

## 📋 Visão Geral

Sistema completo de gestão de compras de peças e materiais, com controle de fornecedores, cotações, pedidos de compra e recebimento de mercadorias.

---

## 🎯 Objetivos de Negócio

- Centralizar gestão de fornecedores e produtos
- Otimizar processo de cotação com múltiplos fornecedores
- Controlar pedidos de compra com aprovações
- Integrar recebimento com estoque
- Analisar performance de fornecedores
- Garantir rastreabilidade de compras

---

## 📊 Métricas de Sucesso

| Métrica | Meta | Descrição |
|---------|------|-----------|
| Tempo médio de cotação | < 2 dias | Da solicitação à aprovação |
| Taxa de conformidade no recebimento | > 95% | Pedidos recebidos conforme solicitado |
| Economia em compras | > 10% | Através de cotações competitivas |
| Fornecedores ativos | > 10 | Por categoria de produto |
| Prazo de entrega médio | < 7 dias | Do pedido ao recebimento |

---

## 🗂️ User Stories

| ID | Título | Prioridade | Sprint | Status |
|----|--------|------------|--------|--------|
| US-COM-001 | Cadastrar Fornecedores | Alta | 7 | Backlog |
| US-COM-002 | Produtos por Fornecedor | Alta | 7 | Backlog |
| US-COM-003 | Criar Cotação | Alta | 8 | Backlog |
| US-COM-004 | Comparar Propostas | Média | 8 | Backlog |
| US-COM-005 | Gerar Pedido de Compra | Alta | 8 | Backlog |
| US-COM-006 | Aprovar Pedido de Compra | Alta | 9 | Backlog |
| US-COM-007 | Receber Mercadorias | Alta | 9 | Backlog |
| US-COM-008 | Devolver Mercadorias | Média | 9 | Backlog |
| US-COM-009 | Avaliar Fornecedores | Baixa | 10 | Backlog |
| US-COM-010 | Relatórios de Compras | Média | 10 | Backlog |

---

## 📐 Regras de Negócio Principais

### RN-COM-001: Cadastro de Fornecedores
```typescript
interface Supplier {
  id: string;
  org_id: string;
  code: string;                    // Código único
  trade_name: string;              // Nome fantasia
  legal_name: string;              // Razão social
  document: string;                // CNPJ
  state_registration?: string;     // Inscrição estadual
  municipal_registration?: string; // Inscrição municipal
  
  // Contato
  email: string;
  phone: string;
  website?: string;
  
  // Endereço
  address: Address;
  
  // Financeiro
  payment_terms: string[];         // ['30', '60', '90']
  payment_methods: PaymentMethod[];
  credit_limit?: number;
  
  // Categorias
  categories: string[];            // ['pecas_motor', 'ferramentas']
  
  // Performance
  rating?: number;                 // 1-5
  delivery_performance?: number;   // 0-100%
  quality_rating?: number;         // 0-100%
  
  // Status
  is_active: boolean;
  blocked: boolean;
  blocked_reason?: string;
  
  created_at: Date;
  updated_at: Date;
}
```

### RN-COM-002: Tabela de Preços
```typescript
interface SupplierProduct {
  id: string;
  supplier_id: string;
  part_id: string;
  
  supplier_code: string;           // Código do fornecedor
  description?: string;
  
  unit_price: number;
  minimum_quantity?: number;       // Qtd mínima
  lead_time_days?: number;         // Prazo de entrega
  
  is_preferred: boolean;           // Fornecedor preferencial
  last_purchase_price?: number;
  last_purchase_date?: Date;
  
  valid_from?: Date;
  valid_until?: Date;
  is_active: boolean;
}
```

### RN-COM-003: Processo de Cotação
```typescript
type QuotationStatus = 
  | 'draft'          // Rascunho
  | 'sent'           // Enviada
  | 'responded'      // Respondida
  | 'approved'       // Aprovada
  | 'rejected'       // Rejeitada
  | 'cancelled';     // Cancelada

interface Quotation {
  id: string;
  org_id: string;
  quotation_number: string;
  
  requested_by: string;
  requested_date: Date;
  due_date: Date;
  
  status: QuotationStatus;
  items: QuotationItem[];
  
  notes?: string;
  created_at: Date;
}

interface QuotationItem {
  id: string;
  quotation_id: string;
  part_id: string;
  quantity: number;
  
  description: string;
  specifications?: string;
  
  proposals: QuotationProposal[];
}

interface QuotationProposal {
  id: string;
  quotation_item_id: string;
  supplier_id: string;
  
  unit_price: number;
  total_price: number;
  lead_time_days: number;
  
  payment_terms: string;
  notes?: string;
  
  is_selected: boolean;
  responded_at: Date;
}
```

### RN-COM-004: Pedido de Compra
```typescript
type PurchaseOrderStatus =
  | 'draft'          // Rascunho
  | 'pending'        // Aguardando aprovação
  | 'approved'       // Aprovado
  | 'sent'           // Enviado ao fornecedor
  | 'partial'        // Parcialmente recebido
  | 'completed'      // Concluído
  | 'cancelled';     // Cancelado

interface PurchaseOrder {
  id: string;
  org_id: string;
  order_number: string;
  
  supplier_id: string;
  quotation_id?: string;
  
  status: PurchaseOrderStatus;
  
  order_date: Date;
  expected_delivery_date: Date;
  
  items: PurchaseOrderItem[];
  
  subtotal: number;
  discount?: number;
  shipping_cost?: number;
  taxes?: number;
  total: number;
  
  payment_terms: string;
  payment_method: PaymentMethod;
  
  delivery_address: Address;
  
  notes?: string;
  internal_notes?: string;
  
  created_by: string;
  approved_by?: string;
  approved_at?: Date;
  
  created_at: Date;
  updated_at: Date;
}

interface PurchaseOrderItem {
  id: string;
  order_id: string;
  part_id: string;
  
  description: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  total: number;
  
  received_quantity: number;
  pending_quantity: number;
  
  notes?: string;
}
```

### RN-COM-005: Recebimento
```typescript
type ReceivingStatus =
  | 'pending'        // Aguardando
  | 'partial'        // Parcial
  | 'completed'      // Concluído
  | 'divergent';     // Com divergência

interface GoodsReceipt {
  id: string;
  org_id: string;
  receipt_number: string;
  
  purchase_order_id: string;
  
  received_date: Date;
  received_by: string;
  
  status: ReceivingStatus;
  
  items: GoodsReceiptItem[];
  
  invoice_number?: string;
  invoice_date?: Date;
  
  notes?: string;
  
  created_at: Date;
}

interface GoodsReceiptItem {
  id: string;
  receipt_id: string;
  order_item_id: string;
  
  ordered_quantity: number;
  received_quantity: number;
  rejected_quantity?: number;
  
  rejection_reason?: string;
  
  batch?: string;
  expiration_date?: Date;
  
  unit_cost: number;
  total_cost: number;
  
  notes?: string;
}
```

### RN-COM-006: Aprovações
- Pedidos < R$ 1.000: Auto-aprovado
- Pedidos R$ 1.000-5.000: Aprovação gerente
- Pedidos > R$ 5.000: Aprovação admin

### RN-COM-007: Avaliação de Fornecedores
```typescript
interface SupplierEvaluation {
  id: string;
  supplier_id: string;
  org_id: string;
  
  evaluation_date: Date;
  period_start: Date;
  period_end: Date;
  
  // Critérios (0-100)
  delivery_performance: number;    // Pontualidade
  quality_rating: number;          // Qualidade dos produtos
  price_competitiveness: number;   // Competitividade de preço
  service_rating: number;          // Atendimento
  compliance_rating: number;       // Conformidade documental
  
  overall_rating: number;          // Média ponderada
  
  comments?: string;
  evaluated_by: string;
  
  created_at: Date;
}
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

```sql
-- Fornecedores
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  code TEXT NOT NULL UNIQUE,
  trade_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  document TEXT NOT NULL,
  state_registration TEXT,
  municipal_registration TEXT,
  
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,
  
  address JSONB NOT NULL,
  
  payment_terms TEXT[] DEFAULT ARRAY['30'],
  payment_methods TEXT[] DEFAULT ARRAY['boleto'],
  credit_limit NUMERIC(12,2),
  
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  rating NUMERIC(2,1),
  delivery_performance NUMERIC(5,2),
  quality_rating NUMERIC(5,2),
  
  is_active BOOLEAN DEFAULT true,
  blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(org_id, document),
  UNIQUE(org_id, code)
);

-- Produtos por fornecedor
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  part_id UUID REFERENCES parts(id) NOT NULL,
  
  supplier_code TEXT NOT NULL,
  description TEXT,
  
  unit_price NUMERIC(10,2) NOT NULL,
  minimum_quantity NUMERIC(10,3),
  lead_time_days INTEGER,
  
  is_preferred BOOLEAN DEFAULT false,
  last_purchase_price NUMERIC(10,2),
  last_purchase_date DATE,
  
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_id, part_id)
);

-- Cotações
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  quotation_number TEXT NOT NULL UNIQUE,
  
  requested_by UUID REFERENCES profiles(id) NOT NULL,
  requested_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'draft',
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Items de cotação
CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) NOT NULL,
  part_id UUID REFERENCES parts(id) NOT NULL,
  
  quantity NUMERIC(10,3) NOT NULL,
  description TEXT NOT NULL,
  specifications TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Propostas de fornecedores
CREATE TABLE quotation_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_item_id UUID REFERENCES quotation_items(id) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  lead_time_days INTEGER NOT NULL,
  
  payment_terms TEXT,
  notes TEXT,
  
  is_selected BOOLEAN DEFAULT false,
  responded_at TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pedidos de compra
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  quotation_id UUID REFERENCES quotations(id),
  
  status TEXT NOT NULL DEFAULT 'draft',
  
  order_date DATE NOT NULL,
  expected_delivery_date DATE NOT NULL,
  
  subtotal NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2),
  shipping_cost NUMERIC(12,2),
  taxes NUMERIC(12,2),
  total NUMERIC(12,2) NOT NULL,
  
  payment_terms TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  
  delivery_address JSONB NOT NULL,
  
  notes TEXT,
  internal_notes TEXT,
  
  created_by UUID REFERENCES profiles(id) NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Items de pedido
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES purchase_orders(id) NOT NULL,
  part_id UUID REFERENCES parts(id) NOT NULL,
  
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  discount_percentage NUMERIC(5,2),
  total NUMERIC(10,2) NOT NULL,
  
  received_quantity NUMERIC(10,3) DEFAULT 0,
  pending_quantity NUMERIC(10,3),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recebimentos
CREATE TABLE goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  receipt_number TEXT NOT NULL UNIQUE,
  
  purchase_order_id UUID REFERENCES purchase_orders(id) NOT NULL,
  
  received_date DATE NOT NULL,
  received_by UUID REFERENCES profiles(id) NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending',
  
  invoice_number TEXT,
  invoice_date DATE,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Items de recebimento
CREATE TABLE goods_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES goods_receipts(id) NOT NULL,
  order_item_id UUID REFERENCES purchase_order_items(id) NOT NULL,
  
  ordered_quantity NUMERIC(10,3) NOT NULL,
  received_quantity NUMERIC(10,3) NOT NULL,
  rejected_quantity NUMERIC(10,3),
  
  rejection_reason TEXT,
  
  batch TEXT,
  expiration_date DATE,
  
  unit_cost NUMERIC(10,2) NOT NULL,
  total_cost NUMERIC(10,2) NOT NULL,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Avaliações de fornecedores
CREATE TABLE supplier_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  
  evaluation_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  delivery_performance NUMERIC(5,2) NOT NULL,
  quality_rating NUMERIC(5,2) NOT NULL,
  price_competitiveness NUMERIC(5,2) NOT NULL,
  service_rating NUMERIC(5,2) NOT NULL,
  compliance_rating NUMERIC(5,2) NOT NULL,
  
  overall_rating NUMERIC(5,2) NOT NULL,
  
  comments TEXT,
  evaluated_by UUID REFERENCES profiles(id) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔗 Integrações

### Com Estoque
- Recebimento cria movimentação de entrada
- Consulta saldo disponível antes de aprovar OS
- Atualiza custo médio ponderado

### Com Financeiro
- Pedido gera conta a pagar
- Vincula NF com recebimento
- Rastreia pagamentos a fornecedores

### Com Alertas de Estoque
- Alerta de estoque mínimo sugere compra
- Vincula pedido com alerta
- Mostra histórico de reposição

---

## 🎨 Componentes UI

### Páginas
- `/compras` - Lista de pedidos
- `/compras/fornecedores` - Gestão de fornecedores
- `/compras/cotacoes` - Cotações
- `/compras/recebimento` - Recebimento de mercadorias

### Componentes
- `SupplierForm` - Cadastro de fornecedor
- `SupplierList` - Lista de fornecedores
- `QuotationForm` - Nova cotação
- `ProposalComparison` - Comparar propostas
- `PurchaseOrderForm` - Novo pedido
- `GoodsReceiptForm` - Receber mercadorias
- `SupplierEvaluationCard` - Avaliar fornecedor

---

## 📊 KPIs e Métricas

```sql
-- Dashboard de Compras
CREATE VIEW purchasing_dashboard AS
SELECT
  org_id,
  
  -- Pedidos
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_orders,
  COUNT(*) FILTER (WHERE expected_delivery_date < CURRENT_DATE 
    AND status NOT IN ('completed', 'cancelled')) AS overdue_orders,
  
  -- Valores
  SUM(total) FILTER (WHERE status = 'approved' 
    AND order_date >= CURRENT_DATE - INTERVAL '30 days') AS monthly_purchases,
  SUM(total) FILTER (WHERE status = 'approved' 
    AND order_date >= CURRENT_DATE - INTERVAL '12 months') AS yearly_purchases,
  
  -- Fornecedores
  COUNT(DISTINCT supplier_id) AS active_suppliers

FROM purchase_orders
GROUP BY org_id;
```

---

## 🧪 Testes

### Cenários de Teste
1. Cadastrar fornecedor com CNPJ válido
2. Criar cotação para múltiplos fornecedores
3. Comparar propostas e selecionar melhor
4. Gerar pedido a partir de cotação
5. Aprovar pedido conforme alçada
6. Receber mercadorias com divergência
7. Avaliar fornecedor após período

---

## 🚀 Roadmap Futuro

### Q2 2025
- [ ] Integração com marketplace de fornecedores
- [ ] Cotação eletrônica automatizada
- [ ] Negociação online com fornecedores

### Q3 2025
- [ ] Análise preditiva de demanda
- [ ] Sugestão automática de pedidos
- [ ] Contratos de fornecimento

### Q4 2025
- [ ] Portal do fornecedor
- [ ] EDI para grandes fornecedores
- [ ] Auditoria de conformidade

---

**Status:** 📝 Em Documentação  
**Próxima Revisão:** Q2 2025
