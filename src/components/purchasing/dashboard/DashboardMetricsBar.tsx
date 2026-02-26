import { TrendingUp, Clock, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { DashboardMetrics } from '@/services/BuyerDashboardService';

interface DashboardMetricsBarProps {
  metrics: DashboardMetrics;
}

export function DashboardMetricsBar({ metrics }: DashboardMetricsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
      <Card>
        <CardContent className="p-3 sm:p-4 flex items-center gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 text-green-700 flex-shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Compras do Mês</p>
            <p className="text-base sm:text-lg font-bold whitespace-nowrap truncate">
              {formatCurrency(metrics.month_purchases)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 flex items-center gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Lead Time Médio</p>
            <p className="text-base sm:text-lg font-bold whitespace-nowrap">
              {metrics.avg_lead_time > 0 ? `${metrics.avg_lead_time} dias` : '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 flex items-center gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
            <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Economia Negociada</p>
            <p className="text-base sm:text-lg font-bold whitespace-nowrap">
              {metrics.savings_percentage > 0 ? `${metrics.savings_percentage.toFixed(1)}%` : '—'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
