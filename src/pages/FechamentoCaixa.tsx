import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import { CashClosingService } from '@/services/financial/cashClosingService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';

type ClosingRow = Record<string, unknown>;

export default function FechamentoCaixa() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id ?? '';
  const [rows, setRows] = useState<ClosingRow[]>([]);
  const [closingDate, setClosingDate] = useState(new Date().toISOString().slice(0, 10));
  const [physicalCash, setPhysicalCash] = useState('');
  const [bankBalance, setBankBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<{
    opening_balance: number;
    total_income: number;
    total_expenses: number;
    system_balance: number;
  } | null>(null);

  const load = async () => {
    if (!orgId) return;
    const data = await CashClosingService.list(orgId);
    setRows(data as unknown as ClosingRow[]);
  };

  useEffect(() => {
    void load();
  }, [orgId]);

  useEffect(() => {
    if (!orgId) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    void CashClosingService.computePreview(orgId, closingDate).then((p) => {
      if (!cancelled) setPreview(p);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId, closingDate]);

  const parsedPhysical = Number(String(physicalCash).replace(',', '.'));
  const parsedBank = Number(String(bankBalance).replace(',', '.'));
  const verifiedTotal = useMemo(() => {
    const a = Number.isFinite(parsedPhysical) ? parsedPhysical : 0;
    const b = Number.isFinite(parsedBank) ? parsedBank : 0;
    return a + b;
  }, [parsedPhysical, parsedBank]);

  const diffLive =
    preview != null ? verifiedTotal - preview.system_balance : 0;
  const willDiverge = Math.abs(diffLive) >= 0.02;

  const submit = async () => {
    if (!orgId) return;
    const pc = Number(String(physicalCash).replace(',', '.'));
    const bb = Number(String(bankBalance).replace(',', '.'));
    if (Number.isNaN(pc) || Number.isNaN(bb) || pc < 0 || bb < 0) {
      toast.error('Informe valores numéricos válidos para caixa físico e banco.');
      return;
    }
    if (willDiverge && !notes.trim()) {
      toast.error('Há divergência em relação ao saldo do sistema. Descreva a justificativa nas observações.');
      return;
    }
    const { error } = await CashClosingService.upsertFromCounts(orgId, user?.id ?? null, {
      closing_date: closingDate,
      physical_cash: pc,
      bank_balance: bb,
      notes: notes.trim() || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Fechamento registrado');
      setNotes('');
      void load();
    }
  };

  return (
    <FinancialPageShell>
      <div className="space-y-6 sm:space-y-8">
        <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Fechamento de caixa</h1>
        <Card className="border p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="fc-date">Data</Label>
              <Input
                id="fc-date"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Saldo abertura (dia anterior)</Label>
              <p className="text-sm sm:text-base font-semibold whitespace-nowrap">
                {preview != null ? formatBRL(preview.opening_balance) : '—'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Entradas do dia</Label>
              <p className="text-sm sm:text-base font-semibold whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                {preview != null ? formatBRL(preview.total_income) : '—'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Saídas do dia</Label>
              <p className="text-sm sm:text-base font-semibold whitespace-nowrap text-destructive">
                {preview != null ? formatBRL(preview.total_expenses) : '—'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Saldo consolidado (sistema)</Label>
              <p className="text-lg sm:text-xl md:text-2xl font-bold whitespace-nowrap">
                {preview != null ? formatBRL(preview.system_balance) : '—'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fc-phys">Caixa físico contado</Label>
              <Input
                id="fc-phys"
                inputMode="decimal"
                value={physicalCash}
                onChange={(e) => setPhysicalCash(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fc-bank">Saldo banco (contagem)</Label>
              <Input
                id="fc-bank"
                inputMode="decimal"
                value={bankBalance}
                onChange={(e) => setBankBalance(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border p-3">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total verificado (físico + banco)</p>
              <p className="text-lg font-semibold whitespace-nowrap">{formatBRL(verifiedTotal)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Diferença em relação ao sistema</p>
              <p
                className={`text-lg font-semibold whitespace-nowrap ${willDiverge ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'}`}
              >
                {preview != null ? formatBRL(diffLive) : '—'}
              </p>
            </div>
            {willDiverge ? (
              <Badge variant="destructive" className="w-fit">
                Divergente
              </Badge>
            ) : (
              <Badge variant="secondary" className="w-fit">
                Conferente
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fc-notes">Observações</Label>
            <Textarea
              id="fc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="max-h-[30vh] resize-none"
              placeholder={willDiverge ? 'Obrigatório em caso de divergência' : 'Opcional'}
            />
          </div>
          <Button type="button" className="w-full sm:w-auto" onClick={() => void submit()}>
            Registrar fechamento
          </Button>
        </Card>
        <Card className="border p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Sistema</TableHead>
                <TableHead className="text-right">Verificado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id as string}>
                  <TableCell>{formatDateBR(r.closing_date as string)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.system_balance ?? r.expected_balance ?? 0))}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.total_verified ?? r.counted_balance ?? 0))}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.difference_amount))}
                  </TableCell>
                  <TableCell>
                    {(r.status as string) === 'divergent' ? (
                      <Badge variant="destructive">Divergente</Badge>
                    ) : (
                      <Badge variant="secondary">Fechado</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </FinancialPageShell>
  );
}
