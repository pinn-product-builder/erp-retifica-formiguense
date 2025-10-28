# US-COM-003: Criar Cotação

**ID:** US-COM-003  
**Epic:** Compras  
**Sprint:** 8  
**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** comprador  
**Quero** criar cotações e enviar para múltiplos fornecedores  
**Para** comparar propostas e obter melhor preço

---

## 🎯 Business Objective

Automatizar processo de cotação permitindo solicitação simultânea a múltiplos fornecedores e consolidação de respostas.

---

## ✅ Acceptance Criteria

**AC01:** Formulário de nova cotação com data limite de resposta  
**AC02:** Adicionar múltiplos itens (peças) à cotação  
**AC03:** Para cada item: quantidade, especificações técnicas  
**AC04:** Sugestão automática de fornecedores por item  
**AC05:** Seleção de fornecedores para receber cotação  
**AC06:** Envio por email com link para responder  
**AC07:** Status: rascunho, enviada, respondida  
**AC08:** Dashboard com cotações pendentes resposta  
**AC09:** Notificação quando fornecedor responde

---

## 📐 Business Rules

### RN-COM-009: Estrutura de Cotação
```typescript
type QuotationStatus = 
  | 'draft'          // Rascunho
  | 'sent'           // Enviada aos fornecedores
  | 'responded'      // Ao menos um fornecedor respondeu
  | 'approved'       // Proposta aprovada
  | 'rejected'       // Rejeitada
  | 'cancelled';     // Cancelada

interface Quotation {
  id: string;
  org_id: string;
  quotation_number: string;        // AUTO: COT-00001
  
  requested_by: string;             // Usuário solicitante
  requested_date: Date;
  due_date: Date;                   // Prazo para resposta
  
  status: QuotationStatus;
  
  items: QuotationItem[];
  
  notes?: string;                   // Observações gerais
  delivery_address?: Address;       // Endereço de entrega
  
  created_at: Date;
  updated_at: Date;
}

interface QuotationItem {
  id: string;
  quotation_id: string;
  part_id: string;
  
  quantity: number;
  description: string;              // Descrição da peça
  specifications?: string;          // Especificações técnicas
  
  suggested_suppliers: string[];    // IDs dos fornecedores sugeridos
  selected_suppliers: string[];     // IDs dos selecionados para cotar
  
  proposals: QuotationProposal[];   // Propostas dos fornecedores
}

interface QuotationProposal {
  id: string;
  quotation_item_id: string;
  supplier_id: string;
  
  unit_price: number;
  total_price: number;
  lead_time_days: number;           // Prazo de entrega
  
  payment_terms: string;            // Condições de pagamento
  technical_specs?: string;         // Especificações técnicas oferecidas
  notes?: string;
  
  is_selected: boolean;             // Proposta selecionada
  
  responded_at: Date;
  responded_by?: string;            // Email/contato que respondeu
}
```

### RN-COM-010: Numeração Automática
```typescript
// Formato: COT-YYMMDD-NNN
// Exemplo: COT-250127-001
async function generateQuotationNumber(orgId: string): Promise<string> {
  const today = new Date();
  const prefix = `COT-${today.getFullYear().toString().slice(2)}${
    String(today.getMonth() + 1).padStart(2, '0')
  }${String(today.getDate()).padStart(2, '0')}`;
  
  const { data } = await supabase
    .from('quotations')
    .select('quotation_number')
    .eq('org_id', orgId)
    .like('quotation_number', `${prefix}%`)
    .order('quotation_number', { ascending: false })
    .limit(1)
    .single();
  
  let sequence = 1;
  if (data) {
    const lastSeq = parseInt(data.quotation_number.split('-')[2]);
    sequence = lastSeq + 1;
  }
  
  return `${prefix}-${String(sequence).padStart(3, '0')}`;
}
```

### RN-COM-011: Sugestão de Fornecedores
```typescript
async function suggestSuppliersForItem(
  partId: string
): Promise<SupplierSuggestion[]> {
  const { data } = await supabase
    .from('valid_supplier_prices')
    .select(`
      supplier_id,
      supplier_name,
      unit_price,
      lead_time_days,
      is_preferred,
      last_purchase_date,
      supplier_rating,
      delivery_performance
    `)
    .eq('part_id', partId)
    .order('is_preferred', { ascending: false })
    .order('supplier_rating', { ascending: false })
    .limit(10);
  
  return data || [];
}
```

