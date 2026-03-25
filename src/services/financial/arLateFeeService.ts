import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type RuleRow = Database['public']['Tables']['ar_late_fee_rules']['Row'];

export class ArLateFeeService {
  static async getActiveRule(orgId: string): Promise<RuleRow | null> {
    const { data, error } = await supabase
      .from('ar_late_fee_rules')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as RuleRow) ?? null;
  }

  static async upsertRule(
    orgId: string,
    patch: {
      penalty_percent: number;
      daily_interest_percent: number;
      grace_days: number;
      is_active: boolean;
    }
  ): Promise<void> {
    const existing = await this.getActiveRule(orgId);
    if (existing && patch.is_active) {
      const { error } = await supabase
        .from('ar_late_fee_rules')
        .update({
          penalty_percent: patch.penalty_percent,
          daily_interest_percent: patch.daily_interest_percent,
          grace_days: patch.grace_days,
          is_active: true,
        })
        .eq('id', existing.id);
      if (error) throw new Error(error.message);
      return;
    }
    const { error } = await supabase.from('ar_late_fee_rules').insert({
      org_id: orgId,
      penalty_percent: patch.penalty_percent,
      daily_interest_percent: patch.daily_interest_percent,
      grace_days: patch.grace_days,
      is_active: patch.is_active,
    });
    if (error) throw new Error(error.message);
  }

  static async applyForOrg(orgId: string, asOf: string): Promise<{ updated: number }> {
    const rule = await this.getActiveRule(orgId);
    if (!rule) return { updated: 0 };
    const { data: overdue, error } = await supabase
      .from('accounts_receivable')
      .select('id, amount, due_date, late_fee, last_late_fee_date')
      .eq('org_id', orgId)
      .in('status', ['pending', 'overdue', 'renegotiated'])
      .lt('due_date', asOf);
    if (error) throw new Error(error.message);
    let updated = 0;
    for (const row of overdue ?? []) {
      const r = row as {
        id: string;
        amount: number;
        due_date: string;
        late_fee: number | null;
        last_late_fee_date: string | null;
      };
      if (r.last_late_fee_date === asOf) continue;
      const due = new Date(r.due_date);
      const ref = new Date(asOf);
      const daysOver = Math.max(
        0,
        Math.floor((ref.getTime() - due.getTime()) / 86400000) - (rule.grace_days ?? 0)
      );
      if (daysOver <= 0) continue;
      const principal = Number(r.amount);
      const penalty = (principal * Number(rule.penalty_percent)) / 100;
      const interest = principal * (Number(rule.daily_interest_percent) / 100) * daysOver;
      const totalFee = Math.round((penalty + interest) * 100) / 100;
      const { error: hErr } = await supabase.from('ar_late_fee_history').insert({
        org_id: orgId,
        receivable_account_id: r.id,
        calculated_date: asOf,
        penalty_amount: penalty,
        interest_amount: interest,
        total_fee: totalFee,
        days_overdue: daysOver,
      });
      if (hErr) continue;
      const { error: uErr } = await supabase
        .from('accounts_receivable')
        .update({
          late_fee: totalFee,
          last_late_fee_date: asOf,
          status: 'overdue',
        })
        .eq('id', r.id)
        .eq('org_id', orgId);
      if (!uErr) updated += 1;
    }
    return { updated };
  }
}
