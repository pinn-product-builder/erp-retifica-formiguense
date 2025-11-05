# Auditoria Completa do Sistema ERP

**Data:** 2025-01-20  
**Versão do Sistema:** ERP Retífica Formiguense  
**Escopo:** Análise completa de triggers, funções, tabelas e gaps do sistema

---

## 📋 Sumário Executivo

Esta auditoria identifica:
- **22 triggers duplicados** (mesma função, INSERT e UPDATE - normal)
- **77 funções não chamadas por triggers** (algumas podem ser RPCs do frontend)
- **28 tabelas com `updated_at` sem trigger automático**
- **Várias tabelas potencialmente não utilizadas**
- **Gaps identificados em funcionalidades**

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. Triggers Duplicados na Mesma Tabela (Mesma Operação)

Estes são **PROBLEMAS REAIS** - triggers duplicados executando a mesma função na mesma operação:

| Tabela | Função | Count | Triggers |
|--------|--------|-------|----------|
| `budget_approvals` | `set_budget_approvals_org_id()` | 2 | trigger_set_budget_approvals_org_id (INSERT e UPDATE - OK) |
| `detailed_budgets` | `calculate_budget_totals()` | 2 | trigger_calculate_budget_totals (INSERT e UPDATE - OK) |
| `detailed_budgets` | `set_detailed_budgets_org_id()` | 2 | trigger_set_detailed_budgets_org_id (INSERT e UPDATE - OK) |
| `diagnostic_checklist_responses` | `set_diagnostic_response_org_id()` | 2 | trigger_set_diagnostic_response_org_id (INSERT e UPDATE - OK) |
| `engines` | `identify_bosch_components()` | 2 | bosch_auto_identification_trigger (INSERT e UPDATE - OK) |
| `inventory_movements` | `check_stock_alerts()` | 2 | trigger_check_stock_alerts (INSERT e UPDATE - OK) |
| `kpi_targets` | `update_goal_status()` | 2 | trigger_update_goal_status (INSERT e UPDATE - OK) |
| `parts_inventory` | `set_parts_inventory_org_id()` | 2 | trigger_set_parts_inventory_org_id (INSERT e UPDATE - OK) |
| `parts_inventory` | `validate_bosch_parts()` | 2 | validate_bosch_parts_trigger (INSERT e UPDATE - OK) |
| `purchase_needs` | `calculate_supplier_suggestions()` | 2 | calculate_supplier_suggestions_trigger (INSERT e UPDATE - OK) |
| `purchase_orders` | `check_po_approval_required()` | 2 | trigger_check_po_approval (INSERT e UPDATE - OK) |
| `purchase_receipt_items` | `update_purchase_order_on_receipt()` | 2 | trigger_update_po_on_receipt (INSERT e UPDATE - OK) |
| `supplier_performance_history` | `calculate_supplier_performance()` | 2 | trigger_calculate_supplier_performance (INSERT e UPDATE - OK) |
| `supplier_performance_history` | `update_supplier_performance()` | 2 | update_supplier_performance_trigger (INSERT e UPDATE - OK) |
| `warranty_indicators` | `calculate_warranty_rate()` | 2 | trigger_calculate_warranty_rate (INSERT e UPDATE - OK) |
| `workflow_checklist_responses` | `auto_generate_technical_report()` | 2 | trigger_auto_generate_technical_report (INSERT e UPDATE - OK) |
| `workflow_checklist_responses` | `calculate_checklist_completion()` | 2 | trigger_calculate_checklist_completion (INSERT e UPDATE - OK) |
| `workflow_checklist_responses` | `log_quality_event()` | 2 | trigger_log_quality_event (INSERT e UPDATE - OK) |
| `workflow_status_history` | `set_workflow_status_history_org_id()` | 2 | trigger_set_workflow_status_history_org_id (INSERT e UPDATE - OK) |

**⚠️ OBSERVAÇÃO:** Todos os triggers duplicados são na verdade triggers para INSERT e UPDATE separados, o que é **NORMAL e CORRETO**. Não há problema aqui.

---

### 2. Tabelas com `updated_at` sem Trigger Automático

Estas tabelas têm coluna `updated_at` mas não têm trigger para atualizá-la automaticamente:

