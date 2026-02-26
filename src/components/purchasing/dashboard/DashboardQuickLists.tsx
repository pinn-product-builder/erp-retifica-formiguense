import { ArrowRight, Clock, DollarSign, AlertTriangle, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Quotation, QuotationStatus } from '@/services/QuotationService';
import type { PurchaseOrderRow } from '@/services/PurchaseOrderService';
import type { ConditionalOrder } from '@/services/ConditionalOrderService';
import type { PurchaseNeed } from '@/hooks/usePurchaseNeeds';

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function DeadlineBadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days < 0) {
    return <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 whitespace-nowrap">Vencido</Badge>;
  }
  if (days === 0) {
    return <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 whitespace-nowrap">Hoje!</Badge>;
  }
  if (days <= 2) {
    return <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-200 whitespace-nowrap">{days}d</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] whitespace-nowrap">{days}d</Badge>;
}

const QUOTATION_STATUS_COLORS: Record<QuotationStatus, string> = {
  draft:             'bg-gray-100 text-gray-700',
  sent:              'bg-blue-100 text-blue-700',
  waiting_proposals: 'bg-yellow-100 text-yellow-700',
  responded:         'bg-purple-100 text-purple-700',
  approved:          'bg-green-100 text-green-700',
  rejected:          'bg-red-100 text-red-700',
  cancelled:         'bg-gray-100 text-gray-400',
};
const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft:             'Rascunho',
  sent:              'Enviada',
  waiting_proposals: 'Ag. Propostas',
  responded:         'Respondida',
  approved:          'Aprovada',
  rejected:          'Rejeitada',
  cancelled:         'Cancelada',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:      'bg-gray-100 text-gray-600 border-gray-200',
};
const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Crítica',
  high:     'Alta',
  medium:   'Média',
  low:      'Baixa',
};

// ── Cotações Pendentes ────────────────────────────────────────────────────────

interface PendingQuotationsListProps {
  quotations: Quotation[];
  onNavigate?: () => void;
}

export function PendingQuotationsList({ quotations, onNavigate }: PendingQuotationsListProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            Cotações Aguardando
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onNavigate} className="h-7 text-xs gap-1 flex-shrink-0">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 flex-1">
        {quotations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma cotação pendente</p>
        ) : (
          <div className="space-y-2">
            {quotations.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">{q.quotation_number}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {q.title ?? 'Sem título'}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge
                    className={cn(
                      'text-[10px] hidden sm:inline-flex',
                      QUOTATION_STATUS_COLORS[q.status],
                    )}
                  >
                    {QUOTATION_STATUS_LABELS[q.status]}
                  </Badge>
                  <DeadlineBadge dateStr={q.due_date} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Pedidos Aguardando Aprovação ──────────────────────────────────────────────

interface PendingApprovalsListProps {
  orders: PurchaseOrderRow[];
  onNavigate?: () => void;
}

export function PendingApprovalsList({ orders, onNavigate }: PendingApprovalsListProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-600 flex-shrink-0" />
            Pedidos para Aprovar
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onNavigate} className="h-7 text-xs gap-1 flex-shrink-0">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 flex-1">
        {orders.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum pedido aguardando aprovação</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">{o.po_number}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {o.supplier?.name ?? '—'}
                  </p>
                </div>
                <span className="text-xs sm:text-sm font-semibold whitespace-nowrap text-amber-700 flex-shrink-0">
                  {formatCurrency(o.total_value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Condicionais Urgentes ─────────────────────────────────────────────────────

interface UrgentConditionalsListProps {
  conditionals: ConditionalOrder[];
  onNavigate?: () => void;
}

export function UrgentConditionalsList({ conditionals, onNavigate }: UrgentConditionalsListProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-purple-600 flex-shrink-0" />
            Condicionais Urgentes
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onNavigate} className="h-7 text-xs gap-1 flex-shrink-0">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 flex-1">
        {conditionals.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum condicional urgente</p>
        ) : (
          <div className="space-y-2">
            {conditionals.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">{c.conditional_number}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {c.supplier?.name ?? '—'}
                  </p>
                </div>
                <DeadlineBadge dateStr={c.expiry_date} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Necessidades do PCP ───────────────────────────────────────────────────────

interface PurchaseNeedsListProps {
  needs: PurchaseNeed[];
  onNavigate?: () => void;
}

export function PurchaseNeedsList({ needs, onNavigate }: PurchaseNeedsListProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-green-600 flex-shrink-0" />
            Necessidades do PCP
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onNavigate} className="h-7 text-xs gap-1 flex-shrink-0">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 flex-1">
        {needs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma necessidade pendente</p>
        ) : (
          <div className="space-y-2">
            {needs.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">{n.part_name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {n.part_code} · Qtd: {n.shortage_quantity}
                  </p>
                </div>
                <Badge
                  className={cn(
                    'text-[10px] flex-shrink-0',
                    PRIORITY_COLORS[n.priority_level] ?? 'bg-gray-100 text-gray-600',
                  )}
                >
                  {PRIORITY_LABELS[n.priority_level] ?? n.priority_level}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
