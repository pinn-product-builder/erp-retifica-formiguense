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
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { expenseCategoryLabel, paymentMethodLabel } from '@/lib/financialFormat';
import { Settings } from 'lucide-react';

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
  const [pmName, setPmName] = useState('');
  const [pmMethod, setPmMethod] = useState<PaymentMethodEnum>('pix');
  const [pmFeePct, setPmFeePct] = useState('0');
  const [pmFeeFixed, setPmFeeFixed] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);
  const [savingCenter, setSavingCenter] = useState(false);

  const load = async () => {
    if (!orgId) return;
    try {
      const [c, m, cc] = await Promise.all([
        FinancialConfigService.listExpenseCategories(orgId),
        FinancialConfigService.listPaymentMethods(),
        CostCenterService.list(orgId),
      ]);
      setCategories(c as unknown as Record<string, unknown>[]);
      setMethods(m as unknown as Record<string, unknown>[]);
      setCenters(cc as unknown as Record<string, unknown>[]);
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
    setSavingPaymentMethod(true);
    try {
      const { error } = await FinancialConfigService.createPaymentMethod({
        name: pmName.trim(),
        method: pmMethod,
        fee_percentage: feePct,
        fee_fixed: feeFixed,
        is_active: true,
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
      const { error } = await CostCenterService.create(orgId, ccCode.trim(), ccName.trim());
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Centro de custo criado');
      setCcCode('');
      setCcName('');
      void load();
    } finally {
      setSavingCenter(false);
    }
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
              Categorias, formas de pagamento e centros de custo
            </p>
          </div>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="flex w-full overflow-x-auto justify-start lg:grid lg:grid-cols-3 h-auto p-1">
            <TabsTrigger value="categories" className="text-xs sm:text-sm flex-shrink-0">
              Categorias
            </TabsTrigger>
            <TabsTrigger value="methods" className="text-xs sm:text-sm flex-shrink-0">
              Formas de pagamento
            </TabsTrigger>
            <TabsTrigger value="centers" className="text-xs sm:text-sm flex-shrink-0">
              Centros de custo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Categorias de despesa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-muted-foreground text-sm">
                            Nenhuma categoria listada
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories.map((c) => (
                          <TableRow key={c.id as string}>
                            <TableCell>{c.name as string}</TableCell>
                            <TableCell>{expenseCategoryLabel(c.category as string)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Máquinas / formas de recebimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
                        <TableHead className="text-right">Taxa %</TableHead>
                        <TableHead className="text-right">Taxa fixa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {methods.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground text-sm">
                            Nenhum registro
                          </TableCell>
                        </TableRow>
                      ) : (
                        methods.map((m) => (
                          <TableRow key={m.id as string}>
                            <TableCell>{m.name as string}</TableCell>
                            <TableCell>{paymentMethodLabel(m.method as string)}</TableCell>
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="cc-code">Código</Label>
                    <Input id="cc-code" value={ccCode} onChange={(e) => setCcCode(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="cc-name">Nome</Label>
                    <Input id="cc-name" value={ccName} onChange={(e) => setCcName(e.target.value)} />
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {centers.map((c) => (
                        <TableRow key={c.id as string}>
                          <TableCell>{c.code as string}</TableCell>
                          <TableCell>{c.name as string}</TableCell>
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
