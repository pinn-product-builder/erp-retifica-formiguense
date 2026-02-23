import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import {
  quotationHeaderSchema,
  type QuotationHeaderFormData,
  type Quotation,
} from '@/services/QuotationService';

interface QuotationFormProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  quotation?:    Quotation;
  onSubmit:      (data: QuotationHeaderFormData) => Promise<Quotation | boolean | null>;
}

const todayStr = () => new Date().toISOString().split('T')[0];
const inSevenDays = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

export function QuotationForm({ open, onOpenChange, quotation, onSubmit }: QuotationFormProps) {
  const isEdit = !!quotation;

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<QuotationHeaderFormData>({
    resolver: zodResolver(quotationHeaderSchema),
    defaultValues: quotation
      ? {
          due_date: quotation.due_date,
          notes:    quotation.notes ?? '',
          delivery_address: quotation.delivery_address as QuotationHeaderFormData['delivery_address'],
        }
      : {
          due_date: inSevenDays(),
          notes:    '',
        },
  });

  useEffect(() => {
    if (open && quotation) {
      reset({
        due_date: quotation.due_date,
        notes:    quotation.notes ?? '',
        delivery_address: quotation.delivery_address as QuotationHeaderFormData['delivery_address'],
      });
    } else if (open && !quotation) {
      reset({ due_date: inSevenDays(), notes: '' });
    }
  }, [open, quotation, reset]);

  const handleClose = () => { reset(); onOpenChange(false); };

  const handleFormSubmit = async (data: QuotationHeaderFormData) => {
    const result = await onSubmit(data);
    if (result) handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Editar ${quotation.quotation_number}` : 'Nova Cotação'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize o prazo ou as observações da cotação.'
              : 'Defina o prazo e as observações. Os itens serão adicionados após salvar.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

          <div className="space-y-1">
            <Label htmlFor="due_date">Prazo para Resposta *</Label>
            <Input id="due_date" type="date" min={todayStr()} {...register('due_date')}
              className={errors.due_date ? 'border-destructive' : ''} />
            {errors.due_date && <p className="text-xs text-destructive">{errors.due_date.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...register('notes')} rows={3}
              placeholder="Favor informar prazo de entrega e condições de pagamento. Preferência por lotes completos." />
          </div>

          {/* Endereço de entrega (opcional) */}
          <details className="group">
            <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground select-none">
              Endereço de entrega (opcional)
            </summary>
            <div className="mt-3 space-y-3 pl-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="street">Rua / Logradouro</Label>
                  <Input id="street" {...register('delivery_address.street')} placeholder="Rua das Flores, 123" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" {...register('delivery_address.city')} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" {...register('delivery_address.state')} placeholder="MG" className="uppercase" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="zip">CEP</Label>
                    <Input id="zip" {...register('delivery_address.zip')} placeholder="00000-000" />
                  </div>
                </div>
              </div>
            </div>
          </details>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar Rascunho'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
