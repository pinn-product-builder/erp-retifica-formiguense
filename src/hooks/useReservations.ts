import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface PartReservation {
  id: string;
  org_id: string;
  part_id?: string;
  part_code: string;
  part_name: string;
  budget_id?: string;
  order_id?: string;
  quantity_reserved: number;
  quantity_separated?: number;
  quantity_applied?: number;
  unit_cost?: number;
  total_reserved_cost?: number;
  reservation_status: 'reserved' | 'partial' | 'separated' | 'applied' | 'expired' | 'cancelled';
  reserved_at: string;
  expires_at?: string;
  reserved_by?: string;
  separated_at?: string;
  separated_by?: string;
  applied_at?: string;
  applied_by?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: unknown;
  
  // Relacionamentos
  part?: {
    id: string;
    part_name: string;
    part_code: string;
    quantity: number;
  };
  budget?: {
    id: string;
    budget_number: string;
  };
  order?: {
    id: string;
    order_number: string;
  };
}

export interface ReservationResult {
  success: boolean;
  reservations: Array<{
    reservation_id: string;
    part_id: string;
    part_name: string;
    quantity_reserved: number;
    status: 'reserved' | 'partial';
  }>;
  needs: Array<{
    need_id: string;
    part_id: string;
    part_name: string;
    quantity_needed: number;
    status: 'need_created';
  }>;
}

export interface ConsumptionData {
  items: Array<{
    part_id: string;
    quantity: number;
  }>;
}

