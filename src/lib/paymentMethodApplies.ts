export type PaymentMethodContext = 'receivable' | 'payable';

export function paymentMethodMatchesContext(
  appliesTo: string[] | null | undefined,
  ctx: PaymentMethodContext
): boolean {
  const a = appliesTo?.length ? appliesTo : ['both'];
  return a.includes('both') || a.includes(ctx);
}
