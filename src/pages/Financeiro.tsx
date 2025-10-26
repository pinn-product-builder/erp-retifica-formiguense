import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFinancial } from '@/hooks/useFinancial';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  AlertTriangle, CheckCircle, Clock, Building2,
  CreditCard, PiggyBank, Receipt, Target
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Financeiro() {
  const { getFinancialKPIs, getAccountsReceivable, getAccountsPayable, getCashFlow, loading } = useFinancial();
  const [kpis, setKPIs] = useState<unknown>(null);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    const [kpisData, receivablesData, payablesData, cashFlowData] = await Promise.all([
      getFinancialKPIs(),
      getAccountsReceivable(),
      getAccountsPayable(),
      getCashFlow()
    ]);

    setKPIs(kpisData);
    setReceivables(receivablesData);
    setPayables(payablesData);
    setCashFlow(cashFlowData.slice(0, 10)); // Últimas 10 movimentações
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'overdue': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral das finanças da empresa</p>
        </div>
        <Button onClick={loadFinancialData} disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Atualizando...' : 'Atualizar Dados'}
        </Button>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(kpis.monthlyRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">Receita do mês atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas Mensais</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(kpis.monthlyExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">Gastos do mês atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(kpis.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground">Receita - Despesas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.overdueCount > 0 ? 'text-destructive' : 'text-success'}`}>
                {kpis.overdueCount}
              </div>
              <p className="text-xs text-muted-foreground">Recebimentos em atraso</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs com módulos financeiros */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="receivables" className="text-xs sm:text-sm">A Receber</TabsTrigger>
          <TabsTrigger value="payables" className="text-xs sm:text-sm">A Pagar</TabsTrigger>
          <TabsTrigger value="cashflow" className="text-xs sm:text-sm">Fluxo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Resumo de recebíveis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Contas a Receber - Resumo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpis && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total a Receber</span>
                      <span className="font-bold text-success">
                        {formatCurrency(kpis.totalReceivable)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Contas Vencidas</span>
                      <span className="font-bold text-destructive">
                        {kpis.overdueCount}
                      </span>
                    </div>
                    <Progress 
                      value={kpis.overdueCount > 0 ? (kpis.overdueCount / receivables.length) * 100 : 0} 
                      className="w-full"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo de pagáveis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Contas a Pagar - Resumo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpis && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total a Pagar</span>
                      <span className="font-bold text-destructive">
                        {formatCurrency(kpis.totalPayable)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Saldo Disponível</span>
                      <span className={`font-bold ${kpis.cashBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(kpis.cashBalance)}
                      </span>
                    </div>
                    <Progress 
                      value={kpis.totalPayable > 0 ? Math.min((kpis.cashBalance / kpis.totalPayable) * 100, 100) : 100}
                      className="w-full"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Últimas movimentações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Últimas Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cashFlow.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {transaction.transaction_type === 'income' ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold ${
                      transaction.transaction_type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {receivables.map((receivable, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{receivable.customers?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Venc: {format(new Date(receivable.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(receivable.status)}>
                        {getStatusText(receivable.status)}
                      </Badge>
                      <span className="font-bold">{formatCurrency(receivable.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payables.map((payable, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{payable.supplier_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {payable.description} - Venc: {format(new Date(payable.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(payable.status)}>
                        {getStatusText(payable.status)}
                      </Badge>
                      <span className="font-bold">{formatCurrency(payable.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cashFlow.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {transaction.transaction_type === 'income' ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                          {transaction.payment_method && ` • ${transaction.payment_method}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {transaction.reconciled && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                      <span className={`font-bold ${
                        transaction.transaction_type === 'income' ? 'text-success' : 'text-destructive'
                      }`}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}