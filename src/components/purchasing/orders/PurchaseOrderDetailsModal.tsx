import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Package,
  Printer,
  Send,
  Truck,
  AlertCircle,
  Pencil,
  X,
  ThumbsUp,
  History,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PurchaseOrderRow, PO_STATUS_LABELS, PO_STATUS_COLORS } from '@/services/PurchaseOrderService';
import { ApprovalHistoryTimeline } from '@/components/purchasing/approvals/ApprovalHistoryTimeline';

interface PurchaseOrderDetailsModalProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  order:         PurchaseOrderRow | null;
  isLoading:     boolean;
  onEdit?:       () => void;
  onApprove?:    (id: string) => Promise<boolean>;
  onSendForApproval?: (id: string, totalValue: number) => Promise<boolean>;
  onSend?:       (id: string) => Promise<boolean>;
  onConfirm?:    (id: string) => Promise<boolean>;
  onCancel?:     (id: string) => Promise<boolean>;
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft:            FileText,
  pending:          Clock,
  pending_approval: Clock,
  approved:         CheckCircle,
  rejected:         AlertCircle,
  sent:             Send,
  confirmed:        CheckCircle,
  in_transit:       Truck,
  delivered:        CheckCircle,
  cancelled:        AlertCircle,
};

export function PurchaseOrderDetailsModal({
  open,
  onOpenChange,
  order,
  isLoading,
  onEdit,
  onApprove,
  onSendForApproval,
  onSend,
  onConfirm,
  onCancel,
}: PurchaseOrderDetailsModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('details');

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pedido ${order?.po_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
    body { padding: 24px; font-size: 13px; color: #111; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    h2 { font-size: 14px; margin-bottom: 10px; color: #555; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #333; padding-bottom: 16px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { margin-bottom: 8px; }
    .field label { font-weight: bold; display: block; font-size: 11px; color: #666; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f3f3; text-align: left; padding: 8px; font-size: 12px; border: 1px solid #ddd; }
    td { padding: 7px 8px; font-size: 12px; border: 1px solid #ddd; }
    tr:nth-child(even) td { background: #fafafa; }
    .text-right { text-align: right; }
    .totals { margin-top: 12px; border-top: 2px solid #ddd; padding-top: 12px; }
    .total-row { display: flex; justify-content: space-between; padding: 3px 0; }
    .total-final { font-weight: bold; font-size: 15px; border-top: 2px solid #333; margin-top: 6px; padding-top: 6px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; background: #e0e7ff; color: #3730a3; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature { border-top: 1px solid #333; padding-top: 8px; width: 200px; text-align: center; font-size: 11px; color: #666; }
  </style>
</head>
<body>
  ${content.innerHTML}
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  if (isLoading || !order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-12">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const StatusIcon = STATUS_ICONS[order.status] ?? FileText;
  const statusLabel = PO_STATUS_LABELS[order.status] ?? order.status;
  const statusColor = PO_STATUS_COLORS[order.status] ?? '';

  const canEdit    = ['draft', 'pending', 'pending_approval'].includes(order.status);
  const canApprove = ['pending', 'pending_approval'].includes(order.status);
  const canSendForApproval = order.status === 'draft';
  const canSendToSupplier = order.status === 'approved';
  const canConfirm = order.status === 'sent';
  const canCancel  = !['delivered', 'cancelled'].includes(order.status);

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Pedido de Compra — {order.po_number}
          </DialogTitle>
        </DialogHeader>

        {/* Ações */}
        <div className="flex flex-wrap gap-2 pb-2 border-b">
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          {canEdit && onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
          )}
          {canApprove && onApprove && (
            <Button size="sm" onClick={() => onApprove(order.id)}>
              <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
              Aprovar
            </Button>
          )}
          {canSendForApproval && onSendForApproval && (
            <Button size="sm" variant="default" onClick={() => onSendForApproval(order.id, order.total_value ?? 0)}>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Enviar para Aprovação
            </Button>
          )}
          {canSendToSupplier && onSend && (
            <Button size="sm" variant="default" onClick={() => onSend(order.id)}>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Enviar ao Fornecedor
            </Button>
          )}
          {canConfirm && onConfirm && (
            <Button size="sm" variant="outline" onClick={() => onConfirm(order.id)}>
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Confirmar
            </Button>
          )}
          {canCancel && onCancel && (
            <Button size="sm" variant="destructive" onClick={() => onCancel(order.id)}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              Cancelar
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-1">
          <TabsList className="h-8">
            <TabsTrigger value="details" className="text-xs sm:text-sm px-2 sm:px-3">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm px-2 sm:px-3">
              <History className="h-3.5 w-3.5 mr-1.5" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-3">
            <ApprovalHistoryTimeline orderId={order.id} />
          </TabsContent>

          <TabsContent value="details" className="mt-0">

        {/* Conteúdo imprimível */}
        <div ref={printRef}>

          {/* Header do documento */}
          <div className="header" style={{ display: 'none' }}>
            <div>
              <h1>PEDIDO DE COMPRA</h1>
              <h2>{order.po_number}</h2>
            </div>
            <div className="text-right">
              <p><strong>Data:</strong> {fmt(order.order_date)}</p>
              <p><strong>Status:</strong> {statusLabel}</p>
            </div>
          </div>

          <div className="space-y-5 mt-2">

            {/* Status + Datas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                <StatusIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={`text-xs mt-0.5 ${statusColor}`}>{statusLabel}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Data do Pedido</p>
                  <p className="text-sm font-medium">{fmt(order.order_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Entrega Prevista</p>
                  <p className="text-sm font-medium">{fmt(order.expected_delivery)}</p>
                </div>
              </div>
            </div>

            {/* Fornecedor */}
            <div className="p-3 sm:p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                Fornecedor
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p><span className="text-muted-foreground">Nome: </span>{order.supplier?.name}</p>
                {order.supplier?.cnpj && (
                  <p><span className="text-muted-foreground">CNPJ: </span>{order.supplier.cnpj}</p>
                )}
                {order.supplier?.contact_person && (
                  <p><span className="text-muted-foreground">Contato: </span>{order.supplier.contact_person}</p>
                )}
                {order.supplier?.email && (
                  <p><span className="text-muted-foreground">E-mail: </span>{order.supplier.email}</p>
                )}
                {order.supplier?.phone && (
                  <p><span className="text-muted-foreground">Telefone: </span>{order.supplier.phone}</p>
                )}
              </div>
            </div>

            {/* Itens */}
            <div>
              <p className="text-sm font-medium mb-2">Itens do Pedido</p>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Item</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Qtd.</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Valor Unit.</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          Nenhum item
                        </TableCell>
                      </TableRow>
                    )}
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm">{item.item_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {item.description || '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                        <TableCell className="text-right text-sm whitespace-nowrap">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right text-sm whitespace-nowrap font-medium">
                          {formatCurrency(item.total_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totais */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-1.5 p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {(order.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Desconto</span>
                    <span>- {formatCurrency(order.discount)}</span>
                  </div>
                )}
                {(order.freight ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span>{formatCurrency(order.freight)}</span>
                  </div>
                )}
                {(order.taxes ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impostos</span>
                    <span>{formatCurrency(order.taxes)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-green-700">{formatCurrency(order.total_value)}</span>
                </div>
              </div>
            </div>

            {/* Informações adicionais */}
            {(order.terms || order.delivery_address || order.notes) && (
              <div className="p-3 sm:p-4 rounded-lg border space-y-2 text-sm">
                <p className="font-medium">Informações Adicionais</p>
                {order.terms && (
                  <p><span className="text-muted-foreground">Condições: </span>{order.terms}</p>
                )}
                {order.delivery_address && (
                  <p><span className="text-muted-foreground">Endereço de Entrega: </span>{order.delivery_address}</p>
                )}
                {order.notes && (
                  <p><span className="text-muted-foreground">Observações: </span>{order.notes}</p>
                )}
              </div>
            )}

            {/* Assinaturas (para impressão) */}
            <div className="footer mt-10 grid grid-cols-2 gap-8" style={{ display: 'none' }}>
              <div className="text-center">
                <div style={{ borderTop: '1px solid #333', paddingTop: '8px', marginTop: '40px' }}>
                  <p style={{ fontSize: '11px', color: '#666' }}>Responsável pela Compra</p>
                </div>
              </div>
              <div className="text-center">
                <div style={{ borderTop: '1px solid #333', paddingTop: '8px', marginTop: '40px' }}>
                  <p style={{ fontSize: '11px', color: '#666' }}>Aprovação</p>
                </div>
              </div>
            </div>

          </div>
        </div>

          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
