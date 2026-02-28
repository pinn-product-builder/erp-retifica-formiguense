import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  TrendingUp,
  Layers,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
} from 'lucide-react';
import { useCostMethod } from '@/hooks/useCostMethod';
import {
  COST_METHOD_LABELS,
  type CostMethod,
  type CostMethodChange,
  type CostLayer,
} from '@/services/CostMethodService';
import { inventoryService } from '@/services/InventoryService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function CostMethodBadge({ method }: { method: CostMethod }) {
  const colors: Record<CostMethod, string> = {
    moving_avg: 'bg-blue-100 text-blue-800',
    fifo: 'bg-purple-100 text-purple-800',
    specific_id: 'bg-teal-100 text-teal-800',
  };
  return (
    <Badge className={`${colors[method]} text-xs`}>{COST_METHOD_LABELS[method]}</Badge>
  );
}

function CostLayerRow({ layer, index }: { layer: CostLayer; index: number }) {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2 sm:p-3 border rounded-lg text-xs sm:text-sm hover:bg-muted/30">
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">#{index + 1}</span>
        <span>{formatDate(layer.entry_date)}</span>
      </div>
      <div>
        <span className="text-muted-foreground sm:hidden">Orig.: </span>
        {layer.quantity_original} un
      </div>
      <div>
        <span className="text-muted-foreground sm:hidden">Rest.: </span>
        <span className={layer.quantity_remaining === 0 ? 'text-muted-foreground line-through' : 'font-medium'}>
          {layer.quantity_remaining} un
        </span>
      </div>
      <div>
        <span className="text-muted-foreground sm:hidden">C.Unit.: </span>
        {formatCurrency(layer.unit_cost)}
      </div>
      <div className="font-medium">
        <span className="text-muted-foreground sm:hidden">Total: </span>
        {formatCurrency(layer.total_cost)}
      </div>
    </div>
  );
}

