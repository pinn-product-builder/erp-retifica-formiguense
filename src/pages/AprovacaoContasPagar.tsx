import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { ApprovalApService } from '@/services/financial/approvalApService';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type TierRow = Database['public']['Tables']['approval_tiers_ap']['Row'];

export default function AprovacaoContasPagar() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id ?? '';
  const userId = user?.id ?? null;
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    if (!orgId) return;
    const [data, t] = await Promise.all([
      ApprovalApService.listPendingApprovalPaginated(orgId, page, 10),
      ApprovalApService.listTiers(orgId),
    ]);
    setRows(data.data as unknown as Record<string, unknown>[]);
    setTotalPages(data.totalPages);
    setTiers(t);
  };

  useEffect(() => {
    void load();
  }, [orgId, page]);

  const tierLabel = (amount: number) => {
    const t = ApprovalApService.resolveTierForAmount(tiers, amount);
    return t ? `${t.name} (${Number(t.min_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} – ${Number(t.max_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})` : '—';
  };

  const approve = async (id: string) => {
    if (!orgId) return;
    const { error } = await ApprovalApService.approvePayable(orgId, id, userId);
    if (error) toast.error(error.message);
    else {
      toast.success('Aprovado');
      void load();
    }
  };

  const openReject = (id: string) => {
    setRejectId(id);
    setRejectReason('');
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!orgId || !rejectId) return;
    if (rejectReason.trim().length < 3) {
      toast.error('Informe o motivo da rejeição (mín. 3 caracteres).');
      return;
    }
    const { error } = await ApprovalApService.rejectPayable(orgId, rejectId, userId, rejectReason);
    if (error) toast.error(error.message);
    else {
      toast.success('Título rejeitado');
      setRejectOpen(false);
      setRejectId(null);
      void load();
    }
  };

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Aprovação de contas a pagar</h1>
        <Card className="border p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Fornecedor</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Descrição</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Valor</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Alçada</TableHead>
                  <TableHead className="text-xs sm:text-sm">Vencimento</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id as string}>
                    <TableCell className="text-xs sm:text-sm font-medium max-w-[8rem] sm:max-w-none truncate">
                      {r.supplier_name as string}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell max-w-[12rem] truncate">
                      {r.description as string}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                      {formatBRL(Number(r.amount))}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell text-muted-foreground">
                      {tierLabel(Number(r.amount))}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                      {formatDateBR(r.due_date as string)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col sm:flex-row gap-1 sm:justify-end">
                        <Button
                          size="sm"
                          className="h-8 text-xs sm:text-sm"
                          onClick={() => void approve(r.id as string)}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs sm:text-sm"
                          onClick={() => openReject(r.id as string)}
                        >
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-xs sm:text-sm">
                      Nenhum título pendente de aprovação
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {page}/{totalPages}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Rejeitar título</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-xs sm:text-sm">
              Motivo
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="text-sm sm:text-base"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmReject()}>
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FinancialPageShell>
  );
}
