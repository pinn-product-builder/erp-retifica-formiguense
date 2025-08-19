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
        }
        Insert: {
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
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
      monthly_dre: {
        Row: {
          created_at: string | null
          direct_costs: number | null
          gross_profit: number | null
          id: string
          month: number
          net_profit: number | null
          operational_expenses: number | null
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
          profit_margin?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
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
          status: Database["public"]["Enums"]["order_status"] | null
          updated_at: string
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
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string
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
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string
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
