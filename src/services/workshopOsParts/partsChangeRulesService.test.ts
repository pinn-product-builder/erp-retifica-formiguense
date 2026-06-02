import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { PartsChangeRulesService, type PartsChangeRule } from './partsChangeRulesService';

const disabled: PartsChangeRule = { allowAfterApproval: false, autoThresholdAmount: null };
const enabledNoLimit: PartsChangeRule = { allowAfterApproval: true, autoThresholdAmount: null };
const enabledWithLimit: PartsChangeRule = { allowAfterApproval: true, autoThresholdAmount: 500 };

describe('PartsChangeRulesService.evaluateChange', () => {
  it('permite alteração quando a OS ainda não foi aprovada (independe da regra)', () => {
    expect(PartsChangeRulesService.evaluateChange('ativa', 9999, disabled)).toEqual({ allowed: true });
    expect(PartsChangeRulesService.evaluateChange('em_analise', 9999, disabled)).toEqual({ allowed: true });
  });

  it('bloqueia em OS aprovada quando a regra está desativada', () => {
    const r = PartsChangeRulesService.evaluateChange('aprovada', 10, disabled);
    expect(r).toEqual({ allowed: false, reason: 'rule_disabled' });
  });

  it('permite em OS aprovada com regra ligada e sem limite', () => {
    const r = PartsChangeRulesService.evaluateChange('em_producao', 100_000, enabledNoLimit);
    expect(r).toEqual({ allowed: true });
  });

  it('permite quando valor está exatamente no limite', () => {
    const r = PartsChangeRulesService.evaluateChange('aprovada', 500, enabledWithLimit);
    expect(r).toEqual({ allowed: true });
  });

  it('bloqueia quando valor ultrapassa o limite', () => {
    const r = PartsChangeRulesService.evaluateChange('aprovada', 500.01, enabledWithLimit);
    expect(r).toEqual({ allowed: false, reason: 'over_threshold', threshold: 500 });
  });

  it('aplica a regra em todos os status pós-aprovação', () => {
    for (const status of ['aprovada', 'em_producao', 'concluida']) {
      const r = PartsChangeRulesService.evaluateChange(status, 1, disabled);
      expect(r).toEqual({ allowed: false, reason: 'rule_disabled' });
    }
  });

  it('não aplica a regra em status terminais ou pré-aprovação', () => {
    for (const status of ['ativa', 'em_analise', 'entregue', 'cancelada']) {
      const r = PartsChangeRulesService.evaluateChange(status, 99_999, disabled);
      expect(r).toEqual({ allowed: true });
    }
  });
});
