import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, Inbox, Loader2 } from 'lucide-react';
import { usePurchaseOrderApprovals } from '@/hooks/usePurchaseOrderApprovals';
import { usePurchaseOrderDetails } from '@/hooks/usePurchaseOrders';
import { ApprovalCard } from './ApprovalCard';
import { PurchaseOrderDetailsModal } from '../orders/PurchaseOrderDetailsModal';

export function ApprovalDashboard() {
  const {
    pending,
    isLoading,
    approvingId,
    rejectingId,
    approve,
    reject,
  } = usePurchaseOrderApprovals();

  const [viewId, setViewId] = React.useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const { order: detailOrder, isLoading: detailLoading, refresh: refreshDetail } = usePurchaseOrderDetails(viewId);

  const handleView = (id: string) => {
    setViewId(id);
    setDetailsOpen(true);
  };

  const handleApprove = async (id: string, totalValue: number) => {
    const ok = await approve(id, totalValue);
    if (ok && viewId === id) refreshDetail();
    return ok;
  };

  const handleReject = async (id: string, totalValue: number, reason: string) => {
    const ok = await reject(id, totalValue, reason);
    if (ok && viewId === id) refreshDetail();
    return ok;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ThumbsUp className="h-6 w-6 sm:h-7 sm:w-7" />
          Aprovações de Pedidos
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Pedidos aguardando sua aprovação
        </p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
              <p className="text-base sm:text-lg font-medium">Nenhum pedido pendente</p>
              <p className="text-sm text-muted-foreground mt-1">
                Não há pedidos aguardando aprovação no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((item) => (
                <ApprovalCard
                  key={item.id}
                  item={item}
                  onView={handleView}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isApproving={approvingId === item.id}
                  isRejecting={rejectingId === item.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PurchaseOrderDetailsModal
        open={detailsOpen}
        onOpenChange={(o) => {
          setDetailsOpen(o);
          if (!o) setViewId(null);
        }}
        order={detailOrder}
        isLoading={detailLoading}
        onApprove={detailOrder ? (id) => handleApprove(id, detailOrder.total_value ?? 0) : undefined}
      />
    </div>
  );
}
