# Módulo Financeiro

**Epic:** Financeiro  
**Versão:** 1.0  
**Última atualização:** 2026-02-05

---

## 📋 Visão Geral

Sistema completo de gestão financeira com controle de contas a pagar e receber, fluxo de caixa, conciliação bancária e análise de resultados.

---

## 🎯 Objetivos de Negócio

- Centralizar controle financeiro
- Automatizar faturamento a partir de OS
- Controlar contas a pagar e receber
- Realizar conciliação bancária
- Gerar DRE e análises financeiras
- Projetar fluxo de caixa

---

## 📊 Métricas de Sucesso

| Métrica | Meta | Descrição |
|---------|------|-----------|
| Inadimplência | < 5% | Contas receber vencidas |
| Conciliação bancária | 100% | Saldo reconciliado diariamente |
| Precisão DRE | 100% | DRE refletindo realidade |
| Visibilidade fluxo caixa | 30 dias | Projeção precisa |
| Tempo faturamento | < 24h | Da finalização OS até emissão NF |

---

## 🗂️ User Stories

**Fonte canônica (definição de histórias e critérios de aceite):**  
`erp-retifica-formiguense-development/docs/modules/financial/user-stories/`

**Não usar** [`docs/modules/financeiro/user-stories/`](user-stories/) para definir escopo das histórias (material legado ou desalinhado). Ver também [`docs/modules/financial/README.md`](../financial/README.md).

**Rastreamento rápido no app (não substitui os .md do repositório development):**

| Rota / tela | Observação |
|-------------|------------|
| `/contas-pagar` | Contas a pagar |
| `/contas-receber` | Contas a receber |
| `/fluxo-caixa` | Fluxo de caixa |
| `/conciliacao-bancaria` | Conciliação |
| `/dre` | DRE |
| `/fluxo-projetado` | Fluxo projetado |
| `/relatorios-financeiros` | Relatórios financeiros |
| `/config-financeiro` | Configurações (categorias, centros de custo, métodos de pagamento, etc.) |

**RLS:** migrações `expense_categories_rls_*` e `cash_flow_rls_*` no Supabase devem estar aplicadas para cadastros e movimentações por organização.

---

## 📐 Regras de Negócio Principais

### RN-FIN-001: Contas a Receber
```typescript
interface AccountReceivable {
  id: string;
  org_id: string;
  customer_id: string;
  
  order_id?: string;
  budget_id?: string;
  invoice_number?: string;
  
  amount: number;
  due_date: Date;
  payment_date?: Date;
  
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';
  payment_method?: PaymentMethod;
  
  // Parcelamento
  installment_number?: number;
  total_installments?: number;
  
  // Ajustes
  discount?: number;
  late_fee?: number;
  
  notes?: string;
  created_at: Date;
  updated_at: Date;
}
```

### RN-FIN-002: Contas a Pagar
```typescript
interface AccountPayable {
  id: string;
  org_id: string;
  
  supplier_name: string;
  supplier_document?: string;
  
  description: string;
  amount: number;
  due_date: Date;
  payment_date?: Date;
  
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';
  payment_method?: PaymentMethod;
  
  expense_category_id?: string;
  invoice_number?: string;
  
  notes?: string;
  created_at: Date;
  updated_at: Date;
}
```

### RN-FIN-003: Fluxo de Caixa
```typescript
interface CashFlowEntry {
  id: string;
  transaction_date: Date;
  transaction_type: 'income' | 'expense';
  
  amount: number;
  description: string;
  
  category_id?: string;
  payment_method?: PaymentMethod;
  
  // Vinculação
  order_id?: string;
  accounts_receivable_id?: string;
  accounts_payable_id?: string;
  bank_account_id?: string;
  
  reconciled: boolean;
  notes?: string;
  
  created_at: Date;
  updated_at: Date;
}

type PaymentMethod = 
  | 'dinheiro'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'pix'
  | 'boleto'
  | 'transferencia'
  | 'cheque';
```

### RN-FIN-004: Conciliação Bancária
```typescript
interface BankAccount {
  id: string;
  org_id: string;
  bank_name: string;
  account_number: string;
  agency?: string;
  account_type: 'checking' | 'savings';
  balance: number;
  is_active: boolean;
}

interface BankReconciliation {
  id: string;
  bank_account_id: string;
  period_start: Date;
  period_end: Date;
  
  statement_balance: number;
  system_balance: number;
  difference: number;
  
  status: 'pending' | 'reconciled';
  reconciled_by?: string;
  reconciled_at?: Date;
}
```

