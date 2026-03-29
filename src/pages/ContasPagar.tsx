import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFinancial, AccountsPayable } from '@/hooks/useFinancial';
import { useOrganization } from '@/hooks/useOrganization';
import { CostCenterSelect } from '@/components/financial/CostCenterSelect';
import {
  FinancialAsyncCombobox,
  type FinancialAsyncComboboxProps,
} from '@/components/financial/FinancialAsyncCombobox';
import { AccountsPayableListTable } from '@/components/financial/accounts-payable/AccountsPayableListTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, AlertTriangle, DollarSign, Building2, CheckCircle, Clock, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { isAccountsPayableApprovedForPayment } from '@/services/financial/approvalApService';
import type { AccountsPayableOrgSummary } from '@/services/financial/accountsPayableService';
import type { Database } from '@/integrations/supabase/types';
import { SupplierLookupService } from '@/services/financial/supplierLookupService';
import { ApInvoiceFileService } from '@/services/financial/apInvoiceFileService';
import { formatBRL, formatDateBR, paymentMethodLabel } from '@/lib/financialFormat';
import { FinancialConfigService } from '@/services/financial/financialConfigService';
import { cn } from '@/lib/utils';
import { getDueAlertCalendarDates } from '@/lib/dueAlertDates';
import {
  isISODateAfterOther,
  isISODateBeforeToday,
  todayISODateLocal,
} from '@/lib/calendarDate';
import type { ResponsiveTableColumn } from '@/components/ui/responsive-table';

const ITEMS_PER_PAGE = 10;

type SupplierRow = Database['public']['Tables']['suppliers']['Row'];
type ApPayableRow = Record<string, unknown>;
type PmCatalogRow = Database['public']['Tables']['payment_methods']['Row'];

const FALLBACK_PAYMENT_METHODS: Database['public']['Enums']['payment_method'][] = [
  'cash',
  'pix',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'check',
  'boleto',
];

function SupplierApCombobox(props: FinancialAsyncComboboxProps<SupplierRow>) {
  return <FinancialAsyncCombobox {...props} />;
}

const emptySummary: AccountsPayableOrgSummary = {
  all: 0,
  pending: 0,
  overdue: 0,
  paid: 0,
  pendingAmount: 0,
};

