import { useState, useCallback, useRef } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  materialRequisitionService,
  type MaterialRequisition,
  type MaterialRequisitionItem,
  type CreateMaterialRequisitionInput,
} from '@/services/MaterialRequisitionService';

export type { MaterialRequisition, MaterialRequisitionItem };

export function useMaterialRequisitions() {
  const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchRequisitions = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      setLoading(true);
      const data = await materialRequisitionService.listRequisitions(currentOrganization.id);
      setRequisitions(data);
    } catch {
      toastRef.current({
        title: 'Erro',
        description: 'Não foi possível carregar as requisições de materiais',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  const checkPartsAvailability = useCallback(
    async (items: { part_id?: string; part_code: string; part_name: string; quantity_required: number }[]) => {
      if (!currentOrganization?.id) return items.map((i) => ({ ...i, quantity_available: 0, quantity_to_purchase: i.quantity_required, status: 'compra_pendente' as const }));

      const partIds = items.filter((i) => i.part_id).map((i) => i.part_id as string);
      const availability = await materialRequisitionService.checkPartsAvailability(currentOrganization.id, partIds);

      return items.map((item) => {
        const avail = item.part_id ? availability[item.part_id] : undefined;
        const quantityAvailable = Math.min(avail?.quantity_available ?? 0, item.quantity_required);
        const quantityToPurchase = Math.max(0, item.quantity_required - quantityAvailable);

        let status: MaterialRequisitionItem['status'] = 'compra_pendente';
        if (quantityToPurchase === 0) status = 'disponivel';
        else if (quantityAvailable > 0) status = 'compra_pendente';

        return {
          ...item,
          quantity_available: quantityAvailable,
          quantity_reserved: 0,
          quantity_to_purchase: quantityToPurchase,
          status,
        };
      });
    },
    [currentOrganization?.id]
  );

  const createRequisition = useCallback(
    async (input: CreateMaterialRequisitionInput): Promise<MaterialRequisition | null> => {
      if (!currentOrganization?.id) return null;

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return null;

      try {
        setLoading(true);
        const created = await materialRequisitionService.create(currentOrganization.id, userId, input);
        toastRef.current({
          title: 'Requisição criada',
          description: `Requisição ${created.requisition_number} criada com sucesso`,
        });
        setRequisitions((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        console.error('Error creating material requisition:', err);
        toastRef.current({
          title: 'Erro',
          description: 'Não foi possível criar a requisição de materiais',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id]
  );

  const generatePurchaseNeeds = useCallback(
    async (requisitionId: string, items: MaterialRequisitionItem[]): Promise<number> => {
      if (!currentOrganization?.id) return 0;

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return 0;

      try {
        setLoading(true);
        const count = await materialRequisitionService.generatePurchaseNeeds(
          currentOrganization.id,
          userId,
          requisitionId,
          items
        );
        toastRef.current({
          title: 'Necessidades geradas',
          description: `${count} necessidade(s) de compra criada(s) com sucesso`,
        });
        return count;
      } catch (err) {
        console.error('Error generating purchase needs:', err);
        toastRef.current({
          title: 'Erro',
          description: 'Não foi possível gerar as necessidades de compra',
          variant: 'destructive',
        });
        return 0;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id]
  );

  const updateStatus = useCallback(
    async (id: string, status: MaterialRequisition['status']): Promise<boolean> => {
      try {
        await materialRequisitionService.updateStatus(id, status);
        setRequisitions((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
        return true;
      } catch {
        toastRef.current({
          title: 'Erro',
          description: 'Não foi possível atualizar o status',
          variant: 'destructive',
        });
        return false;
      }
    },
    []
  );

  return {
    requisitions,
    loading,
    fetchRequisitions,
    checkPartsAvailability,
    createRequisition,
    generatePurchaseNeeds,
    updateStatus,
  };
}
