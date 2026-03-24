import { useEffect, useState } from 'react';
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
import { useOrganization } from '@/hooks/useOrganization';
import { BankReconciliationService } from '@/services/financial/bankReconciliationService';
import { FinancialConfigService } from '@/services/financial/financialConfigService';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import { Building2, Landmark } from 'lucide-react';

type BankAccountRow = Database['public']['Tables']['bank_accounts']['Row'];

const STATUS_PT: Record<string, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  reconciled: 'Conciliada',
};

export default function ConciliacaoBancaria() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [accounts, setAccounts] = useState<BankAccountRow[]>([]);
  const [bankId, setBankId] = useState<string>('');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [balance, setBalance] = useState('');

  const load = async () => {
    if (!orgId) return;
    const [r, ba] = await Promise.all([
      BankReconciliationService.list(orgId),
      FinancialConfigService.listBankAccounts(orgId),
    ]);
    setRows(r as unknown as Record<string, unknown>[]);
    setAccounts(ba);
    if (!bankId && ba.length > 0) {
      setBankId(ba[0].id);
    }
  };

  useEffect(() => {
    void load();
  }, [orgId]);

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
      void load();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Conciliação bancária</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Compare extrato com movimentações e mantenha o saldo alinhado
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
          <Landmark className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <CardTitle className="text-base sm:text-lg">Nova conciliação</CardTitle>
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
                        <span className="truncate">
                          {a.bank_name} — {a.account_number}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {accounts.length === 0 && (
                <p className="text-xs text-muted-foreground">Cadastre contas em Configurações financeiras</p>
              )}
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
                    <TableCell className="text-right whitespace-nowrap font-medium">
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
  );
}
