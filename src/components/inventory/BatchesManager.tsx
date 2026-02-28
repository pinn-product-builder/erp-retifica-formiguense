import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Lightbulb,
  Search,
  Barcode,
} from 'lucide-react';
import { useStockBatches } from '@/hooks/useStockBatches';
import type { StockBatchWithAlert, CreateBatchInput, BatchStatus } from '@/services/StockBatchService';
import { StatCard } from '@/components/StatCard';

const STATUS_CONFIG: Record<BatchStatus, { label: string; icon: React.ComponentType<{ className?: string }>; badgeClass: string }> = {
  available: { label: 'Disponível', icon: CheckCircle, badgeClass: 'bg-green-100 text-green-800' },
  reserved: { label: 'Reservado', icon: Clock, badgeClass: 'bg-yellow-100 text-yellow-800' },
  quarantine: { label: 'Quarentena', icon: AlertTriangle, badgeClass: 'bg-orange-100 text-orange-800' },
  expired: { label: 'Vencido', icon: XCircle, badgeClass: 'bg-red-100 text-red-800' },
  consumed: { label: 'Consumido', icon: Package, badgeClass: 'bg-gray-100 text-gray-600' },
};

const EXPIRY_LEVEL_CONFIG = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ok: 'bg-green-100 text-green-800 border-green-200',
};

