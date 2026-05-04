import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { BankReconciliationService } from '@/services/financial/bankReconciliationService';
import { FinancialConfigService } from '@/services/financial/financialConfigService';
import { StatementImportService } from '@/services/financial/statementImportService';
import { ReconciliationMatchingService } from '@/services/financial/reconciliationMatchingService';
import { CashFlowService } from '@/services/financial/cashFlowService';
import {
  ReconciliationHintsService,
  type SupplierClassificationHint,
} from '@/services/financial/reconciliationHintsService';
import { ReconciliationReportService } from '@/services/financial/reconciliationReportService';
import { CardMachineService } from '@/services/financial/cardMachineService';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import { Building2, FileText, Landmark, Upload } from 'lucide-react';

type BankAccountRow = Database['public']['Tables']['bank_accounts']['Row'];
type BslRow = Database['public']['Tables']['bank_statement_lines']['Row'];
type ImportRow = Database['public']['Tables']['bank_statement_imports']['Row'];
type CfRow = Database['public']['Tables']['cash_flow']['Row'];
type BrRow = Database['public']['Tables']['bank_reconciliations']['Row'];
type CardMachineRow = Database['public']['Tables']['card_machine_configs']['Row'];

const STATUS_PT: Record<string, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  reconciled: 'Conciliada',
};

function expectedNetFromMachine(
  gross: number,
  cfg: CardMachineRow | null
): { net: number; fee: number } | null {
  if (!cfg) return null;
  const pct = Number(cfg.fee_percentage ?? 0) / 100;
  const fixed = Number(cfg.fee_fixed ?? 0);
  const fee = Math.max(0, gross * pct + fixed);
  const net = gross - fee;
  return { net, fee };
}

function accountLabel(a: BankAccountRow): string {
  const n = a.name ?? '';
  if (a.kind === 'cash') return n || a.account_number;
  const b = a.bank_name ? `${a.bank_name} — ` : '';
  return `${n} (${b}${a.account_number})`;
}

