import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinancial } from '@/hooks/useFinancial';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useFinancialOrgScope } from '@/hooks/useFinancialOrgScope';
import { FinancialOrgScopeSelect } from '@/components/financial/FinancialOrgScopeSelect';
import { useArDueAlertsPanel } from '@/hooks/useArDueAlertsPanel';
import type { FinancialKpis } from '@/services/financial/types';
import type { DueWindowSummary } from '@/services/financial';
import {
  FinancialDueAlertsCard,
  FinancialDashboardApTable,
  FinancialDashboardArTable,
  FinancialDashboardCashFlowTable,
  FinancialDashboardPagination,
  FinancialKpiCards,
  FinancialReceivablePayableSummary,
  FinancialAdvancedIndicators,
  ArDueAlertsCard,
} from '@/components/financial/dashboard';
import type {
  FinancialDashboardApRow,
  FinancialDashboardArRow,
  FinancialDashboardCfRow,
} from '@/components/financial/dashboard/financialDashboardTypes';

const PAGE_SIZE = 10;

type ReceivableTotals = { open: number; overdue: number; received: number };

function FinanceiroDashboard() {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const {
    groupOrgIds,
    effectiveOrgIds,
    scopeSelection,
    setScopeSelection,
    showGroupFilter,
    orgLabel,
  } = useFinancialOrgScope();
  const {
    items: arDueItems,
    loading: arDueLoading,
    markRead: arMarkRead,
    setInNegotiation: arSetNegotiation,
    refresh: arDueRefresh,
    canShow: canShowArDue,
  } = useArDueAlertsPanel();
  const {
    getFinancialKPIs,
    getReceivableTotals,
    getAccountsReceivable,
    getAccountsPayable,
    getCashFlow,
    syncAndGetDueWindowSummary,
  } = useFinancial();

  const [busy, setBusy] = useState(false);
  const [kpis, setKpis] = useState<FinancialKpis | null>(null);
  const [receivableTotals, setReceivableTotals] = useState<ReceivableTotals>({
    open: 0,
    overdue: 0,
    received: 0,
  });
  const [arPage, setArPage] = useState(1);
  const [apPage, setApPage] = useState(1);
  const [cfPage, setCfPage] = useState(1);
  const [arRows, setArRows] = useState<FinancialDashboardArRow[]>([]);
  const [apRows, setApRows] = useState<FinancialDashboardApRow[]>([]);
  const [cfRows, setCfRows] = useState<FinancialDashboardCfRow[]>([]);
  const [arCount, setArCount] = useState(0);
  const [apCount, setApCount] = useState(0);
  const [cfCount, setCfCount] = useState(0);
  const [arTotalPages, setArTotalPages] = useState(1);
  const [apTotalPages, setApTotalPages] = useState(1);
  const [cfTotalPages, setCfTotalPages] = useState(1);
  const [dueSummary, setDueSummary] = useState<DueWindowSummary | null>(null);

  const loadFinancialData = useCallback(async () => {
    setBusy(true);
    try {
      const [kpisData, totals, receivablesRes, payablesRes, cashFlowRes, due] = await Promise.all([
        getFinancialKPIs(effectiveOrgIds),
        getReceivableTotals(effectiveOrgIds),
        getAccountsReceivable(effectiveOrgIds, arPage, PAGE_SIZE),
        getAccountsPayable(effectiveOrgIds, apPage, PAGE_SIZE),
        getCashFlow(effectiveOrgIds, undefined, undefined, cfPage, PAGE_SIZE),
        syncAndGetDueWindowSummary(),
      ]);

      setKpis(kpisData);
      setReceivableTotals(totals);
      setDueSummary(due);
      setArRows((receivablesRes.data ?? []) as FinancialDashboardArRow[]);
      setArCount(receivablesRes.count ?? 0);
      setArTotalPages(receivablesRes.totalPages ?? 1);
      setApRows((payablesRes.data ?? []) as FinancialDashboardApRow[]);
      setApCount(payablesRes.count ?? 0);
      setApTotalPages(payablesRes.totalPages ?? 1);
      setCfRows((cashFlowRes.data ?? []) as FinancialDashboardCfRow[]);
      setCfCount(cashFlowRes.count ?? 0);
      setCfTotalPages(cashFlowRes.totalPages ?? 1);
    } finally {
      setBusy(false);
    }
  }, [
    arPage,
    apPage,
    cfPage,
    effectiveOrgIds,
    getAccountsPayable,
    getAccountsReceivable,
    getCashFlow,
    getFinancialKPIs,
    getReceivableTotals,
    syncAndGetDueWindowSummary,
  ]);

  useEffect(() => {
    void loadFinancialData();
  }, [loadFinancialData]);

  const handleArDueNegotiate = async (alertId: string) => {
    await arSetNegotiation(alertId);
    navigate('/contas-receber?dueAlerts=1');
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Dashboard financeiro</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Visão geral das finanças da empresa</p>
        </div>
        {showGroupFilter ? (
          <FinancialOrgScopeSelect
            groupOrgIds={groupOrgIds}
            scopeSelection={scopeSelection}
            onScopeChange={setScopeSelection}
            orgLabel={orgLabel}
            className="sm:mr-auto"
          />
        ) : null}
        <Button
          type="button"
          onClick={() => void Promise.all([loadFinancialData(), canShowArDue ? arDueRefresh() : Promise.resolve()])}
          disabled={busy}
          className="w-full sm:w-auto h-9 sm:h-10"
        >
          {busy ? 'Atualizando…' : 'Atualizar dados'}
        </Button>
      </div>

      {kpis && <FinancialKpiCards kpis={kpis} />}

      {effectiveOrgIds.length > 0 ? (
        <FinancialAdvancedIndicators orgIds={effectiveOrgIds} />
      ) : null}

      <FinancialDueAlertsCard summary={dueSummary} loading={busy && !dueSummary} />

      {canShowArDue ? (
        <ArDueAlertsCard
          items={arDueItems}
          loading={arDueLoading && arDueItems.length === 0}
          onMarkRead={arMarkRead}
          onNegotiate={handleArDueNegotiate}
        />
      ) : null}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex md:grid md:grid-cols-4 rounded-md">
          <TabsTrigger value="overview" className="text-xs sm:text-sm flex-shrink-0">
            Visão geral
          </TabsTrigger>
          <TabsTrigger value="receivables" className="text-xs sm:text-sm flex-shrink-0">
            A receber
          </TabsTrigger>
          <TabsTrigger value="payables" className="text-xs sm:text-sm flex-shrink-0">
            A pagar
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="text-xs sm:text-sm flex-shrink-0">
            Fluxo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {kpis && (
            <FinancialReceivablePayableSummary
              kpis={kpis}
              receivablePendingAmount={receivableTotals.open}
              receivableOverdueAmount={receivableTotals.overdue}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                Últimas movimentações (fluxo de caixa)
              </CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <FinancialDashboardCashFlowTable
                embedded
                rows={cfRows}
                loading={busy && cfRows.length === 0}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <FinancialDashboardArTable rows={arRows} loading={busy && arRows.length === 0} />
          <FinancialDashboardPagination
            page={arPage}
            totalPages={arTotalPages}
            count={arCount}
            pageSize={PAGE_SIZE}
            onPageChange={setArPage}
          />
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <FinancialDashboardApTable rows={apRows} loading={busy && apRows.length === 0} />
          <FinancialDashboardPagination
            page={apPage}
            totalPages={apTotalPages}
            count={apCount}
            pageSize={PAGE_SIZE}
            onPageChange={setApPage}
          />
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <FinancialDashboardCashFlowTable rows={cfRows} loading={busy && cfRows.length === 0} />
          <FinancialDashboardPagination
            page={cfPage}
            totalPages={cfTotalPages}
            count={cfCount}
            pageSize={PAGE_SIZE}
            onPageChange={setCfPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Financeiro() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] p-4 sm:p-6">
        <p className="text-sm sm:text-base text-muted-foreground text-center">
          Selecione uma organização para ver o dashboard financeiro.
        </p>
      </div>
    );
  }

  return <FinanceiroDashboard key={orgId} />;
}
