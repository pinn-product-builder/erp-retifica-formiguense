import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PackageCheck, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ConditionalOrder } from '@/services/ConditionalOrderService';

export interface ReceiptItemInput {
  item_id: string;
  quantity_received: number;
  receiving_notes?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conditional: ConditionalOrder | null;
  onSubmit: (items: ReceiptItemInput[], notes?: string) => Promise<void>;
  loading?: boolean;
}

export function RegisterReceiptModal({ open, onOpenChange, conditional, onSubmit, loading = false }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  if (!conditional) return null;

  const items = conditional.items ?? [];

  const getQty = (id: string, ordered: number) =>
    quantities[id] ?? ordered;

  const setQty = (id: string, val: number) =>
    setQuantities(prev => ({ ...prev, [id]: val }));

  const handleSubmit = async () => {
    const receiptItems: ReceiptItemInput[] = items.map(i => ({
      item_id: i.id,
      quantity_received: getQty(i.id, i.quantity),
    }));
    await onSubmit(receiptItems, notes || undefined);
    setQuantities({});
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <PackageCheck className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Registrar Entrada — {conditional.conditional_number}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Confirme as quantidades recebidas para cada item
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-muted/50">
          <CardContent className="p-3 flex items-center gap-3">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="font-medium text-sm truncate">{conditional.supplier?.name}</p>
            {conditional.reference_doc && (
              <Badge variant="outline" className="text-xs ml-auto flex-shrink-0">
                {conditional.reference_doc}
              </Badge>
            )}
          </CardContent>
        </Card>

        <div className="flex-1 overflow-auto py-3 space-y-3">
          {items.map(item => {
            const qty = getQty(item.id, item.quantity);
            return (
              <Card key={item.id} className="border">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.part_name}</p>
                      {item.part_code && (
                        <p className="text-xs text-muted-foreground">{item.part_code}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Solicitado: <strong>{item.quantity}</strong> un. •{' '}
                        {formatCurrency(item.unit_price)}/un.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs whitespace-nowrap">Qtd. Recebida</Label>
                      <Input
                        type="number"
                        min={0}
                        max={item.quantity}
                        step={0.001}
                        value={qty}
                        onChange={e => setQty(item.id, Math.min(item.quantity, Math.max(0, parseFloat(e.target.value) || 0)))}
                        className="w-24 h-8 text-sm text-center"
                      />
                    </div>
                  </div>
                  {qty < item.quantity && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      Recebimento parcial: {item.quantity - qty} un. pendentes
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">Observações do Recebimento</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex.: Material recebido em bom estado, etiquetado como CONDICIONAL..."
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading} className="gap-1.5">
            <PackageCheck className="h-4 w-4" />
            {loading ? 'Registrando...' : 'Confirmar Entrada'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