function PendingChangeCard({
  change,
  onApprove,
  onReject,
}: {
  change: CostMethodChange;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="border-l-4 border-l-yellow-400">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-yellow-600" />
              <span className="text-xs sm:text-sm font-medium">Solicitação de Alteração</span>
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendente</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <CostMethodBadge method={change.old_method as CostMethod} />
              <span className="text-muted-foreground">→</span>
              <CostMethodBadge method={change.new_method as CostMethod} />
            </div>
            <p className="text-xs text-muted-foreground italic">"{change.justification}"</p>
            <p className="text-xs text-muted-foreground">{formatDate(change.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7 gap-1 text-xs bg-green-600 hover:bg-green-700" onClick={() => onApprove(change.id)}>
              <CheckCircle className="w-3 h-3" />
              Aprovar
            </Button>
            <Button size="sm" variant="destructive" className="h-7 gap-1 text-xs" onClick={() => onReject(change.id)}>
              <XCircle className="w-3 h-3" />
              Rejeitar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PartOption {
  id: string;
  part_name: string;
  part_code: string | null;
  cost_method: string;
}

export default function CostMethodManager() {
  const { layers, pagination, pendingChanges, summary, loading, fetchLayers, fetchSummary, approveMethodChange, rejectMethodChange, requestMethodChange } =
    useCostMethod();

  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<CostMethod>('fifo');
  const [justification, setJustification] = useState('');

  // Buscador do dialog de solicitação
  const [partSearch, setPartSearch] = useState('');
  const [partOptions, setPartOptions] = useState<PartOption[]>([]);
  const [selectedPart, setSelectedPart] = useState<PartOption | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Buscador da aba de camadas
  const [layerPartSearch, setLayerPartSearch] = useState('');
  const [layerPartOptions, setLayerPartOptions] = useState<PartOption[]>([]);
  const [selectedLayerPart, setSelectedLayerPart] = useState<PartOption | null>(null);
  const [layerSearchLoading, setLayerSearchLoading] = useState(false);

  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const doSearchParts = useCallback(async (
    term: string,
    setOptions: (opts: PartOption[]) => void,
    setLoading: (v: boolean) => void
  ) => {
    if (!currentOrganization?.id || term.length < 2) {
      setOptions([]);
      return;
    }
    try {
      setLoading(true);
      const result = await inventoryService.getAllParts(currentOrganization.id, { search: term });
      setOptions(result.map((p) => ({
        id: p.id,
        part_name: p.part_name,
        part_code: p.part_code,
        cost_method: (p as unknown as { cost_method?: string }).cost_method ?? 'moving_avg',
      })));
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  // Debounce para busca no dialog
  useEffect(() => {
    const timer = setTimeout(() => doSearchParts(partSearch, setPartOptions, setSearchLoading), 300);
    return () => clearTimeout(timer);
  }, [partSearch, doSearchParts]);

  // Debounce para busca na aba de camadas
  useEffect(() => {
    const timer = setTimeout(() => doSearchParts(layerPartSearch, setLayerPartOptions, setLayerSearchLoading), 300);
    return () => clearTimeout(timer);
  }, [layerPartSearch, doSearchParts]);

  const handleSelectLayerPart = useCallback((part: PartOption) => {
    setSelectedLayerPart(part);
    setLayerPartSearch(`${part.part_code ? part.part_code + ' — ' : ''}${part.part_name}`);
    setLayerPartOptions([]);
    fetchLayers(part.id);
    fetchSummary(part.id);
  }, [fetchLayers, fetchSummary]);

  const handleOpenDialog = () => {
    setSelectedPart(null);
    setPartSearch('');
    setPartOptions([]);
    setJustification('');
    setSelectedMethod('fifo');
    setIsRequestDialogOpen(true);
  };

  const handleSelectPart = (part: PartOption) => {
    setSelectedPart(part);
    setPartSearch(`${part.part_code ? part.part_code + ' — ' : ''}${part.part_name}`);
    setPartOptions([]);
    const current = part.cost_method as CostMethod;
    const options = (Object.keys(COST_METHOD_LABELS) as CostMethod[]).filter((m) => m !== current);
    setSelectedMethod(options[0] ?? 'fifo');
  };

  const handleApprove = async (changeId: string) => {
    if (!user?.id) return;
    await approveMethodChange(changeId, user.id);
  };

  const handleReject = async (changeId: string) => {
    if (!user?.id) return;
    await rejectMethodChange(changeId, user.id);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedPart || !justification.trim()) return;
    const currentMethod = selectedPart.cost_method as CostMethod;
    const success = await requestMethodChange(
      selectedPart.id, currentMethod, selectedMethod, justification, user.id
    );
    if (success) {
      setIsRequestDialogOpen(false);
      setJustification('');
      setSelectedPart(null);
      setPartSearch('');
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="layers" className="space-y-4">
        <TabsList className="w-full grid grid-cols-2 h-9">
          <TabsTrigger value="layers" className="text-xs sm:text-sm">
            <Layers className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Camadas de Custo
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Aprovações
            {pendingChanges.length > 0 && (
              <Badge className="ml-1.5 bg-yellow-500 text-white text-xs px-1.5 py-0 h-4">{pendingChanges.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Camadas de Custo (FIFO)</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5">
                    Camadas de custo por ordem de entrada — método PEPS
                  </CardDescription>
                </div>
                <Button size="sm" className="gap-1.5 self-start" onClick={handleOpenDialog}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Solicitar Alteração de Método</span>
                  <span className="sm:hidden">Solicitar</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3">

              {/* Seletor de peça */}
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium">Selecionar Peça</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={layerPartSearch}
                    onChange={(e) => {
                      setLayerPartSearch(e.target.value);
                      if (selectedLayerPart) setSelectedLayerPart(null);
                    }}
                    placeholder="Buscar peça por nome ou código..."
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                {layerSearchLoading && (
                  <p className="text-xs text-muted-foreground px-1">Buscando...</p>
                )}
                {layerPartOptions.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto divide-y shadow-sm">
                    {layerPartOptions.map((part) => (
                      <button
                        key={part.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                        onClick={() => handleSelectLayerPart(part)}
                      >
                        <p className="text-xs sm:text-sm font-medium truncate">{part.part_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {part.part_code && (
                            <span className="text-xs text-muted-foreground font-mono">{part.part_code}</span>
                          )}
                          <CostMethodBadge method={(part.cost_method as CostMethod) || 'moving_avg'} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedLayerPart && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border text-xs">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate">{selectedLayerPart.part_name}</span>
                    <CostMethodBadge method={(selectedLayerPart.cost_method as CostMethod) || 'moving_avg'} />
                  </div>
                )}
              </div>

              {/* Stats rápidas da peça selecionada */}
              {summary && selectedLayerPart && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-muted/30 border text-xs">
                  <div>
                    <p className="text-muted-foreground">Camadas</p>
                    <p className="font-semibold">{summary.total_layers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Qtd. Total</p>
                    <p className="font-semibold">{summary.total_quantity} un</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Custo Total</p>
                    <p className="font-semibold whitespace-nowrap">{formatCurrency(summary.total_cost)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Custo Médio</p>
                    <p className="font-semibold whitespace-nowrap">{formatCurrency(summary.avg_cost)}/un</p>
                  </div>
                </div>
              )}

              {summary && summary.next_layer_cost !== null && selectedLayerPart && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs sm:text-sm text-blue-800">
                  Próxima saída consumirá a camada mais antiga ao custo de{' '}
                  <strong>{formatCurrency(summary.next_layer_cost)}/un</strong>
                </div>
              )}

              {/* Tabela de camadas */}
              {!selectedLayerPart ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Search className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Busque e selecione uma peça acima para visualizar as camadas de custo FIFO
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden sm:grid sm:grid-cols-5 gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b">
                    <span>Data Entrada</span>
                    <span>Qtd. Original</span>
                    <span>Qtd. Restante</span>
                    <span>Custo Unit.</span>
                    <span>Total</span>
                  </div>

                  {loading ? (
                    <p className="text-center text-sm text-muted-foreground py-8">Carregando camadas...</p>
                  ) : layers.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2">
                      <Layers className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground text-center">
                        Nenhuma camada encontrada para esta peça.
                        {selectedLayerPart.cost_method !== 'fifo' && (
                          <span className="block mt-1 text-yellow-700">
                            Esta peça usa método <strong>{COST_METHOD_LABELS[selectedLayerPart.cost_method as CostMethod]}</strong> — camadas só existem para peças com método FIFO.
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {layers.map((layer, i) => (
                        <CostLayerRow key={layer.id} layer={layer} index={i} />
                      ))}
                    </div>
                  )}

                  {pagination.totalPages > 1 && (
                    <Pagination className="mt-3">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => selectedLayerPart && fetchLayers(selectedLayerPart.id, pagination.page - 1)}
                            aria-disabled={pagination.page <= 1}
                            className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <span className="text-xs px-3 py-2">Página {pagination.page} de {pagination.totalPages}</span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => selectedLayerPart && fetchLayers(selectedLayerPart.id, pagination.page + 1)}
                            aria-disabled={pagination.page >= pagination.totalPages}
                            className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg">Solicitações Pendentes</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Aprovações de alteração de método de custeio
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {pendingChanges.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingChanges.map((change) => (
                    <PendingChangeCard
                      key={change.id}
                      change={change}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isRequestDialogOpen} onOpenChange={(open) => {
        setIsRequestDialogOpen(open);
        if (!open) { setSelectedPart(null); setPartSearch(''); setPartOptions([]); }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solicitar Alteração de Método</DialogTitle>
            <DialogDescription>
              A alteração requer aprovação gerencial e será registrada em auditoria
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800 space-y-1">
              <p className="font-medium">Atenção:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Requer aprovação gerencial</li>
                <li>Será registrada em log de auditoria</li>
                <li>Afetará o CMV a partir da data de alteração</li>
                <li>Não altera o histórico retroativamente</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Peça *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={partSearch}
                  onChange={(e) => {
                    setPartSearch(e.target.value);
                    if (selectedPart) setSelectedPart(null);
                  }}
                  placeholder="Buscar por nome ou código..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
              {searchLoading && (
                <p className="text-xs text-muted-foreground px-1">Buscando...</p>
              )}
              {partOptions.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto divide-y shadow-sm">
                  {partOptions.map((part) => (
                    <button
                      key={part.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                      onClick={() => handleSelectPart(part)}
                    >
                      <p className="text-xs sm:text-sm font-medium truncate">{part.part_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {part.part_code && (
                          <span className="text-xs text-muted-foreground font-mono">{part.part_code}</span>
                        )}
                        <CostMethodBadge method={(part.cost_method as CostMethod) || 'moving_avg'} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedPart && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{selectedPart.part_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Método atual: <CostMethodBadge method={(selectedPart.cost_method as CostMethod) || 'moving_avg'} />
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Novo Método *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(COST_METHOD_LABELS) as CostMethod[]).map((method) => {
                  const isCurrent = selectedPart?.cost_method === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      disabled={isCurrent}
                      className={`p-2.5 rounded-lg border text-xs text-center transition-all ${
                        isCurrent
                          ? 'border-border bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50'
                          : selectedMethod === method
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => !isCurrent && setSelectedMethod(method)}
                    >
                      {COST_METHOD_LABELS[method]}
                      {isCurrent && <span className="block text-[10px] mt-0.5">(atual)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Justificativa *</Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Descreva o motivo da alteração..."
                required
                className="text-sm resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsRequestDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!selectedPart || !justification.trim() || selectedPart.cost_method === selectedMethod}
              >
                Solicitar Alteração
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
