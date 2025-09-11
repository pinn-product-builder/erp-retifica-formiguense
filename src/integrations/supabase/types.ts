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
            referencedRelation: "budgets"
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
          active: boolean | null
          commission_rate: number | null
          created_at: string
          email: string | null
          id: string
          name: string
          org_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          org_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
      engines: {
        Row: {
          assembly_state: string | null
          brand: string
          created_at: string
          fuel_type: string
          has_block: boolean | null
          has_connecting_rod: boolean | null
          has_crankshaft: boolean | null
          has_head: boolean | null
          has_piston: boolean | null
          id: string
          is_complete: boolean | null
          model: string
          serial_number: string | null
          turns_manually: boolean | null
          type: string
          updated_at: string
        }
        Insert: {
          assembly_state?: string | null
          brand: string
          created_at?: string
          fuel_type: string
          has_block?: boolean | null
          has_connecting_rod?: boolean | null
          has_crankshaft?: boolean | null
          has_head?: boolean | null
          has_piston?: boolean | null
          id?: string
          is_complete?: boolean | null
          model: string
          serial_number?: string | null
          turns_manually?: boolean | null
          type: string
          updated_at?: string
        }
        Update: {
          assembly_state?: string | null
          brand?: string
          created_at?: string
          fuel_type?: string
          has_block?: boolean | null
          has_connecting_rod?: boolean | null
          has_crankshaft?: boolean | null
          has_head?: boolean | null
          has_piston?: boolean | null
          id?: string
          is_complete?: boolean | null
          model?: string
          serial_number?: string | null
          turns_manually?: boolean | null
          type?: string
          updated_at?: string
        }
        Relationships: []
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
          assigned_to: string | null
          completed_at: string | null
          component: Database["public"]["Enums"]["engine_component"]
          created_at: string
          id: string
          notes: string | null
          order_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["workflow_status"] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          component: Database["public"]["Enums"]["engine_component"]
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          component?: Database["public"]["Enums"]["engine_component"]
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"] | null
          updated_at?: string
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      status_config: {
        Row: {
          badge_variant: string
          color: string | null
          created_at: string
          entity_type: string
          icon: string | null
          id: string
          is_active: boolean
          org_id: string | null
          status_key: string
          status_label: string
          updated_at: string
        }
        Insert: {
          badge_variant?: string
          color?: string | null
          created_at?: string
          entity_type: string
          icon?: string | null
          id?: string
          is_active?: boolean
          org_id?: string | null
          status_key: string
          status_label: string
          updated_at?: string
        }
        Update: {
          badge_variant?: string
          color?: string | null
          created_at?: string
          entity_type?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          org_id?: string | null
          status_key?: string
          status_label?: string
          updated_at?: string
        }
        Relationships: []
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_org_id: {
        Args: Record<PropertyKey, never>
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
    }
    Enums: {
      app_role: "owner" | "admin" | "manager" | "user"
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
      engine_component: "bloco" | "eixo" | "biela" | "comando" | "cabecote"
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
      order_status: "ativa" | "concluida" | "cancelada"
      payment_method:
        | "cash"
        | "pix"
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
        | "check"
      payment_status: "pending" | "paid" | "overdue" | "cancelled"
      period_status: "aberto" | "fechado" | "transmitido"
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
      app_role: ["owner", "admin", "manager", "user"],
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
      engine_component: ["bloco", "eixo", "biela", "comando", "cabecote"],
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
      order_status: ["ativa", "concluida", "cancelada"],
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
