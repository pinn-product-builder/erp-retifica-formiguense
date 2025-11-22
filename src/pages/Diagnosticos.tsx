// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Check, 
  X,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  Image
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import DiagnosticInterface from "@/components/operations/DiagnosticInterface";
import DiagnosticChecklistsConfig from "@/components/operations/DiagnosticChecklistsConfig";
import { DiagnosticFilters } from "@/components/operations/DiagnosticFilters";
import { DiagnosticResponsesTable } from "@/components/operations/DiagnosticResponsesTable";
import { useDiagnosticChecklists, useDiagnosticChecklistsQuery } from "@/hooks/useDiagnosticChecklists";
import { useOrders } from "@/hooks/useOrders";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { DiagnosticService } from "@/services/DiagnosticService";
import { DIAGNOSTIC_STATUS, translateStatus, translateAction, translateMessage } from "@/utils/statusTranslations";
import { supabase } from "@/integrations/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useModuleGuard } from "@/hooks/useRoleGuard";

interface DiagnosticResponse {
  id: string;
  order_id: string;
  checklist_id: string;
  component: string;
  status: 'pending' | 'completed' | 'approved';
  diagnosed_at: string;
  diagnosed_by: string;
  diagnosed_by_name?: string;
  responses?: Record<string, string | number | boolean>;
  order?: {
    order_number: string;
    customer?: {
      name: string;
    };
    engine?: {
      type: string;
      brand: string;
      model: string;
    };
  };
  checklist?: {
    name: string;
  };
}

