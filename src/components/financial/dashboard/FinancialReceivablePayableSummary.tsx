import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Building2, Receipt } from 'lucide-react';
import type { FinancialKpis } from '@/services/financial/types';
import { formatBRL } from '@/lib/financialFormat';

type FinancialReceivablePayableSummaryProps = {
  kpis: FinancialKpis;
  receivablePendingAmount: number;
  receivableOverdueAmount: number;
};

export function FinancialReceivablePayableSummary({
  kpis,
  receivablePendingAmount,
  receivableOverdueAmount,
}: FinancialReceivablePayableSummaryProps) {
  const arOutstanding = receivablePendingAmount + receivableOverdueAmount;
  const overdueSharePct =
    arOutstanding > 0 ? Math.min(100, (receivableOverdueAmount / arOutstanding) * 100) : 0;
  const liquidityPct =
    kpis.totalPayable > 0 ? Math.min(100, (kpis.cashBalance / kpis.totalPayable) * 100) : 100;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Contas a receber — resumo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm truncate">Total em aberto (valor)</span>
              <span className="font-bold text-success text-xs sm:text-sm md:text-base whitespace-nowrap">
                {formatBRL(kpis.totalReceivable)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm truncate">Títulos vencidos (qtd.)</span>
              <span className="font-bold text-destructive text-xs sm:text-sm md:text-base whitespace-nowrap">
                {kpis.overdueCount}
              </span>
            </div>
            <Progress value={Number.isFinite(overdueSharePct) ? overdueSharePct : 0} className="w-full" />
            <p className="text-xs text-muted-foreground">
              Vencidos sobre títulos em aberto: {overdueSharePct.toFixed(0)}%
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Contas a pagar — resumo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm truncate">Total pendente (valor)</span>
              <span className="font-bold text-destructive text-xs sm:text-sm md:text-base whitespace-nowrap">
                {formatBRL(kpis.totalPayable)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm truncate">Saldo mês (fluxo)</span>
              <span
                className={`font-bold text-xs sm:text-sm md:text-base whitespace-nowrap ${
                  kpis.cashBalance >= 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                {formatBRL(kpis.cashBalance)}
              </span>
            </div>
            <Progress value={Number.isFinite(liquidityPct) ? liquidityPct : 0} className="w-full" />
            <p className="text-xs text-muted-foreground">
              Saldo do mês vs. a pagar pendente (referência)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
