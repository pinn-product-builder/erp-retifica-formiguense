import { supabase } from '@/integrations/supabase/client';

export interface SupplierCredit {
  id:               string;
  supplier_id:      string;
  origin_type:      'return' | 'bonus' | 'discount' | 'other';
  origin_id:        string | null;
  description:      string | null;
  original_amount:  number;
  used_amount:      number;
  status:           'available' | 'partially_used' | 'used' | 'expired';
  expires_at:       string | null;
  org_id:           string;
  created_at:       string;
  supplier?:        { name: string };
}

const db = () => supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> };

export const SupplierCreditService = {
  async listByOrg(orgId: string): Promise<SupplierCredit[]> {
    const { data, error } = await db().from('supplier_credits')
      .select('*, supplier:suppliers(name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(200) as unknown as { data: SupplierCredit[] | null; error: unknown };
    if (error) throw error;
    return data ?? [];
  },

  async listBySupplier(supplierId: string, orgId: string): Promise<SupplierCredit[]> {
    const { data, error } = await db().from('supplier_credits')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('org_id', orgId)
      .not('status', 'in', '(used,expired)')
      .order('expires_at', { ascending: true }) as unknown as { data: SupplierCredit[] | null; error: unknown };
    if (error) throw error;
    return data ?? [];
  },

  async createFromReturn(params: {
    orgId:       string;
    supplierId:  string;
    returnId:    string;
    amount:      number;
    description: string;
    createdBy:   string;
  }): Promise<SupplierCredit> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const { data, error } = await db().from('supplier_credits')
      .insert({
        org_id:          params.orgId,
        supplier_id:     params.supplierId,
        origin_type:     'return',
        origin_id:       params.returnId,
        description:     params.description,
        original_amount: params.amount,
        used_amount:     0,
        status:          'available',
        expires_at:      expiresAt.toISOString().split('T')[0],
        created_by:      params.createdBy,
      })
      .select()
      .single() as unknown as { data: SupplierCredit | null; error: unknown };
    if (error) throw error;
    return data as SupplierCredit;
  },

  async applyToPayable(params: {
    creditId:   string;
    payableId:  string;
    amount:     number;
    usedBy:     string;
    orgId:      string;
  }): Promise<void> {
    const credit = await SupplierCreditService.getById(params.creditId, params.orgId);
    const available = credit.original_amount - credit.used_amount;
    if (params.amount > available) throw new Error('Valor maior que o crédito disponível');

    const newUsed   = credit.used_amount + params.amount;
    const newStatus: SupplierCredit['status'] =
      newUsed >= credit.original_amount ? 'used' : 'partially_used';

    const { error: updateError } = await db().from('supplier_credits')
      .update({ used_amount: newUsed, status: newStatus })
      .eq('id', params.creditId) as unknown as { error: unknown };
    if (updateError) throw updateError;

    const { error: usageError } = await db().from('supplier_credit_usage')
      .insert({
        credit_id:   params.creditId,
        payable_id:  params.payableId,
        amount_used: params.amount,
        used_by:     params.usedBy,
      }) as unknown as { error: unknown };
    if (usageError) throw usageError;
  },

  async getById(id: string, orgId: string): Promise<SupplierCredit> {
    const { data, error } = await db().from('supplier_credits')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single() as unknown as { data: SupplierCredit | null; error: unknown };
    if (error) throw error;
    return data as SupplierCredit;
  },
};
