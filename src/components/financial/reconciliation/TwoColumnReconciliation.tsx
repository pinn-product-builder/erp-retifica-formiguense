import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import type { Database } from '@/integrations/supabase/types';
import { Banknote, FileText, Link2 } from 'lucide-react';
import { BankReconciliationService } from '@/services/financial/bankReconciliationService';
import { toast } from 'sonner';

type BslRow = Database['public']['Tables']['bank_statement_lines']['Row'];
type CfRow = Database['public']['Tables']['cash_flow']['Row'];

type Props = {
  reconciliationId: string | null;
  statementLines: BslRow[];
  cashFlows: CfRow[];
  userId: string | null;
  onMatched?: () => void | Promise<void>;
};

export function TwoColumnReconciliation({
  reconciliationId,
  statementLines,
  cashFlows,
  userId,
  onMatched,
}: Props) {
  const [selectedLineIds, setSelectedLineIds] = useState<Set<string>>(new Set());
  const [selectedCfId, setSelectedCfId] = useState<string | null>(null);
  const [bankFilter, setBankFilter] = useState('');
  const [sysFilter, setSysFilter] = useState('');
  const [saving, setSaving] = useState(false);

  const pendingLines = useMemo(
    () => statementLines.filter((l) => !l.matched_cash_flow_id),
    [statementLines]
  );

  const pendingCfs = useMemo(() => cashFlows.filter((c) => !c.reconciled), [cashFlows]);

  const filteredLines = useMemo(() => {
    const term = bankFilter.trim().toLowerCase();
    if (!term) return pendingLines;
    return pendingLines.filter(
      (l) =>
        (l.description ?? '').toLowerCase().includes(term) ||
        String(l.amount ?? '').includes(term) ||
        (l.posted_at ?? '').includes(term)
    );
  }, [pendingLines, bankFilter]);

  const filteredCfs = useMemo(() => {
    const term = sysFilter.trim().toLowerCase();
    if (!term) return pendingCfs;
    return pendingCfs.filter(
      (c) =>
        (c.description ?? '').toLowerCase().includes(term) ||
        String(c.amount ?? '').includes(term) ||
        (c.transaction_date ?? '').includes(term)
    );
  }, [pendingCfs, sysFilter]);

  const selectedLines = filteredLines.filter((l) => selectedLineIds.has(l.id));
  const selectedCf = selectedCfId ? pendingCfs.find((c) => c.id === selectedCfId) ?? null : null;

  const sumSelectedLines = selectedLines.reduce((s, l) => s + Number(l.amount ?? 0), 0);
  const cfAmount = selectedCf ? Number(selectedCf.amount ?? 0) : 0;
  const delta = cfAmount - sumSelectedLines;
  const isMatch =
    !!selectedCf && selectedLines.length > 0 && Math.abs(delta) < 0.01;

  const toggleLine = (id: string) => {
    setSelectedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!reconciliationId) {
      toast.error('Crie a conciliação antes de agrupar lançamentos');
      return;
    }
    if (!selectedCf || selectedLines.length === 0) return;
    setSaving(true);
    try {
      const { error } = await BankReconciliationService.confirmGroupedMatch({
        reconciliationId,
        statementLineIds: selectedLines.map((l) => l.id),
        cashFlowId: selectedCf.id,
        matchedAmounts: selectedLines.map((l) => Number(l.amount ?? 0)),
        userId,
      });
      if (error) throw error;
      toast.success(
        selectedLines.length > 1
          ? `${selectedLines.length} pagamentos conciliados com 1 título`
          : 'Lançamento conciliado'
      );
      setSelectedLineIds(new Set());
      setSelectedCfId(null);
      await onMatched?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao conciliar');
    } finally {
      setSaving(false);
    }
  };

  if (!reconciliationId) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Abra ou crie uma conciliação para usar o pareamento em duas colunas.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Link2 className="h-4 w-4 sm:h-5 sm:w-5" />
          Pareamento extrato × sistema
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal">
          Selecione 1 ou mais linhas do extrato (esquerda) e 1 lançamento do sistema (direita). O valor
          deve bater para confirmar o grupo.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* COLUNA ESQUERDA — EXTRATO DO BANCO */}
          <Card className="border-2">
            <CardHeader className="p-3 pb-2 space-y-2">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-success" />
                <CardTitle className="text-sm font-semibold">
                  Extrato do banco · {pendingLines.length} pendente(s)
                </CardTitle>
                {selectedLineIds.size > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {selectedLineIds.size} selec.
                  </Badge>
                )}
              </div>
              <Input
                placeholder="Filtrar (descrição, valor, data)"
                value={bankFilter}
                onChange={(e) => setBankFilter(e.target.value)}
                className="h-8 text-xs"
              />
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[420px]">
                <div className="divide-y">
                  {filteredLines.length === 0 ? (
                    <p className="p-4 text-xs text-muted-foreground text-center">
                      Nenhuma linha pendente.
                    </p>
                  ) : (
                    filteredLines.map((l) => {
                      const selected = selectedLineIds.has(l.id);
                      return (
                        <label
                          key={l.id}
                          className={`flex items-start gap-2 p-2 sm:p-3 cursor-pointer hover:bg-muted/30 ${
                            selected ? 'bg-muted/40' : ''
                          }`}
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleLine(l.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-xs font-medium truncate">
                                {l.description ?? '—'}
                              </span>
                              <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                                {formatBRL(Number(l.amount ?? 0))}
                              </span>
                            </div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              {l.posted_at ? formatDateBR(l.posted_at) : '—'}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* COLUNA DIREITA — SISTEMA */}
          <Card className="border-2">
            <CardHeader className="p-3 pb-2 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-foreground" />
                <CardTitle className="text-sm font-semibold">
                  Sistema · {pendingCfs.length} pendente(s)
                </CardTitle>
                {selectedCfId && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    1 selec.
                  </Badge>
                )}
              </div>
              <Input
                placeholder="Filtrar (descrição, valor, data)"
                value={sysFilter}
                onChange={(e) => setSysFilter(e.target.value)}
                className="h-8 text-xs"
              />
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[420px]">
                <div className="divide-y">
                  {filteredCfs.length === 0 ? (
                    <p className="p-4 text-xs text-muted-foreground text-center">
                      Nenhum lançamento pendente.
                    </p>
                  ) : (
                    filteredCfs.map((c) => {
                      const selected = selectedCfId === c.id;
                      return (
                        <label
                          key={c.id}
                          className={`flex items-start gap-2 p-2 sm:p-3 cursor-pointer hover:bg-muted/30 ${
                            selected ? 'bg-muted/40' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="cf-pick"
                            checked={selected}
                            onChange={() => setSelectedCfId(c.id)}
                            className="mt-1.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-xs font-medium truncate">
                                {c.description ?? '—'}
                              </span>
                              <span
                                className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                                  c.transaction_type === 'income' ? 'text-success' : 'text-destructive'
                                }`}
                              >
                                {formatBRL(Number(c.amount ?? 0))}
                              </span>
                            </div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              {c.transaction_date ? formatDateBR(c.transaction_date) : '—'}
                              {c.transaction_type ? ` · ${c.transaction_type}` : ''}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* RESUMO + AÇÃO */}
        {(selectedLineIds.size > 0 || selectedCfId) && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Soma extrato</p>
                  <p className="text-sm sm:text-base font-semibold text-success whitespace-nowrap">
                    {formatBRL(sumSelectedLines)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {selectedLines.length} linha(s)
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Sistema</p>
                  <p className="text-sm sm:text-base font-semibold whitespace-nowrap">
                    {selectedCf ? formatBRL(cfAmount) : '—'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {selectedCf?.description ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Diferença</p>
                  <p
                    className={`text-sm sm:text-base font-semibold whitespace-nowrap ${
                      isMatch ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {selectedCf ? formatBRL(delta) : '—'}
                  </p>
                </div>
                <div className="flex flex-col gap-1 justify-end">
                  {isMatch ? (
                    <Badge variant="default" className="text-[10px] sm:text-xs">
                      ✓ Valores batem
                    </Badge>
                  ) : selectedCf ? (
                    <Badge variant="destructive" className="text-[10px] sm:text-xs">
                      Valores divergem
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      Selecione 1 lançamento
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLineIds(new Set());
                    setSelectedCfId(null);
                  }}
                >
                  Limpar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!isMatch || saving}
                  onClick={() => void handleConfirm()}
                >
                  {saving ? 'Conciliando…' : 'Confirmar pareamento'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