const Diagnosticos = () => {
  const { hasPermission, permissions } = useModuleGuard('production', 'read', { blockAccess: true });
  
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  
  const canEdit = permissions.canEditModule('production');
  
  const canEdit = permissions.canEditModule('production');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [componentFilter, setComponentFilter] = useState<string>("todos");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string>("none");
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [showChecklistsConfig, setShowChecklistsConfig] = useState(false);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<DiagnosticResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const checklistsFunctions = useDiagnosticChecklists();
  const ordersData = useOrders();

  // Buscar respostas de diagnóstico via service (query transportada do arquivo)
  const { data: diagnosticResponsesData, isLoading: isLoadingResponses } = useQuery({
    queryKey: ['diagnostic-responses', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      return await DiagnosticService.getResponsesWithOrderData(currentOrganization.id);
    },
    enabled: !!currentOrganization?.id
  });

  const diagnosticResponses = diagnosticResponsesData || [];

  const filteredResponses = useMemo(() => {
    const filtered = diagnosticResponses.filter(response => {
      const responseWithOrder = response as unknown;
      const matchesSearch = responseWithOrder.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           responseWithOrder.order?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           responseWithOrder.checklist?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || response.status === statusFilter;
      const matchesComponent = componentFilter === "todos" || response.component === componentFilter;
      return matchesSearch && matchesStatus && matchesComponent;
    });
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.diagnosed_at).getTime();
      const dateB = new Date(b.diagnosed_at).getTime();
      return dateB - dateA;
    });
  }, [diagnosticResponses, searchTerm, statusFilter, componentFilter]);

  const paginatedResponses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredResponses.slice(startIndex, endIndex);
  }, [filteredResponses, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredResponses.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, componentFilter]);

  const stats = {
    total: diagnosticResponses.length,
    pendentes: diagnosticResponses.filter(r => r.status === 'pending').length,
    concluidos: diagnosticResponses.filter(r => r.status === 'completed').length,
    aprovados: diagnosticResponses.filter(r => r.status === 'approved').length
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "default",
      completed: "default",
      approved: "default"
    };
    
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800", 
      approved: "bg-green-100 text-green-800"
    };

    const icons = {
      pending: Clock,
      completed: CheckCircle,
      approved: CheckCircle
    };

    const IconComponent = icons[status as keyof typeof icons];

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        <IconComponent className="w-3 h-3 mr-1" />
        {translateStatus(status, 'diagnostic')}
      </Badge>
    );
  };

  const getComponentLabel = (component: string) => {
    const components = {
      bloco: "Bloco",
      eixo: "Eixo",
      biela: "Biela",
      comando: "Comando",
      cabecote: "Cabeçote"
    };
    return components[component as keyof typeof components] || component;
  };

  // Componente para exibir respostas do checklist
  const ChecklistResponsesDisplay = ({ responses, checklistId }: { responses: Record<string, any>, checklistId?: string | null }) => {
    const [checklistItems, setChecklistItems] = useState<Record<string, { item_name: string; item_type: string; item_description?: string }>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchChecklistItems = async () => {
        if (!checklistId) {
          setLoading(false);
          return;
        }

        try {
          const { data, error } = await supabase
            .from('diagnostic_checklist_items')
            .select('id, item_name, item_type, item_description')
            .eq('checklist_id', checklistId);

          if (error) throw error;

          const itemsMap: Record<string, { item_name: string; item_type: string; item_description?: string }> = {};
          (data || []).forEach((item: any) => {
            itemsMap[item.id] = {
              item_name: item.item_name,
              item_type: item.item_type,
              item_description: item.item_description
            };
          });

          setChecklistItems(itemsMap);
        } catch (error) {
          console.error('Erro ao buscar itens do checklist:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchChecklistItems();
    }, [checklistId]);

    const formatValue = (value: any, itemType?: string): string => {
      if (value === null || value === undefined) return 'N/A';
      
      // Se for um objeto com propriedades
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Se tem propriedade 'value', usar ela
        if ('value' in value) {
          return formatValue(value.value, itemType);
        }
        // Se tem propriedade 'notes', usar ela
        if ('notes' in value && value.notes) {
          return value.notes;
        }
        // Se é um objeto de medição
        if ('measurement' in value || 'value' in value) {
          const measurement = value.measurement || value.value;
          const unit = value.unit || '';
          return `${measurement}${unit ? ` ${unit}` : ''}`;
        }
        // Tentar converter para string legível
        return JSON.stringify(value, null, 2);
      }

      // Valores primitivos
      if (typeof value === 'boolean') {
        return value ? 'Sim' : 'Não';
      }
      
      if (typeof value === 'number') {
        return value.toString();
      }

      if (Array.isArray(value)) {
        if (value.length === 0) return 'Nenhum';
        return value.join(', ');
      }

      return String(value);
    };

    const getItemPhotos = (responseData: any): string[] => {
      if (!responseData || typeof responseData !== 'object') return [];
      
      if (Array.isArray(responseData.photos)) {
        return responseData.photos.filter((p: any) => p && typeof p === 'string');
      }
      
      return [];
    };

    if (loading) {
      return (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Carregando itens do checklist...</p>
        </div>
      );
    }

    const responseEntries = Object.entries(responses || {});

    if (responseEntries.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma resposta registrada</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {responseEntries.map(([itemId, responseData]) => {
          const item = checklistItems[itemId];
          const itemName = item?.item_name || itemId;
          const itemType = item?.item_type || 'unknown';
          const itemDescription = item?.item_description;
          
          // Se responseData é um objeto com propriedades
          const actualValue = typeof responseData === 'object' && responseData !== null && !Array.isArray(responseData)
            ? (responseData.value !== undefined ? responseData.value : responseData)
            : responseData;
          
          const notes = typeof responseData === 'object' && responseData !== null && 'notes' in responseData
            ? responseData.notes
            : null;
          
          const photos = getItemPhotos(responseData);
          
          return (
            <div key={itemId} className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h5 className="font-semibold text-sm">{itemName}</h5>
                  {itemDescription && (
                    <p className="text-xs text-muted-foreground mt-1">{itemDescription}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {itemType === 'checkbox' ? 'Checkbox' :
                   itemType === 'measurement' ? 'Medição' :
                   itemType === 'photo' ? 'Foto' :
                   itemType === 'text' ? 'Texto' :
                   itemType === 'select' ? 'Seleção' :
                   itemType}
                </Badge>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Resposta:</span>
                  <span className="text-sm font-semibold">
                    {formatValue(actualValue, itemType)}
                  </span>
                </div>
                
                {notes && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-xs font-medium text-muted-foreground">Observações:</span>
                    <p className="text-sm mt-1">{notes}</p>
                  </div>
                )}
                
                {photos.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      Fotos ({photos.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {photos.map((photoUrl, idx) => (
                        <a
                          key={idx}
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-video bg-muted rounded overflow-hidden group"
                        >
                          <img
                            src={photoUrl}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EImagem não disponível%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleStartDiagnostic = (orderId: string) => {
    setSelectedOrder(orderId);
    setIsDiagnosticOpen(true);
  };

  const handleDiagnosticComplete = (response: DiagnosticResponse) => {
    toast({
      title: "Sucesso",
      description: "Diagnóstico concluído com sucesso"
    });
    setIsDiagnosticOpen(false);
    setSelectedOrder("");
  };

  const handleViewDetails = (diagnostic: DiagnosticResponse) => {
    setSelectedDiagnostic(diagnostic);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Diagnósticos</h1>
          <p className="text-muted-foreground">
            Execute diagnósticos padronizados usando checklists configurados
          </p>
        </div>
        
        <div className="flex gap-2">
          {canEdit && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Diagnóstico
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
          
          <Button
            variant="outline"
            onClick={() => setShowChecklistsConfig(!showChecklistsConfig)}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            {showChecklistsConfig ? 'Ocultar' : 'Configurar'} Checklists
          </Button>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Iniciar Novo Diagnóstico</DialogTitle>
              <DialogDescription>
                Selecione uma ordem de serviço para iniciar o diagnóstico
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Ordem de Serviço</label>
                <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma ordem" />
                  </SelectTrigger>
                  <SelectContent>
                    {ordersData.orders?.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} - {order.customer?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    if (selectedOrder && selectedOrder !== "none") {
                      handleStartDiagnostic(selectedOrder);
                      setIsCreateDialogOpen(false);
                    }
                  }}
                  disabled={!selectedOrder || selectedOrder === "none"}
                >
                  Iniciar Diagnóstico
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

{/* Checklists Configuration */}
      {showChecklistsConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Checklists</CardTitle>
            <CardDescription>
              Configure e gerencie os checklists de diagnóstico para cada tipo de motor e componente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DiagnosticChecklistsConfig />
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={ClipboardList}
          variant="default"
        />
        <StatCard
          title="Pendentes"
          value={stats.pendentes}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Concluídos"
          value={stats.concluidos}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Aprovados"
          value={stats.aprovados}
          icon={Check}
          variant="primary"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <DiagnosticFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            component={componentFilter}
            onComponentChange={setComponentFilter}
          />
        </CardContent>
      </Card>

      {/* Diagnostic Responses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Diagnósticos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingResponses ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando diagnósticos...</p>
            </div>
          ) : (
            <>
              <DiagnosticResponsesTable
                responses={paginatedResponses as any}
                onViewDetails={handleViewDetails as any}
                onResumeDiagnostic={handleStartDiagnostic}
              />
              {totalPages > 1 && (
                <div className="mt-4">
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
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredResponses.length)} de {filteredResponses.length} diagnósticos
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Diagnostic Interface Dialog */}
      <Dialog open={isDiagnosticOpen} onOpenChange={setIsDiagnosticOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DiagnosticInterface
            orderId={selectedOrder}
            onComplete={handleDiagnosticComplete}
          />
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Diagnóstico</DialogTitle>
            <DialogDescription>
              Visualize os detalhes completos do diagnóstico realizado
            </DialogDescription>
          </DialogHeader>
          {selectedDiagnostic && (
            <div className="space-y-6">
              {/* Informações da Ordem */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Ordem de Serviço</h4>
                  <p className="font-medium">{selectedDiagnostic.order?.order_number || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Cliente</h4>
                  <p className="font-medium">{selectedDiagnostic.order?.customer?.name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Motor</h4>
                  <p className="font-medium">
                    {selectedDiagnostic.order?.engine ? 
                      `${selectedDiagnostic.order.engine.brand} ${selectedDiagnostic.order.engine.model} - ${selectedDiagnostic.order.engine.type}` 
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Componente</h4>
                  <p className="font-medium">{getComponentLabel(selectedDiagnostic.component)}</p>
                </div>
              </div>

              {/* Respostas do Checklist */}
              <div>
                <h4 className="font-semibold mb-4">Respostas do Checklist</h4>
                {selectedDiagnostic.responses && Object.keys(selectedDiagnostic.responses).length > 0 ? (
                  <ChecklistResponsesDisplay 
                    responses={selectedDiagnostic.responses} 
                    checklistId={selectedDiagnostic.checklist_id}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma resposta registrada</p>
                  </div>
                )}
              </div>

              {/* Status e Data */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <span className="text-sm text-muted-foreground">Status: </span>
                  <Badge variant={selectedDiagnostic.status === 'completed' ? 'default' : 'secondary'}>
                    {translateStatus(selectedDiagnostic.status, 'diagnostic')}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Realizado em: {new Date(selectedDiagnostic.diagnosed_at).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Diagnosticos;
