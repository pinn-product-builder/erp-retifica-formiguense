
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DreCategorizedService } from '@/services/financial/dreCategorizedService';
import { DreExportService } from '@/services/financial/dreExportService';
import { 
  Calculator, TrendingUp, TrendingDown, DollarSign, 
  BarChart3, Calendar, FileText, Download
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useFinancialOrgScope } from '@/hooks/useFinancialOrgScope';
import { FinancialOrgScopeSelect } from '@/components/financial/FinancialOrgScopeSelect';
import { CostCenterSelect } from '@/components/financial/CostCenterSelect';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { DreCategorizedMonth } from '@/services/financial/dreCategorizedService';

export default function DRE() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const {
    groupOrgIds,
    effectiveOrgIds,
    scopeSelection,
    setScopeSelection,
    showGroupFilter,
    isConsolidatedView,
    orgLabel,
  } = useFinancialOrgScope();
  const singleOrgId = effectiveOrgIds.length === 1 ? effectiveOrgIds[0] : null;
  const [loading, setLoading] = useState(false);
  
  const [dreData, setDreData] = useState<Record<string, unknown>[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState<unknown>(null);
  const [compareTriplet, setCompareTriplet] = useState<{
    current: DreCategorizedMonth;
    prevMonth: DreCategorizedMonth;
    prevYearSame: DreCategorizedMonth;
  } | null>(null);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [dreCostCenterFilter, setDreCostCenterFilter] = useState('');

  useEffect(() => {
    if (isConsolidatedView) setDreCostCenterFilter('');
  }, [isConsolidatedView]);

  useEffect(() => {
    if (effectiveOrgIds.length === 0) return;
    void loadDREData();
  }, [selectedYear, effectiveOrgIds, dreCostCenterFilter]);

  useEffect(() => {
    if (effectiveOrgIds.length === 0) return;
    void loadMonthlyData();
  }, [selectedMonth, selectedYear, effectiveOrgIds, dreCostCenterFilter]);

  useEffect(() => {
    if (effectiveOrgIds.length === 0) return;
    void DreCategorizedService.compareThreeMonths(
      effectiveOrgIds,
      selectedYear,
      selectedMonth,
      dreCostCenterFilter || null
    ).then(setCompareTriplet);
  }, [effectiveOrgIds, selectedYear, selectedMonth, dreCostCenterFilter]);

  const persistMonthlySnapshot = async () => {
    if (!singleOrgId || dreCostCenterFilter || isConsolidatedView) return;
    setSavingSnapshot(true);
    try {
      const { error } = await DreCategorizedService.persistMonthSnapshot(
        singleOrgId,
        selectedYear,
        selectedMonth
      );
      if (error) toast.error(error.message);
      else toast.success('Valores do mês gravados em monthly_dre');
    } finally {
      setSavingSnapshot(false);
    }
  };

  const loadDREData = async () => {
    if (effectiveOrgIds.length === 0) return;
    setLoading(true);
    try {
      const rows = await DreCategorizedService.computeYear(
        effectiveOrgIds,
        selectedYear,
        dreCostCenterFilter || null
      );
      setDreData(rows as unknown as Record<string, unknown>[]);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    if (effectiveOrgIds.length === 0) return;
    setLoading(true);
    try {
      const m = await DreCategorizedService.computeMonthForScope(
        effectiveOrgIds,
        selectedYear,
        selectedMonth,
        dreCostCenterFilter || null
      );
      setMonthlyData(m);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const yearlyTotals = dreData.reduce((acc: Record<string, unknown>, month: Record<string, unknown>) => ({
    revenue: acc.revenue as number + Number((month.total_revenue as number) || 0),
    directCosts: acc.directCosts as number + Number((month.direct_costs as number) || 0),
    operationalExpenses: acc.operationalExpenses as number + Number((month.operational_expenses as number) || 0),
    grossProfit: acc.grossProfit as number + Number((month.gross_profit as number) || 0),
    netProfit: acc.netProfit as number + Number((month.net_profit as number) || 0)
  }), { revenue: 0, directCosts: 0, operationalExpenses: 0, grossProfit: 0, netProfit: 0 });

  const yearlyProfitMargin = yearlyTotals.revenue as number > 0 ? ((yearlyTotals.netProfit as number / (yearlyTotals.revenue as number)) * 100) : 0;

  const exportMonthlyCsv = () => {
    if (!monthlyData) return;
    const m = monthlyData as Record<string, unknown>;
    const rows: (string | number)[][] = [
      ['Receita bruta', Number(m.total_revenue ?? 0)],
      ['(-) Custos dos serviços', Number(m.direct_costs ?? 0)],
      ['(-) Obrigações fiscais', Number(m.tax_expenses ?? 0)],
      ['= Lucro bruto', Number(m.gross_profit ?? 0)],
      ['(-) Despesas operacionais', Number(m.operational_expenses ?? 0)],
      ['(-) Retiradas de sócios', Number(m.partner_withdrawals ?? 0)],
      ['= Lucro líquido', Number(m.net_profit ?? 0)],
      ['Margem líquida %', Number(m.profit_margin ?? 0)],
    ];
    DreExportService.downloadCsv(
      `DRE_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`,
      ['Descrição', 'Valor'],
      rows
    );
  };

  const exportYearlyCsv = () => {
    const headers = ['Mês', 'Receita', 'Custos diretos', 'Desp. operacionais', 'Lucro bruto', 'Lucro líquido', 'Margem %'];
    const rows = dreData.map((month) => {
      const mo = month as Record<string, unknown>;
      return [
        getMonthName(Number(mo.month)),
        Number(mo.total_revenue ?? 0),
        Number(mo.direct_costs ?? 0),
        Number(mo.operational_expenses ?? 0),
        Number(mo.gross_profit ?? 0),
        Number(mo.net_profit ?? 0),
        Number(mo.profit_margin ?? 0),
      ];
    });
    DreExportService.downloadCsv(`DRE_anual_${selectedYear}.csv`, headers, rows);
  };

  const exportMonthlyPdf = () => {
    if (!monthlyData) return;
    const m = monthlyData as Record<string, unknown>;
    const fmt = (n: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
    const html = `<h1>DRE — ${getMonthName(selectedMonth)} / ${selectedYear}</h1>
      <table><thead><tr><th>Descrição</th><th class="num">Valor</th></tr></thead><tbody>
      <tr><td>Receita bruta</td><td class="num">${fmt(Number(m.total_revenue ?? 0))}</td></tr>
      <tr><td>(-) Custos dos serviços</td><td class="num">${fmt(Number(m.direct_costs ?? 0))}</td></tr>
      <tr><td>(-) Obrigações fiscais</td><td class="num">${fmt(Number(m.tax_expenses ?? 0))}</td></tr>
      <tr><td>= Lucro bruto</td><td class="num">${fmt(Number(m.gross_profit ?? 0))}</td></tr>
      <tr><td>(-) Despesas operacionais</td><td class="num">${fmt(Number(m.operational_expenses ?? 0))}</td></tr>
      <tr><td>(-) Retiradas de sócios</td><td class="num">${fmt(Number(m.partner_withdrawals ?? 0))}</td></tr>
      <tr><td>= Lucro líquido</td><td class="num">${fmt(Number(m.net_profit ?? 0))}</td></tr>
      <tr><td>Margem líquida</td><td class="num">${formatPercentage(Number(m.profit_margin ?? 0))}</td></tr>
      </tbody></table>`;
    DreExportService.openPrintableHtml(`DRE ${selectedMonth}/${selectedYear}`, html);
  };

  const exportYearlyPdf = () => {
    const fmt = (n: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
    const body = dreData
      .map((month) => {
        const mo = month as Record<string, unknown>;
        return `<tr>
          <td>${getMonthName(Number(mo.month))}</td>
          <td class="num">${fmt(Number(mo.total_revenue ?? 0))}</td>
          <td class="num">${fmt(Number(mo.net_profit ?? 0))}</td>
          <td class="num">${formatPercentage(Number(mo.profit_margin ?? 0))}</td>
        </tr>`;
      })
      .join('');
    const html = `<h1>DRE anual ${selectedYear}</h1>
      <table><thead><tr><th>Mês</th><th class="num">Receita</th><th class="num">Lucro líq.</th><th class="num">Margem</th></tr></thead><tbody>${body}</tbody></table>`;
    DreExportService.openPrintableHtml(`DRE anual ${selectedYear}`, html);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">DRE - Demonstrativo de Resultado</h1>
          <p className="text-muted-foreground">Análise de receitas, custos e rentabilidade</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto min-w-0">
          {showGroupFilter ? (
            <FinancialOrgScopeSelect
              groupOrgIds={groupOrgIds}
              scopeSelection={scopeSelection}
              onScopeChange={setScopeSelection}
              orgLabel={orgLabel}
            />
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto" disabled={loading}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={exportMonthlyCsv}>Excel (CSV) — mês atual</DropdownMenuItem>
              <DropdownMenuItem onClick={exportYearlyCsv}>Excel (CSV) — evolução anual</DropdownMenuItem>
              <DropdownMenuItem onClick={exportMonthlyPdf}>PDF (imprimir) — mês atual</DropdownMenuItem>
              <DropdownMenuItem onClick={exportYearlyPdf}>PDF (imprimir) — anual</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Seletores de Período */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="text-sm font-medium">Ano:</label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Mês:</label>
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {getMonthName(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {singleOrgId && (
          <div className="w-full sm:w-auto sm:min-w-[220px]">
            <CostCenterSelect
              orgId={singleOrgId}
              value={dreCostCenterFilter}
              onValueChange={setDreCostCenterFilter}
              label="Centro de custo (DRE)"
              id="dre-cc-filter"
              disabled={isConsolidatedView}
            />
          </div>
        )}
      </div>
      {dreCostCenterFilter ? (
        <p className="text-xs sm:text-sm text-muted-foreground">
          Visão filtrada por centro de custo: retiradas de sócios não são alocadas e aparecem como zero neste filtro.
        </p>
      ) : null}

      {compareTriplet && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Comparativo de três períodos (lucro líquido)
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                savingSnapshot ||
                !singleOrgId ||
                !!dreCostCenterFilter ||
                isConsolidatedView
              }
              onClick={() => void persistMonthlySnapshot()}
            >
              {savingSnapshot ? 'Gravando…' : 'Gravar snapshot no banco'}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mês atual ({getMonthName(selectedMonth)} {selectedYear})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(compareTriplet.current.net_profit)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Margem {formatPercentage(compareTriplet.current.profit_margin)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mês anterior</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(compareTriplet.prevMonth.net_profit)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Margem {formatPercentage(compareTriplet.prevMonth.profit_margin)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mesmo mês ({getMonthName(selectedMonth)} {selectedYear - 1})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(compareTriplet.prevYearSame.net_profit)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Margem {formatPercentage(compareTriplet.prevYearSame.profit_margin)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* KPIs Anuais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Anual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(yearlyTotals.revenue as number)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(yearlyTotals.directCosts as number + (yearlyTotals.operationalExpenses as number))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${yearlyTotals.netProfit as number >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(yearlyTotals.netProfit as number)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Líquida</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${yearlyProfitMargin >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatPercentage(yearlyProfitMargin)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* DRE Mensal Detalhado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              DRE - {getMonthName(selectedMonth)} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                    <span className="font-medium">Receita Bruta</span>
                    <span className="font-bold text-success">
                      {formatCurrency((monthlyData as Record<string, unknown>).total_revenue as number)}
                    </span>
                  </div>
                  
                  <div className="pl-4 space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>(-) Custos dos serviços</span>
                      <span className="text-destructive">
                        {formatCurrency((monthlyData as Record<string, unknown>).direct_costs as number)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>(-) Obrigações fiscais</span>
                      <span className="text-destructive">
                        {formatCurrency((monthlyData as Record<string, unknown>).tax_expenses as number)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">= Lucro Bruto</span>
                    <span className={`font-bold ${((monthlyData as Record<string, unknown>).gross_profit as number) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency((monthlyData as Record<string, unknown>).gross_profit as number)}
                    </span>
                  </div>
                  
                  <div className="pl-4 space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>(-) Despesas administrativas</span>
                      <span className="text-destructive">
                        {formatCurrency((monthlyData as Record<string, unknown>).operational_expenses as number)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>(-) Retiradas de sócios</span>
                      <span className="text-destructive">
                        {formatCurrency((monthlyData as Record<string, unknown>).partner_withdrawals as number)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="font-medium">= Lucro Líquido</span>
                    <span className={`font-bold ${((monthlyData as Record<string, unknown>).net_profit as number) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency((monthlyData as Record<string, unknown>).net_profit as number)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 border-t">
                    <span className="text-sm font-medium">Margem Líquida</span>
                    <span className={`text-sm font-bold ${((monthlyData as Record<string, unknown>).profit_margin as number) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatPercentage((monthlyData as Record<string, unknown>).profit_margin as number)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolução Anual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolução Mensal {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dreData.length > 0 ? dreData.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{getMonthName((month as Record<string, unknown>).month as number)}</p>
                    <p className="text-sm text-muted-foreground">
                      Receita: {formatCurrency((month as Record<string, unknown>).total_revenue as number || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${Number((month as Record<string, unknown>).net_profit as number || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency((month as Record<string, unknown>).net_profit as number || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercentage((month as Record<string, unknown>).profit_margin as number || 0)}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum dado de DRE encontrado para o ano selecionado</p>
                  <p className="text-xs mt-1">Dados por contas pagas/recebidas e categorias de despesa</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise Comparativa */}
      {dreData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Análise Comparativa - Últimos Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(dreData.slice(-3).reduce((sum, m) => sum + Number(m.total_revenue || 0), 0) / Math.min(3, dreData.length))}
                </div>
                <p className="text-sm text-muted-foreground">Receita Média (3 meses)</p>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${dreData.slice(-3).reduce((sum, m) => sum + Number(m.net_profit || 0), 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(dreData.slice(-3).reduce((sum, m) => sum + Number(m.net_profit || 0), 0) / Math.min(3, dreData.length))}
                </div>
                <p className="text-sm text-muted-foreground">Lucro Médio (3 meses)</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatPercentage(dreData.slice(-3).reduce((sum, m) => sum + Number(m.profit_margin || 0), 0) / Math.min(3, dreData.length))}
                </div>
                <p className="text-sm text-muted-foreground">Margem Média (3 meses)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