function BatchStatusBadge({ batch }: { batch: StockBatchWithAlert }) {
  const cfg = STATUS_CONFIG[batch.status];
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.badgeClass} text-xs`}>
      <Icon className="w-2.5 h-2.5 mr-0.5" />
      {cfg.label}
    </Badge>
  );
}

function ExpiryBadge({ batch }: { batch: StockBatchWithAlert }) {
  if (!batch.expiry_date && batch.status !== 'expired') return <span className="text-xs text-muted-foreground">Sem validade</span>;
  const { level, label } = batch.expiry_alert;
  return (
    <Badge className={`${EXPIRY_LEVEL_CONFIG[level]} text-xs border`}>{label}</Badge>
  );
}

function BatchForm({
  partId,
  batch,
  onSubmit,
  onCancel,
}: {
  partId: string;
  batch?: StockBatchWithAlert;
  onSubmit: (data: CreateBatchInput) => void;
  onCancel: () => void;
}) {
  const [batchNumber, setBatchNumber] = useState(batch?.batch_number ?? '');
  const [quantity, setQuantity] = useState(batch?.quantity.toString() ?? '');
  const [unitCost, setUnitCost] = useState(batch?.unit_cost?.toString() ?? '');
  const [manufacturingDate, setManufacturingDate] = useState(batch?.manufacturing_date ?? '');
  const [expiryDate, setExpiryDate] = useState(batch?.expiry_date ?? '');
  const [status, setStatus] = useState<BatchStatus>(batch?.status ?? 'available');
  const [notes, setNotes] = useState(batch?.notes ?? '');
  const [quarantineReason, setQuarantineReason] = useState(batch?.quarantine_reason ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      part_id: partId,
      batch_number: batchNumber,
      quantity: parseFloat(quantity) || 0,
      unit_cost: unitCost ? parseFloat(unitCost) : null,
      manufacturing_date: manufacturingDate || null,
      expiry_date: expiryDate || null,
      best_before_date: null,
      supplier_id: null,
      purchase_receipt_id: null,
      reserved_quantity: 0,
      status,
      quarantine_until: null,
      quarantine_reason: quarantineReason || null,
      notes: notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Número do Lote *</Label>
          <Input
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            placeholder="L2026-001"
            required
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as BatchStatus)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Quantidade *</Label>
          <Input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            required
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Custo Unitário (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            placeholder="0,00"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Data de Fabricação</Label>
          <Input
            type="date"
            value={manufacturingDate}
            onChange={(e) => setManufacturingDate(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Data de Validade</Label>
          <Input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="h-9"
          />
        </div>
      </div>
      {status === 'quarantine' && (
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Motivo da Quarentena</Label>
          <Input
            value={quarantineReason}
            onChange={(e) => setQuarantineReason(e.target.value)}
            placeholder="Aguardando inspeção..."
            className="h-9"
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs sm:text-sm">Observações</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações adicionais..."
          className="h-9"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm">{batch ? 'Salvar' : 'Criar Lote'}</Button>
      </div>
    </form>
  );
}

export default function BatchesManager() {
  const { batches, serials, pagination, serialsPagination, stats, fefoSuggestion, loading, fetchBatches, fetchSerials, createBatch, updateBatch } =
    useStockBatches();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'todos'>('todos');
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<StockBatchWithAlert | null>(null);

  const handleBatchSubmit = async (data: CreateBatchInput) => {
    let success: boolean;
    if (selectedBatch) {
      success = await updateBatch(selectedBatch.id, data);
    } else {
      success = await createBatch(data);
    }
    if (success) {
      setIsBatchDialogOpen(false);
      setSelectedBatch(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard title="Total de Lotes" value={stats.total_batches} icon={Package} subtitle="Lotes cadastrados" />
        <StatCard title="Vencendo (30d)" value={stats.expiring_30} icon={AlertTriangle} subtitle="Atenção urgente" variant="danger" />
        <StatCard title="Vencendo (60d)" value={stats.expiring_60} icon={Clock} subtitle="Monitorar" variant="warning" />
        <StatCard title="Vencidos/Quarentena" value={stats.expired + stats.quarantine} icon={XCircle} subtitle="Bloqueados" variant="danger" />
      </div>

      {fefoSuggestion && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-800">Sugestão FEFO</p>
                <p className="text-xs text-blue-700">
                  Usar lote <strong>{fefoSuggestion.batch_number}</strong> primeiro
                  {fefoSuggestion.expiry_date && ` — ${fefoSuggestion.expiry_alert.label}`}
                  {' '}({fefoSuggestion.quantity} un disponíveis)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="batches" className="space-y-4">
        <TabsList className="w-full grid grid-cols-2 h-9">
          <TabsTrigger value="batches" className="text-xs sm:text-sm">
            <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
            Lotes
          </TabsTrigger>
          <TabsTrigger value="serials" className="text-xs sm:text-sm">
            <Barcode className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
            Números de Série
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Lotes em Estoque</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {pagination.count} lote{pagination.count !== 1 ? 's' : ''} encontrado{pagination.count !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button size="sm" className="gap-1.5 self-start" onClick={() => { setSelectedBatch(null); setIsBatchDialogOpen(true); }}>
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Novo Lote</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número do lote..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      fetchBatches({ search: e.target.value, status: statusFilter });
                    }}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => {
                  const val = v as BatchStatus | 'todos';
                  setStatusFilter(val);
                  fetchBatches({ search: searchTerm, status: val });
                }}>
                  <SelectTrigger className="w-full sm:w-44 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <p className="text-center text-sm text-muted-foreground py-8">Carregando lotes...</p>
              ) : batches.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Package className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum lote encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-muted/30"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs sm:text-sm font-medium">{batch.batch_number}</span>
                          <BatchStatusBadge batch={batch} />
                          <ExpiryBadge batch={batch} />
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span>Qtd: <strong>{batch.quantity}</strong></span>
                          <span>Custo: <strong>{formatCurrency(batch.unit_cost)}</strong></span>
                          {batch.manufacturing_date && <span>Fab: {formatDate(batch.manufacturing_date)}</span>}
                          {batch.expiry_date && <span>Val: {formatDate(batch.expiry_date)}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 self-end sm:self-auto"
                        onClick={() => { setSelectedBatch(batch); setIsBatchDialogOpen(true); }}
                      >
                        <Search className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => fetchBatches({ search: searchTerm, status: statusFilter }, pagination.page - 1)}
                        aria-disabled={pagination.page <= 1}
                        className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-xs px-3 py-2">Página {pagination.page} de {pagination.totalPages}</span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => fetchBatches({ search: searchTerm, status: statusFilter }, pagination.page + 1)}
                        aria-disabled={pagination.page >= pagination.totalPages}
                        className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="serials" className="space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg">Números de Série</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {serialsPagination.count} serial{serialsPagination.count !== 1 ? 's' : ''} cadastrado{serialsPagination.count !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {serials.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Barcode className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum número de série cadastrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {serials.map((serial) => (
                    <div key={serial.id} className="border rounded-lg p-3 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm">{serial.serial_number}</span>
                        <Badge
                          className={
                            serial.status === 'available' ? 'bg-green-100 text-green-800' :
                            serial.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                            serial.status === 'scrapped' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-600'
                          }
                        >
                          {serial.status === 'available' ? 'Disponível' :
                           serial.status === 'sold' ? 'Vendido' :
                           serial.status === 'reserved' ? 'Reservado' :
                           serial.status === 'returned' ? 'Devolvido' : 'Descartado'}
                        </Badge>
                      </div>
                      {serial.warranty_expires_at && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Garantia: {new Date(serial.warranty_expires_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {serialsPagination.totalPages > 1 && (
                <Pagination className="mt-3">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => fetchSerials(serialsPagination.page - 1)}
                        aria-disabled={serialsPagination.page <= 1}
                        className={serialsPagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-xs px-3 py-2">Página {serialsPagination.page} de {serialsPagination.totalPages}</span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => fetchSerials(serialsPagination.page + 1)}
                        aria-disabled={serialsPagination.page >= serialsPagination.totalPages}
                        className={serialsPagination.page >= serialsPagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isBatchDialogOpen} onOpenChange={(open) => {
        setIsBatchDialogOpen(open);
        if (!open) setSelectedBatch(null);
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBatch ? 'Editar Lote' : 'Novo Lote'}</DialogTitle>
            <DialogDescription>
              {selectedBatch ? 'Atualize as informações do lote' : 'Registre um novo lote no estoque'}
            </DialogDescription>
          </DialogHeader>
          <BatchForm
            partId=""
            batch={selectedBatch ?? undefined}
            onSubmit={handleBatchSubmit}
            onCancel={() => {
              setIsBatchDialogOpen(false);
              setSelectedBatch(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
