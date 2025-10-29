import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type DetailedBudget = Database['public']['Tables']['detailed_budgets']['Row'];
type BudgetApproval = Database['public']['Tables']['budget_approvals']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type Engine = Database['public']['Tables']['engines']['Row'];

export interface OrderWithDetails {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  customer?: {
    name: string;
  };
  engine?: {
    brand: string;
    model: string;
    type: string;
  };
  detailed_budgets?: {
    id: string;
    budget_number: string;
    status: string;
    total_amount: number;
    created_at: string;
    budget_approvals?: {
      id: string;
      approval_type: string;
      approved_amount: number;
      approved_at: string;
      approved_by_customer: string;
      customer_signature: string;
    }[];
  }[];
}

export interface OrderSearchParams {
  orgId: string;
  searchTerm?: string;
  budgetStatus?: 'aprovado' | 'pendente' | 'reprovado' | 'em_producao';
  page?: number;
  limit?: number;
  orderBy?: 'created_at' | 'order_number' | 'status';
  orderDirection?: 'asc' | 'desc';
}

export interface OrderSearchResult {
  orders: OrderWithDetails[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class OrderService {
  /**
   * Busca ordens com filtros e paginação
   */
  static async searchOrders(params: OrderSearchParams): Promise<OrderSearchResult> {
    const {
      orgId,
      searchTerm = '',
      budgetStatus,
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = params;

    const offset = (page - 1) * limit;

    try {
      let orderIds: string[] = [];

      // Se há termo de busca, primeiro buscar IDs das ordens que correspondem
      if (searchTerm.trim()) {
        const searchResults = await this.searchOrderIds(orgId, searchTerm);
        orderIds = searchResults;
        
        // Se não encontrou nenhuma ordem com o termo de busca, retornar resultado vazio
        if (orderIds.length === 0) {
          return {
            orders: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          };
        }
      }

      // Construir query base
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          status,
          customer:customers(name),
          engine:engines(brand, model, type),
          detailed_budgets(
            id,
            budget_number,
            status,
            total_amount,
            created_at,
            budget_approvals(
              id,
              approval_type,
              approved_amount,
              approved_at,
              approved_by_customer,
              customer_signature
            )
          )
        `, { count: 'exact' })
        .eq('org_id', orgId);

      // Aplicar filtro por IDs se há termo de busca
      if (orderIds.length > 0) {
        query = query.in('id', orderIds);
      }

      // Aplicar filtro por status do orçamento se especificado
      if (budgetStatus) {
        query = query.eq('detailed_budgets.status', budgetStatus);
      }

      // Aplicar ordenação
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Aplicar paginação
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar ordens:', error);
        throw new Error(`Erro ao buscar ordens: ${error.message}`);
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        orders: (data as unknown as OrderWithDetails[]) || [],
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      };

    } catch (error) {
      console.error('Erro no OrderService.searchOrders:', error);
      throw error;
    }
  }

  /**
   * Busca IDs das ordens que correspondem ao termo de busca
   */
  private static async searchOrderIds(orgId: string, searchTerm: string): Promise<string[]> {
    try {
      // Por enquanto, buscar apenas por número da OS para evitar problemas de parsing
      const { data: ordersByNumber } = await supabase
        .from('orders')
        .select('id')
        .eq('org_id', orgId)
        .ilike('order_number', `%${searchTerm}%`);

      return (ordersByNumber || []).map(o => o.id);

    } catch (error) {
      console.error('Erro ao buscar IDs das ordens:', error);
      return [];
    }
  }

  /**
   * Busca uma ordem específica por ID
   */
  static async getOrderById(orderId: string, orgId: string, budgetStatus?: string): Promise<OrderWithDetails | null> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          status,
          customer:customers(name),
          engine:engines(brand, model, type),
          detailed_budgets(
            id,
            budget_number,
            status,
            total_amount,
            created_at,
            budget_approvals(
              id,
              approval_type,
              approved_amount,
              approved_at,
              approved_by_customer,
              customer_signature
            )
          )
        `)
        .eq('id', orderId)
        .eq('org_id', orgId);

      // Aplicar filtro por status do orçamento se especificado
      if (budgetStatus) {
        query = query.eq('detailed_budgets.status', budgetStatus);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Ordem não encontrada
        }
        console.error('Erro ao buscar ordem por ID:', error);
        throw new Error(`Erro ao buscar ordem: ${error.message}`);
      }

      return data as unknown as OrderWithDetails;

    } catch (error) {
      console.error('Erro no OrderService.getOrderById:', error);
      throw error;
    }
  }

  /**
   * Busca ordens com orçamento aprovado (método de conveniência)
   */
  static async getOrdersWithApprovedBudget(
    orgId: string, 
    searchTerm?: string, 
    page?: number, 
    limit?: number
  ): Promise<OrderSearchResult> {
    return this.searchOrders({
      orgId,
      searchTerm,
      budgetStatus: 'aprovado',
      page,
      limit
    });
  }

  /**
   * Busca ordens com orçamento pendente (método de conveniência)
   */
  static async getOrdersWithPendingBudget(
    orgId: string, 
    searchTerm?: string, 
    page?: number, 
    limit?: number
  ): Promise<OrderSearchResult> {
    return this.searchOrders({
      orgId,
      searchTerm,
      budgetStatus: 'pendente',
      page,
      limit
    });
  }

  /**
   * Busca todas as ordens sem filtro de orçamento (método de conveniência)
   */
  static async getAllOrders(
    orgId: string, 
    searchTerm?: string, 
    page?: number, 
    limit?: number
  ): Promise<OrderSearchResult> {
    return this.searchOrders({
      orgId,
      searchTerm,
      page,
      limit
    });
  }
}
