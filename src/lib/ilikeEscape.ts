/** Escapa `%`, `_` e `\` para uso seguro dentro de padrões `ilike` do PostgREST. */
export function escapeIlikePattern(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
