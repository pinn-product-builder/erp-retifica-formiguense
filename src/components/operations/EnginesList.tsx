import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Search, Settings, Package, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Engine, useEngines } from '@/hooks/useEngines';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ITEMS_PER_PAGE = 10;

export function EnginesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('todos');
  const [assemblyStateFilter, setAssemblyStateFilter] = useState<string>('todos');
  const [selectedEngine, setSelectedEngine] = useState<Engine | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { engines, count, totalPages, loading } = useEngines({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    filters: {
      searchTerm: searchTerm || undefined,
      fuelType: fuelTypeFilter,
      assemblyState: assemblyStateFilter,
    },
  });

  const handleViewDetails = (engine: Engine) => {
    setSelectedEngine(engine);
    setIsDetailsOpen(true);
  };

  const getAssemblyStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      montado: 'Montado',
      parcialmente_montado: 'Parcialmente Montado',
      desmontado: 'Desmontado',
    };
    return labels[state] || state;
  };

  const getFuelTypeLabel = (fuelType: string) => {
    const labels: Record<string, string> = {
      gasolina: 'Gasolina',
      etanol: 'Etanol',
      flex: 'Flex',
      diesel: 'Diesel',
      gnv: 'GNV',
    };
    return labels[fuelType] || fuelType;
  };

  const columns = [
    {
      key: 'brand_model',
      header: 'Marca/Modelo',
      priority: 1,
      minWidth: 200,
      render: (engine: Engine) => (
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{engine.brand}</p>
          <p className="text-xs text-muted-foreground truncate">{engine.model}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      priority: 2,
      minWidth: 150,
      render: (engine: Engine) => (
        <div className="min-w-0">
          <p className="text-sm truncate">{engine.engine_type?.name || engine.type}</p>
          {engine.engine_type?.category && (
            <p className="text-xs text-muted-foreground truncate">
              {engine.engine_type.category}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'fuel_type',
      header: 'Combustível',
      priority: 3,
      minWidth: 120,
      render: (engine: Engine) => (
        <Badge variant="outline" className="text-xs">
          {getFuelTypeLabel(engine.fuel_type)}
        </Badge>
      ),
    },
    {
      key: 'serial_number',
      header: 'Nº Série',
      priority: 4,
      minWidth: 150,
      render: (engine: Engine) => (
        <span className="text-xs font-mono truncate">
          {engine.serial_number || 'N/A'}
        </span>
      ),
    },
    {
      key: 'assembly_state',
      header: 'Estado',
      priority: 2,
      minWidth: 150,
      render: (engine: Engine) => (
        <Badge
          variant={
            engine.assembly_state === 'montado'
              ? 'default'
              : engine.assembly_state === 'parcialmente_montado'
              ? 'secondary'
              : 'outline'
          }
          className="text-xs"
        >
          {getAssemblyStateLabel(engine.assembly_state)}
        </Badge>
      ),
    },
    {
      key: 'is_complete',
      header: 'Completo',
      priority: 4,
      minWidth: 100,
      render: (engine: Engine) => (
        <div className="flex items-center gap-1">
          {engine.is_complete ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="text-xs">{engine.is_complete ? 'Sim' : 'Não'}</span>
        </div>
      ),
    },
    {
      key: 'orders_count',
      header: 'OSs',
      priority: 3,
      minWidth: 80,
      render: (engine: Engine) => (
        <Badge variant="secondary" className="text-xs">
          {engine.orders?.length || 0}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      priority: 1,
      minWidth: 100,
      render: (engine: Engine) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(engine)}
          className="h-7 w-7 sm:h-8 sm:w-auto p-0 sm:px-3"
        >
          <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">Ver</span>
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            Motores Cadastrados
          </CardTitle>
          <CardDescription className="text-sm">
            Listagem de todos os motores cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca, modelo, série..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            <Select value={fuelTypeFilter} onValueChange={setFuelTypeFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Combustível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Combustíveis</SelectItem>
                <SelectItem value="gasolina">Gasolina</SelectItem>
                <SelectItem value="etanol">Etanol</SelectItem>
                <SelectItem value="flex">Flex</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="gnv">GNV</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assemblyStateFilter} onValueChange={setAssemblyStateFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Estado de Montagem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Estados</SelectItem>
                <SelectItem value="montado">Montado</SelectItem>
                <SelectItem value="parcialmente_montado">Parcialmente Montado</SelectItem>
                <SelectItem value="desmontado">Desmontado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground text-sm">Carregando motores...</p>
            </div>
          ) : engines.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                {searchTerm || fuelTypeFilter !== 'todos' || assemblyStateFilter !== 'todos'
                  ? 'Nenhum motor encontrado com os filtros aplicados'
                  : 'Nenhum motor cadastrado'}
              </p>
            </div>
          ) : (
            <>
              <ResponsiveTable
                data={engines}
                columns={columns}
                keyExtractor={(engine: Engine) => engine.id}
                renderMobileCard={(engine: Engine) => (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {engine.brand} {engine.model}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {engine.engine_type?.name || engine.type}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {getFuelTypeLabel(engine.fuel_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={
                          engine.assembly_state === 'montado'
                            ? 'default'
                            : engine.assembly_state === 'parcialmente_montado'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {getAssemblyStateLabel(engine.assembly_state)}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {engine.orders?.length || 0} OS(s)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(engine)}
                          className="h-7 px-2"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              />
              
              {totalPages > 1 && (
                <div className="mt-4 space-y-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={
                            currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={
                            currentPage === totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-center text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, count)} de {count} motores
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detalhes do Motor</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Informações completas do motor cadastrado
            </DialogDescription>
          </DialogHeader>
          {selectedEngine && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground mb-1">
                    Marca
                  </h4>
                  <p className="text-sm sm:text-base">{selectedEngine.brand}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground mb-1">
                    Modelo
                  </h4>
                  <p className="text-sm sm:text-base">{selectedEngine.model}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground mb-1">
                    Tipo
                  </h4>
                  <p className="text-sm sm:text-base">
                    {selectedEngine.engine_type?.name || selectedEngine.type}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground mb-1">
                    Combustível
                  </h4>
                  <p className="text-sm sm:text-base">
                    {getFuelTypeLabel(selectedEngine.fuel_type)}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground mb-1">
                    Número de Série
                  </h4>
                  <p className="text-sm sm:text-base font-mono">
                    {selectedEngine.serial_number || 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground mb-1">
                    Estado de Montagem
                  </h4>
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    {getAssemblyStateLabel(selectedEngine.assembly_state)}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm sm:text-base mb-3">Componentes</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    {selectedEngine.has_block ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs sm:text-sm">Bloco</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedEngine.has_head ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs sm:text-sm">Cabeçote</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedEngine.has_crankshaft ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs sm:text-sm">Virabrequim</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedEngine.has_piston ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs sm:text-sm">Pistão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedEngine.has_connecting_rod ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs sm:text-sm">Biela</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedEngine.turns_manually ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs sm:text-sm">Gira Manual</span>
                  </div>
                </div>
              </div>

              {selectedEngine.removed_by_company && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm sm:text-base mb-2">Remoção</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Removido por: {selectedEngine.removed_by_employee_name || 'N/A'}
                  </p>
                </div>
              )}

              {selectedEngine.orders && selectedEngine.orders.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm sm:text-base mb-3">
                    Ordens de Serviço ({selectedEngine.orders.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedEngine.orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs sm:text-sm truncate">
                            {order.order_number}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.customer?.name || 'N/A'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground mb-1">
                      Cadastrado em
                    </h4>
                    <p className="text-xs sm:text-sm">
                      {new Date(selectedEngine.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground mb-1">
                      Atualizado em
                    </h4>
                    <p className="text-xs sm:text-sm">
                      {new Date(selectedEngine.updated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
