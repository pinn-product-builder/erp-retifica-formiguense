import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import { FinancialConfigService } from '@/services/financial/financialConfigService';
import { CostCenterService } from '@/services/financial/costCenterService';
import { ApprovalApService } from '@/services/financial/approvalApService';
import { ArLateFeeService } from '@/services/financial/arLateFeeService';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { expenseCategoryLabel, paymentMethodLabel } from '@/lib/financialFormat';
import { Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type BankAccountRow = Database['public']['Tables']['bank_accounts']['Row'];
type TierRow = Database['public']['Tables']['approval_tiers_ap']['Row'];

type PaymentMethodEnum = Database['public']['Enums']['payment_method'];

const PAYMENT_METHOD_OPTIONS: PaymentMethodEnum[] = [
  'cash',
  'pix',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'check',
  'boleto',
];

function appliesToLabel(applies: unknown): string {
  const a = applies as string[] | undefined;
  if (!a?.length) return 'Ambos';
  if (a.includes('both')) return 'Ambos';
  if (a.includes('receivable') && a.includes('payable')) return 'Receber e pagar';
  if (a.includes('receivable')) return 'Receber';
  if (a.includes('payable')) return 'Pagar';
  return a.join(', ');
}

function scopeFromApplies(applies: unknown): 'both' | 'receivable' | 'payable' {
  const a = applies as string[] | undefined;
  if (!a?.length) return 'both';
  if (a.includes('both')) return 'both';
  if (a.includes('payable') && !a.includes('receivable')) return 'payable';
  if (a.includes('receivable') && !a.includes('payable')) return 'receivable';
  return 'both';
}

export default function ConfigFinanceiro() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [methods, setMethods] = useState<Record<string, unknown>[]>([]);
  const [centers, setCenters] = useState<Record<string, unknown>[]>([]);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<Database['public']['Enums']['expense_category']>('variable');
  const [ccCode, setCcCode] = useState('');
  const [ccName, setCcName] = useState('');
  const [ccParentId, setCcParentId] = useState('');
  const [pmName, setPmName] = useState('');
  const [pmMethod, setPmMethod] = useState<PaymentMethodEnum>('pix');
  const [pmFeePct, setPmFeePct] = useState('0');
  const [pmFeeFixed, setPmFeeFixed] = useState('');
  const [pmAppliesScope, setPmAppliesScope] = useState<'both' | 'receivable' | 'payable'>('both');
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);
  const [savingCenter, setSavingCenter] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRow[]>([]);
  const [baName, setBaName] = useState('');
  const [baKind, setBaKind] = useState<'bank' | 'cash'>('bank');
  const [baBankName, setBaBankName] = useState('');
  const [baAgency, setBaAgency] = useState('');
  const [baNumber, setBaNumber] = useState('');
  const [baType, setBaType] = useState<'checking' | 'savings' | ''>('');
  const [savingBank, setSavingBank] = useState(false);
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [tierName, setTierName] = useState('');
  const [tierMin, setTierMin] = useState('0');
  const [tierMax, setTierMax] = useState('');
  const [tierSeq, setTierSeq] = useState('0');
  const [tierRole, setTierRole] = useState<string>('');
  const [savingTier, setSavingTier] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [savingCatEdit, setSavingCatEdit] = useState(false);
  const [lfPenalty, setLfPenalty] = useState('2');
  const [lfDaily, setLfDaily] = useState('0.033');
  const [lfGrace, setLfGrace] = useState('0');
  const [lfActive, setLfActive] = useState(true);
  const [lfSaving, setLfSaving] = useState(false);
  const [lfApplying, setLfApplying] = useState(false);

  const load = async () => {
    if (!orgId) return;
    try {
      await FinancialConfigService.ensureDefaultExpenseCategories(orgId);
      const [c, m, cc, ba, tr] = await Promise.all([
        FinancialConfigService.listExpenseCategories(orgId),
        FinancialConfigService.listPaymentMethods(orgId),
        CostCenterService.list(orgId),
        FinancialConfigService.listBankAccounts(orgId, false),
        ApprovalApService.listTiers(orgId),
      ]);
      setCategories(c as unknown as Record<string, unknown>[]);
      setMethods(m as unknown as Record<string, unknown>[]);
      setCenters(cc as unknown as Record<string, unknown>[]);
      setBankAccounts(ba);
      setTiers(tr);
      const rule = await ArLateFeeService.getActiveRule(orgId);
      if (rule) {
        setLfPenalty(String(rule.penalty_percent));
        setLfDaily(String(rule.daily_interest_percent));
        setLfGrace(String(rule.grace_days ?? 0));
        setLfActive(rule.is_active ?? true);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar configurações');
    }
  };

  useEffect(() => {
    void load();
  }, [orgId]);

  const addCategory = async () => {
    if (!orgId) {
      toast.error('Selecione uma organização antes de cadastrar.');
      return;
    }
    if (!catName.trim()) {
      toast.error('Informe o nome da categoria.');
      return;
    }
    setSavingCategory(true);
    try {
      const { error } = await FinancialConfigService.createExpenseCategory({
        org_id: orgId,
        name: catName.trim(),
        category: catType,
        is_active: true,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Categoria criada');
      setCatName('');
      void load();
    } finally {
      setSavingCategory(false);
    }
  };

  const startEditCategory = (c: Record<string, unknown>) => {
    setEditCatId(c.id as string);
    setEditCatName((c.name as string) ?? '');
    setEditCatDesc((c.description as string) ?? '');
  };

  const cancelEditCategory = () => {
    setEditCatId(null);
    setEditCatName('');
    setEditCatDesc('');
  };

  const saveCategoryEdit = async () => {
    if (!orgId || !editCatId) return;
    if (!editCatName.trim()) {
      toast.error('Informe o nome.');
      return;
    }
    setSavingCatEdit(true);
    try {
      const { error } = await FinancialConfigService.updateExpenseCategory(editCatId, orgId, {
        name: editCatName.trim(),
        description: editCatDesc.trim() || null,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Categoria atualizada');
      cancelEditCategory();
      void load();
    } finally {
      setSavingCatEdit(false);
    }
  };

  const addPaymentMethod = async () => {
    if (!pmName.trim()) {
      toast.error('Informe o nome (ex.: máquina ou conta).');
      return;
    }
    const feePct = Number(String(pmFeePct).replace(',', '.'));
    if (Number.isNaN(feePct) || feePct < 0) {
      toast.error('Taxa % inválida.');
      return;
    }
    let feeFixed: number | null = null;
    if (pmFeeFixed.trim()) {
      const f = Number(String(pmFeeFixed).replace(',', '.'));
      if (Number.isNaN(f) || f < 0) {
        toast.error('Taxa fixa inválida.');
        return;
      }
      feeFixed = f;
    }
    if (!orgId) {
      toast.error('Selecione uma organização.');
      return;
    }
    setSavingPaymentMethod(true);
    try {
      const applies_to: string[] =
        pmAppliesScope === 'both' ? ['both'] : [pmAppliesScope];
      const { error } = await FinancialConfigService.createPaymentMethod({
        org_id: orgId,
        name: pmName.trim(),
        method: pmMethod,
        fee_percentage: feePct,
        fee_fixed: feeFixed,
        is_active: true,
        applies_to,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Forma de pagamento cadastrada');
      setPmName('');
      setPmFeePct('0');
      setPmFeeFixed('');
      void load();
    } finally {
      setSavingPaymentMethod(false);
    }
  };

  const addCenter = async () => {
    if (!orgId) {
      toast.error('Selecione uma organização antes de cadastrar.');
      return;
    }
    if (!ccCode.trim() || !ccName.trim()) {
      toast.error('Preencha código e nome do centro de custo.');
      return;
    }
    setSavingCenter(true);
    try {
      const { error } = await CostCenterService.create(
        orgId,
        ccCode.trim(),
        ccName.trim(),
        ccParentId || null
      );
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Centro de custo criado');
      setCcCode('');
      setCcName('');
      setCcParentId('');
      void load();
    } finally {
      setSavingCenter(false);
    }
  };

  const addBankAccount = async () => {
    if (!orgId) {
      toast.error('Selecione uma organização antes de cadastrar.');
      return;
    }
    if (!baName.trim() || !baNumber.trim()) {
      toast.error('Preencha nome de exibição e número da conta.');
      return;
    }
    if (baKind === 'bank' && !baBankName.trim()) {
      toast.error('Informe o nome do banco.');
      return;
    }
    setSavingBank(true);
    try {
      const { error } = await FinancialConfigService.createBankAccount({
        org_id: orgId,
        name: baName.trim(),
        kind: baKind,
        bank_name: baKind === 'bank' ? baBankName.trim() : '',
        agency: baAgency.trim() || null,
        account_number: baNumber.trim(),
        account_type: baType || null,
        is_active: true,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Conta cadastrada');
      setBaName('');
      setBaBankName('');
      setBaAgency('');
      setBaNumber('');
      setBaType('');
      void load();
    } finally {
      setSavingBank(false);
    }
  };

  const saveTierRow = async () => {
    if (!orgId) {
      toast.error('Selecione uma organização.');
      return;
    }
    if (!tierName.trim() || !tierMax.trim()) {
      toast.error('Preencha nome e valor máximo da faixa.');
      return;
    }
    const minV = Number(String(tierMin).replace(',', '.'));
    const maxV = Number(String(tierMax).replace(',', '.'));
    const seqV = Number(String(tierSeq).replace(',', '.'));
    if (Number.isNaN(minV) || Number.isNaN(maxV) || minV < 0 || maxV < minV) {
      toast.error('Valores mín/máx inválidos.');
      return;
    }
    if (Number.isNaN(seqV)) {
      toast.error('Ordem inválida.');
      return;
    }
    setSavingTier(true);
    try {
      const { error } = await ApprovalApService.saveTier({
        org_id: orgId,
        name: tierName.trim(),
        min_amount: minV,
        max_amount: maxV,
        sequence_order: seqV,
        approver_role: tierRole.trim() || null,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Alçada salva');
      setTierName('');
      setTierMin('0');
      setTierMax('');
      setTierSeq('0');
      setTierRole('');
      void load();
    } finally {
      setSavingTier(false);
    }
  };

  const removeTier = async (id: string) => {
    if (!orgId) return;
    const { error } = await ApprovalApService.deleteTier(orgId, id);
    if (error) toast.error(error.message);
    else {
      toast.success('Alçada removida');
      void load();
    }
  };

  const saveLateFeeRule = async () => {
    if (!orgId) return;
    setLfSaving(true);
    try {
      await ArLateFeeService.upsertRule(orgId, {
        penalty_percent: Number(String(lfPenalty).replace(',', '.')),
        daily_interest_percent: Number(String(lfDaily).replace(',', '.')),
        grace_days: Number(String(lfGrace).replace(',', '.')) || 0,
        is_active: lfActive,
      });
      toast.success('Regra de multa/juros salva');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLfSaving(false);
    }
  };

  const runLateFeeApply = async () => {
    if (!orgId) return;
    setLfApplying(true);
    try {
      const ref = new Date().toISOString().slice(0, 10);
      const { updated } = await ArLateFeeService.applyForOrg(orgId, ref);
      toast.success(`${updated} título(s) atualizado(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao aplicar');
    } finally {
      setLfApplying(false);
    }
  };

  const updatePaymentMethodScope = async (
    id: string,
    scope: 'both' | 'receivable' | 'payable'
  ) => {
    if (!orgId) return;
    const applies_to: string[] = scope === 'both' ? ['both'] : [scope];
    const { error } = await FinancialConfigService.updatePaymentMethod(id, orgId, { applies_to });
    if (error) toast.error(error.message);
    else {
      toast.success('Forma de pagamento atualizada');
      void load();
    }
  };

  const toggleBankActive = async (row: BankAccountRow) => {
    if (!orgId) return;
    const { error } = await FinancialConfigService.updateBankAccount(row.id, orgId, {
      is_active: !row.is_active,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(row.is_active ? 'Conta inativada' : 'Conta ativada');
      void load();
    }
  };

  const parentCenterLabel = (pid: string | null | undefined) => {
    if (!pid) return '—';
    const x = centers.find((c) => c.id === pid);
    return x ? `${String(x.code)} ${String(x.name)}` : '—';
  };

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              Configurações financeiras
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Categorias, formas de pagamento, contas, centros de custo e alçadas de AP
            </p>
          </div>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="flex w-full overflow-x-auto justify-start lg:grid lg:grid-cols-6 h-auto p-1 gap-1">
            <TabsTrigger value="categories" className="text-xs sm:text-sm flex-shrink-0">
              Categorias
            </TabsTrigger>
            <TabsTrigger value="methods" className="text-xs sm:text-sm flex-shrink-0">
              Formas de pagamento
            </TabsTrigger>
            <TabsTrigger value="accounts" className="text-xs sm:text-sm flex-shrink-0">
              Contas e caixas
            </TabsTrigger>
            <TabsTrigger value="centers" className="text-xs sm:text-sm flex-shrink-0">
              Centros de custo
            </TabsTrigger>
            <TabsTrigger value="late-fees" className="text-xs sm:text-sm flex-shrink-0">
              Juros/multa AR
            </TabsTrigger>
            <TabsTrigger value="tiers" className="text-xs sm:text-sm flex-shrink-0">
              Alçadas AP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Categorias de despesa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="cat-name">Nome</Label>
                    <Input
                      id="cat-name"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="Ex.: Material de escritório"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={catType}
                      onValueChange={(v) =>
                        setCatType(v as Database['public']['Enums']['expense_category'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">{expenseCategoryLabel('fixed')}</SelectItem>
                        <SelectItem value="variable">{expenseCategoryLabel('variable')}</SelectItem>
                        <SelectItem value="tax">{expenseCategoryLabel('tax')}</SelectItem>
                        <SelectItem value="supplier">{expenseCategoryLabel('supplier')}</SelectItem>
                        <SelectItem value="salary">{expenseCategoryLabel('salary')}</SelectItem>
                        <SelectItem value="equipment">{expenseCategoryLabel('equipment')}</SelectItem>
                        <SelectItem value="maintenance">{expenseCategoryLabel('maintenance')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="w-full"
                      disabled={savingCategory}
                      onClick={() => void addCategory()}
                    >
                      {savingCategory ? 'Salvando…' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="hidden sm:table-cell">Origem</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground text-sm">
                            Nenhuma categoria listada
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories.map((c) => {
                          const isOwn = (c.org_id as string | null) === orgId;
                          return (
                            <TableRow key={c.id as string}>
                              <TableCell className="max-w-[200px] truncate">{c.name as string}</TableCell>
                              <TableCell>{expenseCategoryLabel(c.category as string)}</TableCell>
                              <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                                {isOwn ? 'Organização' : 'Global'}
                              </TableCell>
                              <TableCell className="text-right">
                                {isOwn ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => startEditCategory(c)}
                                  >
                                    Editar
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <Dialog open={editCatId !== null} onOpenChange={(o) => !o && cancelEditCategory()}>
                  <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">Editar categoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ec-name">Nome</Label>
                        <Input
                          id="ec-name"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ec-desc">Descrição</Label>
                        <Textarea
                          id="ec-desc"
                          value={editCatDesc}
                          onChange={(e) => setEditCatDesc(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                      <Button type="button" variant="outline" onClick={cancelEditCategory}>
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        disabled={savingCatEdit}
                        onClick={() => void saveCategoryEdit()}
                      >
                        {savingCatEdit ? 'Salvando…' : 'Salvar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Máquinas / formas de recebimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="pm-name">Nome</Label>
                    <Input
                      id="pm-name"
                      value={pmName}
                      onChange={(e) => setPmName(e.target.value)}
                      placeholder="Ex.: Cielo crédito loja"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Método</Label>
                    <Select
                      value={pmMethod}
                      onValueChange={(v) => setPmMethod(v as PaymentMethodEnum)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {paymentMethodLabel(m)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Uso</Label>
                    <Select
                      value={pmAppliesScope}
                      onValueChange={(v) =>
                        setPmAppliesScope(v as 'both' | 'receivable' | 'payable')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Receber e pagar</SelectItem>
                        <SelectItem value="receivable">Somente receber</SelectItem>
                        <SelectItem value="payable">Somente pagar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pm-fee-pct">Taxa %</Label>
                    <Input
                      id="pm-fee-pct"
                      inputMode="decimal"
                      value={pmFeePct}
                      onChange={(e) => setPmFeePct(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pm-fee-fixed">Taxa fixa (R$)</Label>
                    <Input
                      id="pm-fee-fixed"
                      inputMode="decimal"
                      value={pmFeeFixed}
                      onChange={(e) => setPmFeeFixed(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="w-full"
                      disabled={savingPaymentMethod}
                      onClick={() => void addPaymentMethod()}
                    >
                      {savingPaymentMethod ? 'Salvando…' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="min-w-[140px]">Uso</TableHead>
                        <TableHead className="text-right">Taxa %</TableHead>
                        <TableHead className="text-right">Taxa fixa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {methods.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-muted-foreground text-sm">
                            Nenhum registro
                          </TableCell>
                        </TableRow>
                      ) : (
                        methods.map((m) => {
                          const canEdit = (m.org_id as string | null) === orgId;
                          const sc = scopeFromApplies(m.applies_to);
                          return (
                            <TableRow key={m.id as string}>
                              <TableCell>{m.name as string}</TableCell>
                              <TableCell>{paymentMethodLabel(m.method as string)}</TableCell>
                              <TableCell>
                                {canEdit ? (
                                  <Select
                                    value={sc}
                                    onValueChange={(v) =>
                                      void updatePaymentMethodScope(
                                        m.id as string,
                                        v as 'both' | 'receivable' | 'payable'
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="both">Receber e pagar</SelectItem>
                                      <SelectItem value="receivable">Somente receber</SelectItem>
                                      <SelectItem value="payable">Somente pagar</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-xs sm:text-sm">{appliesToLabel(m.applies_to)}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                                {Number(m.fee_percentage ?? 0).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 4,
                                })}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                                {m.fee_fixed != null && Number(m.fee_fixed) !== 0
                                  ? Number(m.fee_fixed).toLocaleString('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    })
                                  : '—'}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Contas bancárias e caixas físicos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="ba-name">Nome de exibição</Label>
                    <Input
                      id="ba-name"
                      value={baName}
                      onChange={(e) => setBaName(e.target.value)}
                      placeholder="Ex.: Conta principal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={baKind}
                      onValueChange={(v) => setBaKind(v as 'bank' | 'cash')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Banco</SelectItem>
                        <SelectItem value="cash">Caixa físico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {baKind === 'bank' && (
                    <>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="ba-bank">Banco</Label>
                        <Input
                          id="ba-bank"
                          value={baBankName}
                          onChange={(e) => setBaBankName(e.target.value)}
                          placeholder="Nome da instituição"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ba-agency">Agência</Label>
                        <Input
                          id="ba-agency"
                          value={baAgency}
                          onChange={(e) => setBaAgency(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de conta</Label>
                        <Select
                          value={baType || 'checking'}
                          onValueChange={(v) => setBaType(v as 'checking' | 'savings')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Corrente</SelectItem>
                            <SelectItem value="savings">Poupança</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="ba-number">
                      {baKind === 'bank' ? 'Número da conta' : 'Identificador'}
                    </Label>
                    <Input
                      id="ba-number"
                      value={baNumber}
                      onChange={(e) => setBaNumber(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="w-full"
                      disabled={savingBank}
                      onClick={() => void addBankAccount()}
                    >
                      {savingBank ? 'Salvando…' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="hidden sm:table-cell">Banco / detalhe</TableHead>
                        <TableHead className="text-right">Ativo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankAccounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground text-sm">
                            Nenhuma conta cadastrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        bankAccounts.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.name}</TableCell>
                            <TableCell>{b.kind === 'cash' ? 'Caixa' : 'Banco'}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                              {b.kind === 'bank'
                                ? [b.bank_name, b.agency, b.account_number].filter(Boolean).join(' · ')
                                : b.account_number}
                            </TableCell>
                            <TableCell className="text-right">
                              <Switch
                                checked={Boolean(b.is_active)}
                                onCheckedChange={() => void toggleBankActive(b)}
                                aria-label="Ativar conta"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="late-fees" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Multa e juros em contas a receber vencidas</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                  Multa sobre o principal e juros diários após carência. Evita recálculo no mesmo dia.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lf-pen">Multa (% sobre principal)</Label>
                    <Input
                      id="lf-pen"
                      value={lfPenalty}
                      onChange={(e) => setLfPenalty(e.target.value)}
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lf-day">Juros diários (% ao dia)</Label>
                    <Input
                      id="lf-day"
                      value={lfDaily}
                      onChange={(e) => setLfDaily(e.target.value)}
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lf-grace">Dias de carência</Label>
                    <Input
                      id="lf-grace"
                      value={lfGrace}
                      onChange={(e) => setLfGrace(e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="space-y-2 flex-1">
                      <Label>Regra ativa</Label>
                      <div className="flex items-center gap-2 pt-2">
                        <Switch checked={lfActive} onCheckedChange={setLfActive} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" disabled={lfSaving || !orgId} onClick={() => void saveLateFeeRule()}>
                    {lfSaving ? 'Salvando…' : 'Salvar regra'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={lfApplying || !orgId}
                    onClick={() => void runLateFeeApply()}
                  >
                    {lfApplying ? 'Aplicando…' : 'Aplicar hoje'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tiers" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Alçadas — contas a pagar</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Faixas por valor. Papel do aprovador preenchido exige aprovação antes do pagamento. Vazio =
                  aprovação automática na faixa.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="tier-name">Nome da faixa</Label>
                    <Input
                      id="tier-name"
                      value={tierName}
                      onChange={(e) => setTierName(e.target.value)}
                      placeholder="Ex.: Até 5 mil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier-min">Mín (R$)</Label>
                    <Input
                      id="tier-min"
                      value={tierMin}
                      onChange={(e) => setTierMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier-max">Máx (R$)</Label>
                    <Input
                      id="tier-max"
                      value={tierMax}
                      onChange={(e) => setTierMax(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier-seq">Ordem</Label>
                    <Input
                      id="tier-seq"
                      value={tierSeq}
                      onChange={(e) => setTierSeq(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Papel aprovador</Label>
                    <Select value={tierRole || '__none'} onValueChange={(v) => setTierRole(v === '__none' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Automático" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Automático (sem aprovação)</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end sm:col-span-2 lg:col-span-6">
                    <Button
                      type="button"
                      className="w-full sm:w-auto"
                      disabled={savingTier}
                      onClick={() => void saveTierRow()}
                    >
                      {savingTier ? 'Salvando…' : 'Adicionar faixa'}
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Mín</TableHead>
                        <TableHead className="text-right">Máx</TableHead>
                        <TableHead className="hidden sm:table-cell">Ordem</TableHead>
                        <TableHead className="hidden md:table-cell">Papel</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-muted-foreground text-sm">
                            Nenhuma alçada. Títulos seguem aprovados automaticamente.
                          </TableCell>
                        </TableRow>
                      ) : (
                        tiers.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.name}</TableCell>
                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                              {Number(t.min_amount).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                              {Number(t.max_amount).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{t.sequence_order}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                              {t.approver_role || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button type="button" variant="outline" size="sm" onClick={() => void removeTier(t.id)}>
                                Excluir
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="centers" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Centros de custo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                  <div className="space-y-2">
                    <Label htmlFor="cc-code">Código</Label>
                    <Input id="cc-code" value={ccCode} onChange={(e) => setCcCode(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="cc-name">Nome</Label>
                    <Input id="cc-name" value={ccName} onChange={(e) => setCcName(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Centro pai (opcional)</Label>
                    <Select
                      value={ccParentId || '__none__'}
                      onValueChange={(v) => setCcParentId(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {centers.map((c) => (
                          <SelectItem key={c.id as string} value={c.id as string}>
                            {c.code as string} — {c.name as string}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="w-full"
                      disabled={savingCenter}
                      onClick={() => void addCenter()}
                    >
                      {savingCenter ? 'Salvando…' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden md:table-cell">Pai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {centers.map((c) => (
                        <TableRow key={c.id as string}>
                          <TableCell>{c.code as string}</TableCell>
                          <TableCell>{c.name as string}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                            {parentCenterLabel(c.parent_id as string | null | undefined)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FinancialPageShell>
  );
}
