import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Send, ArrowUpCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  PurchaseOrderApprovalService,
  type ApprovalHistoryRow,
} from '@/services/PurchaseOrderApprovalService';

interface ApprovalHistoryTimelineProps {
  orderId: string;
}

const ACTION_CONFIG: Record<
  ApprovalHistoryRow['action'],
  { label: string; icon: React.ElementType; color: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  enviado:   { label: 'Enviado para aprovação', icon: Send,          color: 'text-blue-500',   badgeVariant: 'outline' },
  aprovado:  { label: 'Aprovado',               icon: CheckCircle2,  color: 'text-green-500',  badgeVariant: 'default' },
  rejeitado: { label: 'Rejeitado',              icon: XCircle,       color: 'text-red-500',    badgeVariant: 'destructive' },
  escalado:  { label: 'Escalado',               icon: ArrowUpCircle, color: 'text-orange-500', badgeVariant: 'secondary' },
};

const LEVEL_LABELS: Record<string, string> = {
  auto:    'Auto-aprovação',
  gerente: 'Gerente',
  admin:   'Administrador',
};

export function ApprovalHistoryTimeline({ orderId }: ApprovalHistoryTimelineProps) {
  const [history, setHistory] = useState<ApprovalHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    PurchaseOrderApprovalService.listHistory(orderId)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum evento de aprovação registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((event, idx) => {
        const cfg = ACTION_CONFIG[event.action] ?? ACTION_CONFIG.enviado;
        const Icon = cfg.icon;
        const isLast = idx === history.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-1.5 bg-background border-2 ${
                event.action === 'aprovado' ? 'border-green-500' :
                event.action === 'rejeitado' ? 'border-red-500' :
                event.action === 'escalado' ? 'border-orange-500' :
                'border-blue-500'
              }`}>
                <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>

            <Card className="flex-1 mb-1">
              <CardContent className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-xs sm:text-sm">{cfg.label}</span>
                    <Badge variant={cfg.badgeVariant} className="text-xs h-5">
                      {LEVEL_LABELS[event.required_level] ?? event.required_level}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(event.performed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {event.rejection_reason && (
                  <div className="mt-1.5 p-2 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <p className="text-xs text-red-700 dark:text-red-400">
                      <span className="font-medium">Motivo da rejeição: </span>
                      {event.rejection_reason}
                    </p>
                  </div>
                )}

                {event.notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">{event.notes}</p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
