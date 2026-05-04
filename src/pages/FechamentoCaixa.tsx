import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { CashRegisterSessionService } from '@/services/financial/cashRegisterSessionService';
import { FinancialConfigService } from '@/services/financial/financialConfigService';
import { useAuth } from '@/hooks/useAuth';
import { useProfilePermissions } from '@/hooks/useProfilePermissions';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import {
  LayoutGrid,
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
  CalendarClock,
  History,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Separator } from '@/components/ui/separator';

type ClosingRow = Record<string, unknown>;
type SessionRow = Database['public']['Tables']['cash_register_sessions']['Row'];

export default function FechamentoCaixa() {
  const { currentOrganization } = useOrganization();
  const orgLabel = currentOrganization?.name?.trim() ?? '';
  const { user } = useAuth();
  const profilePerms = useProfilePermissions();
  const orgId = currentOrganization?.id ?? '';
  const userId = user?.id ?? '';

  const [myBankAccountId, setMyBankAccountId] = useState<string | null>(null);
  const [myAccountLabel, setMyAccountLabel] = useState('');
  const [accountLoading, setAccountLoading] = useState(true);

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

  const [openDialog, setOpenDialog] = useState(false);
  const [openDate, setOpenDate] = useState(new Date().toISOString().slice(0, 10));
  const [openBalance, setOpenBalance] = useState('');
  const [openNotes, setOpenNotes] = useState('');
  const [openingBusy, setOpeningBusy] = useState(false);

  const [openSession, setOpenSession] = useState<SessionRow | null>(null);

  useEffect(() => {
    if (!orgId || !userId) {
      setMyBankAccountId(null);
      setAccountLoading(false);
      return;
    }
    let cancelled = false;
    setAccountLoading(true);
    void FinancialConfigService.getOrCreateUserCashAccount(
      orgId,
      userId,
      user?.email ?? 'Operador'
    )
      .then((ba) => {
        if (!cancelled) {
          setMyBankAccountId(ba.id);
          setMyAccountLabel((ba as { name?: string }).name ?? 'Meu caixa');
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Falha ao carregar conta de caixa'))
      .finally(() => {
        if (!cancelled) setAccountLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, userId, user?.email]);

  useEffect(() => {
    if (!orgId || !userId) {
      setOpenSession(null);
      return;
    }
    let cancelled = false;
    void CashRegisterSessionService.getOpenForUser(orgId, userId).then((s) => {
      if (!cancelled) setOpenSession(s);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId, userId, myBankAccountId]);

  const load = useCallback(async () => {
    if (!orgId || !myBankAccountId) return;
    const data = await CashClosingService.list(orgId, 60, myBankAccountId);
    setRows(data as unknown as ClosingRow[]);
  }, [orgId, myBankAccountId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!orgId || !myBankAccountId) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    void CashClosingService.computePreview(orgId, closingDate, myBankAccountId).then((p) => {
      if (!cancelled) setPreview(p);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId, closingDate, myBankAccountId]);

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
    if (!orgId || !myBankAccountId) return;
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
      bank_account_id: myBankAccountId,
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
      void CashRegisterSessionService.getOpenForUser(orgId, userId).then(setOpenSession);
    }
  };

  const handleOpenCash = async () => {
    if (!orgId || !userId || !myBankAccountId) return;
    const bal = Number(String(openBalance).replace(',', '.'));
    if (Number.isNaN(bal) || bal < 0) {
      toast.error('Informe um saldo inicial válido (use 0 se não houver).');
      return;
    }
    setOpeningBusy(true);
    try {
      const { error } = await CashRegisterSessionService.openSession({
        orgId,
        userId,
        bankAccountId: myBankAccountId,
        businessDate: openDate,
        openingBalance: bal,
        notes: openNotes.trim() || null,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Caixa aberto');
      setOpenDialog(false);
      setOpenNotes('');
      void CashRegisterSessionService.getOpenForUser(orgId, userId).then(setOpenSession);
      void load();
    } finally {
      setOpeningBusy(false);
    }
  };

  return (
    <FinancialPageShell>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Fechamento de caixa</h1>
            {orgLabel ? (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{orgLabel}</p>
            ) : null}
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Movimentos e fechamento valem apenas para <span className="font-medium text-foreground">sua conta de caixa</span>
              {myAccountLabel ? ` (${myAccountLabel})` : ''}. O consolidado da empresa soma todos os operadores.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profilePerms.canAccessPage('/fechamento-caixa/consolidado') && (
              <Button type="button" variant="outline" size="sm" asChild className="w-full sm:w-auto">
                <Link to="/fechamento-caixa/consolidado" className="gap-2 inline-flex items-center">
                  <LayoutGrid className="h-4 w-4" />
                  Consolidado da empresa
                </Link>
              </Button>
            )}
          </div>
        </div>

        {accountLoading && (
          <p className="text-sm text-muted-foreground">Carregando sua conta de caixa…</p>
        )}
        {!accountLoading && myBankAccountId && (
          <p className="text-sm text-muted-foreground">
            Conta: <span className="font-medium text-foreground">{myAccountLabel}</span>
            {openSession && (
              <Badge variant="outline" className="ml-2">
                Sessão aberta · {formatDateBR(openSession.business_date)}
              </Badge>
            )}
          </p>
        )}

        <Card className="border p-3 sm:p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Abertura do dia</h2>
              <p className="text-xs text-muted-foreground">
                Registre o saldo inicial ao começar o caixa (opcional se já aberto).
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!myBankAccountId || !!openSession}
              onClick={() => {
                setOpenDate(closingDate);
                setOpenDialog(true);
              }}
            >
              Abrir caixa
            </Button>
          </div>
          {openSession && (
            <div className="rounded-lg border bg-muted/40 p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4 shrink-0" />
                <span>
                  Sessão aberta · movimento em{' '}
                  <span className="font-medium text-foreground">{formatDateBR(openSession.business_date)}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <span>
                  Saldo na abertura:{' '}
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatBRL(Number(openSession.opening_balance))}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Aberto em {new Date(openSession.opened_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card className="border p-3 sm:p-4 space-y-4">
          <CardHeader className="p-0 space-y-1">
            <CardTitle className="text-base sm:text-lg">Resumo do dia selecionado</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Valores calculados pelo sistema a partir do fluxo de caixa da sua conta. Ajuste a data para conferir outro dia.
            </CardDescription>
          </CardHeader>
          <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="fc-date">Data do fechamento</Label>
              <Input
                id="fc-date"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <StatCard
              title="Saldo abertura"
              value={preview != null ? formatBRL(preview.opening_balance) : '—'}
              icon={Wallet}
              variant="default"
              calculationInfo="Saldo esperado pelo sistema até o fim do dia anterior (movimentos da sua conta de caixa)."
            />
            <StatCard
              title="Entradas do dia"
              value={preview != null ? formatBRL(preview.total_income) : '—'}
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Saídas do dia"
              value={preview != null ? formatBRL(preview.total_expenses) : '—'}
              icon={TrendingDown}
              variant="danger"
            />
            <StatCard
              title="Saldo sistema (seu caixa)"
              value={preview != null ? formatBRL(preview.system_balance) : '—'}
              icon={Landmark}
              variant="primary"
              calculationInfo="Saldo que o sistema espera no fim do dia na sua conta, antes da sua contagem física."
            />
          </div>
          <Separator />
          <div className="space-y-3">
            <div>
              <Label className="text-xs sm:text-sm">Sua contagem</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Dinheiro em caixa e valor que você considera em &quot;banco&quot; para este fechamento.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
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
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={!myBankAccountId}
            onClick={() => void submit()}
          >
            Registrar fechamento
          </Button>
        </Card>
        <Card className="border overflow-hidden">
          <CardHeader className="border-b bg-muted/30 p-3 sm:p-4 space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                <div>
                  <CardTitle className="text-base sm:text-lg">Seus fechamentos recentes</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Somente a conta de caixa vinculada a você nesta organização.
                  </CardDescription>
                </div>
              </div>
              {!accountLoading && myBankAccountId ? (
                <Badge variant="outline" className="w-fit shrink-0">
                  {rows.length} registro{rows.length !== 1 ? 's' : ''}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <div className="overflow-x-auto p-0">
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
              {rows.length === 0 && !accountLoading && myBankAccountId && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                    Nenhum fechamento registrado ainda para esta conta. Use o formulário acima após contar o caixa.
                  </TableCell>
                </TableRow>
              )}
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
          </div>
        </Card>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Abrir caixa</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Data do movimento</Label>
                <Input type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Saldo inicial (em dinheiro)</Label>
                <Input
                  inputMode="decimal"
                  value={openBalance}
                  onChange={(e) => setOpenBalance(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancelar
              </Button>
              <Button type="button" disabled={openingBusy} onClick={() => void handleOpenCash()}>
                {openingBusy ? 'Abrindo…' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FinancialPageShell>
  );
}
