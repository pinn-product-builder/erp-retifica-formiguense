import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinancial, AccountsReceivable } from '@/hooks/useFinancial';
import { useSupabase } from '@/hooks/useSupabase';
import { Plus, Search, Calendar, DollarSign, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ContasReceber() {
  const { getAccountsReceivable, updateAccountsReceivable, createAccountsReceivable, getPaymentMethods, getCustomers, loading } = useFinancial();
  const [receivables, setReceivables] = useState<Record<string, unknown>[]>([]);
  const [customers, setCustomers] = useState<Record<string, unknown>[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, unknown>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Partial<AccountsReceivable>>({
    customer_id: '',
    amount: 0,
    due_date: '',
    installment_number: 1,
    total_installments: 1,
    status: 'pending'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [receivablesData, customersData, paymentMethodsData] = await Promise.all([
      getAccountsReceivable(),
      getCustomers(),
      getPaymentMethods()
    ]);

    setReceivables(receivablesData);
    setCustomers(customersData);
    setPaymentMethods(paymentMethodsData);
  };

  const filteredReceivables = receivables.filter(receivable => {
    const matchesSearch = (((receivable as Record<string, unknown>).customers as Record<string, unknown>).name as string).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ((receivable as Record<string, unknown>).invoice_number as string).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || receivable.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      customer_id: '',
      amount: 0,
      due_date: '',
      installment_number: 1,
      total_installments: 1,
      status: 'pending'
    });
    setEditingReceivable(null);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm(); // Resetar formulário quando fechar
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.amount || !formData.due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingReceivable) {
        await updateAccountsReceivable(editingReceivable.id as string, formData as AccountsReceivable);
      } else {
        await createAccountsReceivable(formData as AccountsReceivable);
      }
      
      await loadData();
      setIsDialogOpen(false);
      setEditingReceivable(null);
      setFormData({
        customer_id: '',
        amount: 0,
        due_date: '',
        installment_number: 1,
        total_installments: 1,
        status: 'pending'
      });
    } catch (error) {
      console.error('Erro ao salvar conta a receber:', error);
    }
  };

  const handleEdit = (receivable: Record<string, unknown>) => {
    setEditingReceivable(receivable);
    setFormData({
      customer_id: receivable.customer_id as string || '',
      amount: receivable.amount as number,
      due_date: receivable.due_date as string,
      installment_number: receivable.installment_number as number,
      total_installments: receivable.total_installments as number,
      status: receivable.status as 'pending' | 'paid' | 'overdue' | 'cancelled',
      payment_method: receivable.payment_method as 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | undefined,
      invoice_number: receivable.invoice_number as string,
      notes: receivable.notes as string,
    });
    setIsDialogOpen(true);
  };

  const markAsPaid = async (receivable: Record<string, unknown>) => {
    await updateAccountsReceivable(receivable.id as string, {
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0]
    });
    loadData();
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

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'pending' && new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-muted-foreground">Gerencie os recebimentos da empresa</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingReceivable(null);
              setFormData({
                customer_id: '',
                amount: 0,
                due_date: '',
                installment_number: 1,
                total_installments: 1,
                status: 'pending'
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Receber
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingReceivable ? 'Editar' : 'Nova'} Conta a Receber
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="customer">Cliente</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id as string} value={customer.id as string}>
                        {customer.name as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  placeholder="0,00"
                />
              </div>

              <div>
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="installment_number">Parcela</Label>
                  <Input
                    id="installment_number"
                    type="number"
                    value={formData.installment_number}
                    onChange={(e) => setFormData({ ...formData, installment_number: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="total_installments">Total de Parcelas</Label>
                  <Input
                    id="total_installments"
                    type="number"
                    value={formData.total_installments}
                    onChange={(e) => setFormData({ ...formData, total_installments: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="invoice_number">Número da Fatura</Label>
                <Input
                  id="invoice_number"
                  value={formData.invoice_number || ''}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  placeholder="Ex: NF-001"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'pending' | 'paid' | 'overdue' | 'cancelled') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
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

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente ou número da fatura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de contas a receber */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceivables.map((receivable) => (
                <TableRow key={receivable.id as string}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{((receivable as Record<string, unknown>).customers as Record<string, unknown>).name as string}</p>
                        {receivable.invoice_number && (
                          <p className="text-sm text-muted-foreground">
                            {receivable.invoice_number as string}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold">{formatCurrency(receivable.amount as number)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(receivable.due_date as string), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      {isOverdue(receivable.due_date as string, receivable.status as string) && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {receivable.installment_number as number}/{receivable.total_installments as number}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(receivable.status as string)}>
                      {getStatusText(receivable.status as string)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(receivable)}
                      >
                        Editar
                      </Button>
                      {receivable.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => markAsPaid(receivable)}
                        >
                          Marcar como Pago
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}