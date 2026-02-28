import { supabase } from '@/integrations/supabase/client';

export interface NegotiationRound {
  id:                     string;
  quotation_id:           string | null;
  supplier_id:            string;
  round_number:           number;
  initial_total:          number;
  final_total:            number;
  discount_percentage:    number;
  total_savings:          number;
  negotiation_date:       string;
  arguments_used:         string | null;
  supplier_justification: string | null;
  notes:                  string | null;
  org_id:                 string;
  created_at:             string;
  supplier?:              { name: string };
  quotation?:             { quotation_number: string };
}

export interface CreateNegotiationInput {
  quotation_id?:          string;
  supplier_id:            string;
  initial_total:          number;
  final_total:            number;
  negotiation_date:       string;
  arguments_used?:        string;
  supplier_justification?: string;
  notes?:                 string;
}

const db = () => supabase as any;

export const NegotiationService = {
  async listByOrg(orgId: string): Promise<NegotiationRound[]> {
    const { data, error } = await db().from('negotiation_rounds')
      .select('*, supplier:suppliers(name), quotation:purchase_quotations(quotation_number)')
      .eq('org_id', orgId)
      .order('negotiation_date', { ascending: false })
      .limit(200) as unknown as { data: NegotiationRound[] | null; error: unknown };
    if (error) throw error;
    return data ?? [];
  },

  async listBySupplier(supplierId: string, orgId: string): Promise<NegotiationRound[]> {
    const { data, error } = await db().from('negotiation_rounds')
      .select('*, quotation:purchase_quotations(quotation_number)')
      .eq('supplier_id', supplierId)
      .eq('org_id', orgId)
      .order('negotiation_date', { ascending: false }) as unknown as { data: NegotiationRound[] | null; error: unknown };
    if (error) throw error;
    return data ?? [];
  },

  async listByQuotation(quotationId: string): Promise<NegotiationRound[]> {
    const { data, error } = await db().from('negotiation_rounds')
      .select('*, supplier:suppliers(name)')
      .eq('quotation_id', quotationId)
      .order('negotiation_date', { ascending: false }) as unknown as { data: NegotiationRound[] | null; error: unknown };
    if (error) throw error;
    return data ?? [];
  },

  async create(orgId: string, userId: string, input: CreateNegotiationInput): Promise<NegotiationRound> {
    const { data: last } = await db().from('negotiation_rounds')
      .select('round_number')
      .eq('org_id', orgId)
      .eq('supplier_id', input.supplier_id)
      .order('round_number', { ascending: false })
      .limit(1) as unknown as { data: { round_number: number }[] | null };

    const round_number = ((last ?? [])[0]?.round_number ?? 0) + 1;

    const { data, error } = await db().from('negotiation_rounds')
      .insert({
        org_id:                 orgId,
        negotiated_by:          userId,
        supplier_id:            input.supplier_id,
        quotation_id:           input.quotation_id ?? null,
        round_number,
        initial_total:          input.initial_total,
        final_total:            input.final_total,
        negotiation_date:       input.negotiation_date,
        arguments_used:         input.arguments_used ?? null,
        supplier_justification: input.supplier_justification ?? null,
        notes:                  input.notes ?? null,
      })
      .select('*, supplier:suppliers(name)')
      .single() as unknown as { data: NegotiationRound | null; error: unknown };
    if (error) throw error;
    return data as NegotiationRound;
  },

  async getStats(orgId: string): Promise<{
    total_negotiations: number;
    avg_discount:       number;
    total_savings:      number;
  }> {
    const { data } = await db().from('negotiation_rounds')
      .select('discount_percentage, total_savings')
      .eq('org_id', orgId) as unknown as {
        data: { discount_percentage: number; total_savings: number }[] | null;
      };

    const rows = data ?? [];
    return {
      total_negotiations: rows.length,
      avg_discount:       rows.length > 0 ? rows.reduce((a, b) => a + b.discount_percentage, 0) / rows.length : 0,
      total_savings:      rows.reduce((a, b) => a + b.total_savings, 0),
    };
  },
};
