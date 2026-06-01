/**
 * Negociação individual de duplicata (CR).
 * Task ClickUp 86agymxde.
 *
 * Quando ativa (paused_at NOT NULL AND resolved_at IS NULL), suspende régua automática
 * e o sistema gera lembrete na data prometida.
 */
import { supabase } from '@/integrations/supabase/client';

export type ArNegotiationState = {
  promisedDate: string | null;
  notes: string | null;
  pausedAt: string | null;
  resolvedAt: string | null;
  ownerUserId: string | null;
  isActive: boolean;
};

export class ArNegotiationService {
  static async start(
    receivableId: string,
    orgId: string,
    input: { promisedDate: string; notes: string },
    userId: string | null
  ): Promise<void> {
    if (!input.promisedDate) throw new Error('Informe a nova data prometida');
    if (!input.notes?.trim() || input.notes.trim().length < 5) {
      throw new Error('Informe um motivo (mínimo 5 caracteres)');
    }
    const { error } = await supabase
      .from('accounts_receivable')
      .update({
        negotiation_promised_date: input.promisedDate,
        negotiation_notes: input.notes.trim(),
        negotiation_paused_at: new Date().toISOString(),
        negotiation_resolved_at: null,
        negotiation_owner_user_id: userId,
      })
      .eq('id', receivableId)
      .eq('org_id', orgId);
    if (error) throw new Error(error.message);
  }

  static async resolve(receivableId: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('accounts_receivable')
      .update({ negotiation_resolved_at: new Date().toISOString() })
      .eq('id', receivableId)
      .eq('org_id', orgId);
    if (error) throw new Error(error.message);
  }

  static async cancel(receivableId: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('accounts_receivable')
      .update({
        negotiation_promised_date: null,
        negotiation_notes: null,
        negotiation_paused_at: null,
        negotiation_resolved_at: null,
        negotiation_owner_user_id: null,
      })
      .eq('id', receivableId)
      .eq('org_id', orgId);
    if (error) throw new Error(error.message);
  }

  static stateFromRow(row: Record<string, unknown>): ArNegotiationState {
    const promised = (row.negotiation_promised_date as string | null) ?? null;
    const notes = (row.negotiation_notes as string | null) ?? null;
    const paused = (row.negotiation_paused_at as string | null) ?? null;
    const resolved = (row.negotiation_resolved_at as string | null) ?? null;
    const owner = (row.negotiation_owner_user_id as string | null) ?? null;
    return {
      promisedDate: promised,
      notes,
      pausedAt: paused,
      resolvedAt: resolved,
      ownerUserId: owner,
      isActive: !!paused && !resolved,
    };
  }
}
