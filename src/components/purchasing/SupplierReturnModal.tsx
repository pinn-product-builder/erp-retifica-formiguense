import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, RotateCcw, Package } from 'lucide-react';
import { useSupplierReturns } from '@/hooks/useSupplierReturns';
import {
  RETURN_REASONS,
  type ReturnReason,
  type CreateReturnItemInput,
  type ReceiptItemForReturn,
} from '@/services/SupplierReturnService';
import { formatCurrency } from '@/lib/utils';

interface ReturnItemState extends ReceiptItemForReturn {
  selected: boolean;
  return_quantity: number;
  reason: ReturnReason;
  reason_details: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  receiptId: string;
  onSuccess?: () => void;
}

export function SupplierReturnModal({ open, onOpenChange, receiptId, onSuccess }: Props) {
  const { createReturn, isSaving, isLoadingReceipt, fetchReceiptForReturn } = useSupplierReturns();

  const [receipt, setReceipt] = useState<{
    id: string;
    receipt_number: string;
    purchase_order_id: string;
    supplier_id: string;
    supplier_name: string;
    po_number: string;
  } | null>(null);
  const [items, setItems] = useState<ReturnItemState[]>([]);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open || !receiptId) return;
    fetchReceiptForReturn(receiptId).then(data => {
      if (!data) return;
      const { items: rcptItems, ...header } = data;
      setReceipt(header);
      setItems(rcptItems.map(i => ({
        ...i,
        selected:        false,
        return_quantity: i.approved_quantity ?? i.received_quantity,
        reason:          'defeito' as ReturnReason,
        reason_details:  '',
      })));
    });
  }, [open, receiptId, fetchReceiptForReturn]);

  const toggle = (id: string, checked: boolean) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: checked } : i));

  const update = <K extends keyof ReturnItemState>(id: string, field: K, value: ReturnItemState[K]) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const selected = items.filter(i => i.selected);
  const totalAmount = selected.reduce((s, i) => s + i.return_quantity * i.unit_cost, 0);

  const handleSubmit = async () => {
    if (!receipt || selected.length === 0) return;

    const returnItems: CreateReturnItemInput[] = selected.map(i => ({
      receipt_item_id: i.id,
      part_id:         i.part_id,
      item_name:       i.item_name,
      quantity:        i.return_quantity,
      reason:          i.reason,
      reason_details:  i.reason_details || undefined,
      unit_cost:       i.unit_cost,
    }));

    const result = await createReturn({
      receipt_id:        receipt.id,
      purchase_order_id: receipt.purchase_order_id,
      supplier_id:       receipt.supplier_id,
      return_date:       returnDate,
      notes:             notes || undefined,
      items:             returnItems,
    });

    if (result) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
            Devolução ao Fornecedor
          </DialogTitle>
        </DialogHeader>

        {isLoadingReceipt ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Carregando dados do recebimento...</div>
        ) : (
          <div className="space-y-5">
            {receipt && (
              <Card>
                <CardContent className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Recebimento</p>
                    <p className="font-medium">{receipt.receipt_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pedido Original</p>
                    <p className="font-medium">{receipt.po_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fornecedor</p>
                    <p className="font-medium">{receipt.supplier_name}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Data da Devolução *</Label>
                <Input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Itens para Devolução
              </h3>

              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum item encontrado neste recebimento</p>
              ) : (
                items.map(item => (
                  <Card key={item.id} className={item.selected ? 'border-primary/60 bg-primary/5' : ''}>
                    <CardContent className="p-3 sm:p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={(v) => toggle(item.id, !!v)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.item_name}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            <span>Recebido: <strong>{item.received_quantity}</strong></span>
                            <span>Aprovado: <strong>{item.approved_quantity}</strong></span>
                            <span>Custo unit.: <strong>{formatCurrency(item.unit_cost)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {item.selected && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-7">
                          <div>
                            <Label className="text-xs">Qtd. a Devolver *</Label>
                            <Input
                              type="number"
                              min={1}
                              max={item.approved_quantity || item.received_quantity}
                              value={item.return_quantity}
                              onChange={e => update(item.id, 'return_quantity', Math.max(0, Math.round(Number(e.target.value))))}
                              className="text-center"
                            />
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Subtotal: {formatCurrency(item.return_quantity * item.unit_cost)}
                            </p>
                          </div>

                          <div>
                            <Label className="text-xs">Motivo *</Label>
                            <Select
                              value={item.reason}
                              onValueChange={(v) => update(item.id, 'reason', v as ReturnReason)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RETURN_REASONS.map(r => (
                                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Detalhes do Motivo</Label>
                            <Input
                              value={item.reason_details}
                              onChange={e => update(item.id, 'reason_details', e.target.value)}
                              placeholder="Descreva o problema..."
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Solicitar nota de crédito ou reposição dos produtos..."
                rows={3}
              />
            </div>

            {selected.length > 0 && (
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="p-3 sm:p-4">
                  <h4 className="font-semibold text-sm mb-2">Resumo da Devolução</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Itens selecionados:</span>
                      <strong>{selected.length}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de peças:</span>
                      <strong>{selected.reduce((s, i) => s + i.return_quantity, 0)}</strong>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">Valor total a devolver:</span>
                      <strong className="text-primary">{formatCurrency(totalAmount)}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selected.length === 0 && items.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Selecione ao menos um item para registrar a devolução.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving || selected.length === 0}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {isSaving ? 'Registrando...' : 'Registrar Devolução'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
