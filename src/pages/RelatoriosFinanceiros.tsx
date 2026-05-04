import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { FinancialOrgScopeSelect } from '@/components/financial/FinancialOrgScopeSelect';
import { CostCenterSelect } from '@/components/financial/CostCenterSelect';
import { useOrganization } from '@/hooks/useOrganization';
import { useFinancialOrgScope } from '@/hooks/useFinancialOrgScope';
import {
  FinancialReportService,
  type AgingBucket,
} from '@/services/financial/financialReportService';
import { MonthlyReportService } from '@/services/financial/monthlyReportService';
import { AccountsPayableService } from '@/services/financial/accountsPayableService';
import { AccountsReceivableService } from '@/services/financial/accountsReceivableService';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ResponsiveTable, type ResponsiveTableColumn } from '@/components/ui/responsive-table';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type CurveBundle = Awaited<ReturnType<typeof FinancialReportService.dueCurve>>;

function mergeAgingBuckets(parts: AgingBucket[][]): AgingBucket[] {
  const map = new Map<string, AgingBucket>();
  for (const list of parts) {
    for (const b of list) {
      const cur = map.get(b.label) ?? { label: b.label, amount: 0, count: 0 };
      cur.amount += b.amount;
      cur.count += b.count;
      map.set(b.label, cur);
    }
  }
  return Array.from(map.values());
}

function mergeDueCurves(parts: CurveBundle[]): CurveBundle | null {
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  const day = new Map<string, { receivables: number; payables: number }>();
  for (const p of parts) {
    for (const s of p.series) {
      const v = day.get(s.date) ?? { receivables: 0, payables: 0 };
      v.receivables += s.receivables;
      v.payables += s.payables;
      day.set(s.date, v);
    }
  }
  const series = [...day.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));
  const buck = new Map<string, { receivables: number; payables: number }>();
  for (const p of parts) {
    for (const b of p.buckets) {
      const v = buck.get(b.label) ?? { receivables: 0, payables: 0 };
      v.receivables += b.receivables;
      v.payables += b.payables;
      buck.set(b.label, v);
    }
  }
  const buckets = [...buck.entries()].map(([label, v]) => ({ label, ...v }));
  const overdue = parts.reduce(
    (acc, p) => ({
      receivables: acc.receivables + p.overdue.receivables,
      payables: acc.payables + p.overdue.payables,
    }),
    { receivables: 0, payables: 0 }
  );
  return { series, buckets, overdue };
}

