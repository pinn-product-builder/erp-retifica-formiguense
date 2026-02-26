import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge }    from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Gift, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

const BONUS_TYPES = [
  { value: 'promotional',  label: 'Promocional' },
  { value: 'negotiation',  label: 'Negociação' },
  { value: 'replacement',  label: 'Reposição' },
  { value: 'sample',       label: 'Amostra' },
] as const;

type BonusType = typeof BONUS_TYPES[number]['value'];

interface BonusItem {
  part_name:  string;
  part_code:  string;
  quantity:   number;
  bonus_type: BonusType;
  notes:      string;
}

interface SimpleSupplier { id: string; name: string }

interface BonusReceiptModalProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?:   () => void;
}

const emptyItem = (): BonusItem => ({
  part_name: '', part_code: '', quantity: 1, bonus_type: 'promotional', notes: '',
});

export function BonusReceiptModal({ open, onOpenChange, onSuccess }: BonusReceiptModalProps) {
  const { currentOrganization } = useOrganization();
  const [suppliers,    setSuppliers]    = useState<SimpleSupplier[]>([]);
  const [supplierId,   setSupplierId]   = useState('');
  const [receiptDate,  setReceiptDate]  = useState(new Date().toISOString().split('T')[0]);
  const [items,        setItems]        = useState<BonusItem[]>([emptyItem()]);
  const [saving,       setSaving]       = useState(false);

  const fetchSuppliers = useCallback(async () => {
    if (!currentOrganization?.id) return;
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('org_id', currentOrganization.id)
      .eq('is_active', true)
      .order('name');
    setSuppliers((data ?? []) as SimpleSupplier[]);
  }, [currentOrganization?.id]);

  useEffect(() => { if (open) fetchSuppliers(); }, [open, fetchSuppliers]);

  const updateItem = (i: number, field: keyof BonusItem, value: string | number) =>
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));

  const handleSave = async () => {
    if (!currentOrganization?.id || !supplierId) return;
    const invalid = items.some((it) => !it.part_name.trim() || it.quantity < 1);
    if (invalid) { toast.error('Preencha nome e quantidade de todos os itens'); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      for (const item of items) {
        const { data: existing } = await supabase
          .from('parts_inventory')
          .select('id, quantity')
          .eq('part_code', item.part_code || item.part_name)
          .eq('org_id', currentOrganization.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('inventory_movements')
            .insert({
              org_id:            currentOrganization.id,
              part_id:           existing.id,
              movement_type:     'entrada',
              quantity:          item.quantity,
              previous_quantity: existing.quantity,
              new_quantity:      existing.quantity + item.quantity,
              reason:            `Recebimento de bonificação — ${BONUS_TYPES.find(t => t.value === item.bonus_type)?.label}`,
              notes:             item.notes || null,
              created_by:        user?.id ?? '',
              requires_approval: false,
              approval_status:   'approved',
              approved_by:       user?.id ?? '',
              approved_at:       new Date().toISOString(),
              metadata: {
                action_type:  'bonus_receipt',
                supplier_id:  supplierId,
                bonus_type:   item.bonus_type,
                receipt_date: receiptDate,
              },
            });
        }
      }

      toast.success(`${items.length} item(ns) bonificado(s) registrado(s) no estoque (custo zero)`);
      onSuccess?.();
      onOpenChange(false);
      setItems([emptyItem()]);
      setSupplierId('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar bonificação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-600" />
            Registrar Produtos Bonificados
          </DialogTitle>
          <DialogDescription>
            Itens recebidos como bonificação entram no estoque com custo zero e não geram conta a pagar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Fornecedor *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Data do Recebimento *</Label>
              <Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Itens Bonificados</Label>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}>
                <Plus className="h-3 w-3" /> Adicionar item
              </Button>
            </div>

            {items.map((item, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-3 bg-green-50/30">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                      onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome da Peça *</Label>
                    <Input value={item.part_name} onChange={(e) => updateItem(i, 'part_name', e.target.value)}
                      placeholder="Ex: Rolamento 6205" className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Código</Label>
                    <Input value={item.part_code} onChange={(e) => updateItem(i, 'part_code', e.target.value)}
                      placeholder="Ex: PART-001" className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quantidade *</Label>
                    <Input type="number" min={1} value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Bonificação</Label>
                    <Select value={item.bonus_type} onValueChange={(v) => updateItem(i, 'bonus_type', v)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BONUS_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Observações</Label>
                  <Textarea value={item.notes} onChange={(e) => updateItem(i, 'notes', e.target.value)}
                    rows={2} placeholder="Motivo da bonificação..." className="text-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !supplierId}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gift className="h-4 w-4 mr-2" />}
            Registrar Bonificação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
