import { useEffect, useState } from 'react';
import {
  Clock,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Timer,
  Eye,
  MoreHorizontal,
  ShoppingCart,
  Undo2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { formatCurrency } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { useConditionalOrders } from '@/hooks/useConditionalOrders';
import { NewConditionalModal } from '@/components/purchasing/conditionals/NewConditionalModal';
import { ConditionalDetailsModal } from '@/components/purchasing/conditionals/ConditionalDetailsModal';
import { ConditionalDecisionModal } from '@/components/purchasing/conditionals/ConditionalDecisionModal';
import type { ConditionalOrder, ItemDecision } from '@/services/ConditionalOrderService';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_analysis: 'Em Análise',
  approved: 'Aprovado',
  partial_return: 'Dev. Parcial',
  returned: 'Devolvido',
  purchased: 'Comprado',
  overdue: 'Vencido',
};

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'overdue') return 'destructive';
  if (['purchased', 'approved'].includes(status)) return 'default';
  if (['returned'].includes(status)) return 'secondary';
  return 'outline';
}

function getDeadlineInfo(expiryDate: string) {
  const days = differenceInDays(new Date(expiryDate), new Date());
  if (days < 0) return { text: `Vencido há ${Math.abs(days)}d`, color: 'text-red-600', progress: 100 };
  if (days === 0) return { text: 'Vence hoje!', color: 'text-red-600', progress: 95 };
  if (days <= 3) return { text: `${days}d restante(s)`, color: 'text-yellow-600', progress: 75 };
  return { text: `${days}d restantes`, color: 'text-green-600', progress: 25 };
}

