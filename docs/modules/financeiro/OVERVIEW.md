# Visão geral do módulo Financeiro

O módulo financeiro do ERP é o "centro nervoso" das operações da retífica: ele consolida tudo que entra/sai de dinheiro, integra-se com OS, Orçamentos e Compras, e fornece dashboards, DRE, conciliação e projeções. A arquitetura segue à risca a regra do projeto (Pages → Components → Hooks → Services → Supabase).

---

## 1. Mapa de telas (rotas)

Todas as telas estão em `src/pages/` e são apenas composição:

| Rota | Página | Função |
|------|--------|--------|
| `/financeiro` | `Financeiro.tsx` | Dashboard com KPIs, alertas e abas (visão geral, AR, AP, fluxo) |
| `/contas-receber` | `ContasReceber.tsx` | CRUD + parcelamento + recebimentos + renegociação |
| `/contas-pagar` | `ContasPagar.tsx` | CRUD + aprovação + anexos de NF + histórico de pagamento |
| `/aprovacao-contas-pagar` | `AprovacaoContasPagar.tsx` | Workflow de aprovação por alçada |
| `/ap-recorrentes` | `ApRecorrentes.tsx` | Contas a pagar recorrentes (geração mensal) |
| `/fluxo-caixa` | `FluxoCaixa.tsx` | Lançamentos de entrada/saída, vínculo com AR/AP |
| `/fluxo-projetado` | `FluxoProjetado.tsx` | Projeção de caixa (cenários, on-demand) |
| `/conciliacao-bancaria` | `ConciliacaoBancaria.tsx` | Importação OFX/CSV + matching |
| `/fechamento-caixa` | `FechamentoCaixa.tsx` | Fechamento diário |
| `/dre` | `DRE.tsx` | DRE mensal + categorizado + export |
| `/relatorios-financeiros` | `RelatoriosFinanceiros.tsx` | Aging, curva ABC, alertas, CSV |
| `/inadimplencia-aging` | `InadimplenciaAging.tsx` | Aging de clientes |
| `/integracao-bancaria` | `IntegracaoBancaria.tsx` | Transmissão (CNAB/Pix) |
| `/integracao-contabil` | `IntegracaoContabil.tsx` | Export para contabilidade |
| `/retiradas-socios` | `RetiradasSocios.tsx` | Pró-labore / retiradas |
| `/config-financeiro` | `ConfigFinanceiro.tsx` | Categorias, formas de pagamento, máquinas de cartão, centros de custo, contas bancárias |

---

## 2. Camadas (Clean Architecture aplicada)

### Pages (`src/pages/Financeiro.tsx` etc.)

Fazem **apenas composição** — orquestram componentes e chamam o hook `useFinancial`. Exemplo claro em `src/pages/Financeiro.tsx`: monta KPIs, alertas, tabelas e paginação, mas nenhuma chamada direta ao Supabase.

### Components (`src/components/financial/`)

- `dashboard/` → KPIs (`FinancialKpiCards`), tabelas (`FinancialDashboardArTable`, `FinancialDashboardApTable`, `FinancialDashboardCashFlowTable`), alertas (`FinancialDueAlertsCard`, `ArDueAlertsCard`), indicadores avançados.
- `accounts-receivable/` → tabela e diálogo de renegociação.
- `accounts-payable/` → tabela de contas a pagar.
- Reutilizáveis: `FinancialAsyncCombobox`, `CostCenterSelect`, `BudgetPaymentConditionModal`, `FinancialPageShell`.

### Hooks (`src/hooks/useFinancial.ts`, `useFinancialNotificationsPanel.ts`, `useArDueAlertsPanel.ts`)

Hooks **finos**: gerenciam loading, toast de erro e delegam tudo aos services. O `useFinancial` (~584 linhas) é o "fachada" do módulo — expõe `getAccountsReceivable`, `createAccountsPayable`, `getCashFlow`, `getFinancialKPIs`, `loadProjectionsDashboard`, `syncAndGetDueWindowSummary` etc.

### Services (`src/services/financial/`) — onde mora a regra

