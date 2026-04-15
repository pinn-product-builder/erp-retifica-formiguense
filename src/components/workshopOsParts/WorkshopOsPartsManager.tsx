import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  ArrowDownCircle,
  RefreshCw,
  ReceiptText,
  Trash2,
  ArrowLeftRight,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWorkshopOsParts } from '@/hooks/useWorkshopOsParts';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  getWorkshopLineRemainingToRelease,
  type CatalogPartResult,
  type WorkshopPartLine,
} from '@/services/workshopOsParts/WorkshopOsPartsService';
import type { PriceBasis } from '@/services/workshopOsParts/schemas';
import { Autocomplete, TextField } from '@mui/material';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getLineState(line: WorkshopPartLine): 'Anotado' | 'Baixado' | 'Parcial' | 'Cancelado' {
  const noted = Number(line.qtyNoted ?? 0);
  const cancelled = Number(line.qtyCancelled ?? 0);
  const released = Number(line.qtyReleased ?? 0);
  // Evita qtyNoted=0 fazer "0 >= 0" e marcar como cancelada sem saldo para baixa
  if (noted <= 0) return 'Anotado';
  if (cancelled >= noted) return 'Cancelado';
  const maxStillFromStock = noted - cancelled;
  if (released <= 0) return 'Anotado';
  if (released >= maxStillFromStock) return 'Baixado';
  return 'Parcial';
}

