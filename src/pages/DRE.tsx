
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancial } from '@/hooks/useFinancial';
import { 
  Calculator, TrendingUp, TrendingDown, DollarSign, 
  BarChart3, Calendar, FileText, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DRE() {
  const { getMonthlyDRE, getCashFlow, loading } = useFinancial();
  
  const [dreData, setDreData] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState<unknown>(null);

  useEffect(() => {
    loadDREData();
  }, [selectedYear]);

  useEffect(() => {
    loadMonthlyData();
  }, [selectedMonth, selectedYear]);

  const loadDREData = async () => {
    const data = await getMonthlyDRE(selectedYear);
    setDreData(data);
  };

  const loadMonthlyData = async () => {
    // Buscar dados do fluxo de caixa para o mês selecionado
    const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-31`;
    
    const cashFlowData = await getCashFlow(startDate, endDate);
    
    const income = cashFlowData.filter((t: unknown) => t.transaction_type === 'income')
      .reduce((sum: number, t: unknown) => sum + Number(t.amount), 0);
    
    const expenses = cashFlowData.filter((t: unknown) => t.transaction_type === 'expense')
      .reduce((sum: number, t: unknown) => sum + Number(t.amount), 0);

    // Simular divisão das despesas (em um sistema real, isso viria categorizado)
    const directCosts = expenses * 0.4; // 40% custos diretos
    const operationalExpenses = expenses * 0.6; // 60% despesas operacionais
    
    const grossProfit = income - directCosts;
    const netProfit = grossProfit - operationalExpenses;
    const profitMargin = income > 0 ? (netProfit / income) * 100 : 0;

    setMonthlyData({
      month: selectedMonth,
      year: selectedYear,
      total_revenue: income,
      direct_costs: directCosts,
      operational_expenses: operationalExpenses,
      gross_profit: grossProfit,
      net_profit: netProfit,
      profit_margin: profitMargin
    });
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

  const yearlyTotals = dreData.reduce((acc, month) => ({
    revenue: acc.revenue + Number(month.total_revenue || 0),
    directCosts: acc.directCosts + Number(month.direct_costs || 0),
    operationalExpenses: acc.operationalExpenses + Number(month.operational_expenses || 0),
    grossProfit: acc.grossProfit + Number(month.gross_profit || 0),
    netProfit: acc.netProfit + Number(month.net_profit || 0)
  }), { revenue: 0, directCosts: 0, operationalExpenses: 0, grossProfit: 0, netProfit: 0 });

  const yearlyProfitMargin = yearlyTotals.revenue > 0 ? (yearlyTotals.netProfit / yearlyTotals.revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DRE - Demonstrativo de Resultado</h1>
          <p className="text-muted-foreground">Análise de receitas, custos e rentabilidade</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar DRE
          </Button>
        </div>
      </div>

      {/* Seletores de Período */}
      <div className="flex items-center gap-4">
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
      </div>

      {/* KPIs Anuais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Anual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(yearlyTotals.revenue)}
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
              {formatCurrency(yearlyTotals.directCosts + yearlyTotals.operationalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${yearlyTotals.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(yearlyTotals.netProfit)}
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
                      {formatCurrency(monthlyData.total_revenue)}
                    </span>
                  </div>
                  
                  <div className="pl-4 space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>(-) Custos Diretos</span>
                      <span className="text-destructive">
                        {formatCurrency(monthlyData.direct_costs)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">= Lucro Bruto</span>
                    <span className={`font-bold ${monthlyData.gross_profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(monthlyData.gross_profit)}
                    </span>
                  </div>
                  
                  <div className="pl-4 space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>(-) Despesas Operacionais</span>
                      <span className="text-destructive">
                        {formatCurrency(monthlyData.operational_expenses)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="font-medium">= Lucro Líquido</span>
                    <span className={`font-bold ${monthlyData.net_profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(monthlyData.net_profit)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 border-t">
                    <span className="text-sm font-medium">Margem Líquida</span>
                    <span className={`text-sm font-bold ${monthlyData.profit_margin >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatPercentage(monthlyData.profit_margin)}
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
                    <p className="font-medium">{getMonthName(month.month)}</p>
                    <p className="text-sm text-muted-foreground">
                      Receita: {formatCurrency(month.total_revenue || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${Number(month.net_profit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(month.net_profit || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercentage(month.profit_margin || 0)}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum dado de DRE encontrado para o ano selecionado</p>
                  <p className="text-xs mt-1">Os dados são calculados automaticamente com base no fluxo de caixa</p>
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
