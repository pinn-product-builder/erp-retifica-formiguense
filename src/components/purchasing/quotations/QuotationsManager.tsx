import React, { useState } from 'react';
import { useQuotations, useQuotationDetails } from '@/hooks/useQuotations';
import { QuotationsList }          from './QuotationsList';
import { QuotationForm }           from './QuotationForm';
import { QuotationDetails }        from './QuotationDetails';
import { ProposalComparisonView }  from './ProposalComparisonView';
import type { Quotation } from '@/services/QuotationService';

export function QuotationsManager() {
  const {
    quotations, count, totalPages, currentPage, isLoading, filters,
    setFilters, handlePageChange, refresh,
    actions: { createQuotation, updateQuotation, updateStatus, deleteQuotation },
  } = useQuotations();

  const [formOpen,       setFormOpen]       = useState(false);
  const [editTarget,     setEditTarget]     = useState<Quotation | null>(null);
  const [viewTarget,     setViewTarget]     = useState<Quotation | null>(null);
  const [compareTarget,  setCompareTarget]  = useState<Quotation | null>(null);

  const {
    quotation: detailQuotation,
    items:     detailItems,
    isLoading: detailLoading,
    actions:   detailActions,
  } = useQuotationDetails(viewTarget?.id ?? null);

  const handleNew     = () => { setEditTarget(null); setFormOpen(true); };
  const handleEdit    = (q: Quotation) => { setEditTarget(q); setFormOpen(true); };
  const handleView    = (q: Quotation) => setViewTarget(q);
  const handleCompare = (q: Quotation) => setCompareTarget(q);

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
        onEdit={handleEdit}
        onView={handleView}
        onCompare={handleCompare}
        onDelete={deleteQuotation}
      />

      <QuotationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        quotation={editTarget ?? undefined}
        onSubmit={handleFormSubmit}
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
            return ok;
          }}
          onAddItem={detailActions.addItem}
          onEditItem={detailActions.updateItem}
          onDeleteItem={detailActions.deleteItem}
          onAddProposal={detailActions.addProposal}
          onEditProposal={detailActions.updateProposal}
          onSelectProposal={detailActions.selectProposal}
          onDeleteProposal={detailActions.deleteProposal}
        />
      )}

      {/* Comparativo de propostas — acessível direto da lista */}
      {compareTarget && (
        <ProposalComparisonView
          open={!!compareTarget}
          onOpenChange={v => { if (!v) handleCloseCompare(); }}
          quotationId={compareTarget.id}
          quotationNumber={compareTarget.quotation_number}
          onPurchaseOrdersCreated={handleCloseCompare}
        />
      )}
    </>
  );
}
