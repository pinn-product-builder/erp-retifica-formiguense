/**
 * Régua de cobrança — configuração (Fase 1).
 * Dispatch (cron/email) será implementado em Fase 2.
 * Task ClickUp 86agymx9y.
 */
import { supabase } from '@/integrations/supabase/client';

export type CollectionStepKind =
  | 'reminder_pre'
  | 'reminder_due'
  | 'reminder_post'
  | 'warning_protest'
  | 'protest';

export type CollectionOffsetType = 'calendar' | 'business';

export type ArCollectionRule = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ArCollectionRuleStep = {
  id: string;
  rule_id: string;
  org_id: string;
  offset_days: number;
  offset_type: CollectionOffsetType;
  step_kind: CollectionStepKind;
  subject: string;
  body: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_RULE_STEPS: Array<
  Pick<ArCollectionRuleStep, 'offset_days' | 'offset_type' | 'step_kind' | 'subject' | 'body' | 'order_index'>
> = [
  {
    offset_days: -7,
    offset_type: 'calendar',
    step_kind: 'reminder_pre',
    order_index: 1,
    subject: 'Lembrete: título com vencimento próximo',
    body:
      'Olá {{cliente}},\n\nLembramos que o título de {{valor}} vence em {{dias_para_vencer}} dia(s), em {{data_vencimento}}.\n\nQualquer dúvida estamos à disposição.\n\nFavarini Motores.',
  },
  {
    offset_days: 0,
    offset_type: 'calendar',
    step_kind: 'reminder_due',
    order_index: 2,
    subject: 'Vencimento hoje',
    body:
      'Olá {{cliente}},\n\nO título de {{valor}} vence hoje, {{data_vencimento}}.\n\nFavor providenciar o pagamento.\n\nFavarini Motores.',
  },
  {
    offset_days: 2,
    offset_type: 'calendar',
    step_kind: 'reminder_post',
    order_index: 3,
    subject: 'Título em aberto após vencimento',
    body:
      'Olá {{cliente}},\n\nIdentificamos que o título de {{valor}}, vencido em {{data_vencimento}}, segue em aberto após conciliação bancária. Caso já tenha pago, desconsidere e nos envie o comprovante.\n\nFavarini Motores.',
  },
  {
    offset_days: 5,
    offset_type: 'business',
    step_kind: 'reminder_post',
    order_index: 4,
    subject: 'Lembrete: título em aberto há 5 dias úteis',
    body:
      'Olá {{cliente}},\n\nO título de {{valor}} (venc. {{data_vencimento}}) segue em aberto. Por favor, entre em contato para regularização.\n\nFavarini Motores.',
  },
  {
    offset_days: 15,
    offset_type: 'calendar',
    step_kind: 'warning_protest',
    order_index: 5,
    subject: 'Aviso preventivo de encaminhamento para protesto',
    body:
      'Olá {{cliente}},\n\nO título de {{valor}}, vencido em {{data_vencimento}}, está há 15 dias em aberto. Persistindo a inadimplência, em 2 dias úteis o título será encaminhado para protesto extrajudicial.\n\nFavarini Motores.',
  },
  {
    offset_days: 17,
    offset_type: 'calendar',
    step_kind: 'protest',
    order_index: 6,
    subject: 'Título encaminhado para protesto',
    body:
      'Olá {{cliente}},\n\nO título de {{valor}}, vencido em {{data_vencimento}}, foi encaminhado ao cartório para protesto extrajudicial. Para regularização, entre em contato com a Favarini Motores.',
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any;

export class ArCollectionRulesService {
  static async listRules(orgId: string): Promise<ArCollectionRule[]> {
    const { data, error } = await db()
      .from('ar_collection_rules')
      .select('*')
      .eq('org_id', orgId)
      .order('is_default', { ascending: false })
      .order('name');
    if (error) throw new Error(error.message);
    return (data ?? []) as ArCollectionRule[];
  }

  static async listSteps(ruleId: string): Promise<ArCollectionRuleStep[]> {
    const { data, error } = await db()
      .from('ar_collection_rule_steps')
      .select('*')
      .eq('rule_id', ruleId)
      .order('offset_days', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ArCollectionRuleStep[];
  }

  static async createRuleWithDefaults(
    orgId: string,
    name: string,
    userId: string | null,
    makeDefault = false
  ): Promise<{ rule: ArCollectionRule; steps: ArCollectionRuleStep[] }> {
    if (makeDefault) {
      const { error: clearErr } = await db()
        .from('ar_collection_rules')
        .update({ is_default: false })
        .eq('org_id', orgId)
        .eq('is_default', true);
      if (clearErr) throw new Error(clearErr.message);
    }

    const { data: ruleData, error: ruleErr } = await db()
      .from('ar_collection_rules')
      .insert({
        org_id: orgId,
        name,
        is_active: true,
        is_default: makeDefault,
        created_by: userId,
      })
      .select('*')
      .single();
    if (ruleErr || !ruleData) throw new Error(ruleErr?.message ?? 'Erro ao criar régua');

    const rule = ruleData as ArCollectionRule;

    const stepsPayload = DEFAULT_RULE_STEPS.map((s) => ({
      ...s,
      rule_id: rule.id,
      org_id: orgId,
    }));
    const { data: stepsData, error: stepsErr } = await db()
      .from('ar_collection_rule_steps')
      .insert(stepsPayload)
      .select('*');
    if (stepsErr) throw new Error(stepsErr.message);

    return { rule, steps: (stepsData ?? []) as ArCollectionRuleStep[] };
  }

  static async updateStep(
    stepId: string,
    patch: Partial<Pick<ArCollectionRuleStep, 'offset_days' | 'offset_type' | 'subject' | 'body' | 'is_active'>>
  ): Promise<void> {
    const { error } = await db().from('ar_collection_rule_steps').update(patch).eq('id', stepId);
    if (error) throw new Error(error.message);
  }

  static async toggleRuleActive(ruleId: string, isActive: boolean): Promise<void> {
    const { error } = await db()
      .from('ar_collection_rules')
      .update({ is_active: isActive })
      .eq('id', ruleId);
    if (error) throw new Error(error.message);
  }

  static async setDefaultRule(orgId: string, ruleId: string): Promise<void> {
    const { error: clearErr } = await db()
      .from('ar_collection_rules')
      .update({ is_default: false })
      .eq('org_id', orgId)
      .eq('is_default', true);
    if (clearErr) throw new Error(clearErr.message);
    const { error } = await db()
      .from('ar_collection_rules')
      .update({ is_default: true })
      .eq('id', ruleId)
      .eq('org_id', orgId);
    if (error) throw new Error(error.message);
  }

  static async deleteRule(ruleId: string, orgId: string): Promise<void> {
    const { error } = await db()
      .from('ar_collection_rules')
      .delete()
      .eq('id', ruleId)
      .eq('org_id', orgId);
    if (error) throw new Error(error.message);
  }
}
