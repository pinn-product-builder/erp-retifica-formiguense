import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  BookOpen,
  Archive,
  TrendingUp,
  LayoutDashboard,
  Bell,
  Settings,
  Warehouse,
  Layers,
  Calculator,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { usePartsInventory, type PartInventory } from '@/hooks/usePartsInventory';
import { PartForm } from '@/components/inventory/PartForm';
import { PartDetails } from '@/components/inventory/PartDetails';
import ReservationManager from '@/components/inventory/ReservationManager';
import { MovementHistory } from '@/components/inventory/MovementHistory';
import InventoryCountManager from '@/components/inventory/InventoryCountManager';
import PartsSeparationManager from '@/components/inventory/PartsSeparationManager';
import { InventoryDashboard } from '@/components/inventory/InventoryDashboard';
import StockAlertsManager from '@/components/inventory/StockAlertsManager';
import StockConfigManager from '@/components/inventory/StockConfigManager';
import WarehousesManager from '@/components/inventory/WarehousesManager';
import BatchesManager from '@/components/inventory/BatchesManager';
import CostMethodManager from '@/components/inventory/CostMethodManager';
import AccountingManager from '@/components/inventory/AccountingManager';
import { ResponsiveTable } from '@/components/ui/responsive-table';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const Estoque = () => {
  const { parts, pagination, loading, deletePart, fetchParts, clonePart } = usePartsInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [componentFilter, setComponentFilter] = useState<string>('todos');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<PartInventory | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleSearch = useCallback(() => {
    fetchParts({
      search: searchTerm || undefined,
      status: statusFilter !== 'todos' ? statusFilter : undefined,
      component: componentFilter !== 'todos' ? componentFilter : undefined,
    });
  }, [fetchParts, searchTerm, statusFilter, componentFilter]);

  const handleFilterChange = useCallback(
    (filters: { search?: string; status?: string; component?: string }) => {
      fetchParts({
        search: filters.search || undefined,
        status: filters.status && filters.status !== 'todos' ? filters.status : undefined,
        component: filters.component && filters.component !== 'todos' ? filters.component : undefined,
      });
    },
    [fetchParts]
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'inventory') {
      fetchParts();
    }
  };

  const stats = {
    total: parts.reduce((sum, p) => sum + p.quantity, 0),
    disponivel: parts.filter((p) => p.status === 'disponivel').reduce((sum, p) => sum + p.quantity, 0),
    reservado: parts.filter((p) => p.status === 'reservado').reduce((sum, p) => sum + p.quantity, 0),
    tipos: pagination.count,
    valor: parts.reduce((sum, p) => sum + (p.unit_cost ?? 0) * p.quantity, 0),
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
      disponivel: { icon: CheckCircle, label: 'Disponível', color: 'bg-green-100 text-green-800' },
      reservado: { icon: Clock, label: 'Reservado', color: 'bg-yellow-100 text-yellow-800' },
      usado: { icon: Package, label: 'Usado', color: 'bg-blue-100 text-blue-800' },
      pendente: { icon: AlertCircle, label: 'Pendente', color: 'bg-gray-100 text-gray-800' },
    };
    const { icon: Icon, label, color } = config[status] ?? config.pendente;
    return (
      <Badge className={`${color} text-xs px-1.5 py-0.5`}>
        <Icon className="w-2.5 h-2.5 mr-0.5" />
        {label}
      </Badge>
    );
  };

  const getComponentLabel = (component?: string | null) => {
    const labels: Record<string, string> = {
      bloco: 'Bloco',
      cabecote: 'Cabeçote',
      virabrequim: 'Virabrequim',
      pistao: 'Pistão',
      biela: 'Biela',
      comando: 'Comando',
      eixo: 'Eixo',
    };
    return component ? labels[component] ?? component : '—';
  };

  const handleDelete = async () => {
    if (!selectedPart) return;
    const success = await deletePart(selectedPart.id);
    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedPart(null);
    }
  };

  if (loading && parts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando estoque...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Gestão de Estoque</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gerencie inventário, reservas e movimentações de peças
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 self-start">
              <Plus className="w-3.5 h-3.5" />
              Nova Peça
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Peça ao Estoque</DialogTitle>
              <DialogDescription>
                Preencha os dados da peça para adicionar ao inventário
              </DialogDescription>
            </DialogHeader>
            <PartForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                fetchParts();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
        <StatCard
          title="Total de Peças"
          value={stats.total}
          icon={Package}
          subtitle="Quantidade total"
        />
        <StatCard
          title="Disponíveis"
          value={stats.disponivel}
          icon={CheckCircle}
          subtitle="Prontas para uso"
          variant="success"
        />
        <StatCard
          title="Reservadas"
          value={stats.reservado}
          icon={Clock}
          subtitle="Em reserva"
          variant="warning"
        />
        <StatCard
          title="SKUs"
          value={stats.tipos}
          icon={Package}
          subtitle="Códigos diferentes"
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(stats.valor)}
          icon={Package}
          subtitle="Valor do estoque"
          variant="primary"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <div className="space-y-1">
          <TabsList className="w-full grid grid-cols-6 h-auto">
            {[
              { value: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', short: 'Dash' },
              { value: 'inventory', icon: Package, label: 'Inventário', short: 'Inv.' },
              { value: 'movements', icon: TrendingUp, label: 'Movimentações', short: 'Mov.' },
              { value: 'reservations', icon: BookOpen, label: 'Reservas', short: 'Res.' },
              { value: 'separation', icon: Archive, label: 'Separação', short: 'Sep.' },
              { value: 'counts', icon: CheckCircle, label: 'Inv. Físico', short: 'Fís.' },
            ].map(({ value, icon: Icon, label, short }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-1 sm:px-2 py-1.5"
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">{label}</span>
                <span className="sm:hidden">{short}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsList className="w-full grid grid-cols-6 h-auto">
            {[
              { value: 'alerts', icon: Bell, label: 'Alertas', short: 'Alert.' },
              { value: 'config', icon: Settings, label: 'Configurações', short: 'Config.' },
              { value: 'warehouses', icon: Warehouse, label: 'Depósitos', short: 'Dep.' },
              { value: 'batches', icon: Layers, label: 'Lotes', short: 'Lotes' },
              { value: 'cost', icon: Calculator, label: 'Custeio', short: 'Cust.' },
              { value: 'accounting', icon: BookOpen, label: 'Contábil', short: 'Cont.' },
            ].map(({ value, icon: Icon, label, short }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-1 sm:px-2 py-1.5"
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">{label}</span>
                <span className="sm:hidden">{short}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-4">
          <InventoryDashboard />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleFilterChange({
                      search: e.target.value,
                      status: statusFilter,
                      component: componentFilter,
                    });
                  }}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  handleFilterChange({ search: searchTerm, status: v, component: componentFilter });
                }}
              >
                <SelectTrigger className="w-full sm:w-44 h-9">
                  <Filter className="w-3.5 h-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="usado">Usado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={componentFilter}
                onValueChange={(v) => {
                  setComponentFilter(v);
                  handleFilterChange({ search: searchTerm, status: statusFilter, component: v });
                }}
              >
                <SelectTrigger className="w-full sm:w-44 h-9">
                  <Filter className="w-3.5 h-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Componentes</SelectItem>
                  <SelectItem value="bloco">Bloco</SelectItem>
                  <SelectItem value="cabecote">Cabeçote</SelectItem>
                  <SelectItem value="virabrequim">Virabrequim</SelectItem>
                  <SelectItem value="pistao">Pistão</SelectItem>
                  <SelectItem value="biela">Biela</SelectItem>
                  <SelectItem value="comando">Comando</SelectItem>
                  <SelectItem value="eixo">Eixo</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Inventário de Peças</CardTitle>
              <CardDescription>
                {pagination.count > 0 ? (
                  <>
                    Mostrando {(pagination.page - 1) * pagination.pageSize + 1}–
                    {Math.min(pagination.page * pagination.pageSize, pagination.count)} de{' '}
                    {pagination.count} {pagination.count === 1 ? 'peça' : 'peças'}
                  </>
                ) : (
                  'Nenhuma peça encontrada'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveTable
                data={parts}
                keyExtractor={(part) => part.id}
                emptyMessage="Nenhuma peça encontrada"
                columns={[
                  {
                    key: 'code',
                    header: 'Código',
                    mobileLabel: 'Código',
                    render: (part) => (
                      <span className="font-mono text-xs sm:text-sm">{part.part_code ?? '—'}</span>
                    ),
                  },
                  {
                    key: 'name',
                    header: 'Nome',
                    mobileLabel: 'Nome',
                    render: (part) => (
                      <span className="text-xs sm:text-sm">{part.part_name}</span>
                    ),
                  },
                  {
                    key: 'component',
                    header: 'Componente',
                    mobileLabel: 'Componente',
                    render: (part) => (
                      <Badge variant="outline" className="text-xs">
                        {getComponentLabel(part.component)}
                      </Badge>
                    ),
                  },
                  {
                    key: 'quantity',
                    header: 'Qtd.',
                    mobileLabel: 'Qtd.',
                    render: (part) => (
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          part.quantity < 5 ? 'text-red-600' : ''
                        }`}
                      >
                        {part.quantity}
                      </span>
                    ),
                  },
                  {
                    key: 'unit_cost',
                    header: 'Valor Unit.',
                    mobileLabel: 'Valor Unit.',
                    hideInMobile: true,
                    render: (part) => (
                      <span className="text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency(part.unit_cost ?? 0)}
                      </span>
                    ),
                  },
                  {
                    key: 'total_value',
                    header: 'Valor Total',
                    mobileLabel: 'Valor Total',
                    render: (part) => (
                      <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency((part.unit_cost ?? 0) * part.quantity)}
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    mobileLabel: 'Status',
                    render: (part) => getStatusBadge(part.status ?? 'pendente'),
                  },
                  {
                    key: 'supplier',
                    header: 'Fornecedor',
                    mobileLabel: 'Fornecedor',
                    hideInMobile: true,
                    render: (part) => (
                      <span className="text-xs sm:text-sm truncate max-w-[120px] block">
                        {part.supplier ?? '—'}
                      </span>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Ações',
                    mobileLabel: 'Ações',
                    render: (part) => (
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setSelectedPart(part);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setSelectedPart(part);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setSelectedPart(part);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />

              {pagination.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => fetchParts(
                            {
                              search: searchTerm || undefined,
                              status: statusFilter !== 'todos' ? statusFilter : undefined,
                              component: componentFilter !== 'todos' ? componentFilter : undefined,
                            },
                            pagination.page - 1
                          )}
                          aria-disabled={pagination.page <= 1}
                          className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-sm px-4 py-2">
                          Página {pagination.page} de {pagination.totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => fetchParts(
                            {
                              search: searchTerm || undefined,
                              status: statusFilter !== 'todos' ? statusFilter : undefined,
                              component: componentFilter !== 'todos' ? componentFilter : undefined,
                            },
                            pagination.page + 1
                          )}
                          aria-disabled={pagination.page >= pagination.totalPages}
                          className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <MovementHistory />
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          <ReservationManager />
        </TabsContent>

        <TabsContent value="separation" className="space-y-4">
          <PartsSeparationManager />
        </TabsContent>

        <TabsContent value="counts" className="space-y-4">
          <InventoryCountManager />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <StockAlertsManager />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <StockConfigManager />
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <WarehousesManager />
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <BatchesManager />
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <CostMethodManager />
        </TabsContent>

        <TabsContent value="accounting" className="space-y-4">
          <AccountingManager />
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Peça</DialogTitle>
            <DialogDescription>
              Atualize as informações da peça no estoque
            </DialogDescription>
          </DialogHeader>
          {selectedPart && (
            <PartForm
              part={selectedPart}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedPart(null);
                fetchParts();
              }}
              onClone={() => {
                setIsEditDialogOpen(false);
                setSelectedPart(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Peça</DialogTitle>
          </DialogHeader>
          {selectedPart && <PartDetails part={selectedPart} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta peça do estoque? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedPart && (
            <div className="py-3">
              <p className="font-medium text-sm">{selectedPart.part_name}</p>
              <p className="text-xs text-muted-foreground">Código: {selectedPart.part_code ?? 'N/A'}</p>
              <p className="text-xs text-muted-foreground">Quantidade: {selectedPart.quantity}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;
