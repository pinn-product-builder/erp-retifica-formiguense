import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Printer, 
  X,
  Calendar,
  User,
  Wrench,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Order } from '@/hooks/useOrders';

interface OrdersListProps {
  orders: Order[];
  loading: boolean;
  onViewOrder: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
}

const STATUS_COLORS: Record<string, string> = {
  'ativa': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'em_analise': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'aprovada': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  'em_producao': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  'concluida': 'bg-green-100 text-green-800 hover:bg-green-200',
  'entregue': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  'cancelada': 'bg-red-100 text-red-800 hover:bg-red-200'
};

const STATUS_LABELS: Record<string, string> = {
  'ativa': 'Ativa',
  'em_analise': 'Em Análise',
  'aprovada': 'Aprovada',
  'em_producao': 'Em Produção',
  'concluida': 'Concluída',
  'entregue': 'Entregue',
  'cancelada': 'Cancelada'
};

const PRIORITY_COLORS = {
  1: 'bg-gray-100 text-gray-800',
  2: 'bg-yellow-100 text-yellow-800',
  3: 'bg-red-100 text-red-800'
};

const PRIORITY_LABELS = {
  1: 'Normal',
  2: 'Alta',
  3: 'Urgente'
};

export function OrdersList({ orders, loading, onViewOrder, onEditOrder }: OrdersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.engine?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.engine?.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority.toString() === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número da OS, cliente ou motor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                {Object.entries(PRIORITY_LABELS).map(([priority, label]) => (
                  <SelectItem key={priority} value={priority}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {filteredOrders.length} ordem{filteredOrders.length !== 1 ? 's' : ''} encontrada{filteredOrders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma ordem de serviço encontrada com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold">
                        OS #{order.order_number}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}
                      >
                        {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={PRIORITY_COLORS[order.priority as keyof typeof PRIORITY_COLORS]}
                      >
                        {PRIORITY_LABELS[order.priority as keyof typeof PRIORITY_LABELS]}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Cliente:</span>
                        <span>{order.customer?.name || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Motor:</span>
                        <span>
                          {order.engine ? `${order.engine.brand} ${order.engine.model}` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Criado em:</span>
                        <span>
                          {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>

                      {order.estimated_delivery && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Previsão:</span>
                          <span>
                            {format(new Date(order.estimated_delivery), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      )}

                      {order.consultant && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Consultor:</span>
                          <span>{order.consultant.full_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    
                    {onEditOrder && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditOrder(order)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}