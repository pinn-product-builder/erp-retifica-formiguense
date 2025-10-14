import React, { useState } from 'react';
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
  AlertCircle
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import DiagnosticInterface from "@/components/operations/DiagnosticInterface";
import DiagnosticChecklistsConfig from "@/components/operations/DiagnosticChecklistsConfig";
import { useDiagnosticChecklists, useDiagnosticChecklistsQuery } from "@/hooks/useDiagnosticChecklists";
import { useOrders } from "@/hooks/useOrders";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DIAGNOSTIC_STATUS, translateStatus, translateAction, translateMessage } from "@/utils/statusTranslations";

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
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [componentFilter, setComponentFilter] = useState<string>("todos");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string>("none");
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [showChecklistsConfig, setShowChecklistsConfig] = useState(false);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<DiagnosticResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const checklistsFunctions = useDiagnosticChecklists();
  const ordersData = useOrders();

  // Buscar respostas de diagnóstico do banco de dados
  const { data: diagnosticResponsesData, isLoading: isLoadingResponses } = useQuery({
    queryKey: ['diagnostic-responses', currentOrganization?.id],
    queryFn: async () => {
      const responses = await checklistsFunctions.getChecklistResponses();
      
      // Buscar dados completos das ordens para cada resposta
      const responsesWithOrderData = await Promise.all(
        responses.map(async (response) => {
          try {
            // Buscar dados da ordem (já filtrado por organização na query anterior)
            const { data: orderData } = await supabase
              .from('orders')
              .select(`
                order_number,
                customer:customers(name),
                engine:engines(type, brand, model)
              `)
              .eq('id', response.order_id)
              .eq('org_id', currentOrganization?.id)
              .single();

            return {
              ...response,
              order: orderData
            };
          } catch (error) {
            console.error('Erro ao buscar dados da ordem:', error);
            return response;
          }
        })
      );

      return responsesWithOrderData;
    },
    enabled: !!currentOrganization?.id
  });

  const diagnosticResponses = diagnosticResponsesData || [];

  const filteredResponses = diagnosticResponses.filter(response => {
    const matchesSearch = response.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.order?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (response as any).checklist?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || response.status === statusFilter;
    const matchesComponent = componentFilter === "todos" || response.component === componentFilter;
    
    return matchesSearch && matchesStatus && matchesComponent;
  });

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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Diagnóstico
              </Button>
            </DialogTrigger>
          </Dialog>
          
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
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por ordem, cliente ou checklist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pending">{translateStatus('pending', 'diagnostic')}</SelectItem>
                <SelectItem value="completed">{translateStatus('completed', 'diagnostic')}</SelectItem>
                <SelectItem value="approved">{translateStatus('approved', 'diagnostic')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={componentFilter} onValueChange={setComponentFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Componentes</SelectItem>
                <SelectItem value="bloco">Bloco</SelectItem>
                <SelectItem value="eixo">Eixo</SelectItem>
                <SelectItem value="biela">Biela</SelectItem>
                <SelectItem value="comando">Comando</SelectItem>
                <SelectItem value="cabecote">Cabeçote</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Motor</TableHead>
                  <TableHead>Componente</TableHead>
                  <TableHead>Checklist</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diagnosticado por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell className="font-medium">
                      {response.order?.order_number || 'N/A'}
                    </TableCell>
                    <TableCell>{response.order?.customer?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{response.order?.engine?.brand || 'N/A'}</div>
                        <div className="text-muted-foreground">{response.order?.engine?.model || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getComponentLabel(response.component)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {(response as any).checklist?.name || 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(response.status)}</TableCell>
                    <TableCell>{response.diagnosed_by_name || response.diagnosed_by || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(response.diagnosed_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(response)}
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {response.status === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleStartDiagnostic(response.order_id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {filteredResponses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum diagnóstico encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou iniciar um novo diagnóstico</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnostic Interface Dialog */}
      <Dialog open={isDiagnosticOpen} onOpenChange={setIsDiagnosticOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Diagnóstico com Checklist</DialogTitle>
            <DialogDescription>
              Execute o diagnóstico padronizado para a ordem selecionada
            </DialogDescription>
          </DialogHeader>
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
                <div className="space-y-3">
                  {selectedDiagnostic.responses && Object.entries(selectedDiagnostic.responses).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium">{key}</span>
                      <span className="text-sm text-muted-foreground">
                        {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
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
