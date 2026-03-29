import { format } from 'date-fns';

/** yyyy-MM-dd no fuso local (para `min` em inputs type="date"). */
export function todayISODateLocal(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Interpreta yyyy-MM-dd como data local (evita deslocamento UTC). */
export function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

export function isISODateBeforeToday(isoDate: string): boolean {
  if (!isoDate?.trim()) return false;
  const candidate = parseISODateLocal(isoDate);
  if (Number.isNaN(candidate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  candidate.setHours(0, 0, 0, 0);
  return candidate < today;
}

/** Verdadeiro se a primeira data é estritamente posterior à segunda (ambas yyyy-MM-dd). */
export function isISODateAfterOther(isoA: string, isoB: string): boolean {
  if (!isoA?.trim() || !isoB?.trim()) return false;
  const a = parseISODateLocal(isoA);
  const b = parseISODateLocal(isoB);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return a > b;
}
