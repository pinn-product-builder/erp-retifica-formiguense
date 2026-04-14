-- Performance advisor: get_advisors(type: performance) — índices + RLS initplan.
-- Gerado a partir do dump do linter; validar em staging (principalmente DROP de índices).
--
-- Coberto:
--   unindexed_foreign_keys (228) → CREATE INDEX IF NOT EXISTS
--   duplicate_index (3) → DROP INDEX
--   unused_index (146) → DROP INDEX IF EXISTS (exclui nomes já dropados como duplicados)
--   auth_rls_initplan → ALTER POLICY: auth.uid/jwt/role → (select ...)
--
-- Não coberto em SQL:
--   multiple_permissive_policies (~346) — fundir políticas por combinação role+ação ou revisar grants.
--   auth_db_connections_absolute — dashboard Supabase / going-into-prod.
--
-- https://supabase.com/docs/guides/database/database-linter

-- =============================================================================
-- 1) FKs sem índice
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_perf_fk_accounts_payable_cost_center_id ON public.accounts_payable (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_accounts_payable_expense_category_id ON public.accounts_payable (expense_category_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_accounts_payable_purchase_order_id ON public.accounts_payable (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_accounts_payable_supplier_id ON public.accounts_payable (supplier_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_accounts_payable_approval_events_org_id ON public.accounts_payable_approval_events (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_accounts_payable_approval_events_user_id ON public.accounts_payable_approval_events (user_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_accounts_receivable_cost_center_id ON public.accounts_receivable (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_accounts_receivable_created_by ON public.accounts_receivable (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_accounts_receivable_customer_id ON public.accounts_receivable (customer_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_accounts_receivable_order_id ON public.accounts_receivable (order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_accounts_receivable_updated_by ON public.accounts_receivable (updated_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_alert_history_dismissed_by ON public.alert_history (dismissed_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ap_payment_history_org_id ON public.ap_payment_history (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ap_payment_history_registered_by ON public.ap_payment_history (registered_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ap_recurring_schedules_cost_center_id ON public.ap_recurring_schedules (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ap_recurring_schedules_expense_category_id ON public.ap_recurring_schedules (expense_category_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ap_recurring_schedules_org_id ON public.ap_recurring_schedules (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ap_recurring_schedules_supplier_id ON public.ap_recurring_schedules (supplier_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_approval_tiers_ap_org_id ON public.approval_tiers_ap (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ar_due_alerts_receivable_account_id ON public.ar_due_alerts (receivable_account_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ar_late_fee_history_org_id ON public.ar_late_fee_history (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ar_renegotiations_created_by ON public.ar_renegotiations (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ar_renegotiations_new_ar_id ON public.ar_renegotiations (new_ar_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ar_renegotiations_org_id ON public.ar_renegotiations (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_ar_renegotiations_original_ar_id ON public.ar_renegotiations (original_ar_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_reconciliation_items_cash_flow_id ON public.bank_reconciliation_items (cash_flow_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_reconciliation_items_confirmed_by ON public.bank_reconciliation_items (confirmed_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_reconciliation_items_reconciliation_id ON public.bank_reconciliation_items (reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_reconciliation_items_statement_line_id ON public.bank_reconciliation_items (statement_line_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_reconciliation_reports_generated_by ON public.bank_reconciliation_reports (generated_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_reconciliation_reports_org_id ON public.bank_reconciliation_reports (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_reconciliation_reports_reconciliation_id ON public.bank_reconciliation_reports (reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_reconciliations_bank_account_id ON public.bank_reconciliations (bank_account_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_reconciliations_org_id ON public.bank_reconciliations (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_statement_imports_bank_account_id ON public.bank_statement_imports (bank_account_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_statement_imports_created_by ON public.bank_statement_imports (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_statement_imports_org_id ON public.bank_statement_imports (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_statement_lines_import_id ON public.bank_statement_lines (import_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_statement_lines_matched_cash_flow_id ON public.bank_statement_lines (matched_cash_flow_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_bank_transmission_batches_bank_account_id ON public.bank_transmission_batches (bank_account_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_budget_alerts_dismissed_by ON public.budget_alerts (dismissed_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_budget_approvals_registered_by ON public.budget_approvals (registered_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_budgets_order_id ON public.budgets (order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_card_machine_configs_org_id ON public.card_machine_configs (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cash_closings_closed_by ON public.cash_closings (closed_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cash_flow_accounts_payable_id ON public.cash_flow (accounts_payable_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cash_flow_accounts_receivable_id ON public.cash_flow (accounts_receivable_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cash_flow_bank_account_id ON public.cash_flow (bank_account_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cash_flow_category_id ON public.cash_flow (category_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cash_flow_cost_center_id ON public.cash_flow (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cash_flow_order_id ON public.cash_flow (order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cash_flow_org_id ON public.cash_flow (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cash_flow_projection_org_id ON public.cash_flow_projection (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_commission_calculations_approved_by ON public.commission_calculations (approved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_commission_calculations_employee_id ON public.commission_calculations (employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_commission_calculations_org_id ON public.commission_calculations (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_company_fiscal_settings_regime_id ON public.company_fiscal_settings (regime_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_conditional_extensions_approved_by ON public.conditional_extensions (approved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_conditional_extensions_requested_by ON public.conditional_extensions (requested_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_conditional_order_items_received_by ON public.conditional_order_items (received_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_conditional_orders_created_by ON public.conditional_orders (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_conditional_orders_decided_by ON public.conditional_orders (decided_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cost_centers_parent_id ON public.cost_centers (parent_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cost_details_movement_id ON public.cost_details (movement_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cost_layers_batch_id ON public.cost_layers (batch_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cost_layers_movement_id ON public.cost_layers (movement_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cost_layers_org_id ON public.cost_layers (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cost_layers_part_id ON public.cost_layers (part_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cost_method_changes_org_id ON public.cost_method_changes (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_cost_method_changes_part_id ON public.cost_method_changes (part_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_detailed_budgets_created_by ON public.detailed_budgets (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_detailed_budgets_diagnostic_response_id ON public.detailed_budgets (diagnostic_response_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_diagnostic_checklist_responses_approved_by ON public.diagnostic_checklist_responses (approved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_diagnostic_checklist_responses_checklist_id ON public.diagnostic_checklist_responses (checklist_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_diagnostic_checklists_created_by ON public.diagnostic_checklists (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_employee_time_tracking_approved_by ON public.employee_time_tracking (approved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_employee_time_tracking_employee_id ON public.employee_time_tracking (employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_employee_time_tracking_org_id ON public.employee_time_tracking (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_employees_org_id ON public.employees (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_employees_user_id ON public.employees (user_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_engine_template_parts_part_id ON public.engine_template_parts (part_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_engine_template_services_service_id ON public.engine_template_services (service_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_engine_templates_created_by ON public.engine_templates (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_engines_engine_type_id ON public.engines (engine_type_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_entry_form_submissions_submitted_by ON public.entry_form_submissions (submitted_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_entry_form_templates_created_by ON public.entry_form_templates (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_entry_form_templates_engine_type_id ON public.entry_form_templates (engine_type_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_environment_reservations_environment_id ON public.environment_reservations (environment_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_environment_reservations_order_id ON public.environment_reservations (order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_environment_reservations_org_id ON public.environment_reservations (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_environment_reservations_reserved_by ON public.environment_reservations (reserved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_fiscal_audit_log_user_id ON public.fiscal_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_count_items_counted_by ON public.inventory_count_items (counted_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_counts_counted_by ON public.inventory_counts (counted_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_counts_created_by ON public.inventory_counts (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_counts_reviewed_by ON public.inventory_counts (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_movements_approved_by ON public.inventory_movements (approved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_movements_batch_id ON public.inventory_movements (batch_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_movements_created_by ON public.inventory_movements (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_movements_dest_location_id ON public.inventory_movements (dest_location_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_movements_dest_warehouse_id ON public.inventory_movements (dest_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_movements_location_id ON public.inventory_movements (location_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_movements_serial_id ON public.inventory_movements (serial_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_inventory_movements_warehouse_id ON public.inventory_movements (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_kpi_targets_kpi_id ON public.kpi_targets (kpi_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_material_requisition_items_part_id ON public.material_requisition_items (part_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_monthly_financial_reports_generated_by ON public.monthly_financial_reports (generated_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_negotiation_rounds_negotiated_by ON public.negotiation_rounds (negotiated_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_notifications_notification_type_id ON public.notifications (notification_type_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_documents_uploaded_by ON public.order_documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_materials_order_id ON public.order_materials (order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_materials_org_id ON public.order_materials (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_materials_part_id ON public.order_materials (part_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_materials_used_by ON public.order_materials (used_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_photos_order_id ON public.order_photos (order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_status_history_changed_by ON public.order_status_history (changed_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_status_history_order_id ON public.order_status_history (order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_status_history_org_id ON public.order_status_history (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_warranties_org_id ON public.order_warranties (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_workflow_approved_by ON public.order_workflow (approved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_order_workflow_workflow_step_id ON public.order_workflow (workflow_step_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_orders_consultant_id ON public.orders (consultant_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_orders_engine_id ON public.orders (engine_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_organization_users_invited_by ON public.organization_users (invited_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_partner_withdrawals_created_by ON public.partner_withdrawals (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_partner_withdrawals_org_id ON public.partner_withdrawals (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_parts_inventory_location_id ON public.parts_inventory (location_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_parts_inventory_order_id ON public.parts_inventory (order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_parts_inventory_warehouse_id ON public.parts_inventory (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_parts_reservations_applied_by ON public.parts_reservations (applied_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_parts_reservations_cancelled_by ON public.parts_reservations (cancelled_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_parts_reservations_reserved_by ON public.parts_reservations (reserved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_parts_reservations_separated_by ON public.parts_reservations (separated_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_parts_stock_config_preferred_supplier_id ON public.parts_stock_config (preferred_supplier_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_parts_stock_config_updated_by ON public.parts_stock_config (updated_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_payment_methods_org_id ON public.payment_methods (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_performance_reviews_employee_id ON public.performance_reviews (employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_performance_reviews_org_id ON public.performance_reviews (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_performance_reviews_reviewer_id ON public.performance_reviews (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_production_alerts_order_id ON public.production_alerts (order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_production_alerts_org_id ON public.production_alerts (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_production_alerts_schedule_id ON public.production_alerts (schedule_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_production_schedules_order_id ON public.production_schedules (order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_production_schedules_org_id ON public.production_schedules (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_efficiency_reports_generated_by ON public.purchase_efficiency_reports (generated_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_efficiency_reports_org_id ON public.purchase_efficiency_reports (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_invoices_created_by ON public.purchase_invoices (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_invoices_receipt_id ON public.purchase_invoices (receipt_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_order_approvals_performed_by ON public.purchase_order_approvals (performed_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_order_items_po_id ON public.purchase_order_items (po_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_orders_approved_by ON public.purchase_orders (approved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_orders_created_by ON public.purchase_orders (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_orders_org_id ON public.purchase_orders (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_orders_requisition_id ON public.purchase_orders (requisition_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_orders_supplier_id ON public.purchase_orders (supplier_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_quotation_selections_selected_proposal_id ON public.purchase_quotation_selections (selected_proposal_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_receipts_created_by ON public.purchase_receipts (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_receipts_received_by ON public.purchase_receipts (received_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_requisition_items_requisition_id ON public.purchase_requisition_items (requisition_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_requisitions_approved_by ON public.purchase_requisitions (approved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_requisitions_org_id ON public.purchase_requisitions (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_purchase_requisitions_requested_by ON public.purchase_requisitions (requested_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_quality_history_org_id ON public.quality_history (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_quality_history_recorded_by ON public.quality_history (recorded_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_quality_history_related_checklist_id ON public.quality_history (related_checklist_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_quality_history_related_report_id ON public.quality_history (related_report_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_quality_history_related_response_id ON public.quality_history (related_response_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_quotation_items_quotation_id ON public.quotation_items (quotation_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_quotations_org_id ON public.quotations (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_quotations_requisition_id ON public.quotations (requisition_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_quotations_supplier_id ON public.quotations (supplier_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_receipt_history_registered_by ON public.receipt_history (registered_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_resource_capacity_org_id ON public.resource_capacity (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_special_environments_org_id ON public.special_environments (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_status_prerequisites_org_id ON public.status_prerequisites (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_stock_accounting_config_org_id ON public.stock_accounting_config (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_stock_accounting_entries_movement_id ON public.stock_accounting_entries (movement_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_stock_accounting_entries_org_id ON public.stock_accounting_entries (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_stock_alerts_acknowledged_by ON public.stock_alerts (acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_stock_batches_part_id ON public.stock_batches (part_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_stock_provisions_accounting_entry_id ON public.stock_provisions (accounting_entry_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_stock_provisions_batch_id ON public.stock_provisions (batch_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_stock_provisions_org_id ON public.stock_provisions (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_stock_provisions_part_id ON public.stock_provisions (part_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_stock_serials_batch_id ON public.stock_serials (batch_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_stock_serials_part_id ON public.stock_serials (part_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_supplier_contracts_created_by ON public.supplier_contracts (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_supplier_credit_usage_payable_id ON public.supplier_credit_usage (payable_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_supplier_credit_usage_used_by ON public.supplier_credit_usage (used_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_supplier_credits_created_by ON public.supplier_credits (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_supplier_evaluations_evaluated_by ON public.supplier_evaluations (evaluated_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_supplier_performance_history_org_id ON public.supplier_performance_history (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_supplier_return_items_receipt_item_id ON public.supplier_return_items (receipt_item_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_supplier_returns_purchase_order_id ON public.supplier_returns (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_suppliers_created_by ON public.suppliers (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_suppliers_default_cost_center_id ON public.suppliers (default_cost_center_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_suppliers_default_expense_category_id ON public.suppliers (default_expense_category_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_tax_calculations_classification_id ON public.tax_calculations (classification_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_tax_calculations_classification_id ON public.tax_calculations (classification_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_tax_ledgers_regime_id ON public.tax_ledgers (regime_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_tax_rate_tables_classification_id ON public.tax_rate_tables (classification_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_tax_rate_tables_classification_id ON public.tax_rate_tables (classification_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_tax_rules_classification_id ON public.tax_rules (classification_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_tax_rules_tax_type_id ON public.tax_rules (tax_type_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_technical_report_templates_created_by ON public.technical_report_templates (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_technical_reports_approved_by ON public.technical_reports (approved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_technical_reports_generated_by ON public.technical_reports (generated_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_technical_reports_org_id ON public.technical_reports (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_time_logs_order_id ON public.time_logs (order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_user_achievements_user_id ON public.user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_user_score_history_user_id ON public.user_score_history (user_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_user_scores_user_id ON public.user_scores (user_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_warranty_claims_customer_id ON public.warranty_claims (customer_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_warranty_claims_evaluated_by ON public.warranty_claims (evaluated_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_warranty_claims_new_order_id ON public.warranty_claims (new_order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_warranty_claims_org_id ON public.warranty_claims (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_warranty_claims_original_order_id ON public.warranty_claims (original_order_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_warranty_claims_resolved_by ON public.warranty_claims (resolved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_warranty_indicators_generated_by ON public.warranty_indicators (generated_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_work_schedules_employee_id ON public.work_schedules (employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_work_schedules_org_id ON public.work_schedules (org_id);
CREATE INDEX IF NOT EXISTS idx_perf_fk_workflow_checklist_responses_filled_by ON public.workflow_checklist_responses (filled_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_workflow_checklist_responses_reviewed_by ON public.workflow_checklist_responses (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_workflow_checklist_responses_supervisor_approved_by ON public.workflow_checklist_responses (supervisor_approved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_workflow_checklists_created_by ON public.workflow_checklists (created_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_workflow_status_history_approved_by ON public.workflow_status_history (approved_by);
CREATE INDEX IF NOT EXISTS idx_perf_fk_workflow_status_history_org_id ON public.workflow_status_history (org_id);

-- =============================================================================
-- 2) Índices duplicados
-- =============================================================================
DROP INDEX IF EXISTS public.idx_conditional_order_items_order_id;
DROP INDEX IF EXISTS public.idx_conditional_orders_expiry_date;
DROP INDEX IF EXISTS public.obligation_files_obligation_id_idx;

-- =============================================================================
-- 3) Índices não usados (INFO)
-- =============================================================================
DROP INDEX IF EXISTS public.accounts_payable_approval_events_payable_id_idx;
DROP INDEX IF EXISTS public.ap_payment_history_payable_idx;
DROP INDEX IF EXISTS public.ar_due_alerts_org_idx;
DROP INDEX IF EXISTS public.ar_late_fee_history_ar_idx;
DROP INDEX IF EXISTS public.bank_transmission_batches_org_idx;
DROP INDEX IF EXISTS public.fin_accounting_entries_org_idx;
DROP INDEX IF EXISTS public.idx_accounts_payable_org_id;
DROP INDEX IF EXISTS public.idx_achievement_configs_active;
DROP INDEX IF EXISTS public.idx_additional_services_active;
DROP INDEX IF EXISTS public.idx_additional_services_engine_type;
DROP INDEX IF EXISTS public.idx_alert_history_alert_id;
DROP INDEX IF EXISTS public.idx_alert_history_created_at;
DROP INDEX IF EXISTS public.idx_alert_history_severity;
DROP INDEX IF EXISTS public.idx_alerts_purchase_need_metadata;
DROP INDEX IF EXISTS public.idx_approval_rules_active;
DROP INDEX IF EXISTS public.idx_approval_rules_org_id;
DROP INDEX IF EXISTS public.idx_approval_rules_type;
DROP INDEX IF EXISTS public.idx_approval_workflows_org_id;
DROP INDEX IF EXISTS public.idx_approval_workflows_reference;
DROP INDEX IF EXISTS public.idx_approval_workflows_status;
DROP INDEX IF EXISTS public.idx_approval_workflows_type;
DROP INDEX IF EXISTS public.idx_audit_log_org_id;
DROP INDEX IF EXISTS public.idx_budget_alerts_active;
DROP INDEX IF EXISTS public.idx_budget_alerts_type;
DROP INDEX IF EXISTS public.idx_budget_approvals_org_id;
DROP INDEX IF EXISTS public.idx_budget_approvals_type;
DROP INDEX IF EXISTS public.idx_conditional_orders_supplier_id;
DROP INDEX IF EXISTS public.idx_detailed_budgets_component;
DROP INDEX IF EXISTS public.idx_detailed_budgets_number;
DROP INDEX IF EXISTS public.idx_detailed_budgets_org_budget;
DROP INDEX IF EXISTS public.idx_diagnostic_additional_parts_diagnostic_response_id;
DROP INDEX IF EXISTS public.idx_diagnostic_additional_services_service_id;
DROP INDEX IF EXISTS public.idx_diagnostic_checklist_items_order;
DROP INDEX IF EXISTS public.idx_diagnostic_responses_additional_parts;
DROP INDEX IF EXISTS public.idx_diagnostic_responses_additional_services;
DROP INDEX IF EXISTS public.idx_diagnostic_responses_component;
DROP INDEX IF EXISTS public.idx_engine_categories_active;
DROP INDEX IF EXISTS public.idx_engine_categories_name;
DROP INDEX IF EXISTS public.idx_engine_templates_engine_type_id;
DROP INDEX IF EXISTS public.idx_engine_type_services_engine_type;
DROP INDEX IF EXISTS public.idx_engine_type_services_service;
DROP INDEX IF EXISTS public.idx_engine_types_category;
DROP INDEX IF EXISTS public.idx_form_submissions_date;
DROP INDEX IF EXISTS public.idx_form_submissions_template;
DROP INDEX IF EXISTS public.idx_inventory_counts_count_date;
DROP INDEX IF EXISTS public.idx_kpi_targets_goal_type;
DROP INDEX IF EXISTS public.idx_kpi_targets_priority;
DROP INDEX IF EXISTS public.idx_kpi_targets_status;
DROP INDEX IF EXISTS public.idx_macro_components_active;
DROP INDEX IF EXISTS public.idx_material_requisitions_order;
DROP INDEX IF EXISTS public.idx_negotiation_rounds_supplier;
DROP INDEX IF EXISTS public.idx_obligation_files_obligation;
DROP INDEX IF EXISTS public.idx_obligations_kind_period;
DROP INDEX IF EXISTS public.idx_obligations_period;
DROP INDEX IF EXISTS public.idx_order_workflow_status_pending;
DROP INDEX IF EXISTS public.idx_orders_created_by;
DROP INDEX IF EXISTS public.idx_orders_status_created_by;
DROP INDEX IF EXISTS public.idx_org_users_role;
DROP INDEX IF EXISTS public.idx_organizations_slug;
DROP INDEX IF EXISTS public.idx_parts_inventory_barcode;
DROP INDEX IF EXISTS public.idx_parts_inventory_ncm;
DROP INDEX IF EXISTS public.idx_parts_inventory_org_id;
DROP INDEX IF EXISTS public.idx_parts_price_table_code;
DROP INDEX IF EXISTS public.idx_parts_reservations_part_code;
DROP INDEX IF EXISTS public.idx_parts_reservations_part_id;
DROP INDEX IF EXISTS public.idx_parts_stock_config_critical;
DROP INDEX IF EXISTS public.idx_pqi_part;
DROP INDEX IF EXISTS public.idx_profile_page_permissions_page_id;
DROP INDEX IF EXISTS public.idx_purchase_invoices_order;
DROP INDEX IF EXISTS public.idx_purchase_needs_part_id;
DROP INDEX IF EXISTS public.idx_purchase_needs_priority;
DROP INDEX IF EXISTS public.idx_purchase_needs_urgency;
DROP INDEX IF EXISTS public.idx_purchase_order_items_part_id;
DROP INDEX IF EXISTS public.idx_purchase_receipt_items_part_id;
DROP INDEX IF EXISTS public.idx_purchase_receipts_status;
DROP INDEX IF EXISTS public.idx_purchase_requisition_items_part_id;
DROP INDEX IF EXISTS public.idx_quality_history_component;
DROP INDEX IF EXISTS public.idx_quality_history_date;
DROP INDEX IF EXISTS public.idx_quality_history_event_type;
DROP INDEX IF EXISTS public.idx_quality_history_severity;
DROP INDEX IF EXISTS public.idx_quotation_items_part_id;
DROP INDEX IF EXISTS public.idx_receipt_history_ar;
DROP INDEX IF EXISTS public.idx_reports_created_at;
DROP INDEX IF EXISTS public.idx_reports_org_id;
DROP INDEX IF EXISTS public.idx_reports_status;
DROP INDEX IF EXISTS public.idx_service_price_table_component;
DROP INDEX IF EXISTS public.idx_status_config_allowed_components;
DROP INDEX IF EXISTS public.idx_status_config_engine_type;
DROP INDEX IF EXISTS public.idx_stock_alerts_active;
DROP INDEX IF EXISTS public.idx_stock_alerts_level;
DROP INDEX IF EXISTS public.idx_stock_alerts_org;
DROP INDEX IF EXISTS public.idx_stock_alerts_org_part;
DROP INDEX IF EXISTS public.idx_supplier_contacts_is_primary;
DROP INDEX IF EXISTS public.idx_supplier_contacts_org_id;
DROP INDEX IF EXISTS public.idx_supplier_credit_usage_credit;
DROP INDEX IF EXISTS public.idx_supplier_credits_org;
DROP INDEX IF EXISTS public.idx_supplier_credits_status;
DROP INDEX IF EXISTS public.idx_supplier_credits_supplier;
DROP INDEX IF EXISTS public.idx_supplier_performance_date;
DROP INDEX IF EXISTS public.idx_supplier_products_active;
DROP INDEX IF EXISTS public.idx_supplier_products_part_code;
DROP INDEX IF EXISTS public.idx_supplier_products_preferred;
DROP INDEX IF EXISTS public.idx_supplier_return_items;
DROP INDEX IF EXISTS public.idx_supplier_returns_rcpt;
DROP INDEX IF EXISTS public.idx_supplier_returns_supp;
DROP INDEX IF EXISTS public.idx_supplier_suggestions_score;
DROP INDEX IF EXISTS public.idx_supplier_suggestions_supplier;
DROP INDEX IF EXISTS public.idx_suppliers_blocked;
DROP INDEX IF EXISTS public.idx_suppliers_brands;
DROP INDEX IF EXISTS public.idx_suppliers_categories;
DROP INDEX IF EXISTS public.idx_suppliers_code;
DROP INDEX IF EXISTS public.idx_suppliers_is_preferred;
DROP INDEX IF EXISTS public.idx_suppliers_rating;
DROP INDEX IF EXISTS public.idx_tax_calculations_regime;
DROP INDEX IF EXISTS public.idx_tax_ledgers_tax_type;
DROP INDEX IF EXISTS public.idx_technical_report_templates_org;
DROP INDEX IF EXISTS public.idx_technical_report_templates_standard;
DROP INDEX IF EXISTS public.idx_technical_report_templates_type;
DROP INDEX IF EXISTS public.idx_technical_reports_component;
DROP INDEX IF EXISTS public.idx_technical_reports_conformity;
DROP INDEX IF EXISTS public.idx_technical_reports_number;
DROP INDEX IF EXISTS public.idx_technical_reports_type;
DROP INDEX IF EXISTS public.idx_technical_standards_config_org;
DROP INDEX IF EXISTS public.idx_user_achievements_earned_at;
DROP INDEX IF EXISTS public.idx_user_achievements_type;
DROP INDEX IF EXISTS public.idx_user_basic_info_email;
DROP INDEX IF EXISTS public.idx_user_profile_assignments_user_id;
DROP INDEX IF EXISTS public.idx_user_profiles_sector_id;
DROP INDEX IF EXISTS public.idx_user_score_history_created_at;
DROP INDEX IF EXISTS public.idx_user_scores_level;
DROP INDEX IF EXISTS public.idx_user_scores_points;
DROP INDEX IF EXISTS public.idx_workflow_checklist_items_checklist;
DROP INDEX IF EXISTS public.idx_workflow_checklist_items_critical;
DROP INDEX IF EXISTS public.idx_workflow_checklist_items_order;
DROP INDEX IF EXISTS public.idx_workflow_checklist_responses_checklist;
DROP INDEX IF EXISTS public.idx_workflow_checklist_responses_component;
DROP INDEX IF EXISTS public.idx_workflow_checklist_responses_status;
DROP INDEX IF EXISTS public.idx_workflow_checklists_org;
DROP INDEX IF EXISTS public.idx_workflow_checklists_standard;
DROP INDEX IF EXISTS public.idx_workflow_checklists_step;
DROP INDEX IF EXISTS public.idx_workflow_responses_workflow_checklist;
DROP INDEX IF EXISTS public.idx_workflow_steps_component;
DROP INDEX IF EXISTS public.obligation_files_generated_at_idx;
DROP INDEX IF EXISTS public.tax_calc_order_idx;
DROP INDEX IF EXISTS public.tax_rate_idx;
DROP INDEX IF EXISTS public.tax_rules_query_idx;

-- =============================================================================
-- 4) auth_rls_initplan
-- =============================================================================
DO $$
DECLARE
  r RECORD;
  q text;
  w text;
  q2 text;
  w2 text;
  cmd text;
BEGIN
  FOR r IN
    SELECT n.nspname AS sch,
           c.relname AS tbl,
           p.polname AS pol,
           pg_get_expr(p.polqual, p.polrelid) AS qual,
           pg_get_expr(p.polwithcheck, p.polrelid) AS wchk
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
  LOOP
    q := r.qual;
    w := r.wchk;
    q2 := q;
    w2 := w;
    IF q IS NOT NULL THEN
      q2 := regexp_replace(q2, 'auth\.jwt\(\)', '(select auth.jwt())', 'g');
      q2 := regexp_replace(q2, 'auth\.uid\(\)', '(select auth.uid())', 'g');
      q2 := regexp_replace(q2, 'auth\.role\(\)', '(select auth.role())', 'g');
    END IF;
    IF w IS NOT NULL THEN
      w2 := regexp_replace(w2, 'auth\.jwt\(\)', '(select auth.jwt())', 'g');
      w2 := regexp_replace(w2, 'auth\.uid\(\)', '(select auth.uid())', 'g');
      w2 := regexp_replace(w2, 'auth\.role\(\)', '(select auth.role())', 'g');
    END IF;
    IF q2 IS NOT NULL THEN
      q2 := regexp_replace(q2, '\(select \(select auth\.uid\(\)\)\)', '(select auth.uid())', 'g');
      q2 := regexp_replace(q2, '\(select \(select auth\.jwt\(\)\)\)', '(select auth.jwt())', 'g');
      q2 := regexp_replace(q2, '\(select \(select auth\.role\(\)\)\)', '(select auth.role())', 'g');
    END IF;
    IF w2 IS NOT NULL THEN
      w2 := regexp_replace(w2, '\(select \(select auth\.uid\(\)\)\)', '(select auth.uid())', 'g');
      w2 := regexp_replace(w2, '\(select \(select auth\.jwt\(\)\)\)', '(select auth.jwt())', 'g');
      w2 := regexp_replace(w2, '\(select \(select auth\.role\(\)\)\)', '(select auth.role())', 'g');
    END IF;
    IF q2 IS DISTINCT FROM q OR w2 IS DISTINCT FROM w THEN
      cmd := format('ALTER POLICY %I ON %I.%I', r.pol, r.sch, r.tbl);
      IF q2 IS DISTINCT FROM q THEN
        cmd := cmd || format(' USING (%s)', COALESCE(q2, 'true'));
      END IF;
      IF w2 IS DISTINCT FROM w THEN
        cmd := cmd || format(' WITH CHECK (%s)', COALESCE(w2, 'true'));
      END IF;
      EXECUTE cmd || ';';
    END IF;
  END LOOP;
END $$;
