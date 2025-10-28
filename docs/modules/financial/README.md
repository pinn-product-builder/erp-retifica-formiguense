# Módulo Financeiro

## 📋 Visão Geral

Sistema completo de gestão financeira, incluindo contas a receber, contas a pagar, fluxo de caixa, DRE e módulo fiscal integrado.

## 🎯 Objetivo

Fornecer controle financeiro completo, garantir compliance fiscal, facilitar tomada de decisão e automatizar processos financeiros.

## 📊 Funcionalidades Principais

### Dashboard Financeiro
- KPIs em tempo real
- Faturamento mensal
- Despesas mensais
- Lucro líquido
- Contas vencidas
- Gráficos e tendências

### Contas a Receber
- Geração automática a partir de orçamentos aprovados
- Controle de vencimento
- Status (pendente, pago, vencido)
- Formas de pagamento
- Baixa de recebimentos
- Histórico completo

### Contas a Pagar
- Cadastro de despesas
- Categorização
- Fornecedores
- Controle de vencimento
- Pagamentos agendados
- Centro de custo

### Fluxo de Caixa
- Movimentações de entrada e saída
- Saldo atual
- Projeções futuras
- Conciliação bancária
- Categorias de transações

### DRE (Demonstração do Resultado do Exercício)
- Geração automática mensal
- Receitas operacionais
- Custos e despesas
- Lucro bruto e líquido
- Comparativos mensais
- Exportação para Excel/PDF

### Módulo Fiscal
- Classificação fiscal de operações
- Cálculo automático de impostos (ICMS, PIS, COFINS)
- Regimes tributários (Simples, Lucro Presumido, Real)
- Obrigações fiscais e prazos
- Apuração mensal
- Relatórios fiscais
- Audit log completo

## 🔗 Integração com Outros Módulos

- **Orçamentos**: Gera contas a receber automáticas
- **Compras**: Gera contas a pagar
- **Funcionários**: Folha de pagamento e comissões
- **Clientes**: Histórico financeiro

## 🧪 Implementação Atual

**Componente Principal:** `src/pages/Financeiro.tsx`  
**Hook:** `src/hooks/useFinancial.ts`  
**Hook Fiscal:** `src/hooks/useFiscal.ts`

**Páginas Relacionadas:**
- `ContasReceber.tsx` - Gestão detalhada de recebíveis
- `ContasPagar.tsx` - Gestão detalhada de pagamentos
- `FluxoCaixa.tsx` - Fluxo de caixa completo
- `DRE.tsx` - Demonstração de resultados
- `ModuloFiscal.tsx` - Gestão fiscal

**Componentes Fiscais:**
- `TaxTypeManagement` - Tipos de tributos
- `TaxRegimeManagement` - Regimes tributários
- `FiscalClassificationManagement` - Classificação fiscal
- `TaxRuleManagement` - Regras de cálculo
- `TaxRateTableManagement` - Tabelas de alíquotas
- `CompanyFiscalSettings` - Configurações da empresa
- `ObligationManagement` - Obrigações fiscais
- `TaxCalculationPage` - Calculadora de impostos
- `TaxReports` - Relatórios fiscais
- `ApuracaoFiscal` - Apuração mensal
- `FiscalAuditLog` - Log de auditoria

**Tabelas:**
- `accounts_receivable` - Contas a receber
- `accounts_payable` - Contas a pagar
- `cash_flow` - Movimentações de caixa
- `payment_methods` - Formas de pagamento
- `tax_types` - Tipos de tributos
- `tax_regimes` - Regimes tributários
- `fiscal_classifications` - Classificações fiscais
- `tax_rules` - Regras de cálculo
- `tax_rate_tables` - Tabelas de alíquotas
- `company_fiscal_settings` - Configurações fiscais
- `fiscal_obligations` - Obrigações fiscais
- `tax_calculations` - Cálculos realizados
- `fiscal_audit_log` - Auditoria

### Interfaces Principais
```typescript
interface AccountsReceivable {
  id: string;
  customer_id: string;
  budget_id?: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  payment_method_id?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  org_id: string;
  created_at: string;
}

interface AccountsPayable {
  id: string;
  supplier_name: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  payment_method_id?: string;
  category: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  org_id: string;
  created_at: string;
}

interface CashFlow {
  id: string;
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  transaction_date: string;
  payment_method?: string;
  reconciled: boolean;
  org_id: string;
  created_at: string;
}

interface TaxCalculation {
  id: string;
  operation: 'compra' | 'venda' | 'prestacao_servico';
  classification_id: string;
  amount: number;
  origin_uf?: string;
  destination_uf?: string;
  result: {
    icms: number;
    icms_st: number;
    pis: number;
    cofins: number;
    ipi: number;
    iss: number;
    total: number;
  };
  calculated_at: string;
  org_id: string;
}
```

### Métodos Financeiros Disponíveis
- `getFinancialKPIs()` - Obter KPIs
- `getAccountsReceivable()` - Listar recebíveis
- `updateAccountsReceivable(id, data)` - Baixar recebimento
- `createAccountsReceivable(data)` - Criar recebível
- `getAccountsPayable()` - Listar pagamentos
- `updateAccountsPayable(id, data)` - Registrar pagamento
- `createAccountsPayable(data)` - Criar pagamento
- `getCashFlow()` - Obter fluxo de caixa
- `getMonthlyDRE(month, year)` - Gerar DRE
- `getPaymentMethods()` - Listar formas de pagamento
- `getCustomers()` - Listar clientes

### Métodos Fiscais Disponíveis
- `calculateTaxes(operation, classification, amount, ufs)` - Calcular impostos
- `getTaxRegimes()` - Listar regimes tributários
- `getTaxTypes()` - Listar tipos de tributos
- `getFiscalClassifications()` - Listar classificações
- `getTaxRules(classificationId)` - Obter regras
- `getCompanyFiscalSettings()` - Configurações fiscais
- `getObligations(month, year)` - Obrigações do período
- `generateMonthlyApuracao(month, year)` - Apuração fiscal

## 📋 Regras de Negócio Financeiras

### RN-FIN-001: Geração Automática de Recebível
- Ao aprovar orçamento: cria conta a receber
- Valor: total do orçamento
- Vencimento: configurável (padrão 30 dias)

### RN-FIN-002: Status de Conta
```
pending: Aguardando vencimento
overdue: Vencida e não paga
paid: Paga
cancelled: Cancelada
```

### RN-FIN-003: Cálculo de DRE
```
Receita Bruta = Σ recebíveis pagos no período
(-) Deduções = Impostos sobre vendas
= Receita Líquida
(-) Custos = Custos diretos de produção
= Lucro Bruto
(-) Despesas Operacionais = Contas a pagar do período
= Lucro Líquido
```

## 📋 Regras Fiscais

### RN-FISC-001: Regime Tributário
- Simples Nacional: Alíquotas unificadas
- Lucro Presumido: Base de cálculo presumida
- Lucro Real: Base de cálculo real

### RN-FISC-002: ICMS Interestadual
- Alíquota varia conforme UF origem e destino
- ICMS-ST aplicável em operações específicas

### RN-FISC-003: PIS/COFINS
- Cumulativo: Alíquotas fixas (0,65% e 3%)
- Não-cumulativo: Alíquotas maiores com créditos

### RN-FISC-004: ISS
- Aplicável em prestação de serviços
- Alíquota: 2% a 5% conforme município

## 📅 Última Atualização

**Data**: 28/10/2025  
**Status**: ✅ Em Produção
