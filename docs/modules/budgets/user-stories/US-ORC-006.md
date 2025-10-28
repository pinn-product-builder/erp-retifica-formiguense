# US-ORC-006: Gerar Conta a Receber Automaticamente

**ID:** US-ORC-006  
**Epic:** Orçamentos  
**Sprint:** 5  
**Prioridade:** Crítica  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente financeiro  
**Quero** que orçamentos aprovados gerem automaticamente contas a receber  
**Para** integrar comercial com financeiro sem retrabalho manual

---

## 🎯 Business Objective

Automatizar integração entre orçamentos aprovados e contas a receber, eliminando digitação manual e garantindo sincronização entre módulos.

---

## 📐 Business Rules

### RN036: Gatilho de Geração
**Quando gerar conta a receber:**
```typescript
// Trigger automático quando:
1. Status do orçamento muda para 'approved'
2. Orçamento possui aprovação registrada
3. Valor total aprovado > R$ 0,00
4. Cliente possui cadastro completo

// Não gera automaticamente quando:
- Status é 'partially_approved' (requer ação manual)
- Status é 'customer_approved' (aguarda aprovação interna)
```

### RN037: Estrutura da Conta a Receber
```typescript
interface AccountsReceivable {
  id: string;
  org_id: string;
  customer_id: string;
  order_id: string;
  budget_id: string;              // Vínculo com orçamento
  
  // Identificação
  invoice_number: string;         // Auto-gerado
  reference: string;              // Número do orçamento
  
  // Valores
  amount: number;                 // Do orçamento
  amount_paid: number;
  amount_remaining: number;
  
  // Datas
  issue_date: Date;               // Data de aprovação
  due_date: Date;                 // Calculado com prazo padrão
  payment_date?: Date;
  
  // Status
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  
  // Parcelamento (se configurado)
  installments?: number;
  installment_number?: number;
  
  // Metadados
  description: string;
  notes?: string;
  created_by: string;
  created_at: Date;
}
```

### RN038: Numeração de Fatura
**Formato:** `INV-{ANO}-{SEQ}`

```sql
-- Exemplo:
INV-2025-0001
INV-2025-0002

-- Sequência é global por organização
-- Zero-padded com 4 dígitos
```

### RN039: Cálculo de Vencimento
**Prazo padrão configurável:**
```typescript
interface PaymentTerms {
  default_days: number;        // Ex: 30 dias
  allow_custom: boolean;
  max_days: number;            // Ex: 90 dias
}

// Cálculo:
due_date = issue_date + default_days

// Exemplo:
issue_date: 27/01/2025
default_days: 30
due_date: 26/02/2025
```

### RN040: Parcelamento
**Se orçamento permite parcelamento:**
```typescript
interface InstallmentPlan {
  total_amount: number;
  number_of_installments: number;
  installment_amount: number;
  first_due_date: Date;
  interval_days: number;  // Ex: 30 dias entre parcelas
}

// Exemplo:
total: R$ 932,40
parcelas: 3x
valor_parcela: R$ 310,80
vencimentos: 26/02, 28/03, 27/04
```

### RN041: Sincronização Bidirecional
**Orçamento ↔ Contas a Receber:**
```typescript
// Quando conta é paga:
1. Status da conta → 'paid'
2. Campo payment_date é preenchido
3. Orçamento recebe flag 'financially_closed'
4. OS pode ser finalizada se todos requisitos atendidos

// Quando conta é cancelada:
1. Orçamento volta para revisão
2. Notificação é enviada ao gerente
```

### RN042: Validações
- ✅ Cliente deve existir e estar ativo
- ✅ Valor deve ser > R$ 0,00
- ✅ Data de vencimento deve ser futura
- ✅ Não pode criar duplicata (mesmo budget_id)
- ✅ Organização do orçamento = organização da conta

---

## ✅ Acceptance Criteria

