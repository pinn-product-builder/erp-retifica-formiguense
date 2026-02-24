import React, { useState } from 'react';
import { PurchaseOrdersList } from './PurchaseOrdersList';
import { PurchaseOrderEditModal } from './PurchaseOrderEditModal';
import { PurchaseOrderDetailsModal } from './PurchaseOrderDetailsModal';
import { usePurchaseOrders, usePurchaseOrderDetails } from '@/hooks/usePurchaseOrders';
import { PurchaseOrderRow } from '@/services/PurchaseOrderService';
import PurchaseOrderForm from '@/components/purchasing/PurchaseOrderForm';

export function PurchaseOrdersManager() {
  const {
    orders,
    count,
    totalPages,
    page,
    pageSize,
    isLoading,
    filters,
    stats,
    setFilters,
    setPage,
    update,
    approve,
    send,
    confirm,
    cancel,
    refresh,
  } = usePurchaseOrders();

  const [viewId,      setViewId]      = useState<string | null>(null);
  const [editTarget,  setEditTarget]  = useState<PurchaseOrderRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen,    setEditOpen]    = useState(false);
  const [newFormOpen, setNewFormOpen] = useState(false);

  const { order: detailOrder, isLoading: detailLoading, refresh: refreshDetail } = usePurchaseOrderDetails(viewId);

  const handleView = (order: PurchaseOrderRow) => {
    setViewId(order.id);
    setDetailsOpen(true);
  };

  const handleEdit = (order: PurchaseOrderRow) => {
    setEditTarget(order);
    setEditOpen(true);
  };

  const handleEditFromDetails = () => {
    if (detailOrder) {
      setEditTarget(detailOrder);
      setEditOpen(true);
    }
  };

  const handleActionInDetails = async (
    action: (id: string) => Promise<boolean>,
    id: string,
  ) => {
    const ok = await action(id);
    if (ok) refreshDetail();
    return ok;
  };

  return (
    <>
      <PurchaseOrdersList
        orders={orders}
        count={count}
        totalPages={totalPages}
        page={page}
        pageSize={pageSize}
        isLoading={isLoading}
        filters={filters}
        stats={stats}
        onFilters={setFilters}
        onPage={setPage}
        onNew={() => setNewFormOpen(true)}
        onView={handleView}
        onEdit={handleEdit}
        onApprove={approve}
        onSend={send}
        onConfirm={confirm}
        onCancel={cancel}
      />

      <PurchaseOrderForm
        open={newFormOpen}
        onOpenChange={setNewFormOpen}
        onSuccess={() => { setNewFormOpen(false); refresh(); }}
      />

      <PurchaseOrderDetailsModal
        open={detailsOpen}
        onOpenChange={(o) => {
          setDetailsOpen(o);
          if (!o) { setViewId(null); refresh(); }
        }}
        order={detailOrder}
        isLoading={detailLoading}
        onEdit={handleEditFromDetails}
        onApprove={(id) => handleActionInDetails(approve, id)}
        onSend={(id) => handleActionInDetails(send, id)}
        onConfirm={(id) => handleActionInDetails(confirm, id)}
        onCancel={(id) => handleActionInDetails(cancel, id)}
      />

      <PurchaseOrderEditModal
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditTarget(null);
        }}
        order={editTarget}
        onSave={async (id, data) => {
          const ok = await update(id, data);
          if (ok && detailOrder?.id === id) refreshDetail();
          return ok;
        }}
      />
    </>
  );
}
