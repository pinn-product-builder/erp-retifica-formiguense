-- =============================================================================
-- 2) Função auxiliar inline: escopo por org_id obrigatório
-- =============================================================================

-- Tabelas com org_id NOT NULL (padrão ERP)
CREATE POLICY "org_member_all_accounts_payable_approval_events"
  ON public.accounts_payable_approval_events FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_ap_payment_history"
  ON public.ap_payment_history FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_ap_recurring_schedules"
  ON public.ap_recurring_schedules FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_approval_tiers_ap"
  ON public.approval_tiers_ap FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_ar_due_alerts"
  ON public.ar_due_alerts FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_ar_late_fee_history"
  ON public.ar_late_fee_history FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_ar_late_fee_rules"
  ON public.ar_late_fee_rules FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_ar_renegotiations"
  ON public.ar_renegotiations FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_bank_reconciliation_items"
  ON public.bank_reconciliation_items FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.bank_reconciliations r
      WHERE r.id = bank_reconciliation_items.reconciliation_id
        AND public.is_org_member(r.org_id)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.bank_reconciliations r
      WHERE r.id = bank_reconciliation_items.reconciliation_id
        AND public.is_org_member(r.org_id)
    )
  );

CREATE POLICY "org_member_all_bank_reconciliation_reports"
  ON public.bank_reconciliation_reports FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_bank_reconciliations"
  ON public.bank_reconciliations FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_bank_statement_imports"
  ON public.bank_statement_imports FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_bank_statement_lines"
  ON public.bank_statement_lines FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.bank_statement_imports i
      WHERE i.id = bank_statement_lines.import_id
        AND public.is_org_member(i.org_id)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.bank_statement_imports i
      WHERE i.id = bank_statement_lines.import_id
        AND public.is_org_member(i.org_id)
    )
  );

CREATE POLICY "org_member_all_bank_transmission_batches"
  ON public.bank_transmission_batches FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_card_machine_configs"
  ON public.card_machine_configs FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_cash_closings"
  ON public.cash_closings FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_cost_centers"
  ON public.cost_centers FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_customers"
  ON public.customers FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_fin_accounting_entries"
  ON public.fin_accounting_entries FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_financial_notifications"
  ON public.financial_notifications FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_monthly_financial_reports"
  ON public.monthly_financial_reports FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_orders"
  ON public.orders FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_partner_withdrawals"
  ON public.partner_withdrawals FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE POLICY "org_member_all_receipt_history"
  ON public.receipt_history FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

-- =============================================================================
-- 3) org_id opcional: catálogo compartilhado (NULL) + linhas por org
-- =============================================================================

CREATE POLICY "org_member_all_consultants"
  ON public.consultants FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
    OR (org_id IS NULL)
  )
  WITH CHECK (
    public.is_super_admin()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
    OR (org_id IS NULL)
  );

CREATE POLICY "org_member_all_payment_methods"
  ON public.payment_methods FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
    OR (org_id IS NULL)
  )
  WITH CHECK (
    public.is_super_admin()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
    OR (org_id IS NULL)
  );

CREATE POLICY "org_member_all_cash_flow_projection"
  ON public.cash_flow_projection FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
    OR (org_id IS NULL)
  )
  WITH CHECK (
    public.is_super_admin()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
    OR (org_id IS NULL)
  );

-- =============================================================================
-- 4) Sem org_id na tabela: escopo via orders.org_id
-- =============================================================================

CREATE POLICY "org_member_all_order_workflow"
  ON public.order_workflow FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_workflow.order_id
        AND public.is_org_member(o.org_id)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_workflow.order_id
        AND public.is_org_member(o.org_id)
    )
  );

CREATE POLICY "org_member_all_time_logs"
  ON public.time_logs FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = time_logs.order_id
        AND public.is_org_member(o.org_id)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = time_logs.order_id
        AND public.is_org_member(o.org_id)
    )
  );
