import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Calendar, Percent, Loader2 } from 'lucide-react';
import { format, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { ContractRow } from '@/services/ContractService';

interface RenewContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractRow | null;
  onSave: (contractId: string, payload: {
    new_start_date: string;
    new_end_date: string;
    price_adjustment_pct?: number;
    new_discount?: number | null;
    notes?: string;
  }) => Promise<boolean>;
}

export function RenewContractModal({ open, onOpenChange, contract, onSave }: RenewContractModalProps) {
  const [form, setForm] = useState({
    new_start_date: '',
    new_end_date: '',
    price_adjustment: '0',
    new_discount: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contract) {
      const endDate = new Date(contract.end_date);
      const newStart = new Date(endDate);
      newStart.setDate(newStart.getDate() + 1);
      const newEnd = addYears(newStart, 1);

      setForm({
        new_start_date: format(newStart, 'yyyy-MM-dd'),
        new_end_date: format(newEnd, 'yyyy-MM-dd'),
        price_adjustment: '0',
        new_discount: contract.discount_percentage?.toString() ?? '',
        notes: '',
      });
    }
  }, [contract]);

  const handleSubmit = async () => {
    if (!contract) return;
    setIsSubmitting(true);
    const ok = await onSave(contract.id, {
      new_start_date: form.new_start_date,
      new_end_date: form.new_end_date,
      price_adjustment_pct: parseFloat(form.price_adjustment) || 0,
      new_discount: form.new_discount ? parseFloat(form.new_discount) : null,
      notes: form.notes || undefined,
    });
    setIsSubmitting(false);
    if (ok) onOpenChange(false);
  };

  if (!contract) return null;

  const adjustment = parseFloat(form.price_adjustment) || 0;
  const newValue = contract.total_value * (1 + adjustment / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Renovar Contrato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-4 bg-muted/50 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Contrato Atual</span>
              <Badge variant="outline">{contract.contract_number}</Badge>
            </div>
            <p className="font-medium">{contract.supplier?.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(contract.start_date), 'dd/MM/yyyy', { locale: ptBR })} —{' '}
                {format(new Date(contract.end_date), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
            <p className="text-base font-bold">{formatCurrency(contract.total_value)}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new_start_date">Nova Data de Início</Label>
              <Input
                id="new_start_date"
                type="date"
                value={form.new_start_date}
                onChange={(e) => setForm({ ...form, new_start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_end_date">Nova Data de Término</Label>
              <Input
                id="new_end_date"
                type="date"
                value={form.new_end_date}
                onChange={(e) => setForm({ ...form, new_end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_adjustment">Reajuste de Preço (%)</Label>
              <div className="relative">
                <Input
                  id="price_adjustment"
                  type="number"
                  step="0.1"
                  value={form.price_adjustment}
                  onChange={(e) => setForm({ ...form, price_adjustment: e.target.value })}
                  className="pr-8"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_discount">Novo Desconto (%)</Label>
              <Input
                id="new_discount"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={form.new_discount}
                onChange={(e) => setForm({ ...form, new_discount: e.target.value })}
              />
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Novo Valor Estimado</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(newValue)}</span>
            </div>
            {adjustment !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {adjustment > 0 ? '+' : ''}{adjustment}% de reajuste aplicado
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações da Renovação</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Condições especiais, alterações..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Renovar Contrato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
