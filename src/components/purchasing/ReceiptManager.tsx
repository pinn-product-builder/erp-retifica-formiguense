import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  FileText,
  RotateCcw,
  ShieldCheck,
  Printer,
  MoreHorizontal,
  Eye,
  Plus,
} from 'lucide-react';
import { usePurchaseReceipts } from '@/hooks/usePurchaseReceipts';
import { useSupplierReturns } from '@/hooks/useSupplierReturns';
import { useOrganization } from '@/hooks/useOrganization';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReceiveOrderModal } from './ReceiveOrderModal';
import { PurchaseOrderDetailsModal } from './PurchaseOrderDetailsModal';
import { SupplierReturnModal } from './SupplierReturnModal';
import { RETURN_STATUS_LABELS, RETURN_STATUS_COLORS } from '@/services/SupplierReturnService';
import { QualityInspectionModal, type QuarantineItem } from './receipts/QualityInspectionModal';
import { LabelPrintModal, type LabelItem } from './receipts/LabelPrintModal';
import { InvoiceRegistrationModal } from './invoices/InvoiceRegistrationModal';

interface PendingPO {
  id: string;
  po_number: string;
  supplier: { name: string };
  status: string;
  order_date: string;
  expected_delivery?: string;
  total_value: number;
  items?: Array<{
    id: string;
    item_name: string;
    quantity: number;
    received_quantity: number;
  }>;
}

const PO_STATUS_COLORS: Record<string, string> = {
  confirmed:  'bg-green-100 text-green-700 border-green-200',
  in_transit: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered:  'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const PO_STATUS_LABELS: Record<string, string> = {
  confirmed:  'Confirmado',
  in_transit: 'Em Trânsito',
  delivered:  'Entregue',
};

