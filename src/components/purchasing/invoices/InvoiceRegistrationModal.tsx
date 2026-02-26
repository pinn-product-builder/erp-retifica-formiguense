import { useState, useEffect } from 'react';
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
import { Badge }    from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { usePurchaseInvoices } from '@/hooks/usePurchaseInvoices';
import {
  invoiceSchema,
  InvoiceFormData,
  calcDueDates,
  checkDivergences,
  TOLERANCE_PCT,
} from '@/services/PurchaseInvoiceService';

interface SimpleOrder {
  id:          string;
  po_number:   string;
  total_value: number;
  supplier?:   { name: string } | null;
}

interface InvoiceRegistrationModalProps {
  open:              boolean;
  onOpenChange:      (open: boolean) => void;
  purchaseOrderId?:  string;
  purchaseOrderNo?:  string;
  orderTotalValue?:  number;
  receiptId?:        string;
  onSuccess?:        () => void;
}

const todayStr = () => new Date().toISOString().split('T')[0];

export function InvoiceRegistrationModal({
  open,
  onOpenChange,
  purchaseOrderId: initialOrderId,
  purchaseOrderNo: initialOrderNo,
  orderTotalValue: initialOrderVal,
  receiptId,
  onSuccess,
}: InvoiceRegistrationModalProps) {
  const { currentOrganization } = useOrganization();
  const { createInvoice, isSaving } = usePurchaseInvoices();

  const [orders,        setOrders]        = useState<SimpleOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SimpleOrder | null>(null);

  const needsOrderSelect = !initialOrderId;
  const purchaseOrderId  = selectedOrder?.id   ?? initialOrderId  ?? '';
  const purchaseOrderNo  = selectedOrder?.po_number ?? initialOrderNo  ?? '';
  const orderTotalValue  = selectedOrder?.total_value ?? initialOrderVal ?? 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      purchase_order_id: purchaseOrderId,
      receipt_id:        receiptId ?? null,
      issue_date:        todayStr(),
      total_products:    0,
      total_freight:     0,
      total_taxes:       0,
      total_discount:    0,
      total_invoice:     0,
      due_dates:         [],
      payment_condition: '',
      access_key:        '',
    },
  });

  const [dueDateInputs, setDueDateInputs] = useState<string[]>(['']);

  useEffect(() => {
    if (!open || !needsOrderSelect || !currentOrganization?.id) return;
    setLoadingOrders(true);
    supabase
      .from('purchase_orders')
      .select('id, po_number, total_value, supplier:suppliers(name)')
      .eq('org_id', currentOrganization.id)
      .in('status', ['approved', 'confirmed', 'delivered'])
      .order('po_number', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!error && data) setOrders(data as unknown as SimpleOrder[]);
        setLoadingOrders(false);
      });
  }, [open, needsOrderSelect, currentOrganization?.id]);

  useEffect(() => {
    if (open) {
      setSelectedOrder(null);
      reset({
        purchase_order_id: initialOrderId ?? '',
        receipt_id:        receiptId ?? null,
        issue_date:        todayStr(),
        total_products:    0,
        total_freight:     0,
        total_taxes:       0,
        total_discount:    0,
        total_invoice:     0,
        due_dates:         [],
        payment_condition: '',
        access_key:        '',
      });
      setDueDateInputs(['']);
    }
  }, [open, initialOrderId, receiptId, reset]);

  const watchedValues = watch([
    'total_products', 'total_freight', 'total_taxes', 'total_discount',
    'total_invoice', 'issue_date', 'payment_condition',
  ]);

  const [products, freight, taxes, discount, totalInvoice, issueDate, paymentCondition] = watchedValues;

  const calculatedTotal = Number(products || 0) + Number(freight || 0) + Number(taxes || 0) - Number(discount || 0);

  const divergences = checkDivergences(orderTotalValue, Number(totalInvoice || 0));
  const isDivergent = divergences.length > 0;

  const calculatedDueDates = paymentCondition
    ? calcDueDates(issueDate || todayStr(), paymentCondition)
    : dueDateInputs.filter(Boolean);

  const addDueDateInput = () => setDueDateInputs((prev) => [...prev, '']);
  const removeDueDateInput = (idx: number) =>
    setDueDateInputs((prev) => prev.filter((_, i) => i !== idx));
  const updateDueDateInput = (idx: number, val: string) => {
    setDueDateInputs((prev) => prev.map((v, i) => (i === idx ? val : v)));
  };

  const onSubmit = async (data: InvoiceFormData) => {
    const finalDueDates = paymentCondition
      ? calcDueDates(data.issue_date, paymentCondition)
      : dueDateInputs.filter(Boolean);

    const invoice = await createInvoice(
      { ...data, due_dates: finalDueDates },
      orderTotalValue,
    );
    if (invoice) {
      onSuccess?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isSaving) onOpenChange(o); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Registrar Nota Fiscal
          </DialogTitle>
          <DialogDescription>
            Pedido {purchaseOrderNo} · Valor do pedido: {formatCurrency(orderTotalValue)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-2 px-1">
          <form id="nf-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Seleção de pedido (quando não pré-selecionado) */}
            {needsOrderSelect && (
              <div className="space-y-1.5">
                <Label htmlFor="nf_order_select">Pedido de Compra *</Label>
                {loadingOrders ? (
                  <div className="h-9 flex items-center px-3 border rounded-md text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Carregando pedidos...
                  </div>
                ) : (
                  <Select
                    value={selectedOrder?.id ?? ''}
                    onValueChange={(v) => {
                      const order = orders.find((o) => o.id === v) ?? null;
                      setSelectedOrder(order);
                      if (order) setValue('purchase_order_id', order.id);
                    }}
                  >
                    <SelectTrigger id="nf_order_select" className={!selectedOrder ? 'border-muted-foreground/50' : ''}>
                      <SelectValue placeholder="Selecione o pedido de compra..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.po_number}{o.supplier?.name ? ` — ${o.supplier.name}` : ''}{' '}
                          ({formatCurrency(o.total_value)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Identificação da NF */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Identificação
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nf_number">Número da NF *</Label>
                  <Input
                    id="nf_number"
                    {...register('invoice_number')}
                    placeholder="Ex: 000012345"
                    className={errors.invoice_number ? 'border-destructive' : ''}
                  />
                  {errors.invoice_number && (
                    <p className="text-xs text-destructive">{errors.invoice_number.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nf_series">Série</Label>
                  <Input
                    id="nf_series"
                    {...register('invoice_series')}
                    placeholder="Ex: 001"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nf_issue_date">Data de Emissão *</Label>
                  <Input
                    id="nf_issue_date"
                    type="date"
                    {...register('issue_date')}
                    className={errors.issue_date ? 'border-destructive' : ''}
                  />
                  {errors.issue_date && (
                    <p className="text-xs text-destructive">{errors.issue_date.message}</p>
                  )}
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-3">
                  <Label htmlFor="nf_access_key">
                    Chave de Acesso NF-e{' '}
                    <span className="text-muted-foreground font-normal">(44 dígitos, opcional)</span>
                  </Label>
                  <Input
                    id="nf_access_key"
                    {...register('access_key')}
                    placeholder="00000000000000000000000000000000000000000000"
                    maxLength={44}
                    className={`font-mono text-xs ${errors.access_key ? 'border-destructive' : ''}`}
                  />
                  {errors.access_key && (
                    <p className="text-xs text-destructive">{errors.access_key.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Valores */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Valores</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nf_products">Produtos (R$) *</Label>
                  <Input
                    id="nf_products"
                    type="number"
                    step={0.01}
                    min={0}
                    {...register('total_products', { valueAsNumber: true })}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setValue('total_products', v);
                      setValue('total_invoice', v + Number(freight || 0) + Number(taxes || 0) - Number(discount || 0));
                    }}
                    className={errors.total_products ? 'border-destructive' : ''}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nf_freight">Frete (R$)</Label>
                  <Input
                    id="nf_freight"
                    type="number"
                    step={0.01}
                    min={0}
                    {...register('total_freight', { valueAsNumber: true })}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setValue('total_freight', v);
                      setValue('total_invoice', Number(products || 0) + v + Number(taxes || 0) - Number(discount || 0));
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nf_taxes">Impostos (R$)</Label>
                  <Input
                    id="nf_taxes"
                    type="number"
                    step={0.01}
                    min={0}
                    {...register('total_taxes', { valueAsNumber: true })}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setValue('total_taxes', v);
                      setValue('total_invoice', Number(products || 0) + Number(freight || 0) + v - Number(discount || 0));
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nf_discount">Desconto (R$)</Label>
                  <Input
                    id="nf_discount"
                    type="number"
                    step={0.01}
                    min={0}
                    {...register('total_discount', { valueAsNumber: true })}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setValue('total_discount', v);
                      setValue('total_invoice', Number(products || 0) + Number(freight || 0) + Number(taxes || 0) - v);
                    }}
                  />
                </div>
              </div>

              {/* Totais e conferência */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nf_total">
                    Valor Total da NF *
                  </Label>
                  <Input
                    id="nf_total"
                    type="number"
                    step={0.01}
                    min={0}
                    {...register('total_invoice', { valueAsNumber: true })}
                    className={`font-semibold ${errors.total_invoice ? 'border-destructive' : ''}`}
                  />
                  {errors.total_invoice && (
                    <p className="text-xs text-destructive">{errors.total_invoice.message}</p>
                  )}
                  {calculatedTotal > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Calculado: {formatCurrency(calculatedTotal)}
                    </p>
                  )}
                </div>

                <Card className={`${isDivergent ? 'border-destructive bg-red-50 dark:bg-red-950/20' : 'border-green-200 bg-green-50 dark:bg-green-950/20'}`}>
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {isDivergent
                        ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        : <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      }
                      <span>{isDivergent ? 'Divergências detectadas' : 'Valores conferidos'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Pedido: <span className="font-medium">{formatCurrency(orderTotalValue)}</span>
                    </div>
                    {isDivergent && divergences.map((d, i) => (
                      <p key={i} className="text-xs text-destructive">
                        {d.field}: {d.diff_pct > 0 ? '+' : ''}{d.diff_pct}% fora da tolerância ({TOLERANCE_PCT}%)
                      </p>
                    ))}
                    {!isDivergent && Number(totalInvoice) > 0 && (
                      <p className="text-xs text-green-600">Dentro da tolerância de {TOLERANCE_PCT}%</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Condição de Pagamento */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Condição de Pagamento</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nf_payment">
                    Condição{' '}
                    <span className="text-muted-foreground font-normal text-xs">
                      (Ex: 30/60/90 — gera vencimentos automaticamente)
                    </span>
                  </Label>
                  <Input
                    id="nf_payment"
                    {...register('payment_condition')}
                    placeholder="Ex: 30/60 ou 30 dias"
                  />
                </div>

                {calculatedDueDates.length > 0 && (
                  <div className="rounded-md border p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Vencimentos calculados</p>
                    <div className="flex flex-wrap gap-2">
                      {calculatedDueDates.map((date, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          Parcela {i + 1}: {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!paymentCondition && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Ou adicione datas de vencimento manualmente:
                    </p>
                    <div className="space-y-2">
                      {dueDateInputs.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={val}
                            onChange={(e) => updateDueDateInput(idx, e.target.value)}
                            className="h-8 text-sm flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeDueDateInput(idx)}
                            disabled={dueDateInputs.length === 1}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDueDateInput}
                        className="h-8"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Adicionar vencimento
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isDivergent && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 p-3 flex items-start gap-2 text-xs text-amber-700">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  A NF apresenta divergências em relação ao pedido. Ela será salva com status
                  <strong> Divergente</strong> e ficará disponível para revisão.
                </span>
              </div>
            )}
          </form>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="submit" form="nf-form" disabled={isSaving}>
            {isSaving
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <FileText className="h-4 w-4 mr-2" />
            }
            Registrar NF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
