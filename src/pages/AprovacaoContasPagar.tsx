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
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import { ApprovalApService } from '@/services/financial/approvalApService';
import { toast } from 'sonner';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';

export default function AprovacaoContasPagar() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  const load = async () => {
    if (!orgId) return;
    const data = await ApprovalApService.listPendingApproval(orgId);
    setRows(data as unknown as Record<string, unknown>[]);
  };

  useEffect(() => {
    void load();
  }, [orgId]);

  const approve = async (id: string) => {
    if (!orgId) return;
    const { error } = await ApprovalApService.approvePayable(orgId, id);
    if (error) toast.error(error.message);
    else {
      toast.success('Aprovado');
      void load();
    }
  };

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Aprovação de contas a pagar</h1>
        <Card className="border p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id as string}>
                  <TableCell>{r.supplier_name as string}</TableCell>
                  <TableCell>{r.description as string}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.amount))}
                  </TableCell>
                  <TableCell>{formatDateBR(r.due_date as string)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => void approve(r.id as string)}>
                      Aprovar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Nenhum título pendente de aprovação
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </FinancialPageShell>
  );
}
