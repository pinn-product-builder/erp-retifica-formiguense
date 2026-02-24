import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Badge }  from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
  Plus, Search, MoreVertical, Eye, Pencil, Trash2,
  Loader2, ClipboardList, Clock, CheckCircle2, AlertCircle, BarChart2,
} from 'lucide-react';
import {
  STATUS_LABELS, STATUS_COLORS,
  type Quotation, type QuotationStatus, type QuotationFilters,
} from '@/services/QuotationService';

const STATUS_OPTIONS: { value: QuotationStatus | 'all'; label: string }[] = [
  { value: 'all',             label: 'Todos os status' },
  { value: 'draft',           label: 'Rascunho' },
  { value: 'sent',            label: 'Enviada' },
  { value: 'waiting_proposals', label: 'Aguardando Propostas' },
  { value: 'responded',       label: 'Respondida' },
  { value: 'approved',        label: 'Aprovada' },
  { value: 'rejected',        label: 'Rejeitada' },
  { value: 'cancelled',       label: 'Cancelada' },
];

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
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  return (
    <div className="rounded-lg border p-3 sm:p-4 flex items-center gap-3">
      <div className={`rounded-lg p-1.5 sm:p-2 ${color}`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
        <p className="text-lg sm:text-xl md:text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export function QuotationsList({
  quotations, count, totalPages, currentPage, isLoading,
  filters, onFilters, onPageChange, onNew, onEdit, onView, onCompare, onDelete,
}: QuotationsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search,   setSearch]   = useState(filters.search ?? '');

  const total    = count;
  const pending  = quotations.filter(q => ['sent', 'waiting_proposals'].includes(q.status)).length;
  const responded = quotations.filter(q => q.status === 'responded').length;
  const overdue  = quotations.filter(q => (q.days_until_due ?? 0) < 0 && ['sent', 'waiting_proposals'].includes(q.status)).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilters({ ...filters, search });
  };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard icon={ClipboardList} label="Total"       value={total}    color="bg-blue-100 text-blue-600" />
        <StatCard icon={Clock}         label="Pendentes"   value={pending}  color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={CheckCircle2}  label="Respondidas" value={responded} color="bg-purple-100 text-purple-600" />
        <StatCard icon={AlertCircle}   label="Vencidas"    value={overdue}  color="bg-red-100 text-red-600" />
      </div>

      {/* Filtros + Novo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cotação..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8"
          />
        </form>

        <Select
          value={filters.status ?? 'all'}
          onValueChange={v => onFilters({ ...filters, status: v as QuotationStatus | 'all' })}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={onNew} className="w-full sm:w-auto gap-1.5">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Cotação</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhuma cotação encontrada</p>
          <Button variant="link" size="sm" onClick={onNew} className="mt-1">
            Criar primeira cotação
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {quotations.map(q => {
            const isOverdue    = (q.days_until_due ?? 0) < 0 && ['sent', 'waiting_proposals'].includes(q.status);
            const hasProposals = (q.total_proposals ?? 0) > 0;
            return (
              <div key={q.id}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => onView(q)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{q.quotation_number}</span>
                    <Badge className={`${STATUS_COLORS[q.status]} border text-xs`}>
                      {STATUS_LABELS[q.status]}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">Vencida</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>Prazo: {new Date(q.due_date).toLocaleDateString('pt-BR')}</span>
                    {q.days_until_due != null && !isOverdue && (
                      <span className={q.days_until_due <= 3 ? 'text-yellow-600 font-medium' : ''}>
                        {q.days_until_due}d restantes
                      </span>
                    )}
                    <span>{q.total_items ?? 0} iten(s)</span>
                    {(q.suppliers_responded ?? 0) > 0 && (
                      <span className="text-purple-600">{q.suppliers_responded} fornecedor(es) respondeu</span>
                    )}
                  </div>
                </div>

                {/* Botão de comparação rápida — visível quando há propostas */}
                {hasProposals && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex h-8 text-xs gap-1.5 flex-shrink-0 text-purple-700 border-purple-300 hover:bg-purple-50"
                    onClick={e => { e.stopPropagation(); onCompare(q); }}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Comparar
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onView(q); }}>
                      <Eye className="w-4 h-4 mr-2" /> Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(q); }}>
                      <Pencil className="w-4 h-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    {hasProposals && (
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); onCompare(q); }}
                        className="text-purple-700 focus:text-purple-700">
                        <BarChart2 className="w-4 h-4 mr-2" /> Comparar Propostas
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={e => { e.stopPropagation(); setDeleteId(q.id); }}>
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Mostrando {Math.min((currentPage - 1) * 10 + 1, count)} a {Math.min(currentPage * 10, count)} de {count} cotações
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm px-3">{currentPage} / {totalPages}</span>
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
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
              onClick={async () => { if (deleteId) { await onDelete(deleteId); setDeleteId(null); } }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
