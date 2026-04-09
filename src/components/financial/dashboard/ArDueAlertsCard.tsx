import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ChevronRight, MessageSquare, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ArDueAlertWithDetails } from '@/services/financial/arDueAlertService';
import { ArDueAlertService } from '@/services/financial/arDueAlertService';
import { formatBRL } from '@/lib/financialFormat';
import { cn } from '@/lib/utils';

type ArDueAlertsCardProps = {
  items: ArDueAlertWithDetails[];
  loading?: boolean;
  onMarkRead: (id: string) => void | Promise<void>;
  onNegotiate: (id: string) => void | Promise<void>;
};

function customerLabel(row: ArDueAlertWithDetails): string {
  const c = row.accounts_receivable?.customers;
  if (!c) return '—';
  return c.workshop_name?.trim() || c.name || '—';
}

export function ArDueAlertsCard({ items, loading, onMarkRead, onNegotiate }: ArDueAlertsCardProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="truncate">Alertas de contas a receber</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal">
              Lembretes de vencimento (7, 3 dias e hoje). Ações: abrir lista, marcar em negociação ou como lido.
            </p>
          </div>
          <Link
            to="/contas-receber?dueAlerts=1"
            className="inline-flex items-center gap-1 text-xs sm:text-sm text-primary shrink-0"
          >
            Ver contas a receber
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground py-2">Carregando alertas…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nenhum alerta ativo no momento.</p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {items.map((row) => {
              const ar = row.accounts_receivable;
              const amt = ar?.amount ?? 0;
              const due = ar?.due_date;
              const statusLabel =
                row.status === 'in_negotiation' ? (
                  <Badge variant="secondary" className="text-xs sm:text-sm shrink-0">
                    Em negociação
                  </Badge>
                ) : null;
              return (
                <li
                  key={row.id}
                  className={cn(
                    'rounded-lg border p-3 sm:p-4 space-y-2 sm:space-y-3',
                    row.status === 'in_negotiation' ? 'border-amber-500/40 bg-amber-500/5' : ''
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 min-w-0">
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                          {ArDueAlertService.alertTypeLabel(row.alert_type)}
                        </span>
                        {statusLabel}
                      </div>
                      <p className="text-sm sm:text-base font-semibold truncate">{customerLabel(row)}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                        {due && (
                          <span>
                            Venc.{' '}
                            {format(new Date(due), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </span>
                        )}
                        <span className="text-foreground font-medium tabular-nums whitespace-nowrap">
                          {formatBRL(amt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
                      asChild
                    >
                      <Link to="/contas-receber?dueAlerts=1" onClick={() => void onMarkRead(row.id)}>
                        Abrir
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto gap-1"
                      onClick={() => void onNegotiate(row.id)}
                    >
                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      Negociar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto gap-1"
                      onClick={() => void onMarkRead(row.id)}
                    >
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      Lido
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
