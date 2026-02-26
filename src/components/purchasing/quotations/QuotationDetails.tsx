import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus, Pencil, Trash2, Loader2, CheckCircle, CheckCircle2, ChevronDown,
  Download, MessageCircle, Send, X, Star, BarChart2, ShoppingCart,
} from 'lucide-react';
import { ProposalComparisonView } from './ProposalComparisonView';
import {
  QuotationService,
  STATUS_LABELS,
  STATUS_COLORS,
  EDITABLE_STATUSES,
  type Quotation,
  type QuotationItem,
  type QuotationProposal,
  type QuotationStatus,
  type ProposalFormData,
  type QuotationItemFormData,
} from '@/services/QuotationService';
import { QuotationItemModal }        from './QuotationItemModal';
import { ProposalModal }             from './ProposalModal';
import { PriceAlertBadge }          from './PriceAlertBadge';
import { NegotiationHistoryModal }   from './NegotiationHistoryModal';

interface QuotationDetailsProps {
  open:             boolean;
  onOpenChange:     (open: boolean) => void;
  quotation:        Quotation;
  items:            QuotationItem[];
  isLoading:        boolean;
  onStatusChange:   (status: QuotationStatus) => Promise<boolean>;
  onAddItem:        (data: QuotationItemFormData) => Promise<boolean>;
  onEditItem:       (itemId: string, data: Partial<QuotationItemFormData>) => Promise<boolean>;
  onDeleteItem:     (itemId: string) => Promise<boolean>;
  onAddProposal:    (itemId: string, supplierId: string, data: ProposalFormData, quantity: number) => Promise<boolean>;
  onEditProposal:   (proposalId: string, data: Partial<ProposalFormData>, qty: number) => Promise<boolean>;
  onSelectProposal: (proposalId: string, itemId: string) => Promise<boolean>;
  onDeleteProposal: (proposalId: string) => Promise<boolean>;
  onGeneratePurchaseOrders?: () => Promise<string[] | null>;
  hasPurchaseOrder?: boolean;
}

