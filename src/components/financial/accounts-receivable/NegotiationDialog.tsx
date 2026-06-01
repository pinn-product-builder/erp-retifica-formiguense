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
import { Badge } from '@/components/ui/badge';
import { ArNegotiationService, type ArNegotiationState } from '@/services/financial/arNegotiationService';
import { formatDateBR } from '@/lib/financialFormat';
import { Handshake } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivableId: string | null;
  orgId: string | null;
  initialState: ArNegotiationState | null;
  userId: string | null;
  onChanged?: () => void | Promise<void>;
};

export function NegotiationDialog({
  open,
  onOpenChange,
  receivableId,
  orgId,
  initialState,
  userId,
  onChanged,
}: Props) {
  const [promisedDate, setPromisedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPromisedDate(initialState?.promisedDate ?? '');
      setNotes(initialState?.notes ?? '');
    }
  }, [open, initialState]);

  const isActive = !!initialState?.isActive;

  const handleStart = async () => {
    if (!receivableId || !orgId) return;
    setSaving(true);
    try {
      await ArNegotiationService.start(
        receivableId,
        orgId,
        { promisedDate, notes },
        userId
      );
      toast.success('Negociação registrada. Régua automática pausada para este título.');
      onOpenChange(false);
      await onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar negociação');
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!receivableId || !orgId) return;
    setSaving(true);
    try {
      await ArNegotiationService.resolve(receivableId, orgId);
      toast.success('Negociação resolvida — régua volta a operar.');
      onOpenChange(false);
      await onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao resolver negociação');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!receivableId || !orgId) return;
    const confirmed = window.confirm('Cancelar negociação e apagar registros? A régua volta a operar.');
    if (!confirmed) return;
    setSaving(true);
    try {
      await ArNegotiationService.cancel(receivableId, orgId);
      toast.success('Negociação cancelada');
      onOpenChange(false);
      await onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar negociação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left text-lg sm:text-xl">
            <Handshake className="h-5 w-5" />
            Negociação individual
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Pausa a régua automática de cobrança e registra a nova data prometida pelo cliente.
          </DialogDescription>
        </DialogHeader>

        {isActive && (
          <div className="rounded-md border border-warning/60 bg-warning/10 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Em negociação</Badge>
              {initialState?.promisedDate && (
                <span className="text-xs">Data prometida: {formatDateBR(initialState.promisedDate)}</span>
              )}
            </div>
            {initialState?.pausedAt && (
              <p className="text-xs text-muted-foreground">
                Pausada desde {formatDateBR(initialState.pausedAt.slice(0, 10))}.
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="neg-date" className="text-xs sm:text-sm">
              Nova data prometida
            </Label>
            <Input
              id="neg-date"
              type="date"
              value={promisedDate}
              onChange={(e) => setPromisedDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="neg-notes" className="text-xs sm:text-sm">
              Motivo / detalhes da conversa
            </Label>
            <Textarea
              id="neg-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: cliente vai pagar no dia 25/05 via PIX; conversa por WhatsApp com Fernanda."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {isActive && (
            <>
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={() => void handleCancel()}
              >
                Cancelar negociação
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => void handleResolve()}
              >
                Marcar como resolvida
              </Button>
            </>
          )}
          <Button
            type="button"
            disabled={saving || !promisedDate || notes.trim().length < 5}
            onClick={() => void handleStart()}
          >
            {saving ? 'Salvando…' : isActive ? 'Atualizar negociação' : 'Iniciar negociação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
