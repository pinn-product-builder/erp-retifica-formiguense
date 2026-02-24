# US-COM-005: Gerar Pedido de Compra

**ID:** US-COM-005  
**Epic:** Compras  
**Sprint:** 8  
**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** comprador  
**Quero** gerar pedido de compra a partir de cotação aprovada  
**Para** formalizar compra com fornecedor

---

## 🎯 Business Objective

Automatizar criação de pedidos de compra a partir de cotações aprovadas, agrupando por fornecedor e calculando totais.

---

## ✅ Acceptance Criteria

**AC01:** Gerar pedido automaticamente das propostas selecionadas  
**AC02:** Agrupar itens por fornecedor (1 pedido por fornecedor)  
**AC03:** Incluir: itens, quantidades, preços, condições pagamento  
**AC04:** Calcular subtotal, descontos, frete, impostos, total  
**AC05:** Status inicial: "rascunho"  
**AC06:** Permitir editar antes de enviar  
**AC07:** Botão "Enviar ao Fornecedor" (muda status para "sent")  
**AC08:** Gerar PDF do pedido

---

## 📐 Business Rules

### RN-COM-017: Geração de Pedido
```typescript
async function generatePurchaseOrdersFromQuotation(
  quotationId: string
): Promise<PurchaseOrder[]> {
  const selections = await getQuotationSelections(quotationId);
  
  // Agrupa por fornecedor
  const bySupplier = groupBy(selections, 'supplier_id');
  
  const orders = [];
  for (const [supplierId, items] of Object.entries(bySupplier)) {
    const order = await createPurchaseOrder({
      supplier_id: supplierId,
      quotation_id: quotationId,
      items: items.map(item => ({
        part_id: item.part_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      })),
    });
    orders.push(order);
  }
  
  return orders;
}
```

### RN-PUR-016: Numeração do Pedido
Formato: PC-AAMMDD-NNN
Exemplo: PC-260108-001
Sequencial por organização

### RN-PUR-017: Fluxo de Status do Pedido
rascunho → pendente → aprovado → enviado → parcial/concluído
                    ↓
                 rejeitado → cancelado


---

esquema banco de dados (se não houver)
``` sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  quotation_id UUID REFERENCES quotations(id),
  
  status TEXT NOT NULL DEFAULT 'rascunho',
  
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE NOT NULL,
  
  subtotal NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) DEFAULT 0,
  shipping_cost NUMERIC(12,2) DEFAULT 0,
  taxes NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  
  payment_terms TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  
  delivery_address JSONB NOT NULL,
  
  notes TEXT,
  internal_notes TEXT,
  
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  part_id UUID NOT NULL,
  
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  
  received_quantity NUMERIC(10,3) DEFAULT 0,
  pending_quantity NUMERIC(10,3),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Última atualização:** 2025-01-27  
**Versão:** 1.0
