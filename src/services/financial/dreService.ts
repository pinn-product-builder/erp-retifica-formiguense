import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DreRow = Database['public']['Tables']['monthly_dre']['Row'];

export type PaymentTermIndicators = {
  /** PMR — Prazo Médio de Recebimento em dias (AR pagos no período). */
  pmr: number | null;
  /** PMP — Prazo Médio de Pagamento em dias (AP pagos no período). */
  pmp: number | null;
  pmrSampleCount: number;
  pmpSampleCount: number;
};

function diffDaysFromIso(start: string | null | undefined, end: string | null | undefined): number | null {
  if (!start || !end) return null;
  const a = new Date(String(start).slice(0, 10));
  const b = new Date(String(end).slice(0, 10));
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((s, v) => s + v, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export class DreService {
  static async list(orgId: string, year?: number): Promise<DreRow[]> {
    let q = supabase
      .from('monthly_dre')
      .select('*')
      .eq('org_id', orgId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (year) q = q.eq('year', year);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as DreRow[]) ?? [];
  }

  /**
   * Calcula PMR (Prazo Médio de Recebimento) e PMP (Prazo Médio de Pagamento).
   * Janela: o ano informado (ou todos os AR/AP pagos se year for null).
   *
   * Fórmula simplificada: média de dias entre data de emissão (competence_date, fallback created_at)
   * e data de pagamento, considerando apenas títulos quitados.
   */
  static async paymentTermIndicators(orgId: string, year?: number): Promise<PaymentTermIndicators> {
    const yearStart = year ? `${year}-01-01` : null;
    const yearEnd = year ? `${year}-12-31` : null;

    let arQuery = supabase
      .from('accounts_receivable')
      .select('competence_date, created_at, payment_date')
      .eq('org_id', orgId)
      .eq('status', 'paid')
      .not('payment_date', 'is', null);
    if (yearStart && yearEnd) {
      arQuery = arQuery.gte('payment_date', yearStart).lte('payment_date', yearEnd);
    }
    const { data: arData, error: arErr } = await arQuery;
    if (arErr) throw new Error(arErr.message);

    let apQuery = supabase
      .from('accounts_payable')
      .select('competence_date, created_at, payment_date')
      .eq('org_id', orgId)
      .eq('status', 'paid')
      .not('payment_date', 'is', null);
    if (yearStart && yearEnd) {
      apQuery = apQuery.gte('payment_date', yearStart).lte('payment_date', yearEnd);
    }
    const { data: apData, error: apErr } = await apQuery;
    if (apErr) throw new Error(apErr.message);

    const arDays: number[] = [];
    for (const r of (arData ?? []) as Array<{
      competence_date: string | null;
      created_at: string | null;
      payment_date: string | null;
    }>) {
      const emit = r.competence_date ?? r.created_at;
      const days = diffDaysFromIso(emit, r.payment_date);
      if (days !== null && days >= 0) arDays.push(days);
    }

    const apDays: number[] = [];
    for (const r of (apData ?? []) as Array<{
      competence_date: string | null;
      created_at: string | null;
      payment_date: string | null;
    }>) {
      const emit = r.competence_date ?? r.created_at;
      const days = diffDaysFromIso(emit, r.payment_date);
      if (days !== null && days >= 0) apDays.push(days);
    }

    return {
      pmr: average(arDays),
      pmp: average(apDays),
      pmrSampleCount: arDays.length,
      pmpSampleCount: apDays.length,
    };
  }
}
