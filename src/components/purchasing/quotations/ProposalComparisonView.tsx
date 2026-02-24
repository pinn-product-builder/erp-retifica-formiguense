import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Badge }    from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label }    from '@/components/ui/label';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import {
  Loader2, CheckCircle2, Trophy, Zap, DollarSign,
  Star, ShoppingCart, Printer, Info,
} from 'lucide-react';
import { useQuotationComparison }  from '@/hooks/useQuotationComparison';
import type { ProposalRow, ComparisonItem } from '@/services/ComparisonService';

// ── Badges visuais ─────────────────────────────────────────────────────────────
function ProposalBadges({ row }: { row: ProposalRow }) {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {row.is_best_price && (
        <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 gap-0.5">
          <DollarSign className="w-2.5 h-2.5" />Menor Preço
        </Badge>
      )}
      {row.is_best_lead_time && (
        <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200 gap-0.5">
          <Zap className="w-2.5 h-2.5" />Menor Prazo
        </Badge>
      )}
      {row.is_preferred && (
        <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 gap-0.5">
          <Star className="w-2.5 h-2.5" />Preferencial
        </Badge>
      )}
    </div>
  );
}

// ── Linha de comparação de um item ────────────────────────────────────────────
function ItemComparisonTable({
  item,
  onSelect,
}: {
  item:     ComparisonItem;
  onSelect: (row: ProposalRow) => void;
}) {
  const proposals     = [...item.proposals].sort((a, b) => b.score - a.score);
  const recommended   = item.recommended;
  const hasSelection  = proposals.some(p => p.is_selected);

  const fmtCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Cabeçalho do item */}
      <div className="px-3 py-2.5 bg-muted/30 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold">{item.part_name}</span>
        {item.part_code && <Badge variant="outline" className="text-xs">{item.part_code}</Badge>}
        <span className="text-xs text-muted-foreground">Qtd: {item.quantity}</span>
        {item.specifications && (
          <span className="text-xs text-muted-foreground italic">{item.specifications}</span>
        )}
      </div>

      {proposals.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground italic">
          Nenhuma proposta recebida para este item.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs print:text-[10px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-28 min-w-[7rem]">
                  Critério
                </th>
                {proposals.map(p => (
                  <th key={p.proposal_id}
                    className={`text-center px-3 py-2 font-medium min-w-[9rem]
                      ${p.is_selected ? 'bg-green-50 dark:bg-green-950/20' :
                        recommended?.proposal_id === p.proposal_id ? 'bg-amber-50/60 dark:bg-amber-950/10' : ''}`}>
                    <div className="flex flex-col items-center gap-1">
                      <span className="truncate max-w-[8rem]">{p.supplier_name}</span>
                      {p.supplier_rating != null && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          {p.supplier_rating.toFixed(1)}
                        </span>
                      )}
                      <ProposalBadges row={p} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Preço unitário */}
              <tr className="border-b hover:bg-muted/20">
                <td className="px-3 py-2 font-medium text-muted-foreground">Preço Unit.</td>
                {proposals.map(p => (
                  <td key={p.proposal_id}
                    className={`text-center px-3 py-2 whitespace-nowrap font-semibold
                      ${p.is_selected ? 'bg-green-50/50 dark:bg-green-950/10' : ''}
                      ${p.is_best_price ? 'text-green-700' : ''}`}>
                    {fmtCurrency(p.unit_price)}
                  </td>
                ))}
              </tr>
              {/* Total */}
              <tr className="border-b hover:bg-muted/20">
                <td className="px-3 py-2 font-medium text-muted-foreground">Total</td>
                {proposals.map(p => (
                  <td key={p.proposal_id}
                    className={`text-center px-3 py-2 whitespace-nowrap
                      ${p.is_selected ? 'bg-green-50/50 dark:bg-green-950/10' : ''}`}>
                    {fmtCurrency(p.total_price)}
                  </td>
                ))}
              </tr>
              {/* Prazo */}
              <tr className="border-b hover:bg-muted/20">
                <td className="px-3 py-2 font-medium text-muted-foreground">Prazo Entrega</td>
                {proposals.map(p => (
                  <td key={p.proposal_id}
                    className={`text-center px-3 py-2 whitespace-nowrap
                      ${p.is_selected ? 'bg-green-50/50 dark:bg-green-950/10' : ''}
                      ${p.is_best_lead_time ? 'text-blue-700 font-semibold' : ''}`}>
                    {p.lead_time_days}d
                  </td>
                ))}
              </tr>
              {/* Pagamento */}
              <tr className="border-b hover:bg-muted/20">
                <td className="px-3 py-2 font-medium text-muted-foreground">Pagamento</td>
                {proposals.map(p => (
                  <td key={p.proposal_id}
                    className={`text-center px-3 py-2 ${p.is_selected ? 'bg-green-50/50 dark:bg-green-950/10' : ''}`}>
                    {p.payment_terms ?? '—'}
                  </td>
                ))}
              </tr>
              {/* Score */}
              <tr className="border-b hover:bg-muted/20">
                <td className="px-3 py-2 font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Score
                    <span title="40% preço · 30% prazo · 20% rating · 10% preferencial" className="cursor-help">
                      <Info className="w-3 h-3 text-muted-foreground/60" />
                    </span>
                  </span>
                </td>
                {proposals.map((p, idx) => (
                  <td key={p.proposal_id}
                    className={`text-center px-3 py-2 font-bold
                      ${p.is_selected ? 'bg-green-50/50 dark:bg-green-950/10' : ''}
                      ${idx === 0 ? 'text-amber-600' : ''}`}>
                    <span className="flex items-center justify-center gap-1">
                      {idx === 0 && <Trophy className="w-3 h-3 text-amber-500" />}
                      {p.score}
                    </span>
                  </td>
                ))}
              </tr>
              {/* Botões de seleção */}
              <tr>
                <td className="px-3 py-2 text-muted-foreground font-medium">Decisão</td>
                {proposals.map(p => (
                  <td key={p.proposal_id}
                    className={`text-center px-3 py-2 ${p.is_selected ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                    {p.is_selected ? (
                      <span className="flex items-center justify-center gap-1 text-green-700 font-medium">
                        <CheckCircle2 className="w-4 h-4" />Selecionada
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs w-full"
                        onClick={() => onSelect(p)}>
                        Selecionar
                      </Button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Recomendação */}
      {recommended && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border-t flex items-center gap-2 flex-wrap">
          <Trophy className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
            Recomendado: <strong>{recommended.supplier_name}</strong>
            {recommended.is_preferred && ' · Fornecedor Preferencial'}
            {recommended.is_best_price && !recommended.is_preferred && ' · Menor Preço'}
            {' · '}Score {recommended.score}
          </span>
          {!hasSelection && (
            <Button size="sm" variant="ghost" className="h-6 text-xs ml-auto text-amber-700 hover:bg-amber-100"
              onClick={() => onSelect(recommended)}>
              Aplicar recomendação
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal principal ────────────────────────────────────────────────────────────
interface ProposalComparisonViewProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  quotationId:   string;
  quotationNumber: string;
  onPurchaseOrdersCreated?: () => void;
}

export function ProposalComparisonView({
  open,
  onOpenChange,
  quotationId,
  quotationNumber,
  onPurchaseOrdersCreated,
}: ProposalComparisonViewProps) {
  const { items, isLoading, allSelected, selectProposal, generatePurchaseOrders } =
    useQuotationComparison(open ? quotationId : null);

  // ── Justificativa ─────────────────────────────────────────────────────────
  const [justifyOpen,     setJustifyOpen]     = useState(false);
  const [pendingRow,      setPendingRow]       = useState<ProposalRow | null>(null);
  const [justifyText,     setJustifyText]      = useState('');
  const [justifyLoading,  setJustifyLoading]   = useState(false);

  // ── Gerar Pedido ──────────────────────────────────────────────────────────
  const [generateOpen,    setGenerateOpen]     = useState(false);
  const [generating,      setGenerating]       = useState(false);

  const handleSelectClick = (row: ProposalRow) => {
    if (row.is_best_price) {
      // Seleção direta se for o melhor preço
      selectProposal(row.quotation_item_id, row.proposal_id);
    } else {
      // Exige justificativa
      setPendingRow(row);
      setJustifyText('');
      setJustifyOpen(true);
    }
  };

  const handleConfirmJustify = async () => {
    if (!pendingRow || !justifyText.trim()) return;
    setJustifyLoading(true);
    await selectProposal(pendingRow.quotation_item_id, pendingRow.proposal_id, justifyText.trim());
    setJustifyLoading(false);
    setJustifyOpen(false);
    setPendingRow(null);
    setJustifyText('');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const poNumbers = await generatePurchaseOrders();
    setGenerating(false);
    setGenerateOpen(false);
    if (poNumbers) {
      onPurchaseOrdersCreated?.();
    }
  };

  const handlePrint = () => window.print();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[98vw] sm:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 print:max-w-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <DialogTitle>Comparar Propostas — {quotationNumber}</DialogTitle>
                <DialogDescription className="text-xs">
                  Score: 40% preço · 30% prazo · 20% rating do fornecedor · 10% preferencial
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={handlePrint} className="h-8 text-xs gap-1">
                  <Printer className="w-3.5 h-3.5" />Imprimir / PDF
                </Button>
                {allSelected && (
                  <Button size="sm" onClick={() => setGenerateOpen(true)} className="h-8 text-xs gap-1">
                    <ShoppingCart className="w-3.5 h-3.5" />Gerar Pedido de Compra
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Print header (visível só no print) */}
          <div className="hidden print:block mb-4">
            <h1 className="text-lg font-bold">Comparativo de Propostas — {quotationNumber}</h1>
            <p className="text-xs text-gray-500">Score: 40% preço · 30% prazo · 20% fornecedor · 10% preferencial</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Nenhuma proposta registrada para comparação.
            </div>
          ) : (
            <div className="space-y-5">
              {items.map(item => (
                <ItemComparisonTable key={item.quotation_item_id} item={item} onSelect={handleSelectClick} />
              ))}

              {!allSelected && (
                <p className="text-xs text-muted-foreground text-center italic">
                  Selecione uma proposta vencedora para cada item para habilitar a geração de pedido de compra.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal de justificativa ──────────────────────────────────────────── */}
      <AlertDialog open={justifyOpen} onOpenChange={setJustifyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Justificativa necessária</AlertDialogTitle>
            <AlertDialogDescription>
              A proposta de <strong>{pendingRow?.supplier_name}</strong> não é o menor preço
              ({pendingRow?.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).
              Informe o motivo da escolha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2 space-y-1">
            <Label htmlFor="justification" className="text-sm">Justificativa *</Label>
            <Textarea
              id="justification"
              value={justifyText}
              onChange={e => setJustifyText(e.target.value)}
              rows={3}
              placeholder="Ex: Fornecedor preferencial com histórico excelente; diferença de preço compensada pelo prazo menor..."
            />
            {justifyText.trim().length === 0 && (
              <p className="text-xs text-destructive">Justificativa é obrigatória</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingRow(null); setJustifyText(''); }}>
              Cancelar
            </AlertDialogCancel>
            <Button
              disabled={justifyText.trim().length === 0 || justifyLoading}
              onClick={handleConfirmJustify}
              className="ml-2"
            >
              {justifyLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Seleção
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirmar geração de pedido ──────────────────────────────────────── */}
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
            <Button disabled={generating} onClick={handleGenerate}>
              {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar e Gerar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
