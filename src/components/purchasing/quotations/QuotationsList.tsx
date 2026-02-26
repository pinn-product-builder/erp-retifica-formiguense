import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Pencil, Trash2,
  Loader2, FileText, Clock, CheckCircle, AlertTriangle, BarChart3,
  Send, XCircle, RotateCcw, Copy,
} from 'lucide-react';
import {
  STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS, URGENCY_COLORS,
  QuotationService, type Quotation, type QuotationStatus, type QuotationFilters,
} from '@/services/QuotationService';

interface QuotationsListProps {
  quotations:   Quotation[];
  count:        number;
  totalPages:   number;
  currentPage:  number;
  isLoading:    boolean;
  filters:      QuotationFilters;
  onFilters:    (f: QuotationFilters) => void;
  onPageChange: (p: number) => void;
  onNew:        () => void;
  onEdit:       (q: Quotation) => void;
  onView:       (q: Quotation) => void;
  onCompare:    (q: Quotation) => void;
  onDelete:     (id: string) => Promise<boolean>;
  onReopen?:    (q: Quotation) => void;
  onCopy?:      (q: Quotation) => void;
}

type TabValue = 'all' | 'waiting' | 'responded' | 'finished';

export function QuotationsList({
  quotations, count, totalPages, currentPage, isLoading,
  filters, onFilters, onPageChange, onNew, onEdit, onView, onCompare, onDelete,
  onReopen, onCopy,
}: QuotationsListProps) {
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [search,    setSearch]    = useState(filters.search ?? '');
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const waiting   = quotations.filter(q => ['sent', 'waiting_proposals'].includes(q.status)).length;
  const responded = quotations.filter(q => q.status === 'responded').length;
  const approved  = quotations.filter(q => q.status === 'approved').length;
  const overdue   = quotations.filter(q => (q.days_until_due ?? 0) < 0 && !['approved', 'rejected', 'cancelled'].includes(q.status)).length;

  const tabFiltered = quotations.filter(q => {
    if (activeTab === 'waiting')   return ['sent', 'waiting_proposals'].includes(q.status);
    if (activeTab === 'responded') return q.status === 'responded';
    if (activeTab === 'finished')  return ['approved', 'rejected', 'cancelled'].includes(q.status);
    return true;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilters({ ...filters, search });
  };

  const canEdit    = (q: Quotation) => ['draft', 'sent', 'waiting_proposals'].includes(q.status);
  const canCompare = (q: Quotation) => (q.total_proposals ?? 0) > 0;
  const canDelete  = (q: Quotation) => !['approved'].includes(q.status);
  const canReopen  = (q: Quotation) => QuotationService.canReopen(q.status);

  const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Cotações
          </h1>
          <p className="text-muted-foreground text-sm">Gerencie suas cotações de compra</p>
        </div>
        <Button onClick={onNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Cotação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-2xl font-bold">{waiting}</div>
                <p className="text-sm text-muted-foreground truncate">Aguardando</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-2xl font-bold">{responded}</div>
                <p className="text-sm text-muted-foreground truncate">Respondidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-2xl font-bold">{approved}</div>
                <p className="text-sm text-muted-foreground truncate">Aprovadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-2xl font-bold">{overdue}</div>
                <p className="text-sm text-muted-foreground truncate">Vencidas</p>
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
                placeholder="Buscar por número ou item..."
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
          <TabsTrigger value="all">Todas ({count})</TabsTrigger>
          <TabsTrigger value="waiting">Aguardando ({waiting})</TabsTrigger>
          <TabsTrigger value="responded">Respondidas ({responded})</TabsTrigger>
          <TabsTrigger value="finished">Finalizadas ({quotations.filter(q => ['approved', 'rejected', 'cancelled'].includes(q.status)).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : tabFiltered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma cotação encontrada</p>
                  <Button variant="link" size="sm" onClick={onNew} className="mt-1">
                    Criar primeira cotação
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead className="hidden md:table-cell">Itens</TableHead>
                        <TableHead className="hidden sm:table-cell">Respostas</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Prazo</TableHead>
                        <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabFiltered.map(q => {
                        const isOverdue = (q.days_until_due ?? 0) < 0 && !['approved', 'rejected', 'cancelled'].includes(q.status);
                        return (
                          <TableRow
                            key={q.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onView(q)}
                          >
                            <TableCell>
                              <div className="font-medium text-sm">{q.quotation_number}</div>
                              {q.title && (
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{q.title}</div>
                              )}
                              {q.urgency && q.urgency !== 'normal' && (
                                <Badge className={`text-xs mt-0.5 ${URGENCY_COLORS[q.urgency]}`}>
                                  {URGENCY_LABELS[q.urgency]}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">
                              {q.total_items ?? 0} item(ns)
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {(q.suppliers_responded ?? 0) > 0 ? (
                                <Badge variant="outline" className="text-xs">
                                  {q.suppliers_responded} resposta(s)
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge className={`${STATUS_COLORS[q.status]} border text-xs`}>
                                  {STATUS_LABELS[q.status]}
                                </Badge>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs">Vencida</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                              <div>{fmt(q.due_date)}</div>
                              {q.days_until_due != null && !isOverdue && (
                                <div className={`text-xs ${q.days_until_due <= 3 ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
                                  {q.days_until_due}d restantes
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                              {fmt(q.created_at)}
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onView(q)}>
                                    <Eye className="h-4 w-4 mr-2" />Ver Detalhes
                                  </DropdownMenuItem>
                                  {canEdit(q) && (
                                    <DropdownMenuItem onClick={() => onEdit(q)}>
                                      <Pencil className="h-4 w-4 mr-2" />Editar
                                    </DropdownMenuItem>
                                  )}
                                  {canCompare(q) && (
                                    <DropdownMenuItem
                                      className="text-purple-700 focus:text-purple-700"
                                      onClick={() => onCompare(q)}
                                    >
                                      <BarChart3 className="h-4 w-4 mr-2" />Comparar Propostas
                                    </DropdownMenuItem>
                                  )}
                                  {q.status === 'draft' && (
                                    <DropdownMenuItem onClick={() => onView(q)}>
                                      <Send className="h-4 w-4 mr-2" />Enviar Cotação
                                    </DropdownMenuItem>
                                  )}
                                  {canReopen(q) && onReopen && (
                                    <DropdownMenuItem
                                      className="text-amber-700 focus:text-amber-700"
                                      onClick={() => onReopen(q)}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />Reabrir Cotação
                                    </DropdownMenuItem>
                                  )}
                                  {onCopy && (
                                    <DropdownMenuItem onClick={() => onCopy(q)}>
                                      <Copy className="h-4 w-4 mr-2" />Copiar Cotação
                                    </DropdownMenuItem>
                                  )}
                                  {canDelete(q) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => setDeleteId(q.id)}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />Cancelar / Excluir
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
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Mostrando {Math.min((currentPage - 1) * 10 + 1, count)} a {Math.min(currentPage * 10, count)} de {count} cotações
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Confirmar exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cotação?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os itens e propostas serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => { if (deleteId) { await onDelete(deleteId); setDeleteId(null); } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
