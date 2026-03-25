import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import { ApRecurringService } from '@/services/financial/apRecurringService';
import { FinancialConfigService } from '@/services/financial/financialConfigService';
import type { Database } from '@/integrations/supabase/types';
import { formatBRL, formatDateBR, paymentMethodLabel } from '@/lib/financialFormat';
import { Plus, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type ScheduleRow = Database['public']['Tables']['ap_recurring_schedules']['Row'];
type PmEnum = Database['public']['Enums']['payment_method'];

const PM_OPTIONS: PmEnum[] = [
  'cash',
  'pix',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'check',
  'boleto',
];

export default function ApRecorrentes() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState('');
  const [nextRun, setNextRun] = useState(new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState('');
  const [catId, setCatId] = useState('');
  const [pm, setPm] = useState<PmEnum>('pix');

  const load = useCallback(async () => {
    if (!orgId) return;
    const [list, cats] = await Promise.all([
      ApRecurringService.list(orgId),
      FinancialConfigService.listExpenseCategories(orgId),
    ]);
    setRows(list);
    setCategories(
      (cats as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name }))
    );
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setAmount('');
    setNextRun(new Date().toISOString().slice(0, 10));
    setDesc('');
    setCatId('');
    setPm('pix');
  };

  const submit = async () => {
    if (!orgId) return;
    const a = Number(String(amount).replace(',', '.'));
    if (!desc.trim() || Number.isNaN(a) || a <= 0) {
      toast.error('Preencha descrição e valor válidos.');
      return;
    }
    if (!catId) {
      toast.error('Selecione uma categoria.');
      return;
    }
    const d = new Date(nextRun + 'T12:00:00');
    setSaving(true);
    try {
      const { error } = await ApRecurringService.save({
        org_id: orgId,
        amount: a,
        next_run_date: nextRun,
        description_template: desc.trim(),
        expense_category_id: catId,
        payment_method: pm,
        frequency: 'monthly',
        is_active: true,
        day_of_month: d.getDate(),
        start_date: nextRun,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Recorrência salva');
      setOpen(false);
      resetForm();
      void load();
    } finally {
      setSaving(false);
    }
  };

  const generateOne = async (id: string) => {
    if (!orgId) return;
    const { error } = await ApRecurringService.generateNextPayable(orgId, id);
    if (error) toast.error(error.message);
    else {
      toast.success('Título gerado');
      void load();
    }
  };

  const remove = async (id: string) => {
    if (!orgId) return;
    const { error } = await ApRecurringService.remove(orgId, id);
    if (error) toast.error(error.message);
    else {
      toast.success('Recorrência excluída');
      void load();
    }
  };

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Contas a pagar recorrentes</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Modelos mensais e geração de títulos
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="w-full sm:w-auto" onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Nova recorrência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Nova recorrência</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="aprec-desc">Descrição</Label>
                  <Input
                    id="aprec-desc"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Ex.: Aluguel matriz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aprec-amt">Valor</Label>
                  <Input
                    id="aprec-amt"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aprec-next">Próximo vencimento</Label>
                  <Input
                    id="aprec-next"
                    type="date"
                    value={nextRun}
                    onChange={(e) => setNextRun(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Categoria</Label>
                  <Select value={catId || '__'} onValueChange={(v) => setCatId(v === '__' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__">—</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Forma de pagamento</Label>
                  <Select value={pm} onValueChange={(v) => setPm(v as PmEnum)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PM_OPTIONS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {paymentMethodLabel(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" disabled={saving} onClick={() => void submit()}>
                  {saving ? 'Salvando…' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Agendas</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Próximo</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground text-sm">
                        Nenhuma recorrência cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {r.description_template}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                          {formatBRL(Number(r.amount))}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                          {formatDateBR(r.next_run_date)}
                        </TableCell>
                        <TableCell>
                          {r.is_active ? (
                            <Badge variant="secondary">Sim</Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => void generateOne(r.id)}
                            >
                              <Play className="mr-1 h-3 w-3" />
                              Gerar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive"
                              onClick={() => void remove(r.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinancialPageShell>
  );
}
