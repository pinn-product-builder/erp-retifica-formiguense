import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  SupplierProductService,
  type SupplierProduct,
  type SupplierProductFormData,
  type ValidSupplierPrice,
} from '@/services/SupplierProductService';

export function useSupplierProducts(supplierId?: string) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';

  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!supplierId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await SupplierProductService.getBySupplier(supplierId);
      setProducts(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createProduct = useCallback(async (
    formData: SupplierProductFormData
  ): Promise<SupplierProduct | null> => {
    if (!supplierId || !orgId) return null;
    try {
      const product = await SupplierProductService.create(supplierId, orgId, formData);
      toast.success('Produto vinculado ao fornecedor');
      await fetch();
      return product;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao vincular produto';
      toast.error(msg);
      return null;
    }
  }, [supplierId, orgId, fetch]);

  const updateProduct = useCallback(async (
    id: string,
    formData: Partial<SupplierProductFormData>
  ): Promise<SupplierProduct | null> => {
    try {
      const product = await SupplierProductService.update(id, formData);
      toast.success('Produto atualizado');
      await fetch();
      return product;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar produto';
      toast.error(msg);
      return null;
    }
  }, [fetch]);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      await SupplierProductService.delete(id);
      toast.success('Produto removido');
      await fetch();
    } catch (err) {
      toast.error('Erro ao remover produto');
    }
  }, [fetch]);

  const setPreferred = useCallback(async (
    product: SupplierProduct
  ): Promise<void> => {
    if (!supplierId || !orgId) return;
    try {
      await SupplierProductService.setPreferred(supplierId, product.part_code, orgId);
      toast.success('Fornecedor marcado como preferencial para esta peça');
      await fetch();
    } catch (err) {
      toast.error('Erro ao marcar preferencial');
    }
  }, [supplierId, orgId, fetch]);

  return {
    products,
    isLoading,
    error,
    actions: {
      createProduct,
      updateProduct,
      deleteProduct,
      setPreferred,
      refresh: fetch,
    },
  };
}

export function useSuppliersForPart(partCode?: string) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';

  const [suppliers, setSuppliers] = useState<ValidSupplierPrice[]>([]);
  const [isLoading, setLoading]   = useState(false);

  useEffect(() => {
    if (!partCode || !orgId) return;
    setLoading(true);
    SupplierProductService.getSuppliersForPart(partCode, orgId)
      .then(setSuppliers)
      .catch(() => toast.error('Erro ao buscar fornecedores para a peça'))
      .finally(() => setLoading(false));
  }, [partCode, orgId]);

  return { suppliers, isLoading };
}