export default function RelatoriosFinanceiros() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const {
    groupOrgIds,
    effectiveOrgIds,
    scopeSelection,
    setScopeSelection,
    showGroupFilter,
    isConsolidatedView,
    orgLabel,
  } = useFinancialOrgScope();
  const writeOrgId = effectiveOrgIds.length === 1 ? effectiveOrgIds[0] : '';
  const ccOrgId = writeOrgId || orgId;
  const [tab, setTab] = useState('aging');
  const [aging, setAging] = useState<{ label: string; amount: number; count: number }[]>([]);
  const [curveHorizon, setCurveHorizon] = useState('90');
  const [curveCc, setCurveCc] = useState('');
  const [curveData, setCurveData] = useState<{
    series: { date: string; receivables: number; payables: number }[];
    buckets: { label: string; receivables: number; payables: number }[];
    overdue: { receivables: number; payables: number };
  } | null>(null);
  const [alerts, setAlerts] = useState<{ type: string; due_date: string; amount: number; label: string }[]>([]);

  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reporting, setReporting] = useState(false);
  const [reportHistory, setReportHistory] = useState<Database['public']['Tables']['monthly_financial_reports']['Row'][]>(
    []
  );

  const [apPage, setApPage] = useState(1);
  const [apSearch, setApSearch] = useState('');
  const [apStatus, setApStatus] = useState<string>('');
  const [apDueFrom, setApDueFrom] = useState('');
  const [apDueTo, setApDueTo] = useState('');
  const [apData, setApData] = useState<{
    data: (Database['public']['Tables']['accounts_payable']['Row'] & Record<string, unknown>)[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const [arPage, setArPage] = useState(1);
  const [arSearch, setArSearch] = useState('');
  const [arStatus, setArStatus] = useState<string>('');
  const [arDueFrom, setArDueFrom] = useState('');
  const [arDueTo, setArDueTo] = useState('');
  const [arData, setArData] = useState<{
    data: (Database['public']['Tables']['accounts_receivable']['Row'] & Record<string, unknown>)[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  useEffect(() => {
    if (isConsolidatedView) setCurveCc('');
  }, [isConsolidatedView]);

  useEffect(() => {
    if (effectiveOrgIds.length === 0) return;
    void (async () => {
      const agingParts = await Promise.all(
        effectiveOrgIds.map((id) => FinancialReportService.agingReceivables(id))
      );
      setAging(mergeAgingBuckets(agingParts));
      const alertParts = await Promise.all(
        effectiveOrgIds.map((id) => FinancialReportService.upcomingAlerts(id, 14))
      );
      setAlerts(alertParts.flat().sort((a, b) => a.due_date.localeCompare(b.due_date)));
      const histParts = await Promise.all(
        effectiveOrgIds.map((id) => MonthlyReportService.listByOrg(id, 24))
      );
      const mergedHist = histParts
        .flat()
        .sort(
          (a, b) =>
            new Date(b.generated_at ?? 0).getTime() - new Date(a.generated_at ?? 0).getTime()
        )
        .slice(0, 24);
      setReportHistory(mergedHist);
    })();
  }, [effectiveOrgIds]);

  useEffect(() => {
    if (effectiveOrgIds.length === 0 || tab !== 'curve') return;
    const h = Math.max(1, Math.min(365, Number(curveHorizon) || 90));
    void (async () => {
      const parts = await Promise.all(
        effectiveOrgIds.map((id) => FinancialReportService.dueCurve(id, h, curveCc || null))
      );
      setCurveData(mergeDueCurves(parts));
    })();
  }, [effectiveOrgIds, tab, curveHorizon, curveCc]);

  useEffect(() => {
    if (effectiveOrgIds.length === 0 || tab !== 'ap-ar') return;
    const pageSize = 10;
    void (async () => {
      const ap = await AccountsPayableService.listPaginated(effectiveOrgIds, apPage, pageSize, {
        search: apSearch || undefined,
        status: (apStatus as Database['public']['Enums']['payment_status']) || undefined,
        dueFrom: apDueFrom || undefined,
        dueTo: apDueTo || undefined,
      });
      setApData(ap);
    })();
  }, [effectiveOrgIds, tab, apPage, apSearch, apStatus, apDueFrom, apDueTo]);

  useEffect(() => {
    if (effectiveOrgIds.length === 0 || tab !== 'ap-ar') return;
    const pageSize = 10;
    void (async () => {
      const ar = await AccountsReceivableService.listPaginated(effectiveOrgIds, arPage, pageSize, {
        search: arSearch || undefined,
        status: (arStatus as Database['public']['Enums']['payment_status']) || undefined,
        dueFrom: arDueFrom || undefined,
        dueTo: arDueTo || undefined,
      });
      setArData(ar);
    })();
  }, [effectiveOrgIds, tab, arPage, arSearch, arStatus, arDueFrom, arDueTo]);

  const exportCsv = () => {
    const lines = [
      ['tipo', 'vencimento', 'valor', 'nome'],
      ...alerts.map((a) => [a.type, a.due_date, String(a.amount), a.label]),
    ];
    const blob = new Blob([lines.map((r) => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alertas-financeiros.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportApCsv = () => {
    const rows = apData?.data ?? [];
    const lines = [
      ['fornecedor', 'descricao', 'vencimento', 'valor', 'status'],
      ...rows.map((r) => [
        String(r.supplier_name ?? ''),
        String(r.description ?? ''),
        String(r.due_date ?? ''),
        String(r.amount ?? ''),
        String(r.status ?? ''),
      ]),
    ];
    const blob = new Blob([lines.map((r) => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-ap.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportArCsv = () => {
    const rows = arData?.data ?? [];
    const lines = [
      ['cliente', 'nota', 'vencimento', 'valor', 'status'],
      ...rows.map((r) => [
        String((r.customers as { name?: string } | null)?.name ?? ''),
        String(r.invoice_number ?? ''),
        String(r.due_date ?? ''),
        String(r.amount ?? ''),
        String(r.status ?? ''),
      ]),
    ];
    const blob = new Blob([lines.map((r) => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-ar.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateMonthly = async () => {
    const targetOrg = writeOrgId || orgId;
    if (!targetOrg) return;
    if (isConsolidatedView) {
      toast.error('Escolha uma única empresa no seletor para gerar o relatório mensal.');
      return;
    }
    const m = Math.max(1, Math.min(12, Number(reportMonth) || 0));
    const y = Number(reportYear) || new Date().getFullYear();
    setReporting(true);
    try {
      const payload = await MonthlyReportService.buildPayload(targetOrg, m, y);
      MonthlyReportService.downloadTextReport(payload);
      const { error } = await MonthlyReportService.createRecord({
        orgId: targetOrg,
        month: m,
        year: y,
        generatedBy: null,
        pdfUrl: null,
        excelUrl: null,
      });
      if (error) throw error;
      toast.success('Relatório gerado e registrado');
      const hist = await MonthlyReportService.listByOrg(targetOrg, 24);
      setReportHistory(hist);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao gerar relatório');
    } finally {
      setReporting(false);
    }
  };

  const chartRows =
    curveData?.series.map((r) => ({
      ...r,
      label: formatDateBR(r.date),
    })) ?? [];

  const apColumns: ResponsiveTableColumn<(Database['public']['Tables']['accounts_payable']['Row'] & Record<string, unknown>)>[] =
    useMemo(
      () => [
        ...(isConsolidatedView
          ? [
              {
                key: 'org',
                header: 'Empresa',
                priority: 0,
                minWidth: 120,
                render: (r: Database['public']['Tables']['accounts_payable']['Row'] & Record<string, unknown>) => (
                  <span className="text-xs sm:text-sm">{orgLabel(String(r.org_id ?? ''))}</span>
                ),
              } satisfies ResponsiveTableColumn<
                Database['public']['Tables']['accounts_payable']['Row'] & Record<string, unknown>
              >,
            ]
          : []),
        {
          key: 'supplier',
          header: 'Fornecedor',
          priority: 1,
          minWidth: 150,
          render: (r) => <span className="text-xs sm:text-sm font-medium">{String(r.supplier_name ?? '—')}</span>,
        },
        {
          key: 'desc',
          header: 'Descrição',
          priority: 2,
          minWidth: 180,
          render: (r) => <span className="text-xs sm:text-sm truncate">{String(r.description ?? '—')}</span>,
        },
        {
          key: 'due',
          header: 'Vencimento',
          priority: 3,
          minWidth: 120,
          render: (r) => <span className="text-xs sm:text-sm whitespace-nowrap">{formatDateBR(String(r.due_date))}</span>,
        },
        {
          key: 'amount',
          header: 'Valor',
          priority: 4,
          minWidth: 120,
          render: (r) => <span className="text-xs sm:text-sm whitespace-nowrap">{formatBRL(Number(r.amount))}</span>,
        },
        {
          key: 'status',
          header: 'Status',
          priority: 5,
          minWidth: 110,
          render: (r) => <span className="text-xs sm:text-sm">{String(r.status ?? '—')}</span>,
        },
      ],
      [isConsolidatedView, orgLabel]
    );

  const arColumns: ResponsiveTableColumn<(Database['public']['Tables']['accounts_receivable']['Row'] & Record<string, unknown>)>[] =
    useMemo(
      () => [
        ...(isConsolidatedView
          ? [
              {
                key: 'org',
                header: 'Empresa',
                priority: 0,
                minWidth: 120,
                render: (r: Database['public']['Tables']['accounts_receivable']['Row'] & Record<string, unknown>) => (
                  <span className="text-xs sm:text-sm">{orgLabel(String(r.org_id ?? ''))}</span>
                ),
              } satisfies ResponsiveTableColumn<
                Database['public']['Tables']['accounts_receivable']['Row'] & Record<string, unknown>
              >,
            ]
          : []),
        {
          key: 'customer',
          header: 'Cliente',
          priority: 1,
          minWidth: 150,
          render: (r) => (
            <span className="text-xs sm:text-sm font-medium">
              {String((r.customers as { name?: string } | null)?.name ?? '—')}
            </span>
          ),
        },
        {
          key: 'inv',
          header: 'Nota',
          priority: 2,
          minWidth: 100,
          render: (r) => <span className="text-xs sm:text-sm">{String(r.invoice_number ?? '—')}</span>,
        },
        {
          key: 'due',
          header: 'Vencimento',
          priority: 3,
          minWidth: 120,
          render: (r) => <span className="text-xs sm:text-sm whitespace-nowrap">{formatDateBR(String(r.due_date))}</span>,
        },
        {
          key: 'amount',
          header: 'Valor',
          priority: 4,
          minWidth: 120,
          render: (r) => <span className="text-xs sm:text-sm whitespace-nowrap">{formatBRL(Number(r.amount))}</span>,
        },
        {
          key: 'status',
          header: 'Status',
          priority: 5,
          minWidth: 110,
          render: (r) => <span className="text-xs sm:text-sm">{String(r.status ?? '—')}</span>,
        },
      ],
      [isConsolidatedView, orgLabel]
    );

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Relatórios financeiros</h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto min-w-0">
            {showGroupFilter ? (
              <FinancialOrgScopeSelect
                groupOrgIds={groupOrgIds}
                scopeSelection={scopeSelection}
                onScopeChange={setScopeSelection}
                orgLabel={orgLabel}
              />
            ) : null}
            <Button variant="outline" size="sm" className="w-full sm:w-auto shrink-0" onClick={exportCsv}>
              Exportar alertas CSV
            </Button>
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 overflow-x-auto p-1">
            <TabsTrigger value="aging" className="flex-shrink-0 text-xs sm:text-sm">
              Vencimentos a receber
            </TabsTrigger>
            <TabsTrigger value="curve" className="flex-shrink-0 text-xs sm:text-sm">
              Curva vencimentos
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex-shrink-0 text-xs sm:text-sm">
              Alertas
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex-shrink-0 text-xs sm:text-sm">
              Reunião mensal
            </TabsTrigger>
            <TabsTrigger value="ap-ar" className="flex-shrink-0 text-xs sm:text-sm">
              AP/AR filtráveis
            </TabsTrigger>
          </TabsList>
          <TabsContent value="aging" className="mt-4">
            <Card className="border p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faixa</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Qtde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aging.map((b) => (
                    <TableRow key={b.label}>
                      <TableCell>{b.label} dias</TableCell>
                      <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                        {formatBRL(b.amount)}
                      </TableCell>
                      <TableCell className="text-right">{b.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          <TabsContent value="curve" className="mt-4 space-y-4">
            <Card className="border p-3 sm:p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="curve-horizon">Janela (dias à frente)</Label>
                  <Input
                    id="curve-horizon"
                    inputMode="numeric"
                    value={curveHorizon}
                    onChange={(e) => setCurveHorizon(e.target.value)}
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <CostCenterSelect
                    orgId={ccOrgId}
                    value={curveCc}
                    onValueChange={setCurveCc}
                    label="Centro de custo (opcional)"
                    id="curve-cc"
                    disabled={isConsolidatedView}
                  />
                </div>
              </div>
              {curveData && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <p className="text-muted-foreground">
                      Vencidos (até hoje): AR {formatBRL(curveData.overdue.receivables)} · AP{' '}
                      {formatBRL(curveData.overdue.payables)}
                    </p>
                  </div>
                  <div className="h-[260px] sm:h-[320px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatBRL(Number(v))} width={72} />
                        <Tooltip formatter={(v: number) => formatBRL(v)} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="receivables" name="A receber" stroke="#16a34a" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="payables" name="A pagar" stroke="#dc2626" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Faixa (dias até venc.)</TableHead>
                          <TableHead className="text-right">AR</TableHead>
                          <TableHead className="text-right">AP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {curveData.buckets.map((b) => (
                          <TableRow key={b.label}>
                            <TableCell className="text-xs sm:text-sm">{b.label}</TableCell>
                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                              {formatBRL(b.receivables)}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                              {formatBRL(b.payables)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="overflow-x-auto rounded-md border max-h-[min(50vh,360px)]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data venc.</TableHead>
                          <TableHead className="text-right">AR</TableHead>
                          <TableHead className="text-right">AP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {curveData.series.map((c) => (
                          <TableRow key={c.date}>
                            <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                              {formatDateBR(c.date)}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                              {formatBRL(c.receivables)}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                              {formatBRL(c.payables)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="alerts" className="mt-4">
            <Card className="border p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a) => (
                    <TableRow key={`${a.type}-${a.due_date}-${a.label}`}>
                      <TableCell>{a.type === 'ar' ? 'Receber' : 'Pagar'}</TableCell>
                      <TableCell>{a.label}</TableCell>
                      <TableCell>{formatDateBR(a.due_date)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                        {formatBRL(a.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="mt-4 space-y-4">
            <Card className="border p-3 sm:p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rep-month">Mês</Label>
                  <Input
                    id="rep-month"
                    inputMode="numeric"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rep-year">Ano</Label>
                  <Input
                    id="rep-year"
                    inputMode="numeric"
                    value={reportYear}
                    onChange={(e) => setReportYear(e.target.value)}
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="flex items-end sm:col-span-2">
                  <Button className="w-full" disabled={!orgId || reporting} onClick={() => void generateMonthly()}>
                    {reporting ? 'Gerando…' : 'Gerar relatório'}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="border p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês/ano</TableHead>
                    <TableHead>Gerado em</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportHistory.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                        {String(r.month).padStart(2, '0')}/{r.year}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                        {formatDateBR(String(r.generated_at).slice(0, 10))}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {r.pdf_url ? (
                          <a href={r.pdf_url} target="_blank" rel="noreferrer" className="underline">
                            Abrir
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {reportHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground text-xs sm:text-sm">
                        Nenhum relatório gerado ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="ap-ar" className="mt-4 space-y-6">
            <Card className="border p-3 sm:p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm sm:text-base font-medium">Contas a pagar (AP)</p>
                <Button variant="outline" size="sm" onClick={exportApCsv}>
                  Exportar CSV
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label>Busca</Label>
                  <Input value={apSearch} onChange={(e) => setApSearch(e.target.value)} className="h-9 sm:h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input value={apStatus} onChange={(e) => setApStatus(e.target.value)} placeholder="pending/paid/overdue" className="h-9 sm:h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Venc. de</Label>
                  <Input type="date" value={apDueFrom} onChange={(e) => setApDueFrom(e.target.value)} className="h-9 sm:h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Venc. até</Label>
                  <Input type="date" value={apDueTo} onChange={(e) => setApDueTo(e.target.value)} className="h-9 sm:h-10" />
                </div>
              </div>
              <ResponsiveTable data={apData?.data ?? []} columns={apColumns} keyExtractor={(r) => String(r.id)} emptyMessage="Sem resultados." />
              {apData && apData.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setApPage((p) => Math.max(1, p - 1)); }} />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>
                        {apData.page}/{apData.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setApPage((p) => Math.min(apData.totalPages, p + 1)); }} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </Card>

            <Card className="border p-3 sm:p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm sm:text-base font-medium">Contas a receber (AR)</p>
                <Button variant="outline" size="sm" onClick={exportArCsv}>
                  Exportar CSV
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label>Busca</Label>
                  <Input value={arSearch} onChange={(e) => setArSearch(e.target.value)} className="h-9 sm:h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input value={arStatus} onChange={(e) => setArStatus(e.target.value)} placeholder="pending/paid/overdue" className="h-9 sm:h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Venc. de</Label>
                  <Input type="date" value={arDueFrom} onChange={(e) => setArDueFrom(e.target.value)} className="h-9 sm:h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Venc. até</Label>
                  <Input type="date" value={arDueTo} onChange={(e) => setArDueTo(e.target.value)} className="h-9 sm:h-10" />
                </div>
              </div>
              <ResponsiveTable data={arData?.data ?? []} columns={arColumns} keyExtractor={(r) => String(r.id)} emptyMessage="Sem resultados." />
              {arData && arData.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setArPage((p) => Math.max(1, p - 1)); }} />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>
                        {arData.page}/{arData.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setArPage((p) => Math.min(arData.totalPages, p + 1)); }} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FinancialPageShell>
  );
}