export default function ContasPagar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const {
    getAccountsPayable,
    getAccountsPayableOrgSummary,
    createAccountsPayable,
    updateAccountsPayable,
    getExpenseCategories,
    loading,
  } = useFinancial();

  const [payables, setPayables] = useState<ApPayableRow[]>([]);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [listMeta, setListMeta] = useState({ count: 0, totalPages: 1 });
  const [summary, setSummary] = useState<AccountsPayableOrgSummary>(emptySummary);
  const [editingPayable, setEditingPayable] = useState<ApPayableRow | null>(null);
  const [dueAlertFilter, setDueAlertFilter] = useState(false);
  const [pmCatalog, setPmCatalog] = useState<PmCatalogRow[]>([]);

  const [supplierOpt, setSupplierOpt] = useState<SupplierRow | null>(null);
  const [supplierModalInput, setSupplierModalInput] = useState('');
  const [supplierOptions, setSupplierOptions] = useState<SupplierRow[]>([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<Partial<AccountsPayable>>({
    supplier_name: '',
    description: '',
    amount: 0,
    due_date: '',
    competence_date: '',
    status: 'pending',
    payment_method: undefined,
    invoice_number: '',
    notes: '',
    cost_center_id: undefined,
    invoice_file_url: undefined,
    supplier_id: undefined,
  });

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, debouncedSearch]);

  useEffect(() => {
    if (searchParams.get('dueAlerts') === '1') setDueAlertFilter(true);
  }, [searchParams]);

  useEffect(() => {
    if (!orgId) return;
    void (async () => {
      const categoriesData = await getExpenseCategories();
      setCategories(categoriesData);
    })();
  }, [orgId, getExpenseCategories]);

  useEffect(() => {
    if (!orgId) return;
    void FinancialConfigService.listPaymentMethodsForContext(orgId, 'payable').then(setPmCatalog);
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    void (async () => {
      const s = await getAccountsPayableOrgSummary();
      setSummary(s);
    })();
  }, [orgId, getAccountsPayableOrgSummary]);

  useEffect(() => {
    if (!orgId) return;
    void (async () => {
      const statusFilter: Database['public']['Enums']['payment_status'] | undefined =
        selectedTab === 'all' ? undefined : (selectedTab as Database['public']['Enums']['payment_status']);
      const payablesRes = await getAccountsPayable(currentPage, ITEMS_PER_PAGE, {
        status: statusFilter,
        search: debouncedSearch || undefined,
        ...(dueAlertFilter ? { dueOnDates: getDueAlertCalendarDates() } : {}),
      });
      setPayables(payablesRes.data as unknown as ApPayableRow[]);
      setListMeta({ count: payablesRes.count, totalPages: payablesRes.totalPages });
    })();
  }, [orgId, currentPage, selectedTab, debouncedSearch, dueAlertFilter, getAccountsPayable]);

  useEffect(() => {
    const q = isModalOpen ? supplierModalInput : '';
    if (!orgId || !isModalOpen || !q.trim()) {
      if (!isModalOpen) return;
      if (!q.trim()) setSupplierOptions([]);
      return;
    }
    const t = setTimeout(() => {
      setSupplierLoading(true);
      void SupplierLookupService.search(orgId, q, 1, 20).then((r) => {
        setSupplierOptions(r.data);
        setSupplierLoading(false);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [supplierModalInput, isModalOpen, orgId]);

  const refreshAll = async () => {
    if (!orgId) return;
    const statusFilter: Database['public']['Enums']['payment_status'] | undefined =
      selectedTab === 'all' ? undefined : (selectedTab as Database['public']['Enums']['payment_status']);
    const [payablesRes, s] = await Promise.all([
      getAccountsPayable(currentPage, ITEMS_PER_PAGE, {
        status: statusFilter,
        search: debouncedSearch || undefined,
        ...(dueAlertFilter ? { dueOnDates: getDueAlertCalendarDates() } : {}),
      }),
      getAccountsPayableOrgSummary(),
    ]);
    setPayables(payablesRes.data as unknown as ApPayableRow[]);
    setListMeta({ count: payablesRes.count, totalPages: payablesRes.totalPages });
    setSummary(s);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'overdue':
        return 'bg-destructive text-destructive-foreground';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_name: '',
      description: '',
      amount: 0,
      due_date: '',
      competence_date: '',
      status: 'pending',
      payment_method: undefined,
      invoice_number: '',
      notes: '',
      cost_center_id: undefined,
      invoice_file_url: undefined,
      supplier_id: undefined,
    });
    setEditingPayable(null);
    setSupplierOpt(null);
    setSupplierModalInput('');
    setInvoiceFile(null);
  };

  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.due_date) {
      toast.error('Preencha descrição, valor e vencimento');
      return;
    }

    if (!editingPayable && !supplierOpt) {
      toast.error('Selecione um fornecedor');
      return;
    }

    if (!editingPayable && !formData.supplier_name?.trim()) {
      toast.error('Fornecedor inválido');
      return;
    }

    try {
      let invoicePath = (formData.invoice_file_url as string | undefined) ?? null;
      if (invoiceFile && orgId) {
        const up = await ApInvoiceFileService.upload(orgId, invoiceFile);
        if (up.error) {
          toast.error(up.error.message);
          return;
        }
        invoicePath = up.storagePath;
      }

      const supplierName = supplierOpt
        ? supplierOpt.trade_name || supplierOpt.name
        : (formData.supplier_name as string);
      const supplierDocument = supplierOpt?.document ?? formData.supplier_document ?? null;
      const supplierId = supplierOpt?.id ?? (formData.supplier_id as string | undefined) ?? null;

      const payload: AccountsPayable = {
        ...formData,
        supplier_id: supplierId,
        supplier_name: supplierName,
        supplier_document: supplierDocument,
        competence_date: (formData.competence_date as string) || (formData.due_date as string),
        invoice_file_url: invoicePath,
      } as AccountsPayable;

      if (editingPayable) {
        const updated = await updateAccountsPayable(editingPayable.id as string, payload);
        if (!updated) return;
      } else {
        const created = await createAccountsPayable(payload);
        if (!created) return;
      }

      setIsModalOpen(false);
      resetForm();
      void refreshAll();
    } catch {
      toast.error('Erro ao salvar conta a pagar');
    }
  };

  const handleEdit = async (payable: ApPayableRow) => {
    setEditingPayable(payable);
    const sid = payable.supplier_id as string | undefined;
    let sup: SupplierRow | null = null;
    if (sid && orgId) {
      try {
        sup = await SupplierLookupService.getById(orgId, sid);
      } catch {
        sup = null;
      }
    }
    setSupplierOpt(sup);
    setSupplierModalInput(sup ? sup.trade_name || sup.name : (payable.supplier_name as string) || '');
    setFormData({
      supplier_name: payable.supplier_name as string,
      supplier_document: (payable.supplier_document as string) || '',
      supplier_id: sid,
      expense_category_id: payable.expense_category_id as string,
      description: payable.description as string,
      amount: payable.amount as number,
      due_date: payable.due_date as string,
      competence_date: (payable.competence_date as string) || (payable.due_date as string),
      status: payable.status as 'pending' | 'paid' | 'overdue' | 'cancelled',
      payment_method: payable.payment_method as AccountsPayable['payment_method'],
      invoice_number: (payable.invoice_number as string) || '',
      notes: (payable.notes as string) || '',
      cost_center_id: (payable.cost_center_id as string | null) ?? undefined,
      invoice_file_url: (payable.invoice_file_url as string) ?? undefined,
    });
    setInvoiceFile(null);
    setIsModalOpen(true);
  };

  const handleMarkAsPaid = async (payable: ApPayableRow) => {
    const ap = payable.approval_status as string | null | undefined;
    if (!isAccountsPayableApprovedForPayment(ap)) {
      toast.error('Aprove o título antes de marcar como pago.');
      return;
    }
    await updateAccountsPayable(payable.id as string, {
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
    });
    void refreshAll();
  };

  const openInvoiceFile = useCallback(async (raw: string | null | undefined) => {
    if (!raw) return;
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      window.open(raw, '_blank', 'noopener,noreferrer');
      return;
    }
    const r = await ApInvoiceFileService.getSignedUrl(raw);
    if (r.url) window.open(r.url, '_blank', 'noopener,noreferrer');
    else toast.error(r.error?.message ?? 'Não foi possível abrir o arquivo');
  }, []);

  const approvalBadgeClass = (approvalStatus: string | null | undefined) => {
    if (approvalStatus == null || approvalStatus === '' || approvalStatus === 'approved') return '';
    if (approvalStatus === 'rejected') return 'bg-destructive text-destructive-foreground';
    return 'bg-secondary text-secondary-foreground';
  };

  const approvalBadgeLabel = (approvalStatus: string | null | undefined) => {
    if (approvalStatus == null || approvalStatus === '' || approvalStatus === 'approved') return '';
    if (approvalStatus === 'rejected') return 'Rejeitado';
    if (approvalStatus === 'pending_approval' || approvalStatus === 'awaiting_approval') return 'Aguardando aprovação';
    return approvalStatus;
  };

  const apColumns: ResponsiveTableColumn<ApPayableRow>[] = [
    {
      key: 'supplier',
      header: 'Fornecedor',
      mobileLabel: 'Fornecedor',
      priority: 1,
      render: (p) => <span className="font-medium">{p.supplier_name as string}</span>,
    },
    {
      key: 'desc',
      header: 'Descrição',
      mobileLabel: 'Descr.',
      priority: 2,
      render: (p) => <span className="text-muted-foreground text-sm">{p.description as string}</span>,
    },
    {
      key: 'amount',
      header: 'Valor',
      mobileLabel: 'Valor',
      priority: 3,
      minWidth: 110,
      render: (p) => (
        <span className="whitespace-nowrap font-semibold">{formatBRL(Number(p.amount))}</span>
      ),
    },
    {
      key: 'due',
      header: 'Vencimento',
      mobileLabel: 'Venc.',
      priority: 4,
      render: (p) => formatDateBR(p.due_date as string),
    },
    {
      key: 'comp',
      header: 'Competência',
      hideInMobile: true,
      priority: 5,
      render: (p) => formatDateBR((p.competence_date as string) ?? null),
    },
    {
      key: 'status',
      header: 'Status',
      mobileLabel: 'Status',
      priority: 6,
      render: (p) => (
        <Badge className={cn('text-xs', getStatusColor(p.status as string))}>
          {getStatusText(p.status as string)}
        </Badge>
      ),
    },
    {
      key: 'approval',
      header: 'Aprovação',
      hideInMobile: true,
      priority: 7,
      render: (p) => {
        const lbl = approvalBadgeLabel(p.approval_status as string);
        if (!lbl) return '—';
        return (
          <Badge className={cn('text-xs', approvalBadgeClass(p.approval_status as string))}>{lbl}</Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      priority: 8,
      minWidth: 200,
      render: (p) => (
        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:justify-end">
          {(p.invoice_file_url as string) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => void openInvoiceFile(p.invoice_file_url as string)}
            >
              NF
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => void handleEdit(p)}>
            Editar
          </Button>
          {p.status === 'pending' &&
            isAccountsPayableApprovedForPayment(p.approval_status as string) && (
              <Button
                type="button"
                size="sm"
                className="h-8 bg-success text-xs hover:bg-success/90"
                onClick={() => void handleMarkAsPaid(p)}
              >
                <CheckCircle className="mr-1 h-3 w-3 sm:inline" />
                Pagar
              </Button>
            )}
          {p.status === 'pending' && !isAccountsPayableApprovedForPayment(p.approval_status as string) && (
            <span className="text-muted-foreground text-xs">Aprovação necessária</span>
          )}
        </div>
      ),
    },
  ];

  const todayMin = todayISODateLocal();
  const apCreateDatesInvalid =
    !editingPayable &&
    (!formData.due_date ||
      isISODateBeforeToday(String(formData.due_date)) ||
      (String(formData.competence_date ?? '').trim() !== '' &&
        (isISODateBeforeToday(String(formData.competence_date)) ||
          isISODateAfterOther(String(formData.competence_date), String(formData.due_date)))));

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Contas a Pagar</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Fornecedores e despesas</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingPayable(null);
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova conta
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-left text-xl sm:text-2xl">
                {editingPayable ? 'Editar conta a pagar' : 'Nova conta a pagar'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <SupplierApCombobox
                label="Fornecedor"
                required={!editingPayable}
                value={supplierOpt}
                onChange={(next) => {
                  setSupplierOpt(next);
                  if (next) {
                    setFormData((prev) => ({
                      ...prev,
                      supplier_name: next.trade_name || next.name,
                      supplier_document: next.document ?? '',
                      supplier_id: next.id,
                    }));
                  }
                }}
                inputValue={supplierModalInput}
                onInputChange={(v) => {
                  setSupplierModalInput(v);
                  setSupplierOpt(null);
                }}
                options={supplierOptions}
                loading={supplierLoading}
                getOptionLabel={(o) => o.trade_name || o.name}
                placeholder="Buscar por nome ou CNPJ..."
              />

              <div>
                <Label htmlFor="ap-description">Descrição *</Label>
                <Input
                  id="ap-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="ap-amount">Valor *</Label>
                  <Input
                    id="ap-amount"
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ap-due">Vencimento *</Label>
                  <Input
                    id="ap-due"
                    type="date"
                    min={!editingPayable ? todayMin : undefined}
                    value={formData.due_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ap-comp">Competência</Label>
                  <Input
                    id="ap-comp"
                    type="date"
                    min={!editingPayable ? todayMin : undefined}
                    value={(formData.competence_date as string) || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, competence_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ap-invoice-num">Nº documento / NF</Label>
                  <Input
                    id="ap-invoice-num"
                    value={formData.invoice_number || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, invoice_number: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ap-invoice-file">Anexo (PDF/imagem)</Label>
                  <Input
                    id="ap-invoice-file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="text-xs sm:text-sm"
                    onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
                  />
                  {formData.invoice_file_url && !invoiceFile ? (
                    <p className="text-muted-foreground mt-1 text-xs">Arquivo já enviado</p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={formData.expense_category_id ? (formData.expense_category_id as string) : '__none__'}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        expense_category_id: value === '__none__' ? undefined : value,
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
                <CostCenterSelect
                  orgId={orgId}
                  value={(formData.cost_center_id as string) ?? ''}
                  onValueChange={(id) =>
                    setFormData((prev) => ({
                      ...prev,
                      cost_center_id: id || undefined,
                    }))
                  }
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
                        value === '__none__' ? undefined : (value as AccountsPayable['payment_method']),
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
                      : FALLBACK_PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {paymentMethodLabel(m)}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ap-notes">Observações</Label>
                <Textarea
                  id="ap-notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => handleModalChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || apCreateDatesInvalid}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {dueAlertFilter && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-primary/30 bg-primary/5 p-3 sm:p-4">
          <p className="text-xs sm:text-sm">
            Filtro de alertas: vencimentos em hoje, em 3 dias e em 7 dias.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto shrink-0"
            onClick={() => {
              setDueAlertFilter(false);
              setSearchParams((prev) => {
                const n = new URLSearchParams(prev);
                n.delete('dueAlerts');
                return n;
              });
            }}
          >
            Limpar filtro
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-4">
            <CardTitle className="text-xs font-medium sm:text-sm">Total</CardTitle>
            <Building2 className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg font-bold sm:text-2xl">{summary.all}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-4">
            <CardTitle className="text-xs font-medium sm:text-sm">Pendentes</CardTitle>
            <Clock className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg font-bold text-warning sm:text-2xl">{summary.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-4">
            <CardTitle className="text-xs font-medium sm:text-sm">Vencidas</CardTitle>
            <AlertTriangle className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg font-bold text-destructive sm:text-2xl">{summary.overdue}</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-4">
            <CardTitle className="text-xs font-medium sm:text-sm">Valor pendente</CardTitle>
            <DollarSign className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-lg font-bold text-destructive sm:text-2xl whitespace-nowrap">
              {formatBRL(summary.pendingAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative max-w-sm flex-1">
          <Input
            placeholder="Buscar fornecedor ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
          <Filter className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground sm:h-4 sm:w-4" />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="flex h-auto w-full flex-wrap gap-1 overflow-x-auto p-1">
          <TabsTrigger value="all" className="flex-shrink-0 text-xs sm:text-sm">
            Todas ({summary.all})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-shrink-0 text-xs sm:text-sm">
            Pendentes ({summary.pending})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex-shrink-0 text-xs sm:text-sm">
            Vencidas ({summary.overdue})
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex-shrink-0 text-xs sm:text-sm">
            Pagas ({summary.paid})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-0 sm:p-2">
              <AccountsPayableListTable
                loading={loading}
                rows={payables}
                columns={apColumns}
                keyExtractor={(p) => p.id as string}
              />
              <div className="flex flex-col gap-2 border-t px-3 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:text-sm">
                <span>
                  Mostrando{' '}
                  {listMeta.count === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, listMeta.count)} de {listMeta.count} itens
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={currentPage <= 1 || loading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={currentPage >= listMeta.totalPages || loading}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
