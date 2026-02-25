import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

const GOAL_DAYS = 7;

interface Props {
  avgLeadTimeDays: number;
}

export function LeadTimeAnalysis({ avgLeadTimeDays }: Props) {
  const withinGoal   = avgLeadTimeDays > 0 && avgLeadTimeDays <= GOAL_DAYS;
  const pct          = avgLeadTimeDays > 0
    ? Math.min(100, (avgLeadTimeDays / (GOAL_DAYS * 1.5)) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-5 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Clock className="h-4 w-4 text-blue-500" />
          Lead Time Médio
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-5 pt-0 space-y-3">
        {avgLeadTimeDays === 0 ? (
          <p className="text-sm text-muted-foreground">Sem pedidos entregues no período</p>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <span className="text-2xl sm:text-3xl font-bold">
                {avgLeadTimeDays.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground mb-1">dias</span>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${withinGoal ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Meta: {GOAL_DAYS} dias
                {withinGoal
                  ? <span className="text-green-600 font-medium">✓ Dentro da meta</span>
                  : <span className="text-amber-600 font-medium">Acima da meta</span>}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
