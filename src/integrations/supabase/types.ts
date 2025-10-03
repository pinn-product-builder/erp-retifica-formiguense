export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          due_date: string
          expense_category_id: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          org_id: string | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["payment_status"] | null
          supplier_document: string | null
          supplier_name: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          due_date: string
          expense_category_id?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          org_id?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          supplier_document?: string | null
          supplier_name: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          due_date?: string
          expense_category_id?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          org_id?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          supplier_document?: string | null
          supplier_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          amount: number
          budget_id: string | null
          created_at: string | null
          customer_id: string
          discount: number | null
          due_date: string
          id: string
          installment_number: number | null
          invoice_number: string | null
          late_fee: number | null
          notes: string | null
          order_id: string | null
          org_id: string | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["payment_status"] | null
          total_installments: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          budget_id?: string | null
          created_at?: string | null
          customer_id: string
          discount?: number | null
          due_date: string
          id?: string
          installment_number?: number | null
          invoice_number?: string | null
          late_fee?: number | null
          notes?: string | null
          order_id?: string | null
          org_id?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          total_installments?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          budget_id?: string | null
          created_at?: string | null
          customer_id?: string
          discount?: number | null
          due_date?: string
          id?: string
          installment_number?: number | null
          invoice_number?: string | null
          late_fee?: number | null
          notes?: string | null
          order_id?: string | null
          org_id?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          total_installments?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "detailed_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          action_label: string | null
          action_url: string | null
          alert_type: string
          auto_dismiss_after: number | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          is_dismissible: boolean
          message: string
          metadata: Json | null
          org_id: string
          severity: string
          target_users: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          alert_type: string
          auto_dismiss_after?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_dismissible?: boolean
          message: string
          metadata?: Json | null
          org_id: string
          severity?: string
          target_users?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          alert_type?: string
          auto_dismiss_after?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_dismissible?: boolean
          message?: string
          metadata?: Json | null
          org_id?: string
          severity?: string
          target_users?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          operation: string
          org_id: string
          record_id: string
          table_name: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          org_id: string
          record_id: string
          table_name: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          org_id?: string
          record_id?: string
          table_name?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_number: string
          account_type: string | null
          agency: string | null
          balance: number | null
          bank_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          org_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_number: string
          account_type?: string | null
          agency?: string | null
          balance?: number | null
          bank_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string
          account_type?: string | null
          agency?: string | null
          balance?: number | null
          bank_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      budget_alerts: {
        Row: {
          alert_message: string
          alert_type: string
          budget_id: string | null
          created_at: string | null
          dismissed_at: string | null
          dismissed_by: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          alert_message: string
          alert_type: string
          budget_id?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          alert_message?: string
          alert_type?: string
          budget_id?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_alerts_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "detailed_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_approvals: {
        Row: {
          approval_document: Json | null
          approval_method: string
          approval_notes: string | null
          approval_type: string
          approved_amount: number | null
          approved_at: string | null
          approved_by_customer: string | null
          approved_parts: Json | null
          approved_services: Json | null
          budget_id: string | null
          customer_signature: string | null
          id: string
          org_id: string | null
          registered_by: string | null
        }
        Insert: {
          approval_document?: Json | null
          approval_method: string
          approval_notes?: string | null
          approval_type: string
          approved_amount?: number | null
          approved_at?: string | null
          approved_by_customer?: string | null
          approved_parts?: Json | null
          approved_services?: Json | null
          budget_id?: string | null
          customer_signature?: string | null
          id?: string
          org_id?: string | null
          registered_by?: string | null
        }
        Update: {
          approval_document?: Json | null
          approval_method?: string
          approval_notes?: string | null
          approval_type?: string
          approved_amount?: number | null
          approved_at?: string | null
          approved_by_customer?: string | null
          approved_parts?: Json | null
          approved_services?: Json | null
          budget_id?: string | null
          customer_signature?: string | null
          id?: string
          org_id?: string | null
          registered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_approvals_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "detailed_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_approvals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          component: Database["public"]["Enums"]["engine_component"]
          created_at: string
          description: string
          id: string
          labor_cost: number | null
          notes: string | null
          order_id: string
          parts_cost: number | null
          status: Database["public"]["Enums"]["budget_status"] | null
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          component: Database["public"]["Enums"]["engine_component"]
          created_at?: string
          description: string
          id?: string
          labor_cost?: number | null
          notes?: string | null
          order_id: string
          parts_cost?: number | null
          status?: Database["public"]["Enums"]["budget_status"] | null
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          component?: Database["public"]["Enums"]["engine_component"]
          created_at?: string
          description?: string
          id?: string
          labor_cost?: number | null
          notes?: string | null
          order_id?: string
          parts_cost?: number | null
          status?: Database["public"]["Enums"]["budget_status"] | null
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow: {
        Row: {
          accounts_payable_id: string | null
          accounts_receivable_id: string | null
          amount: number
          bank_account_id: string | null
          category_id: string | null
          created_at: string | null
          description: string
          id: string
          notes: string | null
          order_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          reconciled: boolean | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          accounts_payable_id?: string | null
          accounts_receivable_id?: string | null
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reconciled?: boolean | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          accounts_payable_id?: string | null
          accounts_receivable_id?: string | null
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reconciled?: boolean | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_accounts_payable_id_fkey"
            columns: ["accounts_payable_id"]
            isOneToOne: false
            referencedRelation: "accounts_payable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flow_accounts_receivable_id_fkey"
            columns: ["accounts_receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flow_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flow_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flow_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_projection: {
        Row: {
          actual_balance: number | null
          actual_expenses: number | null
          actual_income: number | null
          created_at: string | null
          id: string
          notes: string | null
          projected_balance: number | null
          projected_expenses: number | null
          projected_income: number | null
          projection_date: string
          updated_at: string | null
        }
        Insert: {
          actual_balance?: number | null
          actual_expenses?: number | null
          actual_income?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          projected_balance?: number | null
          projected_expenses?: number | null
          projected_income?: number | null
          projection_date: string
          updated_at?: string | null
        }
        Update: {
          actual_balance?: number | null
          actual_expenses?: number | null
          actual_income?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          projected_balance?: number | null
          projected_expenses?: number | null
          projected_income?: number | null
          projection_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      commission_calculations: {
        Row: {
          approved_by: string | null
          base_sales: number | null
          bonus: number | null
          calculated_commission: number | null
          commission_rate: number | null
          created_at: string
          deductions: number | null
          employee_id: string
          final_commission: number | null
          id: string
          org_id: string | null
          paid_at: string | null
          period_month: number
          period_year: number
          status: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          base_sales?: number | null
          bonus?: number | null
          calculated_commission?: number | null
          commission_rate?: number | null
          created_at?: string
          deductions?: number | null
          employee_id: string
          final_commission?: number | null
          id?: string
          org_id?: string | null
          paid_at?: string | null
          period_month: number
          period_year: number
          status?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          base_sales?: number | null
          bonus?: number | null
          calculated_commission?: number | null
          commission_rate?: number | null
          created_at?: string
          deductions?: number | null
          employee_id?: string
          final_commission?: number | null
          id?: string
          org_id?: string | null
          paid_at?: string | null
          period_month?: number
          period_year?: number
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_calculations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_fiscal_settings: {
        Row: {
          cnpj: string | null
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          municipality_code: string | null
          org_id: string | null
          org_name: string
          regime_id: string
          state: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          municipality_code?: string | null
          org_id?: string | null
          org_name: string
          regime_id: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          municipality_code?: string | null
          org_id?: string | null
          org_name?: string
          regime_id?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_fiscal_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_fiscal_settings_regime_id_fkey"
            columns: ["regime_id"]
            isOneToOne: false
            referencedRelation: "tax_regimes"
            referencedColumns: ["id"]
          },
        ]
      }
      consultants: {
        Row: {
          commission_rate: number | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          document: string
          email: string | null
          id: string
          name: string
          org_id: string
          phone: string
          type: Database["public"]["Enums"]["customer_type"]
          updated_at: string
          workshop_cnpj: string | null
          workshop_contact: string | null
          workshop_name: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          document: string
          email?: string | null
          id?: string
          name: string
          org_id: string
          phone: string
          type: Database["public"]["Enums"]["customer_type"]
          updated_at?: string
          workshop_cnpj?: string | null
          workshop_contact?: string | null
          workshop_name?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          document?: string
          email?: string | null
          id?: string
          name?: string
          org_id?: string
          phone?: string
          type?: Database["public"]["Enums"]["customer_type"]
          updated_at?: string
          workshop_cnpj?: string | null
          workshop_contact?: string | null
          workshop_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_preferences: {
        Row: {
          created_at: string
          id: string
          is_global: boolean
          org_id: string | null
          preference_key: string
          preference_type: string
          preference_value: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_global?: boolean
          org_id?: string | null
          preference_key: string
          preference_type: string
          preference_value?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_global?: boolean
          org_id?: string | null
          preference_key?: string
          preference_type?: string
          preference_value?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      detailed_budgets: {
        Row: {
          budget_number: string | null
          component: Database["public"]["Enums"]["engine_component"]
          created_at: string | null
          created_by: string | null
          diagnostic_response_id: string | null
          discount: number | null
          estimated_delivery_days: number | null
          id: string
          labor_hours: number | null
          labor_rate: number | null
          labor_total: number | null
          order_id: string | null
          org_id: string | null
          parts: Json
          parts_total: number | null
          services: Json
          status: string | null
          tax_amount: number | null
          tax_percentage: number | null
          total_amount: number | null
          updated_at: string | null
          warranty_months: number | null
        }
        Insert: {
          budget_number?: string | null
          component: Database["public"]["Enums"]["engine_component"]
          created_at?: string | null
          created_by?: string | null
          diagnostic_response_id?: string | null
          discount?: number | null
          estimated_delivery_days?: number | null
          id?: string
          labor_hours?: number | null
          labor_rate?: number | null
          labor_total?: number | null
          order_id?: string | null
          org_id?: string | null
          parts?: Json
          parts_total?: number | null
          services?: Json
          status?: string | null
          tax_amount?: number | null
          tax_percentage?: number | null
          total_amount?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Update: {
          budget_number?: string | null
          component?: Database["public"]["Enums"]["engine_component"]
          created_at?: string | null
          created_by?: string | null
          diagnostic_response_id?: string | null
          discount?: number | null
          estimated_delivery_days?: number | null
          id?: string
          labor_hours?: number | null
          labor_rate?: number | null
          labor_total?: number | null
          order_id?: string | null
          org_id?: string | null
          parts?: Json
          parts_total?: number | null
          services?: Json
          status?: string | null
          tax_amount?: number | null
          tax_percentage?: number | null
          total_amount?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detailed_budgets_diagnostic_response_id_fkey"
            columns: ["diagnostic_response_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_checklist_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detailed_budgets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detailed_budgets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_checklist_items: {
        Row: {
          checklist_id: string | null
          display_order: number | null
          expected_values: Json | null
          help_text: string | null
          id: string
          is_required: boolean | null
          item_description: string | null
          item_name: string
          item_options: Json | null
          item_type: string | null
          triggers_service: Json | null
        }
        Insert: {
          checklist_id?: string | null
          display_order?: number | null
          expected_values?: Json | null
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          item_description?: string | null
          item_name: string
          item_options?: Json | null
          item_type?: string | null
          triggers_service?: Json | null
        }
        Update: {
          checklist_id?: string | null
          display_order?: number | null
          expected_values?: Json | null
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          item_description?: string | null
          item_name?: string
          item_options?: Json | null
          item_type?: string | null
          triggers_service?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_checklist_responses: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          checklist_id: string | null
          component: Database["public"]["Enums"]["engine_component"]
          diagnosed_at: string | null
          diagnosed_by: string | null
          generated_services: Json | null
          id: string
          order_id: string | null
          org_id: string | null
          photos: Json | null
          responses: Json
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          checklist_id?: string | null
          component: Database["public"]["Enums"]["engine_component"]
          diagnosed_at?: string | null
          diagnosed_by?: string | null
          generated_services?: Json | null
          id?: string
          order_id?: string | null
          org_id?: string | null
          photos?: Json | null
          responses?: Json
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          checklist_id?: string | null
          component?: Database["public"]["Enums"]["engine_component"]
          diagnosed_at?: string | null
          diagnosed_by?: string | null
          generated_services?: Json | null
          id?: string
          order_id?: string | null
          org_id?: string | null
          photos?: Json | null
          responses?: Json
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_checklist_responses_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_checklist_responses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_checklist_responses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_checklists: {
        Row: {
          component: Database["public"]["Enums"]["engine_component"]
          created_at: string | null
          created_by: string | null
          description: string | null
          engine_type_id: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          component: Database["public"]["Enums"]["engine_component"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          engine_type_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          component?: Database["public"]["Enums"]["engine_component"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          engine_type_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_checklists_engine_type_id_fkey"
            columns: ["engine_type_id"]
            isOneToOne: false
            referencedRelation: "engine_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_checklists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_time_tracking: {
        Row: {
          approved_by: string | null
          break_duration: number | null
          clock_in: string | null
          clock_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          org_id: string | null
          overtime_hours: number | null
          status: string | null
          total_hours: number | null
        }
        Insert: {
          approved_by?: string | null
          break_duration?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          org_id?: string | null
          overtime_hours?: number | null
          status?: string | null
          total_hours?: number | null
        }
        Update: {
          approved_by?: string | null
          break_duration?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          overtime_hours?: number | null
          status?: string | null
          total_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_time_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_time_tracking_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          commission_rate: number | null
          cpf: string | null
          created_at: string
          department: string | null
          email: string | null
          employee_number: string
          full_name: string
          hire_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          org_id: string | null
          phone: string | null
          position: string
          salary: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          commission_rate?: number | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number: string
          full_name: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          phone?: string | null
          position: string
          salary?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          commission_rate?: number | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number?: string
          full_name?: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          phone?: string | null
          position?: string
          salary?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_types: {
        Row: {
          category: string
          created_at: string | null
          default_warranty_months: number | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string | null
          required_components:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          special_requirements: Json | null
          technical_standards: Json | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          default_warranty_months?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id?: string | null
          required_components?:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          special_requirements?: Json | null
          technical_standards?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          default_warranty_months?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string | null
          required_components?:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          special_requirements?: Json | null
          technical_standards?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engine_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      engines: {
        Row: {
          assembly_state: string | null
          brand: string
          created_at: string
          engine_type_id: string | null
          fuel_type: string
          has_block: boolean | null
          has_connecting_rod: boolean | null
          has_crankshaft: boolean | null
          has_head: boolean | null
          has_piston: boolean | null
          id: string
          is_complete: boolean | null
          model: string
          reception_form_data: Json | null
          serial_number: string | null
          turns_manually: boolean | null
          type: string
          updated_at: string
        }
        Insert: {
          assembly_state?: string | null
          brand: string
          created_at?: string
          engine_type_id?: string | null
          fuel_type: string
          has_block?: boolean | null
          has_connecting_rod?: boolean | null
          has_crankshaft?: boolean | null
          has_head?: boolean | null
          has_piston?: boolean | null
          id?: string
          is_complete?: boolean | null
          model: string
          reception_form_data?: Json | null
          serial_number?: string | null
          turns_manually?: boolean | null
          type: string
          updated_at?: string
        }
        Update: {
          assembly_state?: string | null
          brand?: string
          created_at?: string
          engine_type_id?: string | null
          fuel_type?: string
          has_block?: boolean | null
          has_connecting_rod?: boolean | null
          has_crankshaft?: boolean | null
          has_head?: boolean | null
          has_piston?: boolean | null
          id?: string
          is_complete?: boolean | null
          model?: string
          reception_form_data?: Json | null
          serial_number?: string | null
          turns_manually?: boolean | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engines_engine_type_id_fkey"
            columns: ["engine_type_id"]
            isOneToOne: false
            referencedRelation: "engine_types"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_form_fields: {
        Row: {
          default_value: string | null
          display_order: number | null
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string
          help_text: string | null
          id: string
          is_required: boolean | null
          template_id: string | null
          validation_rules: Json | null
        }
        Insert: {
          default_value?: string | null
          display_order?: number | null
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          template_id?: string | null
          validation_rules?: Json | null
        }
        Update: {
          default_value?: string | null
          display_order?: number | null
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          template_id?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "entry_form_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "entry_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_form_submissions: {
        Row: {
          form_data: Json
          generated_services: Json | null
          id: string
          order_id: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          template_id: string | null
        }
        Insert: {
          form_data?: Json
          generated_services?: Json | null
          id?: string
          order_id?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          template_id?: string | null
        }
        Update: {
          form_data?: Json
          generated_services?: Json | null
          id?: string
          order_id?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entry_form_submissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_form_submissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "entry_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_form_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          engine_type_id: string | null
          id: string
          is_active: boolean | null
          layout_type: string | null
          name: string
          org_id: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          engine_type_id?: string | null
          id?: string
          is_active?: boolean | null
          layout_type?: string | null
          name: string
          org_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          engine_type_id?: string | null
          id?: string
          is_active?: boolean | null
          layout_type?: string | null
          name?: string
          org_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entry_form_templates_engine_type_id_fkey"
            columns: ["engine_type_id"]
            isOneToOne: false
            referencedRelation: "engine_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_form_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      environment_reservations: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          component: Database["public"]["Enums"]["engine_component"]
          environment_id: string | null
          id: string
          notes: string | null
          order_id: string | null
          org_id: string | null
          reservation_status: string | null
          reserved_by: string | null
          reserved_from: string
          reserved_until: string
          workflow_step_key: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          component: Database["public"]["Enums"]["engine_component"]
          environment_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          org_id?: string | null
          reservation_status?: string | null
          reserved_by?: string | null
          reserved_from: string
          reserved_until: string
          workflow_step_key: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          component?: Database["public"]["Enums"]["engine_component"]
          environment_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          org_id?: string | null
          reservation_status?: string | null
          reserved_by?: string | null
          reserved_from?: string
          reserved_until?: string
          workflow_step_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "environment_reservations_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "special_environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environment_reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environment_reservations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string | null
        }
        Relationships: []
      }
      fiscal_audit_log: {
        Row: {
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          operation: string
          org_id: string
          record_id: string
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          org_id: string
          record_id: string
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          org_id?: string
          record_id?: string
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fiscal_classifications: {
        Row: {
          cest: string | null
          created_at: string
          description: string
          id: string
          ncm_code: string | null
          org_id: string | null
          service_code: string | null
          type: Database["public"]["Enums"]["classification_type"]
          updated_at: string
        }
        Insert: {
          cest?: string | null
          created_at?: string
          description: string
          id?: string
          ncm_code?: string | null
          org_id?: string | null
          service_code?: string | null
          type: Database["public"]["Enums"]["classification_type"]
          updated_at?: string
        }
        Update: {
          cest?: string | null
          created_at?: string
          description?: string
          id?: string
          ncm_code?: string | null
          org_id?: string | null
          service_code?: string | null
          type?: Database["public"]["Enums"]["classification_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_classifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_config: {
        Row: {
          badge_color: string
          created_at: string | null
          id: string
          jurisdiction: string
          org_id: string | null
          text_color: string
          updated_at: string | null
        }
        Insert: {
          badge_color: string
          created_at?: string | null
          id?: string
          jurisdiction: string
          org_id?: string | null
          text_color: string
          updated_at?: string | null
        }
        Update: {
          badge_color?: string
          created_at?: string | null
          id?: string
          jurisdiction?: string
          org_id?: string | null
          text_color?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_targets: {
        Row: {
          created_at: string
          id: string
          kpi_id: string
          period_type: string
          target_value: number
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kpi_id: string
          period_type: string
          target_value: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kpi_id?: string
          period_type?: string
          target_value?: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_targets_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          calculation_formula: string
          code: string
          color: string
          created_at: string
          description: string | null
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
          org_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          calculation_formula: string
          code: string
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          org_id?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          calculation_formula?: string
          code?: string
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_dre: {
        Row: {
          created_at: string | null
          direct_costs: number | null
          gross_profit: number | null
          id: string
          month: number
          net_profit: number | null
          operational_expenses: number | null
          org_id: string | null
          profit_margin: number | null
          total_revenue: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          direct_costs?: number | null
          gross_profit?: number | null
          id?: string
          month: number
          net_profit?: number | null
          operational_expenses?: number | null
          org_id?: string | null
          profit_margin?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          direct_costs?: number | null
          gross_profit?: number | null
          id?: string
          month?: number
          net_profit?: number | null
          operational_expenses?: number | null
          org_id?: string | null
          profit_margin?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      notification_types: {
        Row: {
          code: string
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_global: boolean
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type_id: string
          org_id: string
          severity: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_global?: boolean
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type_id: string
          org_id: string
          severity?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_global?: boolean
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type_id?: string
          org_id?: string
          severity?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_notification_type_id_fkey"
            columns: ["notification_type_id"]
            isOneToOne: false
            referencedRelation: "notification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      obligation_files: {
        Row: {
          error_message: string | null
          file_name: string
          file_path: string
          file_type: string
          generated_at: string
          generated_by: string | null
          hash_sha256: string | null
          id: string
          mime_type: string | null
          obligation_id: string
          size_bytes: number | null
          status: string
        }
        Insert: {
          error_message?: string | null
          file_name: string
          file_path: string
          file_type: string
          generated_at?: string
          generated_by?: string | null
          hash_sha256?: string | null
          id?: string
          mime_type?: string | null
          obligation_id: string
          size_bytes?: number | null
          status?: string
        }
        Update: {
          error_message?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          generated_at?: string
          generated_by?: string | null
          hash_sha256?: string | null
          id?: string
          mime_type?: string | null
          obligation_id?: string
          size_bytes?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_obligation_files_obligation"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obligation_files_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      obligation_kinds: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obligation_kinds_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      obligations: {
        Row: {
          created_at: string
          created_by: string | null
          finished_at: string | null
          generated_file_path: string | null
          id: string
          message: string | null
          obligation_kind_id: string
          org_id: string | null
          period_month: number
          period_year: number
          protocol: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["filing_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          finished_at?: string | null
          generated_file_path?: string | null
          id?: string
          message?: string | null
          obligation_kind_id: string
          org_id?: string | null
          period_month: number
          period_year: number
          protocol?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["filing_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          finished_at?: string | null
          generated_file_path?: string | null
          id?: string
          message?: string | null
          obligation_kind_id?: string
          org_id?: string | null
          period_month?: number
          period_year?: number
          protocol?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["filing_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_obligations_obligation_kind"
            columns: ["obligation_kind_id"]
            isOneToOne: false
            referencedRelation: "obligation_kinds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obligations_obligation_kind_id_fkey"
            columns: ["obligation_kind_id"]
            isOneToOne: false
            referencedRelation: "obligation_kinds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obligations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_materials: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          org_id: string | null
          part_code: string | null
          part_id: string | null
          part_name: string
          quantity: number
          total_cost: number | null
          unit_cost: number | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          org_id?: string | null
          part_code?: string | null
          part_id?: string | null
          part_name: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          org_id?: string | null
          part_code?: string | null
          part_id?: string | null
          part_name?: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_materials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_materials_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      order_photos: {
        Row: {
          component: Database["public"]["Enums"]["engine_component"] | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          id: string
          order_id: string
          photo_type: string
          uploaded_by: string | null
          workflow_step: Database["public"]["Enums"]["workflow_status"] | null
        }
        Insert: {
          component?: Database["public"]["Enums"]["engine_component"] | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          id?: string
          order_id: string
          photo_type: string
          uploaded_by?: string | null
          workflow_step?: Database["public"]["Enums"]["workflow_status"] | null
        }
        Update: {
          component?: Database["public"]["Enums"]["engine_component"] | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          id?: string
          order_id?: string
          photo_type?: string
          uploaded_by?: string | null
          workflow_step?: Database["public"]["Enums"]["workflow_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "order_photos_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          order_id: string
          org_id: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          order_id: string
          org_id?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          order_id?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_warranties: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          order_id: string
          org_id: string | null
          start_date: string
          terms: string | null
          updated_at: string
          warranty_type: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          order_id: string
          org_id?: string | null
          start_date: string
          terms?: string | null
          updated_at?: string
          warranty_type: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          order_id?: string
          org_id?: string | null
          start_date?: string
          terms?: string | null
          updated_at?: string
          warranty_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_warranties_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_warranties_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_workflow: {
        Row: {
          actual_hours: number | null
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          completed_at: string | null
          component: Database["public"]["Enums"]["engine_component"]
          created_at: string
          estimated_completion: string | null
          id: string
          notes: string | null
          order_id: string
          requires_approval: boolean | null
          started_at: string | null
          status: Database["public"]["Enums"]["workflow_status"] | null
          updated_at: string
          workflow_step_id: string | null
        }
        Insert: {
          actual_hours?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          component: Database["public"]["Enums"]["engine_component"]
          created_at?: string
          estimated_completion?: string | null
          id?: string
          notes?: string | null
          order_id: string
          requires_approval?: boolean | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"] | null
          updated_at?: string
          workflow_step_id?: string | null
        }
        Update: {
          actual_hours?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          component?: Database["public"]["Enums"]["engine_component"]
          created_at?: string
          estimated_completion?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          requires_approval?: boolean | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"] | null
          updated_at?: string
          workflow_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_workflow_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_workflow_workflow_step_id_fkey"
            columns: ["workflow_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery: string | null
          collection_date: string
          collection_location: string
          collection_time: string
          consultant_id: string
          created_at: string
          customer_id: string
          driver_name: string
          engine_id: string
          estimated_delivery: string | null
          failure_reason: string | null
          final_observations: string | null
          id: string
          initial_observations: string | null
          order_number: string
          org_id: string
          priority: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          updated_at: string
          warranty_months: number | null
        }
        Insert: {
          actual_delivery?: string | null
          collection_date: string
          collection_location: string
          collection_time: string
          consultant_id: string
          created_at?: string
          customer_id: string
          driver_name: string
          engine_id: string
          estimated_delivery?: string | null
          failure_reason?: string | null
          final_observations?: string | null
          id?: string
          initial_observations?: string | null
          order_number: string
          org_id: string
          priority?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string
          warranty_months?: number | null
        }
        Update: {
          actual_delivery?: string | null
          collection_date?: string
          collection_location?: string
          collection_time?: string
          consultant_id?: string
          created_at?: string
          customer_id?: string
          driver_name?: string
          engine_id?: string
          estimated_delivery?: string | null
          failure_reason?: string | null
          final_observations?: string | null
          id?: string
          initial_observations?: string | null
          order_number?: string
          org_id?: string
          priority?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_engine_id_fkey"
            columns: ["engine_id"]
            isOneToOne: false
            referencedRelation: "engines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      parts_inventory: {
        Row: {
          applied_at: string | null
          component: Database["public"]["Enums"]["engine_component"] | null
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          org_id: string | null
          part_code: string | null
          part_name: string
          quantity: number
          separated_at: string | null
          status: string | null
          supplier: string | null
          unit_cost: number | null
        }
        Insert: {
          applied_at?: string | null
          component?: Database["public"]["Enums"]["engine_component"] | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          org_id?: string | null
          part_code?: string | null
          part_name: string
          quantity?: number
          separated_at?: string | null
          status?: string | null
          supplier?: string | null
          unit_cost?: number | null
        }
        Update: {
          applied_at?: string | null
          component?: Database["public"]["Enums"]["engine_component"] | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          org_id?: string | null
          part_code?: string | null
          part_name?: string
          quantity?: number
          separated_at?: string | null
          status?: string | null
          supplier?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_inventory_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_price_table: {
        Row: {
          compatible_components:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          cost_price: number | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          margin_percentage: number | null
          org_id: string | null
          part_code: string
          part_description: string | null
          part_name: string
          supplier: string | null
          unit_price: number
        }
        Insert: {
          compatible_components?:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          cost_price?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          margin_percentage?: number | null
          org_id?: string | null
          part_code: string
          part_description?: string | null
          part_name: string
          supplier?: string | null
          unit_price: number
        }
        Update: {
          compatible_components?:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          cost_price?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          margin_percentage?: number | null
          org_id?: string | null
          part_code?: string
          part_description?: string | null
          part_name?: string
          supplier?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "parts_price_table_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_reservations: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          budget_id: string | null
          id: string
          notes: string | null
          order_id: string | null
          org_id: string | null
          part_code: string
          part_id: string | null
          part_name: string
          quantity_applied: number | null
          quantity_reserved: number
          quantity_separated: number | null
          reservation_status: string | null
          reserved_at: string | null
          reserved_by: string | null
          separated_at: string | null
          separated_by: string | null
          total_reserved_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          budget_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          org_id?: string | null
          part_code: string
          part_id?: string | null
          part_name: string
          quantity_applied?: number | null
          quantity_reserved?: number
          quantity_separated?: number | null
          reservation_status?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          separated_at?: string | null
          separated_by?: string | null
          total_reserved_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          budget_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          org_id?: string | null
          part_code?: string
          part_id?: string | null
          part_name?: string
          quantity_applied?: number | null
          quantity_reserved?: number
          quantity_separated?: number | null
          reservation_status?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          separated_at?: string | null
          separated_by?: string | null
          total_reserved_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_reservations_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "detailed_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_reservations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_reservations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_stock_config: {
        Row: {
          abc_classification: string | null
          auto_reorder_enabled: boolean | null
          economic_order_quantity: number | null
          id: string
          is_critical: boolean | null
          last_updated: string | null
          lead_time_days: number | null
          maximum_stock: number | null
          minimum_stock: number | null
          org_id: string | null
          part_code: string
          part_name: string
          preferred_supplier_id: string | null
          reorder_point: number | null
          rotation_frequency: string | null
          safety_stock: number | null
          updated_by: string | null
        }
        Insert: {
          abc_classification?: string | null
          auto_reorder_enabled?: boolean | null
          economic_order_quantity?: number | null
          id?: string
          is_critical?: boolean | null
          last_updated?: string | null
          lead_time_days?: number | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          org_id?: string | null
          part_code: string
          part_name: string
          preferred_supplier_id?: string | null
          reorder_point?: number | null
          rotation_frequency?: string | null
          safety_stock?: number | null
          updated_by?: string | null
        }
        Update: {
          abc_classification?: string | null
          auto_reorder_enabled?: boolean | null
          economic_order_quantity?: number | null
          id?: string
          is_critical?: boolean | null
          last_updated?: string | null
          lead_time_days?: number | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          org_id?: string | null
          part_code?: string
          part_name?: string
          preferred_supplier_id?: string | null
          reorder_point?: number | null
          rotation_frequency?: string | null
          safety_stock?: number | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_stock_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_stock_config_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          fee_fixed: number | null
          fee_percentage: number | null
          id: string
          is_active: boolean | null
          method: Database["public"]["Enums"]["payment_method"]
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fee_fixed?: number | null
          fee_percentage?: number | null
          id?: string
          is_active?: boolean | null
          method: Database["public"]["Enums"]["payment_method"]
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fee_fixed?: number | null
          fee_percentage?: number | null
          id?: string
          is_active?: boolean | null
          method?: Database["public"]["Enums"]["payment_method"]
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      performance_reviews: {
        Row: {
          achievements: string | null
          comments: string | null
          created_at: string
          employee_id: string
          goals: string | null
          id: string
          improvement_areas: string | null
          org_id: string | null
          overall_rating: number | null
          productivity_score: number | null
          punctuality_score: number | null
          quality_score: number | null
          review_period_end: string
          review_period_start: string
          reviewer_id: string
          status: string | null
          teamwork_score: number | null
          updated_at: string
        }
        Insert: {
          achievements?: string | null
          comments?: string | null
          created_at?: string
          employee_id: string
          goals?: string | null
          id?: string
          improvement_areas?: string | null
          org_id?: string | null
          overall_rating?: number | null
          productivity_score?: number | null
          punctuality_score?: number | null
          quality_score?: number | null
          review_period_end: string
          review_period_start: string
          reviewer_id: string
          status?: string | null
          teamwork_score?: number | null
          updated_at?: string
        }
        Update: {
          achievements?: string | null
          comments?: string | null
          created_at?: string
          employee_id?: string
          goals?: string | null
          id?: string
          improvement_areas?: string | null
          org_id?: string | null
          overall_rating?: number | null
          productivity_score?: number | null
          punctuality_score?: number | null
          quality_score?: number | null
          review_period_end?: string
          review_period_start?: string
          reviewer_id?: string
          status?: string | null
          teamwork_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      production_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          order_id: string | null
          org_id: string | null
          schedule_id: string | null
          severity: string | null
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          order_id?: string | null
          org_id?: string | null
          schedule_id?: string | null
          severity?: string | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string | null
          org_id?: string | null
          schedule_id?: string | null
          severity?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_alerts_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "production_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      production_schedules: {
        Row: {
          actual_end_date: string | null
          actual_hours: number | null
          actual_start_date: string | null
          assigned_to: string | null
          component: Database["public"]["Enums"]["engine_component"]
          created_at: string
          estimated_hours: number | null
          id: string
          notes: string | null
          order_id: string
          org_id: string
          planned_end_date: string
          planned_start_date: string
          priority: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_hours?: number | null
          actual_start_date?: string | null
          assigned_to?: string | null
          component: Database["public"]["Enums"]["engine_component"]
          created_at?: string
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          order_id: string
          org_id: string
          planned_end_date: string
          planned_start_date: string
          priority?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_hours?: number | null
          actual_start_date?: string | null
          assigned_to?: string | null
          component?: Database["public"]["Enums"]["engine_component"]
          created_at?: string
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          org_id?: string
          planned_end_date?: string
          planned_start_date?: string
          priority?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_schedules_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_page_permissions: {
        Row: {
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          page_id: string | null
          profile_id: string | null
        }
        Insert: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          page_id?: string | null
          profile_id?: string | null
        }
        Update: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          page_id?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_page_permissions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "system_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_page_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_efficiency_reports: {
        Row: {
          average_delivery_days: number | null
          cost_savings_planned: number | null
          efficiency_score: number | null
          generated_at: string | null
          generated_by: string | null
          id: string
          org_id: string | null
          planned_purchase_percentage: number | null
          report_period_end: string
          report_period_start: string
          stock_out_incidents: number | null
          supplier_performance_average: number | null
          total_cost_emergency: number | null
          total_cost_planned: number | null
          total_purchases_emergency: number | null
          total_purchases_planned: number | null
        }
        Insert: {
          average_delivery_days?: number | null
          cost_savings_planned?: number | null
          efficiency_score?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          org_id?: string | null
          planned_purchase_percentage?: number | null
          report_period_end: string
          report_period_start: string
          stock_out_incidents?: number | null
          supplier_performance_average?: number | null
          total_cost_emergency?: number | null
          total_cost_planned?: number | null
          total_purchases_emergency?: number | null
          total_purchases_planned?: number | null
        }
        Update: {
          average_delivery_days?: number | null
          cost_savings_planned?: number | null
          efficiency_score?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          org_id?: string | null
          planned_purchase_percentage?: number | null
          report_period_end?: string
          report_period_start?: string
          stock_out_incidents?: number | null
          supplier_performance_average?: number | null
          total_cost_emergency?: number | null
          total_cost_planned?: number | null
          total_purchases_emergency?: number | null
          total_purchases_planned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_efficiency_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_needs: {
        Row: {
          available_quantity: number | null
          created_at: string | null
          delivery_urgency_date: string | null
          estimated_cost: number | null
          id: string
          need_type: string | null
          org_id: string | null
          part_code: string
          part_name: string
          priority_level: string | null
          related_orders: Json | null
          required_quantity: number
          shortage_quantity: number | null
          status: string | null
          suggested_suppliers: Json | null
          updated_at: string | null
        }
        Insert: {
          available_quantity?: number | null
          created_at?: string | null
          delivery_urgency_date?: string | null
          estimated_cost?: number | null
          id?: string
          need_type?: string | null
          org_id?: string | null
          part_code: string
          part_name: string
          priority_level?: string | null
          related_orders?: Json | null
          required_quantity: number
          shortage_quantity?: number | null
          status?: string | null
          suggested_suppliers?: Json | null
          updated_at?: string | null
        }
        Update: {
          available_quantity?: number | null
          created_at?: string | null
          delivery_urgency_date?: string | null
          estimated_cost?: number | null
          id?: string
          need_type?: string | null
          org_id?: string | null
          part_code?: string
          part_name?: string
          priority_level?: string | null
          related_orders?: Json | null
          required_quantity?: number
          shortage_quantity?: number | null
          status?: string | null
          suggested_suppliers?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_needs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          item_name: string
          po_id: string
          quantity: number
          received_quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          item_name: string
          po_id: string
          quantity?: number
          received_quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          item_name?: string
          po_id?: string
          quantity?: number
          received_quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery: string | null
          created_at: string
          created_by: string | null
          expected_delivery: string | null
          id: string
          notes: string | null
          order_date: string | null
          org_id: string | null
          po_number: string
          requisition_id: string | null
          status: string | null
          supplier_id: string
          terms: string | null
          total_value: number | null
          updated_at: string
        }
        Insert: {
          actual_delivery?: string | null
          created_at?: string
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          org_id?: string | null
          po_number: string
          requisition_id?: string | null
          status?: string | null
          supplier_id: string
          terms?: string | null
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          actual_delivery?: string | null
          created_at?: string
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          org_id?: string | null
          po_number?: string
          requisition_id?: string | null
          status?: string | null
          supplier_id?: string
          terms?: string | null
          total_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisition_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          item_name: string
          notes: string | null
          quantity: number
          requisition_id: string
          total_price: number | null
          unit_price: number | null
          urgency_date: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          item_name: string
          notes?: string | null
          quantity?: number
          requisition_id: string
          total_price?: number | null
          unit_price?: number | null
          urgency_date?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          quantity?: number
          requisition_id?: string
          total_price?: number | null
          unit_price?: number | null
          urgency_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisition_items_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          department: string | null
          id: string
          justification: string | null
          org_id: string | null
          priority: string | null
          requested_by: string | null
          requisition_number: string
          status: string | null
          total_estimated_value: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          department?: string | null
          id?: string
          justification?: string | null
          org_id?: string | null
          priority?: string | null
          requested_by?: string | null
          requisition_number: string
          status?: string | null
          total_estimated_value?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          department?: string | null
          id?: string
          justification?: string | null
          org_id?: string | null
          priority?: string | null
          requested_by?: string | null
          requisition_number?: string
          status?: string | null
          total_estimated_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisitions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_history: {
        Row: {
          component: Database["public"]["Enums"]["engine_component"]
          event_data: Json | null
          event_description: string
          id: string
          order_id: string | null
          org_id: string | null
          quality_event_type: string
          recorded_at: string | null
          recorded_by: string | null
          related_checklist_id: string | null
          related_report_id: string | null
          related_response_id: string | null
          severity_level: string | null
          step_key: string
        }
        Insert: {
          component: Database["public"]["Enums"]["engine_component"]
          event_data?: Json | null
          event_description: string
          id?: string
          order_id?: string | null
          org_id?: string | null
          quality_event_type: string
          recorded_at?: string | null
          recorded_by?: string | null
          related_checklist_id?: string | null
          related_report_id?: string | null
          related_response_id?: string | null
          severity_level?: string | null
          step_key: string
        }
        Update: {
          component?: Database["public"]["Enums"]["engine_component"]
          event_data?: Json | null
          event_description?: string
          id?: string
          order_id?: string | null
          org_id?: string | null
          quality_event_type?: string
          recorded_at?: string | null
          recorded_by?: string | null
          related_checklist_id?: string | null
          related_report_id?: string | null
          related_response_id?: string | null
          severity_level?: string | null
          step_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_history_related_checklist_id_fkey"
            columns: ["related_checklist_id"]
            isOneToOne: false
            referencedRelation: "workflow_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_history_related_report_id_fkey"
            columns: ["related_report_id"]
            isOneToOne: false
            referencedRelation: "technical_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_history_related_response_id_fkey"
            columns: ["related_response_id"]
            isOneToOne: false
            referencedRelation: "workflow_checklist_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_actions: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          href: string
          icon: string
          id: string
          is_active: boolean
          is_featured: boolean
          org_id: string | null
          permissions: Json | null
          title: string
          updated_at: string
          variant: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          href: string
          icon?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          org_id?: string | null
          permissions?: Json | null
          title: string
          updated_at?: string
          variant?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          href?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          org_id?: string | null
          permissions?: Json | null
          title?: string
          updated_at?: string
          variant?: string
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          item_name: string
          quantity: number
          quotation_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          item_name: string
          quantity?: number
          quotation_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          item_name?: string
          quantity?: number
          quotation_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string
          delivery_time: number | null
          id: string
          org_id: string | null
          quote_date: string | null
          quote_number: string | null
          requisition_id: string
          status: string | null
          supplier_id: string
          terms: string | null
          total_value: number | null
          updated_at: string
          validity_date: string | null
        }
        Insert: {
          created_at?: string
          delivery_time?: number | null
          id?: string
          org_id?: string | null
          quote_date?: string | null
          quote_number?: string | null
          requisition_id: string
          status?: string | null
          supplier_id: string
          terms?: string | null
          total_value?: number | null
          updated_at?: string
          validity_date?: string | null
        }
        Update: {
          created_at?: string
          delivery_time?: number | null
          id?: string
          org_id?: string | null
          quote_date?: string | null
          quote_number?: string | null
          requisition_id?: string
          status?: string | null
          supplier_id?: string
          terms?: string | null
          total_value?: number | null
          updated_at?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      report_catalog: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          org_id: string | null
          parameters_schema: Json
          permissions: Json | null
          template_type: string
          updated_at: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          org_id?: string | null
          parameters_schema?: Json
          permissions?: Json | null
          template_type?: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string | null
          parameters_schema?: Json
          permissions?: Json | null
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          error_message: string | null
          file_name: string | null
          file_path: string | null
          file_type: string | null
          generated_at: string | null
          generated_by: string | null
          hash_sha256: string | null
          id: string
          org_id: string
          parameters: Json
          period_end: string | null
          period_start: string | null
          report_code: string
          size_bytes: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          generated_at?: string | null
          generated_by?: string | null
          hash_sha256?: string | null
          id?: string
          org_id: string
          parameters?: Json
          period_end?: string | null
          period_start?: string | null
          report_code: string
          size_bytes?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          generated_at?: string | null
          generated_by?: string | null
          hash_sha256?: string | null
          id?: string
          org_id?: string
          parameters?: Json
          period_end?: string | null
          period_start?: string | null
          report_code?: string
          size_bytes?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_capacity: {
        Row: {
          created_at: string
          daily_capacity_hours: number | null
          id: string
          is_active: boolean | null
          org_id: string | null
          resource_name: string
          resource_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_capacity_hours?: number | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          resource_name: string
          resource_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_capacity_hours?: number | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          resource_name?: string
          resource_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_capacity_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      search_sources: {
        Row: {
          created_at: string
          display_fields: Json
          id: string
          is_active: boolean
          org_id: string | null
          permissions: Json | null
          result_template: string | null
          search_fields: Json
          source_name: string
          source_type: string
          table_name: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          display_fields?: Json
          id?: string
          is_active?: boolean
          org_id?: string | null
          permissions?: Json | null
          result_template?: string | null
          search_fields?: Json
          source_name: string
          source_type: string
          table_name?: string | null
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          display_fields?: Json
          id?: string
          is_active?: boolean
          org_id?: string | null
          permissions?: Json | null
          result_template?: string | null
          search_fields?: Json
          source_name?: string
          source_type?: string
          table_name?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      service_price_table: {
        Row: {
          base_price: number
          component: Database["public"]["Enums"]["engine_component"]
          created_at: string | null
          difficulty_multiplier: number | null
          engine_type_id: string | null
          id: string
          is_active: boolean | null
          labor_hours: number | null
          org_id: string | null
          service_code: string
          service_description: string | null
          service_name: string
          unit_type: string | null
          updated_at: string | null
        }
        Insert: {
          base_price: number
          component: Database["public"]["Enums"]["engine_component"]
          created_at?: string | null
          difficulty_multiplier?: number | null
          engine_type_id?: string | null
          id?: string
          is_active?: boolean | null
          labor_hours?: number | null
          org_id?: string | null
          service_code: string
          service_description?: string | null
          service_name: string
          unit_type?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          component?: Database["public"]["Enums"]["engine_component"]
          created_at?: string | null
          difficulty_multiplier?: number | null
          engine_type_id?: string | null
          id?: string
          is_active?: boolean | null
          labor_hours?: number | null
          org_id?: string | null
          service_code?: string
          service_description?: string | null
          service_name?: string
          unit_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_price_table_engine_type_id_fkey"
            columns: ["engine_type_id"]
            isOneToOne: false
            referencedRelation: "engine_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_price_table_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      special_environments: {
        Row: {
          certification_required: boolean | null
          certification_valid_until: string | null
          cleanliness_class: string | null
          created_at: string | null
          current_status: string | null
          environment_name: string
          environment_type: string
          humidity_max: number | null
          humidity_min: number | null
          id: string
          is_active: boolean | null
          last_maintenance: string | null
          next_maintenance: string | null
          org_id: string | null
          requirements: Json
          temperature_max: number | null
          temperature_min: number | null
          updated_at: string | null
        }
        Insert: {
          certification_required?: boolean | null
          certification_valid_until?: string | null
          cleanliness_class?: string | null
          created_at?: string | null
          current_status?: string | null
          environment_name: string
          environment_type: string
          humidity_max?: number | null
          humidity_min?: number | null
          id?: string
          is_active?: boolean | null
          last_maintenance?: string | null
          next_maintenance?: string | null
          org_id?: string | null
          requirements?: Json
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string | null
        }
        Update: {
          certification_required?: boolean | null
          certification_valid_until?: string | null
          cleanliness_class?: string | null
          created_at?: string | null
          current_status?: string | null
          environment_name?: string
          environment_type?: string
          humidity_max?: number | null
          humidity_min?: number | null
          id?: string
          is_active?: boolean | null
          last_maintenance?: string | null
          next_maintenance?: string | null
          org_id?: string | null
          requirements?: Json
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_environments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      status_config: {
        Row: {
          approval_roles: Json | null
          automation_rules: Json | null
          badge_variant: string
          color: string | null
          component: Database["public"]["Enums"]["engine_component"] | null
          created_at: string
          display_order: number | null
          engine_type_id: string | null
          entity_type: string
          estimated_hours: number | null
          icon: string | null
          id: string
          is_active: boolean
          notification_config: Json | null
          org_id: string | null
          prerequisites: Json | null
          requires_approval: boolean | null
          sla_config: Json | null
          status_key: string
          status_label: string
          updated_at: string
          visual_config: Json | null
        }
        Insert: {
          approval_roles?: Json | null
          automation_rules?: Json | null
          badge_variant?: string
          color?: string | null
          component?: Database["public"]["Enums"]["engine_component"] | null
          created_at?: string
          display_order?: number | null
          engine_type_id?: string | null
          entity_type: string
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          notification_config?: Json | null
          org_id?: string | null
          prerequisites?: Json | null
          requires_approval?: boolean | null
          sla_config?: Json | null
          status_key: string
          status_label: string
          updated_at?: string
          visual_config?: Json | null
        }
        Update: {
          approval_roles?: Json | null
          automation_rules?: Json | null
          badge_variant?: string
          color?: string | null
          component?: Database["public"]["Enums"]["engine_component"] | null
          created_at?: string
          display_order?: number | null
          engine_type_id?: string | null
          entity_type?: string
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          notification_config?: Json | null
          org_id?: string | null
          prerequisites?: Json | null
          requires_approval?: boolean | null
          sla_config?: Json | null
          status_key?: string
          status_label?: string
          updated_at?: string
          visual_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "status_config_engine_type_id_fkey"
            columns: ["engine_type_id"]
            isOneToOne: false
            referencedRelation: "engine_types"
            referencedColumns: ["id"]
          },
        ]
      }
      status_prerequisites: {
        Row: {
          entity_type: string
          from_status_key: string
          id: string
          is_active: boolean
          to_status_key: string
          transition_type: Database["public"]["Enums"]["status_transition_type"]
        }
        Insert: {
          entity_type?: string
          from_status_key: string
          id?: string
          is_active?: boolean
          to_status_key: string
          transition_type?: Database["public"]["Enums"]["status_transition_type"]
        }
        Update: {
          entity_type?: string
          from_status_key?: string
          id?: string
          is_active?: boolean
          to_status_key?: string
          transition_type?: Database["public"]["Enums"]["status_transition_type"]
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_level: string | null
          alert_type: string
          created_at: string | null
          current_stock: number
          id: string
          is_active: boolean | null
          maximum_stock: number | null
          minimum_stock: number
          org_id: string | null
          part_code: string | null
          part_name: string
          resolved_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level?: string | null
          alert_type: string
          created_at?: string | null
          current_stock: number
          id?: string
          is_active?: boolean | null
          maximum_stock?: number | null
          minimum_stock: number
          org_id?: string | null
          part_code?: string | null
          part_name: string
          resolved_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level?: string | null
          alert_type?: string
          created_at?: string | null
          current_stock?: number
          id?: string
          is_active?: boolean | null
          maximum_stock?: number | null
          minimum_stock?: number
          org_id?: string | null
          part_code?: string | null
          part_name?: string
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_performance_history: {
        Row: {
          actual_delivery_date: string | null
          actual_price: number
          delivery_performance: number | null
          id: string
          notes: string | null
          ordered_price: number
          ordered_quantity: number
          org_id: string | null
          overall_score: number | null
          part_code: string
          price_variance_percentage: number | null
          promised_delivery_date: string
          purchase_order_id: string | null
          quality_rating: number | null
          quantity_fulfillment_percentage: number | null
          received_quantity: number
          recorded_at: string | null
          supplier_id: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          actual_price: number
          delivery_performance?: number | null
          id?: string
          notes?: string | null
          ordered_price: number
          ordered_quantity: number
          org_id?: string | null
          overall_score?: number | null
          part_code: string
          price_variance_percentage?: number | null
          promised_delivery_date: string
          purchase_order_id?: string | null
          quality_rating?: number | null
          quantity_fulfillment_percentage?: number | null
          received_quantity: number
          recorded_at?: string | null
          supplier_id?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          actual_price?: number
          delivery_performance?: number | null
          id?: string
          notes?: string | null
          ordered_price?: number
          ordered_quantity?: number
          org_id?: string | null
          overall_score?: number | null
          part_code?: string
          price_variance_percentage?: number | null
          promised_delivery_date?: string
          purchase_order_id?: string | null
          quality_rating?: number | null
          quantity_fulfillment_percentage?: number | null
          received_quantity?: number
          recorded_at?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_performance_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_performance_history_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_suggestions: {
        Row: {
          average_delivery_days: number | null
          cost_benefit_score: number | null
          created_at: string | null
          delivery_days: number | null
          id: string
          is_preferred: boolean | null
          last_purchase_date: string | null
          purchase_need_id: string | null
          quality_rating: number | null
          reliability_score: number | null
          suggested_price: number
          supplier_id: string | null
          supplier_name: string
          total_purchases_count: number | null
        }
        Insert: {
          average_delivery_days?: number | null
          cost_benefit_score?: number | null
          created_at?: string | null
          delivery_days?: number | null
          id?: string
          is_preferred?: boolean | null
          last_purchase_date?: string | null
          purchase_need_id?: string | null
          quality_rating?: number | null
          reliability_score?: number | null
          suggested_price: number
          supplier_id?: string | null
          supplier_name: string
          total_purchases_count?: number | null
        }
        Update: {
          average_delivery_days?: number | null
          cost_benefit_score?: number | null
          created_at?: string | null
          delivery_days?: number | null
          id?: string
          is_preferred?: boolean | null
          last_purchase_date?: string | null
          purchase_need_id?: string | null
          quality_rating?: number | null
          reliability_score?: number | null
          suggested_price?: number
          supplier_id?: string | null
          supplier_name?: string
          total_purchases_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_suggestions_purchase_need_id_fkey"
            columns: ["purchase_need_id"]
            isOneToOne: false
            referencedRelation: "purchase_needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_suggestions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          cnpj: string | null
          contact_person: string | null
          created_at: string
          delivery_days: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string
          payment_terms: string | null
          phone: string | null
          rating: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string
          delivery_days?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id: string
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string
          delivery_days?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          category: string
          created_at: string
          data_type: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          org_id: string | null
          updated_at: string
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          data_type?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          org_id?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          data_type?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          org_id?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_pages: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          module: string | null
          name: string
          route_path: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          module?: string | null
          name: string
          route_path: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          module?: string | null
          name?: string
          route_path?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_calculations: {
        Row: {
          amount: number
          calculated_at: string
          classification_id: string | null
          created_at: string
          destination_uf: string | null
          id: string
          notes: string | null
          operation: Database["public"]["Enums"]["operation_type"]
          order_id: string | null
          org_id: string | null
          origin_uf: string | null
          regime_id: string
          result: Json
          updated_at: string
        }
        Insert: {
          amount: number
          calculated_at?: string
          classification_id?: string | null
          created_at?: string
          destination_uf?: string | null
          id?: string
          notes?: string | null
          operation: Database["public"]["Enums"]["operation_type"]
          order_id?: string | null
          org_id?: string | null
          origin_uf?: string | null
          regime_id: string
          result: Json
          updated_at?: string
        }
        Update: {
          amount?: number
          calculated_at?: string
          classification_id?: string | null
          created_at?: string
          destination_uf?: string | null
          id?: string
          notes?: string | null
          operation?: Database["public"]["Enums"]["operation_type"]
          order_id?: string | null
          org_id?: string | null
          origin_uf?: string | null
          regime_id?: string
          result?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tax_calculations_classification"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "fiscal_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tax_calculations_regime"
            columns: ["regime_id"]
            isOneToOne: false
            referencedRelation: "tax_regimes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_calculations_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "fiscal_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_calculations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_calculations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_calculations_regime_id_fkey"
            columns: ["regime_id"]
            isOneToOne: false
            referencedRelation: "tax_regimes"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_ledgers: {
        Row: {
          balance_due: number
          created_at: string
          id: string
          notes: string | null
          org_id: string | null
          period_month: number
          period_year: number
          regime_id: string
          status: Database["public"]["Enums"]["period_status"]
          tax_type_id: string
          total_credits: number
          total_debits: number
          updated_at: string
        }
        Insert: {
          balance_due?: number
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          period_month: number
          period_year: number
          regime_id: string
          status?: Database["public"]["Enums"]["period_status"]
          tax_type_id: string
          total_credits?: number
          total_debits?: number
          updated_at?: string
        }
        Update: {
          balance_due?: number
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          period_month?: number
          period_year?: number
          regime_id?: string
          status?: Database["public"]["Enums"]["period_status"]
          tax_type_id?: string
          total_credits?: number
          total_debits?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_ledgers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_ledgers_regime_id_fkey"
            columns: ["regime_id"]
            isOneToOne: false
            referencedRelation: "tax_regimes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_ledgers_tax_type_id_fkey"
            columns: ["tax_type_id"]
            isOneToOne: false
            referencedRelation: "tax_types"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rate_tables: {
        Row: {
          base_reduction: number | null
          classification_id: string | null
          created_at: string
          id: string
          jurisdiction_code: string
          org_id: string | null
          rate: number
          tax_type_id: string
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          base_reduction?: number | null
          classification_id?: string | null
          created_at?: string
          id?: string
          jurisdiction_code: string
          org_id?: string | null
          rate?: number
          tax_type_id: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          base_reduction?: number | null
          classification_id?: string | null
          created_at?: string
          id?: string
          jurisdiction_code?: string
          org_id?: string | null
          rate?: number
          tax_type_id?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tax_rate_tables_classification"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "fiscal_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tax_rate_tables_tax_type"
            columns: ["tax_type_id"]
            isOneToOne: false
            referencedRelation: "tax_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_rate_tables_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "fiscal_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_rate_tables_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_rate_tables_tax_type_id_fkey"
            columns: ["tax_type_id"]
            isOneToOne: false
            referencedRelation: "tax_types"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_regimes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          name: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          name: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          name?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_regimes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rules: {
        Row: {
          base_reduction: number | null
          calc_method: Database["public"]["Enums"]["base_calc_method"]
          classification_id: string | null
          created_at: string
          destination_uf: string | null
          formula: string | null
          id: string
          is_active: boolean
          operation: Database["public"]["Enums"]["operation_type"]
          org_id: string | null
          origin_uf: string | null
          priority: number
          rate: number | null
          regime_id: string
          tax_type_id: string
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          base_reduction?: number | null
          calc_method?: Database["public"]["Enums"]["base_calc_method"]
          classification_id?: string | null
          created_at?: string
          destination_uf?: string | null
          formula?: string | null
          id?: string
          is_active?: boolean
          operation: Database["public"]["Enums"]["operation_type"]
          org_id?: string | null
          origin_uf?: string | null
          priority?: number
          rate?: number | null
          regime_id: string
          tax_type_id: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          base_reduction?: number | null
          calc_method?: Database["public"]["Enums"]["base_calc_method"]
          classification_id?: string | null
          created_at?: string
          destination_uf?: string | null
          formula?: string | null
          id?: string
          is_active?: boolean
          operation?: Database["public"]["Enums"]["operation_type"]
          org_id?: string | null
          origin_uf?: string | null
          priority?: number
          rate?: number | null
          regime_id?: string
          tax_type_id?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_rules_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "fiscal_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_rules_regime_id_fkey"
            columns: ["regime_id"]
            isOneToOne: false
            referencedRelation: "tax_regimes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_rules_tax_type_id_fkey"
            columns: ["tax_type_id"]
            isOneToOne: false
            referencedRelation: "tax_types"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          jurisdiction: Database["public"]["Enums"]["jurisdiction"]
          name: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          jurisdiction: Database["public"]["Enums"]["jurisdiction"]
          name: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          jurisdiction?: Database["public"]["Enums"]["jurisdiction"]
          name?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_report_templates: {
        Row: {
          applicable_components:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          created_at: string | null
          created_by: string | null
          css_styles: string | null
          footer_template: string | null
          header_template: string | null
          id: string
          is_active: boolean | null
          measurement_fields: Json | null
          optional_data_fields: Json | null
          org_id: string | null
          photo_requirements: Json | null
          report_type: string
          required_data_fields: Json | null
          technical_standard: string | null
          template_name: string
          template_structure: Json
          updated_at: string | null
          version: number | null
        }
        Insert: {
          applicable_components?:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          created_at?: string | null
          created_by?: string | null
          css_styles?: string | null
          footer_template?: string | null
          header_template?: string | null
          id?: string
          is_active?: boolean | null
          measurement_fields?: Json | null
          optional_data_fields?: Json | null
          org_id?: string | null
          photo_requirements?: Json | null
          report_type: string
          required_data_fields?: Json | null
          technical_standard?: string | null
          template_name: string
          template_structure?: Json
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          applicable_components?:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          created_at?: string | null
          created_by?: string | null
          css_styles?: string | null
          footer_template?: string | null
          header_template?: string | null
          id?: string
          is_active?: boolean | null
          measurement_fields?: Json | null
          optional_data_fields?: Json | null
          org_id?: string | null
          photo_requirements?: Json | null
          report_type?: string
          required_data_fields?: Json | null
          technical_standard?: string | null
          template_name?: string
          template_structure?: Json
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_report_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          component: Database["public"]["Enums"]["engine_component"]
          conformity_status: string | null
          corrective_actions: Json | null
          generated_at: string | null
          generated_automatically: boolean | null
          generated_by: string | null
          id: string
          is_customer_visible: boolean | null
          measurements_data: Json | null
          non_conformities: Json | null
          order_id: string | null
          org_id: string | null
          pdf_file_path: string | null
          photos_data: Json | null
          report_data: Json
          report_number: string | null
          report_template: string | null
          report_type: string
          technical_standard: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          component: Database["public"]["Enums"]["engine_component"]
          conformity_status?: string | null
          corrective_actions?: Json | null
          generated_at?: string | null
          generated_automatically?: boolean | null
          generated_by?: string | null
          id?: string
          is_customer_visible?: boolean | null
          measurements_data?: Json | null
          non_conformities?: Json | null
          order_id?: string | null
          org_id?: string | null
          pdf_file_path?: string | null
          photos_data?: Json | null
          report_data?: Json
          report_number?: string | null
          report_template?: string | null
          report_type: string
          technical_standard?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          component?: Database["public"]["Enums"]["engine_component"]
          conformity_status?: string | null
          corrective_actions?: Json | null
          generated_at?: string | null
          generated_automatically?: boolean | null
          generated_by?: string | null
          id?: string
          is_customer_visible?: boolean | null
          measurements_data?: Json | null
          non_conformities?: Json | null
          order_id?: string | null
          org_id?: string | null
          pdf_file_path?: string | null
          photos_data?: Json | null
          report_data?: Json
          report_number?: string | null
          report_template?: string | null
          report_type?: string
          technical_standard?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_standards_config: {
        Row: {
          applicable_components:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          certification_required: boolean | null
          created_at: string | null
          description: string | null
          documentation_requirements: Json | null
          id: string
          is_active: boolean | null
          measurement_requirements: Json | null
          org_id: string | null
          standard_code: string
          standard_name: string
          test_procedures: Json | null
          tolerance_tables: Json | null
          updated_at: string | null
        }
        Insert: {
          applicable_components?:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          certification_required?: boolean | null
          created_at?: string | null
          description?: string | null
          documentation_requirements?: Json | null
          id?: string
          is_active?: boolean | null
          measurement_requirements?: Json | null
          org_id?: string | null
          standard_code: string
          standard_name: string
          test_procedures?: Json | null
          tolerance_tables?: Json | null
          updated_at?: string | null
        }
        Update: {
          applicable_components?:
            | Database["public"]["Enums"]["engine_component"][]
            | null
          certification_required?: boolean | null
          created_at?: string | null
          description?: string | null
          documentation_requirements?: Json | null
          id?: string
          is_active?: boolean | null
          measurement_requirements?: Json | null
          org_id?: string | null
          standard_code?: string
          standard_name?: string
          test_procedures?: Json | null
          tolerance_tables?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_standards_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          component: Database["public"]["Enums"]["engine_component"]
          created_at: string
          description: string | null
          duration_minutes: number | null
          employee_name: string
          end_time: string | null
          id: string
          order_id: string
          start_time: string
          workflow_step: Database["public"]["Enums"]["workflow_status"]
        }
        Insert: {
          component: Database["public"]["Enums"]["engine_component"]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          employee_name: string
          end_time?: string | null
          id?: string
          order_id: string
          start_time: string
          workflow_step: Database["public"]["Enums"]["workflow_status"]
        }
        Update: {
          component?: Database["public"]["Enums"]["engine_component"]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          employee_name?: string
          end_time?: string | null
          id?: string
          order_id?: string
          start_time?: string
          workflow_step?: Database["public"]["Enums"]["workflow_status"]
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_basic_info: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_profile_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          org_id: string | null
          profile_id: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          profile_id?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profile_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string | null
          sector_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id?: string | null
          sector_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string | null
          sector_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "user_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sectors: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sectors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_claims: {
        Row: {
          actual_cost: number | null
          claim_date: string | null
          claim_description: string
          claim_number: string | null
          claim_status: string | null
          claim_type: string
          component: Database["public"]["Enums"]["engine_component"]
          contact_method: string | null
          created_at: string | null
          customer_complaint: string | null
          customer_id: string | null
          estimated_cost: number | null
          evaluated_at: string | null
          evaluated_by: string | null
          evaluation_notes: string | null
          failure_cause: string | null
          failure_symptoms: string | null
          id: string
          is_warranty_valid: boolean | null
          new_order_id: string | null
          org_id: string | null
          original_order_id: string | null
          priority_level: string | null
          reported_by: string | null
          resolution_description: string | null
          resolution_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          technical_evaluation: Json | null
          technical_evaluation_status: string | null
          updated_at: string | null
          warranty_coverage_percentage: number | null
        }
        Insert: {
          actual_cost?: number | null
          claim_date?: string | null
          claim_description: string
          claim_number?: string | null
          claim_status?: string | null
          claim_type: string
          component: Database["public"]["Enums"]["engine_component"]
          contact_method?: string | null
          created_at?: string | null
          customer_complaint?: string | null
          customer_id?: string | null
          estimated_cost?: number | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_notes?: string | null
          failure_cause?: string | null
          failure_symptoms?: string | null
          id?: string
          is_warranty_valid?: boolean | null
          new_order_id?: string | null
          org_id?: string | null
          original_order_id?: string | null
          priority_level?: string | null
          reported_by?: string | null
          resolution_description?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          technical_evaluation?: Json | null
          technical_evaluation_status?: string | null
          updated_at?: string | null
          warranty_coverage_percentage?: number | null
        }
        Update: {
          actual_cost?: number | null
          claim_date?: string | null
          claim_description?: string
          claim_number?: string | null
          claim_status?: string | null
          claim_type?: string
          component?: Database["public"]["Enums"]["engine_component"]
          contact_method?: string | null
          created_at?: string | null
          customer_complaint?: string | null
          customer_id?: string | null
          estimated_cost?: number | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_notes?: string | null
          failure_cause?: string | null
          failure_symptoms?: string | null
          id?: string
          is_warranty_valid?: boolean | null
          new_order_id?: string | null
          org_id?: string | null
          original_order_id?: string | null
          priority_level?: string | null
          reported_by?: string | null
          resolution_description?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          technical_evaluation?: Json | null
          technical_evaluation_status?: string | null
          updated_at?: string | null
          warranty_coverage_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claims_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_new_order_id_fkey"
            columns: ["new_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_original_order_id_fkey"
            columns: ["original_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_indicators: {
        Row: {
          average_resolution_days: number | null
          claims_by_cause: Json | null
          claims_by_component: Json | null
          customer_satisfaction_avg: number | null
          generated_at: string | null
          generated_by: string | null
          id: string
          org_id: string | null
          period_end: string
          period_start: string
          total_orders_delivered: number | null
          total_warranty_claims: number | null
          total_warranty_cost: number | null
          warranty_rate: number | null
        }
        Insert: {
          average_resolution_days?: number | null
          claims_by_cause?: Json | null
          claims_by_component?: Json | null
          customer_satisfaction_avg?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          org_id?: string | null
          period_end: string
          period_start: string
          total_orders_delivered?: number | null
          total_warranty_claims?: number | null
          total_warranty_cost?: number | null
          warranty_rate?: number | null
        }
        Update: {
          average_resolution_days?: number | null
          claims_by_cause?: Json | null
          claims_by_component?: Json | null
          customer_satisfaction_avg?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          org_id?: string | null
          period_end?: string
          period_start?: string
          total_orders_delivered?: number | null
          total_warranty_claims?: number | null
          total_warranty_cost?: number | null
          warranty_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_indicators_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          created_at: string
          effective_from: string | null
          effective_to: string | null
          employee_id: string
          friday_end: string | null
          friday_start: string | null
          id: string
          monday_end: string | null
          monday_start: string | null
          org_id: string | null
          saturday_end: string | null
          saturday_start: string | null
          shift_name: string
          sunday_end: string | null
          sunday_start: string | null
          thursday_end: string | null
          thursday_start: string | null
          tuesday_end: string | null
          tuesday_start: string | null
          wednesday_end: string | null
          wednesday_start: string | null
        }
        Insert: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          employee_id: string
          friday_end?: string | null
          friday_start?: string | null
          id?: string
          monday_end?: string | null
          monday_start?: string | null
          org_id?: string | null
          saturday_end?: string | null
          saturday_start?: string | null
          shift_name: string
          sunday_end?: string | null
          sunday_start?: string | null
          thursday_end?: string | null
          thursday_start?: string | null
          tuesday_end?: string | null
          tuesday_start?: string | null
          wednesday_end?: string | null
          wednesday_start?: string | null
        }
        Update: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          employee_id?: string
          friday_end?: string | null
          friday_start?: string | null
          id?: string
          monday_end?: string | null
          monday_start?: string | null
          org_id?: string | null
          saturday_end?: string | null
          saturday_start?: string | null
          shift_name?: string
          sunday_end?: string | null
          sunday_start?: string | null
          thursday_end?: string | null
          thursday_start?: string | null
          tuesday_end?: string | null
          tuesday_start?: string | null
          wednesday_end?: string | null
          wednesday_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_checklist_items: {
        Row: {
          checklist_id: string | null
          display_order: number | null
          expected_value: number | null
          help_text: string | null
          id: string
          is_critical: boolean | null
          is_required: boolean | null
          item_code: string
          item_description: string | null
          item_name: string
          item_options: Json | null
          item_type: string | null
          measurement_unit: string | null
          requires_photo: boolean | null
          requires_supervisor_check: boolean | null
          technical_reference: string | null
          tolerance_max: number | null
          tolerance_min: number | null
          validation_rules: Json | null
        }
        Insert: {
          checklist_id?: string | null
          display_order?: number | null
          expected_value?: number | null
          help_text?: string | null
          id?: string
          is_critical?: boolean | null
          is_required?: boolean | null
          item_code: string
          item_description?: string | null
          item_name: string
          item_options?: Json | null
          item_type?: string | null
          measurement_unit?: string | null
          requires_photo?: boolean | null
          requires_supervisor_check?: boolean | null
          technical_reference?: string | null
          tolerance_max?: number | null
          tolerance_min?: number | null
          validation_rules?: Json | null
        }
        Update: {
          checklist_id?: string | null
          display_order?: number | null
          expected_value?: number | null
          help_text?: string | null
          id?: string
          is_critical?: boolean | null
          is_required?: boolean | null
          item_code?: string
          item_description?: string | null
          item_name?: string
          item_options?: Json | null
          item_type?: string | null
          measurement_unit?: string | null
          requires_photo?: boolean | null
          requires_supervisor_check?: boolean | null
          technical_reference?: string | null
          tolerance_max?: number | null
          tolerance_min?: number | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "workflow_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_checklist_responses: {
        Row: {
          checklist_id: string | null
          completion_percentage: number | null
          component: Database["public"]["Enums"]["engine_component"]
          corrective_actions: Json | null
          filled_at: string | null
          filled_by: string | null
          id: string
          measurements: Json | null
          non_conformities: Json | null
          notes: string | null
          order_id: string | null
          order_workflow_id: string | null
          overall_status: string | null
          photos: Json | null
          responses: Json
          reviewed_at: string | null
          reviewed_by: string | null
          step_key: string
          supervisor_approved_at: string | null
          supervisor_approved_by: string | null
        }
        Insert: {
          checklist_id?: string | null
          completion_percentage?: number | null
          component: Database["public"]["Enums"]["engine_component"]
          corrective_actions?: Json | null
          filled_at?: string | null
          filled_by?: string | null
          id?: string
          measurements?: Json | null
          non_conformities?: Json | null
          notes?: string | null
          order_id?: string | null
          order_workflow_id?: string | null
          overall_status?: string | null
          photos?: Json | null
          responses?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          step_key: string
          supervisor_approved_at?: string | null
          supervisor_approved_by?: string | null
        }
        Update: {
          checklist_id?: string | null
          completion_percentage?: number | null
          component?: Database["public"]["Enums"]["engine_component"]
          corrective_actions?: Json | null
          filled_at?: string | null
          filled_by?: string | null
          id?: string
          measurements?: Json | null
          non_conformities?: Json | null
          notes?: string | null
          order_id?: string | null
          order_workflow_id?: string | null
          overall_status?: string | null
          photos?: Json | null
          responses?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          step_key?: string
          supervisor_approved_at?: string | null
          supervisor_approved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_checklist_responses_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "workflow_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_checklist_responses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_checklist_responses_order_workflow_id_fkey"
            columns: ["order_workflow_id"]
            isOneToOne: false
            referencedRelation: "order_workflow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_checklist_responses_order_workflow_id_fkey"
            columns: ["order_workflow_id"]
            isOneToOne: false
            referencedRelation: "v_workflows_with_pending_checklists"
            referencedColumns: ["workflow_id"]
          },
        ]
      }
      workflow_checklists: {
        Row: {
          blocks_workflow_advance: boolean | null
          checklist_name: string
          component: Database["public"]["Enums"]["engine_component"]
          created_at: string | null
          created_by: string | null
          description: string | null
          engine_type_id: string | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          org_id: string | null
          requires_supervisor_approval: boolean | null
          step_key: string
          supervisor_roles: Json | null
          technical_standard: string | null
          updated_at: string | null
          version: number | null
          workflow_step_id: string | null
        }
        Insert: {
          blocks_workflow_advance?: boolean | null
          checklist_name: string
          component: Database["public"]["Enums"]["engine_component"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          engine_type_id?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          org_id?: string | null
          requires_supervisor_approval?: boolean | null
          step_key: string
          supervisor_roles?: Json | null
          technical_standard?: string | null
          updated_at?: string | null
          version?: number | null
          workflow_step_id?: string | null
        }
        Update: {
          blocks_workflow_advance?: boolean | null
          checklist_name?: string
          component?: Database["public"]["Enums"]["engine_component"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          engine_type_id?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          org_id?: string | null
          requires_supervisor_approval?: boolean | null
          step_key?: string
          supervisor_roles?: Json | null
          technical_standard?: string | null
          updated_at?: string | null
          version?: number | null
          workflow_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_checklists_engine_type_id_fkey"
            columns: ["engine_type_id"]
            isOneToOne: false
            referencedRelation: "engine_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_checklists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_checklists_workflow_step_id_fkey"
            columns: ["workflow_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_status_history: {
        Row: {
          approval_required: boolean | null
          approved_at: string | null
          approved_by: string | null
          changed_at: string | null
          changed_by: string | null
          id: string
          new_status: Database["public"]["Enums"]["workflow_status"]
          old_status: Database["public"]["Enums"]["workflow_status"] | null
          order_workflow_id: string | null
          org_id: string | null
          reason: string | null
        }
        Insert: {
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["workflow_status"]
          old_status?: Database["public"]["Enums"]["workflow_status"] | null
          order_workflow_id?: string | null
          org_id?: string | null
          reason?: string | null
        }
        Update: {
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["workflow_status"]
          old_status?: Database["public"]["Enums"]["workflow_status"] | null
          order_workflow_id?: string | null
          org_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_status_history_order_workflow_id_fkey"
            columns: ["order_workflow_id"]
            isOneToOne: false
            referencedRelation: "order_workflow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_status_history_order_workflow_id_fkey"
            columns: ["order_workflow_id"]
            isOneToOne: false
            referencedRelation: "v_workflows_with_pending_checklists"
            referencedColumns: ["workflow_id"]
          },
          {
            foreignKeyName: "workflow_status_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          component: Database["public"]["Enums"]["engine_component"]
          created_at: string | null
          description: string | null
          engine_type_id: string | null
          estimated_hours: number | null
          id: string
          is_required: boolean | null
          prerequisites: Json | null
          quality_checklist_required: boolean | null
          special_equipment: Json | null
          step_key: string
          step_name: string
          step_order: number
          technical_report_required: boolean | null
          updated_at: string | null
        }
        Insert: {
          component: Database["public"]["Enums"]["engine_component"]
          created_at?: string | null
          description?: string | null
          engine_type_id?: string | null
          estimated_hours?: number | null
          id?: string
          is_required?: boolean | null
          prerequisites?: Json | null
          quality_checklist_required?: boolean | null
          special_equipment?: Json | null
          step_key: string
          step_name: string
          step_order: number
          technical_report_required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          component?: Database["public"]["Enums"]["engine_component"]
          created_at?: string | null
          description?: string | null
          engine_type_id?: string | null
          estimated_hours?: number | null
          id?: string
          is_required?: boolean | null
          prerequisites?: Json | null
          quality_checklist_required?: boolean | null
          special_equipment?: Json | null
          step_key?: string
          step_name?: string
          step_order?: number
          technical_report_required?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_engine_type_id_fkey"
            columns: ["engine_type_id"]
            isOneToOne: false
            referencedRelation: "engine_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_workflows_with_pending_checklists: {
        Row: {
          component: Database["public"]["Enums"]["engine_component"] | null
          missing_checklists: Json | null
          order_id: string | null
          order_number: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["workflow_status"] | null
          workflow_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_workflow_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_manage_organizations: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_workflow_advance: {
        Args: { p_workflow_id: string }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_message: string
          p_metadata?: Json
          p_notification_type_id: string
          p_org_id: string
          p_severity?: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      current_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_budget_number: {
        Args: { org_id: string }
        Returns: string
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_po_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_requisition_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_technical_report_number: {
        Args: { org_id: string; report_type: string }
        Returns: string
      }
      generate_warranty_claim_number: {
        Args: { org_id: string }
        Returns: string
      }
      get_all_super_admins: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          last_sign_in_at: string
          name: string
          user_id: string
        }[]
      }
      get_enum_values: {
        Args: { enum_name: string }
        Returns: string[]
      }
      get_organization_users_info: {
        Args: { org_id: string }
        Returns: {
          created_at: string
          email: string
          name: string
          user_id: string
        }[]
      }
      get_workflows_pending_checklists: {
        Args: { p_org_id: string }
        Returns: {
          component: string
          created_at: string
          id: string
          missing_checklist: string
          order_id: string
          order_number: string
          started_at: string
          status: string
        }[]
      }
      has_org_role: {
        Args: {
          org_id: string
          required_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_org_member: {
        Args: { org_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      mark_all_notifications_as_read: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: number
      }
      mark_notification_as_read: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      notify_workflow_blocked_by_checklist: {
        Args: {
          p_checklist_name: string
          p_order_number: string
          p_workflow_id: string
        }
        Returns: undefined
      }
      promote_user_to_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      revoke_user_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "manager" | "user" | "super_admin"
      base_calc_method:
        | "percentual"
        | "valor_fixo"
        | "mva"
        | "reducao_base"
        | "substituicao_tributaria"
        | "isento"
        | "nao_incidencia"
      budget_status: "pendente" | "aprovado" | "reprovado" | "em_producao"
      classification_type: "produto" | "servico"
      customer_type: "oficina" | "direto"
      engine_component:
        | "bloco"
        | "eixo"
        | "biela"
        | "comando"
        | "cabecote"
        | "virabrequim"
        | "pistao"
      expense_category:
        | "fixed"
        | "variable"
        | "tax"
        | "supplier"
        | "salary"
        | "equipment"
        | "maintenance"
      filing_status: "rascunho" | "gerado" | "validado" | "enviado" | "erro"
      jurisdiction: "federal" | "estadual" | "municipal"
      operation_type: "venda" | "compra" | "prestacao_servico"
      order_status:
        | "ativa"
        | "concluida"
        | "cancelada"
        | "entregue"
        | "pendente"
        | "em_andamento"
        | "aguardando_aprovacao"
      payment_method:
        | "cash"
        | "pix"
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
        | "check"
      payment_status: "pending" | "paid" | "overdue" | "cancelled"
      period_status: "aberto" | "fechado" | "transmitido"
      status_transition_type:
        | "automatic"
        | "manual"
        | "approval_required"
        | "conditional"
      transaction_type: "income" | "expense"
      workflow_status:
        | "entrada"
        | "metrologia"
        | "usinagem"
        | "montagem"
        | "pronto"
        | "garantia"
        | "entregue"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "manager", "user", "super_admin"],
      base_calc_method: [
        "percentual",
        "valor_fixo",
        "mva",
        "reducao_base",
        "substituicao_tributaria",
        "isento",
        "nao_incidencia",
      ],
      budget_status: ["pendente", "aprovado", "reprovado", "em_producao"],
      classification_type: ["produto", "servico"],
      customer_type: ["oficina", "direto"],
      engine_component: [
        "bloco",
        "eixo",
        "biela",
        "comando",
        "cabecote",
        "virabrequim",
        "pistao",
      ],
      expense_category: [
        "fixed",
        "variable",
        "tax",
        "supplier",
        "salary",
        "equipment",
        "maintenance",
      ],
      filing_status: ["rascunho", "gerado", "validado", "enviado", "erro"],
      jurisdiction: ["federal", "estadual", "municipal"],
      operation_type: ["venda", "compra", "prestacao_servico"],
      order_status: [
        "ativa",
        "concluida",
        "cancelada",
        "entregue",
        "pendente",
        "em_andamento",
        "aguardando_aprovacao",
      ],
      payment_method: [
        "cash",
        "pix",
        "credit_card",
        "debit_card",
        "bank_transfer",
        "check",
      ],
      payment_status: ["pending", "paid", "overdue", "cancelled"],
      period_status: ["aberto", "fechado", "transmitido"],
      status_transition_type: [
        "automatic",
        "manual",
        "approval_required",
        "conditional",
      ],
      transaction_type: ["income", "expense"],
      workflow_status: [
        "entrada",
        "metrologia",
        "usinagem",
        "montagem",
        "pronto",
        "garantia",
        "entregue",
      ],
    },
  },
} as const
