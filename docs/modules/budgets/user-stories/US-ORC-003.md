# US-ORC-003: Calcular Valores do Orçamento

**ID:** US-ORC-003  
**Epic:** Orçamentos  
**Sprint:** 4  
**Prioridade:** Alta  
**Estimativa:** 3 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente comercial  
**Quero** aplicar descontos, impostos e calcular valor total do orçamento  
**Para** apresentar proposta final precificada corretamente ao cliente

---

## 🎯 Business Objective

Garantir cálculos precisos de valores com descontos, impostos e totais, permitindo ajustes comerciais no orçamento.

---

## 📐 Business Rules

### RN014: Estrutura de Cálculo
**Ordem de cálculo (cascata):**
```typescript
interface BudgetCalculation {
  // 1. Subtotal (base)
  subtotal: number;              // Soma de todos os itens
  
  // 2. Desconto
  discount_percentage: number;   // % de desconto (0-100)
  discount_amount: number;       // Valor do desconto
  
  // 3. Base de impostos
  taxable_base: number;          // subtotal - discount_amount
  
  // 4. Impostos
  tax_percentage: number;        // % de imposto (configurável)
  tax_amount: number;            // Valor do imposto
  
  // 5. Total final
  total: number;                 // taxable_base + tax_amount
}
```

### RN015: Fórmulas de Cálculo
```typescript
// 1. Subtotal
subtotal = sum(services.map(s => s.total_price)) + 
           sum(parts.map(p => p.total_price));

// 2. Desconto
if (discount_percentage > 0) {
  discount_amount = subtotal * (discount_percentage / 100);
} else {
  discount_amount = 0;
}

// 3. Base tributável
taxable_base = subtotal - discount_amount;

// 4. Impostos
if (tax_percentage > 0) {
  tax_amount = taxable_base * (tax_percentage / 100);
} else {
  tax_amount = 0;
}

// 5. Total
total = taxable_base + tax_amount;
```

### RN016: Limites de Desconto
**Por perfil de usuário:**
- **Consultor:** Até 5%
- **Gerente:** Até 15%
- **Admin:** Até 30%
- **Descontos acima de 30%:** Requerem aprovação especial

### RN017: Configuração de Impostos
**Percentuais padrão por região:**
```typescript
interface TaxConfig {
  region: string;
  default_tax: number;
  services_tax: number;   // ISS
  parts_tax: number;      // ICMS
  combined: boolean;      // Aplica os dois?
}

// Exemplos
{
  region: 'SP',
  default_tax: 12.00,     // ICMS-SP
  services_tax: 5.00,     // ISS
  parts_tax: 12.00,       // ICMS
  combined: true
}
```

### RN018: Validações
- **Desconto:** 0% ≤ valor ≤ 100%
- **Imposto:** 0% ≤ valor ≤ 30%
- **Total:** Não pode ser negativo ou zero
- **Desconto absoluto:** Não pode exceder subtotal

### RN019: Arredondamento
- Todos os valores monetários: 2 casas decimais
- Percentuais: 2 casas decimais
- Arredondamento: Banker's Rounding (IEEE 754)

### RN020: Recálculo Automático
**Gatilhos de recálculo:**
- Adição/remoção de item
- Alteração de quantidade ou preço
- Mudança de desconto
- Alteração de imposto

---

## ✅ Acceptance Criteria

**AC15:** Campo de desconto aceita % ou valor absoluto  
**AC16:** Sistema valida limite de desconto por perfil  
**AC17:** Campo de imposto é pré-preenchido com padrão regional  
**AC18:** Todos os valores são atualizados em tempo real  
**AC19:** Breakdown detalhado é exibido ao cliente  
**AC20:** Total nunca é negativo ou zero

---

## 🛠️ Definition of Done

- [ ] Componente `BudgetCalculations.tsx` implementado
- [ ] Hook `useBudgetCalculations.ts` criado
- [ ] Validação de limites por perfil
- [ ] Configuração de impostos por região
- [ ] Recálculo automático funcional
- [ ] Formatação monetária correta
- [ ] Testes unitários de cálculos
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/budgets/
  ├── BudgetWizard.tsx             (UPDATE - Step 4)
  ├── BudgetCalculations.tsx       (NEW)
  └── BudgetSummary.tsx            (NEW)

src/hooks/
  └── useBudgetCalculations.ts     (NEW)

src/utils/
  └── budgetCalculations.ts        (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Adicionar na tabela detailed_budgets (já existe)
-- Apenas documentando os campos usados

ALTER TABLE detailed_budgets
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) DEFAULT 0 
    CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC(5,2) DEFAULT 0
    CHECK (tax_percentage >= 0 AND tax_percentage <= 30),
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) DEFAULT 0
    CHECK (total >= 0);

-- Função para calcular totais automaticamente
CREATE OR REPLACE FUNCTION calculate_budget_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal NUMERIC(10,2);
  v_discount_amount NUMERIC(10,2);
  v_taxable_base NUMERIC(10,2);
  v_tax_amount NUMERIC(10,2);
BEGIN
  -- 1. Calcular subtotal de serviços e peças
  v_subtotal := (
    SELECT COALESCE(SUM((item->>'total_price')::NUMERIC), 0)
    FROM jsonb_array_elements(NEW.services) AS item
  ) + (
    SELECT COALESCE(SUM((item->>'total_price')::NUMERIC), 0)
    FROM jsonb_array_elements(NEW.parts) AS item
  );
  
  -- 2. Calcular desconto
  v_discount_amount := v_subtotal * (NEW.discount_percentage / 100);
  
  -- 3. Base tributável
  v_taxable_base := v_subtotal - v_discount_amount;
  
  -- 4. Calcular impostos
  v_tax_amount := v_taxable_base * (NEW.tax_percentage / 100);
  
  -- 5. Atribuir valores calculados
  NEW.subtotal := v_subtotal;
  NEW.discount_amount := v_discount_amount;
  NEW.tax_amount := v_tax_amount;
  NEW.total := v_taxable_base + v_tax_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular ao inserir/atualizar
