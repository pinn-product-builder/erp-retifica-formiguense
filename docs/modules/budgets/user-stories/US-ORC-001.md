# US-ORC-001: Criar Orçamento Detalhado por Componente

**ID:** US-ORC-001  
**Epic:** Orçamentos  
**Sprint:** 4  
**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente comercial  
**Quero** criar orçamentos detalhados separados por componente do motor  
**Para** apresentar proposta clara e organizada ao cliente

---

## 🎯 Business Objective

Criar orçamentos estruturados que facilitem compreensão do cliente e permitam aprovação granular por componente.

---

## 📐 Business Rules

### RN001: Estrutura do Orçamento
**Um orçamento por componente:**
```typescript
interface DetailedBudget {
  id: string;
  order_id: string;
  component: ComponentType;
  budget_number: string; // Auto-gerado: ORC-2025-0001-BLOCO
  diagnostic_response_id?: string;
  status: BudgetStatus;
  
  // Itens
  services: ServiceItem[];
  parts: PartItem[];
  
  // Cálculos
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total: number;
  
  // Metadados
  warranty_months: number;
  notes?: string;
  valid_until: Date; // Validade do orçamento
  created_by: string;
  created_at: Date;
}

interface ServiceItem {
  service_code: string;
  service_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  estimated_hours: number;
}

interface PartItem {
  part_id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  in_stock: boolean;
}
```

### RN002: Geração de Número do Orçamento
**Formato:** `ORC-{ANO}-{SEQ}-{COMPONENTE}`

**Exemplo:**
- `ORC-2025-0001-BLOCO`
- `ORC-2025-0001-CABECOTE`
- `ORC-2025-0002-VIRABREQUIM`

**Regras:**
- SEQ incrementa por OS (não global)
- Componente em UPPERCASE
- Zero-padded (4 dígitos para sequência)

### RN003: Status Inicial
- Novo orçamento sempre inicia como `draft`
- Pode ser editado livremente enquanto `draft`
- Ao enviar para aprovação, status muda para `pending_customer`

### RN004: Validade do Orçamento
- Padrão: 30 dias a partir da criação
- Configurável por empresa (15, 30, 45, 60 dias)
- Orçamento vencido pode ser renovado (nova data)

### RN005: Wizard de Criação
**Steps:**
1. Selecionar componente
2. Adicionar serviços (US-ORC-002)
3. Adicionar peças (US-ORC-002)
4. Configurar descontos/impostos (US-ORC-003)
5. Revisar e salvar

### RN006: Permissões
- **Gerente/Admin:** Pode criar e editar orçamentos
- **Consultor:** Pode criar orçamentos (aprovação gerente)
- **Técnico:** Apenas visualiza orçamentos

---

## ✅ Acceptance Criteria

**AC1:** Botão "Criar Orçamento" aparece em OrderDetails  
**AC2:** Wizard abre com seleção de componente  
**AC3:** Número do orçamento é gerado automaticamente  
**AC4:** Status inicial é "draft"  
**AC5:** Validade padrão é 30 dias  
**AC6:** Orçamento salvo aparece na lista da OS

---

## 🛠️ Definition of Done

- [ ] Tabela `detailed_budgets` criada
- [ ] Componente `BudgetWizard.tsx` implementado
- [ ] Hook `useDetailedBudgets.ts` criado
- [ ] Função de geração de número automática
- [ ] Validações com Zod schema
- [ ] Status "draft" funcional
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/budgets/
  ├── BudgetWizard.tsx             (NEW)
  └── ComponentSelector.tsx        (NEW)

src/components/orders/
  └── OrderDetails.tsx             (UPDATE - botão criar)

src/hooks/
  └── useDetailedBudgets.ts        (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela de orçamentos detalhados
CREATE TABLE detailed_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  component TEXT NOT NULL CHECK (component IN (
    'bloco', 'cabecote', 'virabrequim', 'biela', 
    'pistao', 'comando', 'eixo'
  )),
  budget_number TEXT NOT NULL UNIQUE,
  diagnostic_response_id UUID REFERENCES diagnostic_responses(id),
  
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_customer', 'customer_approved', 
    'approved', 'rejected', 'revised'
  )),
  
  -- Itens
  services JSONB DEFAULT '[]'::jsonb,
  parts JSONB DEFAULT '[]'::jsonb,
  
  -- Cálculos
  subtotal NUMERIC(10,2) DEFAULT 0,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  tax_percentage NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  
  -- Metadados
  warranty_months INTEGER DEFAULT 6 CHECK (warranty_months >= 3 AND warranty_months <= 24),
  notes TEXT,
  valid_until DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(order_id, component)
);

-- Índices
CREATE INDEX idx_detailed_budgets_order ON detailed_budgets(order_id);
CREATE INDEX idx_detailed_budgets_status ON detailed_budgets(status);
CREATE INDEX idx_detailed_budgets_budget_number ON detailed_budgets(budget_number);

-- RLS Policies
ALTER TABLE detailed_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budgets of their org"
  ON detailed_budgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = detailed_budgets.order_id
      AND o.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Managers can create budgets"
  ON detailed_budgets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN orders o ON o.org_id = p.org_id
      WHERE p.id = auth.uid()
      AND o.id = detailed_budgets.order_id
      AND p.role IN ('gerente', 'admin', 'consultor')
    )
  );

CREATE POLICY "Managers can update draft budgets"
  ON detailed_budgets FOR UPDATE
  USING (
    status = 'draft'
    AND EXISTS (
      SELECT 1 FROM profiles p
      JOIN orders o ON o.org_id = p.org_id
      WHERE p.id = auth.uid()
      AND o.id = detailed_budgets.order_id
      AND p.role IN ('gerente', 'admin', 'consultor')
    )
  );

