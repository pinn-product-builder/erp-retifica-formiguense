import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, ChevronRight } from 'lucide-react';
import type { DueWindowSummary } from '@/services/financial';
import { formatBRL } from '@/lib/financialFormat';

type FinancialDueAlertsCardProps = {
  summary: DueWindowSummary | null;
  loading?: boolean;
};

export function FinancialDueAlertsCard({ summary, loading }: FinancialDueAlertsCardProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6 pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <span className="truncate">Alertas de vencimento (hoje / 3 / 7 dias)</span>
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal">
          Títulos com vencimento exatamente hoje, em 3 ou em 7 dias (contas a receber em aberto e contas a
          pagar pendentes).
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {loading ? (
          <p className="text-sm text-muted-foreground py-2">Carregando alertas…</p>
        ) : !summary ? (
          <p className="text-sm text-muted-foreground">Sem dados.</p>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <Link
              to="/contas-receber?dueAlerts=1"
              className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:p-4 hover:bg-accent/50 transition-colors min-w-0"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">A receber</p>
                <p className="text-lg sm:text-xl font-bold tabular-nums truncate">
                  {summary.receivable.count}{' '}
                  <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                    {summary.receivable.count === 1 ? 'título' : 'títulos'}
                  </span>
                </p>
                <p className="text-xs sm:text-sm text-success whitespace-nowrap">
                  {formatBRL(summary.receivable.totalAmount)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-muted-foreground" />
            </Link>
            <Link
              to="/contas-pagar?dueAlerts=1"
              className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:p-4 hover:bg-accent/50 transition-colors min-w-0"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">A pagar</p>
                <p className="text-lg sm:text-xl font-bold tabular-nums truncate">
                  {summary.payable.count}{' '}
                  <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                    {summary.payable.count === 1 ? 'título' : 'títulos'}
                  </span>
                </p>
                <p className="text-xs sm:text-sm text-destructive whitespace-nowrap">
                  {formatBRL(summary.payable.totalAmount)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-muted-foreground" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
