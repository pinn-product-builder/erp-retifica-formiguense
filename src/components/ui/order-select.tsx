import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { Search, Package, User, Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";
import { OrderService, OrderWithDetails } from "@/services/OrderService";

// Usando OrderWithDetails do OrderService
type Order = OrderWithDetails;

interface OrderSelectProps {
  value?: string;
  onValueChange: (orderId: string, order?: Order) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  filterByApprovedBudget?: 'aprovado' | 'pendente' | 'reprovado' | 'em_producao';
}

export function OrderSelect({
  value,
  onValueChange,
  placeholder,
  label = "Ordem de Serviço",
  required = false,
  disabled = false,
  className = "",
  filterByApprovedBudget
}: OrderSelectProps) {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Buscar ordens quando o modal abrir ou parâmetros mudarem
  useEffect(() => {
    if (isOpen && currentOrganization?.id) {
      fetchOrders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentOrganization?.id, searchTerm, currentPage]);

  // Buscar ordem selecionada quando value mudar
  useEffect(() => {
    if (value && !selectedOrder) {
      fetchSelectedOrder(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, selectedOrder]);

  const fetchOrders = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const result = await OrderService.searchOrders({
        orgId: currentOrganization.id,
        searchTerm: searchTerm.trim() || undefined,
        budgetStatus: filterByApprovedBudget || undefined,
        page: currentPage,
        limit: 20,
        orderBy: 'created_at',
        orderDirection: 'desc'
      });

      setOrders(result.orders);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setHasNextPage(result.hasNextPage);
      setHasPreviousPage(result.hasPreviousPage);
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar ordens de serviço"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedOrder = async (orderId: string) => {
    if (!currentOrganization?.id) return;

    try {
      const order = await OrderService.getOrderById(
        orderId, 
        currentOrganization.id, 
        filterByApprovedBudget || undefined
      );
      
      setSelectedOrder(order);
    } catch (error) {
      console.error('Erro ao buscar ordem selecionada:', error);
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    onValueChange(order.id, order);
    setIsOpen(false);
    setSearchTerm("");
    
    toast({
      title: "Sucesso",
      description: `Ordem ${order.order_number} selecionada`
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset para primeira página ao buscar
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearSelection = () => {
    setSelectedOrder(null);
    onValueChange("", undefined);
    
    toast({
      title: "Seleção removida",
      description: "Ordem de serviço removida"
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'active': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={className}>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="space-y-2">
        {selectedOrder ? (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{selectedOrder.order_number}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getStatusColor(selectedOrder.status)}`}
                >
                  {selectedOrder.status}
                </Badge>
              </div>
              {selectedOrder.customer && (
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedOrder.customer.name}
                  </span>
                </div>
              )}
              {selectedOrder.engine && (
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedOrder.engine.brand} {selectedOrder.engine.model} - {selectedOrder.engine.type}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                disabled={disabled}
              >
                <Search className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                disabled={disabled}
              >
                ×
              </Button>
            </div>
          </div>
        ) : (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                disabled={disabled}
              >
                <Search className="w-4 h-4 mr-2" />
                {placeholder || (filterByApprovedBudget ? "Selecionar Ordem com Orçamento Aprovado" : "Selecionar Ordem")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Selecionar Ordem de Serviço</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Input
                  placeholder={`Buscar por número da OS, cliente, marca...${filterByApprovedBudget ? ' (apenas com orçamento aprovado)' : ''}`}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full"
                />

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {loading ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Carregando ordens...
                    </div>
                  ) : orders.length > 0 ? (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSelectOrder(order)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{order.order_number}</span>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getStatusColor(order.status)}`}
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        
                        {order.customer && (
                          <div className="flex items-center gap-2 mt-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {order.customer.name}
                            </span>
                          </div>
                        )}
                        
                        {order.engine && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {order.engine.brand} {order.engine.model} - {order.engine.type}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{filterByApprovedBudget ? 'Nenhuma ordem com orçamento aprovado encontrada' : 'Nenhuma ordem encontrada'}</p>
                      {searchTerm && (
                        <p className="text-sm">
                          Tente ajustar o termo de busca
                        </p>
                      )}
                      {filterByApprovedBudget && (
                        <p className="text-xs mt-2">
                          Apenas ordens com orçamento aprovado são exibidas
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Controles de Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} ({totalCount} ordens)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!hasPreviousPage}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNextPage}
                      >
                        Próxima
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
