
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFinancial, CashFlow } from '@/hooks/useFinancial';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, TrendingUp, TrendingDown, DollarSign, 
  Calendar, PiggyBank, Filter, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function FluxoCaixa() {
  const { 
    getCashFlow, 
    createCashFlow, 
    getBankAccounts,
    getExpenseCategories,
    loading 
  } = useFinancial();
  
  const [cashFlow, setCashFlow] = useState<Record<string, unknown>[]>([]);
  const [bankAccounts, setBankAccounts] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const [formData, setFormData] = useState<Partial<CashFlow>>({
    transaction_type: 'income',
    amount: 0,
    description: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: undefined,
    bank_account_id: undefined,
    category_id: undefined,
    notes: '',
    reconciled: false
  });

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const loadData = async () => {
    const [cashFlowData, bankAccountsData, categoriesData] = await Promise.all([
      getCashFlow(dateFilter.start, dateFilter.end),
      getBankAccounts(),
      getExpenseCategories()
    ]);
    setCashFlow(cashFlowData as unknown as Record<string, unknown>[]);
    setBankAccounts(bankAccountsData);
    setCategories(categoriesData);
  };

  const resetForm = () => {
    setFormData({
      transaction_type: 'income',
      amount: 0,
      description: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: undefined,
      bank_account_id: undefined,
      category_id: undefined,
      notes: '',
      reconciled: false
    });
  };

  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      resetForm(); // Resetar formulário quando fechar
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.transaction_type || !formData.amount || !formData.description || !formData.transaction_date) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      await createCashFlow(formData as CashFlow);
      toast.success('Movimentação registrada com sucesso');
      
      setIsModalOpen(false);
      setFormData({
        transaction_type: 'income',
        amount: 0,
        description: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: undefined,
        bank_account_id: undefined,
        category_id: undefined,
        notes: '',
        reconciled: false
      });
      loadData();
    } catch (error) {
      toast.error('Erro ao registrar movimentação');
    }
  };

  const setPeriod = (period: string) => {
    const now = new Date();
    let start: Date;
    
    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    setDateFilter({
      start: format(start, 'yyyy-MM-dd'),
      end: format(now, 'yyyy-MM-dd')
    });
    setSelectedPeriod(period);
  };

  const totals = {
    income: cashFlow.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
    expense: cashFlow.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0),
    balance: 0,
    reconciled: cashFlow.filter(t => t.reconciled).length,
    pending: cashFlow.filter(t => !t.reconciled).length
  };
  totals.balance = totals.income - totals.expense;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">Controle diário de entradas e saídas</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Movimentação</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transaction_type">Tipo de Movimentação *</Label>
                  <Select 
                    value={formData.transaction_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value as 'income' | 'expense' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Entrada</SelectItem>
                      <SelectItem value="expense">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Pagamento do cliente João"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transaction_date">Data *</Label>
                  <Input
                    id="transaction_date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <Select 
                    value={formData.payment_method} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value as 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="bank_transfer">Transferência</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_account">Conta Bancária</Label>
                  <Select 
                    value={formData.bank_account_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, bank_account_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id as string} value={account.id as string}>
                          {account.bank_name as string} - {account.account_number as string}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.transaction_type === 'expense' && (
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id as string} value={category.id as string}>
                            {category.name as string}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleModalChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totals.income)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totals.expense)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Período</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(totals.balance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conciliadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.reconciled}</div>
            <p className="text-xs text-muted-foreground">
              {totals.pending} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Período */}
      <div className="flex items-center gap-2">
        <Button
          variant={selectedPeriod === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('today')}
        >
          Hoje
        </Button>
        <Button
          variant={selectedPeriod === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('week')}
        >
          7 dias
        </Button>
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('month')}
        >
          Mês
        </Button>
        <Button
          variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('quarter')}
        >
          Trimestre
        </Button>
        <Button
          variant={selectedPeriod === 'year' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('year')}
        >
          Ano
        </Button>
        
        <div className="flex items-center gap-2 ml-4">
          <Label>De:</Label>
          <Input
            type="date"
            value={dateFilter.start}
            onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
            className="w-auto"
          />
          <Label>Até:</Label>
          <Input
            type="date"
            value={dateFilter.end}
            onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
            className="w-auto"
          />
        </div>
      </div>

      {/* Lista de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações do Período</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {cashFlow.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-4 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  {transaction.transaction_type === 'income' ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">{transaction.description as string}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(transaction.transaction_date as string), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      {transaction.payment_method && (
                        <span>• {transaction.payment_method as string}</span>
                      )}
                      {(transaction.bank_accounts as Record<string, unknown>)?.bank_name as string && (
                        <span>• {(transaction.bank_accounts as Record<string, unknown>).bank_name as string}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {transaction.reconciled && (
                    <Badge variant="outline" className="text-success border-success">
                      Conciliado
                    </Badge>
                  )}
                  <div className={`font-bold text-lg ${
                    transaction.transaction_type === 'income' ? 'text-success' : 'text-destructive'
                  }`}>
                    {transaction.transaction_type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount as number)}
                  </div>
                </div>
              </div>
            ))}
            
            {cashFlow.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma movimentação encontrada no período
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
