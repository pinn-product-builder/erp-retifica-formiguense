import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ContractService,
  ContractRow,
  ContractFormData,
} from '@/services/ContractService';

interface UseContractsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export function useContracts(opts: UseContractsOptions = {}) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();

  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchContracts = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setIsLoading(true);
    try {
      const result = await ContractService.list(currentOrganization.id, {
        page: opts.page ?? 1,
        pageSize: opts.pageSize ?? 10,
        search: opts.search,
        status: opts.status,
      });
      setContracts(result.data);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
    } catch {
      toast({ title: 'Erro ao carregar contratos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id, opts.page, opts.pageSize, opts.search, opts.status, toast]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const createContract = async (
    payload: ContractFormData & { items?: Array<{ part_code?: string; part_name: string; agreed_price: number; min_quantity?: number; max_quantity?: number }> },
  ): Promise<boolean> => {
    if (!currentOrganization?.id || !user?.id) return false;
    setIsSaving(true);
    try {
      await ContractService.create(currentOrganization.id, user.id, payload);
      toast({ title: 'Contrato criado com sucesso' });
      await fetchContracts();
      return true;
    } catch (err) {
      toast({
        title: 'Erro ao criar contrato',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateContract = async (contractId: string, payload: Partial<ContractFormData>): Promise<boolean> => {
    setIsSaving(true);
    try {
      await ContractService.update(contractId, payload);
      toast({ title: 'Contrato atualizado com sucesso' });
      await fetchContracts();
      return true;
    } catch (err) {
      toast({
        title: 'Erro ao atualizar contrato',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const renewContract = async (
    contractId: string,
    payload: { new_start_date: string; new_end_date: string; price_adjustment_pct?: number; new_discount?: number | null; notes?: string },
  ): Promise<boolean> => {
    if (!currentOrganization?.id || !user?.id) return false;
    setIsSaving(true);
    try {
      await ContractService.renew(contractId, user.id, currentOrganization.id, payload);
      toast({ title: 'Contrato renovado com sucesso' });
      await fetchContracts();
      return true;
    } catch (err) {
      toast({
        title: 'Erro ao renovar contrato',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const cancelContract = async (contractId: string): Promise<boolean> => {
    try {
      await ContractService.cancel(contractId);
      toast({ title: 'Contrato cancelado' });
      await fetchContracts();
      return true;
    } catch (err) {
      toast({
        title: 'Erro ao cancelar contrato',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    contracts,
    totalCount,
    totalPages,
    isLoading,
    isSaving,
    refresh: fetchContracts,
    createContract,
    updateContract,
    renewContract,
    cancelContract,
  };
}
