import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

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
  result: unknown;
  notes?: string;
}

export interface TaxRateTable {
  id?: string;
  tax_type_id: string;
  classification_id?: string;
  jurisdiction_code: string;
  rate: number;
  base_reduction?: number;
  valid_from: string;
  valid_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyFiscalSetting {
  id?: string;
  org_name: string;
  cnpj?: string;
  state?: string;
  municipality_code?: string;
  regime_id: string;
  effective_from: string;
  effective_to?: string;
  created_at?: string;
  updated_at?: string;
}

export const useFiscal = () => {
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);

  const handleError = (error: unknown, message: string) => {
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

  const createObligation = async (obligationData: {
    obligation_kind_id: string;
    period_month: number;
    period_year: number;
  }) => {
    try {
      setLoading(true);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Usuário não autenticado');
        return null;
      }

      const { data, error } = await supabase
        .from('obligations')
        .insert([{
          ...obligationData,
          status: 'rascunho', // Default status for new obligations
          created_by: user.user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Obrigação criada com sucesso');
      return data;
    } catch (error) {
      console.error('Error creating obligation:', error);
      toast.error('Erro ao criar obrigação: ' + error.message);
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
        result: result as Json
      };

      const { data, error } = await supabase
        .from('tax_calculations')
        .insert([taxCalculation] as any)
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

  // Tax Rate Tables
  const getTaxRateTable = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_rate_tables')
        .select(`
          *,
          tax_types (name, code),
          fiscal_classifications (description)
        `)
        .order('tax_type_id');

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar tabelas de alíquotas');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createTaxRateTable = async (rateTable: TaxRateTable) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_rate_tables')
        .insert([rateTable])
        .select()
        .single();

      if (error) throw error;
      toast.success('Tabela de alíquotas criada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar tabela de alíquotas');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTaxRateTable = async (id: string, updates: Partial<TaxRateTable>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_rate_tables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Tabela de alíquotas atualizada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao atualizar tabela de alíquotas');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTaxRateTable = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tax_rate_tables')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tabela de alíquotas excluída com sucesso');
      return true;
    } catch (error) {
      handleError(error, 'Erro ao excluir tabela de alíquotas');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Company Fiscal Settings
  const getCompanyFiscalSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_fiscal_settings')
        .select(`
          *,
          tax_regimes (name, code)
        `)
        .order('effective_from', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar configurações fiscais');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createCompanyFiscalSetting = async (setting: CompanyFiscalSetting) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_fiscal_settings')
        .insert([setting])
        .select()
        .single();

      if (error) throw error;
      toast.success('Configuração fiscal criada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar configuração fiscal');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyFiscalSetting = async (id: string, updates: Partial<CompanyFiscalSetting>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_fiscal_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Configuração fiscal atualizada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao atualizar configuração fiscal');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Tax Calculation Analysis
  const getTaxCalculationsWithSummary = async (period?: { month: number; year: number }) => {
    try {
      setLoading(true);
      let query = supabase.from('tax_calculations').select('*');
      
      if (period) {
        const startDate = `${period.year}-${period.month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(period.year, period.month, 0).toISOString().split('T')[0];
        query = query.gte('calculated_at', startDate).lte('calculated_at', endDate);
      }

      const { data, error } = await query.order('calculated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao buscar cálculos de impostos');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getTaxCalculationsSummary = async (period: { month: number; year: number }) => {
    try {
      const calculations = await getTaxCalculationsWithSummary(period);
      
      const summary = {
        totalOperations: calculations.length,
        totalAmount: calculations.reduce((sum, calc) => sum + (calc.amount || 0), 0),
        totalTaxes: 0,
        taxBreakdown: {} as Record<string, { total: number; operations: number }>
      };

      calculations.forEach(calc => {
        if (calc.result && typeof calc.result === 'object' && 'taxes' in calc.result && Array.isArray(calc.result.taxes)) {
          calc.result.taxes.forEach((tax: Json) => {
            summary.totalTaxes += (tax as Record<string, unknown>).amount as number|| 0;
            if (!summary.taxBreakdown[(tax as Record<string, unknown>).tax_type as string]) {
              summary.taxBreakdown[(tax as Record<string, unknown>).tax_type as string] = { total: 0, operations: 0 };
            }
            summary.taxBreakdown[(tax as Record<string, unknown>).tax_type as string].total += (tax as Record<string, unknown>).amount as number|| 0;
            summary.taxBreakdown[(tax as Record<string, unknown>).tax_type as string].operations += 1;
          });
        }
      });

      return summary;
    } catch (error) {
      handleError(error, 'Erro ao calcular resumo de impostos');
      return null;
    }
  };

  // Tax Ledger Management
  const getTaxLedgers = async (period?: { month: number; year: number }) => {
    try {
      setLoading(true);
      let query = supabase.from('tax_ledgers').select('*, tax_types(name), tax_regimes(name)');
      
      if (period) {
        query = query.eq('period_month', period.month).eq('period_year', period.year);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao buscar livros fiscais');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateTaxLedger = async (id: string, updates: unknown) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tax_ledgers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Livro fiscal atualizado com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao atualizar livro fiscal');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Period Management
  const closeTaxPeriod = async (period: { month: number; year: number }) => {
    try {
      setLoading(true);
      
      // First, get all calculations for the period and compute ledger entries
      const summary = await getTaxCalculationsSummary(period);
      if (!summary) throw new Error('Erro ao calcular resumo do período');

      // Get the first calculation to extract regime_id
      const { data: firstCalculation } = await supabase
        .from('tax_calculations')
        .select('regime_id')
        .limit(1)
        .single();

      const defaultRegimeId = firstCalculation?.regime_id || '';

      // Update or create ledger entries for each tax type
      for (const [taxType, breakdown] of Object.entries(summary.taxBreakdown)) {
        const { data: taxTypeData } = await supabase
          .from('tax_types')
          .select('id')
          .eq('name', taxType)
          .single();

        if (taxTypeData) {
          const { data: existingLedger } = await supabase
            .from('tax_ledgers')
            .select('id')
            .eq('period_month', period.month)
            .eq('period_year', period.year)
            .eq('tax_type_id', taxTypeData.id)
            .single();

          const ledgerData = {
            period_month: period.month,
            period_year: period.year,
            tax_type_id: taxTypeData.id,
            regime_id: defaultRegimeId,
            total_debits: breakdown.total,
            total_credits: 0,
            balance_due: breakdown.total,
            status: 'fechado' as const
          };

          if (existingLedger) {
            await supabase
              .from('tax_ledgers')
              .update(ledgerData)
              .eq('id', existingLedger.id);
          } else {
            await supabase.from('tax_ledgers').insert(ledgerData);
          }
        }
      }

      toast.success('Período fiscal fechado com sucesso');
      return true;
    } catch (error) {
      handleError(error, 'Erro ao fechar período fiscal');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reopenTaxPeriod = async (period: { month: number; year: number }) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tax_ledgers')
        .update({ status: 'aberto' })
        .eq('period_month', period.month)
        .eq('period_year', period.year);

      if (error) throw error;
      toast.success('Período fiscal reaberto com sucesso');
      return true;
    } catch (error) {
      handleError(error, 'Erro ao reabrir período fiscal');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Export functionality
  const exportTaxCalculationsCSV = (calculations: Array<Record<string, unknown>>) => {
    const csvHeaders = ['Data', 'Operação', 'Valor Base', 'Total Impostos', 'Detalhes'];
    const csvRows = calculations.map((calc :Record<string, unknown>) => [
      new Date(calc.calculated_at as string).toLocaleDateString('pt-BR'),
      calc.operation,
      (calc.amount as number)?.toFixed(2)  || '0.00',
      ((calc.result as Record<string, unknown>)?.total_taxes as number)?.toFixed(2) || '0.00',
      ((calc.result as Record<string, unknown>)?.taxes as unknown[])?.map((t: Record<string, unknown>) => `${t.tax_type}: ${(t.amount as number)?.toFixed(2)}`).join('; ') || ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calculos_fiscais_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Obligation Files Management
  const getObligationFiles = async (obligationId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('obligation_files')
        .select('*')
        .eq('obligation_id', obligationId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar arquivos da obrigação');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const generateObligationFile = async (params: {
    obligationId: string;
    fileType?: string;
    format?: 'csv' | 'json';
  }) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('generate-obligation-file', {
        body: {
          obligationId: params.obligationId,
          fileType: params.fileType || 'TAX_SUMMARY',
          format: params.format || 'csv'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Arquivo gerado com sucesso');
        return data.file;
      } else {
        throw new Error(data?.error || 'Erro ao gerar arquivo');
      }
    } catch (error) {
      handleError(error, 'Erro ao gerar arquivo da obrigação');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const downloadObligationFile = async (filePath: string, fileName: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.storage
        .from('fiscal-outputs')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado com sucesso');
      return true;
    } catch (error) {
      handleError(error, 'Erro ao fazer download do arquivo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteObligationFile = async (fileId: string, filePath: string) => {
    try {
      setLoading(true);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('fiscal-outputs')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase
        .from('obligation_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      
      toast.success('Arquivo excluído com sucesso');
      return true;
    } catch (error) {
      handleError(error, 'Erro ao excluir arquivo');
      return false;
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
    getTaxCalculations,
    getTaxCalculationsWithSummary,
    getTaxCalculationsSummary,
    exportTaxCalculationsCSV,
    // Tax Rate Tables
    getTaxRateTable,
    createTaxRateTable,
    updateTaxRateTable,
    deleteTaxRateTable,
    // Company Fiscal Settings
    getCompanyFiscalSettings,
    createCompanyFiscalSetting,
    updateCompanyFiscalSetting,
    // Tax Ledgers
    getTaxLedgers,
    updateTaxLedger,
    // Period Management
    closeTaxPeriod,
    reopenTaxPeriod,
    // Obligation Files
    getObligationFiles,
    generateObligationFile,
    downloadObligationFile,
    deleteObligationFile
  };
};
