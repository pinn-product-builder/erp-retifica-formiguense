import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, Save, X, Plus, Trash2, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  PurchaseOrderRow,
  purchaseOrderUpdateSchema,
  POUpdateData,
  POItemEdit,
  POFullUpdateData,
} from '@/services/PurchaseOrderService';
import { POItemPartSelect } from '@/components/purchasing/POItemPartSelect';

interface PurchaseOrderEditModalProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  order:        PurchaseOrderRow | null;
  onSave:       (id: string, data: POFullUpdateData) => Promise<boolean>;
}

interface ItemRow extends POItemEdit {
  _key:     string;
  part_id?: string;
}

let _keyCounter = 0;
const nextKey = () => `item-${++_keyCounter}`;

export function PurchaseOrderEditModal({
  open,
  onOpenChange,
  order,
  onSave,
}: PurchaseOrderEditModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<POUpdateData>({
    resolver: zodResolver(purchaseOrderUpdateSchema),
    defaultValues: {
      subtotal:          0,
      discount:          0,
      freight:           0,
      taxes:             0,
      total_value:       0,
      expected_delivery: '',
      terms:             '',
      notes:             '',
      delivery_address:  '',
    },
  });

  const [items,  setItems]  = useState<ItemRow[]>([]);
  const [reason, setReason] = useState('');

  const discount = watch('discount') ?? 0;
  const freight  = watch('freight')  ?? 0;
  const taxes    = watch('taxes')    ?? 0;

  const itemsSubtotal = items.reduce((sum, i) => sum + i.total_price, 0);
  const computed      = Math.max(itemsSubtotal - discount + freight + taxes, 0);

  useEffect(() => {
    setValue('subtotal',    itemsSubtotal);
    setValue('total_value', computed);
  }, [itemsSubtotal, discount, freight, taxes, setValue, computed]);

  useEffect(() => {
    if (order && open) {
      reset({
        subtotal:          order.subtotal ?? 0,
        discount:          order.discount ?? 0,
        freight:           order.freight  ?? 0,
        taxes:             order.taxes    ?? 0,
        total_value:       order.total_value ?? 0,
        expected_delivery: order.expected_delivery ?? '',
        terms:             order.terms ?? '',
        notes:             order.notes ?? '',
        delivery_address:  order.delivery_address ?? '',
      });
      setItems(
        (order.items ?? []).map(i => ({
          _key:              nextKey(),
          id:                i.id,
          item_name:         i.item_name,
          description:       i.description ?? '',
          quantity:          i.quantity,
          unit_price:        i.unit_price,
          total_price:       i.total_price,
          received_quantity: i.received_quantity ?? 0,
        })),
      );
      setReason('');
    }
  }, [order, open, reset]);

  const updateItem = useCallback(
    (key: string, field: keyof ItemRow, value: string | number) => {
      setItems(prev =>
        prev.map(item => {
          if (item._key !== key) return item;
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            updated.total_price = +(updated.quantity * updated.unit_price).toFixed(2);
          }
          return updated;
        }),
      );
    },
    [],
  );

  const selectPartForItem = useCallback(
    (key: string, part: { part_id: string; item_name: string; unit_price: number }) => {
      setItems(prev =>
        prev.map(item => {
          if (item._key !== key) return item;
          const qty = item.quantity || 1;
          return {
            ...item,
            part_id:     part.part_id,
            item_name:   part.item_name,
            unit_price:  part.unit_price,
            total_price: +(qty * part.unit_price).toFixed(2),
          };
        }),
      );
    },
    [],
  );

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        _key:              nextKey(),
        item_name:         '',
        description:       '',
        quantity:          1,
        unit_price:        0,
        total_price:       0,
        received_quantity: 0,
      },
    ]);
  };

  const removeItem = (key: string) => {
    setItems(prev => prev.filter(i => i._key !== key));
  };

  const onSubmit = async (data: POUpdateData) => {
    if (!order) return;
    const payload: POFullUpdateData = {
      ...data,
      subtotal:    itemsSubtotal,
      total_value: computed,
      items:       items.map(({ _key: _k, ...rest }) => rest),
      reason:      reason || undefined,
    };
    const ok = await onSave(order.id, payload);
    if (ok) onOpenChange(false);
  };

  const canDelete = (item: ItemRow) => (item.received_quantity ?? 0) === 0;
  const isEditable = order?.status === 'draft' || order?.status === 'pending' || order?.status === 'pending_approval';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
            Editar Pedido — {order?.po_number}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                Itens do Pedido
              </p>
              {isEditable && (
                <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar item
                </Button>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum item. Clique em "Adicionar item" para incluir.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left font-medium p-2 min-w-[180px]">Peça / Item</th>
                        <th className="text-center font-medium p-2 w-20">Qtd</th>
                        <th className="text-right font-medium p-2 w-24">Preço Unit.</th>
                        <th className="text-right font-medium p-2 w-24">Total</th>
                        <th className="text-center font-medium p-2 w-20">Recebido</th>
                        <th className="p-2 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item._key} className="border-b last:border-0">
                          <td className="p-2 min-w-[180px]">
                            {isEditable ? (
                              <POItemPartSelect
                                value={item.item_name || undefined}
                                onSelect={part => selectPartForItem(item._key, part)}
                                onClear={() => updateItem(item._key, 'item_name', '')}
                                disabled={!isEditable}
                              />
                            ) : (
                              <span className="text-xs">{item.item_name}</span>
                            )}
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min={item.received_quantity ?? 1}
                              step="1"
                              value={item.quantity}
                              onChange={e => updateItem(item._key, 'quantity', Math.max(+(e.target.value), item.received_quantity ?? 0))}
                              disabled={!isEditable}
                              className="h-7 text-xs text-center w-16"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.unit_price}
                              onChange={e => updateItem(item._key, 'unit_price', +e.target.value)}
                              disabled={!isEditable}
                              className="h-7 text-xs text-right w-20"
                            />
                          </td>
                          <td className="p-2 text-right whitespace-nowrap font-medium">
                            {formatCurrency(item.total_price)}
                          </td>
                          <td className="p-2 text-center">
                            {(item.received_quantity ?? 0) > 0 ? (
                              <Badge variant="outline" className="text-xs">
                                {item.received_quantity}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-2">
                            {isEditable && canDelete(item) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 hover:text-red-700"
                                onClick={() => removeItem(item._key)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t">
                      <tr>
                        <td colSpan={4} className="p-2 text-right text-xs font-medium">Subtotal dos itens:</td>
                        <td className="p-2 text-right text-xs font-bold whitespace-nowrap">
                          {formatCurrency(itemsSubtotal)}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Datas e condições */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="expected_delivery">Data de Entrega Prevista</Label>
              <Input
                id="expected_delivery"
                type="date"
                {...register('expected_delivery')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="terms">Condições de Pagamento</Label>
              <Input
                id="terms"
                placeholder="Ex: 30/60/90 DDL"
                {...register('terms')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delivery_address">Endereço de Entrega</Label>
            <Input
              id="delivery_address"
              placeholder="Endereço de entrega"
              {...register('delivery_address')}
            />
          </div>

          <Separator />

          {/* Financeiro */}
          <div>
            <p className="text-sm font-medium mb-3">Composição Financeira</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subtotal (R$)</Label>
                <Input
                  value={itemsSubtotal.toFixed(2)}
                  readOnly
                  className="bg-muted/50 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discount">Desconto (R$)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('discount', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="freight">Frete (R$)</Label>
                <Input
                  id="freight"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('freight', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxes">Impostos (R$)</Label>
                <Input
                  id="taxes"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('taxes', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="mt-3 p-3 bg-muted rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium">Total Calculado</span>
              <span className="text-lg font-bold text-green-700">
                {formatCurrency(computed)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Observações internas sobre o pedido..."
              {...register('notes')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Motivo da Alteração</Label>
            <Input
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Descreva o motivo da alteração (opcional)"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
