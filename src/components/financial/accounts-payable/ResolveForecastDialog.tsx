import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ApRecurringService, type ResolveForecastInput } from '@/services/financial/apRecurringService';
import { formatBRL, paymentMethodLabel } from '@/lib/financialFormat';
import type { Database } from '@/integrations/supabase/types';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';

type Pm = Database['public']['Enums']['payment_method'];

const PM_KEYS: Pm[] = ['cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'boleto'];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payableId: string | null;
  orgId: string | null;
  forecastSnapshot: {
    supplierName: string;
    predictedAmount: number;
    dueDate: string;
    description: string;
  } | null;
  onResolved?: () => void | Promise<void>;
};

export function ResolveForecastDialog({
  open,
  onOpenChange,
  payableId,
  orgId,
  forecastSnapshot,
  onResolved,
}: Props) {
  const [actualAmount, setActualAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierDocument, setSupplierDocument] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Pm | ''>('');
  const [competenceDate, setCompetenceDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && forecastSnapshot) {
      setActualAmount(String(forecastSnapshot.predictedAmount).replace('.', ','));
      setInvoiceNumber('');
      setSupplierDocument('');
      setPaymentMethod('');
      setCompetenceDate(forecastSnapshot.dueDate.slice(0, 10));
      setNotes('');
    }
  }, [open, forecastSnapshot]);

  const numericActual = Number(actualAmount.replace(',', '.'));
  const valid = !!payableId && !!orgId && Number.isFinite(numericActual) && numericActual > 0;
  const delta = forecastSnapshot ? numericActual - forecastSnapshot.predictedAmount : 0;
  const deltaPct =
    forecastSnapshot && forecastSnapshot.predictedAmount > 0
      ? (delta / forecastSnapshot.predictedAmount) * 100
      : 0;

  const handleResolve = async () => {
    if (!payableId || !orgId) return;
    setSaving(true);
    try {
      const input: ResolveForecastInput = {
        actualAmount: numericActual,
        invoiceNumber: invoiceNumber.trim() || null,
        paymentMethod: paymentMethod || null,
        competenceDate: competenceDate || null,
        supplierDocument: supplierDocument.trim() || null,
        notes: notes.trim() || null,
      };
      const { variance } = await ApRecurringService.resolveForecast(orgId, payableId, input);
      const pctStr = `${variance.deltaPct > 0 ? '+' : ''}${variance.deltaPct.toFixed(2)}%`;
      toast.success(
        `Previsão confirmada · variância ${pctStr} (${variance.delta > 0 ? '+' : ''}${formatBRL(variance.delta)})`
      );
      onOpenChange(false);
      await onResolved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao confirmar previsão');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left text-lg sm:text-xl">
            <Receipt className="h-5 w-5" />
            Confirmar previsão com NF real
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Atualize o valor previsto com os dados da nota fiscal recebida. A variância é calculada
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        {forecastSnapshot && (
          <div className="rounded-md border p-3 space-y-1 text-xs sm:text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Fornecedor</span>
              <span className="font-medium truncate">{forecastSnapshot.supplierName}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Descrição</span>
              <span className="truncate">{forecastSnapshot.description}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Previsto</span>
              <span className="font-semibold whitespace-nowrap">
                {formatBRL(forecastSnapshot.predictedAmount)}
              </span>
            </div>
            {valid && (
              <div className="flex justify-between gap-2 pt-1 border-t">
                <span className="text-muted-foreground">Variância</span>
                <Badge variant={Math.abs(deltaPct) > 5 ? 'destructive' : 'secondary'} className="text-xs">
                  {`${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(2)}%`} (
                  {`${delta > 0 ? '+' : ''}${formatBRL(delta)}`})
                </Badge>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="rf-amount" className="text-xs sm:text-sm">
              Valor real da NF <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rf-amount"
              inputMode="decimal"
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rf-invoice" className="text-xs sm:text-sm">
                Número da NF
              </Label>
              <Input
                id="rf-invoice"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rf-doc" className="text-xs sm:text-sm">
                CPF/CNPJ do fornecedor
              </Label>
              <Input
                id="rf-doc"
                value={supplierDocument}
                onChange={(e) => setSupplierDocument(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rf-comp" className="text-xs sm:text-sm">
                Data competência
              </Label>
              <Input
                id="rf-comp"
                type="date"
                value={competenceDate}
                onChange={(e) => setCompetenceDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs sm:text-sm">Forma de pagamento</Label>
              <Select
                value={paymentMethod || '__none__'}
                onValueChange={(v) => setPaymentMethod(v === '__none__' ? '' : (v as Pm))}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {PM_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {paymentMethodLabel(k)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rf-notes" className="text-xs sm:text-sm">
              Observações
            </Label>
            <Textarea
              id="rf-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!valid || saving} onClick={() => void handleResolve()}>
            {saving ? 'Confirmando…' : 'Confirmar com NF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
