import { useEffect, useState } from 'react';
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
import { CostCenterSelect } from '@/components/financial/CostCenterSelect';
import { useOrganization } from '@/hooks/useOrganization';
import { FinancialReportService } from '@/services/financial/financialReportService';
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

export default function RelatoriosFinanceiros() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
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

  useEffect(() => {
    if (!orgId) return;
    void FinancialReportService.agingReceivables(orgId).then(setAging);
    void FinancialReportService.upcomingAlerts(orgId, 14).then(setAlerts);
  }, [orgId]);

  useEffect(() => {
    if (!orgId || tab !== 'curve') return;
    const h = Math.max(1, Math.min(365, Number(curveHorizon) || 90));
    void FinancialReportService.dueCurve(orgId, h, curveCc || null).then(setCurveData);
  }, [orgId, tab, curveHorizon, curveCc]);

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

  const chartRows =
    curveData?.series.map((r) => ({
      ...r,
      label: formatDateBR(r.date),
    })) ?? [];

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Relatórios financeiros</h1>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={exportCsv}>
            Exportar alertas CSV
          </Button>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 overflow-x-auto p-1">
            <TabsTrigger value="aging" className="flex-shrink-0 text-xs sm:text-sm">
              Aging AR
            </TabsTrigger>
            <TabsTrigger value="curve" className="flex-shrink-0 text-xs sm:text-sm">
              Curva vencimentos
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex-shrink-0 text-xs sm:text-sm">
              Alertas
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
                    orgId={orgId}
                    value={curveCc}
                    onValueChange={setCurveCc}
                    label="Centro de custo (opcional)"
                    id="curve-cc"
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
        </Tabs>
      </div>
    </FinancialPageShell>
  );
}
