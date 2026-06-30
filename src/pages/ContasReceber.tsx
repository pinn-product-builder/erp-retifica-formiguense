import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { History, Pencil, Wallet, Handshake } from 'lucide-react';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { AccountsReceivableListTable } from '@/components/financial/accounts-receivable/AccountsReceivableListTable';
import { RenegotiationDialog } from '@/components/financial/accounts-receivable/RenegotiationDialog';
import { NegotiationDialog } from '@/components/financial/accounts-receivable/NegotiationDialog';
import { ArNegotiationService, type ArNegotiationState } from '@/services/financial/arNegotiationService';
import { ResponsiveTable, type ResponsiveTableColumn } from '@/components/ui/responsive-table';
import {
  FinancialAsyncCombobox,
  type FinancialAsyncComboboxProps,
} from '@/components/financial/FinancialAsyncCombobox';
import { CostCenterSelect } from '@/components/financial/CostCenterSelect';
import { useFinancial } from '@/hooks/useFinancial';
import { useFinancialOrgScope } from '@/hooks/useFinancialOrgScope';
import { FinancialOrgScopeSelect } from '@/components/financial/FinancialOrgScopeSelect';
import { useOrganization } from '@/hooks/useOrganization';
import { CustomerLookupService } from '@/services/financial/customerLookupService';
import { OrderService, type OrderWithDetails } from '@/services/OrderService';
import { BudgetLookupService, type BudgetListItem } from '@/services/financial/budgetLookupService';
import type { Database } from '@/integrations/supabase/types';
import type { AccountsReceivableListFilters } from '@/services/financial/types';
import { formatBRL, formatDateBR, paymentMethodLabel } from '@/lib/financialFormat';
import { FinancialConfigService } from '@/services/financial/financialConfigService';
import { cn } from '@/lib/utils';
import { getDueAlertCalendarDates } from '@/lib/dueAlertDates';
import { parseMoneyBr } from '@/lib/parseMoneyBr';
import { ArRenegotiationService } from '@/services/financial/arRenegotiationService';
import type { ReceivableSettlementSnapshot } from '@/services/financial/receiptHistoryService';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  isISODateAfterOther,
  isISODateBeforeToday,
  todayISODateLocal,
} from '@/lib/calendarDate';

type ArRow = Database['public']['Tables']['accounts_receivable']['Row'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];
type Pm = Database['public']['Enums']['payment_method'];
type BankAccountRow = Database['public']['Tables']['bank_accounts']['Row'];
type ExpenseCategoryOpt = { id: string; name: string };

function CustomerArCombobox(props: FinancialAsyncComboboxProps<CustomerRow>) {
  return <FinancialAsyncCombobox {...props} />;
}

function OrderArCombobox(props: FinancialAsyncComboboxProps<OrderWithDetails>) {
  return <FinancialAsyncCombobox {...props} />;
}

function BudgetArCombobox(props: FinancialAsyncComboboxProps<BudgetListItem>) {
  return <FinancialAsyncCombobox {...props} />;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  credit_card: 'Cartão crédito',
  debit_card: 'Cartão débito',
  bank_transfer: 'Transferência',
  check: 'Cheque',
  boleto: 'Boleto',
};

type PmCatalogRow = Database['public']['Tables']['payment_methods']['Row'];

const FALLBACK_PM_KEYS = Object.keys(METHOD_LABELS) as Pm[];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
  renegotiated: 'Renegociado',
};

function statusBadgeClass(status: string) {
  if (status === 'overdue') return 'border-destructive text-destructive';
  if (status === 'paid') return 'border-success bg-success/10 text-success';
  return '';
}

