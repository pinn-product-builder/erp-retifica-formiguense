import { useState, useEffect } from 'react';
import {
  Clock, Plus, Search, AlertTriangle, CheckCircle,
  Eye, MoreHorizontal, Undo2, ShoppingCart, Timer, PackageCheck, CalendarClock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { useConditionalOrders } from '@/hooks/useConditionalOrders';
import { NewConditionalModal } from '@/components/purchasing/conditionals/NewConditionalModal';
import { ConditionalDetailsModal } from '@/components/purchasing/conditionals/ConditionalDetailsModal';
import { ConditionalDecisionModal } from '@/components/purchasing/conditionals/ConditionalDecisionModal';
import { RegisterReceiptModal } from '@/components/purchasing/conditionals/RegisterReceiptModal';
import { ExtendDeadlineModal } from '@/components/purchasing/conditionals/ExtendDeadlineModal';
import type { ConditionalOrder, ItemDecision } from '@/services/ConditionalOrderService';

function getDeadlineInfo(expiryDate: string) {
  const now = new Date();
  const deadline = new Date(expiryDate);
  const days = differenceInDays(deadline, now);
  const hours = differenceInHours(deadline, now);

  if (days < 0) return { text: `Vencido há ${Math.abs(days)}d`, color: 'text-red-600', progress: 100, urgent: true };
  if (days === 0) return { text: hours > 0 ? `Vence em ${hours}h` : 'Vence hoje!', color: 'text-red-600', progress: 95, urgent: true };
  if (days <= 3) return { text: `Vence em ${days}d`, color: 'text-yellow-600', progress: 75, urgent: true };
  return { text: `Vence em ${days}d`, color: 'text-green-600', progress: Math.min(50, Math.round((days / 30) * 50)), urgent: false };
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending:        { label: 'Aguard. Recebimento', variant: 'secondary' },
  in_analysis:    { label: 'Em Análise',          variant: 'default' },
  approved:       { label: 'Aprovado',            variant: 'default' },
  partial_return: { label: 'Devol. Parcial',      variant: 'outline' },
  returned:       { label: 'Devolvido',           variant: 'secondary' },
  purchased:      { label: 'Comprado',            variant: 'default' },
  overdue:        { label: 'Vencido',             variant: 'destructive' },
};

type ModalState =
  | { type: 'new' }
  | { type: 'details'; conditional: ConditionalOrder }
  | { type: 'decision'; conditional: ConditionalOrder; selectedIds?: string[] }
  | { type: 'receipt'; conditional: ConditionalOrder }
  | { type: 'extend'; conditional: ConditionalOrder; extensionCount: number }
  | null;

export default function Conditionals() {
  const {
    conditionals, loading, totalCount, currentPage, totalPages, PAGE_SIZE, stats,
    fetchConditionals, createConditional, applyDecisions, registerReceipt,
    extendDeadline, fetchExtensions, setCurrentPage,
  } = useConditionalOrders();

  const [searchTerm, setSearchTerm]   = useState('');
  const [activeTab, setActiveTab]     = useState('all');
  const [modal, setModal]             = useState<ModalState>(null);
  const [extensionCount, setExtensionCount] = useState(0);

  useEffect(() => {
    fetchConditionals({ page: 1, status: activeTab === 'all' ? undefined : activeTab, search: searchTerm });
  }, [activeTab]);

  const handleSearch = () => {
    fetchConditionals({ page: 1, status: activeTab === 'all' ? undefined : activeTab, search: searchTerm });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchConditionals({ page, status: activeTab === 'all' ? undefined : activeTab, search: searchTerm });
  };

  const openDecision = async (conditional: ConditionalOrder, selectedIds?: string[]) => {
    setModal({ type: 'decision', conditional, selectedIds });
  };

  const openExtend = async (conditional: ConditionalOrder) => {
    const exts = await fetchExtensions(conditional.id);
    setExtensionCount(exts.length);
    setModal({ type: 'extend', conditional, extensionCount: exts.length });
  };

  const activeConditional = modal && modal.type !== 'new' ? modal.conditional : null;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
            Pedidos Condicionais
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gerencie materiais recebidos em condicional
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setModal({ type: 'new' })}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Condicional</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Aguard. Receb.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.in_analysis}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Em Análise</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg flex-shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-xs sm:text-sm text-red-600 truncate">Vencidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg md:text-xl font-bold whitespace-nowrap">
                {formatCurrency(stats.totalValue)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Valor Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, fornecedor ou NF..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-8 sm:pl-9 text-sm h-8 sm:h-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch}>
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v)}>
        <div className="overflow-x-auto">
          <TabsList className="flex lg:grid lg:grid-cols-4 w-max lg:w-full">
            <TabsTrigger value="all" className="text-xs sm:text-sm flex-shrink-0">Todos</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm flex-shrink-0">
              <span className="hidden sm:inline">Aguard. Recebimento</span>
              <span className="sm:hidden">Pendentes</span>
            </TabsTrigger>
            <TabsTrigger value="in_analysis" className="text-xs sm:text-sm flex-shrink-0">Em Análise</TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs sm:text-sm flex-shrink-0 text-red-600">Vencidos</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-3 sm:mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : conditionals.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Nenhum condicional encontrado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Número</TableHead>
                        <TableHead className="text-xs">Fornecedor</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Itens</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Valor</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Prazo</TableHead>
                        <TableHead className="w-[44px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conditionals.map(c => {
                        const dl = getDeadlineInfo(c.expiry_date);
                        const cfg = STATUS_CONFIG[c.status] ?? { label: c.status, variant: 'secondary' as const };
                        return (
                          <TableRow
                            key={c.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setModal({ type: 'details', conditional: c })}
                          >
                            <TableCell className="font-medium text-xs sm:text-sm">
                              {c.conditional_number}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm max-w-[140px]">
                              <p className="truncate">{c.supplier?.name ?? '—'}</p>
                              {c.reference_doc && (
                                <p className="text-xs text-muted-foreground truncate">{c.reference_doc}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                              {c.items?.length ?? 0}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">
                              {formatCurrency(c.total_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={cfg.variant} className="text-xs whitespace-nowrap">
                                {cfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 min-w-[90px]">
                                <p className={`text-xs font-medium ${dl.color}`}>{dl.text}</p>
                                <Progress value={dl.progress} className="h-1" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="text-sm">
                                  <DropdownMenuItem onClick={e => { e.stopPropagation(); setModal({ type: 'details', conditional: c }); }}>
                                    <Eye className="h-3.5 w-3.5 mr-2" /> Ver Detalhes
                                  </DropdownMenuItem>

                                  {c.status === 'pending' && (
                                    <DropdownMenuItem onClick={e => { e.stopPropagation(); setModal({ type: 'receipt', conditional: c }); }}>
                                      <PackageCheck className="h-3.5 w-3.5 mr-2" /> Registrar Entrada
                                    </DropdownMenuItem>
                                  )}

                                  {['in_analysis', 'overdue'].includes(c.status) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={e => { e.stopPropagation(); openDecision(c); }}>
                                        <ShoppingCart className="h-3.5 w-3.5 mr-2" /> Registrar Decisão
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={e => { e.stopPropagation(); openExtend(c); }}>
                                        <CalendarClock className="h-3.5 w-3.5 mr-2" /> Prorrogar Prazo
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {c.status === 'overdue' && (
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={e => { e.stopPropagation(); openDecision(c); }}
                                    >
                                      <AlertTriangle className="h-3.5 w-3.5 mr-2" /> Decisão Forçada
                                    </DropdownMenuItem>
                                  )}

                                  {['purchased', 'returned', 'partial_return'].includes(c.status) && (
                                    <DropdownMenuItem disabled>
                                      <Undo2 className="h-3.5 w-3.5 mr-2" />
                                      {c.status === 'purchased' ? 'Compra aprovada' : 'Devolvido'}
                                    </DropdownMenuItem>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-xs sm:text-sm text-muted-foreground">
              <span>
                Mostrando {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)}–
                {Math.min(currentPage * PAGE_SIZE, totalCount)} de {totalCount}
              </span>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NewConditionalModal
        open={modal?.type === 'new'}
        onOpenChange={open => !open && setModal(null)}
        onSubmit={async data => { await createConditional(data); }}
        loading={loading}
      />

      <ConditionalDetailsModal
        open={modal?.type === 'details'}
        onOpenChange={open => !open && setModal(null)}
        conditional={activeConditional}
        onDecide={ids => {
          if (!activeConditional) return;
          setModal({ type: 'decision', conditional: activeConditional, selectedIds: ids });
        }}
      />

      <ConditionalDecisionModal
        open={modal?.type === 'decision'}
        onOpenChange={open => !open && setModal(null)}
        conditional={activeConditional}
        selectedItemIds={modal?.type === 'decision' ? modal.selectedIds : undefined}
        onSubmit={async (decisions: ItemDecision[], justification?: string) => {
          if (!activeConditional) return;
          await applyDecisions(activeConditional.id, decisions, justification);
        }}
        loading={loading}
      />

      <RegisterReceiptModal
        open={modal?.type === 'receipt'}
        onOpenChange={open => !open && setModal(null)}
        conditional={activeConditional}
        onSubmit={async (items, notes) => {
          if (!activeConditional) return;
          await registerReceipt(activeConditional.id, items, notes);
        }}
        loading={loading}
      />

      <ExtendDeadlineModal
        open={modal?.type === 'extend'}
        onOpenChange={open => !open && setModal(null)}
        conditional={activeConditional}
        extensionCount={modal?.type === 'extend' ? modal.extensionCount : extensionCount}
        onSubmit={async input => {
          if (!activeConditional) return;
          await extendDeadline(activeConditional.id, input);
        }}
        loading={loading}
      />
    </div>
  );
}
