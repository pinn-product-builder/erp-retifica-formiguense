import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Database } from '@/integrations/supabase/types';

export type EngineCategory = Database['public']['Tables']['engine_categories']['Row'];
export type EngineCategoryInsert = Database['public']['Tables']['engine_categories']['Insert'];
export type EngineCategoryUpdate = Database['public']['Tables']['engine_categories']['Update'];

interface UseEngineCategoriesOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useEngineCategories(options: UseEngineCategoriesOptions = {}) {
  const { page = 1, pageSize = 10, search = '' } = options;
  const [categories, setCategories] = useState<EngineCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  const fetchCategories = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('engine_categories')
        .select('*', { count: 'exact' })
        .eq('org_id', currentOrganization.id)
        .order('name', { ascending: true });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .range(from, to);

      if (error) throw error;

      setCategories(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, page, pageSize, search, toast]);

  const fetchAllCategories = useCallback(async () => {
    if (!currentOrganization?.id) return [];

    try {
      const { data, error } = await supabase
        .from('engine_categories')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar todas as categorias:', error);
      return [];
    }
  }, [currentOrganization?.id]);

  const createCategory = async (category: Omit<EngineCategoryInsert, 'id' | 'created_at' | 'updated_at' | 'org_id'>) => {
    if (!currentOrganization?.id) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('engine_categories')
        .insert({
          ...category,
          org_id: currentOrganization.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso'
      });

      await fetchCategories();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a categoria',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: string, updates: EngineCategoryUpdate) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('engine_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Categoria atualizada com sucesso'
      });

      await fetchCategories();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a categoria',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      setLoading(true);
      
      const { data: engineTypes, error: engineTypesError } = await supabase
        .from('engine_types')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (engineTypesError) throw engineTypesError;

      if (engineTypes && engineTypes.length > 0) {
        toast({
          title: 'Não é possível excluir',
          description: 'Esta categoria está sendo usada por tipos de motor cadastrados',
          variant: 'destructive'
        });
        return false;
      }

      const { error } = await supabase
        .from('engine_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Categoria excluída com sucesso'
      });

      await fetchCategories();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a categoria',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchCategories();
    }
  }, [currentOrganization?.id, fetchCategories]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    categories,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    fetchCategories,
    fetchAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
}

