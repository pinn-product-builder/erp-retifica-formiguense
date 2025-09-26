import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  Filter, 
  Search, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Settings,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { KanbanBoard } from '@/components/workflow/KanbanBoard';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

interface OrderContext {
  id?: string;
  number?: string;
  customer?: string;
  status?: string;
  progress?: number;
  currentStep?: string;
}

interface KanbanInterfaceProps {
  orderContext?: OrderContext;
}

interface WorkflowStats {
  totalOrders: number;
  activeOrders: number;
  completedToday: number;
  delayedOrders: number;
  averageTime: number;
}

interface ComponentStatus {
  component: string;
  status: string;
  assignedTo?: string;
  startedAt?: string;
  estimatedCompletion?: string;
  progress: number;
}

export function KanbanInterface({ orderContext }: KanbanInterfaceProps) {
  const { getOrders, loading } = useSupabase();
  const { toast } = useToast();

  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [stats, setStats] = useState<WorkflowStats>({
    totalOrders: 0,
    activeOrders: 0,
    completedToday: 0,
    delayedOrders: 0,
    averageTime: 0
  });

  const [componentStatuses, setComponentStatuses] = useState<ComponentStatus[]>([
    {
      component: 'Bloco',
      status: 'usinagem',
      assignedTo: 'João Silva',
      startedAt: '2025-09-26T08:00:00',
      estimatedCompletion: '2025-09-27T16:00:00',
      progress: 65
    },
    {
      component: 'Cabeçote',
      status: 'metrologia',
      assignedTo: 'Maria Santos',
      startedAt: '2025-09-26T09:30:00',
      estimatedCompletion: '2025-09-26T17:00:00',
      progress: 30
    },
    {
      component: 'Virabrequim',
      status: 'entrada',
      progress: 0
    },
    {
      component: 'Biela',
      status: 'montagem',
      assignedTo: 'Pedro Costa',
      startedAt: '2025-09-25T14:00:00',
      estimatedCompletion: '2025-09-26T12:00:00',
      progress: 90
    },
    {
      component: 'Comando',
      status: 'pronto',
      assignedTo: 'Ana Pereira',
      progress: 100
    }
  ]);

  useEffect(() => {
    loadOrders();
    loadStats();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      if (data) {
        setOrders(data);
        updateStats(data);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as ordens",
        variant: "destructive"
      });
    }
  };

  const loadStats = async () => {
    // TODO: Implementar carregamento real das estatísticas
    setStats({
      totalOrders: 24,
      activeOrders: 18,
      completedToday: 3,
      delayedOrders: 2,
      averageTime: 4.5
    });
  };

  const updateStats = (ordersData: any[]) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const totalOrders = ordersData.length;
    const activeOrders = ordersData.filter(o => !['entregue', 'cancelada', 'arquivada'].includes(o.status)).length;
    const completedToday = ordersData.filter(o => 
      o.status === 'concluida' && 
      o.completed_at?.startsWith(today)
    ).length;
    const delayedOrders = ordersData.filter(o => 
      o.estimated_delivery && 
      new Date(o.estimated_delivery) < now && 
      !['entregue', 'cancelada'].includes(o.status)
    ).length;

    setStats(prev => ({
      ...prev,
      totalOrders,
      activeOrders,
      completedToday,
      delayedOrders
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'entrada': 'bg-gray-100 text-gray-800',
      'metrologia': 'bg-blue-100 text-blue-800',
      'usinagem': 'bg-orange-100 text-orange-800',
      'montagem': 'bg-purple-100 text-purple-800',
      'pronto': 'bg-green-100 text-green-800',
      'garantia': 'bg-indigo-100 text-indigo-800',
      'entregue': 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'entrada':
        return <Clock className="h-4 w-4" />;
      case 'metrologia':
      case 'usinagem':
      case 'montagem':
        return <Play className="h-4 w-4" />;
      case 'pronto':
      case 'entregue':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTimeRemaining = (estimatedCompletion?: string) => {
    if (!estimatedCompletion) return null;
    
    const now = new Date();
    const completion = new Date(estimatedCompletion);
    const diff = completion.getTime() - now.getTime();
    
    if (diff < 0) {
      const hours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
      return `Atrasado ${hours}h`;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    }
    return `${minutes}m restantes`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header com contexto da ordem */}
      {orderContext?.number && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">
                  Ordem de Serviço: {orderContext.number}
                </h3>
                <p className="text-sm text-blue-700">
                  Cliente: {orderContext.customer}
                </p>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(orderContext.status || '')}>
                  {orderContext.status}
                </Badge>
                {orderContext.progress && (
                  <div className="mt-2 w-32">
                    <Progress value={orderContext.progress} />
                    <p className="text-xs text-blue-600 mt-1">
                      {orderContext.progress}% concluído
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas do Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de OS</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-orange-600">{stats.activeOrders}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Play className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Finalizadas Hoje</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Atraso</p>
                <p className="text-2xl font-bold text-red-600">{stats.delayedOrders}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageTime}d</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status dos Componentes da Ordem Atual */}
      {orderContext?.number && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status dos Componentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {componentStatuses.map((component) => (
                <Card key={component.component} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{component.component}</h4>
                      <Badge className={getStatusColor(component.status)}>
                        {getStatusIcon(component.status)}
                        <span className="ml-1 capitalize">{component.status}</span>
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Progress value={component.progress} className="h-2" />
                      <p className="text-xs text-gray-600">
                        {component.progress}% concluído
                      </p>

                      {component.assignedTo && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3 w-3" />
                          <span>{component.assignedTo}</span>
                        </div>
                      )}

                      {component.estimatedCompletion && (
                        <div className="text-xs">
                          <p className={`
                            ${component.estimatedCompletion && new Date(component.estimatedCompletion) < new Date()
                              ? 'text-red-600 font-medium'
                              : 'text-gray-600'
                            }
                          `}>
                            {formatTimeRemaining(component.estimatedCompletion)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles e Filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="text-lg">Painel Kanban</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar ordens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="metrologia">Metrologia</SelectItem>
                  <SelectItem value="usinagem">Usinagem</SelectItem>
                  <SelectItem value="montagem">Montagem</SelectItem>
                  <SelectItem value="pronto">Pronto</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="joao">João Silva</SelectItem>
                  <SelectItem value="maria">Maria Santos</SelectItem>
                  <SelectItem value="pedro">Pedro Costa</SelectItem>
                  <SelectItem value="ana">Ana Pereira</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Carregando workflow...</span>
              </div>
            </div>
          ) : (
            <KanbanBoard />
          )}
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar Relatório
            </Button>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Reatribuir Tarefas
            </Button>
            <Button variant="outline" size="sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Ordens em Atraso
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurar Workflow
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
