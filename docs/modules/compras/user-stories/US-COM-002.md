# US-COM-002: Produtos por Fornecedor

**ID:** US-COM-002  
**Epic:** Compras  
**Sprint:** 7  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** comprador  
**Quero** vincular produtos/peças a fornecedores com seus preços  
**Para** facilitar cotações e comparação de preços

---

## 🎯 Business Objective

Criar tabela de preços por fornecedor permitindo comparação rápida e seleção automática de melhor preço em cotações.

---

## ✅ Acceptance Criteria

**AC01:** Ao editar fornecedor, aba "Produtos" lista peças vinculadas  
**AC02:** Botão "Adicionar Produto" abre modal de busca de peças  
**AC03:** Para cada produto: código fornecedor, preço, qtd mínima, prazo entrega  
**AC04:** Checkbox "Fornecedor Preferencial" para marcação  
**AC05:** Registro de último preço e data de compra  
**AC06:** Validação de vigência (data início/fim opcional)  
**AC07:** Ao criar cotação, sugestão automática de fornecedores com produto  
**AC08:** Histórico de evolução de preços do produto

---

## 📐 Business Rules

### RN-COM-005: Tabela de Preços
```typescript
interface SupplierProduct {
  id: string;
  supplier_id: string;
  part_id: string;
  
  supplier_code: string;           // Código do fornecedor para a peça
  description?: string;             // Descrição do fornecedor (pode diferir)
  
  unit_price: number;              // Preço unitário atual
  minimum_quantity?: number;       // Qtd mínima de compra
  lead_time_days?: number;         // Prazo entrega em dias
  
  is_preferred: boolean;           // Fornecedor preferencial
  
  last_purchase_price?: number;    // Último preço de compra
  last_purchase_date?: Date;       // Data última compra
  
  valid_from?: Date;               // Vigência início
  valid_until?: Date;              // Vigência fim
  
  is_active: boolean;
  notes?: string;
  
  created_at: Date;
  updated_at: Date;
}
```

### RN-COM-006: Fornecedor Preferencial
```typescript
// Ao marcar fornecedor como preferencial
async function setPreferredSupplier(
  partId: string,
  supplierId: string
): Promise<void> {
  // Remove preferencial de outros
  await supabase
    .from('supplier_products')
    .update({ is_preferred: false })
    .eq('part_id', partId)
    .neq('supplier_id', supplierId);
  
  // Marca como preferencial
  await supabase
    .from('supplier_products')
    .update({ is_preferred: true })
    .eq('part_id', partId)
    .eq('supplier_id', supplierId);
}
```

### RN-COM-007: Vigência de Preços
```typescript
function isPriceValid(product: SupplierProduct): boolean {
  const now = new Date();
  
  if (product.valid_from && new Date(product.valid_from) > now) {
    return false;
  }
  
  if (product.valid_until && new Date(product.valid_until) < now) {
    return false;
  }
  
  return true;
}

// View de preços vigentes
CREATE VIEW valid_supplier_prices AS
SELECT 
  sp.*,
  p.code AS part_code,
  p.name AS part_name,
  s.trade_name AS supplier_name
FROM supplier_products sp
JOIN parts p ON p.id = sp.part_id
JOIN suppliers s ON s.id = sp.supplier_id
WHERE sp.is_active = true
AND sp.part_id IN (SELECT id FROM parts WHERE active = true)
AND sp.supplier_id IN (SELECT id FROM suppliers WHERE is_active = true)
AND (sp.valid_from IS NULL OR sp.valid_from <= CURRENT_DATE)
AND (sp.valid_until IS NULL OR sp.valid_until >= CURRENT_DATE);
```

### RN-COM-008: Sugestão de Fornecedores
```typescript
interface SupplierSuggestion {
  supplier_id: string;
  supplier_name: string;
  unit_price: number;
  lead_time_days: number;
  is_preferred: boolean;
  last_purchase_date?: Date;
  overall_rating: number;
}

async function getSuppliersForPart(
  partId: string
): Promise<SupplierSuggestion[]> {
  const { data } = await supabase
    .from('valid_supplier_prices')
    .select(`
      *,
      suppliers (
        trade_name,
        overall_rating,
        delivery_performance
      )
    `)
    .eq('part_id', partId)
    .order('is_preferred', { ascending: false })
    .order('unit_price', { ascending: true });
  
  return data;
}
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação
  supplier_code TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  minimum_quantity NUMERIC(10,3) CHECK (minimum_quantity > 0),
  lead_time_days INTEGER CHECK (lead_time_days >= 0),
  
  -- Status
  is_preferred BOOLEAN DEFAULT false,
  
  -- Histórico
  last_purchase_price NUMERIC(10,2),
  last_purchase_date DATE,
  
  -- Vigência
  valid_from DATE,
  valid_until DATE,
  
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_id, part_id),
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from)
);

-- Índices
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_part ON supplier_products(part_id);
CREATE INDEX idx_supplier_products_preferred ON supplier_products(is_preferred) 
  WHERE is_preferred = true;
CREATE INDEX idx_supplier_products_active ON supplier_products(is_active) 
  WHERE is_active = true;

-- View de preços vigentes
CREATE VIEW valid_supplier_prices AS
SELECT 
  sp.*,
  p.code AS part_code,
  p.name AS part_name,
  p.category AS part_category,
  s.code AS supplier_code,
  s.trade_name AS supplier_name,
  s.overall_rating AS supplier_rating,
  s.delivery_performance
FROM supplier_products sp
JOIN parts p ON p.id = sp.part_id
JOIN suppliers s ON s.id = sp.supplier_id
WHERE sp.is_active = true
AND p.active = true
AND s.is_active = true
AND (sp.valid_from IS NULL OR sp.valid_from <= CURRENT_DATE)
AND (sp.valid_until IS NULL OR sp.valid_until >= CURRENT_DATE);

-- RLS
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view supplier products from their organization"
  ON supplier_products FOR SELECT
  USING (
    supplier_id IN (
      SELECT id FROM suppliers 
      WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert supplier products in their organization"
  ON supplier_products FOR INSERT
  WITH CHECK (
    supplier_id IN (
      SELECT id FROM suppliers 
      WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update supplier products in their organization"
  ON supplier_products FOR UPDATE
  USING (
    supplier_id IN (
      SELECT id FROM suppliers 
      WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete supplier products in their organization"
  ON supplier_products FOR DELETE
  USING (
    supplier_id IN (
      SELECT id FROM suppliers 
      WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_supplier_products_updated_at
  BEFORE UPDATE ON supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar último preço de compra
CREATE OR REPLACE FUNCTION update_last_purchase_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando há recebimento, atualiza último preço
  UPDATE supplier_products
  SET 
    last_purchase_price = NEW.unit_cost,
    last_purchase_date = CURRENT_DATE
  WHERE part_id = NEW.part_id
  AND supplier_id IN (
    SELECT supplier_id 
    FROM purchase_orders 
    WHERE id IN (
      SELECT order_id 
      FROM purchase_order_items 
      WHERE id = NEW.order_item_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchase_info_on_receipt
  AFTER INSERT ON goods_receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION update_last_purchase_info();
```