**AC37:** Trigger dispara automaticamente quando status → 'approved'  
**AC38:** Conta a receber é criada com número único  
**AC39:** Valores são copiados do orçamento aprovado  
**AC40:** Data de vencimento é calculada com prazo padrão  
**AC41:** Vínculo budget_id é registrado  
**AC42:** Parcelamento é respeitado (se configurado)  
**AC43:** Notificação é enviada ao financeiro  
**AC44:** Detalhes do orçamento mostram conta vinculada

---

## 🛠️ Definition of Done

- [ ] Trigger `generate_accounts_receivable()` criado
- [ ] Função de numeração de faturas implementada
- [ ] Função de cálculo de vencimento criada
- [ ] Suporte a parcelamento implementado
- [ ] Validações de integridade funcionais
- [ ] Sincronização bidirecional testada
- [ ] Notificações configuradas
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/hooks/
  └── useAccountsReceivable.ts     (UPDATE - vincular orçamentos)

src/components/budgets/
  └── BudgetDetails.tsx            (UPDATE - mostrar conta vinculada)

supabase/migrations/
  └── YYYYMMDDHHMMSS_budget_accounts_receivable_trigger.sql  (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Adicionar campo de vínculo em accounts_receivable
ALTER TABLE accounts_receivable
  ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES detailed_budgets(id),
  ADD COLUMN IF NOT EXISTS reference TEXT;  -- Número do orçamento

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_budget 
  ON accounts_receivable(budget_id);

-- Validação: não permitir duplicatas
ALTER TABLE accounts_receivable
  ADD CONSTRAINT unique_budget_account 
    UNIQUE(budget_id)
  WHERE budget_id IS NOT NULL;

-- Função para gerar número de fatura
CREATE OR REPLACE FUNCTION generate_invoice_number(
  p_org_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
  v_invoice_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Busca última sequência da organização
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)
  ), 0) + 1 INTO v_seq
  FROM accounts_receivable
  WHERE org_id = p_org_id
  AND invoice_number LIKE 'INV-' || v_year || '-%';
  
  -- Formata número
  v_invoice_number := 'INV-' || v_year || '-' || 
    LPAD(v_seq::TEXT, 4, '0');
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular data de vencimento
CREATE OR REPLACE FUNCTION calculate_due_date(
  p_issue_date DATE,
  p_org_id UUID
) RETURNS DATE AS $$
DECLARE
  v_default_days INTEGER;