### RN-FIN-005: DRE (Demonstrativo de Resultados)
```typescript
interface IncomeStatement {
  org_id: string;
  period_start: Date;
  period_end: Date;
  
  // Receitas
  gross_revenue: number;
  deductions: number;
  net_revenue: number;
  
  // Custos
  cost_of_services: number;    // Custos diretos (peças, MO)
  gross_profit: number;         // Lucro bruto
  
  // Despesas Operacionais
  operating_expenses: {
    administrative: number;
    sales: number;
    financial: number;
  };
  operating_profit: number;     // EBITDA
  
  // Resultado
  taxes: number;
  net_profit: number;           // Lucro líquido
  
  // Margens
  gross_margin: number;         // %
  net_margin: number;           // %
}
```

### RN-FIN-006: Categorias de Despesas
```typescript
interface ExpenseCategory {
  id: string;
  org_id: string;
  name: string;
  parent_id?: string;
  category_type: 'administrative' | 'operational' | 'financial' | 'sales';
  is_active: boolean;
}

const DEFAULT_CATEGORIES = [
  // Administrativas
  { name: 'Salários', type: 'administrative' },
  { name: 'Encargos', type: 'administrative' },
  { name: 'Aluguel', type: 'administrative' },
  { name: 'Energia', type: 'administrative' },
  { name: 'Telefonia', type: 'administrative' },
  { name: 'Internet', type: 'administrative' },
  { name: 'Material Escritório', type: 'administrative' },
  
  // Operacionais
  { name: 'Manutenção Equipamentos', type: 'operational' },
  { name: 'Ferramentas', type: 'operational' },
  { name: 'Materiais Consumo', type: 'operational' },
  { name: 'Transporte', type: 'operational' },
  
  // Comerciais
  { name: 'Comissões', type: 'sales' },
  { name: 'Marketing', type: 'sales' },
  { name: 'Propaganda', type: 'sales' },
  
  // Financeiras
  { name: 'Juros', type: 'financial' },
  { name: 'Taxas Bancárias', type: 'financial' },
  { name: 'IOF', type: 'financial' },
];
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

```sql
-- Contas a Receber
CREATE TABLE accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  
  order_id UUID REFERENCES orders(id),
  budget_id UUID REFERENCES detailed_budgets(id),
  invoice_number TEXT,
  
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  
  installment_number INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  
  discount NUMERIC(12,2) DEFAULT 0,
  late_fee NUMERIC(12,2) DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contas a Pagar
CREATE TABLE accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  
  supplier_name TEXT NOT NULL,
  supplier_document TEXT,
  
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  
  expense_category_id UUID REFERENCES expense_categories(id),
  invoice_number TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fluxo de Caixa
CREATE TABLE cash_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL,
  
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  
  category_id UUID REFERENCES expense_categories(id),
  payment_method TEXT,
  
  order_id UUID REFERENCES orders(id),
  accounts_receivable_id UUID REFERENCES accounts_receivable(id),
  accounts_payable_id UUID REFERENCES accounts_payable(id),
  bank_account_id UUID REFERENCES bank_accounts(id),
  
  reconciled BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contas Bancárias
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  agency TEXT,
  account_type TEXT DEFAULT 'checking',
  
  balance NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categorias de Despesas
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  
  name TEXT NOT NULL,
  parent_id UUID REFERENCES expense_categories(id),
  category_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(org_id, name)
);

-- Projeção de Fluxo de Caixa
CREATE TABLE cash_flow_projection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projection_date DATE NOT NULL,
  
  projected_income NUMERIC(12,2) DEFAULT 0,
  projected_expenses NUMERIC(12,2) DEFAULT 0,
  projected_balance NUMERIC(12,2) DEFAULT 0,
  
  actual_income NUMERIC(12,2) DEFAULT 0,
  actual_expenses NUMERIC(12,2) DEFAULT 0,
  actual_balance NUMERIC(12,2) DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔗 Integrações

### Com Ordens de Serviço
- Finalização de OS gera conta a receber automaticamente
- Vincula receita com OS para análise de rentabilidade

