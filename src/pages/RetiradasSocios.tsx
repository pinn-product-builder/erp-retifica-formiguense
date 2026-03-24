import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { PartnerWithdrawalService } from '@/services/financial/partnerWithdrawalService';
import { toast } from 'sonner';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';

export default function RetiradasSocios() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id ?? '';
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    if (!orgId) return;
    const data = await PartnerWithdrawalService.list(orgId);
    setRows(data as unknown as Record<string, unknown>[]);
  };

  useEffect(() => {
    void load();
  }, [orgId]);

  const submit = async () => {
    if (!orgId) return;
    const { error } = await PartnerWithdrawalService.create({
      org_id: orgId,
      withdrawal_date: date,
      amount: Number(amount.replace(',', '.')),
      description: description || null,
      dre_category: 'partner_withdrawal',
      created_by: user?.id ?? null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Retirada registrada');
      setAmount('');
      setDescription('');
      void load();
    }
  };

  return (
    <FinancialPageShell>
      <div className="space-y-6 sm:space-y-8">
        <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Retiradas de sócios (DRE)</h1>
        <Card className="border p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2 sm:min-w-[140px]">
              <Label htmlFor="rw-date">Data</Label>
              <Input id="rw-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="rw-amount">Valor</Label>
              <Input id="rw-amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="rw-desc">Descrição</Label>
              <Input id="rw-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button type="button" className="w-full sm:w-auto" onClick={() => void submit()}>
              Registrar
            </Button>
          </div>
        </Card>
        <Card className="border p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id as string}>
                  <TableCell>{formatDateBR(r.withdrawal_date as string)}</TableCell>
                  <TableCell>{(r.description as string) ?? '—'}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </FinancialPageShell>
  );
}
