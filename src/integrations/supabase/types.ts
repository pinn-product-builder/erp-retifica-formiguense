export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          document: string
          email: string | null
          id: string
          name: string
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
          document: string
          email?: string | null
          id?: string
          name: string
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
          document?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          type?: Database["public"]["Enums"]["customer_type"]
          updated_at?: string
          workshop_cnpj?: string | null
          workshop_contact?: string | null
          workshop_name?: string | null
        }
        Relationships: []
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
        ]
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
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      budget_status: "pendente" | "aprovado" | "reprovado" | "em_producao"
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
      order_status: "ativa" | "concluida" | "cancelada"
      payment_method:
        | "cash"
        | "pix"
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
        | "check"
      payment_status: "pending" | "paid" | "overdue" | "cancelled"
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
      budget_status: ["pendente", "aprovado", "reprovado", "em_producao"],
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