CREATE TRIGGER trg_calculate_budget_totals
  BEFORE INSERT OR UPDATE OF services, parts, discount_percentage, tax_percentage
  ON detailed_budgets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_budget_totals();

-- Tabela de configuração de impostos
CREATE TABLE tax_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  region TEXT NOT NULL,
  default_tax_percentage NUMERIC(5,2) DEFAULT 12.00,
  services_tax_percentage NUMERIC(5,2) DEFAULT 5.00,
  parts_tax_percentage NUMERIC(5,2) DEFAULT 12.00,
  apply_combined BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(org_id, region)
);

-- RLS para tax_configurations
ALTER TABLE tax_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tax configs of their org"
  ON tax_configurations FOR SELECT
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage tax configs"
  ON tax_configurations FOR ALL
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'gerente')
    )
  );
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Orçamento ORC-2025-0004-BIELA - Passo 4/5: Cálculos   [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  RESUMO DE ITENS                                             │
│  • 1 serviço(s):  R$ 450,00                                  │
│  • 2 peça(s):     R$ 475,00                                  │
│  ─────────────────────────────                               │
│  SUBTOTAL:        R$ 925,00                                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ DESCONTO                                                 ││
│  │                                                          ││
│  │ Tipo de desconto:                                        ││
│  │ (•) Percentual  [ ] Valor fixo                           ││
│  │                                                          ││
│  │ Desconto (%): *                                          ││
│  │ [10.00___] %                                             ││
│  │                                                          ││
│  │ Valor do desconto: R$ 92,50                              ││
│  │                                                          ││
│  │ ℹ️ Seu perfil permite até 15% de desconto               ││
│  │ ⚠️ Descontos acima requerem aprovação do gerente        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Base para impostos: R$ 832,50                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ IMPOSTOS                                                 ││
│  │                                                          ││
│  │ Alíquota (%): *                                          ││
│  │ [12.00___] %    (padrão SP: 12% ICMS)                   ││
│  │                                                          ││
│  │ Valor dos impostos: R$ 99,90                             ││
│  │                                                          ││
│  │ [ ] Aplicar diferenciado:                                ││
│  │     • Serviços: 5% ISS                                   ││
│  │     • Peças: 12% ICMS                                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓│
│  ┃ BREAKDOWN DETALHADO                                     ┃│
│  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫│
│  ┃ Subtotal:              R$ 925,00                        ┃│
│  ┃ Desconto (10%):      - R$  92,50                        ┃│
│  ┃ ─────────────────────────────────                       ┃│
│  ┃ Base tributável:       R$ 832,50                        ┃│
│  ┃ Impostos (12%):      + R$  99,90                        ┃│
│  ┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                           ┃│
│  ┃ TOTAL:                 R$ 932,40                        ┃│
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛│
│                                                               │
│  Observações adicionais (opcional):                          │
│  [____________________________________________________________]│
│  [Desconto de 10% aplicado conforme política comercial      ]│
│  [para clientes frequentes                                   ]│
│                                                               │
│              [← Voltar]  [Próximo: Revisar →]                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Aplicar Desconto Percentual
```gherkin
Given que subtotal é R$ 925,00
When preencho desconto "10%"
Then desconto de R$ 92,50 é calculado
And base tributável é R$ 832,50
And total é recalculado
```

### E2E Test 2: Validação de Limite de Desconto
```gherkin
Given que sou perfil "consultor" (limite: 5%)
When tento aplicar desconto de "10%"
Then erro de validação aparece
And mensagem: "Seu perfil permite até 5% de desconto"
And campo é resetado para valor válido
```

### E2E Test 3: Aplicar Imposto Padrão
```gherkin
Given que org está em São Paulo
When abro passo de cálculos
Then campo imposto é pré-preenchido com "12%"
And tooltip explica: "ICMS padrão SP: 12%"
```

### E2E Test 4: Recálculo Automático
```gherkin
Given que tenho orçamento com valores preenchidos
When volto ao passo 2 e altero quantidade de item
And avanço para passo 4 novamente
Then todos os valores são recalculados automaticamente
And breakdown reflete mudanças
```

### E2E Test 5: Desconto Valor Fixo
```gherkin
Given que seleciono tipo "Valor fixo"
When preencho "R$ 100,00"
Then desconto absoluto é aplicado
And percentual equivalente é exibido
And validação garante que não excede subtotal
```

### E2E Test 6: Impostos Diferenciados
```gherkin
Given que marco "Aplicar diferenciado"
When sistema calcula impostos
Then 5% ISS é aplicado sobre serviços (R$ 450,00)
And 12% ICMS é aplicado sobre peças (R$ 475,00)
And total de impostos soma ambos
```

### E2E Test 7: Validação de Total Negativo
```gherkin
Given que subtotal é R$ 100,00
When tento aplicar desconto de R$ 150,00
Then erro de validação aparece
And mensagem: "Desconto não pode exceder subtotal"
And campo é marcado como inválido
```

---

## 🚫 Negative Scope

**Não inclui:**
- Múltiplas tabelas de preços por cliente
- Cálculo de margem de lucro
- Simulador de cenários (A, B, C)
- Integração com sistema fiscal externo
- Parcelamento de valores

---

## 🔗 Dependencies

**Blocks:**
- US-ORC-004 (Enviar para Aprovação)

**Blocked by:**
- US-ORC-002 (Adicionar Serviços/Peças)

**Related:**
- US-FIS-001 (Configuração Fiscal)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
