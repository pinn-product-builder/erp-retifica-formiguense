import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, XCircle, Eye, Loader2, Package, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  PendingApprovalRow,
  PurchaseOrderApprovalService,
} from '@/services/PurchaseOrderApprovalService';
import { APPROVAL_LEVEL_LABELS } from '@/services/PurchaseOrderService';
import { RejectOrderModal } from './RejectOrderModal';

interface ApprovalCardProps {
  item: PendingApprovalRow;
  userRole?: string | null;
  onView: (id: string) => void;
  onApprove: (id: string, totalValue: number) => Promise<boolean>;
  onReject: (id: string, totalValue: number, reason: string) => Promise<boolean>;
  isApproving: boolean;
  isRejecting: boolean;
}

const LEVEL_BADGE_COLORS: Record<string, string> = {
  auto:    'bg-green-100 text-green-700 border-green-200',
  gerente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  admin:   'bg-red-100 text-red-700 border-red-200',
};

export function ApprovalCard({
  item,
  userRole,
  onView,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: ApprovalCardProps) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const totalValue = item.total_value ?? 0;
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');

  const canApprove = PurchaseOrderApprovalService.canApproveAtLevel(
    (userRole as Parameters<typeof PurchaseOrderApprovalService.canApproveAtLevel>[0]) ?? null,
    item.required_level,
  );

  const approveDisabled = !canApprove || isApproving || isRejecting;

  const handleRejectConfirm = (reason: string) => onReject(item.id, totalValue, reason);

  const approveButton = (
    <Button
      size="sm"
      onClick={() => onApprove(item.id, totalValue)}
      disabled={approveDisabled}
      className="flex-1 sm:flex-initial"
    >
      {isApproving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <CheckCircle className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Aprovar</span>
        </>
      )}
    </Button>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-base sm:text-lg truncate">{item.po_number}</p>
            <p className="text-sm text-muted-foreground truncate">{item.supplier_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Criado: {fmt(item.created_at)}</p>
          </div>
          <Badge
            className={`w-fit shrink-0 text-xs border ${LEVEL_BADGE_COLORS[item.required_level] ?? ''}`}
            variant="outline"
          >
            {APPROVAL_LEVEL_LABELS[item.required_level] ?? item.required_level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-2 space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm">Valor total</p>
            <p className="font-semibold text-base sm:text-lg whitespace-nowrap truncate text-green-700">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm">Previsão entrega</p>
            <p className="font-medium truncate">{fmt(item.expected_delivery)}</p>
          </div>
        </div>

        {(item.items_preview ?? []).length > 0 && (
          <div className="rounded-md border bg-muted/30 p-2 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Package className="h-3 w-3" />
              <span>{item.items_count} {item.items_count === 1 ? 'item' : 'itens'}</span>
            </div>
            {(item.items_preview ?? []).map((it, idx) => (
              <div key={idx} className="flex justify-between text-xs gap-2">
                <span className="truncate text-foreground">{it.item_name}</span>
                <span className="whitespace-nowrap text-muted-foreground shrink-0">
                  {it.quantity} × {formatCurrency(it.unit_price)}
                </span>
              </div>
            ))}
            {(item.items_count ?? 0) > 3 && (
              <p className="text-xs text-muted-foreground italic">
                + {(item.items_count ?? 0) - 3} mais...
              </p>
            )}
          </div>
        )}

        {!canApprove && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-2 text-xs text-amber-700 dark:text-amber-400">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Requer aprovação do{' '}
              <strong>{APPROVAL_LEVEL_LABELS[item.required_level] ?? item.required_level}</strong>.
              Você não tem permissão para aprovar.
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(item.id)}
            className="flex-1 sm:flex-initial"
          >
            <Eye className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Ver detalhes</span>
          </Button>
          <div className="flex gap-2 flex-1 sm:flex-initial">
            {canApprove ? (
              approveButton
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>{approveButton}</TooltipTrigger>
                  <TooltipContent>
                    <p>Permissão insuficiente para aprovar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setRejectModalOpen(true)}
              disabled={isApproving || isRejecting}
              className="flex-1 sm:flex-initial"
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Rejeitar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      <RejectOrderModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        poNumber={item.po_number}
        onConfirm={handleRejectConfirm}
      />
    </Card>
  );
}
