import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, Inbox, Loader2, ShieldCheck, Crown, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePurchaseOrderApprovals } from '@/hooks/usePurchaseOrderApprovals';
import { usePurchaseOrderDetails } from '@/hooks/usePurchaseOrders';
import { useOrganization } from '@/hooks/useOrganization';
import { ApprovalCard } from './ApprovalCard';
import { PurchaseOrderDetailsModal } from '../orders/PurchaseOrderDetailsModal';

export function ApprovalDashboard() {
  const { userRole } = useOrganization();
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

  const stats = React.useMemo(() => {
    const gerente = pending.filter((p) => p.required_level === 'gerente');
    const admin = pending.filter((p) => p.required_level === 'admin');
    const auto = pending.filter((p) => p.required_level === 'auto');
    const totalValue = pending.reduce((sum, p) => sum + (p.total_value ?? 0), 0);
    return { gerente, admin, auto, totalValue };
  }, [pending]);

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

      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/20 shrink-0">
                <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total pendente</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{pending.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="rounded-full p-2 bg-yellow-100 dark:bg-yellow-900/20 shrink-0">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Nível Gerente</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.gerente.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="rounded-full p-2 bg-red-100 dark:bg-red-900/20 shrink-0">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Nível Admin</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.admin.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/20 shrink-0">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Valor total</p>
                <p className="text-sm sm:text-base md:text-lg font-bold whitespace-nowrap truncate text-green-700">
                  {formatCurrency(stats.totalValue)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  userRole={userRole}
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