export const useReservations = () => {
  const [reservations, setReservations] = useState<PartReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  // Buscar todas as reservas
  const fetchReservations = async (filters?: {
    status?: string;
    order_id?: string;
    budget_id?: string;
    part_id?: string;
  }) => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);
      
      let query = supabase
        .from('parts_reservations')
        .select(`
          *,
          part:parts_inventory(id, part_name, part_code, quantity),
          budget:detailed_budgets(id, budget_number),
          order:orders(id, order_number)
        `)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.status) {
        query = query.eq('reservation_status', filters.status);
      }
      if (filters?.order_id) {
        query = query.eq('order_id', filters.order_id);
      }
      if (filters?.budget_id) {
        query = query.eq('budget_id', filters.budget_id);
      }
      if (filters?.part_id) {
        query = query.eq('part_id', filters.part_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar reservas:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar reservas",
          description: error.message
        });
        return [];
      }

      setReservations((data || []) as PartReservation[]);
      return (data || []) as PartReservation[];
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar reservas",
        description: "Não foi possível carregar as reservas"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Reservar peças de um orçamento
  const reservePartsFromBudget = async (budgetId: string): Promise<ReservationResult | null> => {
    if (!currentOrganization?.id) return null;

    try {
      setLoading(true);
      
      // @ts-expect-error - RPC function not in generated types
      const { data, error } = await supabase.rpc('reserve_parts_from_budget', {
        p_budget_id: budgetId
      });

      if (error) {
        console.error('Erro ao reservar peças:', error);
        toast({
          variant: "destructive",
          title: "Erro ao reservar peças",
          description: error.message
        });
        return null;
      }

      const result = data as unknown as ReservationResult;
      
      // Mostrar resultado
      if (result.success) {
        const reservedCount = result.reservations.length;
        const needsCount = result.needs.length;
        
        let message = `${reservedCount} peças reservadas com sucesso`;
        if (needsCount > 0) {
          message += `. ${needsCount} necessidades de compra criadas para peças em falta`;
        }
        
        toast({
          title: "Reservas processadas",
          description: message
        });
      }

      // Recarregar reservas
      await fetchReservations();
      
      return result;
    } catch (error) {
      console.error('Erro ao reservar peças:', error);
      toast({
        variant: "destructive",
        title: "Erro ao reservar peças",
        description: "Não foi possível processar as reservas"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Consumir peças reservadas
  const consumeReservedParts = async (
    orderId: string, 
    parts: Array<{ part_code: string; quantity: number }>
  ): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);
      
      // @ts-expect-error - RPC function not in generated types
      const { data, error } = await supabase.rpc('consume_reserved_parts', {
        p_order_id: orderId,
        p_parts: parts
      });

      if (error) {
        console.error('Erro ao consumir peças:', error);
        toast({
          variant: "destructive",
          title: "Erro ao consumir peças",
          description: error.message
        });
        return false;
      }

      const result = data as { success: boolean; consumed: Array<Record<string, unknown>>; errors: Array<Record<string, unknown>> };
      
      if (result.success) {
        const successCount = result.consumed.length;
        const errorCount = result.errors.length;
        
        if (successCount > 0) {
          toast({
            title: "Peças consumidas",
            description: `${successCount} peças consumidas com sucesso${errorCount > 0 ? `. ${errorCount} itens com erro.` : ''}`
          });
        }
        
        if (errorCount > 0) {
          console.warn('Erros ao consumir algumas peças:', result.errors);
        }
        
        // Recarregar reservas
        await fetchReservations();
        return successCount > 0;
      }

      return false;
    } catch (error) {
      console.error('Erro ao consumir peças:', error);
      toast({
        variant: "destructive",
        title: "Erro ao consumir peças",
        description: "Não foi possível consumir as peças reservadas"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cancelar reserva
  const cancelReservation = async (reservationId: string, reason?: string): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);
      
      // @ts-expect-error - RPC function not in generated types
      const { data, error } = await supabase.rpc('cancel_reservation', {
        p_reservation_id: reservationId,
        p_reason: reason || null
      });

      if (error) {
        console.error('Erro ao cancelar reserva:', error);
        toast({
          variant: "destructive",
          title: "Erro ao cancelar reserva",
          description: error.message
        });
        return false;
      }

      const result = data as { success: boolean; error?: string; quantity_released?: number };
      
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erro ao cancelar reserva",
          description: result.error || "Não foi possível cancelar a reserva"
        });
        return false;
      }

      toast({
        title: "Reserva cancelada",
        description: `${result.quantity_released || 0} unidades liberadas para o estoque`
      });

      // Recarregar reservas
      await fetchReservations();
      return true;
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      toast({
        variant: "destructive",
        title: "Erro ao cancelar reserva",
        description: "Não foi possível cancelar a reserva"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Estender prazo de reserva
  const extendReservation = async (
    reservationId: string, 
    additionalDays: number
  ): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);
      
      // @ts-expect-error - RPC function not in generated types
      const { data, error } = await supabase.rpc('extend_reservation', {
        p_reservation_id: reservationId,
        p_additional_days: additionalDays
      });

      if (error) {
        console.error('Erro ao estender reserva:', error);
        toast({
          variant: "destructive",
          title: "Erro ao estender reserva",
          description: error.message
        });
        return false;
      }

      const result = data as { success: boolean; error?: string; new_expires_at?: string };
      
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erro ao estender reserva",
          description: result.error || "Não foi possível estender o prazo"
        });
        return false;
      }

      const newDate = result.new_expires_at ? new Date(result.new_expires_at).toLocaleDateString('pt-BR') : '';
      
      toast({
        title: "Reserva estendida",
        description: `Prazo estendido por ${additionalDays} dias${newDate ? `. Nova validade: ${newDate}` : ''}`
      });

      // Recarregar reservas
      await fetchReservations();
      return true;
    } catch (error) {
      console.error('Erro ao estender reserva:', error);
      toast({
        variant: "destructive",
        title: "Erro ao estender reserva",
        description: "Não foi possível estender o prazo da reserva"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Separar peças reservadas
  const separateReservedParts = async (
    reservationId: string,
    quantityToSeparate: number
  ): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);
      
      // @ts-expect-error - RPC function not in generated types
      const { data, error } = await supabase.rpc('separate_reserved_parts', {
        p_reservation_id: reservationId,
        p_quantity_to_separate: quantityToSeparate
      });

      if (error) {
        console.error('Erro ao separar peças:', error);
        toast({
          variant: "destructive",
          title: "Erro ao separar peças",
          description: error.message
        });
        return false;
      }

      const result = data as { success: boolean; error?: string; quantity_separated?: number };
      
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erro ao separar peças",
          description: result.error || "Não foi possível separar as peças"
        });
        return false;
      }

      toast({
        title: "Peças separadas",
        description: `${result.quantity_separated} unidades separadas com sucesso`
      });

      // Recarregar reservas
      await fetchReservations();
      return true;
    } catch (error) {
      console.error('Erro ao separar peças:', error);
      toast({
        variant: "destructive",
        title: "Erro ao separar peças",
        description: "Não foi possível separar as peças reservadas"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar reservas ativas próximas do vencimento
  const getExpiringReservations = async (daysAhead: number = 7) => {
    if (!currentOrganization?.id) return [];

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysAhead);
      
      const { data, error } = await supabase
        .from('parts_reservations')
        .select(`
          *,
          part:parts_inventory(id, part_name, part_code),
          order:orders(id, order_number)
        `)
        .eq('org_id', currentOrganization.id)
        .in('reservation_status', ['reserved', 'partial', 'separated'])
        .lt('expires_at', expiryDate.toISOString())
        .not('expires_at', 'is', null)
        .order('expires_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar reservas expirando:', error);
        return [];
      }

      return (data || []) as PartReservation[];
    } catch (error) {
      console.error('Erro ao buscar reservas expirando:', error);
      return [];
    }
  };

  // Estatísticas de reservas
  const getReservationStats = async () => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('parts_reservations')
        .select('reservation_status, quantity_reserved, quantity_applied')
        .eq('org_id', currentOrganization.id)
        .neq('reservation_status', 'cancelled');

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return null;
      }

      const stats = {
        total: data.length,
        active: data.filter(r => ['reserved', 'partial', 'separated'].includes(r.reservation_status)).length,
        applied: data.filter(r => r.reservation_status === 'applied').length,
        expired: data.filter(r => r.reservation_status === 'expired').length,
        cancelled: data.filter(r => r.reservation_status === 'cancelled').length,
        totalQuantityReserved: data
          .filter(r => ['reserved', 'partial', 'separated'].includes(r.reservation_status))
          .reduce((sum, r) => sum + (r.quantity_reserved - (r.quantity_applied || 0)), 0),
        totalQuantityApplied: data
          .reduce((sum, r) => sum + (r.quantity_applied || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return null;
    }
  };

  // Carregar reservas ao montar o componente
  useEffect(() => {
    if (currentOrganization?.id) {
      fetchReservations();
    }
  }, [currentOrganization?.id]);

  return {
    reservations,
    loading,
    fetchReservations,
    reservePartsFromBudget,
    consumeReservedParts,
    separateReservedParts,
    cancelReservation,
    extendReservation,
    getExpiringReservations,
    getReservationStats
  };
};
