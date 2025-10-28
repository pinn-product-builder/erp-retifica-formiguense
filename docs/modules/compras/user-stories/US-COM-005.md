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

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
