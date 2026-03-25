import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTable, type ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { formatBRL, formatDateBR, paymentMethodLabel } from '@/lib/financialFormat';
import type { FinancialDashboardCfRow } from '@/components/financial/dashboard/financialDashboardTypes';
import { CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';

const columns: ResponsiveTableColumn<FinancialDashboardCfRow>[] = [
  {
    key: 'type',
    header: '',
    priority: 1,
    minWidth: 40,
    render: (r) =>
      r.transaction_type === 'income' ? (
        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success shrink-0" />
      ) : (
        <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive shrink-0" />
      ),
  },
  {
    key: 'description',
    header: 'Descrição',
    priority: 2,
    minWidth: 180,
    render: (r) => <span className="font-medium text-xs sm:text-sm truncate min-w-0">{r.description}</span>,
  },
  {
    key: 'date',
    header: 'Data',
    priority: 3,
    minWidth: 100,
    render: (r) => (
      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
        {formatDateBR(r.transaction_date)}
      </span>
    ),
  },
  {
    key: 'method',
    header: 'Meio',
    priority: 4,
    minWidth: 120,
    hideInMobile: true,
    render: (r) => (
      <span className="text-xs sm:text-sm truncate">{paymentMethodLabel(r.payment_method)}</span>
    ),
  },
  {
    key: 'reconciled',
    header: 'Conc.',
    priority: 5,
    minWidth: 56,
    hideInMobile: true,
    render: (r) =>
      r.reconciled ? <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" /> : <span className="text-muted-foreground">—</span>,
  },
  {
    key: 'amount',
    header: 'Valor',
    priority: 6,
    minWidth: 110,
    render: (r) => (
      <span
        className={`font-bold text-xs sm:text-sm md:text-base whitespace-nowrap ${
          r.transaction_type === 'income' ? 'text-success' : 'text-destructive'
        }`}
      >
        {r.transaction_type === 'income' ? '+' : '−'}
        {formatBRL(r.amount)}
      </span>
    ),
  },
];

type FinancialDashboardCashFlowTableProps = {
  title?: string;
  rows: FinancialDashboardCfRow[];
  loading?: boolean;
  embedded?: boolean;
};

export function FinancialDashboardCashFlowTable({
  title = 'Fluxo de caixa',
  rows,
  loading,
  embedded = false,
}: FinancialDashboardCashFlowTableProps) {
  const body =
    loading ? (
      <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
    ) : (
      <ResponsiveTable
        data={rows}
        columns={columns}
        keyExtractor={(r) => r.id}
        emptyMessage="Nenhum lançamento nesta página."
        renderMobileCard={(r) => (
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4 space-y-2">
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {r.transaction_type === 'income' ? (
                    <TrendingUp className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <span className="font-medium text-sm truncate">{r.description}</span>
                </div>
                {r.reconciled && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">{formatDateBR(r.transaction_date)}</p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary" className="text-xs">
                  {paymentMethodLabel(r.payment_method)}
                </Badge>
                <span
                  className={`font-bold text-sm whitespace-nowrap ${
                    r.transaction_type === 'income' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {r.transaction_type === 'income' ? '+' : '−'}
                  {formatBRL(r.amount)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      />
    );

  if (embedded) {
    return <div className="min-w-0">{body}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
