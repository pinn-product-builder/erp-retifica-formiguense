import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { useOrganization } from '@/hooks/useOrganization';
import { FinancialReportService } from '@/services/financial/financialReportService';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';

export default function RelatoriosFinanceiros() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const [tab, setTab] = useState('aging');
  const [aging, setAging] = useState<{ label: string; amount: number; count: number }[]>([]);
  const [curve, setCurve] = useState<{ date: string; receivables: number; payables: number }[]>([]);
  const [alerts, setAlerts] = useState<{ type: string; due_date: string; amount: number; label: string }[]>([]);

  useEffect(() => {
    if (!orgId) return;
    void FinancialReportService.agingReceivables(orgId).then(setAging);
    void FinancialReportService.dueCurve(orgId, 60).then(setCurve);
    void FinancialReportService.upcomingAlerts(orgId, 14).then(setAlerts);
  }, [orgId]);

  const exportCsv = () => {
    const lines = [['tipo', 'vencimento', 'valor', 'nome'], ...alerts.map((a) => [a.type, a.due_date, String(a.amount), a.label])];
    const blob = new Blob([lines.map((r) => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alertas-financeiros.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <TabsContent value="curve" className="mt-4">
            <Card className="border p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">AR</TableHead>
                    <TableHead className="text-right">AP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {curve.map((c) => (
                    <TableRow key={c.date}>
                      <TableCell>{formatDateBR(c.date)}</TableCell>
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
