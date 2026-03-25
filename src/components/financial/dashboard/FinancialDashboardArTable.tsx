import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTable, type ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import type { FinancialDashboardArRow } from '@/components/financial/dashboard/financialDashboardTypes';
import {
  financialReceivableStatusClass,
  financialReceivableStatusLabel,
} from '@/components/financial/dashboard/financialStatusDisplay';

const columns: ResponsiveTableColumn<FinancialDashboardArRow>[] = [
  {
    key: 'customer',
    header: 'Cliente',
    priority: 1,
    minWidth: 160,
    render: (r) => {
      const c = r.customers;
      return <span className="font-medium truncate min-w-0">{c?.name ?? '—'}</span>;
    },
  },
  {
    key: 'due',
    header: 'Vencimento',
    priority: 2,
    minWidth: 110,
    render: (r) => <span className="text-xs sm:text-sm whitespace-nowrap">{formatDateBR(r.due_date)}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    priority: 3,
    minWidth: 100,
    render: (r) => (
      <Badge className={`text-xs ${financialReceivableStatusClass(String(r.status))}`}>
        {financialReceivableStatusLabel(String(r.status))}
      </Badge>
    ),
  },
  {
    key: 'amount',
    header: 'Valor',
    priority: 4,
    minWidth: 100,
    render: (r) => (
      <span className="font-bold text-xs sm:text-sm md:text-base whitespace-nowrap">{formatBRL(r.amount)}</span>
    ),
  },
];

type FinancialDashboardArTableProps = {
  title?: string;
  rows: FinancialDashboardArRow[];
  loading?: boolean;
};

export function FinancialDashboardArTable({
  title = 'Contas a receber',
  rows,
  loading,
}: FinancialDashboardArTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
        ) : (
          <ResponsiveTable<FinancialDashboardArRow>
            data={rows}
            columns={columns}
            keyExtractor={(r) => r.id}
            emptyMessage="Nenhuma conta a receber nesta página."
          />
        )}
      </CardContent>
    </Card>
  );
}
