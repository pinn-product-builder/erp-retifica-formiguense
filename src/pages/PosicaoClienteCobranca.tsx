import { useMemo, useState } from 'react';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { CustomerPositionSummary } from '@/components/financial/customer-position/CustomerPositionSummary';
import { CustomerPositionReceivableTable } from '@/components/financial/customer-position/CustomerPositionReceivableTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  useCustomerArPosition,
  type CustomerArPositionStatusFilter,
} from '@/hooks/useCustomerArPosition';
import { CustomerArPositionService } from '@/services/financial/customerArPositionService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function PosicaoClienteCobranca() {
  const {
    accessibleOrgs,
    matches,
    lines,
    summary,
    loading,
    error,
    lastDocument,
    search,
    clear,
  } = useCustomerArPosition();

  const [documentInput, setDocumentInput] = useState('');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<CustomerArPositionStatusFilter>('all');

  const filteredLines = useMemo(() => {
    let list = lines;
    if (orgFilter !== 'all') {
      list = list.filter((l) => l.orgId === orgFilter);
    }
    if (statusFilter === 'open') {
      list = list.filter((l) => l.statusRaw !== 'paid' && l.statusRaw !== 'cancelled');
    } else if (statusFilter === 'paid') {
      list = list.filter((l) => l.statusRaw === 'paid');
    }
    return list;
  }, [lines, orgFilter, statusFilter]);

  const displaySummary = useMemo(() => {
    if (!summary) return null;
    if (orgFilter === 'all' && statusFilter === 'all') return summary;
    return CustomerArPositionService.summarizeFilteredLines(filteredLines);
  }, [summary, orgFilter, statusFilter, filteredLines]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void search(documentInput);
  };

  const handleClear = () => {
    setDocumentInput('');
    setOrgFilter('all');
    setStatusFilter('all');
    clear();
  };

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6 max-w-full min-w-0">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Posição do cliente</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Contas a receber e recebimentos consolidados por CPF/CNPJ nas empresas às quais você tem
            acesso.
          </p>
        </div>

        <Alert className="border-muted">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-sm">Mesmo cliente em várias empresas</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            O vínculo entre Favarini, Diesel e Refor Diesel é feito pelo documento cadastrado em cada
            organização. Status &quot;Adiantado&quot; indica quitação antes do vencimento. Protesto e
            jurídico dependem de evolução futura do cadastro de cobrança.
          </AlertDescription>
        </Alert>

        {accessibleOrgs.length === 0 && (
          <p className="text-sm text-destructive">Nenhuma organização disponível para sua sessão.</p>
        )}

        <Card className="border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Consulta</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Digite CPF ou CNPJ (com ou sem máscara). A busca usa todas as organizações em que você tem
              perfil.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="space-y-2 flex-1 min-w-0">
                <Label htmlFor="doc-search">CPF / CNPJ</Label>
                <Input
                  id="doc-search"
                  value={documentInput}
                  onChange={(e) => setDocumentInput(e.target.value)}
                  placeholder="000.000.000-00 ou CNPJ"
                  className="max-w-md"
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <Button type="submit" disabled={loading || accessibleOrgs.length === 0}>
                  {loading ? 'Buscando…' : 'Buscar'}
                </Button>
                <Button type="button" variant="outline" onClick={handleClear}>
                  Limpar
                </Button>
              </div>
            </form>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {lastDocument && matches.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="text-muted-foreground">Cliente encontrado em:</span>
                {matches.map((m) => (
                  <Badge key={`${m.orgId}-${m.customerId}`} variant="secondary" className="font-normal">
                    {m.organizationName}
                  </Badge>
                ))}
              </div>
            )}

            {lastDocument && matches.length === 0 && !loading && !error && (
              <p className="text-sm text-muted-foreground">
                Nenhum cliente com esse documento nas organizações acessíveis.
              </p>
            )}
          </CardContent>
        </Card>

        {summary != null && lastDocument && matches.length > 0 && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="space-y-2 min-w-0 sm:max-w-[220px]">
                <Label>Empresa</Label>
                <Select value={orgFilter} onValueChange={setOrgFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {accessibleOrgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-0 sm:max-w-[200px]">
                <Label>Situação do título</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as CustomerArPositionStatusFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="open">Em aberto</SelectItem>
                    <SelectItem value="paid">Quitados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <CustomerPositionSummary summary={displaySummary} loading={loading} />

            <Card className="border p-3 sm:p-4">
              <CustomerPositionReceivableTable
                loading={loading}
                rows={filteredLines}
                emptyMessage={
                  filteredLines.length === 0 && lines.length > 0
                    ? 'Nenhum título com os filtros atuais.'
                    : 'Nenhum título encontrado para este documento.'
                }
              />
            </Card>
          </>
        )}
      </div>
    </FinancialPageShell>
  );
}
