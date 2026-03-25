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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { PartnerWithdrawalService } from '@/services/financial/partnerWithdrawalService';
import { toast } from 'sonner';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import { Pencil, Trash2 } from 'lucide-react';

type RwRow = {
  id: string;
  withdrawal_date: string;
  amount: number;
  description: string | null;
};

export default function RetiradasSocios() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id ?? '';
  const [rows, setRows] = useState<RwRow[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<RwRow | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const load = async () => {
    if (!orgId) return;
    const data = await PartnerWithdrawalService.list(orgId);
    setRows(data as unknown as RwRow[]);
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

  const openEdit = (r: RwRow) => {
    setEditRow(r);
    setEditDate(r.withdrawal_date);
    setEditAmount(String(r.amount));
    setEditDesc(r.description ?? '');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!orgId || !editRow) return;
    const { error } = await PartnerWithdrawalService.update(orgId, editRow.id, {
      withdrawal_date: editDate,
      amount: Number(String(editAmount).replace(',', '.')),
      description: editDesc.trim() || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Retirada atualizada');
      setEditOpen(false);
      setEditRow(null);
      void load();
    }
  };

  const remove = async (id: string) => {
    if (!orgId) return;
    if (!window.confirm('Excluir esta retirada?')) return;
    const { error } = await PartnerWithdrawalService.remove(orgId, id);
    if (error) toast.error(error.message);
    else {
      toast.success('Retirada excluída');
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
                <TableHead className="text-right w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDateBR(r.withdrawal_date)}</TableCell>
                  <TableCell>{r.description ?? '—'}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.amount))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(r)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => void remove(r.id)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar retirada</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="ed-date">Data</Label>
              <Input id="ed-date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-amt">Valor</Label>
              <Input id="ed-amt" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-d">Descrição</Label>
              <Input id="ed-d" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveEdit()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FinancialPageShell>
  );
}
