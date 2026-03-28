import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import {
  ArAgingService,
  type ArAgingBucket,
  type ArAgingLine,
} from '@/services/financial';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
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

export default function InadimplenciaAging() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const [refDate, setRefDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<ArAgingLine[]>([]);
  const [bucketFilter, setBucketFilter] = useState<ArAgingBucket | 'all'>('all');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await ArAgingService.listOpenLines(orgId, refDate);
      setLines(data);
    } finally {
      setLoading(false);
    }
  }, [orgId, refDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => ArAgingService.summarizeByBucket(lines), [lines]);

  const filtered =
    bucketFilter === 'all' ? lines : lines.filter((l) => l.bucket === bucketFilter);

  const byCustomer = useMemo(() => ArAgingService.summarizeByCustomer(lines), [lines]);

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Vencimentos a receber</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Posição em aberto por faixa de vencimento (data de referência configurável)
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="aging-ref">Data de referência</Label>
            <Input
              id="aging-ref"
              type="date"
              value={refDate}
              onChange={(e) => setRefDate(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[160px]"
            />
          </div>
          <div className="space-y-2 min-w-0 flex-1 sm:max-w-xs">
            <Label>Faixa</Label>
            <Select
              value={bucketFilter}
              onValueChange={(v) => setBucketFilter(v as ArAgingBucket | 'all')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {ArAgingService.orderedBuckets().map((b) => (
                  <SelectItem key={b} value={b}>
                    {ArAgingService.bucketLabel(b)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
          {ArAgingService.orderedBuckets().map((b) => (
            <Card key={b} className="min-w-0">
              <CardHeader className="p-3 sm:p-4 pb-1">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  {ArAgingService.bucketLabel(b)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <p className="text-base sm:text-lg font-bold whitespace-nowrap truncate">
                  {formatBRL(summary[b])}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Por cliente</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total em aberto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byCustomer.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-muted-foreground text-sm">
                        {loading ? 'Carregando…' : 'Nenhum título em aberto'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    byCustomer.map((c) => (
                      <TableRow key={c.customer_id}>
                        <TableCell className="max-w-[220px] truncate font-medium">
                          {c.customer_name}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                          {formatBRL(c.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Títulos</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Faixa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-sm">
                        {loading ? 'Carregando…' : 'Nenhum registro neste filtro'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((l) => (
                      <TableRow key={l.receivable_id}>
                        <TableCell className="max-w-[200px] truncate">{l.customer_name}</TableCell>
                        <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                          {formatBRL(l.amount)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                          {formatDateBR(l.due_date)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {ArAgingService.bucketLabel(l.bucket)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinancialPageShell>
  );
}