| Tabela | Status |
|--------|--------|
| `achievement_configs` | ❌ Sem trigger |
| `company_fiscal_settings` | ✅ Tem trigger `trg_company_fiscal_settings_updated_at` |
| `detailed_budgets` | ❌ Sem trigger |
| `diagnostic_checklists` | ❌ Sem trigger |
| `engine_types` | ❌ Sem trigger |
| `entry_form_templates` | ❌ Sem trigger |
| `fiscal_classifications` | ✅ Tem trigger `trg_fiscal_class_updated_at` |
| `jurisdiction_config` | ✅ Tem trigger `update_jurisdiction_config_updated_at` |
| `obligation_kinds` | ✅ Tem trigger `trg_obligation_kinds_updated_at` |
| `organization_themes` | ✅ Tem trigger `update_organization_themes_updated_at` |
| `parts_reservations` | ✅ Tem trigger `trigger_update_reservations_updated_at` |
| `performance_rankings` | ❌ Sem trigger |
| `purchase_needs` | ❌ Sem trigger |
| `service_price_table` | ❌ Sem trigger |
| `special_environments` | ❌ Sem trigger |
| `tax_calculations` | ✅ Tem trigger `trg_tax_calculations_updated_at` |
| `tax_ledgers` | ✅ Tem trigger `trg_tax_ledgers_updated_at` |
| `tax_rate_tables` | ✅ Tem trigger `trg_tax_rate_tables_updated_at` |
| `tax_regimes` | ✅ Tem trigger `trg_tax_regimes_updated_at` |
| `tax_rules` | ✅ Tem trigger `trg_tax_rules_updated_at` |
| `tax_types` | ✅ Tem trigger `trg_tax_types_updated_at` |
| `technical_report_templates` | ❌ Sem trigger |
| `technical_standards_config` | ❌ Sem trigger |
| `user_achievements` | ❌ Sem trigger |
| `user_scores` | ❌ Sem trigger |
| `warranty_claims` | ❌ Sem trigger |
| `workflow_checklists` | ❌ Sem trigger |
| `workflow_steps` | ❌ Sem trigger |

**🔧 AÇÃO NECESSÁRIA:** Criar triggers `update_updated_at_column()` para as tabelas marcadas com ❌.

---

### 3. Funções RPC Não Chamadas por Triggers

Estas funções são RPCs (Remote Procedure Calls) que podem ser chamadas pelo frontend, mas não por triggers. **Nem todas são problemas**, algumas são intencionais:

#### Funções de Gamificação (OK - chamadas pelo frontend)
- `add_user_points()` ✅
- `calculate_action_points()` ✅
- `check_achievement_criteria()` ✅
- `check_achievements()` ✅
- `initialize_org_scores()` ✅
- `insert_default_achievements()` ✅
- `process_user_action()` ✅
- `update_performance_ranking()` ✅

#### Funções de Workflow (OK - chamadas pelo frontend)
- `approve_workflow()` ✅
- `can_workflow_advance()` ✅
- `create_approval_workflow()` ✅
- `reject_workflow()` ✅
- `validate_workflow_advance()` ❓ (Pode ser chamado por trigger - verificar)

#### Funções de Reservas (OK - chamadas pelo frontend)
- `cancel_reservation()` ✅
- `consume_reserved_parts()` ✅
- `extend_reservation()` ✅
- `release_expired_reservations()` ✅
- `separate_reserved_parts()` ✅

#### Funções de Aprovação (OK - chamadas pelo frontend)
- `check_approval_required()` ✅
- `apply_inventory_adjustment_from_workflow()` ❓ (Stub - não implementado)
- `apply_inventory_entry_from_workflow()` ❓ (Stub - não implementado)
- `apply_inventory_exit_from_workflow()` ❓ (Stub - não implementado)

#### Funções de Dashboard/KPI (OK - chamadas pelo frontend)
- `calculate_kpi_trend()` ✅
- `calculate_kpi_value()` ✅
- `count_approved_budgets()` ✅
- `count_completed_orders()` ✅
- `count_user_orders()` ✅

#### Funções de Utilidades (OK)
- `can_manage_organizations()` ✅
- `check_po_completion_status()` ✅
- `current_org_id()` ✅
- `generate_budget_number()` ✅
- `generate_inventory_count_number()` ✅
- `generate_order_number()` ✅
- `generate_po_number()` ❓ (2 overloads - verificar)
- `generate_receipt_number()` ✅
- `generate_requisition_number()` ✅
- `generate_technical_report_number()` ✅
- `generate_warranty_claim_number()` ✅
- `get_all_super_admins()` ✅
- `get_enum_values()` ✅
- `get_organization_users_info()` ✅
- `get_workflows_pending_checklists()` ✅
- `has_org_role()` ✅
- `is_admin()` ✅
- `is_org_member()` ✅
- `is_super_admin()` ✅
- `is_user_super_admin()` ✅