BEGIN
  -- Buscar prazo padrão da organização
  SELECT COALESCE(default_payment_days, 30)
  INTO v_default_days
  FROM organizations
  WHERE id = p_org_id;
  
  RETURN p_issue_date + (v_default_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Trigger principal: Gerar conta a receber quando orçamento aprovado
CREATE OR REPLACE FUNCTION generate_accounts_receivable()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_customer_id UUID;
  v_invoice_number TEXT;
  v_due_date DATE;
  v_approved_amount NUMERIC(10,2);
  v_installments INTEGER;
  v_installment_amount NUMERIC(10,2);
  i INTEGER;
BEGIN
  -- Só gerar se status mudou para 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    
    -- Buscar dados da OS
    SELECT o.org_id, o.customer_id
    INTO v_org_id, v_customer_id
    FROM orders o
    WHERE o.id = NEW.order_id;
    
    -- Buscar valor aprovado (se parcial) ou total
    SELECT COALESCE(
      (SELECT approved_amount FROM budget_approvals 
       WHERE budget_id = NEW.id 
       ORDER BY approved_at DESC LIMIT 1),
      NEW.total
    ) INTO v_approved_amount;
    
    -- Verificar se há parcelamento configurado
    SELECT COALESCE(payment_installments, 1)
    INTO v_installments
    FROM organizations
    WHERE id = v_org_id;
    
    -- Calcular valor da parcela
    v_installment_amount := v_approved_amount / v_installments;
    
    -- Criar conta(s) a receber
    FOR i IN 1..v_installments LOOP
      -- Gerar número único para cada parcela
      v_invoice_number := generate_invoice_number(v_org_id);
      
      -- Calcular vencimento (30 dias × número da parcela)
      v_due_date := calculate_due_date(
        NEW.updated_at::DATE, 
        v_org_id
      ) + ((i - 1) * 30 || ' days')::INTERVAL;
      
      -- Inserir conta a receber
      INSERT INTO accounts_receivable (
        org_id,
        customer_id,
        order_id,
        budget_id,
        invoice_number,
        reference,
        amount,
        amount_remaining,
        issue_date,
        due_date,
        status,
        installments,
        installment_number,
        description,
        notes,
        created_by
      ) VALUES (
        v_org_id,
        v_customer_id,
        NEW.order_id,
        NEW.id,
        v_invoice_number,
        NEW.budget_number,
        v_installment_amount,
        v_installment_amount,
        NEW.updated_at::DATE,
        v_due_date,
        'pending',
        v_installments,
        i,
        'Referente ao orçamento ' || NEW.budget_number || ' - ' || NEW.component,
        CASE 
          WHEN v_installments > 1 
          THEN 'Parcela ' || i || ' de ' || v_installments 
          ELSE NULL 
        END,
        NEW.created_by
      );
    END LOOP;
    
    -- Log de geração
    RAISE NOTICE 'Geradas % conta(s) a receber para orçamento %', 
      v_installments, NEW.budget_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_generate_accounts_receivable ON detailed_budgets;
CREATE TRIGGER trg_generate_accounts_receivable
  AFTER UPDATE OF status ON detailed_budgets
  FOR EACH ROW
  EXECUTE FUNCTION generate_accounts_receivable();

-- Adicionar campo de parcelamento em organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS default_payment_days INTEGER DEFAULT 30 
    CHECK (default_payment_days > 0 AND default_payment_days <= 180),
  ADD COLUMN IF NOT EXISTS payment_installments INTEGER DEFAULT 1
    CHECK (payment_installments >= 1 AND payment_installments <= 12);

-- View para visualizar orçamentos com contas vinculadas
CREATE OR REPLACE VIEW budget_financial_status AS
SELECT 
  db.id AS budget_id,
  db.budget_number,
  db.order_id,
  db.status AS budget_status,
  db.total AS budget_total,
  COUNT(ar.id) AS accounts_count,
  SUM(ar.amount) AS total_receivable,
  SUM(ar.amount_paid) AS total_paid,
  SUM(ar.amount_remaining) AS total_remaining,
  CASE 
    WHEN COUNT(ar.id) = 0 THEN 'no_account'
    WHEN SUM(ar.amount_remaining) = 0 THEN 'fully_paid'
    WHEN SUM(ar.amount_paid) > 0 THEN 'partially_paid'
    WHEN MIN(ar.due_date) < CURRENT_DATE THEN 'overdue'
    ELSE 'pending'
  END AS financial_status
FROM detailed_budgets db
LEFT JOIN accounts_receivable ar ON ar.budget_id = db.id
WHERE db.status IN ('approved', 'customer_approved')
GROUP BY db.id, db.budget_number, db.order_id, db.status, db.total;

-- Permissões na view
GRANT SELECT ON budget_financial_status TO authenticated;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Orçamento ORC-2025-0004-BIELA - Detalhes                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Status: ✅ Aprovado                                         │
│  Cliente: ABC Motors Ltda                                    │
│  Valor Total: R$ 932,40                                      │
│  Aprovado em: 27/01/2025 às 15:22                           │
│                                                               │
│  ┌─ INTEGRAÇÃO FINANCEIRA ──────────────────────────────────┐│
│  │                                                          ││
│  │ ✅ Contas a Receber Geradas Automaticamente              ││
│  │                                                          ││
│  │ 📊 INV-2025-0045                                         ││
│  │    Valor: R$ 932,40                                      ││
│  │    Vencimento: 26/02/2025                                ││
│  │    Status: ⏳ Pendente                                   ││
│  │                                                          ││
│  │ [Ver Detalhes da Fatura]  [Registrar Pagamento]         ││
│  │                                                          ││
│  │ Gerado automaticamente em: 27/01/2025 às 15:23          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─── PARCELAMENTO (3x) ────────────────────────────────────────┐
│                                                               │
│  ✅ 3 Parcelas Geradas Automaticamente                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1/3  INV-2025-0045                                       ││
│  │      R$ 310,80  |  Vencimento: 26/02/2025  |  Pendente  ││
│  │                                                          ││
│  │ 2/3  INV-2025-0046                                       ││
│  │      R$ 310,80  |  Vencimento: 28/03/2025  |  Pendente  ││
│  │                                                          ││
│  │ 3/3  INV-2025-0047                                       ││
│  │      R$ 310,80  |  Vencimento: 27/04/2025  |  Pendente  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  [Gerenciar Pagamentos]                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Geração Automática ao Aprovar
```gherkin
Given que tenho orçamento com status "customer_approved"
When atualizo status para "approved"
Then trigger é disparado automaticamente
And conta a receber é criada
And invoice_number é gerado (INV-2025-XXXX)
And budget_id é vinculado
And valor corresponde ao total do orçamento
And vencimento é calculado (+ 30 dias)
```

### E2E Test 2: Não Duplicar Contas
```gherkin
Given que orçamento já gerou conta a receber
When tento mudar status novamente para "approved"
Then trigger verifica se conta já existe
And não cria duplicata
And lança exceção ou ignora silenciosamente
```

### E2E Test 3: Parcelamento em 3x
```gherkin
Given que organização tem parcelamento configurado (3x)
When orçamento de R$ 900,00 é aprovado
Then 3 contas são criadas:
  - Parcela 1: R$ 300,00 | Venc: +30 dias
  - Parcela 2: R$ 300,00 | Venc: +60 dias
  - Parcela 3: R$ 300,00 | Venc: +90 dias
And cada uma tem invoice_number único
And campo installment_number é preenchido (1, 2, 3)
```

### E2E Test 4: Sincronização ao Pagar
```gherkin
Given que conta foi gerada automaticamente
When registro pagamento na conta
And status da conta → 'paid'
Then consulto orçamento
And vejo indicador "Financeiramente encerrado"
```

### E2E Test 5: Validação de Cliente Inativo
```gherkin
Given que cliente está inativo
When orçamento é aprovado
Then trigger tenta gerar conta
And falha com erro de validação
And orçamento volta para revisão
And gerente recebe notificação de erro
```

### E2E Test 6: View de Status Financeiro
```gherkin
Given que tenho orçamentos com contas geradas
When consulto view "budget_financial_status"
Then vejo:
  - Orçamento X: fully_paid (tudo pago)
  - Orçamento Y: partially_paid (parcialmente)
  - Orçamento Z: overdue (vencido)
  - Orçamento W: pending (pendente)
```

### E2E Test 7: Notificação ao Financeiro
```gherkin
Given que orçamento é aprovado
When trigger gera conta a receber
Then notificação é enviada ao setor financeiro
And mensagem inclui:
  - Número do orçamento
  - Número da fatura
  - Valor e vencimento
  - Link para detalhes
```

---

## 🚫 Negative Scope

**Não inclui:**
- Geração de boletos bancários
- Integração com gateway de pagamento
- Emissão de nota fiscal (módulo fiscal)
- Cobrança automática por email
- Juros e multa por atraso (calculados no módulo financeiro)

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma (módulo independente)

**Blocked by:**
- US-ORC-005 (Registrar Aprovação)
- US-FIN-001 (Estrutura de Contas a Receber)

**Related:**
- US-FIN-005 (Registrar Pagamentos)
- US-FIS-002 (Emissão de NF após pagamento)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
