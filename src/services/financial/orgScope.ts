/** UUID impossível para forçar resultado vazio quando não há orgs no escopo (não deve ocorrer na prática). */
const EMPTY_ORG_SENTINEL = '00000000-0000-0000-0000-000000000001';

/**
 * Restringe uma query Supabase por uma ou várias organizations (`eq` vs `in`).
 */
export function applyOrgIdFilter<T = any>(
  query: T,
  column: string,
  orgIds: readonly string[]
): T {
  const q = query as any;
  if (orgIds.length === 0) return q.eq(column, EMPTY_ORG_SENTINEL);
  if (orgIds.length === 1) return q.eq(column, orgIds[0]);
  return q.in(column, [...orgIds]);
}

/** Mutações financeiras exigem exatamente uma organization por lançamento. */
export function assertSingleOrgForWrite(orgIds: readonly string[]): string {
  if (orgIds.length !== 1) {
    throw new Error('Selecione uma empresa para registrar ou editar lançamentos.');
  }
  return orgIds[0];
}
