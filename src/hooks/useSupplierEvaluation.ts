import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface SupplierEvaluation {
  id: string;
  supplier_id: string;
  org_id: string;
  purchase_order_id?: string;
  delivery_rating: number;
  quality_rating: number;
  price_rating: number;
  service_rating: number;
  overall_rating: number;
  delivered_on_time: boolean;
  had_quality_issues: boolean;
  comments?: string;
  evaluated_by?: string;
  evaluated_at: string;
  created_at: string;
  
  // Relacionamentos
  supplier?: {
    id: string;
    name: string;
    rating: number;
  };
  purchase_order?: {
    id: string;
    po_number: string;
    order_date: string;
  };
  evaluator?: {
    id: string;
    email: string;
  };
}

export interface SupplierContact {
  id: string;
  supplier_id: string;
  org_id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnhancedSupplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  contact_person?: string;
  payment_terms?: string;
  delivery_days: number;
  rating: number;
  quality_rating: number;
  price_rating: number;
  on_time_delivery_rate: number;
  total_orders: number;
  categories: string[];
  brands: string[];
  is_active: boolean;
  is_preferred: boolean;
  last_purchase_date?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  contacts?: SupplierContact[];
  evaluations?: SupplierEvaluation[];
}

export interface EvaluationFormData {
  delivery_rating: number;
  quality_rating: number;
  price_rating: number;
  service_rating: number;
  delivered_on_time: boolean;
  had_quality_issues: boolean;
  comments?: string;
}

export interface SuggestedSupplier {
  supplier_id: string;
  supplier_name: string;
  rating: number;
  on_time_rate: number;
  last_purchase_date?: string;
  last_price?: number;
  delivery_days: number;
  is_preferred: boolean;
  score: number;
}

