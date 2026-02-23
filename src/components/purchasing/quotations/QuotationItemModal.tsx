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
import { Loader2, Search, X, Link2, FileText, Star, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  QuotationService,
  quotationItemSchema,
  type QuotationItemFormData,
  type QuotationItem,
  type SupplierSuggestion,
} from '@/services/QuotationService';
import type { PartInventory } from '@/hooks/usePartsInventory';

interface QuotationItemModalProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  item?:         QuotationItem;
  onSubmit:      (data: QuotationItemFormData) => Promise<boolean>;
}

export function QuotationItemModal({ open, onOpenChange, item, onSubmit }: QuotationItemModalProps) {
  const isEdit = !!item;
  const { currentOrganization } = useOrganization();

  // ── Part search ───────────────────────────────────────────────────────────
  const [partSearch,   setPartSearch]   = useState('');
  const [partResults,  setPartResults]  = useState<PartInventory[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [linkedPart,   setLinkedPart]   = useState<PartInventory | null>(null);
  const [showResults,  setShowResults]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Supplier suggestions ──────────────────────────────────────────────────
  const [suggestions,       setSuggestions]       = useState<SupplierSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const {
    register, control, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<QuotationItemFormData>({
    resolver: zodResolver(quotationItemSchema),
    defaultValues: item
      ? {
          part_id:               item.part_id,
          part_code:             item.part_code ?? '',
          part_name:             item.part_name,
          quantity:              item.quantity,
          description:           item.description,
          specifications:        item.specifications ?? '',
          selected_supplier_ids: item.selected_supplier_ids ?? [],
        }
      : { quantity: 1, selected_supplier_ids: [] },
  });

  const selectedSupplierIds = watch('selected_supplier_ids') ?? [];
  const watchedPartId       = watch('part_id');
  const watchedPartCode     = watch('part_code');

  // ── Busca de peças ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!partSearch.trim() || partSearch.length < 2) {
      setPartResults([]); setShowResults(false); return;
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
      } finally { setSearchLoading(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [partSearch, currentOrganization?.id]);

  // ── Sugestão de fornecedores quando parte muda ────────────────────────────
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!watchedPartId && !watchedPartCode) { setSuggestions([]); return; }
      setLoadingSuggestions(true);
      try {
        const data = await QuotationService.suggestSuppliersForPart(
          watchedPartId,
          watchedPartCode,
          currentOrganization?.id
        );
        setSuggestions(data);
        // Pré-selecionar os preferenciais (ou todos se < 3)
        if (data.length > 0 && selectedSupplierIds.length === 0) {
          const preferred = data.filter(s => s.is_preferred).map(s => s.supplier_id);
          const toSelect  = preferred.length >= 1 ? preferred : data.map(s => s.supplier_id);
          setValue('selected_supplier_ids', toSelect);
        }
      } finally { setLoadingSuggestions(false); }
    };
    fetchSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedPartId, watchedPartCode, currentOrganization?.id]);

  // ── Carrega peça ao editar ────────────────────────────────────────────────
  useEffect(() => {
    if (open && item?.part_id && currentOrganization?.id) {
      supabase
        .from('parts_inventory')
        .select('id, part_code, part_name, component, status')
        .eq('id', item.part_id)
        .single()
        .then(({ data }) => { if (data) setLinkedPart(data as PartInventory); });
    }
  }, [open, item?.part_id, currentOrganization?.id]);

  const selectPart = (part: PartInventory) => {
    setLinkedPart(part);
    setValue('part_id',    part.id);
    setValue('part_code',  part.part_code ?? '');
    setValue('part_name',  part.part_name);
    setValue('description', part.part_name);
    setPartSearch(''); setShowResults(false);
  };

  const clearLinkedPart = () => {
    setLinkedPart(null);
    setValue('part_id',   undefined);
    setValue('part_code', '');
    setValue('part_name', '');
    setSuggestions([]);
  };

  const toggleSupplier = (supplierId: string) => {
    const current = selectedSupplierIds;
    const next = current.includes(supplierId)
      ? current.filter(id => id !== supplierId)
      : [...current, supplierId];
    setValue('selected_supplier_ids', next, { shouldValidate: true });
  };

  const handleClose = () => {
    reset(); setLinkedPart(null); setPartSearch(''); setPartResults([]); setSuggestions([]);
    onOpenChange(false);
  };

  const handleFormSubmit = async (data: QuotationItemFormData) => {
    const ok = await onSubmit(data);
    if (ok) handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Item' : 'Adicionar Item à Cotação'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados do item.' : 'Selecione a peça, defina quantidade e escolha os fornecedores.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">

          {/* ── Peça ───────────────────────────────────────────────────── */}
          <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Peça (vinculada ao estoque ou manual)</Label>
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
                  {linkedPart.component && <Badge variant="secondary" className="text-xs">{linkedPart.component}</Badge>}
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={clearLinkedPart}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar peça pelo código ou nome..."
                  value={partSearch}
                  onChange={e => setPartSearch(e.target.value)}
                  className="pl-8"
                  autoComplete="off"
                />
                {searchLoading && <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}

                {showResults && partResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
                    {partResults.map(part => (
                      <button key={part.id} type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between gap-2"
                        onClick={() => selectPart(part)}>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{part.part_name}</p>
                          <p className="text-xs text-muted-foreground">{part.part_code ?? '—'}</p>
                        </div>
                        {part.component && <Badge variant="outline" className="text-xs flex-shrink-0">{part.component}</Badge>}
                      </button>
                    ))}
                  </div>
                )}
                {showResults && partResults.length === 0 && !searchLoading && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-md shadow-md px-3 py-2 text-sm text-muted-foreground">
                    Nenhuma peça encontrada — preencha manualmente.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Campos manuais ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="part_code">Código da Peça</Label>
              <Input id="part_code" {...register('part_code')} placeholder="Ex: ROL-6204" className="uppercase" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Controller name="quantity" control={control} render={({ field }) => (
                <Input id="quantity" type="number" min="0.001" step="0.001"
                  value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  className={errors.quantity ? 'border-destructive' : ''} />
              )} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="part_name">Nome / Descrição da Peça *</Label>
            <Input id="part_name" {...register('part_name')} placeholder="Ex: Rolamento Rígido de Esferas 6204"
              className={errors.part_name ? 'border-destructive' : ''} />
            {errors.part_name && <p className="text-xs text-destructive">{errors.part_name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Descrição para Cotação *</Label>
            <Input id="description" {...register('description')} placeholder="Descrição enviada ao fornecedor"
              className={errors.description ? 'border-destructive' : ''} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="specifications">Especificações Técnicas</Label>
            <Textarea id="specifications" {...register('specifications')} rows={2}
              placeholder="Dimensões, norma, material, etc." />
          </div>

          {/* ── Fornecedores ─────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Fornecedores para Cotar
                {loadingSuggestions && <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />}
              </Label>
              <span className="text-xs text-muted-foreground">
                {selectedSupplierIds.length} selecionado(s)
              </span>
            </div>

            {errors.selected_supplier_ids && (
              <p className="text-xs text-destructive">{errors.selected_supplier_ids.message}</p>
            )}

            {suggestions.length > 0 ? (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {suggestions.map(s => {
                  const selected = selectedSupplierIds.includes(s.supplier_id);
                  return (
                    <label key={s.supplier_id}
                      className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors
                        ${selected ? 'bg-primary/5 border-primary/30' : 'hover:bg-accent'}`}>
                      <Checkbox checked={selected} onCheckedChange={() => toggleSupplier(s.supplier_id)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {s.supplier_trade_name || s.supplier_name}
                          </span>
                          {s.is_preferred && (
                            <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Preferencial</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>
                            {s.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          {s.lead_time_days != null && (
                            <span className="flex items-center gap-0.5">
                              <Truck className="w-3 h-3" />{s.lead_time_days}d
                            </span>
                          )}
                          {s.supplier_overall_rating != null && (
                            <span className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {s.supplier_overall_rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-md border border-dashed text-sm text-muted-foreground text-center">
                {loadingSuggestions
                  ? 'Buscando fornecedores...'
                  : watchedPartId || watchedPartCode
                    ? 'Nenhum fornecedor cadastrado para esta peça. Adicione via Fornecedores → Produtos.'
                    : 'Selecione uma peça para ver fornecedores sugeridos.'}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Somente fornecedores com preço cadastrado em "Produtos por Fornecedor" são sugeridos.
              Mínimo recomendado: 3 fornecedores.
            </p>
          </div>

          {/* ── Ações ──────────────────────────────────────────────────── */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Salvar Item' : 'Adicionar Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
