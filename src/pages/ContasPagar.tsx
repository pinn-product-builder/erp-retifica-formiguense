
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFinancial, AccountsPayable } from '@/hooks/useFinancial';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, AlertTriangle, Calendar, DollarSign, 
  Building2, CheckCircle, Clock, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ContasPagar() {
  const { 
    getAccountsPayable, 
    createAccountsPayable, 
    updateAccountsPayable, 
    getExpenseCategories,
    loading 
  } = useFinancial();
  
  const [payables, setPayables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPayable, setEditingPayable] = useState<unknown>(null);

  const [formData, setFormData] = useState<Partial<AccountsPayable>>({
    supplier_name: '',
    description: '',
    amount: 0,
    due_date: '',
    status: 'pending',
    payment_method: undefined,
    invoice_number: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [payablesData, categoriesData] = await Promise.all([
      getAccountsPayable(),
      getExpenseCategories()
    ]);
    setPayables(payablesData);
    setCategories(categoriesData);
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
      case 'cancelled': return 'bg-muted text-muted-foreground';
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

  const filteredPayables = payables.filter(payable => {
    const matchesSearch = payable.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payable.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'pending') return matchesSearch && payable.status === 'pending';
    if (selectedTab === 'overdue') return matchesSearch && payable.status === 'overdue';
    if (selectedTab === 'paid') return matchesSearch && payable.status === 'paid';
    
    return matchesSearch;
  });

  const resetForm = () => {
    setFormData({
      supplier_name: '',
      description: '',
      amount: 0,
      due_date: '',
      status: 'pending',
      payment_method: undefined,
      invoice_number: '',
      notes: ''
    });
    setEditingPayable(null);
  };

  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      resetForm(); // Resetar formulário quando fechar
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_name || !formData.description || !formData.amount || !formData.due_date) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingPayable) {
        await updateAccountsPayable(editingPayable.id, formData);
        toast.success('Conta a pagar atualizada com sucesso');
      } else {
        await createAccountsPayable(formData as AccountsPayable);
        toast.success('Conta a pagar criada com sucesso');
      }
      
      setIsModalOpen(false);
      setEditingPayable(null);
      setFormData({
        supplier_name: '',
        description: '',
        amount: 0,
        due_date: '',
        status: 'pending',
        payment_method: undefined,
        invoice_number: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar conta a pagar');
    }
  };

  const handleEdit = (payable: unknown) => {
    setEditingPayable(payable);
    setFormData({
      supplier_name: payable.supplier_name,
      supplier_document: payable.supplier_document || '',
      expense_category_id: payable.expense_category_id,
      description: payable.description,
      amount: payable.amount,
      due_date: payable.due_date,
      status: payable.status,
      payment_method: payable.payment_method,
      invoice_number: payable.invoice_number || '',
      notes: payable.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleMarkAsPaid = async (payable: unknown) => {
    await updateAccountsPayable(payable.id, {
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0]
    });
    loadData();
  };

  const totals = {
    all: payables.length,
    pending: payables.filter(p => p.status === 'pending').length,
    overdue: payables.filter(p => p.status === 'overdue').length,
    paid: payables.filter(p => p.status === 'paid').length,
    totalAmount: payables.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gerencie fornecedores e despesas da empresa</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPayable(null);
              setFormData({
                supplier_name: '',
                description: '',
                amount: 0,
                due_date: '',
                status: 'pending',
                payment_method: undefined,
                invoice_number: '',
                notes: ''
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Pagar
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPayable ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier_name">Fornecedor *</Label>
                  <Input
                    id="supplier_name"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="supplier_document">CNPJ/CPF</Label>
                  <Input
                    id="supplier_document"
                    value={formData.supplier_document || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier_document: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                
                <div>
                  <Label htmlFor="due_date">Data de Vencimento *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="invoice_number">Nº da Nota</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={formData.expense_category_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, expense_category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value as unknown }))}
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
            <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.all}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{totals.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totals.overdue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totals.totalAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Buscar por fornecedor ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
      </div>

      {/* Tabs com contas */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">Todas ({totals.all})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({totals.pending})</TabsTrigger>
          <TabsTrigger value="overdue">Vencidas ({totals.overdue})</TabsTrigger>
          <TabsTrigger value="paid">Pagas ({totals.paid})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="space-y-1">
                {filteredPayables.map((payable, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{payable.supplier_name}</h3>
                        <Badge className={getStatusColor(payable.status)}>
                          {getStatusText(payable.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {payable.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Venc: {format(new Date(payable.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {payable.invoice_number && (
                          <span>NF: {payable.invoice_number}</span>
                        )}
                        {payable.expense_categories?.name && (
                          <span>{payable.expense_categories.name}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {formatCurrency(payable.amount)}
                        </div>
                        {payable.payment_date && (
                          <div className="text-xs text-muted-foreground">
                            Pago em {format(new Date(payable.payment_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(payable)}
                        >
                          Editar
                        </Button>
                        {payable.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(payable)}
                            className="bg-success hover:bg-success/90"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredPayables.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma conta a pagar encontrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
