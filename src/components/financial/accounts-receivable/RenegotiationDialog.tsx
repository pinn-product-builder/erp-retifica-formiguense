import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export type RenegotiationFormState = {
  installments: string;
  first_due_date: string;
  competence_date: string;
  reason: string;
};

type RenegotiationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: RenegotiationFormState;
  onFormChange: (next: RenegotiationFormState) => void;
  onSubmit: () => void | Promise<void>;
  customerLabel?: string;
};

export function RenegotiationDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  customerLabel,
}: RenegotiationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-left text-xl sm:text-2xl">Renegociar título</DialogTitle>
          {customerLabel ? (
            <p className="text-muted-foreground text-left text-xs sm:text-sm">{customerLabel}</p>
          ) : null}
        </DialogHeader>
        <form
          className="space-y-4 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reneg-n">Novas parcelas</Label>
              <Input
                id="reneg-n"
                type="number"
                min={1}
                max={60}
                value={form.installments}
                onChange={(e) => onFormChange({ ...form, installments: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reneg-first">1º vencimento</Label>
              <Input
                id="reneg-first"
                type="date"
                value={form.first_due_date}
                onChange={(e) => onFormChange({ ...form, first_due_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reneg-comp">Competência</Label>
            <Input
              id="reneg-comp"
              type="date"
              value={form.competence_date}
              onChange={(e) => onFormChange({ ...form, competence_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reneg-reason">Motivo</Label>
            <Textarea
              id="reneg-reason"
              value={form.reason}
              onChange={(e) => onFormChange({ ...form, reason: e.target.value })}
              rows={3}
              className="min-h-[72px] resize-y"
            />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar renegociação</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
