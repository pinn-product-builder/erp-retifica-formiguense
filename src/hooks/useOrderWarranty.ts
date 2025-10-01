import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type OrderWarranty = Database['public']['Tables']['order_warranties']['Row'];

export function useOrderWarranty(orderId: string) {
  const { toast } = useToast();
  const [warranties, setWarranties] = useState<OrderWarranty[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWarranties = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_warranties')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWarranties(data || []);
    } catch (error) {
      console.error('Error fetching warranties:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar informações de garantia',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isWarrantyActive = (warranty: OrderWarranty): boolean => {
    if (!warranty.is_active) return false;
    
    const today = new Date();
    const endDate = new Date(warranty.end_date);
    
    return today <= endDate;
  };

  const getDaysRemaining = (warranty: OrderWarranty): number => {
    const today = new Date();
    const endDate = new Date(warranty.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const createWarranty = async (warrantyData: {
    warranty_type: string;
    start_date: string;
    end_date: string;
    terms?: string;
  }) => {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('org_id')
        .eq('id', orderId)
        .single();

      const { error } = await supabase
        .from('order_warranties')
        .insert({
          order_id: orderId,
          warranty_type: warrantyData.warranty_type,
          start_date: warrantyData.start_date,
          end_date: warrantyData.end_date,
          terms: warrantyData.terms || 'Garantia padrão conforme contrato',
          is_active: true,
          org_id: order?.org_id,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Garantia criada com sucesso',
      });

      fetchWarranties(); // Refresh
      return true;
    } catch (error) {
      console.error('Error creating warranty:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar garantia',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deactivateWarranty = async (warrantyId: string) => {
    try {
      const { error } = await supabase
        .from('order_warranties')
        .update({ is_active: false })
        .eq('id', warrantyId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Garantia desativada',
      });

      fetchWarranties(); // Refresh
      return true;
    } catch (error) {
      console.error('Error deactivating warranty:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desativar garantia',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, [orderId]);

  return {
    warranties,
    loading,
    fetchWarranties,
    isWarrantyActive,
    getDaysRemaining,
    createWarranty,
    deactivateWarranty,
  };
}

