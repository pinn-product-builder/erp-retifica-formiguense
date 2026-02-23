import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  SupplierService,
  type Supplier,
  type SupplierFilters,
  type SupplierFormData,
  type PaginatedSuppliers,
} from '@/services/SupplierService';

const PAGE_SIZE = 10;

export function useSuppliers(initialFilters: SupplierFilters = {}) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';

  const [data, setData]       = useState<PaginatedSuppliers>({
    data: [], count: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0,
  });
  const [filters, setFilters]   = useState<SupplierFilters>(initialFilters);
  const [page, setPage]         = useState(1);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async (
    currentPage: number,
    currentFilters: SupplierFilters
  ) => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await SupplierService.getSuppliers(orgId, currentFilters, currentPage, PAGE_SIZE);
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar fornecedores';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetch(page, filters);
  }, [fetch, page, filters]);

  const applyFilters = useCallback((newFilters: SupplierFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const createSupplier = useCallback(async (formData: SupplierFormData): Promise<Supplier | null> => {
    if (!orgId) return null;

    const isDuplicate = await SupplierService.checkDuplicateCNPJ(formData.document, orgId);
    if (isDuplicate) {
      toast.error('CNPJ já cadastrado para outro fornecedor');
      return null;
    }

    try {
      const { data: { user } } = await import('@/integrations/supabase/client')
        .then(m => m.supabase.auth.getUser());
      const supplier = await SupplierService.createSupplier(formData, orgId, user?.id);
      toast.success(`Fornecedor ${supplier.code} cadastrado com sucesso`);
      await fetch(page, filters);
      return supplier;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar fornecedor';
      toast.error(msg);
      return null;
    }
  }, [orgId, fetch, page, filters]);

  const updateSupplier = useCallback(async (
    id: string,
    formData: Partial<SupplierFormData>
  ): Promise<Supplier | null> => {
    if (!orgId) return null;

    if (formData.document) {
      const isDuplicate = await SupplierService.checkDuplicateCNPJ(formData.document, orgId, id);
      if (isDuplicate) {
        toast.error('CNPJ já cadastrado para outro fornecedor');
        return null;
      }
    }

    try {
      const supplier = await SupplierService.updateSupplier(id, orgId, formData);
      toast.success('Fornecedor atualizado com sucesso');
      await fetch(page, filters);
      return supplier;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar fornecedor';
      toast.error(msg);
      return null;
    }
  }, [orgId, fetch, page, filters]);

  const toggleActive = useCallback(async (supplier: Supplier): Promise<void> => {
    if (!orgId) return;
    try {
      await SupplierService.toggleActive(supplier.id, orgId, !supplier.is_active);
      toast.success(supplier.is_active ? 'Fornecedor inativado' : 'Fornecedor ativado');
      await fetch(page, filters);
    } catch (err) {
      toast.error('Erro ao alterar status do fornecedor');
    }
  }, [orgId, fetch, page, filters]);

  const blockSupplier = useCallback(async (id: string, reason: string): Promise<void> => {
    if (!orgId) return;
    try {
      await SupplierService.blockSupplier(id, orgId, reason);
      toast.success('Fornecedor bloqueado');
      await fetch(page, filters);
    } catch (err) {
      toast.error('Erro ao bloquear fornecedor');
    }
  }, [orgId, fetch, page, filters]);

  const unblockSupplier = useCallback(async (id: string): Promise<void> => {
    if (!orgId) return;
    try {
      await SupplierService.unblockSupplier(id, orgId);
      toast.success('Fornecedor desbloqueado');
      await fetch(page, filters);
    } catch (err) {
      toast.error('Erro ao desbloquear fornecedor');
    }
  }, [orgId, fetch, page, filters]);

  const refresh = useCallback(() => fetch(page, filters), [fetch, page, filters]);

  return {
    suppliers:   data.data,
    count:       data.count,
    totalPages:  data.totalPages,
    page,
    pageSize:    PAGE_SIZE,
    isLoading,
    error,
    filters,
    actions: {
      applyFilters,
      goToPage,
      createSupplier,
      updateSupplier,
      toggleActive,
      blockSupplier,
      unblockSupplier,
      refresh,
    },
  };
}

export function useSuppliersList() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setLoading]   = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    SupplierService.getAllActive(orgId)
      .then(setSuppliers)
      .catch(() => toast.error('Erro ao carregar fornecedores'))
      .finally(() => setLoading(false));
  }, [orgId]);

  return { suppliers, isLoading };
}
