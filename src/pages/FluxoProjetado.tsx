import { useEffect, useState } from 'react';
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
import { ProjectionService } from '@/services/financial/projectionService';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';

export default function FluxoProjetado() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!orgId) return;
    void ProjectionService.listByOrg(orgId, 90).then((d) =>
      setRows(d as unknown as Record<string, unknown>[])
    );
  }, [orgId]);

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">
          Fluxo de caixa projetado (90 dias)
        </h1>
        <Card className="border p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Projetado receitas</TableHead>
                <TableHead className="text-right">Projetado despesas</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id as string}>
                  <TableCell>{formatDateBR(r.projection_date as string)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.projected_income ?? 0))}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.projected_expenses ?? 0))}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatBRL(Number(r.projected_balance ?? 0))}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Sem projeções — alimente AR/AP e caixa
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
