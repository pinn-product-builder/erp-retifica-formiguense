import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PendingApprovalRow } from '@/services/PurchaseOrderApprovalService';
import { APPROVAL_LEVEL_LABELS } from '@/services/PurchaseOrderService';
import { RejectOrderModal } from './RejectOrderModal';

interface ApprovalCardProps {
  item: PendingApprovalRow;
  onView: (id: string) => void;
  onApprove: (id: string, totalValue: number) => Promise<boolean>;
  onReject: (id: string, totalValue: number, reason: string) => Promise<boolean>;
  isApproving: boolean;
  isRejecting: boolean;
}

export function ApprovalCard({
  item,
  onView,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: ApprovalCardProps) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const totalValue = item.total_value ?? 0;
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');

  const handleRejectClick = () => setRejectModalOpen(true);

  const handleRejectConfirm = (reason: string) => onReject(item.id, totalValue, reason);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-base sm:text-lg truncate">{item.po_number}</p>
            <p className="text-sm text-muted-foreground truncate">{item.supplier_name}</p>
          </div>
          <Badge variant="secondary" className="w-fit shrink-0">
            {APPROVAL_LEVEL_LABELS[item.required_level]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-2">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm mb-4">
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm">Valor</p>
            <p className="font-semibold text-base sm:text-lg whitespace-nowrap truncate">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm">Previsão entrega</p>
            <p className="font-medium truncate">{fmt(item.expected_delivery)}</p>
          </div>
        </div>
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
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onApprove(item.id, totalValue)}
              disabled={isApproving || isRejecting}
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
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectClick}
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