export function QuotationDetails({
  open, onOpenChange,
  quotation, items, isLoading,
  onStatusChange, onAddItem, onEditItem, onDeleteItem,
  onAddProposal, onEditProposal, onSelectProposal, onDeleteProposal,
  onGeneratePurchaseOrders,
  hasPurchaseOrder = false,
}: QuotationDetailsProps) {
  const canEdit = EDITABLE_STATUSES.includes(quotation.status);

  const [addItemOpen,          setAddItemOpen]          = useState(false);
  const [editItem,             setEditItem]             = useState<QuotationItem | null>(null);
  const [deleteItemId,         setDeleteItemId]         = useState<string | null>(null);
  const [addProposalItem,      setAddProposalItem]      = useState<QuotationItem | null>(null);
  const [editProposal,         setEditProposal]         = useState<{ proposal: QuotationProposal; item: QuotationItem } | null>(null);
  const [deleteProposalId,     setDeleteProposalId]     = useState<string | null>(null);
  const [compareOpen,          setCompareOpen]          = useState(false);
  const [generateOpen,         setGenerateOpen]         = useState(false);
  const [generating,           setGenerating]           = useState(false);
  const [negotiationSupplier,  setNegotiationSupplier]  = useState<{ id: string; name: string } | null>(null);

  // Todas as propostas selecionadas: cada item precisa ter ao menos 1 proposta marcada
  const allSelected =
    items.length > 0 &&
    items.every(item => (item.proposals ?? []).some(p => p.is_selected));

  // Botão disponível quando responded/approved, todas propostas selecionadas
  // e ainda não existe um pedido de compra gerado para esta cotação
  const canGeneratePO =
    !!onGeneratePurchaseOrders &&
    !hasPurchaseOrder &&
    allSelected &&
    ['responded', 'approved'].includes(quotation.status);

  const handleGenerate = async () => {
    if (!onGeneratePurchaseOrders) return;
    setGenerating(true);
    await onGeneratePurchaseOrders();
    setGenerating(false);
    setGenerateOpen(false);
  };

  const handleCsvDownload = () => {
    const csv = QuotationService.generateCsvContent(quotation, items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${quotation.quotation_number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWhatsApp = () => {
    const msg  = QuotationService.generateWhatsAppMessage(quotation, items);
    const link = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(link, '_blank');
  };

  const bestProposal = (proposals: QuotationProposal[]) =>
    proposals.length > 0
      ? proposals.reduce((a, b) => a.unit_price < b.unit_price ? a : b)
      : null;

  const statusTransitions: Partial<Record<QuotationStatus, QuotationStatus[]>> = {
    draft:             ['sent', 'cancelled'],
    sent:              ['waiting_proposals', 'responded', 'cancelled'],
    waiting_proposals: ['responded', 'cancelled'],
    responded:         ['approved', 'rejected', 'cancelled'],
    approved:          ['cancelled'],
    rejected:          [],
    cancelled:         [],
  };
  const nextStatuses = statusTransitions[quotation.status] ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <DialogTitle className="text-lg sm:text-xl">{quotation.quotation_number}</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Prazo: {new Date(quotation.due_date).toLocaleDateString('pt-BR')}
                  {quotation.days_until_due != null && (
                    <span className={`ml-2 font-medium ${quotation.days_until_due < 0 ? 'text-destructive' : quotation.days_until_due <= 3 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      ({quotation.days_until_due < 0 ? `${Math.abs(quotation.days_until_due)}d vencida` : `${quotation.days_until_due}d restantes`})
                    </span>
                  )}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${STATUS_COLORS[quotation.status]} border text-xs`}>
                  {STATUS_LABELS[quotation.status]}
                </Badge>
                {nextStatuses.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        Mover status <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {nextStatuses.map(s => (
                        <DropdownMenuItem key={s} onClick={() => onStatusChange(s)}>
                          {STATUS_LABELS[s]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Ações rápidas */}
          <div className="flex flex-wrap gap-2 pb-2 border-b">
            {canEdit && (
              <Button size="sm" onClick={() => setAddItemOpen(true)} className="h-8 text-xs gap-1">
                <Plus className="w-3 h-3" />Item
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleCsvDownload} className="h-8 text-xs gap-1">
              <Download className="w-3 h-3" />CSV
            </Button>
            <Button size="sm" variant="outline" onClick={handleWhatsApp} className="h-8 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50">
              <MessageCircle className="w-3 h-3" />WhatsApp
            </Button>
            {/* Comparar propostas — disponível quando há ao menos uma proposta */}
            {items.some(i => (i.proposals ?? []).length > 0) && (
              <Button size="sm" variant="outline" onClick={() => setCompareOpen(true)}
                className="h-8 text-xs gap-1 text-purple-700 border-purple-300 hover:bg-purple-50">
                <BarChart2 className="w-3 h-3" />Comparar Propostas
              </Button>
            )}
            {/* Gerar Pedido de Compra — disponível quando todas propostas estão selecionadas e PC ainda não foi gerado */}
            {canGeneratePO && (
              <Button size="sm" onClick={() => setGenerateOpen(true)}
                className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700">
                <ShoppingCart className="w-3 h-3" />Gerar Pedido de Compra
              </Button>
            )}
            {hasPurchaseOrder && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium self-center">
                <CheckCircle className="w-3 h-3" />Pedido de compra gerado
              </span>
            )}
            {!canGeneratePO && !hasPurchaseOrder && allSelected && !['responded', 'approved'].includes(quotation.status) && (
              <span className="text-xs text-muted-foreground italic self-center">
                Mova para "Respondida" para gerar pedido
              </span>
            )}
            {quotation.status === 'draft' && (
              <Button size="sm" variant="default" onClick={() => onStatusChange('sent')} className="h-8 text-xs gap-1 ml-auto">
                <Send className="w-3 h-3" />Enviar Cotação
              </Button>
            )}
          </div>

          {quotation.notes && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2 italic">
              {quotation.notes}
            </p>
          )}

          {/* Itens */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Nenhum item adicionado.
              {canEdit && (
                <Button variant="link" size="sm" onClick={() => setAddItemOpen(true)} className="ml-1 p-0 h-auto">
                  Adicionar item
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, idx) => {
                const proposals   = item.proposals ?? [];
                const best        = bestProposal(proposals);
                const hasSelected = proposals.some(p => p.is_selected);
                return (
                  <div key={item.id} className="border rounded-lg overflow-hidden">
                    {/* Header do item */}
                    <div className="flex items-start justify-between gap-2 px-3 py-2.5 bg-muted/30">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                          <span className="text-sm font-semibold truncate">{item.part_name}</span>
                          {item.part_code && <Badge variant="outline" className="text-xs">{item.part_code}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Qtd: <strong>{item.quantity}</strong>
                          {item.specifications && <span className="ml-2">· {item.specifications}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setAddProposalItem(item)} title="Adicionar proposta">
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                        {canEdit && <>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setEditItem(item)} title="Editar item">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteItemId(item.id)} title="Remover item">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>}
                      </div>
                    </div>

                    {/* Propostas */}
                    {proposals.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-3 py-2 italic">
                        Nenhuma proposta recebida.
                        <button className="ml-1 text-primary underline" onClick={() => setAddProposalItem(item)}>
                          Adicionar
                        </button>
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b bg-muted/10">
                              <th className="text-left px-3 py-1.5 font-medium">Fornecedor</th>
                              <th className="text-right px-3 py-1.5 font-medium whitespace-nowrap">Preço Unit.</th>
                              <th className="text-right px-3 py-1.5 font-medium whitespace-nowrap">Total</th>
                              <th className="text-right px-3 py-1.5 font-medium whitespace-nowrap">Prazo</th>
                              <th className="text-left px-3 py-1.5 font-medium">Pagamento</th>
                              <th className="px-3 py-1.5"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {proposals
                              .sort((a, b) => a.unit_price - b.unit_price)
                              .map(proposal => {
                                const isBest = best?.id === proposal.id;
                                return (
                                  <tr key={proposal.id}
                                    className={`border-b last:border-0 transition-colors
                                      ${proposal.is_selected ? 'bg-green-50 dark:bg-green-950/20' :
                                        isBest ? 'bg-amber-50/50 dark:bg-amber-950/10' : 'hover:bg-muted/20'}`}>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-1.5">
                                        {proposal.is_selected && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />}
                                        {isBest && !proposal.is_selected && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 flex-shrink-0" />}
                                        <span className="font-medium truncate max-w-[120px]">
                                          {proposal.supplier_trade_name || proposal.supplier_name || '—'}
                                        </span>
                                        {proposal.is_selected && (
                                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Selecionada</Badge>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap font-semibold">
                                      {proposal.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                      <PriceAlertBadge
                                        itemName={item.part_name}
                                        currentPrice={proposal.unit_price}
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap">
                                      {proposal.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap">{proposal.lead_time_days}d</td>
                                    <td className="px-3 py-2 text-muted-foreground">{proposal.payment_terms ?? '—'}</td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-1 justify-end">
                                        {!proposal.is_selected && (
                                          <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:text-green-700"
                                            title="Selecionar como vencedora"
                                            onClick={() => onSelectProposal(proposal.id, item.id)}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-6 w-6"
                                          title="Editar proposta"
                                          onClick={() => setEditProposal({ proposal, item })}>
                                          <Pencil className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:text-primary"
                                          title="Histórico de negociações"
                                          onClick={() => setNegotiationSupplier({
                                            id:   proposal.supplier_id,
                                            name: proposal.supplier_trade_name ?? proposal.supplier_name ?? '—',
                                          })}>
                                          <BarChart2 className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                                          title="Remover proposta"
                                          onClick={() => setDeleteProposalId(proposal.id)}>
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                        {!hasSelected && proposals.length > 1 && (
                          <p className="text-xs text-muted-foreground px-3 py-1.5 italic">
                            ★ Menor preço destacado. Clique em ✓ para selecionar a proposta vencedora.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modais */}
      <QuotationItemModal
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onSubmit={onAddItem}
      />
      <QuotationItemModal
        open={!!editItem}
        onOpenChange={v => { if (!v) setEditItem(null); }}
        item={editItem ?? undefined}
        onSubmit={async (data) => {
          if (!editItem) return false;
          const ok = await onEditItem(editItem.id, data);
          if (ok) setEditItem(null);
          return ok;
        }}
      />
      {addProposalItem && (
        <ProposalModal
          open={!!addProposalItem}
          onOpenChange={v => { if (!v) setAddProposalItem(null); }}
          itemName={addProposalItem.part_name}
          itemQuantity={addProposalItem.quantity}
          respondedSupplierIds={(addProposalItem.proposals ?? []).map(p => p.supplier_id)}
          onSubmit={async (supplierId, data) => {
            const ok = await onAddProposal(addProposalItem.id, supplierId, data, addProposalItem.quantity);
            if (ok) setAddProposalItem(null);
            return ok;
          }}
        />
      )}
      {editProposal && (
        <ProposalModal
          open={!!editProposal}
          onOpenChange={v => { if (!v) setEditProposal(null); }}
          proposal={editProposal.proposal}
          presetSupplierId={editProposal.proposal.supplier_id}
          itemName={editProposal.item.part_name}
          itemQuantity={editProposal.item.quantity}
          onSubmit={async (_sid, data) => {
            const ok = await onEditProposal(editProposal.proposal.id, data, editProposal.item.quantity);
            if (ok) setEditProposal(null);
            return ok;
          }}
        />
      )}

      {/* Comparativo de propostas */}
      <ProposalComparisonView
        open={compareOpen}
        onOpenChange={setCompareOpen}
        quotationId={quotation.id}
        quotationNumber={quotation.quotation_number}
        onPurchaseOrdersCreated={() => { setCompareOpen(false); onOpenChange(false); }}
      />

      {/* Confirmar exclusão de item */}
      <AlertDialog open={!!deleteItemId} onOpenChange={v => { if (!v) setDeleteItemId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item?</AlertDialogTitle>
            <AlertDialogDescription>Todas as propostas deste item também serão removidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
              onClick={async () => { if (deleteItemId) { await onDeleteItem(deleteItemId); setDeleteItemId(null); } }}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar exclusão de proposta */}
      <AlertDialog open={!!deleteProposalId} onOpenChange={v => { if (!v) setDeleteProposalId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover proposta?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
              onClick={async () => { if (deleteProposalId) { await onDeleteProposal(deleteProposalId); setDeleteProposalId(null); } }}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar geração de pedido de compra */}
      <AlertDialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar Pedidos de Compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Serão criados pedidos de compra agrupados por fornecedor com base nas propostas selecionadas.
              A cotação será marcada como <strong>Aprovada</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={generating} onClick={handleGenerate}>
              {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar e Gerar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Histórico de Negociações — US-041 */}
      <NegotiationHistoryModal
        open={!!negotiationSupplier}
        onOpenChange={(v) => { if (!v) setNegotiationSupplier(null); }}
        quotationId={quotation.id}
        supplierId={negotiationSupplier?.id}
        supplierName={negotiationSupplier?.name}
      />
    </>
  );
}
