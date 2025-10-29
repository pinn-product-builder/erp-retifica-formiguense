// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type PartsReservation = Database['public']['Tables']['parts_reservations']['Row'];
type OrderMaterial = Database['public']['Tables']['order_materials']['Row'];

export interface OrderMaterialItem {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  status: 'reserved' | 'partial' | 'separated' | 'applied' | 'used';
  source: 'reservation' | 'material';
  reserved_at?: string;
  separated_at?: string;
  applied_at?: string;
  used_at?: string;
  notes?: string;
}

export function useOrderMaterials(orderId: string) {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<OrderMaterialItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMaterials = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      // Buscar reservas de peças
      const { data: reservations, error: reservationsError } = await supabase
        .from('parts_reservations')
        .select('*')
        .eq('order_id', orderId)
        .order('reserved_at', { ascending: false });

      if (reservationsError) throw reservationsError;

      // Buscar materiais aplicados
      const { data: appliedMaterials, error: materialsError } = await supabase
        .from('order_materials')
        .select('*')
        .eq('order_id', orderId)
        .order('used_at', { ascending: false });

      if (materialsError) throw materialsError;

      // Combinar as duas listas
      const combinedMaterials: OrderMaterialItem[] = [];

      // Adicionar reservas
      reservations?.forEach(reservation => {
        combinedMaterials.push({
          id: reservation.id,
          part_code: reservation.part_code,
          part_name: reservation.part_name,
          quantity: reservation.quantity_reserved,
          unit_cost: Number(reservation.unit_cost || 0),
          total_cost: Number(reservation.total_reserved_cost || 0),
          status: reservation.reservation_status as unknown || 'reserved',
          source: 'reservation',
          reserved_at: reservation.reserved_at || undefined,
          separated_at: reservation.separated_at || undefined,
          applied_at: reservation.applied_at || undefined,
          notes: reservation.notes || undefined,
        });
      });

      // Adicionar materiais aplicados (que não vieram de reserva)
      appliedMaterials?.forEach(material => {
        // Evitar duplicatas (materiais que já estão como reserva aplicada)
        const existsInReservations = combinedMaterials.some(
          m => m.part_code === material.part_code && m.source === 'reservation' && m.status === 'applied'
        );

        if (!existsInReservations) {
          combinedMaterials.push({
            id: material.id,
            part_code: material.part_code || 'N/A',
            part_name: material.part_name,
            quantity: material.quantity,
            unit_cost: Number(material.unit_cost || 0),
            total_cost: Number(material.total_cost || 0),
            status: 'used',
            source: 'material',
            used_at: material.used_at?.toString() || undefined,
            notes: material.notes || undefined,
          });
        }
      });

      setMaterials(combinedMaterials);
    } catch (error) {
      console.error('Error fetching order materials:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar materiais da ordem',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsSeparated = async (reservationId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('parts_reservations')
        .update({
          reservation_status: 'separated',
          separated_at: new Date().toISOString(),
          separated_by: userId,
        })
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Peça marcada como separada',
      });

      fetchMaterials(); // Refresh
      return true;
    } catch (error) {
      console.error('Error marking as separated:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao marcar peça como separada',
        variant: 'destructive',
      });
      return false;
    }
  };

  const markAsApplied = async (reservationId: string, userId: string) => {
    try {
      // Primeiro buscar os dados da reserva
      const { data: reservation, error: fetchError } = await supabase
        .from('parts_reservations')
        .select('quantity_reserved, part_code, part_name, part_id, order_id, org_id')
        .eq('id', reservationId)
        .single();

      if (fetchError) throw fetchError;

      // Buscar a quantidade atual do estoque
      const { data: currentStock, error: stockFetchError } = await supabase
        .from('parts_inventory')
        .select('quantity, id')
        .eq('part_code', reservation.part_code)
        .eq('org_id', reservation.org_id)
        .single();

      if (stockFetchError) throw stockFetchError;

      // Validar se há estoque suficiente
      if (currentStock.quantity < reservation.quantity_reserved) {
        toast({
          title: 'Estoque Insuficiente',
          description: `Estoque disponível: ${currentStock.quantity}. Necessário: ${reservation.quantity_reserved}`,
          variant: 'destructive',
        });
        return false;
      }

      // Criar movimentação de saída (aplicação na OS)
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          org_id: reservation.org_id,
          part_id: reservation.part_id || currentStock.id,
          movement_type: 'saida',
          quantity: reservation.quantity_reserved,
          previous_quantity: currentStock.quantity,
          new_quantity: currentStock.quantity - reservation.quantity_reserved,
          order_id: reservation.order_id,
          reason: `Aplicação na OS - Peça: ${reservation.part_name}`,
          notes: `Peça aplicada na ordem de serviço. Reserva: ${reservationId}`,
          created_by: userId,
          requires_approval: false, // Aplicação não requer aprovação
          approval_status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          metadata: {
            reservation_id: reservationId,
            part_code: reservation.part_code,
            action_type: 'part_application'
          }
        });

      if (movementError) throw movementError;

      // Atualizar status da reserva
      const { error } = await supabase
        .from('parts_reservations')
        .update({
          reservation_status: 'applied',
          applied_at: new Date().toISOString(),
          applied_by: userId,
          quantity_applied: reservation.quantity_reserved,
        })
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Peça marcada como aplicada e movimentação registrada',
      });

      fetchMaterials(); // Refresh
      return true;
    } catch (error) {
      console.error('Error marking as applied:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao marcar peça como aplicada',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [orderId]);

  return {
    materials,
    loading,
    fetchMaterials,
    markAsSeparated,
    markAsApplied,
  };
}

