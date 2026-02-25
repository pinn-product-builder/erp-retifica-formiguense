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
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { ContractRow } from '@/services/ContractService';

interface EditContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractRow | null;
  onSave: (contractId: string, payload: {
    start_date: string;
    end_date: string;
    payment_days: number;
    discount_percentage?: number | null;
    renewal_notice_days: number;
    auto_renew: boolean;
    notes?: string | null;
  }) => Promise<boolean>;
}

export function EditContractModal({ open, onOpenChange, contract, onSave }: EditContractModalProps) {
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    payment_days: '30',
    discount_percentage: '',
    renewal_notice_days: '30',
    auto_renew: false,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contract) {
      setForm({
        start_date: contract.start_date,
        end_date: contract.end_date,
        payment_days: contract.payment_days.toString(),
        discount_percentage: contract.discount_percentage?.toString() ?? '',
        renewal_notice_days: contract.renewal_notice_days.toString(),
        auto_renew: contract.auto_renew,
        notes: contract.notes ?? '',
      });
    }
  }, [contract]);

  const handleSubmit = async () => {
    if (!contract) return;
    setIsSubmitting(true);
    const ok = await onSave(contract.id, {
      start_date: form.start_date,
      end_date: form.end_date,
      payment_days: parseInt(form.payment_days),
      discount_percentage: form.discount_percentage ? parseFloat(form.discount_percentage) : null,
      renewal_notice_days: parseInt(form.renewal_notice_days),
      auto_renew: form.auto_renew,
      notes: form.notes || null,
    });
    setIsSubmitting(false);
    if (ok) onOpenChange(false);
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contrato — {contract.contract_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Fornecedor</p>
            <p className="font-medium">{contract.supplier?.name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_days">Prazo de Pagamento (dias)</Label>
              <Input
                id="payment_days"
                type="number"
                min={1}
                value={form.payment_days}
                onChange={(e) => setForm({ ...form, payment_days: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Desconto (%)</Label>
              <Input
                id="discount_percentage"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={form.discount_percentage}
                onChange={(e) => setForm({ ...form, discount_percentage: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="renewal_notice_days">Aviso de Renovação (dias antes do vencimento)</Label>
            <Input
              id="renewal_notice_days"
              type="number"
              min={1}
              value={form.renewal_notice_days}
              onChange={(e) => setForm({ ...form, renewal_notice_days: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Renovação Automática</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Renovar automaticamente ao expirar
              </p>
            </div>
            <Switch
              checked={form.auto_renew}
              onCheckedChange={(checked) => setForm({ ...form, auto_renew: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Condições especiais, observações..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