export default function Condicionais() {
  const {
    conditionals,
    loading,
    totalCount,
    currentPage,
    totalPages,
    PAGE_SIZE,
    stats,
    fetchConditionals,
    createConditional,
    applyDecisions,
  } = useConditionalOrders();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; conditional: ConditionalOrder | null }>({ open: false, conditional: null });
  const [decisionModal, setDecisionModal] = useState<{ open: boolean; conditional: ConditionalOrder | null; selectedIds?: string[] }>({ open: false, conditional: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchConditionals({ page: 1, status: activeTab, search });
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    fetchConditionals({ page: 1, status: tab, search });
  };

  const handleSearch = () => {
    fetchConditionals({ page: 1, status: activeTab, search });
  };

  const handlePageChange = (page: number) => {
    fetchConditionals({ page, status: activeTab, search });
  };

  const handleCreate = async (data: Parameters<typeof createConditional>[0]) => {
    setSubmitting(true);
    await createConditional(data);
    setSubmitting(false);
  };

  const handleApplyDecisions = async (decisions: ItemDecision[], justification?: string) => {
    if (!decisionModal.conditional) return;
    setSubmitting(true);
    await applyDecisions(decisionModal.conditional.id, decisions, justification);
    setSubmitting(false);
    setDecisionModal({ open: false, conditional: null });
  };

  const openDecision = (conditional: ConditionalOrder, selectedIds?: string[]) => {
    setDetailsModal({ open: false, conditional: null });
    setDecisionModal({ open: true, conditional, selectedIds });
  };

  const filteredCount = (tab: string) => {
    if (tab === 'all') return totalCount;
    return conditionals.filter((c) => {
      if (tab === 'active') return ['pending', 'in_analysis'].includes(c.status);
      if (tab === 'overdue') return c.status === 'overdue';
      if (tab === 'finished') return ['purchased', 'returned', 'approved', 'partial_return'].includes(c.status);
      return true;
    }).length;
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            Pedidos Condicionais
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gerencie materiais recebidos em regime de condicional
          </p>
        </div>
        <Button size="sm" onClick={() => setNewModalOpen(true)} className="flex-shrink-0">
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Nova Condicional</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Pendentes</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Em Análise</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.in_analysis}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.overdue > 0 ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${stats.overdue > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm truncate ${stats.overdue > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  Vencidos
                </p>
                <p className={`text-lg sm:text-xl md:text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600' : ''}`}>
                  {stats.overdue}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Valor Total</p>
                <p className="text-xs sm:text-sm md:text-base font-bold truncate">
                  {formatCurrency(stats.totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch} className="flex-shrink-0">
              <Filter className="h-4 w-4 mr-1.5" />
              <span className="text-xs sm:text-sm">Buscar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full overflow-x-auto flex lg:grid lg:grid-cols-4">
          <TabsTrigger value="all" className="flex-shrink-0 text-xs sm:text-sm">
            Todos ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-shrink-0 text-xs sm:text-sm">
            Ativos ({stats.pending + stats.in_analysis})
          </TabsTrigger>
          <TabsTrigger value="overdue" className={`flex-shrink-0 text-xs sm:text-sm ${stats.overdue > 0 ? 'text-red-600' : ''}`}>
            Vencidos ({stats.overdue})
          </TabsTrigger>
          <TabsTrigger value="finished" className="flex-shrink-0 text-xs sm:text-sm">
            Finalizados
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ResponsiveTable
                data={conditionals}
                keyExtractor={(c) => c.id}
                emptyMessage={loading ? 'Carregando...' : 'Nenhum pedido condicional encontrado'}
                columns={[
                  {
                    key: 'conditional_number',
                    header: 'Número',
                    mobileLabel: 'Número',
                    priority: 1,
                    minWidth: 120,
                    render: (c) => (
                      <button
                        className="font-medium text-xs sm:text-sm hover:underline text-primary"
                        onClick={() => setDetailsModal({ open: true, conditional: c })}
                      >
                        {c.conditional_number}
                      </button>
                    ),
                  },
                  {
                    key: 'supplier',
                    header: 'Fornecedor',
                    mobileLabel: 'Fornecedor',
                    priority: 1,
                    minWidth: 140,
                    render: (c) => (
                      <span className="text-xs sm:text-sm truncate">{c.supplier?.name ?? '—'}</span>
                    ),
                  },
                  {
                    key: 'items',
                    header: 'Itens',
                    mobileLabel: 'Itens',
                    priority: 3,
                    minWidth: 60,
                    hideInMobile: true,
                    render: (c) => (
                      <span className="text-xs sm:text-sm">{(c.items ?? []).length}</span>
                    ),
                  },
                  {
                    key: 'total_amount',
                    header: 'Valor',
                    mobileLabel: 'Valor',
                    priority: 2,
                    minWidth: 110,
                    render: (c) => (
                      <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency(c.total_amount)}
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    mobileLabel: 'Status',
                    priority: 1,
                    minWidth: 100,
                    render: (c) => (
                      <Badge variant={getStatusVariant(c.status)} className="text-xs">
                        {STATUS_LABELS[c.status] ?? c.status}
                      </Badge>
                    ),
                  },
                  {
                    key: 'expiry_date',
                    header: 'Prazo',
                    mobileLabel: 'Prazo',
                    priority: 2,
                    minWidth: 130,
                    hideInMobile: true,
                    render: (c) => {
                      const info = getDeadlineInfo(c.expiry_date);
                      return (
                        <div className="space-y-1">
                          <p className={`text-xs font-medium ${info.color}`}>{info.text}</p>
                          <Progress value={info.progress} className="h-1" />
                        </div>
                      );
                    },
                  },
                  {
                    key: 'actions',
                    header: '',
                    mobileLabel: 'Ações',
                    priority: 1,
                    minWidth: 50,
                    render: (c) => (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailsModal({ open: true, conditional: c })}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          {['pending', 'in_analysis'].includes(c.status) && (
                            <DropdownMenuItem onClick={() => openDecision(c, (c.items ?? []).map((i) => i.id))}>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Registrar Decisão
                            </DropdownMenuItem>
                          )}
                          {c.status === 'overdue' && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDecision(c, (c.items ?? []).map((i) => i.id))}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Decisão Forçada
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Mostrando {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)} a{' '}
                {Math.min(currentPage * PAGE_SIZE, totalCount)} de {totalCount} registros
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NewConditionalModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        onSubmit={handleCreate}
        loading={submitting}
      />

      <ConditionalDetailsModal
        open={detailsModal.open}
        onOpenChange={(open) => setDetailsModal({ open, conditional: open ? detailsModal.conditional : null })}
        conditional={detailsModal.conditional}
        onDecide={(selectedIds) => openDecision(detailsModal.conditional!, selectedIds)}
      />

      <ConditionalDecisionModal
        open={decisionModal.open}
        onOpenChange={(open) => setDecisionModal({ open, conditional: open ? decisionModal.conditional : null })}
        conditional={decisionModal.conditional}
        selectedItemIds={decisionModal.selectedIds}
        onSubmit={handleApplyDecisions}
        loading={submitting}
      />
    </div>
  );
}
