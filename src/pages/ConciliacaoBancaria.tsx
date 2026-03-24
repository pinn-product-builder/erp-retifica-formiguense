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
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import { Building2, Landmark, Upload } from 'lucide-react';

type BankAccountRow = Database['public']['Tables']['bank_accounts']['Row'];
type BslRow = Database['public']['Tables']['bank_statement_lines']['Row'];
type ImportRow = Database['public']['Tables']['bank_statement_imports']['Row'];
type CfRow = Database['public']['Tables']['cash_flow']['Row'];

const STATUS_PT: Record<string, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  reconciled: 'Conciliada',
};

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

  const loadReconciliations = useCallback(async () => {
    if (!orgId) return;
    const r = await BankReconciliationService.list(orgId);
    setRows(r as unknown as Record<string, unknown>[]);
  }, [orgId]);

  const loadAccounts = useCallback(async () => {
    if (!orgId) return;
    const ba = await FinancialConfigService.listBankAccounts(orgId, true);
    setAccounts(ba);
    setBankId((prev) => prev || ba[0]?.id || '');
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
    const res = await CashFlowService.listPaginated(orgId, 1, 300);
    const filtered = res.data.filter(
      (r) => String(r.bank_account_id) === bankId && !r.reconciled
    );
    setCashFlows(filtered);
  }, [orgId, bankId]);

  useEffect(() => {
    void loadReconciliations();
    void loadAccounts();
    void loadImports();
  }, [orgId, loadReconciliations, loadAccounts, loadImports]);

  useEffect(() => {
    void loadLines(selectedImportId);
  }, [selectedImportId, loadLines]);

  useEffect(() => {
    void loadCashFlowsForBank();
  }, [loadCashFlowsForBank]);

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
        bankId
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

  const manualMatch = async (lineId: string) => {
    const cfId = cfByLine[lineId];
    if (!cfId) {
      toast.error('Selecione um lançamento de caixa');
      return;
    }
    const { error } = await BankReconciliationService.matchLineToCashFlow(lineId, cfId);
    if (error) toast.error(error.message);
    else {
      toast.success('Vinculado');
      void loadLines(selectedImportId);
      void loadCashFlowsForBank();
      setCfByLine((prev) => {
        const next = { ...prev };
        delete next[lineId];
        return next;
      });
    }
  };

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
                      <TableRow key={ln.id}>
                        <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                          {formatDateBR(ln.transaction_date)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm font-medium">
                          {formatBRL(Number(ln.amount))}
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate text-sm">
                          {ln.description ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {ln.matched_cash_flow_id ? (
                            <span className="text-muted-foreground">Caixa {ln.matched_cash_flow_id.slice(0, 8)}…</span>
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
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => void manualMatch(ln.id)}
                            >
                              Vincular
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
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
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
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