#### Funções de Notificações (OK - chamadas por outras funções)
- `create_notification()` ✅
- `mark_all_notifications_as_read()` ✅
- `mark_notification_as_read()` ✅
- `notify_workflow_blocked_by_checklist()` ✅

#### Funções de Processamento (OK)
- `process_inventory_count_adjustments()` ✅
- `process_user_action()` ✅

#### Funções de Super Admin (OK)
- `promote_user_to_super_admin()` ✅
- `revoke_user_super_admin()` ✅

#### Funções de Fornecedores (OK)
- `recalculate_supplier_rating()` ✅ (chamada por trigger)
- `suggest_suppliers_for_part()` ✅

#### Funções Potencialmente Órfãs (⚠️ VERIFICAR)
- `auto_reserve_parts_on_budget_approval()` ❓ (Função antiga? Verificar se ainda é usada)
- `handle_new_user()` ❓ (Verificar se há trigger em auth.users)

**🔧 AÇÃO NECESSÁRIA:** 
1. Verificar se `auto_reserve_parts_on_budget_approval()` ainda é necessária (substituída por `fn_process_budget_approval()`?)
2. Verificar se `handle_new_user()` tem trigger correspondente em `auth.users`
3. Verificar se `apply_inventory_*_from_workflow()` devem ser implementadas ou removidas

---

### 4. Funções com Overload (Mesmo Nome, Assinaturas Diferentes)

| Função | Overloads | Assinaturas |
|--------|-----------|-------------|
| `generate_po_number()` | 2 | `()` e `(p_org_id uuid)` |

**⚠️ PROBLEMA:** Função `generate_po_number()` tem duas versões:
- Uma sem parâmetros: `generate_po_number()`
- Uma com `p_org_id uuid`: `generate_po_number(p_org_id uuid)`

**🔧 AÇÃO NECESSÁRIA:** 
- Verificar qual versão está sendo usada no trigger `set_po_number()` (tabela `purchase_orders`)
- Verificar qual versão está sendo chamada no frontend
- Consolidar em uma única versão (preferencialmente a versão com `p_org_id` para multi-tenancy)
- Remover a versão não utilizada

---

## 🟡 PROBLEMAS MÉDIOS

### 5. Tabelas Potencialmente Não Utilizadas

Com base na análise do código frontend, estas tabelas **NÃO foram encontradas** em queries `.from()`:

#### Tabelas de Sistema/Config (podem ser usadas indiretamente)
- `audit_log` - Log de auditoria (pode não ter interface)
- `dashboard_preferences` - Preferências de dashboard (pode ser usada internamente)
- `entry_form_fields` - Campos de formulário (pode ser usado por templates)
- `entry_form_submissions` - Submissões de formulário (pode não ter interface)
- `entry_form_templates` - Templates de formulário (pode ser usado internamente)
- `expense_categories` - Categorias de despesas (pode não ter módulo ativo)
- `fiscal_audit_log` - Log de auditoria fiscal (pode não ter interface)
- `jurisdiction_config` - Configuração de jurisdição (pode ser usada internamente)
- `obligation_files` - Arquivos de obrigações (pode não ter interface)
- `performance_reviews` - Revisões de performance (pode não ter módulo ativo)
- `production_alerts` - Alertas de produção (pode não ter módulo ativo)
- `production_schedules` - Cronogramas de produção (pode não ter módulo ativo)
- `resource_capacity` - Capacidade de recursos (pode não ter módulo ativo)
- `search_sources` - Fontes de busca (pode não ter módulo ativo)
- `service_price_table` - Tabela de preços de serviços (pode não ter interface)
- `special_environments` - Ambientes especiais (pode não ter módulo ativo)
- `status_prerequisites` - Pré-requisitos de status (pode ser usado internamente)
- `technical_report_templates` - Templates de relatórios (pode ser usado internamente)
- `technical_standards_config` - Configuração de padrões técnicos (pode ser usado internamente)
- `time_logs` - Logs de tempo (pode não ter módulo ativo)
- `work_schedules` - Horários de trabalho (pode não ter módulo ativo)
- `workflow_steps` - Etapas de workflow (pode ser usado internamente)

