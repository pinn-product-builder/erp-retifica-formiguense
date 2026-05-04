import { StatCard } from '@/components/StatCard';
import { formatBRL } from '@/lib/financialFormat';
import type { CustomerArSummary } from '@/services/financial/customerArPositionService';
import { Clock, AlertTriangle, Banknote, CalendarDays } from 'lucide-react';

type CustomerPositionSummaryProps = {
  summary: CustomerArSummary | null;
  loading?: boolean;
};

export function CustomerPositionSummary({ summary, loading }: CustomerPositionSummaryProps) {
  if (loading && !summary) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[110px] rounded-lg border bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Resumo do documento (filtros abaixo alteram estes totais)</p>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <StatCard
          title="Em aberto (em dia)"
          value={formatBRL(summary.pendingOnTime)}
          icon={Clock}
          variant="default"
          calculationInfo="Títulos em aberto cuja data de vencimento ainda não passou, somados por valor pendente."
        />
        <StatCard
          title="Em aberto (atrasado)"
          value={formatBRL(summary.overdue)}
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          title="Total recebido"
          value={formatBRL(summary.totalReceived)}
          icon={Banknote}
          variant="success"
        />
        <StatCard
          title="Média atraso (dias)"
          value={
            summary.avgDelayDaysPaidLate != null
              ? `${summary.avgDelayDaysPaidLate} (${summary.countPaidLate} tít.)`
              : '—'
          }
          icon={CalendarDays}
          variant="warning"
          calculationInfo="Média de dias após o vencimento entre títulos quitados em atraso, quando houver."
        />
      </div>
    </div>
  );
}