-- Função para gerar número do orçamento
CREATE OR REPLACE FUNCTION generate_budget_number(
  p_order_id UUID,
  p_component TEXT
) RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
  v_budget_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Busca última sequência desta OS
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(budget_number, '-', 3) AS INTEGER)
  ), 0) + 1 INTO v_seq
  FROM detailed_budgets
  WHERE order_id = p_order_id;
  
  -- Formata número
  v_budget_number := 'ORC-' || v_year || '-' || 
    LPAD(v_seq::TEXT, 4, '0') || '-' || 
    UPPER(p_component);
  
  RETURN v_budget_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar número automaticamente
CREATE OR REPLACE FUNCTION set_budget_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.budget_number IS NULL THEN
    NEW.budget_number := generate_budget_number(NEW.order_id, NEW.component);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_budget_number
  BEFORE INSERT ON detailed_budgets
  FOR EACH ROW
  EXECUTE FUNCTION set_budget_number();

-- Trigger para updated_at
CREATE TRIGGER trg_update_detailed_budgets_timestamp
  BEFORE UPDATE ON detailed_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_diagnostic_checklists_updated_at();
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Orçamentos - OS #1234                                  [X]  │
├─────────────────────────────────────────────────────────────┤
│  Mercedes-Benz OM 906 - ABC Motors Ltda                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ORÇAMENTOS CRIADOS (3/7 componentes)                    ││
│  ├─────────────────────────────────────────────────────────┤│
│  │                                                          ││
│  │ ✅ ORC-2025-0001-BLOCO                                  ││
│  │    Status: Rascunho | Total: R$ 2.550,00                ││
│  │    [Editar] [Excluir] [Visualizar]                      ││
│  │                                                          ││
│  │ ✅ ORC-2025-0002-CABECOTE                               ││
│  │    Status: Rascunho | Total: R$ 830,00                  ││
│  │    [Editar] [Excluir] [Visualizar]                      ││
│  │                                                          ││
│  │ ✅ ORC-2025-0003-VIRABREQUIM                            ││
│  │    Status: Rascunho | Total: R$ 950,00                  ││
│  │    [Editar] [Excluir] [Visualizar]                      ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Componentes Pendentes: Biela, Pistão, Comando, Eixo        │
│                                                               │
│              [+ Criar Novo Orçamento de Componente]          │
│                                                               │
│  ┌─ WIZARD: Novo Orçamento ─────────────────────────────────┐│
│  │                                                       [X] ││
│  │ Criar Orçamento - Passo 1/5: Selecionar Componente      ││
│  │ ─────────────────────────────────────────────────────── ││
│  │                                                          ││
│  │ Selecione o componente para orçar: *                    ││
│  │                                                          ││
│  │ ┌────────────────────────────────────────────────────┐  ││
│  │ │ [  ] Bloco               (já orçado ✅)            │  ││
│  │ │ [  ] Cabeçote            (já orçado ✅)            │  ││
│  │ │ [  ] Virabrequim         (já orçado ✅)            │  ││
│  │ │ (•) Biela                                           │  ││
│  │ │ [  ] Pistão                                         │  ││
│  │ │ [  ] Comando                                        │  ││
│  │ │ [  ] Eixo                                           │  ││
│  │ └────────────────────────────────────────────────────┘  ││
│  │                                                          ││
│  │ ℹ️ Este componente será diagnosticado em:               ││
│  │    Diagnóstico #DR-2025-0001 (27/01/2025)              ││
│  │    Técnico: João Silva                                  ││
│  │    Serviços sugeridos: 1                                ││
│  │                                                          ││
│  │ Número do Orçamento (auto-gerado):                      ││
│  │ ORC-2025-0004-BIELA                                     ││
│  │                                                          ││
│  │ Validade do Orçamento: *                                 ││
│  │ [📅 27/02/2025] (30 dias)                              ││
│  │                                                          ││
│  │ Garantia: *                                              ││
│  │ [▼ 6 meses] (padrão)                                   ││
│  │ Opções: 3, 6, 12, 18, 24 meses                          ││
│  │                                                          ││
│  │                            [Cancelar]  [Próximo Passo →]││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Criar Novo Orçamento
```gherkin
Given que estou em OrderDetails da OS #1234
And OS possui 7 componentes diagnosticados
When clico em "+ Criar Novo Orçamento"
Then wizard abre no passo 1
And lista mostra 7 componentes
And componentes já orçados estão marcados
```

### E2E Test 2: Gerar Número Automático
```gherkin
Given que selecionei componente "Biela"
When avanço para próximo passo
Then número "ORC-2025-0004-BIELA" é gerado
And número é único no sistema
```

### E2E Test 3: Salvar Rascunho
```gherkin
Given que preenchi orçamento básico
When clico em "Salvar Rascunho"
Then orçamento é salvo com status "draft"
And aparece na lista de orçamentos
And posso editá-lo posteriormente
```

### E2E Test 4: Validação de Componente Duplicado
```gherkin
Given que já tenho orçamento para "Bloco"
When tento criar novo orçamento para "Bloco"
Then erro de validação aparece
And mensagem: "Componente já possui orçamento"
```

---

## 🚫 Negative Scope

**Não inclui:**
- Múltiplas opções de orçamento (Plano A, B, C)
- Orçamento consolidado (todos componentes em um PDF)
- Envio automático de orçamento por e-mail
- Comparação entre orçamentos

---

## 🔗 Dependencies

**Blocks:**
- US-ORC-002 (Adicionar Serviços)
- US-ORC-003 (Cálculos)
- US-ORC-006 (Aprovação)

**Blocked by:**
- US-DIAG-005 (Aprovar Diagnóstico)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
