import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, X, Link2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  supplierProductSchema,
  type SupplierProductFormData,
  type SupplierProduct,
} from '@/services/SupplierProductService';
import type { PartInventory } from '@/hooks/usePartsInventory';

interface AddSupplierProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: SupplierProduct;
  onSubmit: (data: SupplierProductFormData) => Promise<SupplierProduct | null>;
}

export function AddSupplierProductModal({
  open,
  onOpenChange,
  product,
  onSubmit,
}: AddSupplierProductModalProps) {
  const isEdit = !!product;
  const { currentOrganization } = useOrganization();

  // ── Estado da busca de peças ─────────────────────────────────────────────
  const [partSearch, setPartSearch] = useState('');
  const [partResults, setPartResults] = useState<PartInventory[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [linkedPart, setLinkedPart] = useState<PartInventory | null>(null);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SupplierProductFormData>({
    resolver: zodResolver(supplierProductSchema),
    defaultValues: product
      ? {
          part_id:          product.part_id,
          part_code:        product.part_code,
          part_name:        product.part_name,
          supplier_code:    product.supplier_code,
          description:      product.description ?? '',
          unit_price:       product.unit_price,
          minimum_quantity: product.minimum_quantity,
          lead_time_days:   product.lead_time_days,
          is_preferred:     product.is_preferred,
          valid_from:       product.valid_from ?? '',
          valid_until:      product.valid_until ?? '',
          is_active:        product.is_active,
          notes:            product.notes ?? '',
        }
      : { is_preferred: false, is_active: true },
  });

  // ── Busca debounced de peças ─────────────────────────────────────────────
  useEffect(() => {
    if (!partSearch.trim() || partSearch.length < 2) {
      setPartResults([]);
      setShowResults(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!currentOrganization?.id) return;
      setSearchLoading(true);
      try {
        const { data } = await supabase
          .from('parts_inventory')
          .select('id, part_code, part_name, component, status')
          .eq('org_id', currentOrganization.id)
          .or(`part_name.ilike.%${partSearch}%,part_code.ilike.%${partSearch}%`)
          .order('part_name')
          .limit(8);
        setPartResults((data ?? []) as PartInventory[]);
        setShowResults(true);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [partSearch, currentOrganization?.id]);

  // ── Carrega peça vinculada ao editar ────────────────────────────────────
  useEffect(() => {
    if (open && product?.part_id && currentOrganization?.id) {
      supabase
        .from('parts_inventory')
        .select('id, part_code, part_name, component, status')
        .eq('id', product.part_id)
        .single()
        .then(({ data }) => {
          if (data) setLinkedPart(data as PartInventory);
        });
    }
  }, [open, product?.part_id, currentOrganization?.id]);

  const selectPart = (part: PartInventory) => {
    setLinkedPart(part);
    setValue('part_id', part.id);
    setValue('part_code', part.part_code ?? '');
    setValue('part_name', part.part_name);
    setPartSearch('');
    setShowResults(false);
  };

  const clearLinkedPart = () => {
    setLinkedPart(null);
    setValue('part_id', undefined);
    setValue('part_code', '');
    setValue('part_name', '');
  };

  const handleClose = () => {
    reset();
    setLinkedPart(null);
    setPartSearch('');
    setPartResults([]);
    onOpenChange(false);
  };

  const handleFormSubmit = async (data: SupplierProductFormData) => {
    const result = await onSubmit(data);
    if (result) handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize as informações do produto para este fornecedor.'
              : 'Vincule uma peça ao estoque ou cadastre uma nova com preço e condições.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

          {/* ── Busca / Vínculo com peça do estoque ──────────────────────── */}
          <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Vincular ao Estoque (opcional)</Label>
            </div>

            {linkedPart ? (
              <div className="flex items-center justify-between gap-2 p-2 bg-background rounded-md border">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{linkedPart.part_name}</p>
                    <p className="text-xs text-muted-foreground">{linkedPart.part_code ?? 'Sem código'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {linkedPart.component && (
                    <Badge variant="secondary" className="text-xs">{linkedPart.component}</Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={clearLinkedPart}
                    title="Remover vínculo"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar peça pelo código ou nome..."
                    value={partSearch}
                    onChange={e => setPartSearch(e.target.value)}
                    className="pl-8"
                    autoComplete="off"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {showResults && partResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
                    {partResults.map(part => (
                      <button
                        key={part.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between gap-2"
                        onClick={() => selectPart(part)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{part.part_name}</p>
                          <p className="text-xs text-muted-foreground">{part.part_code ?? '—'}</p>
                        </div>
                        {part.component && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">{part.component}</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showResults && partResults.length === 0 && !searchLoading && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-md shadow-md px-3 py-2 text-sm text-muted-foreground">
                    Nenhuma peça encontrada — preencha os campos manualmente abaixo.
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Ao vincular, o código e nome serão preenchidos automaticamente. Se não encontrar a peça, preencha manualmente.
            </p>
          </div>

          {/* ── Identificação da peça ──────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="part_code">Código da Peça *</Label>
              <Input
                id="part_code"
                {...register('part_code')}
                placeholder="Ex: ROL-6204"
                className={`uppercase ${errors.part_code ? 'border-destructive' : ''}`}
              />
              {errors.part_code && (
                <p className="text-xs text-destructive">{errors.part_code.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplier_code">Código no Fornecedor *</Label>
              <Input
                id="supplier_code"
                {...register('supplier_code')}
                placeholder="Código interno do fornecedor"
                className={errors.supplier_code ? 'border-destructive' : ''}
              />
              {errors.supplier_code && (
                <p className="text-xs text-destructive">{errors.supplier_code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="part_name">Nome da Peça *</Label>
            <Input
              id="part_name"
              {...register('part_name')}
              placeholder="Ex: Rolamento Rígido de Esferas 6204"
              className={errors.part_name ? 'border-destructive' : ''}
            />
            {errors.part_name && (
              <p className="text-xs text-destructive">{errors.part_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Descrição / Especificações</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Especificações técnicas adicionais..."
              rows={2}
            />
          </div>

          {/* ── Preço e condições ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="unit_price">Preço Unitário (R$) *</Label>
              <Controller
                name="unit_price"
                control={control}
                render={({ field }) => (
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={field.value ?? ''}
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    className={errors.unit_price ? 'border-destructive' : ''}
                  />
                )}
              />
              {errors.unit_price && (
                <p className="text-xs text-destructive">{errors.unit_price.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="minimum_quantity">Qtd. Mínima</Label>
              <Controller
                name="minimum_quantity"
                control={control}
                render={({ field }) => (
                  <Input
                    id="minimum_quantity"
                    type="number"
                    min="0"
                    step="0.001"
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="1"
                  />
                )}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lead_time_days">Prazo Entrega (dias)</Label>
              <Controller
                name="lead_time_days"
                control={control}
                render={({ field }) => (
                  <Input
                    id="lead_time_days"
                    type="number"
                    min="0"
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="0"
                  />
                )}
              />
            </div>
          </div>

          {/* ── Vigência ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="valid_from">Vigência — Início</Label>
              <Input id="valid_from" type="date" {...register('valid_from')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="valid_until">Vigência — Fim</Label>
              <Input id="valid_until" type="date" {...register('valid_until')} />
            </div>
          </div>

          {/* ── Flags ─────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md border hover:bg-accent flex-1">
              <Controller
                name="is_preferred"
                control={control}
                render={({ field }) => (
                  <Checkbox id="is_preferred" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <div>
                <p className="text-sm font-medium">Fornecedor Preferencial</p>
                <p className="text-xs text-muted-foreground">Priorizar em cotações</p>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md border hover:bg-accent flex-1">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Checkbox id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <div>
                <p className="text-sm font-medium">Preço Ativo</p>
                <p className="text-xs text-muted-foreground">Usar em cotações</p>
              </div>
            </label>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Observações</Label>
            <Input id="notes" {...register('notes')} placeholder="Ex: disponível só por pedido" />
          </div>

          {/* ── Ações ─────────────────────────────────────────────────── */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Salvar' : 'Adicionar Produto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
