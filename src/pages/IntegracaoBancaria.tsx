import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import { FinancialConfigService } from '@/services/financial/financialConfigService';
import { BankTransmissionService, type BankBatchDirection } from '@/services/financial/bankTransmissionService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { formatDateBR } from '@/lib/financialFormat';

type BankAccountRow = Database['public']['Tables']['bank_accounts']['Row'];
type BatchRow = Database['public']['Tables']['bank_transmission_batches']['Row'];

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const arr = Array.from(new Uint8Array(hash));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function IntegracaoBancaria() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const [accounts, setAccounts] = useState<BankAccountRow[]>([]);
  const [bankId, setBankId] = useState('');
  const [direction, setDirection] = useState<BankBatchDirection>('outbound');
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [totalItems, setTotalItems] = useState('0');

  const bankLabel = (a: BankAccountRow) =>
    a.kind === 'cash' ? a.name ?? a.account_number : `${a.name ?? a.account_number} (${a.bank_name ?? 'Banco'})`;

  const load = useCallback(async () => {
    if (!orgId) return;
    const acc = await FinancialConfigService.listBankAccounts(orgId, true);
    setAccounts(acc);
    setBankId((prev) => prev || acc[0]?.id || '');
    const list = await BankTransmissionService.listBatches(orgId, 50);
    setBatches(list as BatchRow[]);
  }, [orgId]);

  useEffect(() => {
    void load().catch((e) => toast.error(e instanceof Error ? e.message : 'Falha ao carregar'));
  }, [load]);

  const canCreate = useMemo(() => !!orgId && !!bankId && !!file && Number(totalItems) >= 0, [orgId, bankId, file, totalItems]);

  const createBatch = async () => {
    if (!orgId || !bankId || !file) return;
    setCreating(true);
    try {
      const hash = await sha256Hex(file);
      const existing = await BankTransmissionService.findByHash(orgId, hash);
      if (existing) {
        toast.message('Arquivo já importado', { description: `Batch ${existing.id} (hash igual)` });
        return;
      }
      const id = await BankTransmissionService.createBatch(
        orgId,
        bankId,
        direction,
        hash,
        Math.max(0, Number(totalItems) || 0)
      );
      toast.success(`Batch criado: ${id.slice(0, 8)}…`);
      await load();
      setFile(null);
      setTotalItems('0');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao criar batch');
    } finally {
      setCreating(false);
    }
  };

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Integração bancária</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Controle de remessa/retorno por lote (idempotência via hash de arquivo).
            </p>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => void load()}>
            Atualizar
          </Button>
        </div>

        <Card className="border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Novo lote</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>Conta</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {bankLabel(a)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Direção</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as BankBatchDirection)}
                >
                  <option value="outbound">Remessa (saída)</option>
                  <option value="inbound">Retorno (entrada)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-items">Total itens</Label>
                <Input id="total-items" inputMode="numeric" value={totalItems} onChange={(e) => setTotalItems(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-file">Arquivo</Label>
                <Input id="batch-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button disabled={!canCreate || creating} onClick={() => void createBatch()}>
                {creating ? 'Criando…' : 'Criar lote'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border p-0 overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Lotes recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 pt-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Direção</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead>Criado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-xs sm:text-sm">{b.id.slice(0, 8)}…</TableCell>
                    <TableCell className="text-xs sm:text-sm">{b.bank_account_id.slice(0, 8)}…</TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {b.direction === 'outbound' ? 'Remessa' : 'Retorno'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{b.status}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                      {b.processed_items}/{b.total_items}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                      {formatDateBR(String(b.created_at).slice(0, 10))}
                    </TableCell>
                  </TableRow>
                ))}
                {batches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-xs sm:text-sm">
                      Nenhum lote registrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </FinancialPageShell>
  );
}