### RN-COM-012: Email de Cotação
```typescript
interface QuotationEmailData {
  quotation_number: string;
  supplier_name: string;
  due_date: string;
  items: {
    description: string;
    quantity: number;
    specifications?: string;
  }[];
  notes?: string;
  response_link: string;         // Link público para responder
}

async function sendQuotationEmail(
  quotationId: string,
  supplierId: string
): Promise<void> {
  const quotation = await getQuotation(quotationId);
  const supplier = await getSupplier(supplierId);
  
  const emailData: QuotationEmailData = {
    quotation_number: quotation.quotation_number,
    supplier_name: supplier.trade_name,
    due_date: formatDate(quotation.due_date),
    items: quotation.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      specifications: item.specifications,
    })),
    notes: quotation.notes,
    response_link: `${APP_URL}/public/quotation-response/${quotationId}/${supplierId}`,
  };
  
  await sendEmail({
    to: supplier.email,
    subject: `Solicitação de Cotação ${quotation.quotation_number}`,
    template: 'quotation-request',
    data: emailData,
  });
}
```

---

## 🗄️ Database Schema

```sql
-- Cotações
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  quotation_number TEXT NOT NULL UNIQUE,
  
  requested_by UUID REFERENCES profiles(id) NOT NULL,
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'sent', 'responded', 'approved', 'rejected', 'cancelled')),
  
  notes TEXT,
  delivery_address JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CHECK (due_date >= requested_date)
);

-- Items de cotação
CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
  part_id UUID REFERENCES parts(id) NOT NULL,
  
  quantity NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  description TEXT NOT NULL,
  specifications TEXT,
  
  suggested_suppliers TEXT[],       -- Array de UUIDs
  selected_suppliers TEXT[],        -- Array de UUIDs
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Propostas de fornecedores
CREATE TABLE quotation_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_item_id UUID REFERENCES quotation_items(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  lead_time_days INTEGER NOT NULL CHECK (lead_time_days >= 0),
  
  payment_terms TEXT,
  technical_specs TEXT,
  notes TEXT,
  
  is_selected BOOLEAN DEFAULT false,
  
  responded_at TIMESTAMPTZ DEFAULT now(),
  responded_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(quotation_item_id, supplier_id)
);

-- Índices
CREATE INDEX idx_quotations_org ON quotations(org_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_due_date ON quotations(due_date);
CREATE INDEX idx_quotation_items_quotation ON quotation_items(quotation_id);
CREATE INDEX idx_quotation_items_part ON quotation_items(part_id);
CREATE INDEX idx_quotation_proposals_item ON quotation_proposals(quotation_item_id);
CREATE INDEX idx_quotation_proposals_supplier ON quotation_proposals(supplier_id);

-- RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotations from their organization"
  ON quotations FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert quotations in their organization"
  ON quotations FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update quotations in their organization"
  ON quotations FOR UPDATE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Items herdam permissão da cotação
CREATE POLICY "Users can view quotation items from their organization"
  ON quotation_items FOR SELECT
  USING (quotation_id IN (
    SELECT id FROM quotations 
    WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can manage quotation items in their organization"
  ON quotation_items FOR ALL
  USING (quotation_id IN (
    SELECT id FROM quotations 
    WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  ));

-- Proposals herdam permissão do item
CREATE POLICY "Users can view quotation proposals from their organization"
  ON quotation_proposals FOR SELECT
  USING (quotation_item_id IN (
    SELECT id FROM quotation_items qi
    JOIN quotations q ON q.id = qi.quotation_id
    WHERE q.org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can manage quotation proposals in their organization"
  ON quotation_proposals FOR ALL
  USING (quotation_item_id IN (
    SELECT id FROM quotation_items qi
    JOIN quotations q ON q.id = qi.quotation_id
    WHERE q.org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  ));

-- Trigger para número automático
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER AS $$
DECLARE
  today_prefix TEXT;
  last_seq INTEGER;
BEGIN
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    today_prefix := 'COT-' || 
      TO_CHAR(CURRENT_DATE, 'YYMMDD') || '-';
    
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(quotation_number FROM '\d+$') AS INTEGER)), 
      0
    ) INTO last_seq
    FROM quotations
    WHERE org_id = NEW.org_id
    AND quotation_number LIKE today_prefix || '%';
    
    NEW.quotation_number := today_prefix || LPAD((last_seq + 1)::TEXT, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quotation_number
  BEFORE INSERT ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION generate_quotation_number();

-- Trigger para updated_at
CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View consolidada
CREATE VIEW quotation_details AS
SELECT 
  q.*,
  p.full_name AS requested_by_name,
  COUNT(DISTINCT qi.id) AS total_items,
  COUNT(DISTINCT qp.id) AS total_proposals,
  COUNT(DISTINCT qp.supplier_id) AS suppliers_responded
FROM quotations q
JOIN profiles p ON p.id = q.requested_by
LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
LEFT JOIN quotation_proposals qp ON qp.quotation_item_id = qi.id
GROUP BY q.id, p.full_name;
```