export default function ConciliacaoBancaria() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id ?? '';
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [accounts, setAccounts] = useState<BankAccountRow[]>([]);
  const [bankId, setBankId] = useState<string>('');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [balance, setBalance] = useState('');
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [selectedImportId, setSelectedImportId] = useState<string>('');
  const [lines, setLines] = useState<BslRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);
  const [cfByLine, setCfByLine] = useState<Record<string, string>>({});
  const [cashFlows, setCashFlows] = useState<(CfRow & Record<string, unknown>)[]>([]);
  const [lineHints, setLineHints] = useState<Record<string, SupplierClassificationHint | null>>({});
  const [activeReconciliationId, setActiveReconciliationId] = useState<string>('');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [machineConfigs, setMachineConfigs] = useState<CardMachineRow[]>([]);

  const loadReconciliations = useCallback(async () => {
    if (!orgId) return;
    const r = await BankReconciliationService.list(orgId);
    setRows(r as unknown as Record<string, unknown>[]);
  }, [orgId]);

  const reconciliations = useMemo(
    () => (rows as unknown as BrRow[]).filter((r) => String(r.org_id) === orgId),
    [rows, orgId]
  );

  const activeReconciliation = useMemo(
    () => reconciliations.find((r) => r.id === activeReconciliationId) ?? null,
    [reconciliations, activeReconciliationId]
  );

  const loadAccounts = useCallback(async () => {
    if (!orgId) return;
    const ba = await FinancialConfigService.listBankAccounts(orgId, true);
    setAccounts(ba);
    setBankId((prev) => prev || ba[0]?.id || '');
  }, [orgId]);

  const loadMachines = useCallback(async () => {
    if (!orgId) return;
    const list = await CardMachineService.list(orgId);
    setMachineConfigs(list.filter((c) => c.is_active));
  }, [orgId]);

  const loadImports = useCallback(async () => {
    if (!orgId) return;
    const list = await StatementImportService.listByOrg(orgId);
    setImports(list);
  }, [orgId]);

  const loadLines = useCallback(
    async (importId: string) => {
      if (!importId) {
        setLines([]);
        return;
      }
      const ls = await BankReconciliationService.listLines(importId);
      setLines(ls);
    },
    []
  );

  const loadCashFlowsForBank = useCallback(async () => {
    if (!orgId || !bankId) {
      setCashFlows([]);
      return;
    }
    const res = await CashFlowService.listPaginated(orgId, 1, 300, undefined, undefined, {
      includeIntercompany: true,
    });
    const filtered = res.data.filter(
      (r) => String(r.bank_account_id) === bankId && !r.reconciled
    );
    setCashFlows(filtered);
  }, [orgId, bankId]);

  useEffect(() => {
    void loadReconciliations();
    void loadAccounts();
    void loadImports();
    void loadMachines();
  }, [orgId, loadReconciliations, loadAccounts, loadImports, loadMachines]);

  useEffect(() => {
    void loadLines(selectedImportId);
  }, [selectedImportId, loadLines]);

  useEffect(() => {
    void loadCashFlowsForBank();
  }, [loadCashFlowsForBank]);

  useEffect(() => {
    if (!orgId || lines.length === 0) {
      setLineHints({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const pending = lines.filter((l) => !l.matched_cash_flow_id);
      const results = await Promise.all(
        pending.map(async (ln) => {
          const desc = (ln.description as string) ?? '';
          const hint = await ReconciliationHintsService.matchSupplierByDescription(orgId, desc);
          return [ln.id, hint] as const;
        })
      );
      const next: Record<string, SupplierClassificationHint | null> = {};
      for (const [id, hint] of results) next[id] = hint;
      if (!cancelled) setLineHints(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, lines]);

  const create = async () => {
    if (!orgId || !bankId) {
      toast.error('Selecione uma conta bancária');
      return;
    }
    const { error } = await BankReconciliationService.create({
      org_id: orgId,
      bank_account_id: bankId,
      statement_end_date: endDate,
      statement_balance: Number(balance.replace(',', '.')),
      status: 'open',
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Conciliação criada');
      setBalance('');
      void loadReconciliations();
    }
  };

  const handleStatementFile = async (file: File | null) => {
    if (!file || !orgId || !bankId) {
      toast.error('Selecione conta e arquivo');
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const { importId, lineCount, error } = await StatementImportService.importFromText({
        orgId,
        bankAccountId: bankId,
        fileName: file.name,
        text,
        userId: user?.id ?? null,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`${lineCount} linhas importadas`);
      await loadImports();
      setSelectedImportId(importId);
      void loadCashFlowsForBank();
    } finally {
      setImporting(false);
    }
  };

  const runAutoMatch = async () => {
    if (!orgId || !bankId || !selectedImportId) return;
    setAutoMatching(true);
    try {
      const { matched, error } = await ReconciliationMatchingService.autoMatchImport(
        orgId,
        selectedImportId,
        bankId,
        4,
        activeReconciliationId || undefined,
        user?.id ?? null
      );
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`${matched} lançamentos vinculados`);
      void loadLines(selectedImportId);
      void loadCashFlowsForBank();
    } finally {
      setAutoMatching(false);
    }
  };

  const [reportingId, setReportingId] = useState<string | null>(null);

  const generateFormalReport = async (reconciliationId: string) => {
    if (!orgId) return;
    setReportingId(reconciliationId);
    try {
      const snapshot = await ReconciliationReportService.buildFormalSnapshot({
        orgId,
        reconciliationId,
        importId: selectedImportId || null,
      });
      await ReconciliationReportService.createSnapshot(
        orgId,
        reconciliationId,
        user?.id ?? null,
        snapshot
      );
      ReconciliationReportService.openPrintableReport(snapshot);
      toast.success('Relatório aberto; use Imprimir para salvar em PDF');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao gerar relatório');
    } finally {
      setReportingId(null);
    }
  };

  const manualMatch = async (lineId: string) => {
    const cfId = cfByLine[lineId];
    if (!cfId) {
      toast.error('Selecione um lançamento de caixa');
      return;
    }

    if (!activeReconciliationId) {
      toast.error('Selecione uma conciliação (sessão) no histórico para registrar auditoria');
      return;
    }

    const ln = lines.find((l) => l.id === lineId);
    if (!ln) {
      toast.error('Linha não encontrada');
      return;
    }

    const { error } = await BankReconciliationService.confirmMatch({
      reconciliationId: activeReconciliationId,
      statementLineId: lineId,
      cashFlowId: cfId,
      matchedAmount: Number(ln.amount),
      userId: user?.id ?? null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Vinculado e confirmado');
      void loadLines(selectedImportId);
      void loadCashFlowsForBank();
      setCfByLine((prev) => {
        const next = { ...prev };
        delete next[lineId];
        return next;
      });
    }
  };

  const unmatch = async (lineId: string) => {
    const ln = lines.find((l) => l.id === lineId);
    if (!ln?.matched_cash_flow_id) return;
    const cfId = ln.matched_cash_flow_id;
    const { error } = await BankReconciliationService.unmatchLine(lineId);
    if (error) {
      toast.error(error.message);
      return;
    }
    await CashFlowService.update(orgId, cfId, { reconciled: false });
    toast.success('Vínculo removido');
    void loadLines(selectedImportId);
    void loadCashFlowsForBank();
  };

  const adjustLine = async (lineId: string) => {
    if (!activeReconciliationId) {
      toast.error('Selecione uma conciliação (sessão) no histórico');
      return;
    }
    const reason = window.prompt('Motivo do ajuste (ex: taxa maquininha, estorno, tarifa):')?.trim();
    if (!reason) return;
    const ln = lines.find((l) => l.id === lineId);
    if (!ln) return;
    const { error } = await BankReconciliationService.markAdjusted({
      reconciliationId: activeReconciliationId,
      statementLineId: lineId,
      matchedAmount: Number(ln.amount),
      reason,
      userId: user?.id ?? null,
    });
    if (error) toast.error(error.message);
    else toast.success('Ajuste registrado');
  };

  const closeSession = async (reconciliationId: string) => {
    if (!orgId) return;
    setClosingId(reconciliationId);
    try {
      const { error } = await BankReconciliationService.updateStatus(orgId, reconciliationId, 'reconciled');
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Sessão conciliada');
      if (activeReconciliationId === reconciliationId) setActiveReconciliationId('');
      await loadReconciliations();
    } finally {
      setClosingId(null);
    }
  };

  const machineCfgByMethod = useMemo(() => {
    const m = new Map<string, CardMachineRow>();
    for (const c of machineConfigs) {
      if (c.payment_method) m.set(String(c.payment_method), c);
    }
    return m;
  }, [machineConfigs]);

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl tracking-tight">
            Conciliação bancária
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Extrato, importação e vínculo com fluxo de caixa
          </p>
          <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Sessão ativa:{' '}
            <span className="font-medium text-foreground">
              {activeReconciliation
                ? `${formatDateBR(activeReconciliation.statement_end_date)} — ${STATUS_PT[activeReconciliation.status] ?? activeReconciliation.status}`
                : 'nenhuma'}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <CardTitle className="text-base sm:text-lg">Importar extrato (OFX / CSV)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="imp-bank">Conta</Label>
                <Select value={bankId || undefined} onValueChange={setBankId}>
                  <SelectTrigger id="imp-bank" className="w-full">
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent className="z-[2000]">
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="truncate">{accountLabel(a)}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {accounts.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Cadastre contas em Configurações financeiras
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stmt-file">Arquivo</Label>
                <Input
                  id="stmt-file"
                  type="file"
                  accept=".ofx,.qfx,.csv,.txt"
                  disabled={importing || !orgId}
                  className="text-xs sm:text-sm"
                  onChange={(e) => void handleStatementFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Label className="text-xs sm:text-sm shrink-0">Importações recentes</Label>
              <Select value={selectedImportId || undefined} onValueChange={setSelectedImportId}>
                <SelectTrigger className="w-full sm:max-w-md">
                  <SelectValue placeholder="Selecione para ver linhas" />
                </SelectTrigger>
                <SelectContent className="z-[2000]">
                  {imports.map((im) => (
                    <SelectItem key={im.id} value={im.id}>
                      {(im.file_name as string) ?? im.id} — {im.file_format as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto"
                disabled={!selectedImportId || autoMatching}
                onClick={() => void runAutoMatch()}
              >
                {autoMatching ? '…' : 'Conciliar automático'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedImportId && lines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Linhas do extrato</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="hidden md:table-cell">Descrição</TableHead>
                      <TableHead>Vínculo</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((ln) => (
                      (() => {
                        const cf = ln.matched_cash_flow_id
                          ? cashFlows.find((c) => c.id === ln.matched_cash_flow_id) ?? null
                          : null;
                        const cfg =
                          cf?.payment_method != null
                            ? machineCfgByMethod.get(String(cf.payment_method)) ?? null
                            : null;
                        const maybe = cf ? expectedNetFromMachine(Number(cf.amount), cfg) : null;
                        const feeHint =
                          cf && maybe
                            ? Math.abs(Number(ln.amount) - maybe.net) <= 0.5
                              ? `Possível taxa: ${formatBRL(maybe.fee)} (líquido estimado ${formatBRL(maybe.net)})`
                              : null
                            : null;

                        return (
                      <TableRow key={ln.id}>
                        <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                          {formatDateBR(ln.transaction_date)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm font-medium">
                          {formatBRL(Number(ln.amount))}
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[220px] text-sm align-top">
                          <div className="truncate" title={ln.description ?? ''}>
                            {ln.description ?? '—'}
                          </div>
                          {lineHints[ln.id] && (
                            <p className="text-xs text-primary mt-1 line-clamp-2">
                              {lineHints[ln.id]?.label}: categoria/CC padrão do fornecedor disponíveis no cadastro.
                            </p>
                          )}
                          {feeHint && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feeHint}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {ln.matched_cash_flow_id ? (
                            <div className="space-y-1">
                              <span className="text-muted-foreground">
                                Caixa {ln.matched_cash_flow_id.slice(0, 8)}…
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => void unmatch(ln.id)}
                                >
                                  Desvincular
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Select
                              value={cfByLine[ln.id] ?? ''}
                              onValueChange={(v) =>
                                setCfByLine((prev) => ({ ...prev, [ln.id]: v }))
                              }
                            >
                              <SelectTrigger className="h-8 text-xs w-full min-w-[140px]">
                                <SelectValue placeholder="Lançamento" />
                              </SelectTrigger>
                              <SelectContent className="z-[2000] max-h-60">
                                {cashFlows.map((cf) => (
                                  <SelectItem key={cf.id} value={cf.id}>
                                    <span className="truncate">
                                      {formatDateBR(String(cf.transaction_date))}{' '}
                                      {formatBRL(Number(cf.amount))} {String(cf.description).slice(0, 24)}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!ln.matched_cash_flow_id && (
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => void manualMatch(ln.id)}
                              >
                                Vincular
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-xs"
                                onClick={() => void adjustLine(ln.id)}
                              >
                                Ajustar
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                        );
                      })()
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Landmark className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <CardTitle className="text-base sm:text-lg">Nova conciliação (saldo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bank-account">Conta bancária</Label>
                <Select value={bankId || undefined} onValueChange={setBankId}>
                  <SelectTrigger id="bank-account" className="w-full">
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent className="z-[2000]">
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="truncate">{accountLabel(a)}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stmt-date">Data do extrato</Label>
                <Input
                  id="stmt-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stmt-balance">Saldo do extrato</Label>
                <Input
                  id="stmt-balance"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" className="w-full sm:w-auto" onClick={() => void create()} disabled={!orgId}>
                Nova conciliação
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Histórico</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data extrato</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right w-[260px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id as string}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateBR(r.statement_end_date as string)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium text-xs sm:text-sm">
                        {formatBRL(Number(r.statement_balance))}
                      </TableCell>
                      <TableCell>{STATUS_PT[(r.status as string) ?? ''] ?? (r.status as string)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant={activeReconciliationId === (r.id as string) ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={() => setActiveReconciliationId(r.id as string)}
                          >
                            {activeReconciliationId === (r.id as string) ? 'Sessão ativa' : 'Selecionar'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1"
                            disabled={!orgId || reportingId === (r.id as string)}
                            onClick={() => void generateFormalReport(r.id as string)}
                          >
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            <span className="hidden sm:inline">PDF</span>
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                            disabled={
                              !orgId ||
                              (r.status as string) !== 'open' ||
                              closingId === (r.id as string)
                            }
                            onClick={() => void closeSession(r.id as string)}
                          >
                            {closingId === (r.id as string) ? '…' : 'Fechar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhuma conciliação registrada
                      </TableCell>
                    </TableRow>
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
