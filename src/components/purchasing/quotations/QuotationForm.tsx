import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge }    from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronRight, ChevronLeft, Plus, Trash2, Send,
  FileText, Package, Building2, CheckCircle, Star, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import {
  quotationHeaderSchema,
  type QuotationHeaderFormData,
  type Quotation,
  QuotationService,
} from '@/services/QuotationService';

// ── Types ──────────────────────────────────────────────────────────────────────
interface WizardItem {
  id:             string;
  part_code:      string;
  part_name:      string;
  quantity:       number;
  unit:           string;
  description:    string;
  specifications: string;
}

interface SimpleSupplier {
  id:         string;
  name:       string;
  trade_name: string | null;
  rating:     number | null;
  overall_rating: number | null;
  delivery_days:  number | null;
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface QuotationFormProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  quotation?:   Quotation;
  onSubmit:     (data: QuotationHeaderFormData) => Promise<Quotation | boolean | null>;
}

const inSevenDays = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};
const todayStr = () => new Date().toISOString().split('T')[0];

const emptyItem = (): WizardItem => ({
  id:             crypto.randomUUID(),
  part_code:      '',
  part_name:      '',
  quantity:       1,
  unit:           'un',
  description:    '',
  specifications: '',
});

// ── Component ─────────────────────────────────────────────────────────────────
export function QuotationForm({ open, onOpenChange, quotation, onSubmit }: QuotationFormProps) {
  const isEdit = !!quotation;
  const { currentOrganization } = useOrganization();

  // ── Edit mode form ──
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<QuotationHeaderFormData>({
    resolver: zodResolver(quotationHeaderSchema),
    defaultValues: quotation
      ? { due_date: quotation.due_date, notes: quotation.notes ?? '', delivery_address: quotation.delivery_address as QuotationHeaderFormData['delivery_address'] }
      : { due_date: inSevenDays(), notes: '' },
  });

  useEffect(() => {
    if (!open) return;
    if (quotation) {
      reset({ due_date: quotation.due_date, notes: quotation.notes ?? '', delivery_address: quotation.delivery_address as QuotationHeaderFormData['delivery_address'] });
    } else {
      reset({ due_date: inSevenDays(), notes: '' });
    }
  }, [open, quotation, reset]);

  // ── Wizard state ──
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ due_date: inSevenDays(), notes: '' });
  const [items, setItems] = useState<WizardItem[]>([emptyItem()]);
  const [suppliers, setSuppliers] = useState<SimpleSupplier[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch suppliers when reaching step 3
  useEffect(() => {
    if (!open || isEdit || step !== 3 || !currentOrganization?.id) return;
    setLoadingSuppliers(true);
    supabase
      .from('suppliers')
      .select('id, name, trade_name, rating, overall_rating, delivery_days')
      .eq('org_id', currentOrganization.id)
      .eq('is_active', true)
      .order('trade_name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setSuppliers(data as unknown as SimpleSupplier[]);
        setLoadingSuppliers(false);
      });
  }, [open, isEdit, step, currentOrganization?.id]);

  const resetWizard = () => {
    setStep(1);
    setFormData({ due_date: inSevenDays(), notes: '' });
    setItems([emptyItem()]);
    setSelectedSuppliers([]);
  };

  const handleClose = () => {
    reset();
    resetWizard();
    onOpenChange(false);
  };

  // ── Item helpers ──
  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: string) => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  const updateItem = (id: string, field: keyof WizardItem, value: string | number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const toggleSupplier = (id: string) =>
    setSelectedSuppliers(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );

  // ── Wizard validation ──
  const canProceed = () => {
    switch (step) {
      case 1: return !!formData.due_date;
      case 2: return items.some(i => i.part_name.trim().length >= 2);
      case 3: return selectedSuppliers.length > 0;
      default: return true;
    }
  };

  // ── Edit form submit ──
  const handleEditSubmit = async (data: QuotationHeaderFormData) => {
    const result = await onSubmit(data);
    if (result) handleClose();
  };

  // ── Wizard final submit ──
  const handleWizardSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await onSubmit({ due_date: formData.due_date, notes: formData.notes || undefined });
      if (!result || typeof result === 'boolean') return;

      const quotationId = (result as Quotation).id;
      const validItems  = items.filter(i => i.part_name.trim().length >= 2);

      for (let idx = 0; idx < validItems.length; idx++) {
        const item = validItems[idx];
        await QuotationService.addItem(
          quotationId,
          {
            part_code:             item.part_code || undefined,
            part_name:             item.part_name,
            quantity:              item.quantity,
            description:           item.description || item.part_name,
            specifications:        item.specifications || undefined,
            selected_supplier_ids: selectedSuppliers,
          },
          idx,
        );
      }

      toast.success('Cotação criada com sucesso!');
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar cotação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step indicator ──
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            step === s
              ? 'bg-primary text-primary-foreground'
              : step > s
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
          }`}>
            {step > s ? <CheckCircle className="h-4 w-4" /> : s}
          </div>
          {s < 4 && (
            <div className={`w-10 h-1 mx-1 rounded transition-colors ${step > s ? 'bg-primary/30' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );

  // ── Step 1 — Informações ──
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm sm:text-base">Informações Gerais</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wiz_due_date">Prazo para Resposta *</Label>
          <Input
            id="wiz_due_date"
            type="date"
            min={todayStr()}
            value={formData.due_date}
            onChange={(e) => setFormData(p => ({ ...p, due_date: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wiz_notes">Observações</Label>
        <Textarea
          id="wiz_notes"
          value={formData.notes}
          onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
          placeholder="Favor informar prazo de entrega e condições de pagamento..."
          rows={3}
        />
      </div>
    </div>
  );

  // ── Step 2 — Itens ──
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm sm:text-base">Itens da Cotação</h3>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Adicionar</span> Item
        </Button>
      </div>

      <div className="overflow-x-auto max-h-[350px] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[90px]">Código</TableHead>
              <TableHead className="min-w-[140px]">Nome *</TableHead>
              <TableHead className="w-[80px]">Qtd</TableHead>
              <TableHead className="w-[70px]">Un</TableHead>
              <TableHead className="min-w-[140px] hidden sm:table-cell">Descrição</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Input
                    value={item.part_code}
                    onChange={(e) => updateItem(item.id, 'part_code', e.target.value)}
                    placeholder="Código"
                    className="h-8 min-w-[80px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.part_name}
                    onChange={(e) => updateItem(item.id, 'part_name', e.target.value)}
                    placeholder="Nome da peça"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    className="h-8 w-[65px]"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={item.unit}
                    onValueChange={(v) => updateItem(item.id, 'unit', v)}
                  >
                    <SelectTrigger className="h-8 w-[60px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">un</SelectItem>
                      <SelectItem value="pc">pc</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="lt">lt</SelectItem>
                      <SelectItem value="cx">cx</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Descrição"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {items.filter(i => i.part_name.trim().length >= 2).length} item(ns) válido(s)
      </p>
    </div>
  );

  // ── Step 3 — Fornecedores ──
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm sm:text-base">Selecione os Fornecedores</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Selecione os fornecedores que receberão esta cotação.
      </p>

      {loadingSuppliers ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum fornecedor ativo cadastrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
          {suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className={`cursor-pointer transition-all ${
                selectedSuppliers.includes(supplier.id)
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'hover:border-muted-foreground/50'
              }`}
              onClick={() => toggleSupplier(supplier.id)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedSuppliers.includes(supplier.id)}
                    onCheckedChange={() => toggleSupplier(supplier.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {supplier.trade_name || supplier.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(supplier.overall_rating || supplier.rating) && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs">
                            {(supplier.overall_rating ?? supplier.rating)?.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {supplier.delivery_days && (
                        <span className="text-xs text-muted-foreground">
                          {supplier.delivery_days}d entrega
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {selectedSuppliers.length} fornecedor(es) selecionado(s)
      </p>
    </div>
  );

  // ── Step 4 — Revisão ──
  const renderStep4 = () => {
    const validItems = items.filter(i => i.part_name.trim().length >= 2);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm sm:text-base">Revisão e Confirmação</h3>
        </div>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-sm">Informações Gerais</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Prazo:</span>
                <p className="font-medium">{formData.due_date}</p>
              </div>
              {formData.notes && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Observações:</span>
                  <p className="text-sm">{formData.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-sm">Itens ({validItems.length})</h4>
            <div className="space-y-1.5">
              {validItems.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                  <span className="min-w-0 truncate">
                    {idx + 1}. {item.part_code ? `[${item.part_code}] ` : ''}{item.part_name}
                  </span>
                  <span className="text-muted-foreground ml-2 whitespace-nowrap">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-sm">Fornecedores ({selectedSuppliers.length})</h4>
            <div className="flex flex-wrap gap-2">
              {suppliers
                .filter(s => selectedSuppliers.includes(s.id))
                .map(s => (
                  <Badge key={s.id} variant="secondary" className="text-xs">
                    {s.trade_name || s.name}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── Edit mode render ──────────────────────────────────────────────────────────
  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {quotation.quotation_number}</DialogTitle>
            <DialogDescription>Atualize o prazo ou as observações da cotação.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="due_date">Prazo para Resposta *</Label>
              <Input id="due_date" type="date" min={todayStr()} {...register('due_date')}
                className={errors.due_date ? 'border-destructive' : ''} />
              {errors.due_date && <p className="text-xs text-destructive">{errors.due_date.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" {...register('notes')} rows={3}
                placeholder="Favor informar prazo de entrega e condições de pagamento." />
            </div>

            <details className="group">
              <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground select-none">
                Endereço de entrega (opcional)
              </summary>
              <div className="mt-3 space-y-3 pl-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Rua / Logradouro</Label>
                    <Input {...register('delivery_address.street')} placeholder="Rua das Flores, 123" />
                  </div>
                  <div className="space-y-1">
                    <Label>Cidade</Label>
                    <Input {...register('delivery_address.city')} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Estado</Label>
                      <Input {...register('delivery_address.state')} placeholder="MG" className="uppercase" />
                    </div>
                    <div className="space-y-1">
                      <Label>CEP</Label>
                      <Input {...register('delivery_address.zip')} placeholder="00000-000" />
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
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Create wizard render ───────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nova Cotação</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Passo 1 de 4 — Informações Gerais'}
            {step === 2 && 'Passo 2 de 4 — Itens da Cotação'}
            {step === 3 && 'Passo 3 de 4 — Seleção de Fornecedores'}
            {step === 4 && 'Passo 4 de 4 — Revisão e Confirmação'}
          </DialogDescription>
        </DialogHeader>

        <StepIndicator />

        <div className="flex-1 min-h-0 overflow-y-auto py-2 pr-1">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="flex items-center justify-between pt-4 border-t mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
            disabled={submitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step > 1 ? 'Voltar' : 'Cancelar'}
          </Button>

          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="button" onClick={handleWizardSubmit} disabled={submitting}>
              {submitting
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Send className="h-4 w-4 mr-2" />
              }
              Criar Cotação
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
