import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Pencil, Send,
  CheckCircle, XCircle, Loader2, ShoppingCart, Clock, Truck, Package,
  ThumbsUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  PurchaseOrderRow, POFilters, POStats,
  PO_STATUS_LABELS, PO_STATUS_COLORS,
} from '@/services/PurchaseOrderService';

type TabValue = 'all' | 'pending' | 'approved' | 'receiving';

interface PurchaseOrdersListProps {
  orders:      PurchaseOrderRow[];
  count:       number;
  totalPages:  number;
  page:        number;
  pageSize:    number;
  isLoading:   boolean;
  filters:     POFilters;
  stats:       POStats | null;
  onFilters:   (f: POFilters) => void;
  onPage:      (p: number) => void;
  onNew:       () => void;
  onView:      (order: PurchaseOrderRow) => void;
  onEdit:      (order: PurchaseOrderRow) => void;
  onApprove:   (id: string) => Promise<boolean>;
  onSendForApproval?: (id: string, totalValue: number) => Promise<boolean>;
  onSend:      (id: string) => Promise<boolean>;
  onConfirm:   (id: string) => Promise<boolean>;
  onCancel:    (id: string) => Promise<boolean>;
}

export function PurchaseOrdersList({
  orders, count, totalPages, page, pageSize, isLoading,
  filters, stats, onFilters, onPage, onNew,
  onView, onEdit, onApprove, onSendForApproval, onSend, onConfirm, onCancel,
}: PurchaseOrdersListProps) {
  const [search,    setSearch]    = useState(filters.search ?? '');
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const pendingCount   = orders.filter(o => ['pending', 'pending_approval'].includes(o.status)).length;
  const approvedCount  = orders.filter(o => o.status === 'approved').length;
  const sentCount      = orders.filter(o => o.status === 'sent').length;
  const receivingCount = orders.filter(o => ['confirmed', 'in_transit', 'delivered'].includes(o.status)).length;

  const tabFiltered = orders.filter(o => {
    if (activeTab === 'pending')   return ['pending', 'pending_approval', 'draft'].includes(o.status);
    if (activeTab === 'approved')  return ['approved', 'sent'].includes(o.status);
    if (activeTab === 'receiving') return ['confirmed', 'in_transit', 'delivered'].includes(o.status);
    return true;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilters({ ...filters, search });
  };

  const fmt   = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const from  = (page - 1) * pageSize + 1;
  const to    = Math.min(page * pageSize, count);

  const canEdit    = (s: string) => ['draft', 'pending', 'pending_approval'].includes(s);
  const canApprove = (s: string) => ['pending', 'pending_approval'].includes(s);
  const canSendForApproval = (s: string) => s === 'draft';
  const canSendToSupplier = (s: string) => s === 'approved';
  const canConfirm = (s: string) => s === 'sent';
  const canCancel  = (s: string) => !['delivered', 'cancelled'].includes(s);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Pedidos de Compra
          </h1>
          <p className="text-muted-foreground text-sm">Gerencie seus pedidos de compra</p>
        </div>
        <Button onClick={onNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-sm text-muted-foreground truncate">Aguardando Aprovação</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-2xl font-bold">{approvedCount}</div>
                <p className="text-sm text-muted-foreground truncate">Aprovados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-2xl font-bold">{sentCount}</div>
                <p className="text-sm text-muted-foreground truncate">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm md:text-2xl font-bold truncate whitespace-nowrap">
                  {formatCurrency(stats?.totalSpend ?? 0)}
                </div>
                <p className="text-sm text-muted-foreground truncate">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou fornecedor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabs + Tabela */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="all">Todos ({count})</TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprovados ({approvedCount + sentCount})
          </TabsTrigger>
          <TabsTrigger value="receiving">
            Recebimento ({receivingCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tabFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Package className="h-10 w-10 opacity-30" />
                  <p className="text-sm font-medium">Nenhum pedido encontrado</p>
                  <Button variant="link" size="sm" onClick={onNew}>
                    Criar primeiro pedido
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="hidden md:table-cell">Itens</TableHead>
                        <TableHead className="hidden sm:table-cell">Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Previsão Entrega</TableHead>
                        <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabFiltered.map(order => {
                        const statusLabel = PO_STATUS_LABELS[order.status] ?? order.status;
                        const statusColor = PO_STATUS_COLORS[order.status] ?? '';
                        return (
                          <TableRow
                            key={order.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onView(order)}
                          >
                            <TableCell className="font-medium font-mono text-sm whitespace-nowrap">
                              {order.po_number}
                            </TableCell>
                            <TableCell className="text-sm max-w-[160px] truncate">
                              {order.supplier?.name ?? '—'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">
                              {order.items?.length ?? 0} item(ns)
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm font-medium whitespace-nowrap">
                              {formatCurrency(order.total_value)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${statusColor}`}>{statusLabel}</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                              {fmt(order.expected_delivery)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                              {fmt(order.order_date)}
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onView(order)}>
                                    <Eye className="h-4 w-4 mr-2" />Ver Detalhes
                                  </DropdownMenuItem>
                                  {canEdit(order.status) && (
                                    <DropdownMenuItem onClick={() => onEdit(order)}>
                                      <Pencil className="h-4 w-4 mr-2" />Editar
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {canApprove(order.status) && (
                                    <DropdownMenuItem onClick={() => onApprove(order.id)}>
                                      <ThumbsUp className="h-4 w-4 mr-2" />Aprovar
                                    </DropdownMenuItem>
                                  )}
                                  {canSendForApproval(order.status) && onSendForApproval && (
                                    <DropdownMenuItem onClick={() => onSendForApproval(order.id, order.total_value ?? 0)}>
                                      <Send className="h-4 w-4 mr-2" />Enviar para Aprovação
                                    </DropdownMenuItem>
                                  )}
                                  {canSendToSupplier(order.status) && (
                                    <DropdownMenuItem onClick={() => onSend(order.id)}>
                                      <Send className="h-4 w-4 mr-2" />Enviar ao Fornecedor
                                    </DropdownMenuItem>
                                  )}
                                  {canConfirm(order.status) && (
                                    <DropdownMenuItem onClick={() => onConfirm(order.id)}>
                                      <CheckCircle className="h-4 w-4 mr-2" />Confirmar
                                    </DropdownMenuItem>
                                  )}
                                  {canCancel(order.status) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => onCancel(order.id)}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />Cancelar
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Paginação */}
      {!isLoading && count > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>Mostrando {from} a {to} de {count} pedidos</span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => page > 1 && onPage(page - 1)}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => page < totalPages && onPage(page + 1)}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
