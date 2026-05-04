import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBRL } from '@/lib/financialFormat';
import type { CustomerArSummary } from '@/services/financial/customerArPositionService';

type CustomerPositionSummaryProps = {
  summary: CustomerArSummary | null;
  loading?: boolean;
};

export function CustomerPositionSummary({ summary, loading }: CustomerPositionSummaryProps) {
  if (loading && !summary) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border">
            <CardHeader className="p-3 sm:p-4 pb-1">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
      <Card className="border min-w-0">
        <CardHeader className="p-3 sm:p-4 pb-1 space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            Em aberto (em dia)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-lg sm:text-xl md:text-2xl font-semibold tabular-nums truncate">
            {formatBRL(summary.pendingOnTime)}
          </p>
        </CardContent>
      </Card>
      <Card className="border min-w-0">
        <CardHeader className="p-3 sm:p-4 pb-1 space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            Em aberto (atrasado)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-lg sm:text-xl md:text-2xl font-semibold tabular-nums text-destructive truncate">
            {formatBRL(summary.overdue)}
          </p>
        </CardContent>
      </Card>
      <Card className="border min-w-0">
        <CardHeader className="p-3 sm:p-4 pb-1 space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            Total recebido
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-lg sm:text-xl md:text-2xl font-semibold tabular-nums truncate">
            {formatBRL(summary.totalReceived)}
          </p>
        </CardContent>
      </Card>
      <Card className="border min-w-0">
        <CardHeader className="p-3 sm:p-4 pb-1 space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            Média atraso (dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-lg sm:text-xl md:text-2xl font-semibold tabular-nums truncate">
            {summary.avgDelayDaysPaidLate != null
              ? `${summary.avgDelayDaysPaidLate} (${summary.countPaidLate} tít.)`
              : '—'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
