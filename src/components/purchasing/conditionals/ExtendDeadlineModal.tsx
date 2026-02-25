import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarClock, AlertTriangle } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ConditionalOrder } from '@/services/ConditionalOrderService';

export interface ExtendDeadlineInput {
  days_added: number;
  justification: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conditional: ConditionalOrder | null;
  extensionCount: number;
  onSubmit: (input: ExtendDeadlineInput) => Promise<void>;
  loading?: boolean;
}

export function ExtendDeadlineModal({ open, onOpenChange, conditional, extensionCount, onSubmit, loading = false }: Props) {
  const [daysAdded, setDaysAdded] = useState(5);
  const [justification, setJustification] = useState('');

  if (!conditional) return null;

  const maxDays = extensionCount === 0 ? 7 : 3;
  const isSecond = extensionCount === 1;
  const canExtend = extensionCount < 2;

  const newDeadline = addDays(new Date(conditional.expiry_date), daysAdded);

  const handleSubmit = async () => {
    if (!justification.trim() || daysAdded < 1 || daysAdded > maxDays) return;
    await onSubmit({ days_added: daysAdded, justification });
    setDaysAdded(5);
    setJustification('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Prorrogar Prazo — {conditional.conditional_number}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {isSecond
              ? '2ª prorrogação — máximo 3 dias.'
              : '1ª prorrogação — máximo 7 dias.'}
          </DialogDescription>
        </DialogHeader>

        {!canExtend && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs font-medium">
                  Limite de prorrogações atingido. Não é possível prorrogar novamente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {canExtend && (
          <div className="space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="p-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Prazo atual</p>
                  <p className="font-medium">
                    {format(new Date(conditional.expiry_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Novo prazo</p>
                  <p className="font-medium text-primary">
                    {format(newDeadline, 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">
                Dias adicionais * <span className="text-muted-foreground">(máx. {maxDays} dias)</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={maxDays}
                value={daysAdded}
                onChange={e => setDaysAdded(Math.min(maxDays, Math.max(1, parseInt(e.target.value) || 1)))}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">
                Justificativa *
              </Label>
              <Textarea
                value={justification}
                onChange={e => setJustification(e.target.value)}
                placeholder="Ex.: Técnico responsável em férias, aguardando laudo externo..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          {canExtend && (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading || !justification.trim() || daysAdded < 1}
              className="gap-1.5"
            >
              <CalendarClock className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Prorrogar'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
