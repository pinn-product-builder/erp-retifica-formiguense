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
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { type Quotation, type QuotationItem } from '@/services/QuotationService';

const copySchema = z.object({
  due_date: z
    .string()
    .min(1, 'Prazo obrigatório')
    .refine(v => new Date(v) > new Date(), 'Prazo deve ser uma data futura'),
  title: z.string().optional(),
});

type CopyFormData = z.infer<typeof copySchema>;

interface CopyQuotationDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  quotation:    Quotation;
  items:        QuotationItem[];
  isLoadingItems: boolean;
  onConfirm:    (dueDate: string, title?: string) => Promise<boolean>;
}

export function CopyQuotationDialog({
  open,
  onOpenChange,
  quotation,
  items,
  isLoadingItems,
  onConfirm,
}: CopyQuotationDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showItems, setShowItems] = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CopyFormData>({
    resolver: zodResolver(copySchema),
    defaultValues: { title: '' },
  });

  const handleClose = (v: boolean) => {
    if (!v) {
      reset();
      setShowItems(false);
    }
    onOpenChange(v);
  };

  const onSubmit = async (data: CopyFormData) => {
    setIsSaving(true);
    try {
      const ok = await onConfirm(data.due_date, data.title || undefined);
      if (ok) {
        reset();
        setShowItems(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const totalSuppliers = new Set(
    items.flatMap(i => i.selected_supplier_ids ?? [])
  ).size;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Copiar Cotação
          </DialogTitle>
          <DialogDescription>
            Crie uma nova cotação baseada em{' '}
            <span className="font-medium">{quotation.quotation_number}</span>
            {quotation.title ? ` — ${quotation.title}` : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-1.5 text-sm">
            <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
              O que será copiado
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-xs">
                <Package className="w-3.5 h-3.5 text-primary" />
                {isLoadingItems ? '...' : `${items.length} item(ns)`}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <Package className="w-3.5 h-3.5 text-primary" />
                {totalSuppliers} fornecedor(es) convidado(s)
              </span>
              <Badge variant="secondary" className="text-xs">Status: Rascunho</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Propostas recebidas <span className="font-medium text-destructive">não</span> serão copiadas.
            </p>
          </div>

          {items.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowItems(v => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showItems ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showItems ? 'Ocultar itens' : 'Ver itens que serão copiados'}
              </button>
              {showItems && (
                <div className="mt-2 rounded-md border divide-y text-xs max-h-36 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="px-3 py-1.5 flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{item.part_name}</span>
                      <span className="text-muted-foreground whitespace-nowrap flex-shrink-0">
                        Qtd: {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="copy-title" className="text-sm">
              Título da nova cotação
            </Label>
            <Input
              id="copy-title"
              placeholder={quotation.title ? `Ex: Cópia de ${quotation.title}` : 'Opcional'}
              {...register('title')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="copy-due-date" className="text-sm">
              Prazo de recebimento de propostas <span className="text-destructive">*</span>
            </Label>
            <Input
              id="copy-due-date"
              type="date"
              min={minDateStr}
              {...register('due_date')}
              className={errors.due_date ? 'border-destructive' : ''}
            />
            {errors.due_date && (
              <p className="text-xs text-destructive">{errors.due_date.message}</p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSaving} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || isLoadingItems} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
              Criar Cópia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
