import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFinancial, CashFlow } from '@/hooks/useFinancial';
import { useOrganization } from '@/hooks/useOrganization';
import { CostCenterSelect } from '@/components/financial/CostCenterSelect';
import { formatBRL, formatDateBR, paymentMethodLabel } from '@/lib/financialFormat';
import { FinancialConfigService } from '@/services/financial/financialConfigService';
import type { Database } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

function cashFlowBankLabel(ba: unknown): string {
  if (!ba || typeof ba !== 'object') return '';
  const r = ba as Record<string, unknown>;
  for (const key of ['name', 'bank_name'] as const) {
    const v = r[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

type CfRow = Record<string, unknown>;
type PmCatalogRow = Database['public']['Tables']['payment_methods']['Row'];
const FALLBACK_CF_PM: Database['public']['Enums']['payment_method'][] = [
  'cash',
  'pix',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'check',
  'boleto',
];

export default function FluxoCaixa() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const orgIdReady = Boolean(orgId);
  const {
    getCashFlow,
    getCashFlowPeriodMetrics,
    createCashFlow,
    updateCashFlowEntry,
    deleteCashFlowEntry,
    getBankAccounts,
    getExpenseCategories,
    loading,
  } = useFinancial();

  const [cashFlow, setCashFlow] = useState<CfRow[]>([]);
  const [listMeta, setListMeta] = useState({ count: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [metrics, setMetrics] = useState({ income: 0, expense: 0, reconciled: 0, pending: 0 });
  const [bankAccounts, setBankAccounts] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [pmCatalog, setPmCatalog] = useState<PmCatalogRow[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState({
    start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const [formData, setFormData] = useState<Partial<CashFlow>>({
    transaction_type: 'income',
    amount: 0,
    description: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: undefined,
    bank_account_id: undefined,
    category_id: undefined,
    cost_center_id: undefined,
    notes: '',
    reconciled: false,
  });

  const loadData = useCallback(async () => {
    const [cashFlowRes, m, bankAccountsData, categoriesData] = await Promise.all([
      getCashFlow(dateFilter.start, dateFilter.end, page, PAGE_SIZE),
      getCashFlowPeriodMetrics(dateFilter.start, dateFilter.end),
      getBankAccounts(),
      getExpenseCategories(),
    ]);
    setCashFlow(cashFlowRes.data as unknown as CfRow[]);
    setListMeta({ count: cashFlowRes.count, totalPages: cashFlowRes.totalPages });
    setMetrics(m);
    setBankAccounts(bankAccountsData);
    setCategories(categoriesData);
  }, [dateFilter.start, dateFilter.end, page, getCashFlow, getCashFlowPeriodMetrics, getBankAccounts, getExpenseCategories]);

  useEffect(() => {
    if (!orgIdReady) return;
    void loadData();
  }, [orgIdReady, loadData]);

  useEffect(() => {
    if (!orgId) return;
    void FinancialConfigService.listPaymentMethods(orgId).then(setPmCatalog);
  }, [orgId]);

  useEffect(() => {
    setPage(1);
  }, [dateFilter.start, dateFilter.end]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      transaction_type: 'income',
      amount: 0,
      description: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: undefined,
      bank_account_id: undefined,
      category_id: undefined,
      cost_center_id: undefined,
      notes: '',
      reconciled: false,
    });
  };

  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const openNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (row: CfRow) => {
    setEditingId(row.id as string);
    setFormData({
      transaction_type: row.transaction_type as 'income' | 'expense',
      amount: Number(row.amount),
      description: row.description as string,
      transaction_date: (row.transaction_date as string).slice(0, 10),
      payment_method: row.payment_method as CashFlow['payment_method'],
      bank_account_id: (row.bank_account_id as string) ?? undefined,
      category_id: (row.category_id as string) ?? undefined,
      cost_center_id: (row.cost_center_id as string) ?? undefined,
      notes: (row.notes as string) ?? '',
      reconciled: Boolean(row.reconciled),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.transaction_type || !formData.amount || !formData.description || !formData.transaction_date) {
      toast.error('Preencha tipo, valor, descrição e data');
      return;
    }

    try {
      if (editingId) {
        const ok = await updateCashFlowEntry(editingId, {
          transaction_type: formData.transaction_type,
          amount: formData.amount,
          description: formData.description,
          transaction_date: formData.transaction_date,
          payment_method: formData.payment_method,
          bank_account_id: formData.bank_account_id || null,
          category_id: formData.category_id || null,
          cost_center_id: formData.cost_center_id || null,
          notes: formData.notes || null,
          reconciled: formData.reconciled ?? false,
        });
        if (!ok) return;
      } else {
        const c = await createCashFlow(formData as CashFlow);
        if (!c) return;
      }

      setIsModalOpen(false);
      resetForm();
      void loadData();
    } catch {
      toast.error('Erro ao salvar movimentação');
    }
  };

  const handleDelete = async (row: CfRow) => {
    if (!window.confirm('Excluir esta movimentação?')) return;
    const ok = await deleteCashFlowEntry(row.id as string);
    if (ok) void loadData();
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
      end: format(now, 'yyyy-MM-dd'),
    });
    setSelectedPeriod(period);
  };

  const totals = {
    income: metrics.income,
    expense: metrics.expense,
    balance: metrics.income - metrics.expense,
    reconciled: metrics.reconciled,
    pending: metrics.pending,
  };

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Fluxo de Caixa</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Entradas e saídas</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nova movimentação
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-left text-xl sm:text-2xl">
                {editingId ? 'Editar movimentação' : 'Nova movimentação'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Tipo *</Label>
                  <Select
                    value={formData.transaction_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, transaction_type: value as 'income' | 'expense' }))
                    }
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
                  <Label htmlFor="cf-amount">Valor *</Label>
                  <Input
                    id="cf-amount"
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cf-desc">Descrição *</Label>
                <Input
                  id="cf-desc"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cf-date">Data *</Label>
                  <Input
                    id="cf-date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, transaction_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={formData.payment_method ?? '__none__'}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        payment_method:
                          value === '__none__' ? undefined : (value as CashFlow['payment_method']),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {pmCatalog.length > 0
                        ? pmCatalog.map((row) => (
                            <SelectItem key={row.id} value={row.method}>
                              {row.name} ({paymentMethodLabel(row.method)})
                            </SelectItem>
                          ))
                        : FALLBACK_CF_PM.map((m) => (
                            <SelectItem key={m} value={m}>
                              {paymentMethodLabel(m)}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Conta bancária</Label>
                  <Select
                    value={formData.bank_account_id ?? '__none__'}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        bank_account_id: value === '__none__' ? undefined : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id as string} value={account.id as string}>
                          {(account.bank_name as string) ?? ''} — {(account.account_number as string) ?? ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.transaction_type === 'expense' && (
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={formData.category_id ?? '__none__'}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          category_id: value === '__none__' ? undefined : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
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

              <CostCenterSelect
                orgId={orgId}
                value={(formData.cost_center_id as string) ?? ''}
                onValueChange={(id) => setFormData((prev) => ({ ...prev, cost_center_id: id || undefined }))}
                id="cf-cost-center"
              />

              <div>
                <Label htmlFor="cf-notes">Observações</Label>
                <Textarea
                  id="cf-notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
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

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-4">
            <CardTitle className="text-xs font-medium sm:text-sm">Entradas</CardTitle>
            <TrendingUp className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg font-bold text-success sm:text-2xl whitespace-nowrap">
              {formatBRL(totals.income)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-4">
            <CardTitle className="text-xs font-medium sm:text-sm">Saídas</CardTitle>
            <TrendingDown className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg font-bold text-destructive sm:text-2xl whitespace-nowrap">
              {formatBRL(totals.expense)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-4">
            <CardTitle className="text-xs font-medium sm:text-sm">Saldo período</CardTitle>
            <DollarSign className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div
              className={`text-lg font-bold sm:text-2xl whitespace-nowrap ${totals.balance >= 0 ? 'text-success' : 'text-destructive'}`}
            >
              {formatBRL(totals.balance)}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-4">
            <CardTitle className="text-xs font-medium sm:text-sm">Conciliadas</CardTitle>
            <CheckCircle className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg font-bold sm:text-2xl">{totals.reconciled}</div>
            <p className="text-muted-foreground text-xs">{totals.pending} pendentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {(['today', 'week', 'month', 'quarter', 'year'] as const).map((p) => (
            <Button
              key={p}
              variant={selectedPeriod === p ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs sm:text-sm"
              type="button"
              onClick={() => setPeriod(p)}
            >
              {p === 'today' ? 'Hoje' : p === 'week' ? '7 dias' : p === 'month' ? 'Mês' : p === 'quarter' ? 'Trim.' : 'Ano'}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <Label className="whitespace-nowrap">De</Label>
          <Input
            type="date"
            value={dateFilter.start}
            onChange={(e) => setDateFilter((prev) => ({ ...prev, start: e.target.value }))}
            className="h-8 w-auto min-w-0"
          />
          <Label className="whitespace-nowrap">Até</Label>
          <Input
            type="date"
            value={dateFilter.end}
            onChange={(e) => setDateFilter((prev) => ({ ...prev, end: e.target.value }))}
            className="h-8 w-auto min-w-0"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-base sm:text-lg">Movimentações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {cashFlow.map((transaction) => {
              const bankLbl = cashFlowBankLabel(transaction.bank_accounts);
              return (
                <div
                  key={transaction.id as string}
                  className="flex flex-col gap-2 border-b p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                    {transaction.transaction_type === 'income' ? (
                      <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm sm:text-base">{transaction.description as string}</p>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateBR(transaction.transaction_date as string)}
                        </span>
                        {transaction.payment_method ? (
                          <span>• {paymentMethodLabel(transaction.payment_method as string)}</span>
                        ) : null}
                        {bankLbl ? <span className="truncate">• {bankLbl}</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center justify-between gap-2 sm:justify-end">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {transaction.reconciled ? (
                        <Badge variant="outline" className="border-success text-xs text-success">
                          Conciliado
                        </Badge>
                      ) : null}
                      <div
                        className={`text-base font-bold whitespace-nowrap sm:text-lg ${
                          transaction.transaction_type === 'income' ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatBRL(transaction.amount as number)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(transaction)}
                      >
                        <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => void handleDelete(transaction)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {cashFlow.length === 0 && (
              <div className="text-muted-foreground py-8 text-center text-sm">Nenhuma movimentação no período</div>
            )}
          </div>
          <div className="text-muted-foreground flex flex-col gap-2 border-t px-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:text-sm">
            <span>
              Mostrando {listMeta.count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} a{' '}
              {Math.min(page * PAGE_SIZE, listMeta.count)} de {listMeta.count} itens
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={page >= listMeta.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