---

## 🖼️ Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│ Nova Cotação                                   COT-250127-001 │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Prazo para Resposta: [15/02/2025]                            │
│ Endereço de Entrega: [Selecionar...]                         │
│                                                                │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ ITENS DA COTAÇÃO                          [+ Item]     │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │                                                          │   │
│ │ 1. Rolamento 6204                                       │   │
│ │    Quantidade: 10 un                                    │   │
│ │    Especificações: Rolamento rígido de esferas...      │   │
│ │                                                          │   │
│ │    Fornecedores Sugeridos (3):                          │   │
│ │    ☑ Rolamentos Sul (R$ 15,90) - Preferencial          │   │
│ │    ☑ Peças Express (R$ 16,50)                           │   │
│ │    ☐ Importadora ABC (R$ 14,20)                         │   │
│ │                                                          │   │
│ │    [Editar] [Remover]                                   │   │
│ │                                                          │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │                                                          │   │
│ │ 2. Retentor 40x60x10                                    │   │
│ │    Quantidade: 5 un                                     │   │
│ │    Especificações: Retentor de borracha NBR...         │   │
│ │                                                          │   │
│ │    Fornecedores Sugeridos (2):                          │   │
│ │    ☑ Retentores BR (R$ 8,50)                            │   │
│ │    ☑ Vedações Tech (R$ 9,00) - Preferencial            │   │
│ │                                                          │   │
│ │    [Editar] [Remover]                                   │   │
│ │                                                          │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                                │
│ Observações:                                                   │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Favor informar prazo de entrega e condições de        │   │
│ │ pagamento. Preferência por lotes completos.           │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                                │
│ [Salvar Rascunho]  [Enviar Cotação] [Cancelar]               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### Cenário 1: Criar Cotação Completa
```gherkin
Given usuário está na página de compras
When clicar em "Nova Cotação"
And adicionar 2 itens com quantidades
And selecionar fornecedores para cada item
And definir prazo de resposta
And clicar em "Enviar Cotação"
Then cotação deve ser criada com número automático
And emails devem ser enviados aos fornecedores
And status deve ser "enviada"
```

### Cenário 2: Sugestão Automática
```gherkin
Given peça "Rolamento 6204" tem 3 fornecedores
And Fornecedor A é preferencial
When adicionar item na cotação
Then deve sugerir os 3 fornecedores
And Fornecedor A deve aparecer primeiro
And todos devem vir pré-selecionados
```

### Cenário 3: Validação de Prazo
```gherkin
Given usuário está criando cotação
When tentar definir prazo anterior a hoje
Then deve exibir erro "Prazo deve ser futuro"
And não permitir salvar
```

---

## ✓ Definition of Done

- [ ] Tabelas `quotations`, `quotation_items`, `quotation_proposals` criadas
- [ ] View `quotation_details` criada
- [ ] RLS policies implementadas
- [ ] Trigger de numeração automática
- [ ] Hook `useQuotations.ts`
- [ ] Componente `QuotationForm.tsx`
- [ ] Componente `QuotationItemForm.tsx`
- [ ] Função `suggestSuppliersForItem`
- [ ] Função `sendQuotationEmail`
- [ ] Página `/public/quotation-response/:id/:supplier`
- [ ] Template de email
- [ ] Testes E2E
- [ ] Documentação atualizada

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
