import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, RotateCcw } from 'lucide-react';
import { QuotationService, type Quotation } from '@/services/QuotationService';

const reopenSchema = z.object({
  due_date: z
    .string()
    .min(1, 'Novo prazo obrigatório')
    .refine(v => new Date(v) > new Date(), 'Prazo deve ser uma data futura'),
  reason: z.enum([
    'insufficient_proposals',
    'prices_too_high',
    'specification_change',
    'deadline_extension',
    'other',
  ] as const, { errorMap: () => ({ message: 'Motivo obrigatório' }) }),
  notes: z.string().optional(),
});

type ReopenFormData = z.infer<typeof reopenSchema>;

interface ReopenQuotationDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  quotation:    Quotation;
  onSuccess:    (updated: Quotation) => void;
}

const REASON_OPTIONS = Object.entries(QuotationService.REOPEN_REASONS).map(
  ([value, label]) => ({ value, label }),
);

export function ReopenQuotationDialog({
  open,
  onOpenChange,
  quotation,
  onSuccess,
}: ReopenQuotationDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReopenFormData>({
    resolver: zodResolver(reopenSchema),
    defaultValues: { notes: '' },
  });

  const reason = watch('reason');

  const handleClose = (v: boolean) => {
    if (!v) {
      reset();
    }
    onOpenChange(v);
  };

  const onSubmit = async (data: ReopenFormData) => {
    setIsSaving(true);
    try {
      const updated = await QuotationService.reopenQuotation(
        quotation.id,
        data.due_date,
        data.reason,
        data.notes,
      );
      reset();
      onSuccess(updated);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reabrir Cotação
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{quotation.quotation_number}</span>
            {quotation.title ? ` — ${quotation.title}` : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="reopen-due-date" className="text-sm">
              Novo prazo de recebimento <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reopen-due-date"
              type="date"
              min={minDateStr}
              {...register('due_date')}
              className={errors.due_date ? 'border-destructive' : ''}
            />
            {errors.due_date && (
              <p className="text-xs text-destructive">{errors.due_date.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">
              Motivo da reabertura <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={v => setValue('reason', v as ReopenFormData['reason'], { shouldValidate: true })}>
              <SelectTrigger className={errors.reason ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-xs text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reopen-notes" className="text-sm">
              Observações adicionais
            </Label>
            <Textarea
              id="reopen-notes"
              placeholder="Detalhes sobre a reabertura..."
              rows={3}
              {...register('notes')}
              className="resize-none"
            />
          </div>

          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400">
            As propostas já recebidas serão mantidas. Novos fornecedores poderão enviar propostas até o novo prazo.
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSaving} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Reabrir Cotação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