---

## 🎨 Implementation

### Hook useSupplierProducts

```typescript
// src/hooks/useSupplierProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SupplierProduct {
  id?: string;
  supplier_id: string;
  part_id: string;
  supplier_code: string;
  description?: string;
  unit_price: number;
  minimum_quantity?: number;
  lead_time_days?: number;
  is_preferred: boolean;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  notes?: string;
}

export function useSupplierProducts(supplierId?: string) {
  const queryClient = useQueryClient();
  
  // List
  const { data: supplierProducts, isLoading } = useQuery({
    queryKey: ['supplier-products', supplierId],
    queryFn: async () => {
      let query = supabase
        .from('supplier_products')
        .select(`
          *,
          parts (
            code,
            name,
            category,
            current_stock
          )
        `)
        .order('created_at', { ascending: false });
      
      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });
  
  // Get suppliers for part
  const getSuppliersForPart = async (partId: string) => {
    const { data, error } = await supabase
      .from('valid_supplier_prices')
      .select('*')
      .eq('part_id', partId)
      .order('is_preferred', { ascending: false })
      .order('unit_price', { ascending: true });
    
    if (error) throw error;
    return data;
  };
  
  // Create
  const createMutation = useMutation({
    mutationFn: async (product: SupplierProduct) => {
      const { data, error } = await supabase
        .from('supplier_products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      toast.success('Produto vinculado ao fornecedor');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao vincular produto');
    },
  });
  
  // Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupplierProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from('supplier_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      toast.success('Produto atualizado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar produto');
    },
  });
  
  // Set preferred
  const setPreferredMutation = useMutation({
    mutationFn: async ({ partId, supplierId }: { partId: string; supplierId: string }) => {
      // Remove preferencial de outros
      await supabase
        .from('supplier_products')
        .update({ is_preferred: false })
        .eq('part_id', partId)
        .neq('supplier_id', supplierId);
      
      // Marca como preferencial
      const { data, error } = await supabase
        .from('supplier_products')
        .update({ is_preferred: true })
        .eq('part_id', partId)
        .eq('supplier_id', supplierId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      toast.success('Fornecedor marcado como preferencial');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao marcar como preferencial');
    },
  });
  
  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      toast.success('Produto removido do fornecedor');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover produto');
    },
  });
  
  return {
    supplierProducts,
    isLoading,
    getSuppliersForPart,
    createSupplierProduct: createMutation.mutateAsync,
    updateSupplierProduct: updateMutation.mutateAsync,
    setPreferred: setPreferredMutation.mutateAsync,
    deleteSupplierProduct: deleteMutation.mutateAsync,
  };
}
```

---

## 🧪 Test Scenarios

### Cenário 1: Vincular Produto
```gherkin
Given usuário está editando fornecedor
When acessar aba "Produtos"
And clicar em "Adicionar Produto"
And buscar e selecionar peça
And preencher código fornecedor e preço
Then produto deve ser vinculado
And aparecer na lista de produtos do fornecedor
```

### Cenário 2: Fornecedor Preferencial
```gherkin
Given peça tem 3 fornecedores vinculados
When marcar Fornecedor B como preferencial
Then Fornecedor B deve ficar marcado
And outros fornecedores devem perder marca preferencial
And ao cotar, Fornecedor B deve aparecer primeiro
```

### Cenário 3: Preço Vencido
```gherkin
Given produto com vigência até 31/12/2024
When chegar 01/01/2025
Then produto não deve aparecer em preços válidos
And ao cotar, não deve sugerir este fornecedor
And admin deve ver alerta de preço vencido
```

---

## ✓ Definition of Done

- [ ] Tabela `supplier_products` criada
- [ ] View `valid_supplier_prices` criada
- [ ] RLS policies implementadas
- [ ] Hook `useSupplierProducts.ts`
- [ ] Componente `SupplierProductsTab.tsx`
- [ ] Componente `AddSupplierProductModal.tsx`
- [ ] Função `setPreferredSupplier`
- [ ] Função `getSuppliersForPart`
- [ ] Validação de vigência
- [ ] Trigger de último preço compra
- [ ] Testes E2E
- [ ] Documentação atualizada

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