export const useSupplierEvaluation = () => {
  const [evaluations, setEvaluations] = useState<SupplierEvaluation[]>([]);
  const [suppliers, setSuppliers] = useState<EnhancedSupplier[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  // Buscar todas as avaliações
  const fetchEvaluations = async (supplierId?: string) => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);
      
      let query = supabase
        .from('supplier_evaluations' as any)
        .select(`
          *,
          supplier:suppliers(id, name, rating),
          purchase_order:purchase_orders(id, po_number, order_date)
        `)
        .eq('org_id', currentOrganization.id)
        .order('evaluated_at', { ascending: false });

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar avaliações:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar avaliações",
          description: error.message
        });
        return [];
      }

      setEvaluations((data || []) as unknown as SupplierEvaluation[]);
      return (data || []) as unknown as SupplierEvaluation[];
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar avaliações",
        description: "Não foi possível carregar as avaliações"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Buscar fornecedores com dados completos
  const fetchEnhancedSuppliers = async () => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('suppliers' as any)
        .select(`
          *,
          contacts:supplier_contacts(*),
          evaluations:supplier_evaluations(*)
        `)
        .eq('org_id', currentOrganization.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Erro ao buscar fornecedores:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar fornecedores",
          description: error.message
        });
        return [];
      }

      setSuppliers((data || []) as unknown as EnhancedSupplier[]);
      return (data || []) as unknown as EnhancedSupplier[];
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar fornecedores",
        description: "Não foi possível carregar os fornecedores"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Criar avaliação de fornecedor
  const createEvaluation = async (
    supplierId: string,
    purchaseOrderId: string,
    evaluationData: EvaluationFormData
  ): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('supplier_evaluations' as any)
        .insert({
          org_id: currentOrganization.id,
          supplier_id: supplierId,
          purchase_order_id: purchaseOrderId,
          ...evaluationData
        });

      if (error) {
        console.error('Erro ao criar avaliação:', error);
        toast({
          variant: "destructive",
          title: "Erro ao avaliar fornecedor",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Avaliação registrada",
        description: "A avaliação do fornecedor foi registrada com sucesso"
      });

      // Recarregar avaliações
      await fetchEvaluations();
      return true;
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      toast({
        variant: "destructive",
        title: "Erro ao avaliar fornecedor",
        description: "Não foi possível registrar a avaliação"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Adicionar contato ao fornecedor
  const addSupplierContact = async (
    supplierId: string,
    contactData: Omit<SupplierContact, 'id' | 'supplier_id' | 'org_id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('supplier_contacts' as any)
        .insert({
          org_id: currentOrganization.id,
          supplier_id: supplierId,
          ...contactData
        });

      if (error) {
        console.error('Erro ao adicionar contato:', error);
        toast({
          variant: "destructive",
          title: "Erro ao adicionar contato",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Contato adicionado",
        description: "O contato foi adicionado ao fornecedor com sucesso"
      });

      // Recarregar fornecedores
      await fetchEnhancedSuppliers();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar contato:', error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar contato",
        description: "Não foi possível adicionar o contato"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar fornecedor
  const updateSupplier = async (
    supplierId: string,
    updateData: Partial<EnhancedSupplier>
  ): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', supplierId)
        .eq('org_id', currentOrganization.id);

      if (error) {
        console.error('Erro ao atualizar fornecedor:', error);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar fornecedor",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Fornecedor atualizado",
        description: "As informações do fornecedor foram atualizadas com sucesso"
      });

      // Recarregar fornecedores
      await fetchEnhancedSuppliers();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar fornecedor",
        description: "Não foi possível atualizar o fornecedor"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sugerir fornecedores para peça
  const suggestSuppliersForPart = useCallback(async (
    partCode?: string,
    category?: string,
    limit: number = 3
  ): Promise<SuggestedSupplier[]> => {
    if (!currentOrganization?.id) return [];

    try {
      const { data, error } = await supabase.rpc('suggest_suppliers_for_part' as any, {
        p_org_id: currentOrganization.id,
        p_part_code: partCode,
        p_category: category,
        p_limit: limit
      });

      if (error) {
        console.error('Erro ao sugerir fornecedores:', error);
        toast({
          variant: "destructive",
          title: "Erro ao sugerir fornecedores",
          description: error.message
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao sugerir fornecedores:', error);
      toast({
        variant: "destructive",
        title: "Erro ao sugerir fornecedores",
        description: "Não foi possível obter sugestões de fornecedores"
      });
      return [];
    }
  }, [currentOrganization?.id, toast]);

  // Obter estatísticas de fornecedor
  const getSupplierStats = async (supplierId: string) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data: evaluations, error } = await supabase
        .from('supplier_evaluations' as any)
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('org_id', currentOrganization.id);

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return null;
      }

      const typedEvaluations = (evaluations || []) as any[];

      const stats = {
        totalEvaluations: typedEvaluations.length,
        averageRating: typedEvaluations.length > 0 
          ? typedEvaluations.reduce((sum, e) => sum + (e.overall_rating || 0), 0) / typedEvaluations.length 
          : 0,
        onTimeDeliveryRate: typedEvaluations.length > 0
          ? (typedEvaluations.filter(e => e.delivered_on_time).length / typedEvaluations.length) * 100
          : 0,
        qualityIssuesRate: typedEvaluations.length > 0
          ? (typedEvaluations.filter(e => e.had_quality_issues).length / typedEvaluations.length) * 100
          : 0,
        lastEvaluationDate: typedEvaluations.length > 0
          ? typedEvaluations.sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())[0].evaluated_at
          : null
      };

      return stats;
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return null;
    }
  };

  // Obter histórico de compras do fornecedor
  const getSupplierPurchaseHistory = async (supplierId: string) => {
    if (!currentOrganization?.id) return [];

    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          items:purchase_order_items(*)
        `)
        .eq('supplier_id', supplierId)
        .eq('org_id', currentOrganization.id)
        .order('order_date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  };

  // Marcar/desmarcar fornecedor como preferencial
  const togglePreferredSupplier = async (supplierId: string, isPreferred: boolean): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_preferred: isPreferred } as any)
        .eq('id', supplierId)
        .eq('org_id', currentOrganization.id);

      if (error) {
        console.error('Erro ao atualizar fornecedor preferencial:', error);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar fornecedor",
          description: error.message
        });
        return false;
      }

      toast({
        title: isPreferred ? "Fornecedor marcado como preferencial" : "Fornecedor desmarcado como preferencial",
        description: "A configuração foi atualizada com sucesso"
      });

      // Recarregar fornecedores
      await fetchEnhancedSuppliers();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar fornecedor preferencial:', error);
      return false;
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    if (currentOrganization?.id) {
      fetchEvaluations();
      fetchEnhancedSuppliers();
    }
  }, [currentOrganization?.id]);

  return {
    evaluations,
    suppliers,
    loading,
    fetchEvaluations,
    fetchEnhancedSuppliers,
    createEvaluation,
    addSupplierContact,
    updateSupplier,
    suggestSuppliersForPart,
    getSupplierStats,
    getSupplierPurchaseHistory,
    togglePreferredSupplier
  };
};
