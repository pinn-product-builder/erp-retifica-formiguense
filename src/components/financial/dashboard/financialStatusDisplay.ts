export function financialReceivableStatusClass(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-success text-success-foreground';
    case 'pending':
      return 'bg-warning text-warning-foreground';
    case 'overdue':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function financialReceivableStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'Pago';
    case 'pending':
      return 'Pendente';
    case 'overdue':
      return 'Vencido';
    case 'cancelled':
      return 'Cancelado';
    case 'renegotiated':
      return 'Renegociado';
    default:
      return status;
  }
}

export function financialPayableStatusClass(status: string): string {
  return financialReceivableStatusClass(status);
}

export function financialPayableStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'Pago';
    case 'pending':
      return 'Pendente';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
}