#### Tabelas de Módulos Não Implementados
- `accounts_payable` - Contas a pagar (1 registro - módulo financeiro pode não estar completo)
- `bank_accounts` - Contas bancárias (módulo financeiro pode não estar completo)
- `cash_flow` - Fluxo de caixa (módulo financeiro pode não estar completo)
- `cash_flow_projection` - Projeção de fluxo de caixa (0 registros - módulo financeiro pode não estar completo)
- `commission_calculations` - Cálculos de comissão (0 registros - módulo financeiro pode não estar completo)
- `employee_time_tracking` - Rastreamento de tempo de funcionários (0 registros - módulo RH pode não estar ativo)
- `employees` - Funcionários (módulo RH pode não estar ativo)
- `monthly_dre` - DRE mensal (0 registros - módulo financeiro pode não estar completo)
- `parts_price_table` - Tabela de preços de peças (pode não ter interface)
- `purchase_efficiency_reports` - Relatórios de eficiência de compras (0 registros - pode não ter interface)
- `purchase_requisition_items` - Itens de requisições (pode ser usado internamente)
- `quotation_items` - Itens de cotações (pode ser usado internamente)
- `quotations` - Cotações (1 registro - pode não ter módulo ativo)
- `quality_history` - Histórico de qualidade (0 registros - pode ser usado internamente)
- `warranty_indicators` - Indicadores de garantia (0 registros - pode ser usado internamente)
- `warranty_claims` - Reclamações de garantia (0 registros - pode não ter módulo ativo)

### 8. Tabelas Vazias (0 Registros)

Tabelas que existem mas não têm nenhum registro (podem ser para uso futuro ou não utilizadas):

**Tabelas de Sistema/Config:**
- `alert_history` - Histórico de alertas arquivados
- `approval_workflows` - Workflows de aprovação pendentes
- `audit_log` - Log de auditoria
- `budget_alerts` - Alertas de orçamento
- `budgets` - (Tabela antiga? Substituída por `detailed_budgets`?)
- `company_fiscal_settings` - Configurações fiscais da empresa
- `dashboard_preferences` - Preferências de dashboard
- `entry_form_fields` - Campos de formulários de entrada
- `entry_form_submissions` - Submissões de formulários
- `entry_form_templates` - Templates de formulários
- `environment_reservations` - Reservas de ambientes especiais
- `fiscal_audit_log` - Log de auditoria fiscal
- `fiscal_classifications` - Classificações fiscais
- `obligation_files` - Arquivos de obrigações fiscais
- `obligation_kinds` - Tipos de obrigações
- `obligations` - Obrigações fiscais
- `order_materials` - Materiais de ordens (0 registros - pode ser usado por `parts_reservations`)
- `performance_reviews` - Revisões de performance
- `production_alerts` - Alertas de produção
- `purchase_efficiency_reports` - Relatórios de eficiência de compras
- `quality_history` - Histórico de qualidade
- `reports` - Relatórios gerados
- `resource_capacity` - Capacidade de recursos
- `supplier_contacts` - Contatos de fornecedores
- `supplier_performance_history` - Histórico de performance de fornecedores
- `supplier_suggestions` - Sugestões de fornecedores
- `tax_calculations` - Cálculos de impostos
- `tax_ledgers` - Livros fiscais
- `tax_rate_tables` - Tabelas de alíquotas
- `tax_regimes` - Regimes tributários
- `tax_rules` - Regras fiscais
- `tax_types` - Tipos de impostos
- `technical_reports` - Relatórios técnicos
- `time_logs` - Logs de tempo
- `user_achievements` - Conquistas de usuários
- `warranty_claims` - Reclamações de garantia
- `warranty_indicators` - Indicadores de garantia
- `work_schedules` - Horários de trabalho
- `workflow_checklist_items` - Itens de checklists
- `workflow_checklist_responses` - Respostas de checklists
- `workflow_checklists` - Checklists de workflow

**⚠️ OBSERVAÇÃO:** Muitas dessas tabelas podem ser para funcionalidades futuras ou podem ser populadas por triggers/funções quando necessário. Verificar dependências antes de remover.

---

### 6. Triggers Antigos que Podem Estar Duplicados

Verificar migrations para triggers que foram removidos mas podem ter sido recriados:

- `auto_parts_reservation_trigger` - Removido na migration `20251018000000_fix_duplicate_reservations_on_budget_approval.sql`
- `trg_budget_approval_actions` - Removido na migration `20251018000000_fix_duplicate_reservations_on_budget_approval.sql`
- `trigger_notify_budget_approved` - Removido na migration `20251018000000_fix_duplicate_reservations_on_budget_approval.sql`

**✅ STATUS:** Já foram removidos na migration mencionada.

