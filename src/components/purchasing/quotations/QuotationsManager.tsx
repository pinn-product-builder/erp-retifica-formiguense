import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuotations, useQuotationDetails } from '@/hooks/useQuotations';
import { useQuotationComparison } from '@/hooks/useQuotationComparison';
import { useOrganization } from '@/contexts/OrganizationContext';
import { QuotationsList }          from './QuotationsList';
import { QuotationForm }           from './QuotationForm';
import { QuotationDetails }        from './QuotationDetails';
import { ProposalComparisonView }  from './ProposalComparisonView';
import { ReopenQuotationDialog }   from './ReopenQuotationDialog';
import { CopyQuotationDialog }     from './CopyQuotationDialog';
import { QuotationService, type Quotation } from '@/services/QuotationService';
import PurchaseOrderForm from '@/components/purchasing/PurchaseOrderForm';

export function QuotationsManager() {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const [avgLeadTimeDays, setAvgLeadTimeDays] = useState<number | null>(null);
  const {
    quotations, count, totalPages, currentPage, isLoading, filters,
    setFilters, handlePageChange, refresh,
    actions: { createQuotation, updateQuotation, updateStatus, deleteQuotation, reopenQuotation, copyQuotation },
  } = useQuotations();

  useEffect(() => {
    if (!currentOrganization?.id) {
      setAvgLeadTimeDays(null);
      return;
    }
    QuotationService.fetchAvgLeadTimeDays(currentOrganization.id)
      .then(setAvgLeadTimeDays)
      .catch(() => setAvgLeadTimeDays(null));
  }, [currentOrganization?.id, count]);

  const [formOpen,              setFormOpen]              = useState(false);
  const [newPurchaseOrderOpen,  setNewPurchaseOrderOpen]  = useState(false);
  const [editTarget,     setEditTarget]     = useState<Quotation | null>(null);
  const [viewTarget,     setViewTarget]     = useState<Quotation | null>(null);
  const [compareTarget,  setCompareTarget]  = useState<Quotation | null>(null);
  const [reopenTarget,   setReopenTarget]   = useState<Quotation | null>(null);
  const [copyTarget,     setCopyTarget]     = useState<Quotation | null>(null);

  const {
    quotation: detailQuotation,
    items:            detailItems,
    isLoading:        detailLoading,
    actions:          detailActions,
    refresh:          refreshDetails,
    hasPurchaseOrder: detailHasPurchaseOrder,
  } = useQuotationDetails(viewTarget?.id ?? null);

  const {
    items:     copyItems,
    isLoading: copyItemsLoading,
  } = useQuotationDetails(copyTarget?.id ?? null);

  const { generatePurchaseOrders } = useQuotationComparison(viewTarget?.id ?? null);

  const handleNew              = () => { setEditTarget(null); setFormOpen(true); };
  const handleNewPurchaseOrder = () => setNewPurchaseOrderOpen(true);
  const handleEdit    = (q: Quotation) => { setEditTarget(q); setFormOpen(true); };
  const handleView    = (q: Quotation) => setViewTarget(q);
  const handleCompare = (q: Quotation) => setCompareTarget(q);
  const handleReopen  = (q: Quotation) => setReopenTarget(q);
  const handleCopy    = (q: Quotation) => setCopyTarget(q);

  const handleFormSubmit = async (data: Parameters<typeof createQuotation>[0]) => {
    if (editTarget) {
      const ok = await updateQuotation(editTarget.id, data);
      return ok;
    }
    const result = await createQuotation(data);
    if (result) setViewTarget(result);
    return result;
  };

  const handleCloseDetails = () => {
    setViewTarget(null);
    refresh();
  };

  const handleCloseCompare = () => {
    setCompareTarget(null);
    refresh();
  };

  const handleReopenSuccess = (updated: Quotation) => {
    setReopenTarget(null);
    if (viewTarget?.id === updated.id) setViewTarget(updated);
    refresh();
  };

  const handleCopyConfirm = async (dueDate: string, title?: string): Promise<boolean> => {
    if (!copyTarget) return false;
    const result = await copyQuotation(copyTarget.id, dueDate, title);
    if (result) {
      const copied = result;
      setCopyTarget(null);
      setTimeout(() => setViewTarget(copied), 150);
      return true;
    }
    return false;
  };

  const handlePurchaseOrdersCreated = () => {
    setCompareTarget(null);
    navigate('/pedidos-compra');
  };

  return (
    <>
      <QuotationsList
        quotations={quotations}
        count={count}
        totalPages={totalPages}
        currentPage={currentPage}
        isLoading={isLoading}
        filters={filters}
        onFilters={setFilters}
        onPageChange={handlePageChange}
        onNew={handleNew}
        onNewPurchaseOrder={handleNewPurchaseOrder}
        onEdit={handleEdit}
        onView={handleView}
        onCompare={handleCompare}
        onDelete={deleteQuotation}
        onReopen={handleReopen}
        onCopy={handleCopy}
        avgLeadTimeDays={avgLeadTimeDays}
      />

      <QuotationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        quotation={editTarget ?? undefined}
        onSubmit={handleFormSubmit}
      />

      <PurchaseOrderForm
        open={newPurchaseOrderOpen}
        onOpenChange={setNewPurchaseOrderOpen}
        onSuccess={() => {
          setNewPurchaseOrderOpen(false);
          navigate('/pedidos-compra');
        }}
      />

      {viewTarget && detailQuotation && (
        <QuotationDetails
          open={!!viewTarget}
          onOpenChange={v => { if (!v) handleCloseDetails(); }}
          quotation={detailQuotation}
          items={detailItems}
          isLoading={detailLoading}
          onStatusChange={async (status) => {
            const ok = await updateStatus(detailQuotation.id, status);
            if (ok) await refreshDetails();
            return ok;
          }}
          onAddItem={detailActions.addItem}
          onEditItem={detailActions.updateItem}
          onDeleteItem={detailActions.deleteItem}
          onAddProposal={detailActions.addProposal}
          onEditProposal={detailActions.updateProposal}
          onSelectProposal={detailActions.selectProposal}
          onDeleteProposal={detailActions.deleteProposal}
          hasPurchaseOrder={detailHasPurchaseOrder}
          onGeneratePurchaseOrders={async () => {
            const poNumbers = await generatePurchaseOrders();
            if (poNumbers) {
              setViewTarget(null);
              navigate('/pedidos-compra');
            }
            return poNumbers;
          }}
        />
      )}

      {/* Comparativo de propostas — acessível direto da lista */}
      {compareTarget && (
        <ProposalComparisonView
          open={!!compareTarget}
          onOpenChange={v => { if (!v) handleCloseCompare(); }}
          quotationId={compareTarget.id}
          quotationNumber={compareTarget.quotation_number}
          onPurchaseOrdersCreated={handlePurchaseOrdersCreated}
        />
      )}

      {/* Reabrir cotação (US-PUR-025) */}
      {reopenTarget && (
        <ReopenQuotationDialog
          open={!!reopenTarget}
          onOpenChange={v => { if (!v) setReopenTarget(null); }}
          quotation={reopenTarget}
          onSuccess={handleReopenSuccess}
        />
      )}

      {/* Copiar cotação (US-PUR-026) */}
      {copyTarget && (
        <CopyQuotationDialog
          open={!!copyTarget}
          onOpenChange={v => { if (!v) setCopyTarget(null); }}
          quotation={copyTarget}
          items={copyItems}
          isLoadingItems={copyItemsLoading}
          onConfirm={handleCopyConfirm}
        />
      )}
    </>
  );
}