export default function ReceiptManager() {
  const { receipts, loading, fetchReceipts, fetchPendingPOs } = usePurchaseReceipts();
  const { returns, fetchReturns } = useSupplierReturns();
  const { currentOrganization } = useOrganization();

  const [activeTab, setActiveTab]       = useState('pending');
  const [pendingPOs, setPendingPOs]     = useState<PendingPO[]>([]);
  const [searchTerm, setSearchTerm]     = useState('');

  const [selectedPO, setSelectedPO]                     = useState<string | null>(null);
  const [showReceiveModal, setShowReceiveModal]           = useState(false);
  const [selectedPOForDetails, setSelectedPOForDetails]   = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal]           = useState(false);
  const [selectedReceiptForReturn, setSelectedReceiptForReturn] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal]             = useState(false);

  const [quarantineItems, setQuarantineItems]                   = useState<QuarantineItem[]>([]);
  const [selectedQuarantineItem, setSelectedQuarantineItem]     = useState<QuarantineItem | null>(null);
  const [showInspectionModal, setShowInspectionModal]           = useState(false);
  const [labelItems,    setLabelItems]    = useState<LabelItem[]>([]);
  const [showLabelModal, setShowLabelModal] = useState(false);

  const [nfOrderId,   setNfOrderId]   = useState('');
  const [nfOrderNo,   setNfOrderNo]   = useState('');
  const [nfOrderVal,  setNfOrderVal]  = useState(0);
  const [nfReceiptId, setNfReceiptId] = useState<string | undefined>(undefined);
  const [showNfModal, setShowNfModal] = useState(false);

  const fetchQuarantineItems = useCallback(async () => {
    if (!currentOrganization?.id) return;
    const { data } = await supabase
      .from('purchase_receipt_items')
      .select(`
        id, receipt_id, received_quantity, lot_number, warehouse_location,
        purchase_order_item:purchase_order_items(item_name, description),
        receipt:purchase_receipts(
          receipt_number, receipt_date,
          purchase_order:purchase_orders(po_number, supplier:suppliers(name))
        )
      `)
      .eq('quality_status', 'under_review')
      .eq('purchase_receipts.org_id', currentOrganization.id);

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setQuarantineItems((data as any[]).map((row: any) => ({
        receipt_item_id:   row.id,
        receipt_id:        row.receipt_id,
        receipt_number:    row.receipt?.receipt_number ?? '',
        receipt_date:      row.receipt?.receipt_date   ?? '',
        po_number:         row.receipt?.purchase_order?.po_number ?? '',
        supplier_name:     row.receipt?.purchase_order?.supplier?.name ?? '',
        item_name:         row.purchase_order_item?.item_name ?? '',
        description:       row.purchase_order_item?.description,
        received_quantity: row.received_quantity,
        lot_number:        row.lot_number,
        warehouse_location: row.warehouse_location,
      })));
    }
  }, [currentOrganization?.id]);

  const loadData = useCallback(async () => {
    const pos = await fetchPendingPOs();
    setPendingPOs(pos as PendingPO[]);
    await fetchReceipts();
    await fetchReturns();
    await fetchQuarantineItems();
  }, [fetchPendingPOs, fetchReceipts, fetchReturns, fetchQuarantineItems]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRegisterNF = (poId: string, poNumber: string, totalValue: number, receiptId?: string) => {
    setNfOrderId(poId);
    setNfOrderNo(poNumber);
    setNfOrderVal(totalValue);
    setNfReceiptId(receiptId);
    setShowNfModal(true);
  };

  const handleOpenLabelModal = (receipt: typeof receipts[0]) => {
    setLabelItems(
      (receipt.items ?? []).map(i => ({
        receipt_item_id:   i.id,
        item_name:         i.purchase_order_item?.item_name ?? 'Item',
        part_code:         '',
        received_quantity: i.received_quantity,
        lot_number:        i.lot_number,
        receipt_date:      receipt.receipt_date,
        supplier_name:     receipt.purchase_order?.supplier?.name,
        po_number:         receipt.purchase_order?.po_number,
        warehouse_location: i.warehouse_location,
      })),
    );
    setShowLabelModal(true);
  };

  const isOverdue = (po: PendingPO) => {
    if (!po.expected_delivery) return false;
    return new Date() > new Date(po.expected_delivery) && po.status !== 'delivered';
  };

  const getProgress = (po: PendingPO) => {
    if (!po.items) return { received: 0, total: 0, pct: 0 };
    const total    = po.items.reduce((s, i) => s + i.quantity, 0);
    const received = po.items.reduce((s, i) => s + i.received_quantity, 0);
    return { received, total, pct: total > 0 ? (received / total) * 100 : 0 };
  };

  const q = searchTerm.toLowerCase();

  const filteredPOs = pendingPOs.filter(po =>
    po.po_number.toLowerCase().includes(q) ||
    po.supplier.name.toLowerCase().includes(q),
  );

  const filteredReceipts = receipts.filter(r =>
    r.receipt_number.toLowerCase().includes(q) ||
    (r.purchase_order?.po_number ?? '').toLowerCase().includes(q) ||
    (r.purchase_order?.supplier?.name ?? '').toLowerCase().includes(q),
  );

  const filteredQuarantine = quarantineItems.filter(item =>
    item.item_name.toLowerCase().includes(q) ||
    item.po_number.toLowerCase().includes(q) ||
    item.supplier_name.toLowerCase().includes(q),
  );

  const filteredReturns = returns.filter(r =>
    r.return_number.toLowerCase().includes(q) ||
    (r.supplier?.name ?? '').toLowerCase().includes(q) ||
    (r.receipt?.receipt_number ?? '').toLowerCase().includes(q),
  );

  const recentReceipts = receipts.filter(r => {
    const d = new Date(r.receipt_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando recebimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            Recebimento de Mercadorias
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie o recebimento de materiais e pedidos de compra</p>
        </div>
        <Button onClick={() => { setSelectedPO(null); setShowReceiveModal(true); }} className="gap-1.5 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Novo Recebimento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-orange-100 flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">
                  {pendingPOs.filter(p => p.status === 'confirmed').length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Aguardando</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 flex-shrink-0">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">
                  {pendingPOs.filter(p => p.status === 'in_transit').length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Em Trânsito</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 flex-shrink-0">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{quarantineItems.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Quarentena</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{recentReceipts}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Recebidos (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por pedido, fornecedor ou número..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="flex w-full lg:grid lg:grid-cols-4">
            <TabsTrigger value="pending" className="flex-shrink-0 text-xs sm:text-sm gap-1.5">
              <Clock className="h-3.5 w-3.5 hidden sm:block" />
              <span>Pendentes</span>
              {filteredPOs.length > 0 && (
                <Badge className="text-[10px] h-4 px-1 bg-orange-100 text-orange-700 border-orange-200">
                  {filteredPOs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex-shrink-0 text-xs sm:text-sm gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 hidden sm:block" />
              <span>Recebimentos</span>
              {filteredReceipts.length > 0 && (
                <Badge className="text-[10px] h-4 px-1 bg-green-100 text-green-700 border-green-200">
                  {filteredReceipts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quarantine" className="flex-shrink-0 text-xs sm:text-sm gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 hidden sm:block" />
              <span className="hidden sm:inline">Quarentena</span>
              <span className="sm:hidden">Quarent.</span>
              {filteredQuarantine.length > 0 && (
                <Badge className="text-[10px] h-4 px-1 bg-amber-100 text-amber-700 border-amber-200">
                  {filteredQuarantine.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="returns" className="flex-shrink-0 text-xs sm:text-sm gap-1.5">
              <RotateCcw className="h-3.5 w-3.5 hidden sm:block" />
              <span className="hidden sm:inline">Devoluções</span>
              <span className="sm:hidden">Devol.</span>
              {filteredReturns.length > 0 && (
                <Badge className="text-[10px] h-4 px-1 bg-red-100 text-red-700 border-red-200">
                  {filteredReturns.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Pendentes */}
        <TabsContent value="pending" className="mt-4 space-y-3">
          {filteredPOs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-base sm:text-lg font-medium mb-1">Nenhum pedido pendente</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Tente ajustar a busca' : 'Não há pedidos aguardando recebimento'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPOs.map(po => {
              const overdue  = isOverdue(po);
              const progress = getProgress(po);
              return (
                <Card key={po.id} className={overdue ? 'border-red-200 bg-red-50/40' : ''}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-base">{po.po_number}</h3>
                          <Badge className={PO_STATUS_COLORS[po.status] ?? 'bg-gray-100 text-gray-700'}>
                            {PO_STATUS_LABELS[po.status] ?? po.status}
                          </Badge>
                          {overdue && (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Atrasado
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                          <p><span className="font-medium text-foreground">Fornecedor:</span> {po.supplier.name}</p>
                          <p><span className="font-medium text-foreground">Pedido:</span> {new Date(po.order_date).toLocaleDateString('pt-BR')}</p>
                          <p>
                            <span className="font-medium text-foreground">Entrega:</span>{' '}
                            {po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                          <p><span className="font-medium text-foreground">Valor:</span> {formatCurrency(po.total_value)}</p>
                        </div>

                        {progress.total > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progresso</span>
                              <span>{progress.received}/{progress.total} itens ({progress.pct.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-green-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${progress.pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        {(po.status === 'confirmed' || po.status === 'in_transit') && (
                          <Button size="sm" onClick={() => { setSelectedPO(po.id); setShowReceiveModal(true); }} className="gap-1.5">
                            <Package className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Receber Mercadoria</span>
                            <span className="sm:hidden">Receber</span>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleRegisterNF(po.id, po.po_number, po.total_value)} className="gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Registrar NF</span>
                          <span className="sm:hidden">NF</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedPOForDetails(po.id); setShowDetailsModal(true); }} className="gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Ver Detalhes</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Tab: Recebimentos */}
        <TabsContent value="receipts" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recebimento</TableHead>
                    <TableHead className="hidden sm:table-cell">Pedido</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead className="hidden md:table-cell">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        Nenhum recebimento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReceipts.map(receipt => (
                      <TableRow key={receipt.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-xs sm:text-sm">{receipt.receipt_number}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            {receipt.purchase_order?.po_number ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm max-w-[120px] truncate">
                          {receipt.purchase_order?.supplier?.name ?? '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(receipt.receipt_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">
                          {formatCurrency(receipt.total_value)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={receipt.has_divergence ? 'secondary' : 'default'}
                            className="text-[10px] sm:text-xs"
                          >
                            {receipt.status === 'completed' ? 'Completo' : 'Parcial'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRegisterNF(
                                receipt.purchase_order_id,
                                receipt.purchase_order?.po_number ?? '',
                                receipt.total_value,
                                receipt.id,
                              )}>
                                <FileText className="h-4 w-4 mr-2" />Registrar NF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenLabelModal(receipt)}>
                                <Printer className="h-4 w-4 mr-2" />Imprimir Etiquetas
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedReceiptForReturn(receipt.id); setShowReturnModal(true); }}>
                                <RotateCcw className="h-4 w-4 mr-2" />Devolver
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Quarentena */}
        <TabsContent value="quarantine" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="hidden sm:table-cell">Pedido</TableHead>
                    <TableHead className="hidden md:table-cell">Fornecedor</TableHead>
                    <TableHead>Qtd. Recebida</TableHead>
                    <TableHead className="hidden sm:table-cell">Lote</TableHead>
                    <TableHead className="hidden md:table-cell">Local</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuarantine.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        Nenhum item em quarentena
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuarantine.map(item => (
                      <TableRow key={item.receipt_item_id} className="hover:bg-amber-50/50">
                        <TableCell>
                          <p className="text-xs sm:text-sm font-medium">{item.item_name}</p>
                          {item.description && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[160px]">{item.description}</p>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">{item.po_number}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs sm:text-sm">{item.supplier_name}</TableCell>
                        <TableCell className="text-xs sm:text-sm font-medium">{item.received_quantity}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm text-muted-foreground">
                          {item.lot_number ?? '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs sm:text-sm text-muted-foreground">
                          {item.warehouse_location ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] sm:text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-100"
                            onClick={() => { setSelectedQuarantineItem(item); setShowInspectionModal(true); }}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span className="hidden sm:inline">Inspecionar</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Devoluções */}
        <TabsContent value="returns" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Devolução</TableHead>
                    <TableHead className="hidden sm:table-cell">Fornecedor</TableHead>
                    <TableHead className="hidden md:table-cell">Recebimento</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        <RotateCcw className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        Nenhuma devolução registrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReturns.map(ret => (
                      <TableRow key={ret.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-xs sm:text-sm">{ret.return_number}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{ret.supplier?.name ?? '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs sm:text-sm text-muted-foreground">
                          {ret.receipt?.receipt_number ?? '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(ret.return_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap">
                          {formatCurrency(ret.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] sm:text-xs ${RETURN_STATUS_COLORS[ret.status]}`}>
                            {RETURN_STATUS_LABELS[ret.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receive Order Modal */}
      {selectedPO && (
        <ReceiveOrderModal
          open={showReceiveModal}
          onOpenChange={open => { setShowReceiveModal(open); if (!open) setSelectedPO(null); }}
          purchaseOrderId={selectedPO}
          onSuccess={() => { loadData(); setSelectedPO(null); setShowReceiveModal(false); }}
        />
      )}

      {/* Purchase Order Details Modal */}
      {selectedPOForDetails && (
        <PurchaseOrderDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          purchaseOrderId={selectedPOForDetails}
        />
      )}

      {/* Supplier Return Modal */}
      {selectedReceiptForReturn && (
        <SupplierReturnModal
          open={showReturnModal}
          onOpenChange={setShowReturnModal}
          receiptId={selectedReceiptForReturn}
          onSuccess={() => { loadData(); setSelectedReceiptForReturn(null); }}
        />
      )}

      {/* Invoice Registration Modal */}
      <InvoiceRegistrationModal
        open={showNfModal}
        onOpenChange={setShowNfModal}
        purchaseOrderId={nfOrderId}
        purchaseOrderNo={nfOrderNo}
        orderTotalValue={nfOrderVal}
        receiptId={nfReceiptId}
        onSuccess={() => loadData()}
      />

      {/* Quality Inspection Modal */}
      <QualityInspectionModal
        open={showInspectionModal}
        onOpenChange={setShowInspectionModal}
        item={selectedQuarantineItem}
        onSuccess={() => { loadData(); setSelectedQuarantineItem(null); }}
      />

      {/* Label Print Modal */}
      <LabelPrintModal
        open={showLabelModal}
        onOpenChange={setShowLabelModal}
        items={labelItems}
      />
    </div>
  );
}