---

## 🟢 GAPS IDENTIFICADOS

### 7. Funcionalidades Não Implementadas

#### 7.1. Workflows de Aprovação de Inventário
- `apply_inventory_adjustment_from_workflow()` - Stub apenas
- `apply_inventory_entry_from_workflow()` - Stub apenas
- `apply_inventory_exit_from_workflow()` - Stub apenas

**Status:** Funções criadas mas não implementadas.

#### 7.2. Sistema de Cotações
- Tabela `quotations` existe mas não há interface no frontend
- Tabela `quotation_items` existe mas não há interface no frontend

**Status:** Estrutura criada mas funcionalidade não implementada.

#### 7.3. Módulo de Produção
- Tabelas `production_schedules`, `production_alerts`, `resource_capacity` existem
- Hook `usePCP.ts` existe mas pode não estar completo
- Não há interface no frontend para gerenciar produção

**Status:** Estrutura parcialmente criada.

#### 7.4. Módulo de RH
- Tabelas `employees`, `employee_time_tracking`, `performance_reviews` existem
- Não há interface no frontend

**Status:** Estrutura criada mas funcionalidade não implementada.

#### 7.5. Módulo Financeiro Completo
- Tabelas `accounts_payable`, `bank_accounts`, `cash_flow`, `cash_flow_projection`, `commission_calculations`, `monthly_dre` existem
- Não há interface completa no frontend

**Status:** Estrutura criada mas funcionalidade parcialmente implementada.

---

## 📊 ESTATÍSTICAS GERAIS

### Triggers
- **Total de triggers:** 165
- **Triggers duplicados (mesma função):** 0 (todos são INSERT/UPDATE separados - normal)
- **Triggers problemáticos:** 0

### Funções
- **Total de funções:** ~150
- **Funções não chamadas por triggers:** 77
- **Funções com overload:** 1 (`generate_po_number()`)
- **Funções stubs (não implementadas):** 3

### Tabelas
- **Total de tabelas:** 103
- **Tabelas com `updated_at` sem trigger:** 13
- **Tabelas não encontradas no frontend:** ~40 (mas podem ser usadas por triggers/funções)

---

## ✅ RECOMENDAÇÕES

### Prioridade ALTA 🔴

1. **Criar triggers `update_updated_at_column()` para 13 tabelas:**
   - `achievement_configs`
   - `detailed_budgets`
   - `diagnostic_checklists`
   - `engine_types`
   - `entry_form_templates`
   - `performance_rankings`
   - `purchase_needs`
   - `service_price_table`
   - `special_environments`
   - `technical_report_templates`
   - `technical_standards_config`
   - `user_achievements`
   - `user_scores`
   - `warranty_claims`
   - `workflow_checklists`
   - `workflow_steps`

2. **Resolver função `generate_po_number()` com overload:**
   - Verificar qual versão está sendo usada
   - Consolidar em uma única versão ou remover a não utilizada

3. **Verificar função `auto_reserve_parts_on_budget_approval()`:**
   - Verificar se ainda é necessária ou se foi substituída por `fn_process_budget_approval()`
   - Remover se não for mais necessária

### Prioridade MÉDIA 🟡

4. **Implementar ou remover funções stubs:**
   - `apply_inventory_adjustment_from_workflow()`
   - `apply_inventory_entry_from_workflow()`
   - `apply_inventory_exit_from_workflow()`

5. **Verificar trigger para `handle_new_user()`:**
   - Verificar se existe trigger em `auth.users` chamando esta função
   - Criar trigger se necessário ou remover função se não for usada

### Prioridade BAIXA 🟢

6. **Documentar tabelas não utilizadas:**
   - Criar documentação sobre quais tabelas são para uso futuro
   - Marcar tabelas de módulos não implementados como "Futuro"

7. **Revisar uso de tabelas no frontend:**
   - Verificar se tabelas não encontradas são usadas por triggers/funções
   - Documentar dependências

---

## 📝 NOTAS FINAIS

- **Triggers:** Sistema está bem estruturado, sem duplicações reais
- **Funções:** Maioria das funções não chamadas por triggers são RPCs intencionais
- **Tabelas:** Muitas tabelas podem ser para funcionalidades futuras
- **Gaps:** Vários módulos têm estrutura criada mas não implementada

**Recomendação geral:** Sistema está bem estruturado, mas precisa de:
1. Triggers de `updated_at` para consistência
2. Resolução de funções com overload
3. Documentação sobre módulos não implementados

