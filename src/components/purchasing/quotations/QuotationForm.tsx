import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge }    from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Send,
  FileText,
  Package,
  Building2,
  CheckCircle,
  Star,
  Loader2,
  Warehouse,
  Receipt,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import {
  quotationHeaderSchema,
  type QuotationHeaderFormData,
  type Quotation,
  type QuotationPurpose,
  type QuotationUrgency,
  URGENCY_LABELS,
  URGENCY_COLORS,
  QuotationService,
} from '@/services/QuotationService';

interface WizardItem {
  id:             string;
  part_id?:       string;
  part_code:      string;
  part_name:      string;
  quantity:       number;
  unit:           string;
  description:    string;
  specifications: string;
}

interface SimpleSupplier {
  id:             string;
  name:           string;
  trade_name:     string | null;
  rating:         number | null;
  overall_rating: number | null;
  delivery_days:  number | null;
}

interface SimpleOrder {
  id:           string;
  order_number: string;
}

interface SimpleBudget {
  id:            string;
  budget_number: string;
  order_number?: string | null;
}

interface SimplePart {
  id:        string;
  part_code: string | null;
  part_name: string;
  quantity:  number;
  unit_cost: number | null;
}

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

export function QuotationForm({ open, onOpenChange, quotation, onSubmit }: QuotationFormProps) {
  const isEdit = !!quotation;
  const { currentOrganization } = useOrganization();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuotationHeaderFormData>({
    resolver: zodResolver(quotationHeaderSchema),
    defaultValues: quotation
      ? {
          title:            quotation.title ?? '',
          due_date:         quotation.due_date,
          urgency:          quotation.urgency ?? 'normal',
          purpose:          quotation.purpose ?? 'stock',
          order_reference:  quotation.order_reference ?? '',
          budget_reference: quotation.budget_reference ?? '',
          notes:            quotation.notes ?? '',
          delivery_address: quotation.delivery_address as QuotationHeaderFormData['delivery_address'],
        }
      : { title: '', due_date: inSevenDays(), urgency: 'normal', purpose: 'stock', notes: '' },
  });

  useEffect(() => {
    if (!open) return;
    if (quotation) {
      reset({
        title:            quotation.title ?? '',
        due_date:         quotation.due_date,
        urgency:          quotation.urgency ?? 'normal',
        purpose:          quotation.purpose ?? 'stock',
        order_reference:  quotation.order_reference ?? '',
        budget_reference: quotation.budget_reference ?? '',
        notes:            quotation.notes ?? '',
        delivery_address: quotation.delivery_address as QuotationHeaderFormData['delivery_address'],
      });
    } else {
      reset({ title: '', due_date: inSevenDays(), urgency: 'normal', purpose: 'stock', notes: '' });
    }
  }, [open, quotation, reset]);

  const [step,     setStep]     = useState(1);
  const [wizData,  setWizData]  = useState<{
    title: string; due_date: string; urgency: QuotationUrgency;
    purpose: QuotationPurpose; order_reference: string; budget_reference: string; notes: string;
  }>({ title: '', due_date: inSevenDays(), urgency: 'normal', purpose: 'stock', order_reference: '', budget_reference: '', notes: '' });

  const [items,             setItems]             = useState<WizardItem[]>([emptyItem()]);
  const [suppliers,         setSuppliers]         = useState<SimpleSupplier[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [loadingSuppliers,  setLoadingSuppliers]  = useState(false);
  const [submitting,        setSubmitting]        = useState(false);

  // Ordens de serviço
  const [orders,        setOrders]        = useState<SimpleOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Orçamentos aprovados
  const [budgets,        setBudgets]        = useState<SimpleBudget[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  // Peças do estoque para busca no passo 2
  const [parts,        setParts]        = useState<SimplePart[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [partSearch,   setPartSearch]   = useState<Record<string, string>>({});
  const [showPartDrop, setShowPartDrop] = useState<Record<string, boolean>>({});

  // Carregar ordens quando o modal abre (passo 1)
  useEffect(() => {
    if (!open || isEdit || !currentOrganization?.id) return;
    setLoadingOrders(true);
    supabase
      .from('orders')
      .select('id, order_number')
      .eq('org_id', currentOrganization.id)
      .order('order_number', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!error && data) setOrders(data as SimpleOrder[]);
        setLoadingOrders(false);
      });
  }, [open, isEdit, currentOrganization?.id]);

  // Carregar orçamentos aprovados quando o modal abre
  useEffect(() => {
    if (!open || isEdit || !currentOrganization?.id) return;
    setLoadingBudgets(true);
    type BudgetRow = { id: string; budget_number: string; orders: { order_number: string } | null };
    const db = supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            eq: (col: string, val: string) => {
              order: (col: string, opts: object) => {
                limit: (n: number) => Promise<{ data: BudgetRow[] | null; error: unknown }>;
              };
            };
          };
        };
      };
    };
    db.from('detailed_budgets')
      .select('id, budget_number, orders(order_number)')
      .eq('org_id', currentOrganization.id)
      .eq('status', 'approved')
      .order('budget_number', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!error && data) {
          setBudgets(data.map(b => ({
            id:            b.id,
            budget_number: b.budget_number,
            order_number:  b.orders?.order_number ?? null,
          })));
        }
        setLoadingBudgets(false);
      });
  }, [open, isEdit, currentOrganization?.id]);

  // Carregar peças quando chegar no passo 2
  useEffect(() => {
    if (!open || isEdit || step !== 2 || !currentOrganization?.id) return;
    if (parts.length > 0) return;
    setLoadingParts(true);
    supabase
      .from('parts_inventory')
      .select('id, part_code, part_name, quantity, unit_cost')
      .eq('org_id', currentOrganization.id)
      .order('part_name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setParts(data as SimplePart[]);
        setLoadingParts(false);
      });
  }, [open, isEdit, step, currentOrganization?.id, parts.length]);

  // Carregar fornecedores no passo 3
  useEffect(() => {
    if (!open || isEdit || step !== 3 || !currentOrganization?.id) return;
    setLoadingSuppliers(true);
    supabase
      .from('suppliers')
      .select('id, name, trade_name, rating, overall_rating, delivery_days')
      .eq('org_id', currentOrganization.id)
      .eq('is_active', true)
      .order('overall_rating', { ascending: false, nullsFirst: false })
      .then(({ data, error }) => {
        if (!error && data) setSuppliers(data as unknown as SimpleSupplier[]);
        setLoadingSuppliers(false);
      });
  }, [open, isEdit, step, currentOrganization?.id]);

  const resetWizard = () => {
    setStep(1);
    setWizData({ title: '', due_date: inSevenDays(), urgency: 'normal', purpose: 'stock', order_reference: '', budget_reference: '', notes: '' });
    setItems([emptyItem()]);
    setSelectedSuppliers([]);
    setPartSearch({});
    setShowPartDrop({});
    setBudgets([]);
    setLoadingBudgets(false);
  };

  useEffect(() => {
    if (!open) {
      reset();
      resetWizard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  // helpers de itens
  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: string) => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  const updateItem = (id: string, field: keyof WizardItem, value: string | number | undefined) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const selectPart = (itemId: string, part: SimplePart) => {
    setItems(prev => prev.map(i => i.id === itemId ? {
      ...i,
      part_id:   part.id,
      part_code: part.part_code ?? '',
      part_name: part.part_name,
    } : i));
    setPartSearch(prev => ({ ...prev, [itemId]: '' }));
    setShowPartDrop(prev => ({ ...prev, [itemId]: false }));
  };

  const clearPartSelection = (itemId: string) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, part_id: undefined, part_code: '', part_name: '' } : i));
    setPartSearch(prev => ({ ...prev, [itemId]: '' }));
  };

  const filteredParts = useCallback((search: string) => {
    const s = search.toLowerCase();
    return parts.filter(p =>
      p.part_name.toLowerCase().includes(s) ||
      (p.part_code ?? '').toLowerCase().includes(s)
    ).slice(0, 8);
  }, [parts]);

  const toggleSupplier = (id: string) =>
    setSelectedSuppliers(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const canProceed = () => {
    switch (step) {
      case 1: return wizData.title.trim().length >= 2 && !!wizData.due_date;
      case 2: return items.some(i => i.part_name.trim().length >= 2);
      case 3: return selectedSuppliers.length > 0;
      default: return true;
    }
  };

  const handleEditSubmit = async (data: QuotationHeaderFormData) => {
    const result = await onSubmit(data);
    if (result) handleClose();
  };

  const handleWizardSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: QuotationHeaderFormData = {
        title:            wizData.title,
        due_date:         wizData.due_date,
        urgency:          wizData.urgency,
        purpose:          wizData.purpose,
        order_reference:  wizData.order_reference || undefined,
        budget_reference: wizData.budget_reference || undefined,
        notes:            wizData.notes || undefined,
      };

      const result = await onSubmit(payload);
      if (!result || typeof result === 'boolean') return;

      const quotationId = (result as Quotation).id;
      const validItems  = items.filter(i => i.part_name.trim().length >= 2);

      for (let idx = 0; idx < validItems.length; idx++) {
        const item = validItems[idx];
        await QuotationService.addItem(
          quotationId,
          {
            part_id:               item.part_id,
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

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-4 sm:mb-6">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
            step === s ? 'bg-primary text-primary-foreground'
              : step > s ? 'bg-primary/20 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}>
            {step > s ? <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : s}
          </div>
          {s < 4 && (
            <div className={`w-8 sm:w-10 h-1 mx-1 rounded transition-colors ${step > s ? 'bg-primary/30' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );

  // ── Passo 1 ─────────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        <h3 className="font-semibold text-sm sm:text-base">Informações Gerais</h3>
      </div>

      {/* Finalidade */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Finalidade da cotação *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card
            className={`cursor-pointer transition-all ${
              wizData.purpose === 'stock'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'hover:border-muted-foreground/50'
            }`}
            onClick={() => setWizData(p => ({ ...p, purpose: 'stock', budget_reference: '' }))}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  wizData.purpose === 'stock' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Warehouse className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Para Compra</p>
                  <p className="text-xs text-muted-foreground">Reposição de estoque interno</p>
                </div>
                {wizData.purpose === 'stock' && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              wizData.purpose === 'budget'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'hover:border-muted-foreground/50'
            }`}
            onClick={() => setWizData(p => ({ ...p, purpose: 'budget', order_reference: '' }))}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  wizData.purpose === 'budget' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Para Orçamento</p>
                  <p className="text-xs text-muted-foreground">Suporte à equipe de vendas</p>
                </div>
                {wizData.purpose === 'budget' && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="wiz_title">Título da Cotação *</Label>
          <Input
            id="wiz_title"
            value={wizData.title}
            onChange={(e) => setWizData(p => ({ ...p, title: e.target.value }))}
            placeholder="Ex: Peças para motor MWM 4.10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wiz_due_date">Data Limite para Propostas *</Label>
          <Input
            id="wiz_due_date"
            type="date"
            min={todayStr()}
            value={wizData.due_date}
            onChange={(e) => setWizData(p => ({ ...p, due_date: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wiz_urgency">Urgência</Label>
          <Select
            value={wizData.urgency}
            onValueChange={(v) => setWizData(p => ({ ...p, urgency: v as QuotationUrgency }))}
          >
            <SelectTrigger id="wiz_urgency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(URGENCY_LABELS) as [QuotationUrgency, string][]).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Campo condicional: OS (select) ou Orçamento (texto) */}
        {wizData.purpose === 'stock' ? (
          <div className="space-y-1.5">
            <Label htmlFor="wiz_order_ref">Vínculo com OS (opcional)</Label>
            {loadingOrders ? (
              <div className="h-9 flex items-center px-3 border rounded-md text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Carregando...
              </div>
            ) : (
              <Select
                value={wizData.order_reference || 'none'}
                onValueChange={(v) => setWizData(p => ({ ...p, order_reference: v === 'none' ? '' : v }))}
              >
                <SelectTrigger id="wiz_order_ref">
                  <SelectValue placeholder="Selecione uma OS..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {orders.map(o => (
                    <SelectItem key={o.id} value={o.order_number}>{o.order_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="wiz_budget_ref">Orçamento vinculado (aprovado)</Label>
            {loadingBudgets ? (
              <div className="h-9 flex items-center px-3 border rounded-md text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Carregando...
              </div>
            ) : (
              <Select
                value={wizData.budget_reference || 'none'}
                onValueChange={(v) => setWizData(p => ({ ...p, budget_reference: v === 'none' ? '' : v }))}
              >
                <SelectTrigger id="wiz_budget_ref">
                  <SelectValue placeholder="Selecione um orçamento aprovado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {budgets.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Nenhum orçamento aprovado encontrado
                    </div>
                  ) : (
                    budgets.map(b => (
                      <SelectItem key={b.id} value={b.budget_number}>
                        {b.budget_number}{b.order_number ? ` — OS ${b.order_number}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wiz_notes">Observações</Label>
        <Textarea
          id="wiz_notes"
          value={wizData.notes}
          onChange={(e) => setWizData(p => ({ ...p, notes: e.target.value }))}
          placeholder="Informações adicionais para os fornecedores..."
          rows={3}
        />
      </div>
    </div>
  );

  // ── Passo 2 ─────────────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h3 className="font-semibold text-sm sm:text-base">Itens da Cotação</h3>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Adicionar</span> Item
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const search = partSearch[item.id] ?? '';
          const showDrop = showPartDrop[item.id] && search.length >= 1;
          const results  = filteredParts(search);

          return (
            <Card key={item.id} className="relative">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-3 min-w-0">

                    {/* Busca de peça */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Peça do estoque</Label>

                      {item.part_id ? (
                        /* Peça selecionada */
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/40">
                          <Package className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.part_name}</p>
                            {item.part_code && (
                              <p className="text-xs text-muted-foreground">{item.part_code}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => clearPartSelection(item.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        /* Campo de busca ou digitação livre */
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            className="pl-8 h-8 text-sm"
                            placeholder={loadingParts ? 'Carregando peças...' : 'Buscar no estoque ou digitar livremente...'}
                            value={search || item.part_name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPartSearch(prev => ({ ...prev, [item.id]: val }));
                              setShowPartDrop(prev => ({ ...prev, [item.id]: true }));
                              updateItem(item.id, 'part_name', val);
                              updateItem(item.id, 'part_code', '');
                              updateItem(item.id, 'part_id', undefined);
                            }}
                            onFocus={() => setShowPartDrop(prev => ({ ...prev, [item.id]: true }))}
                            onBlur={() => setTimeout(() => setShowPartDrop(prev => ({ ...prev, [item.id]: false })), 150)}
                          />
                          {showDrop && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover border rounded-md shadow-md max-h-44 overflow-y-auto">
                              {loadingParts ? (
                                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />Carregando...
                                </div>
                              ) : results.length === 0 ? (
                                <div className="p-3 text-sm text-muted-foreground">
                                  Nenhuma peça encontrada. Digite o nome para continuar.
                                </div>
                              ) : (
                                results.map(part => (
                                  <button
                                    key={part.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-accent flex items-start gap-2 border-b last:border-b-0"
                                    onMouseDown={() => selectPart(item.id, part)}
                                  >
                                    <Package className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">{part.part_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {part.part_code} · Estoque: {part.quantity}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Qtd + Unidade + Especificações */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground">Quantidade</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground">Unidade</Label>
                        <Select value={item.unit} onValueChange={(v) => updateItem(item.id, 'unit', v)}>
                          <SelectTrigger className="h-8 text-sm">
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
                      </div>

                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <Label className="text-xs font-medium text-muted-foreground">Especificações</Label>
                        <Input
                          value={item.specifications}
                          onChange={(e) => updateItem(item.id, 'specifications', e.target.value)}
                          placeholder="Especificações..."
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Remover */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0 mt-1"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {items.filter(i => i.part_name.trim().length >= 2).length} item(ns) válido(s)
      </p>
    </div>
  );

  // ── Passo 3 ─────────────────────────────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        <h3 className="font-semibold text-sm sm:text-base">Selecione os Fornecedores</h3>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Selecione os fornecedores que receberão esta cotação. Os melhores avaliados aparecem primeiro.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto px-1">
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
                <div className="flex items-start gap-2 sm:gap-3">
                  <Checkbox
                    checked={selectedSuppliers.includes(supplier.id)}
                    onCheckedChange={() => toggleSupplier(supplier.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{supplier.trade_name || supplier.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(supplier.overall_rating || supplier.rating) && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs">{(supplier.overall_rating ?? supplier.rating)?.toFixed(1)}</span>
                        </div>
                      )}
                      {supplier.delivery_days && (
                        <span className="text-xs text-muted-foreground">{supplier.delivery_days}d entrega</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs sm:text-sm text-muted-foreground">
        {selectedSuppliers.length} fornecedor(es) selecionado(s)
      </p>
    </div>
  );

  // ── Passo 4 ─────────────────────────────────────────────────────────────────
  const renderStep4 = () => {
    const validItems  = items.filter(i => i.part_name.trim().length >= 2);
    const urgencyColor = URGENCY_COLORS[wizData.urgency] ?? '';
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h3 className="font-semibold text-sm sm:text-base">Revisão e Confirmação</h3>
        </div>

        <Card>
          <CardContent className="p-3 sm:p-4 space-y-2">
            <h4 className="font-medium text-sm">Informações Gerais</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2">
                <span className="text-muted-foreground">Finalidade:</span>
                <div className="mt-1">
                  <Badge variant="outline" className={wizData.purpose === 'stock'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                  }>
                    {wizData.purpose === 'stock'
                      ? <><Warehouse className="h-3 w-3 mr-1 inline" />Para Compra</>
                      : <><Receipt className="h-3 w-3 mr-1 inline" />Para Orçamento</>
                    }
                  </Badge>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-muted-foreground">Título:</span>
                <p className="font-medium truncate">{wizData.title}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data Limite:</span>
                <p className="font-medium">{wizData.due_date}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Urgência:</span>
                <div className="mt-1">
                  <Badge className={`text-xs ${urgencyColor}`}>{URGENCY_LABELS[wizData.urgency]}</Badge>
                </div>
              </div>
              {wizData.purpose === 'stock' && wizData.order_reference && (
                <div>
                  <span className="text-muted-foreground">Vínculo OS:</span>
                  <p className="font-medium">{wizData.order_reference}</p>
                </div>
              )}
              {wizData.purpose === 'budget' && wizData.budget_reference && (
                <div>
                  <span className="text-muted-foreground">Ref. Orçamento:</span>
                  <p className="font-medium">{wizData.budget_reference}</p>
                </div>
              )}
              {wizData.notes && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Observações:</span>
                  <p className="text-sm">{wizData.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 space-y-2">
            <h4 className="font-medium text-sm">Itens ({validItems.length})</h4>
            <div className="space-y-1.5">
              {validItems.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md gap-2">
                  <div className="min-w-0 flex items-center gap-1.5">
                    {item.part_id && <Package className="h-3 w-3 text-primary flex-shrink-0" />}
                    <span className="truncate">
                      {idx + 1}. {item.part_code ? `[${item.part_code}] ` : ''}{item.part_name}
                    </span>
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 space-y-2">
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

  // ── Modo edição ──────────────────────────────────────────────────────────────
  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {quotation.quotation_number}</DialogTitle>
            <DialogDescription>Atualize as informações da cotação.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit_title">Título *</Label>
              <Input id="edit_title" {...register('title')}
                className={errors.title ? 'border-destructive' : ''} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit_due_date">Prazo para Resposta *</Label>
                <Input id="edit_due_date" type="date" min={todayStr()} {...register('due_date')}
                  className={errors.due_date ? 'border-destructive' : ''} />
                {errors.due_date && <p className="text-xs text-destructive">{errors.due_date.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Urgência</Label>
                <Select
                  defaultValue={quotation.urgency ?? 'normal'}
                  onValueChange={(v) => {
                    const event = { target: { value: v } };
                    register('urgency').onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(URGENCY_LABELS) as [QuotationUrgency, string][]).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_notes">Observações</Label>
              <Textarea id="edit_notes" {...register('notes')} rows={3}
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

  // ── Modo criação (wizard) ────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col p-4 sm:p-6">
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

        {/* px-1 em ambos os lados garante que o focus-ring não seja cortado */}
        <div className="flex-1 min-h-0 overflow-y-auto py-2 px-1">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
            disabled={submitting}
            className="h-8 sm:h-9"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step > 1 ? 'Voltar' : 'Cancelar'}
          </Button>

          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="h-8 sm:h-9"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="button" onClick={handleWizardSubmit} disabled={submitting} className="h-8 sm:h-9">
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
