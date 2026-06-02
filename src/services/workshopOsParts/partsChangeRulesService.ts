/**
 * Regra: alteração de peças em OS após aprovação.
 *
 * Lê/grava a configuração por org (`workshop_parts_change_rules`) e expõe
 * a função `evaluateChange` que decide se uma operação de inclusão,
 * remoção ou substituição é permitida com base na regra + status da OS +
 * valor da mudança.
 *
 * Task ClickUp 86agmy9k7.
 */
import { supabase } from '@/integrations/supabase/client';

export type PartsChangeRule = {
  allowAfterApproval: boolean;
  autoThresholdAmount: number | null;
};

/** Status de OS considerados "pós-aprovação" — onde a regra entra. */
export const POST_APPROVAL_STATUSES = new Set([
  'aprovada',
  'em_producao',
  'concluida',
]);

export type ChangeEvaluation =
  | { allowed: true }
  | { allowed: false; reason: 'rule_disabled' | 'over_threshold'; threshold?: number };

const DEFAULT_RULE: PartsChangeRule = {
  allowAfterApproval: false,
  autoThresholdAmount: null,
};

export class PartsChangeRulesService {
  /** Lê a regra da org. Se não houver registro, retorna o default (bloqueia). */
  static async get(orgId: string): Promise<PartsChangeRule> {
    if (!orgId) return DEFAULT_RULE;
    const { data, error } = await supabase
      .from('workshop_parts_change_rules')
      .select('allow_after_approval, auto_threshold_amount')
      .eq('org_id', orgId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return DEFAULT_RULE;
    return {
      allowAfterApproval: Boolean(data.allow_after_approval),
      autoThresholdAmount:
        data.auto_threshold_amount === null || data.auto_threshold_amount === undefined
          ? null
          : Number(data.auto_threshold_amount),
    };
  }

  /** Cria/atualiza a regra da org. */
  static async upsert(
    orgId: string,
    rule: PartsChangeRule,
    userId: string | null
  ): Promise<PartsChangeRule> {
    const payload = {
      org_id: orgId,
      allow_after_approval: rule.allowAfterApproval,
      auto_threshold_amount: rule.autoThresholdAmount,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('workshop_parts_change_rules')
      .upsert(payload, { onConflict: 'org_id' })
      .select('allow_after_approval, auto_threshold_amount')
      .single();
    if (error || !data) throw new Error(error?.message ?? 'Erro ao salvar regra');
    return {
      allowAfterApproval: Boolean(data.allow_after_approval),
      autoThresholdAmount:
        data.auto_threshold_amount === null || data.auto_threshold_amount === undefined
          ? null
          : Number(data.auto_threshold_amount),
    };
  }

  /**
   * Decide se uma operação de alteração de peças é permitida.
   * - Antes da aprovação: sempre permitido (regra não se aplica).
   * - Após aprovação: requer flag ligada E valor <= threshold (quando definido).
   */
  static evaluateChange(
    orderStatus: string,
    changeAmount: number,
    rule: PartsChangeRule
  ): ChangeEvaluation {
    if (!POST_APPROVAL_STATUSES.has(orderStatus)) {
      return { allowed: true };
    }
    if (!rule.allowAfterApproval) {
      return { allowed: false, reason: 'rule_disabled' };
    }
    if (
      rule.autoThresholdAmount !== null &&
      Number.isFinite(rule.autoThresholdAmount) &&
      changeAmount > rule.autoThresholdAmount
    ) {
      return { allowed: false, reason: 'over_threshold', threshold: rule.autoThresholdAmount };
    }
    return { allowed: true };
  }
}
