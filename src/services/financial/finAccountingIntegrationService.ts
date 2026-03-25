import { supabase } from '@/integrations/supabase/client';

export class FinAccountingIntegrationService {
  static buildIdempotencyKey(orgId: string, sourceType: string, sourceId: string, eventType: string): string {
    return `${orgId}:${sourceType}:${sourceId}:${eventType}`;
  }

  static async enqueueEntry(input: {
    orgId: string;
    sourceType: string;
    sourceId: string;
    eventType: string;
    accountCode: string | null;
    debit: number;
    credit: number;
    competenceDate: string | null;
  }): Promise<{ id: string | null; duplicate: boolean }> {
    const idempotency_key = this.buildIdempotencyKey(
      input.orgId,
      input.sourceType,
      input.sourceId,
      input.eventType
    );
    const { data: existing } = await supabase
      .from('fin_accounting_entries')
      .select('id')
      .eq('org_id', input.orgId)
      .eq('idempotency_key', idempotency_key)
      .maybeSingle();
    if (existing) return { id: (existing as { id: string }).id, duplicate: true };
    const { data, error } = await supabase
      .from('fin_accounting_entries')
      .insert({
        org_id: input.orgId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        event_type: input.eventType,
        idempotency_key,
        account_code: input.accountCode,
        debit: input.debit,
        credit: input.credit,
        competence_date: input.competenceDate,
        status: 'pending',
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { id: (data as { id: string }).id, duplicate: false };
  }

  static async listPending(orgId: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('fin_accounting_entries')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  }
}
