import React, { useEffect } from 'react';
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
import { Calculator, Save, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  PurchaseOrderRow,
  purchaseOrderUpdateSchema,
  POUpdateData,
} from '@/services/PurchaseOrderService';

interface PurchaseOrderEditModalProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  order:         PurchaseOrderRow | null;
  onSave:        (id: string, data: POUpdateData) => Promise<boolean>;
}

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

  const subtotal = watch('subtotal') ?? 0;
  const discount = watch('discount') ?? 0;
  const freight  = watch('freight')  ?? 0;
  const taxes    = watch('taxes')    ?? 0;
  const computed = subtotal - discount + freight + taxes;

  useEffect(() => {
    setValue('total_value', Math.max(computed, 0));
  }, [subtotal, discount, freight, taxes, setValue, computed]);

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
    }
  }, [order, open, reset]);

  const onSubmit = async (data: POUpdateData) => {
    if (!order) return;
    const ok = await onSave(order.id, { ...data, total_value: computed });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
            Editar Pedido — {order?.po_number}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

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
                <Label htmlFor="subtotal">Subtotal (R$)</Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('subtotal', { valueAsNumber: true })}
                />
                {errors.subtotal && (
                  <p className="text-xs text-red-500">{errors.subtotal.message}</p>
                )}
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
              rows={3}
              placeholder="Observações internas sobre o pedido..."
              {...register('notes')}
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
