import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useSuppliersList } from '@/hooks/useSuppliers';
import {
  proposalSchema,
  type ProposalFormData,
  type QuotationProposal,
} from '@/services/QuotationService';

interface ProposalModalProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  proposal?:     QuotationProposal;
  /** ID do fornecedor pré-selecionado (quando chamado a partir de lista de fornecedores do item) */
  presetSupplierId?: string;
  /** IDs já respondidos neste item (para bloquear no select) */
  respondedSupplierIds?: string[];
  itemName:      string;
  itemQuantity:  number;
  onSubmit:      (supplierId: string, data: ProposalFormData) => Promise<boolean>;
}

const PAYMENT_TERMS = [
  'À vista',
  '7 dias',
  '14 dias',
  '21 dias',
  '28 dias',
  '30 dias',
  '45 dias',
  '60 dias',
  '90 dias',
  'Boleto 30/60/90',
];

export function ProposalModal({
  open,
  onOpenChange,
  proposal,
  presetSupplierId,
  respondedSupplierIds = [],
  itemName,
  itemQuantity,
  onSubmit,
}: ProposalModalProps) {
  const isEdit = !!proposal;
  const { suppliers } = useSuppliersList();

  const {
    register, control, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<ProposalFormData & { supplier_id: string }>({
    resolver: zodResolver(
      proposalSchema.extend({
        supplier_id: require('zod').string().uuid('Fornecedor obrigatório'),
      })
    ),
    defaultValues: proposal
      ? {
          supplier_id:     proposal.supplier_id,
          unit_price:      proposal.unit_price,
          lead_time_days:  proposal.lead_time_days,
          payment_terms:   proposal.payment_terms ?? '',
          technical_specs: proposal.technical_specs ?? '',
          notes:           proposal.notes ?? '',
          responded_by:    proposal.responded_by ?? '',
        }
      : {
          supplier_id:    presetSupplierId ?? '',
          lead_time_days: 7,
        },
  });

  const unitPrice = watch('unit_price') ?? 0;
  const totalPrice = unitPrice * itemQuantity;

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleClose = () => { reset(); onOpenChange(false); };

  const handleFormSubmit = async (data: ProposalFormData & { supplier_id: string }) => {
    const { supplier_id, ...rest } = data;
    const ok = await onSubmit(supplier_id, rest);
    if (ok) handleClose();
  };

  const availableSuppliers = suppliers.filter(
    s => !respondedSupplierIds.includes(s.id) || s.id === proposal?.supplier_id
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Proposta' : 'Registrar Proposta'}</DialogTitle>
          <DialogDescription>
            {itemName} — Qtd: <strong>{itemQuantity}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

          {/* Fornecedor */}
          <div className="space-y-1">
            <Label htmlFor="supplier_id">Fornecedor *</Label>
            <Controller name="supplier_id" control={control} render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isEdit || !!presetSupplierId}
              >
                <SelectTrigger className={errors.supplier_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione o fornecedor..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSuppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.trade_name || s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {errors.supplier_id && <p className="text-xs text-destructive">{(errors.supplier_id as { message?: string }).message}</p>}
          </div>

          {/* Preço */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="unit_price">Preço Unitário (R$) *</Label>
              <Controller name="unit_price" control={control} render={({ field }) => (
                <Input id="unit_price" type="number" min="0" step="0.01"
                  value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  className={errors.unit_price ? 'border-destructive' : ''} />
              )} />
              {errors.unit_price && <p className="text-xs text-destructive">{errors.unit_price.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Total Calculado</Label>
              <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-semibold">
                {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          {/* Prazo e condições */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="lead_time_days">Prazo de Entrega (dias) *</Label>
              <Controller name="lead_time_days" control={control} render={({ field }) => (
                <Input id="lead_time_days" type="number" min="0"
                  value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
              )} />
            </div>
            <div className="space-y-1">
              <Label>Condições de Pagamento</Label>
              <Controller name="payment_terms" control={control} render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="technical_specs">Especificações Técnicas Oferecidas</Label>
            <Textarea id="technical_specs" {...register('technical_specs')} rows={2}
              placeholder="Marca, modelo, referência, etc." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="responded_by">Contato do Fornecedor</Label>
              <Input id="responded_by" {...register('responded_by')} placeholder="Nome ou email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" {...register('notes')} placeholder="Ex: disponível em 3 dias" />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Salvar' : 'Registrar Proposta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