Mais de 35 services, organizados por responsabilidade. Os principais:

| Service | Responsabilidade |
|---------|------------------|
| `AccountsReceivableService` | CRUD AR, parcelamento, totais agregados, filtros |
| `AccountsPayableService` | CRUD AP, summary org, listagem paginada |
| `ReceiptHistoryService` | Histórico de recebimentos parciais, settlement snapshot |
| `ApPaymentHistoryService` | Histórico de pagamentos AP |
| `CashFlowService` | Movimentações + métricas por período |
| `FinancialKpiService` | KPIs: receita/despesa mensal, lucro, saldo, vencidos |
| `OrderBillingService` | Gera AR a partir de OS finalizada |
| `ReceivableFromBudgetService` | Gera AR a partir de Orçamento |
| `ApRecurringService` | AP recorrentes (mensal) |
| `ApprovalApService` | Alçadas/aprovação de AP por valor |
| `ProjectionService` | Fluxo projetado (on-demand 30d, cenários 90d) |
| `BankReconciliationService` | Conciliação |
| `StatementImportService` + `bankStatementParsers.ts` | Import OFX/CSV |
| `ReconciliationMatchingService` + `ReconciliationHintsService` | Matching automático |
| `BankTransmissionService` | Transmissão bancária (CNAB/Pix) |
| `DreService` / `DreCategorizedService` / `DreExportService` | DRE mensal, por categoria, export |
| `CashClosingService` | Fechamento diário de caixa |
| `PartnerWithdrawalService` | Retiradas de sócios |
| `ArAgingService` / `ArDueAlertService` / `ArLateFeeService` / `ArRenegotiationService` | Inadimplência: aging, alertas, juros/multa, renegociação |
| `FinancialNotificationService` | Janela de vencimentos (D-X / D+X), sync em background |
| `AdvancedIndicatorsService` | Indicadores avançados (margem, DSO, etc.) |
| `FinancialReportService` / `MonthlyReportService` / `ReconciliationReportService` | Relatórios e exports |
| `FinAccountingIntegrationService` | Integração contábil |
| `FinancialConfigService` | Formas de pagamento, categorias, contas bancárias |
| `CostCenterService` | Centros de custo |
| `CardMachineService` | Máquinas de cartão (taxas/MDR) |
| `ApInvoiceFileService` | Upload de NF (Storage) |
| `CustomerLookupService` / `SupplierLookupService` / `BudgetLookupService` | Buscas paginadas |

Todos os tipos e schemas Zod centralizados em `schemas.ts` e `types.ts` (ver `PaginatedResult`, `FinancialKpis`, enums `PaymentMethodEnum`/`PaymentStatusEnum`).

---

## 3. Modelo de dados (Supabase)

Tabelas principais (documentadas em `docs/modules/financeiro/README.md`):

- `accounts_receivable` — AR vinculado a `customer_id`, `order_id`, `budget_id`, com `installment_number/total_installments`, `discount`, `late_fee`, `cost_center_id`, `competence_date`.
- `accounts_payable` — AP com `supplier_id/name/document`, `expense_category_id`, `purchase_order_id`, `approval_status`, `invoice_file_url`, `cost_center_id`.
- `cash_flow` — Lançamentos com vínculo opcional para `accounts_receivable_id`, `accounts_payable_id`, `order_id`, `bank_account_id`, flag `reconciled`.
- `bank_accounts`, `expense_categories`, `payment_methods`, `cost_centers`, `card_machines`.
- `cash_flow_projection`, `monthly_dre`.

RLS é **obrigatória** (migrations `expense_categories_rls_*`, `cash_flow_rls_*`) — autorização por `org_id` é fonte de verdade.

---

## 4. Fluxos de negócio principais

### Faturamento de OS → AR

`OrderBillingService.createReceivableFromOrder()` (`src/services/financial/orderBillingService.ts`): busca OS, encontra orçamento mais recente e cria AR vinculando `customer_id`, `order_id` e `budget_id`. Disparado quando OS é finalizada.

### Compra aprovada → AP

