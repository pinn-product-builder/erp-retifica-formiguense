import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ArrowRightLeft, Plus, Building2, Wallet } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { supabase } from '@/integrations/supabase/client';
import { useFinancial } from '@/hooks/useFinancial';
import { useFinancialOrgScope } from '@/hooks/useFinancialOrgScope';
import { useOrganization } from '@/hooks/useOrganization';
import { FinancialOrgScopeSelect } from '@/components/financial/FinancialOrgScopeSelect';
import { formatBRL } from '@/lib/financialFormat';

type BankAccountRow = {
  id: string;
  name: string;
  bank_name?: string | null;
  kind: 'bank' | 'cash';
  org_id: string;
};

type TransferRow = {
  id: string;
  org_id: string;
  amount: number;
  transfer_date: string;
  description: string;
  notes: string | null;
  created_at: string;
  from_bank_account_id: string;
  to_bank_account_id: string;
  from_bank_account?: { name: string; kind: 'bank' | 'cash' } | null;
  to_bank_account?: { name: string; kind: 'bank' | 'cash' } | null;
};

const PAGE_SIZE = 20;

function accountLabel(ba: BankAccountRow): string {
  const tag = ba.kind === 'cash' ? '[Caixa]' : '[Banco]';
  const detail = ba.kind === 'bank' && ba.bank_name ? ` · ${ba.bank_name}` : '';
  return `${tag} ${ba.name}${detail}`;
}

function accountChip(kind: 'bank' | 'cash' | undefined, name: string | undefined) {
  const Icon = kind === 'cash' ? Wallet : Building2;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span>{name ?? '—'}</span>
    </span>
  );
}

export default function Transferencias() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const { effectiveOrgIds } = useFinancialOrgScope();
  const writeOrgId = effectiveOrgIds.length === 1 ? effectiveOrgIds[0] : '';
  const orgIdReady = Boolean(orgId) && effectiveOrgIds.length > 0;

  const { getBankAccounts } = useFinancial();

  const [bankAccounts, setBankAccounts] = useState<BankAccountRow[]>([]);
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    from_bank_account_id: '',
    to_bank_account_id: '',
    amount: '',
    transfer_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    notes: '',
  });

  // KPIs simples do mês
  const monthMetrics = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const inMonth = transfers.filter(
      (t) => new Date(`${t.transfer_date}T00:00:00`) >= start
    );
    return {
      count: inMonth.length,
      total: inMonth.reduce((acc, t) => acc + Number(t.amount), 0),
    };
  }, [transfers]);

  const loadBankAccounts = useCallback(async () => {
    if (effectiveOrgIds.length === 0) return;
    const list = (await getBankAccounts(effectiveOrgIds)) as unknown as BankAccountRow[];
    setBankAccounts(list ?? []);
  }, [effectiveOrgIds, getBankAccounts]);

  const loadTransfers = useCallback(async () => {
    if (effectiveOrgIds.length === 0) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('account_transfers')
      .select(
        `
          id, org_id, amount, transfer_date, description, notes, created_at,
          from_bank_account_id, to_bank_account_id,
          from_bank_account:bank_accounts!account_transfers_from_bank_account_id_fkey ( name, kind ),
          to_bank_account:bank_accounts!account_transfers_to_bank_account_id_fkey ( name, kind )
        `
      )
      .in('org_id', effectiveOrgIds)
      .order('transfer_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    setLoading(false);
    if (error) {
      toast.error('Erro ao carregar transferências');
      console.error(error);
      return;
    }
    setTransfers((data ?? []) as unknown as TransferRow[]);
  }, [effectiveOrgIds]);

  useEffect(() => {
    if (!orgIdReady) return;
    void loadBankAccounts();
    void loadTransfers();
  }, [orgIdReady, loadBankAccounts, loadTransfers]);

  const resetForm = () => {
    setFormData({
      from_bank_account_id: '',
      to_bank_account_id: '',
      amount: '',
      transfer_date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      notes: '',
    });
  };

  const handleModalChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!writeOrgId) {
      toast.error('Selecione uma única empresa para lançar a transferência.');
      return;
    }
    if (!formData.from_bank_account_id || !formData.to_bank_account_id) {
      toast.error('Selecione conta de origem e destino');
      return;
    }
    if (formData.from_bank_account_id === formData.to_bank_account_id) {
      toast.error('Conta de origem e destino devem ser diferentes');
      return;
    }
    const amount = Number(formData.amount.replace(',', '.'));
    if (!amount || amount <= 0) {
      toast.error('Informe um valor maior que zero');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.rpc('create_account_transfer', {
      p_org_id: writeOrgId,
      p_from_bank_account_id: formData.from_bank_account_id,
      p_to_bank_account_id: formData.to_bank_account_id,
      p_amount: amount,
      p_transfer_date: formData.transfer_date,
      p_description: formData.description.trim(),
      p_notes: formData.notes.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || 'Erro ao registrar transferência');
      return;
    }
    toast.success('Transferência registrada com sucesso');
    setIsModalOpen(false);
    resetForm();
    void loadTransfers();
    void data;
  };

  const orgAccounts = useMemo(
    () =>
      writeOrgId
        ? bankAccounts.filter((b) => b.org_id === writeOrgId)
        : bankAccounts,
    [bankAccounts, writeOrgId]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            Transferência entre Contas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Movimentação entre contas correntes, aplicações e caixas. O sistema
            registra automaticamente saída na origem e entrada no destino, com
            lançamento na conta contábil <strong>Transferência</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <FinancialOrgScopeSelect />

          <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova transferência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Nova transferência</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Conta de origem *</Label>
                    <Select
                      value={formData.from_bank_account_id}
                      onValueChange={(v) =>
                        setFormData((f) => ({ ...f, from_bank_account_id: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgAccounts.map((ba) => (
                          <SelectItem key={ba.id} value={ba.id}>
                            {accountLabel(ba)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Conta de destino *</Label>
                    <Select
                      value={formData.to_bank_account_id}
                      onValueChange={(v) =>
                        setFormData((f) => ({ ...f, to_bank_account_id: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgAccounts
                          .filter((ba) => ba.id !== formData.from_bank_account_id)
                          .map((ba) => (
                            <SelectItem key={ba.id} value={ba.id}>
                              {accountLabel(ba)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor (R$) *</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, amount: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={formData.transfer_date}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, transfer_date: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Input
                    placeholder="Ex.: Aporte caixa loja → Itaú CC"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    rows={2}
                    placeholder="Opcional"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </div>

                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  Ao confirmar, o sistema registra automaticamente a{' '}
                  <strong>saída</strong> na conta de origem e a{' '}
                  <strong>entrada</strong> na conta de destino, com lançamentos na
                  conta contábil <strong>Transferência</strong>.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleModalChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Registrando...' : 'Registrar transferência'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transferências no mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthMetrics.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volume movimentado no mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(monthMetrics.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas configuradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgAccounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {orgAccounts.filter((a) => a.kind === 'bank').length} bancárias ·{' '}
              {orgAccounts.filter((a) => a.kind === 'cash').length} caixas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas transferências</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : transfers.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma transferência registrada ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Data</TableHead>
                  <TableHead>Origem → Destino</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right w-[140px]">Valor</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(`${t.transfer_date}T00:00:00`), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {accountChip(t.from_bank_account?.kind, t.from_bank_account?.name)}
                        <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        {accountChip(t.to_bank_account?.kind, t.to_bank_account?.name)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{t.description}</div>
                      {t.notes && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatBRL(Number(t.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Concluída</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