### Com Compras
- Pedido de compra aprovado gera conta a pagar
- Vincula despesa com estoque para cálculo de custo

### Com Funcionários
- Folha de pagamento gera contas a pagar
- Comissões vinculadas com vendas

---

## 🎨 Componentes UI

### Páginas (rotas reais no Vite/React)

- `/financeiro` — Dashboard financeiro
- `/contas-receber` — Contas a receber
- `/contas-pagar` — Contas a pagar
- `/fluxo-caixa` — Fluxo de caixa
- `/dre` — DRE
- `/fechamento-caixa` — Fechamento de caixa
- `/conciliacao-bancaria` — Conciliação bancária
- `/fluxo-projetado` — Fluxo projetado
- `/config-financeiro` — Configurações (categorias, formas de pagamento / máquinas, centros de custo)
- `/relatorios-financeiros` — Relatórios (aging, curva, alertas, export CSV)
- `/aprovacao-contas-pagar` — Aprovação de contas a pagar
- `/retiradas-socios` — Retiradas de sócios
- `/modulo-fiscal` — Módulo fiscal (quando habilitado)

### Componentes
- `FinancialDashboard` - Dashboard com KPIs
- `AccountsReceivableList` - Lista contas a receber
- `AccountsPayableList` - Lista contas a pagar
- `CashFlowChart` - Gráfico fluxo de caixa
- `PaymentForm` - Registrar pagamento
- `IncomeStatementReport` - DRE

---

## 📊 KPIs e Métricas

```sql
-- Dashboard Financeiro
CREATE VIEW financial_dashboard AS
SELECT
  -- Contas a Receber
  SUM(ar.amount) FILTER (WHERE ar.status = 'pending') AS receivables_pending,
  SUM(ar.amount) FILTER (WHERE ar.status = 'overdue') AS receivables_overdue,
  SUM(ar.amount) FILTER (WHERE ar.payment_date >= CURRENT_DATE - INTERVAL '30 days') AS revenue_last_30d,
  
  -- Contas a Pagar
  SUM(ap.amount) FILTER (WHERE ap.status = 'pending') AS payables_pending,
  SUM(ap.amount) FILTER (WHERE ap.status = 'overdue') AS payables_overdue,
  SUM(ap.amount) FILTER (WHERE ap.payment_date >= CURRENT_DATE - INTERVAL '30 days') AS expenses_last_30d,
  
  -- Fluxo de Caixa
  SUM(cf.amount) FILTER (WHERE cf.transaction_type = 'income' 
    AND cf.transaction_date >= CURRENT_DATE - INTERVAL '30 days') AS cash_in_30d,
  SUM(cf.amount) FILTER (WHERE cf.transaction_type = 'expense' 
    AND cf.transaction_date >= CURRENT_DATE - INTERVAL '30 days') AS cash_out_30d,
  
  -- Saldo Bancário
  SUM(ba.balance) FILTER (WHERE ba.is_active = true) AS total_bank_balance

FROM accounts_receivable ar
CROSS JOIN accounts_payable ap
CROSS JOIN cash_flow cf
CROSS JOIN bank_accounts ba
WHERE ar.org_id = current_org_id()
AND ap.org_id = current_org_id()
AND ba.org_id = current_org_id();
```

---

## 🧪 Testes

### Cenários de Teste
1. Criar conta a receber a partir de OS finalizada
2. Registrar pagamento de conta a receber
3. Parcelar conta em múltiplas parcelas
4. Gerar conta a pagar a partir de pedido de compra
5. Conciliar extrato bancário
6. Gerar DRE mensal
7. Projetar fluxo de caixa para 30 dias

---

## 🚀 Roadmap Futuro

### Q2 2025
- [ ] Integração bancária (OFX, API)
- [ ] Cobrança automática (boleto, PIX)
- [ ] Análise de rentabilidade por serviço

### Q3 2025
- [ ] Budget (orçamento vs realizado)
- [ ] Centro de custos
- [ ] Análise ABC de clientes

### Q4 2025
- [ ] BI integrado com dashboards avançados
- [ ] Previsão de fluxo de caixa com IA
- [ ] Integração contabilidade

---

**Status:** Em evolução (app + documentação)  
**Próxima Revisão:** conforme sprint financeiro
