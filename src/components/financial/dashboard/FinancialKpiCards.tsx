import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import type { FinancialKpis } from '@/services/financial/types';
import { formatBRL } from '@/lib/financialFormat';

type FinancialKpiCardsProps = {
  kpis: FinancialKpis;
};

export function FinancialKpiCards({ kpis }: FinancialKpiCardsProps) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Faturamento mensal</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-success whitespace-nowrap truncate">
            {formatBRL(kpis.monthlyRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">Receita no fluxo (mês atual)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Despesas mensais</CardTitle>
          <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-destructive whitespace-nowrap truncate">
            {formatBRL(kpis.monthlyExpenses)}
          </div>
          <p className="text-xs text-muted-foreground">Saídas no fluxo (mês atual)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Lucro líquido</CardTitle>
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-lg sm:text-xl md:text-2xl font-bold whitespace-nowrap truncate ${
              kpis.netProfit >= 0 ? 'text-success' : 'text-destructive'
            }`}
          >
            {formatBRL(kpis.netProfit)}
          </div>
          <p className="text-xs text-muted-foreground">Entradas − saídas (mês)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Contas vencidas</CardTitle>
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-lg sm:text-xl md:text-2xl font-bold ${
              kpis.overdueCount > 0 ? 'text-destructive' : 'text-success'
            }`}
          >
            {kpis.overdueCount}
          </div>
          <p className="text-xs text-muted-foreground">Títulos a receber em atraso</p>
        </CardContent>
      </Card>
    </div>
  );
}
