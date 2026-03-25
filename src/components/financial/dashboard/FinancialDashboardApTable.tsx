import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTable, type ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import type { FinancialDashboardApRow } from '@/components/financial/dashboard/financialDashboardTypes';
import {
  financialPayableStatusClass,
  financialPayableStatusLabel,
} from '@/components/financial/dashboard/financialStatusDisplay';

const columns: ResponsiveTableColumn<FinancialDashboardApRow>[] = [
  {
    key: 'supplier',
    header: 'Fornecedor',
    priority: 1,
    minWidth: 160,
    render: (r) => (
      <span className="font-medium truncate min-w-0">{r.supplier_name ?? '—'}</span>
    ),
  },
  {
    key: 'desc',
    header: 'Descrição',
    priority: 2,
    minWidth: 140,
    hideInMobile: true,
    render: (r) => (
      <span className="text-xs sm:text-sm truncate max-w-[200px] block">{r.description ?? '—'}</span>
    ),
  },
  {
    key: 'due',
    header: 'Vencimento',
    priority: 3,
    minWidth: 110,
    render: (r) => <span className="text-xs sm:text-sm whitespace-nowrap">{formatDateBR(r.due_date)}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    priority: 4,
    minWidth: 100,
    render: (r) => (
      <Badge className={`text-xs ${financialPayableStatusClass(String(r.status))}`}>
        {financialPayableStatusLabel(String(r.status))}
      </Badge>
    ),
  },
  {
    key: 'amount',
    header: 'Valor',
    priority: 5,
    minWidth: 100,
    render: (r) => (
      <span className="font-bold text-xs sm:text-sm md:text-base whitespace-nowrap">{formatBRL(r.amount)}</span>
    ),
  },
];

type FinancialDashboardApTableProps = {
  title?: string;
  rows: FinancialDashboardApRow[];
  loading?: boolean;
};

export function FinancialDashboardApTable({
  title = 'Contas a pagar',
  rows,
  loading,
}: FinancialDashboardApTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
        ) : (
          <ResponsiveTable<FinancialDashboardApRow>
            data={rows}
            columns={columns}
            keyExtractor={(r) => r.id}
            emptyMessage="Nenhuma conta a pagar nesta página."
          />
        )}
      </CardContent>
    </Card>
  );
}