export default function ContasReceber() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id ?? '';
  const {
    groupOrgIds,
    effectiveOrgIds,
    scopeSelection,
    setScopeSelection,
    showGroupFilter,
    isConsolidatedView,
    orgLabel,
  } = useFinancialOrgScope();
  const writeOrgId = effectiveOrgIds.length === 1 ? effectiveOrgIds[0] : '';
  const lookupOrgId = writeOrgId || orgId;
  const {
    loading,
    getAccountsReceivable,
    getReceivableTotals,
    createAccountsReceivable,
    updateAccountsReceivable,
    listReceiptHistory,
    recordReceiptPayment,
    getReceivableSettlementSnapshot,
    createInstallmentPlan,
  } = useFinancial();

  const [page, setPage] = useState(1);
  const [listVersion, setListVersion] = useState(0);
  const [rows, setRows] = useState<(ArRow & Record<string, unknown>)[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [totals, setTotals] = useState({ open: 0, overdue: 0, received: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [competenceFrom, setCompetenceFrom] = useState('');
  const [competenceTo, setCompetenceTo] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [dueAlertFilter, setDueAlertFilter] = useState(false);
  const [parcelAmountInput, setParcelAmountInput] = useState('');
  const [debouncedParcelAmount, setDebouncedParcelAmount] = useState('');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
  const [pmCatalog, setPmCatalog] = useState<PmCatalogRow[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentSnapshot, setPaymentSnapshot] = useState<ReceivableSettlementSnapshot | null>(null);
  const [selectedRow, setSelectedRow] = useState<(ArRow & Record<string, unknown>) | null>(null);
  const [historyRows, setHistoryRows] = useState<Record<string, unknown>[]>([]);

  const [customerFilterOpt, setCustomerFilterOpt] = useState<CustomerRow | null>(null);
  const [dialogCustomerOpt, setDialogCustomerOpt] = useState<CustomerRow | null>(null);
  const [customerFilterInput, setCustomerFilterInput] = useState('');
  const [customerDialogInput, setCustomerDialogInput] = useState('');
  const [customerOptions, setCustomerOptions] = useState<CustomerRow[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  const [orderFilterOpt, setOrderFilterOpt] = useState<OrderWithDetails | null>(null);
  const [dialogOrderOpt, setDialogOrderOpt] = useState<OrderWithDetails | null>(null);
  const [orderFilterInput, setOrderFilterInput] = useState('');
  const [orderDialogInput, setOrderDialogInput] = useState('');
  const [orderOptions, setOrderOptions] = useState<OrderWithDetails[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);

  const [budgetFilterOpt, setBudgetFilterOpt] = useState<BudgetListItem | null>(null);
  const [dialogBudgetOpt, setDialogBudgetOpt] = useState<BudgetListItem | null>(null);
  const [budgetFilterInput, setBudgetFilterInput] = useState('');
  const [budgetDialogInput, setBudgetDialogInput] = useState('');
  const [budgetOptions, setBudgetOptions] = useState<BudgetListItem[]>([]);
  const [budgetLoading, setBudgetLoading] = useState(false);

  const [form, setForm] = useState({
    amount: '',
    due_date: '',
    competence_date: '',
    payment_method: '' as Pm | '',
    notes: '',
    invoice_number: '',
    cost_center_id: '',
    expense_category_id: '',
    freeze_competence: false,
  });

  const [installForm, setInstallForm] = useState({
    total_amount: '',
    installments: '2',
    first_due_date: '',
    competence_date: '',
    expense_category_id: '',
    freeze_competence: false,
  });

  const [categoryOptions, setCategoryOptions] = useState<ExpenseCategoryOpt[]>([]);

  const [payForm, setPayForm] = useState({
    amount_received: '',
    received_at: '',
    payment_method: '' as Pm | '',
    late_fee_charged: '0',
    discount_applied: '0',
    notes: '',
    bank_account_id: '',
  });

  const [paymentBankAccounts, setPaymentBankAccounts] = useState<BankAccountRow[]>([]);
  const [paymentBankAccountsLoading, setPaymentBankAccountsLoading] = useState(false);

  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [negotiationRow, setNegotiationRow] = useState<(ArRow & Record<string, unknown>) | null>(null);
  const [negotiationState, setNegotiationState] = useState<ArNegotiationState | null>(null);

  const [renegOpen, setRenegOpen] = useState(false);
  const [renegForm, setRenegForm] = useState({
    installments: '3',
    first_due_date: '',
    competence_date: '',
    reason: '',
  });

  const buildFilters = useCallback((): AccountsReceivableListFilters => {
    const f: AccountsReceivableListFilters = {};
    if (statusFilter !== 'all') f.status = statusFilter as AccountsReceivableListFilters['status'];
    if (dueAlertFilter) f.dueOnDates = getDueAlertCalendarDates();
    else {
      if (dueFrom) f.dueFrom = dueFrom;
      if (dueTo) f.dueTo = dueTo;
    }
    if (customerFilterOpt) f.customerId = customerFilterOpt.id;
    if (orderFilterOpt) f.orderId = orderFilterOpt.id;
    if (budgetFilterOpt) f.budgetId = budgetFilterOpt.id;
    const parsedAmount = parseMoneyBr(debouncedParcelAmount);
    if (parsedAmount != null) f.amountEquals = parsedAmount;
    if (debouncedCustomerSearch) f.customerText = debouncedCustomerSearch;
    if (competenceFrom) f.competenceFrom = competenceFrom;
    if (competenceTo) f.competenceTo = competenceTo;
    if (expenseCategoryFilter) f.expenseCategoryId = expenseCategoryFilter;
    return f;
  }, [
    statusFilter,
    dueFrom,
    dueTo,
    dueAlertFilter,
    customerFilterOpt,
    orderFilterOpt,
    budgetFilterOpt,
    debouncedParcelAmount,
    debouncedCustomerSearch,
    competenceFrom,
    competenceTo,
    expenseCategoryFilter,
  ]);

  useEffect(() => {
    if (searchParams.get('dueAlerts') === '1') setDueAlertFilter(true);
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedParcelAmount(parcelAmountInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [parcelAmountInput]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedCustomerSearch(customerSearchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [customerSearchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedParcelAmount, debouncedCustomerSearch]);

  useEffect(() => {
    if (!lookupOrgId) return;
    void FinancialConfigService.listPaymentMethodsForContext(lookupOrgId, 'receivable').then(setPmCatalog);
  }, [lookupOrgId]);

  useEffect(() => {
    if (!lookupOrgId) {
      setCategoryOptions([]);
      return;
    }
    void FinancialConfigService.listExpenseCategories(lookupOrgId).then((cats) => {
      setCategoryOptions(
        (cats as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name }))
      );
    });
  }, [lookupOrgId]);

  useEffect(() => {
    if (effectiveOrgIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const filters = buildFilters();
      const [listRes, t] = await Promise.all([
        getAccountsReceivable(effectiveOrgIds, page, 10, filters),
        getReceivableTotals(effectiveOrgIds, filters),
      ]);
      if (cancelled) return;
      if (listRes.totalPages >= 1 && page > listRes.totalPages) {
        setPage(1);
        return;
      }
      setRows(listRes.data as (ArRow & Record<string, unknown>)[]);
      setTotalPages(listRes.totalPages);
      setCount(listRes.count);
      setTotals(t);
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveOrgIds, page, buildFilters, listVersion, getAccountsReceivable, getReceivableTotals]);

  useEffect(() => {
    const q = dialogOpen || installDialogOpen ? customerDialogInput : customerFilterInput;
    if (!lookupOrgId || !q.trim()) {
      setCustomerOptions([]);
      return;
    }
    const t = setTimeout(() => {
      setCustomerLoading(true);
      void CustomerLookupService.search(lookupOrgId, q, 1, 20).then((r) => {
        setCustomerOptions(r.data);
        setCustomerLoading(false);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [customerFilterInput, customerDialogInput, dialogOpen, installDialogOpen, lookupOrgId]);

  useEffect(() => {
    const q = dialogOpen || installDialogOpen ? orderDialogInput : orderFilterInput;
    if (!lookupOrgId || !q.trim()) {
      setOrderOptions([]);
      return;
    }
    const t = setTimeout(() => {
      setOrderLoading(true);
      void OrderService.searchOrders({
        orgId: lookupOrgId,
        searchTerm: q,
        page: 1,
        limit: 15,
      }).then((r) => {
        setOrderOptions(r.orders);
        setOrderLoading(false);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [orderFilterInput, orderDialogInput, dialogOpen, installDialogOpen, lookupOrgId]);

  useEffect(() => {
    const q = dialogOpen || installDialogOpen ? budgetDialogInput : budgetFilterInput;
    if (!lookupOrgId || !q.trim()) {
      setBudgetOptions([]);
      return;
    }
    const t = setTimeout(() => {
      setBudgetLoading(true);
      void BudgetLookupService.search(lookupOrgId, q, 1, 15).then((r) => {
        setBudgetOptions(r.data);
        setBudgetLoading(false);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [budgetFilterInput, budgetDialogInput, dialogOpen, installDialogOpen, lookupOrgId]);

  const openEdit = async (row: ArRow & Record<string, unknown>) => {
    if (row.status === 'paid' || row.status === 'cancelled') {
      toast.error('Não é possível editar título pago ou cancelado');
      return;
    }
    const rowOrg = (row.org_id as string) || orgId;
    if (!rowOrg) return;
    setSelectedRow(row);
    const cust = await CustomerLookupService.getById(rowOrg, row.customer_id as string);
    setDialogCustomerOpt(cust);
    setCustomerDialogInput(cust?.name ?? '');
    setDialogOrderOpt(null);
    setDialogBudgetOpt(null);
    setOrderDialogInput('');
    setBudgetDialogInput('');
    setForm({
      amount: String(row.amount),
      due_date: (row.due_date as string) ?? '',
      competence_date: (row.competence_date as string) ?? (row.due_date as string) ?? '',
      payment_method: (row.payment_method as Pm) || '',
      notes: (row.notes as string) || '',
      invoice_number: (row.invoice_number as string) || '',
      cost_center_id: (row.cost_center_id as string) || '',
      expense_category_id: (row.expense_category_id as string) || '',
      freeze_competence: Boolean((row as { freeze_competence?: boolean }).freeze_competence),
    });
    setDialogOpen(true);
  };

  const openRenegotiate = (row: ArRow & Record<string, unknown>) => {
    if (row.status === 'paid' || row.status === 'cancelled') {
      toast.error('Título não elegível');
      return;
    }
    setSelectedRow(row);
    setRenegForm({
      installments: '3',
      first_due_date: new Date().toISOString().slice(0, 10),
      competence_date: new Date().toISOString().slice(0, 10),
      reason: '',
    });
    setRenegOpen(true);
  };

  const submitRenegotiate = async () => {
    const rowOrg = (selectedRow?.org_id as string) || orgId;
    if (!rowOrg || !selectedRow) return;
    const res = await ArRenegotiationService.rescheduleOpenBalance({
      orgId: rowOrg,
      userId: user?.id ?? null,
      receivableIds: [selectedRow.id as string],
      newInstallments: Number(renegForm.installments),
      firstDueDate: renegForm.first_due_date,
      competenceDate: renegForm.competence_date || renegForm.first_due_date,
      reason: renegForm.reason || null,
    });
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success('Renegociação registrada');
    setRenegOpen(false);
    setListVersion((v) => v + 1);
  };

  const openNew = () => {
    setSelectedRow(null);
    setDialogCustomerOpt(null);
    setDialogOrderOpt(null);
    setDialogBudgetOpt(null);
    setCustomerDialogInput('');
    setOrderDialogInput('');
    setBudgetDialogInput('');
    setForm({
      amount: '',
      due_date: '',
      competence_date: '',
      payment_method: '',
      notes: '',
      invoice_number: '',
      cost_center_id: '',
      expense_category_id: '',
      freeze_competence: false,
    });
    setDialogOpen(true);
  };

  const submitForm = async () => {
    if (!dialogCustomerOpt) return;
    const payload = {
      customer_id: dialogCustomerOpt.id,
      order_id: dialogOrderOpt?.id ?? null,
      budget_id: dialogBudgetOpt?.id ?? null,
      amount: Number(form.amount.replace(',', '.')),
      due_date: form.due_date,
      competence_date: form.competence_date || form.due_date,
      payment_method: form.payment_method || null,
      notes: form.notes || null,
      invoice_number: form.invoice_number || null,
      installment_number: 1,
      total_installments: 1,
      cost_center_id: form.cost_center_id || null,
      expense_category_id: form.expense_category_id || null,
      freeze_competence: form.freeze_competence,
    };
    if (selectedRow) {
      await updateAccountsReceivable(
        selectedRow.id as string,
        {
          ...payload,
          installment_number: (selectedRow.installment_number as number) ?? 1,
          total_installments: (selectedRow.total_installments as number) ?? 1,
        } as never,
        (selectedRow.org_id as string) || undefined
      );
    } else {
      if (!writeOrgId) {
        toast.error('Selecione uma empresa única para lançar.');
        return;
      }
      await createAccountsReceivable(payload, writeOrgId);
    }
    setDialogOpen(false);
    if (!selectedRow) {
      setPage(1);
    }
    setListVersion((v) => v + 1);
  };

  const submitInstall = async () => {
    if (!dialogCustomerOpt) return;
    if (!writeOrgId) {
      toast.error('Selecione uma empresa única para parcelar.');
      return;
    }
    const ok = await createInstallmentPlan(
      {
        customer_id: dialogCustomerOpt.id,
        order_id: dialogOrderOpt?.id ?? null,
        budget_id: dialogBudgetOpt?.id ?? null,
        total_amount: Number(installForm.total_amount.replace(',', '.')),
        first_due_date: installForm.first_due_date,
        competence_date: installForm.competence_date || installForm.first_due_date,
        installments: Number(installForm.installments),
        payment_method: (form.payment_method || undefined) as Pm | undefined,
        notes: form.notes || null,
        cost_center_id: form.cost_center_id || null,
        expense_category_id: installForm.expense_category_id || null,
        freeze_competence: installForm.freeze_competence,
      },
      writeOrgId
    );
    if (ok) {
      setInstallDialogOpen(false);
      setPage(1);
      setListVersion((v) => v + 1);
    }
  };

  const openHistory = async (row: ArRow & Record<string, unknown>) => {
    setSelectedRow(row);
    const h = await listReceiptHistory(row.id as string, (row.org_id as string) || undefined);
    setHistoryRows(h as unknown as Record<string, unknown>[]);
    setHistoryOpen(true);
  };

  const openPayment = async (row: ArRow & Record<string, unknown>) => {
    setSelectedRow(row);
    const snap = await getReceivableSettlementSnapshot(
      row.id as string,
      (row.org_id as string) || undefined
    );
    setPaymentSnapshot(snap);
    const defaultAmt =
      snap && snap.remaining > 0 ? String(snap.remaining).replace('.', ',') : String(row.amount);
    setPayForm({
      amount_received: defaultAmt,
      received_at: new Date().toISOString().slice(0, 10),
      payment_method: (row.payment_method as Pm) || '',
      late_fee_charged: '0',
      discount_applied: '0',
      notes: '',
      bank_account_id: '',
    });
    setPaymentOpen(true);
    const rowOrgId = (row.org_id as string) || orgId;
    if (rowOrgId) {
      setPaymentBankAccountsLoading(true);
      try {
        const list = await FinancialConfigService.listBankAccounts(rowOrgId, true);
        setPaymentBankAccounts(list);
        if (list.length === 1) {
          setPayForm((f) => ({ ...f, bank_account_id: list[0].id }));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao carregar contas bancárias');
        setPaymentBankAccounts([]);
      } finally {
        setPaymentBankAccountsLoading(false);
      }
    } else {
      setPaymentBankAccounts([]);
    }
  };

  const openNegotiation = (row: ArRow & Record<string, unknown>) => {
    setNegotiationRow(row);
    setNegotiationState(ArNegotiationService.stateFromRow(row));
    setNegotiationOpen(true);
  };

  const submitPayment = async () => {
    if (!selectedRow) return;
    if (!payForm.bank_account_id) {
      toast.error('Informe a conta bancária ou caixa de origem do pagamento');
      return;
    }
    const ok = await recordReceiptPayment(
      {
        receivable_account_id: selectedRow.id as string,
        amount_received: Number(payForm.amount_received.replace(',', '.')),
        received_at: payForm.received_at,
        payment_method: payForm.payment_method || null,
        late_fee_charged: Number(payForm.late_fee_charged) || 0,
        discount_applied: Number(payForm.discount_applied) || 0,
        notes: payForm.notes || null,
        bank_account_id: payForm.bank_account_id,
      },
      (selectedRow.org_id as string) || undefined
    );
    if (ok) {
      setPaymentOpen(false);
      setListVersion((v) => v + 1);
    }
  };

  const fmt = (n: number) => formatBRL(n);

  const arColumns: ResponsiveTableColumn<ArRow & Record<string, unknown>>[] = [
    ...(isConsolidatedView
      ? [
          {
            key: 'org',
            header: 'Empresa',
            mobileLabel: 'Empresa',
            priority: 1,
            render: (row: ArRow & Record<string, unknown>) => orgLabel((row.org_id as string) ?? ''),
          } satisfies ResponsiveTableColumn<ArRow & Record<string, unknown>>,
        ]
      : []),
      {
        key: 'customer',
        header: 'Cliente',
        mobileLabel: 'Cliente',
        priority: 1,
        render: (row) => (row.customers as { name?: string } | null)?.name ?? '—',
      },
      {
        key: 'order',
        header: 'OS',
        mobileLabel: 'OS',
        priority: 3,
        render: (row) => (row.orders as { order_number?: string } | null)?.order_number ?? '—',
      },
      {
        key: 'amount',
        header: 'Valor original',
        mobileLabel: 'Original',
        priority: 2,
        minWidth: 110,
        render: (row) => <span className="whitespace-nowrap font-medium">{fmt(Number(row.amount))}</span>,
      },
      {
        key: 'paid',
        header: 'Pago',
        mobileLabel: 'Pago',
        priority: 3,
        minWidth: 100,
        render: (row) => {
          const received = Number((row as { total_received?: number }).total_received ?? 0);
          return (
            <span className={cn('whitespace-nowrap', received > 0 ? 'text-success' : 'text-muted-foreground')}>
              {fmt(received)}
            </span>
          );
        },
      },
      {
        key: 'remaining',
        header: 'Pendente',
        mobileLabel: 'Pendente',
        priority: 3,
        minWidth: 100,
        render: (row) => {
          const remaining = Number(
            (row as { remaining_amount?: number }).remaining_amount ??
              Number(row.amount) + Number((row as { late_fee?: number | null }).late_fee ?? 0)
          );
          const isPaid = (row.status as string) === 'paid';
          return (
            <span
              className={cn(
                'whitespace-nowrap font-medium',
                isPaid || remaining === 0 ? 'text-muted-foreground' : 'text-destructive'
              )}
            >
              {fmt(remaining)}
            </span>
          );
        },
      },
      {
        key: 'due',
        header: 'Vencimento',
        mobileLabel: 'Venc.',
        priority: 4,
        render: (row) => formatDateBR(row.due_date as string),
      },
      {
        key: 'comp',
        header: 'Competência',
        hideInMobile: true,
        priority: 5,
        render: (row) => formatDateBR((row.competence_date as string) ?? null),
      },
      {
        key: 'status',
        header: 'Status',
        mobileLabel: 'Status',
        priority: 6,
        render: (row) => {
          const st = row.status as string;
          return (
            <Badge variant="outline" className={cn('text-xs', statusBadgeClass(st))}>
              {STATUS_LABELS[st] ?? st}
            </Badge>
          );
        },
      },
      {
        key: 'audit',
        header: 'Auditoria',
        mobileLabel: 'Auditoria',
        priority: 8,
        minWidth: 200,
        render: (row) => {
          const ext = row as ArRow & {
            audit_created_by_name?: string | null;
            audit_updated_by_name?: string | null;
          };
          const created = ext.audit_created_by_name?.trim() || null;
          const updated = ext.audit_updated_by_name?.trim() || null;
          const title = [created && `Criado: ${created}`, updated && `Editado: ${updated}`]
            .filter(Boolean)
            .join(' · ');
          return (
            <div
              className="flex min-w-0 max-w-[11rem] flex-col gap-0.5 text-xs sm:max-w-[15rem]"
              title={title || undefined}
            >
              <div className="flex min-w-0 items-baseline gap-1.5">
                <span className="shrink-0 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                  Criado
                </span>
                <span className="min-w-0 truncate font-medium text-foreground">{created ?? '—'}</span>
              </div>
              <div className="flex min-w-0 items-baseline gap-1.5">
                <span className="shrink-0 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                  Editado
                </span>
                <span className="min-w-0 truncate font-medium text-foreground">{updated ?? '—'}</span>
              </div>
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: 'Ações',
        mobileLabel: 'Ações',
        priority: 7,
        minWidth: 140,
        render: (row) => (
          <TooltipProvider delayDuration={300}>
            <div className="flex flex-wrap justify-end gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    disabled={isConsolidatedView}
                    onClick={() => void openHistory(row)}
                  >
                    <History className="h-3 w-3 sm:h-4 sm:h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Histórico</TooltipContent>
              </Tooltip>
              {row.status !== 'paid' && row.status !== 'cancelled' && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        disabled={isConsolidatedView}
                        onClick={() => void openEdit(row)}
                      >
                        <Pencil className="h-3 w-3 sm:h-4 sm:h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        disabled={isConsolidatedView}
                        onClick={() => openRenegotiate(row)}
                      >
                        <span className="text-xs font-semibold">R</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Renegociar</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={
                          ArNegotiationService.stateFromRow(row).isActive ? 'default' : 'ghost'
                        }
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        disabled={isConsolidatedView}
                        onClick={() => openNegotiation(row)}
                      >
                        <Handshake className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {ArNegotiationService.stateFromRow(row).isActive
                        ? 'Em negociação (régua pausada)'
                        : 'Negociação individual'}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        disabled={isConsolidatedView}
                        onClick={() => void openPayment(row)}
                      >
                        <Wallet className="h-3 w-3 sm:h-4 sm:h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Receber</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </TooltipProvider>
        ),
      },
    ];

  const todayMin = todayISODateLocal();
  const isCreatingAr = !selectedRow;
  const arCreateDatesInvalid =
    isCreatingAr &&
    (isISODateBeforeToday(form.due_date) ||
      (form.competence_date.trim() !== '' &&
        (isISODateBeforeToday(form.competence_date) ||
          isISODateAfterOther(form.competence_date, form.due_date))));
  const installDatesInvalid =
    !installForm.first_due_date.trim() ||
    isISODateBeforeToday(installForm.first_due_date) ||
    (installForm.competence_date.trim() !== '' &&
      (isISODateBeforeToday(installForm.competence_date) ||
        isISODateAfterOther(installForm.competence_date, installForm.first_due_date)));

  return (
    <FinancialPageShell>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Contas a receber</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Filtros por valor da parcela (extrato), cliente/NF e status; totais e lançamentos por cliente, OS e orçamento
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:w-auto min-w-0">
            {showGroupFilter ? (
              <FinancialOrgScopeSelect
                groupOrgIds={groupOrgIds}
                scopeSelection={scopeSelection}
                onScopeChange={setScopeSelection}
                orgLabel={orgLabel}
              />
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isConsolidatedView || !writeOrgId}
              onClick={() => setInstallDialogOpen(true)}
            >
              Parcelar
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={isConsolidatedView || !writeOrgId}
              onClick={openNew}
            >
              Nova conta
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <p className="text-muted-foreground text-xs sm:text-sm">Em aberto</p>
              <p className="text-lg font-bold sm:text-xl md:text-2xl">{fmt(totals.open)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <p className="text-muted-foreground text-xs sm:text-sm">Vencido</p>
              <p className="text-destructive text-lg font-bold sm:text-xl md:text-2xl">{fmt(totals.overdue)}</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <p className="text-muted-foreground text-xs sm:text-sm">Recebido (filtro)</p>
              <p className="text-success text-lg font-bold sm:text-xl md:text-2xl">{fmt(totals.received)}</p>
            </CardContent>
          </Card>
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

        <Card className="p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="ar-status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="ar-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="renegotiated">Renegociado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-due-from">Vencimento de</Label>
              <Input
                id="ar-due-from"
                type="date"
                value={dueFrom}
                disabled={dueAlertFilter}
                onChange={(e) => setDueFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-due-to">Vencimento até</Label>
              <Input
                id="ar-due-to"
                type="date"
                value={dueTo}
                disabled={dueAlertFilter}
                onChange={(e) => setDueTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-comp-from">Competência de</Label>
              <Input
                id="ar-comp-from"
                type="date"
                value={competenceFrom}
                onChange={(e) => setCompetenceFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-comp-to">Competência até</Label>
              <Input
                id="ar-comp-to"
                type="date"
                value={competenceTo}
                onChange={(e) => setCompetenceTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-cat-filter">Categoria (plano de contas)</Label>
              <Select
                value={expenseCategoryFilter || '__all__'}
                onValueChange={(v) => setExpenseCategoryFilter(v === '__all__' ? '' : v)}
              >
                <SelectTrigger id="ar-cat-filter">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" className="h-10 w-full" onClick={() => setPage(1)}>
                Aplicar
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ar-parcel-amount">Valor da parcela (R$)</Label>
              <Input
                id="ar-parcel-amount"
                inputMode="decimal"
                placeholder="Ex.: 3429 ou 3.429,00"
                value={parcelAmountInput}
                onChange={(e) => setParcelAmountInput(e.target.value)}
                autoComplete="off"
              />
              <p className="text-muted-foreground text-xs">
                Busca duplicatas com esse valor (pendente, pago ou outro status).
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
              <Label htmlFor="ar-customer-search">Nome, CPF/CNPJ ou NF</Label>
              <Input
                id="ar-customer-search"
                placeholder="Combina com valor e status; opcional se já escolheu o cliente abaixo"
                value={customerSearchInput}
                onChange={(e) => setCustomerSearchInput(e.target.value)}
                autoComplete="off"
              />
              <p className="text-muted-foreground text-xs">
                Cruza com nome ou documento do cadastro e com o número da nota fiscal no lançamento.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <CustomerArCombobox
              label="Cliente"
              value={customerFilterOpt}
              onChange={setCustomerFilterOpt}
              inputValue={customerFilterInput}
              onInputChange={(v) => {
                setCustomerFilterInput(v);
                setCustomerFilterOpt(null);
              }}
              options={customerOptions}
              loading={customerLoading}
              getOptionLabel={(o) => o.name}
              emptyText="Digite para buscar cliente"
              listZIndexClass="z-[100]"
            />
            <OrderArCombobox
              label="OS"
              value={orderFilterOpt}
              onChange={setOrderFilterOpt}
              inputValue={orderFilterInput}
              onInputChange={(v) => {
                setOrderFilterInput(v);
                setOrderFilterOpt(null);
              }}
              options={orderOptions}
              loading={orderLoading}
              getOptionLabel={(o) => `${o.order_number} — ${o.customer?.name ?? ''}`}
              emptyText="Digite para buscar OS"
              listZIndexClass="z-[100]"
            />
            <BudgetArCombobox
              label="Orçamento"
              value={budgetFilterOpt}
              onChange={setBudgetFilterOpt}
              inputValue={budgetFilterInput}
              onInputChange={(v) => {
                setBudgetFilterInput(v);
                setBudgetFilterOpt(null);
              }}
              options={budgetOptions}
              loading={budgetLoading}
              getOptionLabel={(o) =>
                `${o.budget_number ?? o.id} — OS ${(o.orders as { order_number?: string } | null)?.order_number ?? ''}`
              }
              emptyText="Digite para buscar orçamento"
              listZIndexClass="z-[100]"
            />
          </div>
        </Card>

        <AccountsReceivableListTable
          loading={loading}
          rows={rows}
          columns={arColumns}
          keyExtractor={(r) => r.id as string}
        />

        <div className="flex flex-col items-center gap-2">
          <p className="text-muted-foreground text-xs sm:text-sm">
            Mostrando {(page - 1) * 10 + 1} a {Math.min(page * 10, count)} de {count} itens — página {page} /{' '}
            {totalPages || 1}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-muted-foreground text-xs sm:text-sm">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-left text-xl sm:text-2xl">
              {selectedRow ? 'Editar' : 'Nova'} conta a receber
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              void submitForm();
            }}
          >
            <CustomerArCombobox
              label="Cliente"
              required
              value={dialogCustomerOpt}
              onChange={setDialogCustomerOpt}
              inputValue={customerDialogInput}
              onInputChange={(v) => {
                setCustomerDialogInput(v);
                setDialogCustomerOpt(null);
              }}
              options={customerOptions}
              loading={customerLoading}
              getOptionLabel={(o) => o.name}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <OrderArCombobox
                label="OS (opcional)"
                value={dialogOrderOpt}
                onChange={setDialogOrderOpt}
                inputValue={orderDialogInput}
                onInputChange={(v) => {
                  setOrderDialogInput(v);
                  setDialogOrderOpt(null);
                }}
                options={orderOptions}
                loading={orderLoading}
                getOptionLabel={(o) => `${o.order_number} — ${o.customer?.name ?? ''}`}
              />
              <BudgetArCombobox
                label="Orçamento (opcional)"
                value={dialogBudgetOpt}
                onChange={setDialogBudgetOpt}
                inputValue={budgetDialogInput}
                onInputChange={(v) => {
                  setBudgetDialogInput(v);
                  setDialogBudgetOpt(null);
                }}
                options={budgetOptions}
                loading={budgetLoading}
                getOptionLabel={(o) => String(o.budget_number ?? o.id)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ar-amount">Valor *</Label>
                <Input
                  id="ar-amount"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ar-due">Vencimento *</Label>
                <Input
                  id="ar-due"
                  type="date"
                  min={isCreatingAr ? todayMin : undefined}
                  value={form.due_date}
                  onChange={(e) =>
                    setForm((f) => {
                      const nextDue = e.target.value;
                      const shouldFollow =
                        !f.freeze_competence && (!f.competence_date || f.competence_date === f.due_date);
                      return {
                        ...f,
                        due_date: nextDue,
                        competence_date: shouldFollow ? nextDue : f.competence_date,
                      };
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ar-competence">Competência</Label>
                <Input
                  id="ar-competence"
                  type="date"
                  min={isCreatingAr ? todayMin : undefined}
                  value={form.competence_date}
                  onChange={(e) => setForm((f) => ({ ...f, competence_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ar-payment-method">Forma de recebimento</Label>
                <Select
                  value={form.payment_method ? form.payment_method : '__none__'}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, payment_method: v === '__none__' ? ('' as Pm | '') : (v as Pm) }))
                  }
                >
                  <SelectTrigger id="ar-payment-method">
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
                      : FALLBACK_PM_KEYS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {METHOD_LABELS[k] ?? paymentMethodLabel(k)}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ar-invoice">Nº documento</Label>
                <Input
                  id="ar-invoice"
                  value={form.invoice_number}
                  onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CostCenterSelect
                orgId={lookupOrgId}
                value={form.cost_center_id}
                onValueChange={(id) => setForm((f) => ({ ...f, cost_center_id: id }))}
                id="ar-cost-center"
              />
              <div className="space-y-2">
                <Label htmlFor="ar-category">Categoria (plano de contas)</Label>
                <Select
                  value={form.expense_category_id || '__none__'}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, expense_category_id: v === '__none__' ? '' : v }))
                  }
                >
                  <SelectTrigger id="ar-category">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-md border p-3">
              <Checkbox
                id="ar-freeze"
                checked={form.freeze_competence}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, freeze_competence: v === true }))
                }
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="ar-freeze" className="cursor-pointer">
                  Manter competência fixa
                </Label>
                <p className="text-muted-foreground text-xs">
                  Quando marcado, a competência não acompanha o vencimento se este for alterado.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-notes">Observações</Label>
              <Textarea
                id="ar-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="min-h-[80px] resize-y"
              />
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !dialogCustomerOpt || !form.amount || !form.due_date || arCreateDatesInvalid
                }
              >
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-left text-xl sm:text-2xl">Parcelamento</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              void submitInstall();
            }}
          >
            <CustomerArCombobox
              label="Cliente"
              required
              value={dialogCustomerOpt}
              onChange={setDialogCustomerOpt}
              inputValue={customerDialogInput}
              onInputChange={(v) => {
                setCustomerDialogInput(v);
                setDialogCustomerOpt(null);
              }}
              options={customerOptions}
              loading={customerLoading}
              getOptionLabel={(o) => o.name}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inst-total">Valor total *</Label>
                <Input
                  id="inst-total"
                  inputMode="decimal"
                  value={installForm.total_amount}
                  onChange={(e) => setInstallForm((f) => ({ ...f, total_amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst-n">Parcelas</Label>
                <Input
                  id="inst-n"
                  type="number"
                  min={2}
                  max={60}
                  value={installForm.installments}
                  onChange={(e) => setInstallForm((f) => ({ ...f, installments: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inst-first">1º vencimento *</Label>
                <Input
                  id="inst-first"
                  type="date"
                  min={todayMin}
                  value={installForm.first_due_date}
                  onChange={(e) =>
                    setInstallForm((f) => {
                      const nextDue = e.target.value;
                      const shouldFollow =
                        !f.freeze_competence &&
                        (!f.competence_date || f.competence_date === f.first_due_date);
                      return {
                        ...f,
                        first_due_date: nextDue,
                        competence_date: shouldFollow ? nextDue : f.competence_date,
                      };
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst-comp">Competência</Label>
                <Input
                  id="inst-comp"
                  type="date"
                  min={todayMin}
                  value={installForm.competence_date}
                  onChange={(e) => setInstallForm((f) => ({ ...f, competence_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst-category">Categoria (plano de contas)</Label>
              <Select
                value={installForm.expense_category_id || '__none__'}
                onValueChange={(v) =>
                  setInstallForm((f) => ({ ...f, expense_category_id: v === '__none__' ? '' : v }))
                }
              >
                <SelectTrigger id="inst-category">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-start gap-2 rounded-md border p-3">
              <Checkbox
                id="inst-freeze"
                checked={installForm.freeze_competence}
                onCheckedChange={(v) =>
                  setInstallForm((f) => ({ ...f, freeze_competence: v === true }))
                }
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="inst-freeze" className="cursor-pointer">
                  Manter competência fixa para todas as parcelas
                </Label>
                <p className="text-muted-foreground text-xs">
                  Quando marcado, a competência não acompanha o 1º vencimento se este for alterado.
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setInstallDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={installDatesInvalid}>
                Gerar parcelas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-left text-xl sm:text-2xl">Histórico de recebimentos</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Forma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRows.map((h) => (
                  <TableRow key={h.id as string}>
                    <TableCell>{formatDateBR(h.received_at as string)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{fmt(Number(h.amount_received))}</TableCell>
                    <TableCell>
                      {METHOD_LABELS[(h.payment_method as string) ?? ''] ?? (h.payment_method as string) ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {historyRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      Sem recebimentos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setHistoryOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={paymentOpen}
        onOpenChange={(o) => {
          setPaymentOpen(o);
          if (!o) setPaymentSnapshot(null);
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-left text-xl sm:text-2xl">Registrar recebimento</DialogTitle>
            {paymentSnapshot && (
              <p className="text-xs sm:text-sm text-muted-foreground pt-1">
                Saldo em aberto:{' '}
                <span className="font-medium text-foreground whitespace-nowrap">
                  {formatBRL(paymentSnapshot.remaining)}
                </span>{' '}
                (total do título + multa/juros automáticos: {formatBRL(paymentSnapshot.totalDue)}; já recebido:{' '}
                {formatBRL(paymentSnapshot.totalReceived)})
              </p>
            )}
          </DialogHeader>
          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              void submitPayment();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Valor recebido</Label>
              <Input
                id="pay-amount"
                inputMode="decimal"
                value={payForm.amount_received}
                onChange={(e) => setPayForm((f) => ({ ...f, amount_received: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-date">Data</Label>
              <Input
                id="pay-date"
                type="date"
                value={payForm.received_at}
                onChange={(e) => setPayForm((f) => ({ ...f, received_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-method">Forma</Label>
              <Select
                value={payForm.payment_method ? payForm.payment_method : '__none__'}
                onValueChange={(v) =>
                  setPayForm((f) => ({ ...f, payment_method: v === '__none__' ? ('' as Pm | '') : (v as Pm) }))
                }
              >
                <SelectTrigger id="pay-method">
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
                    : FALLBACK_PM_KEYS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {METHOD_LABELS[k] ?? paymentMethodLabel(k)}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-bank-account">
                Origem do pagamento <span className="text-destructive">*</span>
              </Label>
              <Select
                value={payForm.bank_account_id || '__none__'}
                onValueChange={(v) =>
                  setPayForm((f) => ({ ...f, bank_account_id: v === '__none__' ? '' : v }))
                }
                disabled={paymentBankAccountsLoading}
              >
                <SelectTrigger id="pay-bank-account">
                  <SelectValue
                    placeholder={
                      paymentBankAccountsLoading
                        ? 'Carregando contas…'
                        : paymentBankAccounts.length === 0
                        ? 'Sem contas cadastradas para esta empresa'
                        : 'Selecione banco ou caixa'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" disabled>
                    —
                  </SelectItem>
                  {paymentBankAccounts.map((ba) => {
                    const isCash = ba.kind === 'cash';
                    const label = isCash
                      ? `Caixa · ${ba.name || ba.account_number}`
                      : `${ba.bank_name}${ba.name ? ` · ${ba.name}` : ''}${ba.agency || ba.account_number ? ` (ag. ${ba.agency ?? '—'} · cc ${ba.account_number})` : ''}`;
                    return (
                      <SelectItem key={ba.id} value={ba.id}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {paymentBankAccounts.length === 0 && !paymentBankAccountsLoading && (
                <p className="text-xs text-destructive">
                  Cadastre uma conta bancária ou caixa em Configuração financeira antes de registrar recebimentos.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pay-late">Juros/multa</Label>
                <Input
                  id="pay-late"
                  inputMode="decimal"
                  value={payForm.late_fee_charged}
                  onChange={(e) => setPayForm((f) => ({ ...f, late_fee_charged: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-disc">Desconto</Label>
                <Input
                  id="pay-disc"
                  inputMode="decimal"
                  value={payForm.discount_applied}
                  onChange={(e) => setPayForm((f) => ({ ...f, discount_applied: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-notes">Observações</Label>
              <Input
                id="pay-notes"
                value={payForm.notes}
                onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Confirmar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <RenegotiationDialog
        open={renegOpen}
        onOpenChange={setRenegOpen}
        form={renegForm}
        onFormChange={setRenegForm}
        customerLabel={
          selectedRow
            ? (selectedRow.customers as { name?: string } | null)?.name ?? undefined
            : undefined
        }
        onSubmit={submitRenegotiate}
      />

      <NegotiationDialog
        open={negotiationOpen}
        onOpenChange={setNegotiationOpen}
        receivableId={(negotiationRow?.id as string) ?? null}
        orgId={(negotiationRow?.org_id as string) ?? null}
        initialState={negotiationState}
        userId={user?.id ?? null}
        onChanged={() => {
          setListVersion((v) => v + 1);
        }}
      />
    </FinancialPageShell>
  );
}
