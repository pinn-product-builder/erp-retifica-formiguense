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
import { CashClosingService } from '@/services/financial/cashClosingService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';

export default function FechamentoCaixa() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id ?? '';
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [closingDate, setClosingDate] = useState(new Date().toISOString().slice(0, 10));
  const [expected, setExpected] = useState('');
  const [counted, setCounted] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    if (!orgId) return;
    const data = await CashClosingService.list(orgId);
    setRows(data as unknown as Record<string, unknown>[]);
  };

  useEffect(() => {
    void load();
  }, [orgId]);

  const submit = async () => {
    if (!orgId) return;
    const exp = Number(expected.replace(',', '.'));
    const cnt = Number(counted.replace(',', '.'));
    const { error } = await CashClosingService.create({
      org_id: orgId,
      closing_date: closingDate,
      expected_balance: exp,
      counted_balance: cnt,
      difference_amount: cnt - exp,
      notes: notes || null,
      closed_by: user?.id ?? null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Fechamento registrado');
      setNotes('');
      void load();
    }
  };

  return (
    <FinancialPageShell>
      <div className="space-y-6 sm:space-y-8">
        <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Fechamento de caixa</h1>
        <Card className="border p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2 sm:min-w-[140px]">
              <Label htmlFor="fc-date">Data</Label>
              <Input
                id="fc-date"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="fc-expected">Saldo esperado</Label>
              <Input
                id="fc-expected"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="fc-counted">Saldo contado</Label>
              <Input
                id="fc-counted"
                value={counted}
                onChange={(e) => setCounted(e.target.value)}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2 sm:basis-full md:basis-auto md:min-w-[200px]">
              <Label htmlFor="fc-notes">Observações</Label>
              <Input id="fc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button type="button" className="w-full sm:w-auto sm:self-center" onClick={() => void submit()}>
              Registrar
            </Button>
          </div>
        </Card>
        <Card className="border p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead className="text-right">Contado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id as string}>
                  <TableCell>{formatDateBR(r.closing_date as string)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.expected_balance))}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.counted_balance))}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.difference_amount))}
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