export function WorkshopOsPartsManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data, error, isLoading, catalog, orderSuggestions, actions } = useWorkshopOsParts();
  const [orderNumber, setOrderNumber] = useState('');
  const [openExtraDialog, setOpenExtraDialog] = useState(false);
  const [openSubstituteDialog, setOpenSubstituteDialog] = useState(false);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const cancelReasonInputRef = useRef<HTMLInputElement>(null);
  const cancelPanelRef = useRef<HTMLDivElement>(null);
  const [extraForm, setExtraForm] = useState({
    partId: null as string | null,
    partCode: '',
    partName: '',
    unitPriceApplied: 0,
    sectionName: 'Montagem',
    quantity: 1,
    notes: '',
  });
  const [releaseQty, setReleaseQty] = useState(1);
  const [cancelQty, setCancelQty] = useState(1);
  const [cancelReason, setCancelReason] = useState('');
  /** Mantém a opção exibida no Autocomplete mesmo após nova busca paginada. */
  const [extraCatalogSelection, setExtraCatalogSelection] = useState<CatalogPartResult | null>(null);
  const [substCatalogSelection, setSubstCatalogSelection] = useState<CatalogPartResult | null>(null);
  const [substForm, setSubstForm] = useState<{
    partId: string | null;
    partCode: string;
    partName: string;
    quantity: number;
    sectionName: string;
    priceBasis: PriceBasis;
    manualUnitPrice: number;
  }>({
    partId: null,
    partCode: '',
    partName: '',
    quantity: 1,
    sectionName: 'Montagem',
    priceBasis: 'substitute',
    manualUnitPrice: 0,
  });

  /** Baixa/cancelamento exigem exatamente uma linha; com várias marcadas não há linha “ativa” para o painel. */
  const selectedLine = useMemo(() => {
    if (!data?.workshopLines?.length || selectedLineIds.length !== 1) return null;
    const id = selectedLineIds[0];
    return data.workshopLines.find((line) => line.id === id) ?? null;
  }, [data?.workshopLines, selectedLineIds]);

  const remainingToRelease = useMemo(
    () => (selectedLine ? getWorkshopLineRemainingToRelease(selectedLine) : 0),
    [selectedLine]
  );

  useEffect(() => {
    setReleaseQty(1);
  }, [selectedLine?.id]);

  useEffect(() => {
    if (selectedLine && !selectedLine.isReservationOnly) {
      const max = Math.max(0, Number(selectedLine.qtyNoted) - Number(selectedLine.qtyCancelled));
      setCancelQty((q) => Math.min(Math.max(1, q), Math.max(1, max || 1)));
    }
  }, [selectedLine]);

  const catalogOptions = useMemo(() => {
    const raw = catalog?.data ?? [];
    if (!extraCatalogSelection) return raw;
    if (raw.some((p) => p.id === extraCatalogSelection.id)) return raw;
    return [extraCatalogSelection, ...raw];
  }, [catalog?.data, extraCatalogSelection]);

  const catalogAutocompleteValue = useMemo((): CatalogPartResult | null => {
    if (extraCatalogSelection && extraCatalogSelection.id === extraForm.partId) {
      return extraCatalogSelection;
    }
    if (!extraForm.partId || !catalog?.data?.length) return null;
    return catalog.data.find((p) => p.id === extraForm.partId) ?? extraCatalogSelection;
  }, [extraForm.partId, catalog?.data, extraCatalogSelection]);

  useEffect(() => {
    if (openExtraDialog) {
      void actions.searchCatalog('', 1, 10);
    }
  }, [openExtraDialog, actions]);

  useEffect(() => {
    if (openSubstituteDialog) {
      void actions.searchCatalog('', 1, 10);
    }
  }, [openSubstituteDialog, actions]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !data) return;
      if (openExtraDialog || openSubstituteDialog) return;
      e.preventDefault();
      cancelPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      window.setTimeout(() => cancelReasonInputRef.current?.focus(), 120);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [data, openExtraDialog, openSubstituteDialog]);

  const substCatalogOptions = useMemo(() => {
    const raw = catalog?.data ?? [];
    if (!substCatalogSelection) return raw;
    if (raw.some((p) => p.id === substCatalogSelection.id)) return raw;
    return [substCatalogSelection, ...raw];
  }, [catalog?.data, substCatalogSelection]);

  const substCatalogAutocompleteValue = useMemo((): CatalogPartResult | null => {
    if (substCatalogSelection && substCatalogSelection.id === substForm.partId) {
      return substCatalogSelection;
    }
    if (!substForm.partId || !catalog?.data?.length) return null;
    return catalog.data.find((p) => p.id === substForm.partId) ?? substCatalogSelection;
  }, [substForm.partId, catalog?.data, substCatalogSelection]);

  const remainingForSubstitute = useMemo(
    () =>
      selectedLine && !selectedLine.isReservationOnly ? getWorkshopLineRemainingToRelease(selectedLine) : 0,
    [selectedLine]
  );

  const availableToCancel = useMemo(
    () =>
      selectedLine && !selectedLine.isReservationOnly
        ? Math.max(0, Number(selectedLine.qtyNoted) - Number(selectedLine.qtyCancelled))
        : 0,
    [selectedLine]
  );

  const applyCatalogPartToForm = (part: CatalogPartResult) => {
    setExtraCatalogSelection(part);
    setExtraForm((prev) => ({
      ...prev,
      partId: part.id,
      partCode: part.part_code,
      partName: part.part_name,
      unitPriceApplied: Number(part.unit_cost ?? 0),
    }));
  };

  const applySubstCatalogPart = (part: CatalogPartResult) => {
    setSubstCatalogSelection(part);
    setSubstForm((prev) => ({
      ...prev,
      partId: part.id,
      partCode: part.part_code,
      partName: part.part_name,
      manualUnitPrice: Number(part.unit_cost ?? 0),
    }));
  };

  const resolveReplacedByLabel = useCallback(
    (line: WorkshopPartLine) => {
      if (!line.replacesLineId || !data?.workshopLines) return null;
      const parent = data.workshopLines.find((l) => l.id === line.replacesLineId);
      return parent ? `${parent.partCode} — ${parent.partName}` : 'Linha original';
    },
    [data?.workshopLines]
  );

  const handleSearchOrder = async () => {
    if (!orderNumber.trim()) return;
    await actions.searchOrderByNumber(orderNumber.trim());
  };

  const handleOrderInputChange = async (value: string) => {
    setOrderNumber(value);
    await actions.searchOrderSuggestions(value);
  };

  const handleOrderSelection = async (selectedOrderNumber: string) => {
    const normalized = selectedOrderNumber.trim();
    if (!normalized) return;
    setOrderNumber(normalized);
    await actions.searchOrderByNumber(normalized);
  };

  const toggleLineSelection = (lineId: string, checked: boolean) => {
    if (checked) {
      setSelectedLineIds((prev) => [...prev, lineId]);
      return;
    }
    setSelectedLineIds((prev) => prev.filter((id) => id !== lineId));
  };

  const handleCreateExtra = async () => {
    if (!data?.id) return;
    const code = extraForm.partCode.trim();
    const name = extraForm.partName.trim();
    if (!code || !name) {
      toast({
        title: 'Dados da peça',
        description: 'Informe o código e a descrição da peça',
        variant: 'destructive',
      });
      return;
    }

    await actions.addExtraLine({
      orderId: data.id,
      partId: extraForm.partId ?? undefined,
      sectionName: extraForm.sectionName,
      partCode: code,
      partName: name,
      quantity: extraForm.quantity,
      unitPriceApplied: Number(extraForm.unitPriceApplied ?? 0),
      notes: extraForm.notes || undefined,
    });
    setOpenExtraDialog(false);
    setExtraCatalogSelection(null);
    setExtraForm({
      partId: null,
      partCode: '',
      partName: '',
      unitPriceApplied: 0,
      sectionName: 'Montagem',
      quantity: 1,
      notes: '',
    });
    toast({ title: 'Peça extra adicionada com sucesso' });
  };

  const handleRelease = async () => {
    if (!selectedLine || selectedLineIds.length !== 1) {
      toast({
        title: 'Selecione uma única peça da OS',
        description: 'Use o checkbox para selecionar somente 1 linha antes de dar baixa',
        variant: 'destructive',
      });
      return;
    }
    if (selectedLine.isReservationOnly) {
      toast({
        title: 'Peça só em reserva',
        description: 'Baixa de estoque pela oficina só vale para linhas já anotadas na tabela de peças. Remova a reserva ou anote a peça antes.',
        variant: 'destructive',
      });
      return;
    }
    if (getWorkshopLineRemainingToRelease(selectedLine) <= 0) {
      toast({
        title: 'Sem saldo para baixa',
        description: 'Esta linha já foi totalmente baixada ou cancelada.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await actions.releaseStock({
        lineId: selectedLine.id,
        quantity: releaseQty,
        reason: `Baixa de peça na OS ${data?.orderNumber ?? ''}`,
      });
      toast({ title: 'Baixa registrada com sucesso' });
      setSelectedLineIds([]);
      setReleaseQty(1);
    } catch {
      // Erro já tratado no hook (toast/state)
    }
  };

  const handleCancelPartial = async () => {
    if (!selectedLine || selectedLineIds.length !== 1) {
      toast({
        title: 'Selecione uma única peça da OS',
        description: 'Use o checkbox para selecionar somente 1 linha antes de cancelar',
        variant: 'destructive',
      });
      return;
    }
    if (selectedLine.isReservationOnly) {
      toast({
        title: 'Peça só em reserva',
        description: 'Para linhas que vêm só da reserva comercial, use Remover selecionadas para cancelar a reserva.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await actions.cancelPartial({
        lineId: selectedLine.id,
        quantity: cancelQty,
        reason: cancelReason,
        issueReceipt: false,
      });

      const printWindow = window.open('', '_blank', 'width=700,height=700');
      if (printWindow && data) {
        const operatorLabel = user?.email ?? user?.id ?? '—';
        const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"/><title>Recibo de cancelamento</title></head>
<body style="font-family: Arial, sans-serif; padding: 24px; max-width: 640px; margin: 0 auto;">
  <h2 style="margin-top:0;">Recibo de cancelamento de consumo</h2>
  <p style="color:#444;font-size:14px;">${escapeHtml(new Date().toLocaleString('pt-BR'))}</p>
  <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;"/>
  <p><strong>OS:</strong> ${escapeHtml(data.orderNumber)}</p>
  <p><strong>Cliente:</strong> ${escapeHtml(data.customerName ?? 'Não informado')}</p>
  <p><strong>Peça:</strong> ${escapeHtml(selectedLine.partName)} (${escapeHtml(selectedLine.partCode)})</p>
  <p><strong>Quantidade cancelada:</strong> ${cancelQty}</p>
  <p><strong>Motivo:</strong> ${escapeHtml(cancelReason)}</p>
  <p><strong>Operador:</strong> ${escapeHtml(operatorLabel)}</p>
  <p style="margin-top:24px;font-size:12px;color:#666;">Documento para conferência interna. Estoque ajustado conforme regras de cancelamento parcial.</p>
</body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
      }
      toast({ title: 'Cancelamento parcial concluído' });
      setSelectedLineIds([]);
      setCancelQty(1);
      setCancelReason('');
    } catch {
      // Erro já tratado no hook (toast/state)
    }
  };

  const handleOpenSubstitute = () => {
    if (!selectedLine || selectedLineIds.length !== 1) {
      toast({
        title: 'Selecione uma única peça',
        description: 'Marque apenas uma linha da tabela para substituir.',
        variant: 'destructive',
      });
      return;
    }
    if (selectedLine.isReservationOnly) {
      toast({
        title: 'Linha só em reserva',
        description: 'Anote a peça na OS antes de substituir, ou use o fluxo de reservas.',
        variant: 'destructive',
      });
      return;
    }
    const maxQty = getWorkshopLineRemainingToRelease(selectedLine);
    if (maxQty <= 0) {
      toast({
        title: 'Sem saldo para substituição',
        description: 'Não há quantidade elegível nesta linha.',
        variant: 'destructive',
      });
      return;
    }
    setSubstCatalogSelection(null);
    setSubstForm({
      partId: null,
      partCode: '',
      partName: '',
      quantity: maxQty,
      sectionName: selectedLine.sectionName?.trim() || 'Montagem',
      priceBasis: 'substitute',
      manualUnitPrice: 0,
    });
    setOpenSubstituteDialog(true);
  };

  const handleSubstituteConfirm = async () => {
    if (!selectedLine || !data?.id) return;
    const code = substForm.partCode.trim();
    const name = substForm.partName.trim();
    if (!code || !name) {
      toast({
        title: 'Dados da peça substituta',
        description: 'Informe código e descrição da nova peça.',
        variant: 'destructive',
      });
      return;
    }
    const qty = Math.min(substForm.quantity, remainingForSubstitute);
    if (qty < 1) {
      toast({ title: 'Quantidade inválida', variant: 'destructive' });
      return;
    }
    const originalUnit = Number(selectedLine.unitPriceApplied ?? 0);
    let newUnitPrice = 0;
    if (substForm.priceBasis === 'original') {
      newUnitPrice = originalUnit;
    } else if (substForm.priceBasis === 'substitute') {
      newUnitPrice = Number(substCatalogSelection?.unit_cost ?? substForm.manualUnitPrice ?? 0);
    } else {
      newUnitPrice = Number(substForm.manualUnitPrice ?? 0);
    }
    if (substForm.priceBasis === 'manual' && newUnitPrice < 0) {
      toast({ title: 'Preço manual inválido', variant: 'destructive' });
      return;
    }
    if (substForm.priceBasis === 'substitute' && !substForm.partId) {
      toast({
        title: 'Selecione a peça no catálogo',
        description: 'Para usar o preço do catálogo, escolha uma peça na busca ou altere a opção de preço.',
        variant: 'destructive',
      });
      return;
    }

    await actions.substituteLine({
      lineId: selectedLine.id,
      newPartId: substForm.partId ?? undefined,
      newPartCode: code,
      newPartName: name,
      quantity: qty,
      sectionName: substForm.sectionName,
      newUnitPrice,
      originalUnitPriceSnapshot: originalUnit,
      priceBasis: substForm.priceBasis,
    });
    setOpenSubstituteDialog(false);
    setSubstCatalogSelection(null);
    setSelectedLineIds([]);
    toast({ title: 'Substituição registrada com sucesso' });
  };

  const handleRemoveSelected = async () => {
    if (selectedLineIds.length === 0) {
      toast({
        title: 'Nenhuma peça selecionada',
        description: 'Marque uma ou mais linhas para remover da OS',
        variant: 'destructive',
      });
      return;
    }

    await actions.removeLines(selectedLineIds);
    setSelectedLineIds([]);
    toast({ title: 'Peça(s) removida(s) da OS com sucesso' });
  };

  const handlePrintCommercialConference = () => {
    if (!data) return;
    const extras = data.workshopLines.filter((line) => line.isExtra);
    const originals = data.workshopLines.filter((line) => !line.isExtra);

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const buildRows = (lines: WorkshopPartLine[]) =>
      lines
        .map(
          (line) =>
            `<tr>
              <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(line.partCode)}</td>
              <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(line.partName)}</td>
              <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(getLineState(line))}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:right;">${line.qtyNoted}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:right;">${line.qtyReleased}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:right;">${line.qtyCancelled}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatCurrency(line.unitPriceApplied)}</td>
            </tr>`
        )
        .join('');

    const tableHead = `<thead><tr>
<th style="padding:8px;border:1px solid #ddd;">Código</th>
<th style="padding:8px;border:1px solid #ddd;">Descrição</th>
<th style="padding:8px;border:1px solid #ddd;">Estado</th>
<th style="padding:8px;border:1px solid #ddd;">Qtd anotada</th>
<th style="padding:8px;border:1px solid #ddd;">Qtd baixada</th>
<th style="padding:8px;border:1px solid #ddd;">Qtd cancelada</th>
<th style="padding:8px;border:1px solid #ddd;">Valor</th>
</tr></thead>`;

    printWindow.document.write(`
      <html>
        <head><title>Conferência Comercial - OS ${escapeHtml(data.orderNumber)}</title><meta charset="utf-8"/></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>OS ${escapeHtml(data.orderNumber)}</h2>
          <p>Cliente: ${escapeHtml(data.customerName ?? 'Não informado')}</p>
          <h3>Peças da proposta/originais (execução oficina)</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            ${tableHead}
            <tbody>${buildRows(originals)}</tbody>
          </table>
          <h3>Peças extras — conferência comercial</h3>
          <table style="width:100%;border-collapse:collapse;">
            ${tableHead}
            <tbody>${buildRows(extras)}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl">Gestão de Itens e Peças da OS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-3">
            <Autocomplete
              freeSolo
              options={orderSuggestions}
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.orderNumber
              }
              onInputChange={(_, value) => {
                void handleOrderInputChange(value);
              }}
              onChange={(_, option) => {
                if (typeof option === 'string') {
                  void handleOrderSelection(option);
                  return;
                }

                if (option?.orderNumber) {
                  void handleOrderSelection(option.orderNumber);
                }
              }}
              loading={isLoading}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium">{option.orderNumber}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {option.customerName ?? 'Cliente não informado'}
                    </span>
                  </div>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Digite o código da OS (ex.: S12786)"
                  size="small"
                />
              )}
            />
            <Button onClick={handleSearchOrder} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              Buscar OS
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {data ? (
        <>
          <Card>
            <CardContent className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">OS</p>
                <p className="text-sm sm:text-base font-semibold truncate">{data.orderNumber}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Cliente</p>
                <p className="text-sm sm:text-base font-semibold truncate">{data.customerName ?? 'Não informado'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Motor/Veículo</p>
                <p className="text-sm sm:text-base font-semibold truncate">{data.engineLabel ?? 'Não informado'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                <Badge variant="secondary">{data.status}</Badge>
              </div>
              <div className="min-w-0 sm:col-span-2 lg:col-span-1 xl:col-span-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Operador</p>
                <p className="text-sm sm:text-base font-semibold truncate" title={user?.email ?? user?.id ?? ''}>
                  {user?.email ?? user?.id ?? 'Não identificado'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Peças da proposta comercial (orçamento)</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Itens previstos na venda/orçamento vinculado à OS — conferência com o comercial.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveTable
                data={data.commercialParts ?? []}
                keyExtractor={(item) => item.key}
                emptyMessage="Nenhuma peça listada nos orçamentos detalhados desta OS"
                columns={[
                  {
                    key: 'code',
                    header: 'Código',
                    render: (item) => <span className="font-mono text-xs sm:text-sm">{item.code}</span>,
                    priority: 1,
                    minWidth: 100,
                  },
                  {
                    key: 'name',
                    header: 'Descrição',
                    render: (item) => item.name,
                    priority: 2,
                    minWidth: 180,
                  },
                  {
                    key: 'qty',
                    header: 'Qtd',
                    render: (item) => item.quantity,
                    priority: 1,
                    minWidth: 64,
                  },
                  {
                    key: 'unit',
                    header: 'Valor unit.',
                    render: (item) => (
                      <span className="whitespace-nowrap text-xs sm:text-sm">{formatCurrency(item.unitPrice)}</span>
                    ),
                    priority: 2,
                    minWidth: 100,
                  },
                  {
                    key: 'budget',
                    header: 'Orçamento',
                    render: (item) => (
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={item.sourceBudgetId}>
                        {item.sourceBudgetId ? `${item.sourceBudgetId.slice(0, 8)}…` : '—'}
                      </span>
                    ),
                    priority: 3,
                    minWidth: 100,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base sm:text-lg">Peças descritas da OS</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => actions.reload()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
                <Button variant="destructive" onClick={handleRemoveSelected} disabled={selectedLineIds.length === 0}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover selecionadas
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleOpenSubstitute}
                  disabled={
                    selectedLineIds.length !== 1 ||
                    !selectedLine ||
                    selectedLine.isReservationOnly ||
                    remainingForSubstitute <= 0
                  }
                >
                  <ArrowLeftRight className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Substituir peça</span>
                  <span className="sm:hidden">Substituir</span>
                </Button>
              </div>
              <Dialog
                open={openExtraDialog}
                onOpenChange={(open) => {
                  setOpenExtraDialog(open);
                  if (!open) {
                    setExtraCatalogSelection(null);
                    setExtraForm({
                      partId: null,
                      partCode: '',
                      partName: '',
                      unitPriceApplied: 0,
                      sectionName: 'Montagem',
                      quantity: 1,
                      notes: '',
                    });
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Incluir peça extra
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Nova peça extra</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Buscar peça no catálogo</Label>
                      <Autocomplete
                        options={catalogOptions}
                        value={catalogAutocompleteValue}
                        loading={isLoading}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                        getOptionLabel={(option) =>
                          typeof option === 'string'
                            ? option
                            : `${option.part_code ?? ''} — ${option.part_name ?? ''}`
                        }
                        onInputChange={(_, value) => {
                          void actions.searchCatalog(value, 1, 10);
                        }}
                        onChange={(_, option) => {
                          if (option && typeof option !== 'string' && 'id' in option) {
                            applyCatalogPartToForm(option as CatalogPartResult);
                          } else {
                            setExtraCatalogSelection(null);
                            setExtraForm((prev) => ({
                              ...prev,
                              partId: null,
                            }));
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            placeholder="Digite código ou descrição da peça"
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Código da peça</Label>
                      <Input
                        value={extraForm.partCode}
                        onChange={(e) => {
                          setExtraCatalogSelection(null);
                          setExtraForm((prev) => ({
                            ...prev,
                            partCode: e.target.value,
                            partId: null,
                          }));
                        }}
                        placeholder="Código"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Descrição</Label>
                      <Input
                        value={extraForm.partName}
                        onChange={(e) => {
                          setExtraCatalogSelection(null);
                          setExtraForm((prev) => ({
                            ...prev,
                            partName: e.target.value,
                            partId: null,
                          }));
                        }}
                        placeholder="Nome ou descrição da peça"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Seção</Label>
                      <Input value={extraForm.sectionName} onChange={(e) => setExtraForm((prev) => ({ ...prev, sectionName: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Quantidade</Label>
                      <Input type="number" min={1} value={extraForm.quantity} onChange={(e) => setExtraForm((prev) => ({ ...prev, quantity: Number(e.target.value || 1) }))} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Valor unitário</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={extraForm.unitPriceApplied}
                        onChange={(e) =>
                          setExtraForm((prev) => ({ ...prev, unitPriceApplied: Number(e.target.value) || 0 }))
                        }
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Observações</Label>
                      <Input
                        value={extraForm.notes}
                        onChange={(e) => setExtraForm((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateExtra}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog
                open={openSubstituteDialog}
                onOpenChange={(open) => {
                  setOpenSubstituteDialog(open);
                  if (!open) {
                    setSubstCatalogSelection(null);
                  }
                }}
              >
                <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Substituir peça na OS</DialogTitle>
                  </DialogHeader>
                  {selectedLine ? (
                    <div className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        Linha atual: <strong>{selectedLine.partCode}</strong> — {selectedLine.partName} · Preço aplicado:{' '}
                        {formatCurrency(Number(selectedLine.unitPriceApplied ?? 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Quantidade máxima nesta operação: <strong>{remainingForSubstitute}</strong>
                      </p>
                      <div className="space-y-1 sm:col-span-2">
                        <Label>Buscar peça substituta no catálogo</Label>
                        <Autocomplete
                          options={substCatalogOptions}
                          value={substCatalogAutocompleteValue}
                          loading={isLoading}
                          isOptionEqualToValue={(a, b) => a.id === b.id}
                          getOptionLabel={(option) =>
                            typeof option === 'string'
                              ? option
                              : `${option.part_code ?? ''} — ${option.part_name ?? ''}`
                          }
                          onInputChange={(_, value) => {
                            void actions.searchCatalog(value, 1, 10);
                          }}
                          onChange={(_, option) => {
                            if (option && typeof option !== 'string' && 'id' in option) {
                              applySubstCatalogPart(option as CatalogPartResult);
                            } else {
                              setSubstCatalogSelection(null);
                              setSubstForm((prev) => ({ ...prev, partId: null }));
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Código ou descrição da peça nova"
                            />
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Código da peça nova</Label>
                          <Input
                            value={substForm.partCode}
                            onChange={(e) =>
                              setSubstForm((prev) => ({
                                ...prev,
                                partCode: e.target.value,
                                partId: null,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Descrição</Label>
                          <Input
                            value={substForm.partName}
                            onChange={(e) =>
                              setSubstForm((prev) => ({
                                ...prev,
                                partName: e.target.value,
                                partId: null,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Seção</Label>
                          <Input
                            value={substForm.sectionName}
                            onChange={(e) => setSubstForm((prev) => ({ ...prev, sectionName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min={1}
                            max={remainingForSubstitute > 0 ? remainingForSubstitute : undefined}
                            value={substForm.quantity}
                            onChange={(e) =>
                              setSubstForm((prev) => ({
                                ...prev,
                                quantity: Number(e.target.value || 1),
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="rounded-md border p-3 space-y-2 bg-muted/30">
                        <Label className="text-sm font-medium">Preço aplicado na OS / baixa (dissimilar)</Label>
                        <p className="text-xs text-muted-foreground">
                          Preço atual na linha: {formatCurrency(Number(selectedLine.unitPriceApplied ?? 0))}
                          {substCatalogSelection ? (
                            <> · Catálogo (nova peça): {formatCurrency(Number(substCatalogSelection.unit_cost ?? 0))}</>
                          ) : null}
                        </p>
                        {Math.abs(
                          Number(selectedLine.unitPriceApplied ?? 0) -
                            Number(substCatalogSelection?.unit_cost ?? selectedLine.unitPriceApplied ?? 0)
                        ) > 0.009 && substCatalogSelection ? (
                          <p className="text-xs text-amber-600 dark:text-amber-500">
                            Preços diferentes — escolha explicitamente qual valor será aplicado na nova linha e na baixa.
                          </p>
                        ) : null}
                        <RadioGroup
                          value={substForm.priceBasis}
                          onValueChange={(v) =>
                            setSubstForm((prev) => ({ ...prev, priceBasis: v as PriceBasis }))
                          }
                          className="grid gap-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="original" id="pb-original" />
                            <Label htmlFor="pb-original" className="font-normal cursor-pointer">
                              Manter preço da linha original ({formatCurrency(Number(selectedLine.unitPriceApplied ?? 0))})
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="substitute" id="pb-substitute" />
                            <Label htmlFor="pb-substitute" className="font-normal cursor-pointer">
                              Usar preço da peça nova (catálogo)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="pb-manual" />
                            <Label htmlFor="pb-manual" className="font-normal cursor-pointer">
                              Informar valor manual
                            </Label>
                          </div>
                        </RadioGroup>
                        {substForm.priceBasis === 'manual' ? (
                          <div className="space-y-1">
                            <Label>Valor unitário manual</Label>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={substForm.manualUnitPrice}
                              onChange={(e) =>
                                setSubstForm((prev) => ({
                                  ...prev,
                                  manualUnitPrice: Number(e.target.value) || 0,
                                }))
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" type="button" onClick={() => setOpenSubstituteDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="button" onClick={() => void handleSubstituteConfirm()}>
                      Confirmar substituição
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handlePrintCommercialConference}>
                <ReceiptText className="w-4 h-4 mr-2" />
                Imprimir conferência
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <TooltipProvider delayDuration={200}>
                <ResponsiveTable
                  data={data.workshopLines}
                  keyExtractor={(item) => item.id}
                  emptyMessage="Nenhuma peça anotada nesta OS"
                  columns={[
                    {
                      key: 'checkbox',
                      header: '',
                      render: (item) => (
                        <Checkbox
                          checked={selectedLineIds.includes(item.id)}
                          onCheckedChange={(checked) => toggleLineSelection(item.id, checked === true)}
                        />
                      ),
                      priority: 1,
                      minWidth: 50,
                    },
                    { key: 'partCode', header: 'Código', render: (item) => item.partCode, priority: 1, minWidth: 120 },
                    { key: 'partName', header: 'Descrição', render: (item) => item.partName, priority: 2, minWidth: 200 },
                    {
                      key: 'trace',
                      header: 'Rastreio',
                      render: (item) =>
                        item.replacesLineId ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 text-xs text-primary cursor-help min-w-0">
                                <GitBranch className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate hidden sm:inline">Substituição</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">Substitui: {resolveReplacedByLabel(item) ?? '—'}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        ),
                      priority: 3,
                      minWidth: 90,
                    },
                    {
                      key: 'state',
                      header: 'Estado',
                      render: (item) => (
                        <Badge variant={getLineState(item) === 'Baixado' ? 'default' : 'outline'}>
                          {getLineState(item)}
                        </Badge>
                      ),
                      priority: 1,
                      minWidth: 100,
                    },
                    { key: 'qty', header: 'Qtd anotada', render: (item) => item.qtyNoted, priority: 1, minWidth: 90 },
                    { key: 'released', header: 'Qtd baixada', render: (item) => item.qtyReleased, priority: 1, minWidth: 90 },
                    {
                      key: 'cancelled',
                      header: 'Qtd cancel.',
                      render: (item) => item.qtyCancelled,
                      priority: 2,
                      minWidth: 90,
                    },
                    {
                      key: 'extra',
                      header: 'Classificação',
                      render: (item) => {
                        if (item.isReservationOnly) {
                          return <Badge variant="outline">Reserva comercial</Badge>;
                        }
                        return item.isExtra ? (
                          <Badge className="bg-amber-100 text-amber-700">Extra</Badge>
                        ) : (
                          <Badge variant="secondary">Original</Badge>
                        );
                      },
                      priority: 2,
                      minWidth: 120,
                    },
                    {
                      key: 'value',
                      header: 'Valor aplicado',
                      render: (item) => (
                        <span className="whitespace-nowrap">{formatCurrency(item.unitPriceApplied)}</span>
                      ),
                      priority: 2,
                      minWidth: 120,
                    },
                  ]}
                />
              </TooltipProvider>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm font-medium">Baixar peça selecionada</p>
                    <Input value={selectedLine?.partName ?? ''} readOnly placeholder="Selecione uma linha na tabela" />
                    <Input
                      type="number"
                      min={1}
                      max={remainingToRelease > 0 ? remainingToRelease : undefined}
                      value={releaseQty}
                      onChange={(e) => setReleaseQty(Number(e.target.value || 1))}
                    />
                    {selectedLineIds.length > 1 ? (
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        Para baixar ou cancelar parcialmente, marque apenas uma linha (várias linhas servem para remover em lote).
                      </p>
                    ) : null}
                    {selectedLine && !selectedLine.isReservationOnly && remainingToRelease > 0 ? (
                      <p className="text-xs text-muted-foreground">Disponível para baixa: {remainingToRelease}</p>
                    ) : null}
                    {selectedLine && !selectedLine.isReservationOnly && remainingToRelease <= 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Sem saldo para nova baixa (quantidade já baixada ou cancelada).
                      </p>
                    ) : null}
                    <Button
                      onClick={handleRelease}
                      disabled={
                        selectedLineIds.length !== 1 ||
                        !selectedLine ||
                        selectedLine.isReservationOnly ||
                        remainingToRelease <= 0
                      }
                    >
                      <ArrowDownCircle className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                  </CardContent>
                </Card>

                <Card ref={cancelPanelRef}>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm font-medium">Cancelar parcialmente</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">Atalho: ESC foca este painel</p>
                    <Input value={selectedLine?.partName ?? ''} readOnly placeholder="Selecione uma linha na tabela" />
                    <Input
                      type="number"
                      min={1}
                      max={availableToCancel > 0 ? availableToCancel : undefined}
                      value={cancelQty}
                      onChange={(e) => setCancelQty(Number(e.target.value || 1))}
                    />
                    {selectedLine && !selectedLine.isReservationOnly && availableToCancel > 0 ? (
                      <p className="text-xs text-muted-foreground">Máx. cancelável: {availableToCancel}</p>
                    ) : null}
                    <Input
                      ref={cancelReasonInputRef}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Motivo do cancelamento"
                    />
                    <Button
                      variant="destructive"
                      onClick={handleCancelPartial}
                      disabled={
                        selectedLineIds.length !== 1 ||
                        !selectedLine ||
                        selectedLine.isReservationOnly ||
                        !cancelReason.trim() ||
                        availableToCancel <= 0
                      }
                    >
                      Cancelar e emitir recibo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
