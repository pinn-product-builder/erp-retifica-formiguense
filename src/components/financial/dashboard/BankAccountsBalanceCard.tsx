import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Wallet } from 'lucide-react';
import { formatBRL } from '@/lib/financialFormat';
import { CashFlowService } from '@/services/financial/cashFlowService';
import { FinancialConfigService } from '@/services/financial/financialConfigService';
import { todayISODateLocal } from '@/lib/calendarDate';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type BankAccountRow = Database['public']['Tables']['bank_accounts']['Row'];

type BankAccountsBalanceCardProps = {
  orgIds: string[];
  /** Inclui transações marcadas como intercompany no cálculo. Default false. */
  includeIntercompany?: boolean;
};

type BalanceRow = {
  account: BankAccountRow;
  balance: number;
  orgId: string;
};

export function BankAccountsBalanceCard({ orgIds, includeIntercompany }: BankAccountsBalanceCardProps) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BalanceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (orgIds.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const today = todayISODateLocal();
      const perOrg = await Promise.all(
        orgIds.map(async (orgId) => {
          const accounts = await FinancialConfigService.listBankAccounts(orgId, true);
          const withBalances = await Promise.all(
            accounts.map(async (acc) => ({
              account: acc,
              orgId,
              balance: await CashFlowService.netBalanceForBankAccountThrough(orgId, acc.id, today, {
                includeIntercompany,
              }),
            }))
          );
          return withBalances;
        })
      );
      const flat = perOrg.flat();
      flat.sort((a, b) => {
        if (a.account.kind !== b.account.kind) return a.account.kind === 'bank' ? -1 : 1;
        return (a.account.bank_name ?? a.account.name ?? '').localeCompare(
          b.account.bank_name ?? b.account.name ?? ''
        );
      });
      setRows(flat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar saldos');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [orgIds, includeIntercompany]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = rows.reduce((acc, r) => acc + r.balance, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Saldo por conta bancária / caixa</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma conta cadastrada nesta organização.
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {rows.map((r) => {
                const isCash = r.account.kind === 'cash';
                const label = isCash
                  ? r.account.name || r.account.account_number || 'Caixa'
                  : r.account.bank_name || r.account.name || 'Conta';
                const sub = isCash
                  ? 'Caixa'
                  : [r.account.agency ? `ag. ${r.account.agency}` : null, r.account.account_number ? `cc ${r.account.account_number}` : null]
                      .filter(Boolean)
                      .join(' · ');
                return (
                  <li key={r.account.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      {isCash ? (
                        <Wallet className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Building2 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{label}</p>
                        {sub ? <p className="text-muted-foreground truncate text-xs">{sub}</p> : null}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 font-medium tabular-nums',
                        r.balance < 0 ? 'text-destructive' : 'text-foreground'
                      )}
                    >
                      {formatBRL(r.balance)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
              <span>Total disponível</span>
              <span className={cn('tabular-nums', total < 0 ? 'text-destructive' : 'text-success')}>
                {formatBRL(total)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
