/**
 * Interpreta valores monetários na digitação (BR: "3.429,50"; também "3429", "10,5", "10.5").
 */
export function parseMoneyBr(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, '');
  if (!t) return null;

  if (t.includes(',')) {
    const normalized = t.replace(/\./g, '').replace(',', '.');
    const n = Number(normalized);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100) / 100;
  }

  const lastDot = t.lastIndexOf('.');
  if (lastDot >= 0) {
    const before = t.slice(0, lastDot);
    const after = t.slice(lastDot + 1);
    const dotCount = (t.match(/\./g) ?? []).length;
    if (dotCount === 1 && /^\d+$/.test(after) && after.length <= 2) {
      const n = Number(t);
      if (!Number.isFinite(n)) return null;
      return Math.round(n * 100) / 100;
    }
  }

  const noDots = t.replace(/\./g, '');
  const n = Number(noDots);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}
