import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, ShoppingCart, Undo2, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ConditionalOrder, ItemDecision } from '@/services/ConditionalOrderService';

interface ConditionalDecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conditional: ConditionalOrder | null;
  selectedItemIds?: string[];
  onSubmit: (decisions: ItemDecision[], justification?: string) => Promise<void>;
  loading?: boolean;
}

export function ConditionalDecisionModal({
  open,
  onOpenChange,
  conditional,
  selectedItemIds,
  onSubmit,
  loading = false,
}: ConditionalDecisionModalProps) {
  const [decisions, setDecisions] = useState<Record<string, 'approve' | 'return'>>({});
  const [justification, setJustification] = useState('');

  if (!conditional) return null;

  const targetItems = selectedItemIds
    ? (conditional.items ?? []).filter((i) => selectedItemIds.includes(i.id))
    : (conditional.items ?? []);

  const isOverdue = conditional.status === 'overdue';

  const setItemDecision = (itemId: string, decision: 'approve' | 'return') => {
    setDecisions((prev) => ({ ...prev, [itemId]: decision }));
  };

  const approvedTotal = targetItems
    .filter((i) => decisions[i.id] === 'approve')
    .reduce((sum, i) => sum + i.total_price, 0);

  const returnedTotal = targetItems
    .filter((i) => decisions[i.id] === 'return')
    .reduce((sum, i) => sum + i.total_price, 0);

  const allDecided = targetItems.every((i) => decisions[i.id]);

  const handleSubmit = async () => {
    if (!allDecided) return;

    const itemDecisions: ItemDecision[] = targetItems.map((i) => ({
      item_id: i.id,
      decision: decisions[i.id],
      decision_notes: justification || undefined,
    }));

    await onSubmit(itemDecisions, justification || undefined);
    setDecisions({});
    setJustification('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 text-sm sm:text-base ${isOverdue ? 'text-destructive' : ''}`}>
            {isOverdue ? (
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
            )}
            {isOverdue ? 'Decisão Forçada' : 'Registrar Decisão'} — {conditional.conditional_number}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {isOverdue
              ? 'Esta condicional está vencida. Defina o destino de cada item imediatamente.'
              : `Decida o destino de ${targetItems.length} item(ns) selecionado(s).`}
          </DialogDescription>
        </DialogHeader>

        {isOverdue && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="p-3">
              <p className="text-destructive text-xs sm:text-sm font-medium">
                ⚠️ Prazo expirado! Você deve tomar uma decisão agora.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex-1 overflow-auto py-3 space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-xs text-right">Valor</TableHead>
                  <TableHead className="text-xs text-center">Decisão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targetItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium text-xs sm:text-sm">{item.part_name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} un.</p>
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs sm:text-sm whitespace-nowrap">
                      {formatCurrency(item.total_price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2 justify-center">
                        <Button
                          size="sm"
                          variant={decisions[item.id] === 'approve' ? 'default' : 'outline'}
                          onClick={() => setItemDecision(item.id, 'approve')}
                          className="h-7 px-2 sm:px-3 text-xs"
                          title="Aprovar Compra"
                        >
                          <ShoppingCart className="h-3.5 w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Comprar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant={decisions[item.id] === 'return' ? 'destructive' : 'outline'}
                          onClick={() => setItemDecision(item.id, 'return')}
                          className="h-7 px-2 sm:px-3 text-xs"
                          title="Devolver"
                        >
                          <Undo2 className="h-3.5 w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Devolver</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Aprovar Compra</p>
                <p className="text-sm sm:text-base font-bold text-green-600 whitespace-nowrap">
                  {formatCurrency(approvedTotal)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Devolver</p>
                <p className="text-sm sm:text-base font-bold text-red-600 whitespace-nowrap">
                  {formatCurrency(returnedTotal)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">
              Justificativa {isOverdue && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Motivo das decisões tomadas..."
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!allDecided || loading || (isOverdue && !justification.trim())}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            {loading ? 'Salvando...' : 'Confirmar Decisão'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
