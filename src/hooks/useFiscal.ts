import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaxType {
  id?: string;
  code: string;
  name: string;
  jurisdiction: 'federal' | 'estadual' | 'municipal';
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaxRegime {
  id?: string;
  code: string;
  name: string;
  description?: string;
  effective_from?: string;
  effective_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FiscalClassification {
  id?: string;
  type: 'produto' | 'servico';
  ncm_code?: string;
  service_code?: string;
  cest?: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaxRule {
  id?: string;
  regime_id: string;
  tax_type_id: string;
  operation: 'venda' | 'compra' | 'prestacao_servico';
  origin_uf?: string;
  destination_uf?: string;
  classification_id?: string;
  calc_method: 'percentual' | 'valor_fixo' | 'mva' | 'reducao_base' | 'substituicao_tributaria' | 'isento' | 'nao_incidencia';
  rate?: number;
  base_reduction?: number;
  is_active: boolean;
  priority: number;
  valid_from: string;
  valid_to?: string;
  formula?: string;
}

export interface ObligationKind {
  id?: string;
  code: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Obligation {
  id?: string;
  obligation_kind_id: string;
  period_month: number;
  period_year: number;
  status: 'rascunho' | 'gerado' | 'validado' | 'enviado' | 'erro';
  generated_file_path?: string;
  protocol?: string;
  started_at?: string;
  finished_at?: string;
  message?: string;
}

export interface TaxCalculationRequest {
  regime_id: string;
  operation: 'venda' | 'compra' | 'prestacao_servico';
  classification_id?: string;
  amount: number;
  origin_uf?: string;
  destination_uf?: string;
  notes?: string;
}

export interface TaxCalculation {
  id?: string;
  order_id?: string;
  operation: 'venda' | 'compra' | 'prestacao_servico';
  classification_id?: string;
  regime_id: string;
  amount: number;
  origin_uf?: string;
  destination_uf?: string;
  result: any;
  notes?: string;
}

export const useFiscal = () => {
  const [loading, setLoading] = useState(false);

  const handleError = (error: any, message: string) => {
    console.error(message, error);
    toast.error(message);
    setLoading(false);
  };

  // Tax Types
  const getTaxTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar tipos de tributo');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createTaxType = async (taxType: TaxType) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_types')
        .insert([taxType])
        .select()
        .single();

      if (error) throw error;
      toast.success('Tipo de tributo criado com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar tipo de tributo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTaxType = async (id: string, updates: Partial<TaxType>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Tipo de tributo atualizado com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao atualizar tipo de tributo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTaxType = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tax_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tipo de tributo excluído com sucesso');
      return true;
    } catch (error) {
      handleError(error, 'Erro ao excluir tipo de tributo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Tax Regimes
  const getTaxRegimes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_regimes')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar regimes tributários');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createTaxRegime = async (regime: TaxRegime) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_regimes')
        .insert([regime])
        .select()
        .single();

      if (error) throw error;
      toast.success('Regime tributário criado com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar regime tributário');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTaxRegime = async (id: string, updates: Partial<TaxRegime>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_regimes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Regime tributário atualizado com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao atualizar regime tributário');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTaxRegime = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tax_regimes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Regime tributário excluído com sucesso');
      return true;
    } catch (error) {
      handleError(error, 'Erro ao excluir regime tributário');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fiscal Classifications
  const getFiscalClassifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fiscal_classifications')
        .select('*')
        .order('description');

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar classificações fiscais');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createFiscalClassification = async (classification: FiscalClassification) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fiscal_classifications')
        .insert([classification])
        .select()
        .single();

      if (error) throw error;
      toast.success('Classificação fiscal criada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar classificação fiscal');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Tax Rules
  const getTaxRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_rules')
        .select(`
          *,
          tax_regimes (name),
          tax_types (name),
          fiscal_classifications (description)
        `)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar regras fiscais');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createTaxRule = async (rule: TaxRule) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_rules')
        .insert([rule])
        .select()
        .single();

      if (error) throw error;
      toast.success('Regra fiscal criada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar regra fiscal');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Obligation Kinds
  const getObligationKinds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('obligation_kinds')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar tipos de obrigação');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createObligationKind = async (kind: ObligationKind) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('obligation_kinds')
        .insert([kind])
        .select()
        .single();

      if (error) throw error;
      toast.success('Tipo de obrigação criado com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar tipo de obrigação');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Obligations
  const getObligations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('obligations')
        .select(`
          *,
          obligation_kinds (name, code)
        `)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar obrigações');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createObligation = async (obligation: Obligation) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('obligations')
        .insert([obligation])
        .select()
        .single();

      if (error) throw error;
      toast.success('Obrigação criada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar obrigação');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Tax Calculations
  const calculateTax = async (calculation: TaxCalculationRequest) => {
    try {
      setLoading(true);
      
      // Buscar regras aplicáveis
      const { data: rules, error: rulesError } = await supabase
        .from('tax_rules')
        .select(`
          *,
          tax_types (*)
        `)
        .eq('regime_id', calculation.regime_id)
        .eq('operation', calculation.operation)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString().split('T')[0])
        .or(`valid_to.is.null,valid_to.gte.${new Date().toISOString().split('T')[0]}`)
        .order('priority');

      if (rulesError) throw rulesError;

      // Calcular impostos baseado nas regras
      const taxResults = rules?.map(rule => {
        let taxAmount = 0;
        let taxBase = calculation.amount;

        // Aplicar redução de base se houver
        if (rule.base_reduction) {
          taxBase = calculation.amount * (1 - rule.base_reduction / 100);
        }

        // Calcular imposto baseado no método
        switch (rule.calc_method) {
          case 'percentual':
            taxAmount = taxBase * ((rule.rate || 0) / 100);
            break;
          case 'valor_fixo':
            taxAmount = rule.rate || 0;
            break;
          case 'isento':
          case 'nao_incidencia':
            taxAmount = 0;
            break;
          default:
            taxAmount = taxBase * ((rule.rate || 0) / 100);
        }

        return {
          tax_type: rule.tax_types?.name || 'Desconhecido',
          tax_code: rule.tax_types?.code || '',
          base: taxBase,
          rate: rule.rate || 0,
          amount: taxAmount,
          calc_method: rule.calc_method,
          base_reduction: rule.base_reduction || 0
        };
      }) || [];

      const totalTax = taxResults.reduce((sum, tax) => sum + tax.amount, 0);

      const result = {
        taxes: taxResults,
        total_amount: calculation.amount,
        total_tax: totalTax,
        net_amount: calculation.amount - totalTax,
        calculated_at: new Date().toISOString()
      };

      // Salvar cálculo no banco
      const taxCalculation: TaxCalculation = {
        ...calculation,
        result
      };

      const { data, error } = await supabase
        .from('tax_calculations')
        .insert([taxCalculation])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Cálculo de impostos realizado com sucesso');
      return { data, result };
    } catch (error) {
      handleError(error, 'Erro ao calcular impostos');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getTaxCalculations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_calculations')
        .select(`
          *,
          tax_regimes (name),
          fiscal_classifications (description),
          orders (order_number)
        `)
        .order('calculated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar cálculos de impostos');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    // Tax Types
    getTaxTypes,
    createTaxType,
    updateTaxType,
    deleteTaxType,
    // Tax Regimes
    getTaxRegimes,
    createTaxRegime,
    updateTaxRegime,
    deleteTaxRegime,
    // Fiscal Classifications
    getFiscalClassifications,
    createFiscalClassification,
    // Tax Rules
    getTaxRules,
    createTaxRule,
    // Obligation Kinds
    getObligationKinds,
    createObligationKind,
    // Obligations
    getObligations,
    createObligation,
    // Tax Calculations
    calculateTax,
    getTaxCalculations
  };
};
