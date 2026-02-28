import { supabase } from '@/integrations/supabase/client';
import type { PaginatedResult } from './InventoryService';

export interface AccountingConfig {
  id: string;
  org_id: string;
  movement_type: 'entrada' | 'saida' | 'ajuste' | 'baixa' | 'writedown';
  reason_id: string | null;
  debit_account: string;
  credit_account: string;
  description_template: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AccountingEntry {
  id: string;
  org_id: string;
  movement_id: string | null;
  entry_date: string;
  competencia: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  description: string | null;
  reference: string | null;
  status: 'draft' | 'posted' | 'reversed';
  posted_at: string | null;
  posted_by: string | null;
  reversed_at: string | null;
  reversed_by: string | null;
  created_at: string;
}

export interface StockProvision {
  id: string;
  org_id: string;
  part_id: string;
  batch_id: string | null;
  provision_type: 'vrl_writedown' | 'obsolescence' | 'damage';
  provision_date: string;
  cost_before: number;
  vrl: number;
  provision_amount: number;
  reversal_amount: number;
  evidence: unknown | null;
  approved_by: string | null;
  approved_at: string | null;
  accounting_entry_id: string | null;
  status: 'pending' | 'approved' | 'reversed';
  created_at: string;
}

export interface EntryFilters {
  status?: AccountingEntry['status'] | 'todos';
  movement_type?: AccountingConfig['movement_type'];
  search?: string;
  date_from?: string;
  date_to?: string;
}

export const DEFAULT_ACCOUNTING_CONFIGS: Omit<AccountingConfig, 'id' | 'org_id' | 'created_at'>[] = [
  {
    movement_type: 'entrada',
    reason_id: null,
    debit_account: '1.1.3.01 Estoque de Mercadorias',
    credit_account: '2.1.1.01 Fornecedores',
    description_template: 'Entrada de estoque - {{part_name}}',
    is_active: true,
  },
  {
    movement_type: 'saida',
    reason_id: null,
    debit_account: '3.1.1.01 CMV - Custo das Mercadorias Vendidas',
    credit_account: '1.1.3.01 Estoque de Mercadorias',
    description_template: 'Saída de estoque - {{part_name}}',
    is_active: true,
  },
  {
    movement_type: 'ajuste',
    reason_id: null,
    debit_account: '3.2.1.01 Perdas com Estoque',
    credit_account: '1.1.3.01 Estoque de Mercadorias',
    description_template: 'Ajuste de inventário - {{part_name}}',
    is_active: true,
  },
  {
    movement_type: 'writedown',
    reason_id: null,
    debit_account: '3.2.2.01 Perda por Redução ao VRL',
    credit_account: '1.1.3.99 (-) Provisão p/ Redução ao VRL',
    description_template: 'Write-down VRL - {{part_name}}',
    is_active: true,
  },
];

class StockAccountingService {
  async listConfigs(orgId: string): Promise<AccountingConfig[]> {
    const { data, error } = await supabase
      .from('stock_accounting_config' as never)
      .select('*')
      .eq('org_id', orgId)
      .order('movement_type');

    if (error) throw error;
    return (data ?? []) as AccountingConfig[];
  }

  async upsertConfig(orgId: string, config: Omit<AccountingConfig, 'id' | 'org_id' | 'created_at'>): Promise<AccountingConfig> {
    const { data, error } = await supabase
      .from('stock_accounting_config' as never)
      .upsert({ ...config, org_id: orgId } as never, {
        onConflict: 'org_id,movement_type',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AccountingConfig;
  }

  async initDefaultConfigs(orgId: string): Promise<void> {
    const existing = await this.listConfigs(orgId);
    if (existing.length > 0) return;

    const { error } = await supabase
      .from('stock_accounting_config' as never)
      .insert(DEFAULT_ACCOUNTING_CONFIGS.map((c) => ({ ...c, org_id: orgId })) as never);

    if (error) throw error;
  }

  async listEntries(
    orgId: string,
    filters?: EntryFilters,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResult<AccountingEntry>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('stock_accounting_entries' as never)
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('entry_date', { ascending: false })
      .range(from, to);

    if (filters?.status && filters.status !== 'todos') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%,reference.ilike.%${filters.search}%`);
    }

    if (filters?.date_from) {
      query = query.gte('entry_date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('entry_date', filters.date_to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    return {
      data: (data ?? []) as AccountingEntry[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createEntry(orgId: string, entry: Omit<AccountingEntry, 'id' | 'org_id' | 'created_at'>): Promise<AccountingEntry> {
    const { data, error } = await supabase
      .from('stock_accounting_entries' as never)
      .insert({ ...entry, org_id: orgId } as never)
      .select()
      .single();

    if (error) throw error;
    return data as AccountingEntry;
  }

  async postEntry(entryId: string, postedBy: string): Promise<void> {
    const { error } = await supabase
      .from('stock_accounting_entries' as never)
      .update({ status: 'posted', posted_at: new Date().toISOString(), posted_by: postedBy } as never)
      .eq('id', entryId);

    if (error) throw error;
  }

  async reverseEntry(entryId: string, reversedBy: string): Promise<void> {
    const { error } = await supabase
      .from('stock_accounting_entries' as never)
      .update({ status: 'reversed', reversed_at: new Date().toISOString(), reversed_by: reversedBy } as never)
      .eq('id', entryId);

    if (error) throw error;
  }

  async listProvisions(
    orgId: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResult<StockProvision>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('stock_provisions' as never)
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('provision_date', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const total = count ?? 0;
    return {
      data: (data ?? []) as StockProvision[],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createProvision(orgId: string, provision: Omit<StockProvision, 'id' | 'org_id' | 'created_at'>): Promise<StockProvision> {
    const { data, error } = await supabase
      .from('stock_provisions' as never)
      .insert({ ...provision, org_id: orgId } as never)
      .select()
      .single();

    if (error) throw error;
    return data as StockProvision;
  }

  async approveProvision(provisionId: string, approvedBy: string): Promise<void> {
    const { error } = await supabase
      .from('stock_provisions' as never)
      .update({ status: 'approved', approved_by: approvedBy, approved_at: new Date().toISOString() } as never)
      .eq('id', provisionId);

    if (error) throw error;
  }

  async getEntriesStats(orgId: string): Promise<{
    total: number;
    draft: number;
    posted: number;
    reversed: number;
    total_amount: number;
  }> {
    const { data, error } = await supabase
      .from('stock_accounting_entries' as never)
      .select('status, amount')
      .eq('org_id', orgId);

    if (error) throw error;
    const entries = (data ?? []) as Pick<AccountingEntry, 'status' | 'amount'>[];

    return {
      total: entries.length,
      draft: entries.filter((e) => e.status === 'draft').length,
      posted: entries.filter((e) => e.status === 'posted').length,
      reversed: entries.filter((e) => e.status === 'reversed').length,
      total_amount: entries
        .filter((e) => e.status === 'posted')
        .reduce((s, e) => s + e.amount, 0),
    };
  }
}

export const stockAccountingService = new StockAccountingService();
