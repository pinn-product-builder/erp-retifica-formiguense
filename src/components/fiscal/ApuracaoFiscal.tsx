import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFiscal } from '@/hooks/useFiscal';
import { formatCurrency } from '@/lib/utils';
import { Calendar, Lock, Unlock, Download, Calculator, TrendingUp } from 'lucide-react';

export function ApuracaoFiscal() {
  const {
    loading,
    getTaxCalculationsSummary,
    getTaxLedgers,
    closeTaxPeriod,
    reopenTaxPeriod,
    exportTaxCalculationsCSV,
    getTaxCalculationsWithSummary
  } = useFiscal();

  const [selectedPeriod, setSelectedPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  
  const [summary, setSummary] = useState<unknown>(null);
  const [ledgers, setLedgers] = useState<Array<Record<string, unknown>>>([]);

  const loadPeriodData = async () => {
    const [summaryData, ledgersData] = await Promise.all([
      getTaxCalculationsSummary(selectedPeriod),
      getTaxLedgers(selectedPeriod)
    ]);
    
    setSummary(summaryData);
    setLedgers(ledgersData);
  };

  useEffect(() => {
    loadPeriodData();
  }, [selectedPeriod]);

  const handleClosePeriod = async () => {
    const success = await closeTaxPeriod(selectedPeriod);
    if (success) {
      loadPeriodData();
    }
  };

  const handleReopenPeriod = async () => {
    const success = await reopenTaxPeriod(selectedPeriod);
    if (success) {
      loadPeriodData();
    }
  };

  const handleExportCalculations = async () => {
    const calculations = await getTaxCalculationsWithSummary(selectedPeriod);
    exportTaxCalculationsCSV(calculations);
  };

  const isPeriodClosed = ledgers.some(ledger => ledger.status === 'fechado');
  const months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seleção do Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Mês</label>
              <Select
                value={selectedPeriod.month.toString()}
                onValueChange={(value) => setSelectedPeriod({ ...selectedPeriod, month: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Ano</label>
              <Select
                value={selectedPeriod.year.toString()}
                onValueChange={(value) => setSelectedPeriod({ ...selectedPeriod, year: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant={isPeriodClosed ? "destructive" : "default"}>
              {isPeriodClosed ? "Fechado" : "Aberto"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Period Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Operações</p>
                  <p className="text-2xl font-bold">{(summary as { totalOperations: number }).totalOperations}</p>
                </div>
                <Calculator className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Base Total</p>
                  <p className="text-2xl font-bold">{formatCurrency((summary as { totalAmount: number }).totalAmount)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Impostos</p>
                  <p className="text-2xl font-bold">{formatCurrency((summary as { totalTaxes: number }).totalTaxes)}</p>
                </div>
                <Calculator className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Carga Tributária</p>
                  <p className="text-2xl font-bold">
                    {((summary as { totalAmount: number }).totalAmount > 0 ? (((summary as { totalTaxes: number }).totalTaxes / (summary as { totalAmount: number }).totalAmount) * 100).toFixed(1) : '0.0')}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tax Breakdown */}
      {summary && (summary as { taxBreakdown?: Record<string, unknown> }).taxBreakdown && Object.keys((summary as { taxBreakdown: Record<string, unknown> }).taxBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Tipo de Imposto</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Imposto</TableHead>
                  <TableHead className="text-right">Operações</TableHead>
                  <TableHead className="text-right">Total Arrecadado</TableHead>
                  <TableHead className="text-right">Valor Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries((summary as { taxBreakdown: Record<string, { operations: number; total: number }> }).taxBreakdown).map(([taxType, data]) => (
                  <TableRow key={taxType}>
                    <TableCell className="font-medium">{taxType}</TableCell>
                    <TableCell className="text-right">{data.operations}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.total)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.total / data.operations)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={handleExportCalculations} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Cálculos (CSV)
            </Button>
            
            {isPeriodClosed ? (
              <Button onClick={handleReopenPeriod} variant="outline">
                <Unlock className="h-4 w-4 mr-2" />
                Reabrir Período
              </Button>
            ) : (
              <Button onClick={handleClosePeriod} variant="default">
                <Lock className="h-4 w-4 mr-2" />
                Fechar Período
              </Button>
            )}
          </div>

          {isPeriodClosed && (
            <Alert className="mt-4">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Este período está fechado. Os livros fiscais foram consolidados e não podem ser alterados.
                Para fazer modificações, reabra o período primeiro.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Ledgers Table */}
      {ledgers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Livros Fiscais do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Imposto</TableHead>
                  <TableHead>Regime</TableHead>
                  <TableHead className="text-right">Débitos</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead className="text-right">Saldo Devedor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgers.map((ledger) => {
                  const l = ledger as { id: string; tax_types?: { name: string }; tax_regimes?: { name: string }; total_debits: number; total_credits: number; balance_due: number; status: string };
                  return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.tax_types?.name}</TableCell>
                    <TableCell>{l.tax_regimes?.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(l.total_debits)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(l.total_credits)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(l.balance_due)}</TableCell>
                    <TableCell>
                      <Badge variant={l.status === 'fechado' ? 'destructive' : 'default'}>
                        {l.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {summary && (summary as { totalOperations: number }).totalOperations === 0 && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            Nenhuma operação fiscal encontrada para o período selecionado.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}