import { FileText, ShoppingCart, Package, ClipboardList, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DashboardCounters } from '@/services/BuyerDashboardService';

interface CounterCardProps {
  icon: React.ElementType;
  label:       string;
  mainValue:   number;
  mainLabel:   string;
  subItems?:   { label: string; value: number; alert?: boolean }[];
  colorClass:  string;
  onClick?:    () => void;
}

function CounterCard({
  icon: Icon,
  label,
  mainValue,
  mainLabel,
  subItems,
  colorClass,
  onClick,
}: CounterCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow border',
        onClick && 'hover:border-primary/30',
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
          <div className={cn('p-1.5 sm:p-2 rounded-lg', colorClass)}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-right min-w-0 flex-1">
            <div className="text-lg sm:text-xl md:text-2xl font-bold leading-none">
              {mainValue}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
              {mainLabel}
            </div>
          </div>
        </div>
        <p className="text-xs sm:text-sm font-medium text-foreground truncate mb-1.5 sm:mb-2">
          {label}
        </p>
        {subItems && subItems.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {subItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.label}</span>
                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-semibold ml-1 flex-shrink-0',
                    item.alert && item.value > 0 ? 'text-red-600' : 'text-muted-foreground',
                  )}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardCounterCardsProps {
  counters: DashboardCounters;
  onNavigate?: (route: string) => void;
}

export function DashboardCounterCards({ counters, onNavigate }: DashboardCounterCardsProps) {
  const total_quotations =
    counters.quotations.pending_proposals +
    counters.quotations.ready_to_compare +
    counters.quotations.expired;

  const total_conditionals =
    counters.conditionals.awaiting_receipt +
    counters.conditionals.in_analysis +
    counters.conditionals.overdue;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      <CounterCard
        icon={FileText}
        label="Cotações"
        mainValue={total_quotations}
        mainLabel="total ativas"
        colorClass="bg-blue-100 text-blue-700"
        subItems={[
          { label: 'Aguardando propostas', value: counters.quotations.pending_proposals },
          { label: 'Prontas p/ comparar',  value: counters.quotations.ready_to_compare  },
          { label: 'Vencidas',             value: counters.quotations.expired, alert: true },
        ]}
        onClick={() => onNavigate?.('/cotacoes')}
      />

      <CounterCard
        icon={ShoppingCart}
        label="Pedidos de Compra"
        mainValue={counters.orders.pending_approval}
        mainLabel="aguardando aprovação"
        colorClass="bg-amber-100 text-amber-700"
        subItems={[
          { label: 'Aprovados', value: counters.orders.approved },
          { label: 'Em recebimento', value: counters.orders.receiving },
        ]}
        onClick={() => onNavigate?.('/pedidos-compra')}
      />

      <CounterCard
        icon={Package}
        label="Condicionais"
        mainValue={total_conditionals}
        mainLabel="total ativos"
        colorClass="bg-purple-100 text-purple-700"
        subItems={[
          { label: 'Aguardando recebimento', value: counters.conditionals.awaiting_receipt },
          { label: 'Em análise',             value: counters.conditionals.in_analysis    },
          { label: 'Vencidos',               value: counters.conditionals.overdue, alert: true },
        ]}
        onClick={() => onNavigate?.('/condicionais')}
      />

      <CounterCard
        icon={ClipboardList}
        label="Necessidades PCP"
        mainValue={counters.needs.pending}
        mainLabel="pendentes"
        colorClass="bg-green-100 text-green-700"
        subItems={[
          { label: 'Urgentes (críticas)', value: counters.needs.urgent, alert: true },
        ]}
        onClick={() => onNavigate?.('/compras')}
      />
    </div>
  );
}

interface AlertBannerProps {
  counters: DashboardCounters;
}

export function AlertBanner({ counters }: AlertBannerProps) {
  const hasAlerts =
    counters.quotations.expired > 0 ||
    counters.conditionals.overdue > 0 ||
    counters.needs.urgent > 0;

  if (!hasAlerts) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm">
      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
      <span className="font-medium text-red-700">Atenção:</span>
      {counters.quotations.expired > 0 && (
        <span className="text-red-700">
          {counters.quotations.expired} cotaç{counters.quotations.expired === 1 ? 'ão vencida' : 'ões vencidas'}
        </span>
      )}
      {counters.conditionals.overdue > 0 && (
        <span className="text-red-700">
          · {counters.conditionals.overdue} condicional{counters.conditionals.overdue > 1 ? 'is vencidos' : ' vencido'}
        </span>
      )}
      {counters.needs.urgent > 0 && (
        <span className="text-red-700">
          · {counters.needs.urgent} necessidade{counters.needs.urgent > 1 ? 's críticas' : ' crítica'}
        </span>
      )}
    </div>
  );
}