Pedido de compra aprovado vira AP via `AccountsPayableService.create` com `purchase_order_id` preenchido. `ApprovalApService.computeInitialApprovalStatus(orgId, amount)` define o status inicial conforme a alçada.

### Recebimento parcelado

1. `createInstallmentPlan` cria N parcelas (AR) com `installment_number/total_installments`.
2. `recordReceiptPayment` registra recebimento (parcial ou total) via `ReceiptHistoryService` — gera lançamento em `cash_flow` automaticamente.
3. `getReceivableSettlementSnapshot` calcula saldo restante.

### Conciliação bancária

1. `StatementImportService` + parsers (`bankStatementParsers.ts`) importam OFX/CSV.
2. `ReconciliationMatchingService` faz matching automático com `cash_flow`.
3. `ReconciliationHintsService` sugere classificação (ex.: detecta fornecedor recorrente).
4. `BankReconciliationService` consolida e marca `reconciled=true`.

### Alertas de vencimento

`syncAndGetDueWindowSummary()` em `useFinancial.ts`: a cada carga do dashboard chama `FinancialNotificationService.syncDueNotifications` (job idempotente por dia) e devolve um `DueWindowSummary` com janelas D-3, D, D+1+ etc., exibido em `FinancialDueAlertsCard`.

### Projeção de caixa

`loadProjectionsDashboard` retorna 3 datasets: on-demand 30 dias, cenário 90 dias (otimista/realista/pessimista) e projeções persistidas, todos calculados a partir de AR + AP em aberto.

### DRE

`DreService.list(orgId, year)` lê `monthly_dre`; `DreCategorizedService` quebra por categoria e `DreExportService` exporta CSV/PDF.

---

## 5. Padrões transversais aplicados

- **Paginação backend obrigatória** (`PaginatedResult<T>`): todas as listagens usam `.range()` + `count: 'exact'`. Veja `getAccountsReceivable(page, pageSize, filters)` retornando `{ data, count, page, pageSize, totalPages }`.
- **Filtros no backend**, nunca no frontend.
- **Validação Zod** em `services/financial/schemas.ts` para todos os payloads.
- **Toasts** via `sonner` no hook (UI consistente).
- **Multi-tenant**: `orgId` sempre injetado no service; tela bloqueia se não houver organização (`Financeiro.tsx`).
- **Responsividade**: dashboard usa `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`, tabs com `overflow-x-auto flex md:grid`, tabelas via `ResponsiveTable`.

---

## 6. Integrações com outros módulos

- **OS** (`/ordens-servico`) → cria AR ao finalizar.
- **Orçamentos** (`/orcamentos`) → `ReceivableFromBudgetService` + `BudgetPaymentConditionModal` para definir parcelamento na aprovação.
- **Compras** (`/pedidos-compra`) → cria AP ao aprovar pedido; vincula `purchase_order_id`.
- **Funcionários** → folha gera AP; comissões vinculadas a vendas.
- **Fiscal** (`/modulo-fiscal`) → consome AR para emissão de NF.
- **Contábil** (`/integracao-contabil`) → `FinAccountingIntegrationService` exporta lançamentos.

---

## 7. Pontos de atenção e roadmap

- Documentação canônica das histórias está em `erp-retifica-formiguense-development/docs/modules/financial/user-stories/` (ver `docs/modules/financial/README.md`). A pasta `docs/modules/financeiro/user-stories/` deste repo é legado.
- `docs/modules/financial/GAP-ANALYSIS.md` mantém a cobertura "app vs stories".
- Roadmap declarado: cobrança automática (boleto/PIX), análise de rentabilidade por serviço, budget vs realizado, BI integrado, previsão com IA.

---

## Resumo

O financeiro tem **camadas bem definidas** (uma fachada `useFinancial` + ~35 services especializados), **modelo relacional rico** com vínculos para OS/Orçamento/Compra, **fluxos automatizados** (faturamento, parcelamento, conciliação, alertas, projeção) e **dashboard multi-aba** que serve como ponto de entrada visual. A regra de "Pages só compõem, services concentram regra + Supabase" é seguida de forma consistente.
