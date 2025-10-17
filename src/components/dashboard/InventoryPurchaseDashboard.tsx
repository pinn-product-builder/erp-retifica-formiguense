import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Calendar,
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface InventoryKPI {
  id: string;
  name: string;
  value: number;
  formattedValue: string;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  icon: React.ElementType;
  color: string;
  description: string;
  target?: number;
  unit: string;
}

interface PurchaseKPI {
  id: string;
  name: string;
  value: number;
  formattedValue: string;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  icon: React.ElementType;
  color: string;
  description: string;
  target?: number;
  unit: string;
}

interface ChartData {
  date: string;
  entries: number;
  exits: number;
  adjustments: number;
  value: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface InventoryItem {
  id: string;
  quantity: number;
  unit_cost?: number;
  min_stock_level?: number;
  component?: string;
}

interface MovementItem {
  id: string;
  movement_type: string;
  quantity: number;
  unit_cost?: number;
  created_at: string;
}

interface NeedItem {
  id: string;
  status: string;
  priority_level: string;
  estimated_cost?: number;
}

interface QuotationItem {
  id: string;
  status: string;
  created_at: string;
}

interface RequisitionItem {
  id: string;
  status: string;
  created_at: string;
}

export default function InventoryPurchaseDashboard() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [inventoryKPIs, setInventoryKPIs] = useState<InventoryKPI[]>([]);
  const [purchaseKPIs, setPurchaseKPIs] = useState<PurchaseKPI[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchDashboardData = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      // Calcular datas do período
      const endDate = new Date();
      const startDate = subDays(endDate, period === '7d' ? 7 : period === '30d' ? 30 : 90);
      const previousStartDate = subDays(startDate, period === '7d' ? 7 : period === '30d' ? 30 : 90);

      // Funções de fetch locais
      const fetchInventoryData = async () => {
        const { data, error } = await supabase
          .from('parts_inventory')
          .select('*')
          .eq('org_id', currentOrganization?.id);
        if (error) throw error;
        return data || [];
      };

      const fetchMovementsData = async (startDate: Date, endDate: Date) => {
        const { data, error } = await supabase
          .from('inventory_movements')
          .select('*')
          .eq('org_id', currentOrganization?.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
      };

      const fetchPurchaseNeedsData = async () => {
        const { data, error } = await supabase
          .from('purchase_needs')
          .select('*')
          .eq('org_id', currentOrganization?.id);
        if (error) throw error;
        return data || [];
      };

      const fetchQuotationsData = async (startDate: Date, endDate: Date) => {
        const { data, error } = await supabase
          .from('quotations')
          .select('*')
          .eq('org_id', currentOrganization?.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        if (error) throw error;
        return data || [];
      };

      const fetchRequisitionsData = async (startDate: Date, endDate: Date) => {
        const { data, error } = await supabase
          .from('purchase_requisitions')
          .select('*')
          .eq('org_id', currentOrganization?.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        if (error) throw error;
        return data || [];
      };

      // Buscar dados em paralelo
      const [
        inventoryData,
        movementsData,
        purchaseNeedsData,
        quotationsData,
        requisitionsData,
        previousMovementsData,
      ] = await Promise.all([
        fetchInventoryData(),
        fetchMovementsData(startDate, endDate),
        fetchPurchaseNeedsData(),
        fetchQuotationsData(startDate, endDate),
        fetchRequisitionsData(startDate, endDate),
        fetchMovementsData(previousStartDate, startDate),
      ]);

      // Calcular KPIs de Inventário
      const inventoryKPIs = calculateInventoryKPIs(
        inventoryData,
        movementsData,
        previousMovementsData
      );
      
      // Calcular KPIs de Compras
      const purchaseKPIs = calculatePurchaseKPIs(
        purchaseNeedsData,
        quotationsData,
        requisitionsData
      );

      // Preparar dados dos gráficos
      const chartData = prepareChartData(movementsData);
      const categoryData = prepareCategoryData(inventoryData);

      setInventoryKPIs(inventoryKPIs);
      setPurchaseKPIs(purchaseKPIs);
      setChartData(chartData);
      setCategoryData(categoryData);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, period, toast]);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchDashboardData();
    }
  }, [currentOrganization?.id, period, fetchDashboardData]);

  const calculateInventoryKPIs = (
    inventory: InventoryItem[],
    movements: MovementItem[],
    previousMovements: MovementItem[]
  ): InventoryKPI[] => {
    // Total de itens em estoque
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const previousTotalItems = totalItems - movements.reduce((sum, mov) => {
      return sum + (mov.movement_type === 'entrada' ? mov.quantity : -mov.quantity);
    }, 0);

    // Valor total do estoque
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.unit_cost || 0)), 0);

    // Itens com estoque baixo
    const lowStockItems = inventory.filter(item => 
      item.quantity <= (item.min_stock_level || 5)
    ).length;

    // Giro de estoque (aproximado)
    const totalExits = movements.filter(m => m.movement_type === 'saida').length;
    const avgInventory = totalItems > 0 ? totalItems : 1;
    const turnoverRate = totalExits / avgInventory;

    // Acurácia do inventário (baseado em ajustes)
    const adjustments = movements.filter(m => m.movement_type === 'ajuste');
    const totalAdjustments = adjustments.reduce((sum, adj) => sum + Math.abs(adj.quantity), 0);
    const accuracy = totalItems > 0 ? Math.max(0, 100 - ((totalAdjustments / totalItems) * 100)) : 100;

    // Movimentações do período
    const totalMovements = movements.length;
    const previousTotalMovements = previousMovements.length;

    return [
      {
        id: 'total-items',
        name: 'Total de Itens',
        value: totalItems,
        formattedValue: totalItems.toLocaleString('pt-BR'),
        previousValue: previousTotalItems,
        trend: totalItems > previousTotalItems ? 'up' : totalItems < previousTotalItems ? 'down' : 'stable',
        trendPercentage: previousTotalItems > 0 ? ((totalItems - previousTotalItems) / previousTotalItems) * 100 : 0,
        icon: Package,
        color: 'blue',
        description: 'Quantidade total de peças em estoque',
        unit: 'unidades',
      },
      {
        id: 'total-value',
        name: 'Valor do Estoque',
        value: totalValue,
        formattedValue: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue),
        icon: DollarSign,
        color: 'green',
        description: 'Valor total investido em estoque',
        unit: 'R$',
      },
      {
        id: 'low-stock',
        name: 'Estoque Baixo',
        value: lowStockItems,
        formattedValue: lowStockItems.toString(),
        icon: AlertTriangle,
        color: lowStockItems > 0 ? 'red' : 'green',
        description: 'Itens com estoque abaixo do mínimo',
        unit: 'itens',
      },
      {
        id: 'turnover-rate',
        name: 'Giro de Estoque',
        value: turnoverRate,
        formattedValue: turnoverRate.toFixed(2),
        icon: RefreshCw,
        color: 'purple',
        description: 'Velocidade de rotação do estoque',
        target: 2.0,
        unit: 'x/período',
      },
      {
        id: 'accuracy',
        name: 'Acurácia',
        value: accuracy,
        formattedValue: `${accuracy.toFixed(1)}%`,
        icon: Target,
        color: accuracy >= 95 ? 'green' : accuracy >= 85 ? 'yellow' : 'red',
        description: 'Precisão do controle de estoque',
        target: 95,
        unit: '%',
      },
      {
        id: 'movements',
        name: 'Movimentações',
        value: totalMovements,
        formattedValue: totalMovements.toString(),
        previousValue: previousTotalMovements,
        trend: totalMovements > previousTotalMovements ? 'up' : totalMovements < previousTotalMovements ? 'down' : 'stable',
        trendPercentage: previousTotalMovements > 0 ? ((totalMovements - previousTotalMovements) / previousTotalMovements) * 100 : 0,
        icon: Activity,
        color: 'blue',
        description: 'Total de movimentações no período',
        unit: 'movimentos',
      },
    ];
  };

  const calculatePurchaseKPIs = (
    needs: NeedItem[],
    quotations: QuotationItem[],
    requisitions: RequisitionItem[]
  ): PurchaseKPI[] => {
    // Necessidades pendentes
    const pendingNeeds = needs.filter(n => n.status === 'pending').length;
    const criticalNeeds = needs.filter(n => n.priority_level === 'critical').length;

    // Cotações
    const totalQuotations = quotations.length;
    const approvedQuotations = quotations.filter(q => q.status === 'approved').length;
    const quotationApprovalRate = totalQuotations > 0 ? (approvedQuotations / totalQuotations) * 100 : 0;

    // Requisições
    const totalRequisitions = requisitions.length;
    const completedRequisitions = requisitions.filter(r => r.status === 'completed').length;
    const requisitionCompletionRate = totalRequisitions > 0 ? (completedRequisitions / totalRequisitions) * 100 : 0;

    // Valor total das necessidades
    const totalNeedsValue = needs.reduce((sum, need) => sum + (need.estimated_cost || 0), 0);

    // Tempo médio de cotação (aproximado)
    const avgQuotationTime = quotations.length > 0 ? 3.5 : 0; // Placeholder - seria calculado com dados reais

    return [
      {
        id: 'pending-needs',
        name: 'Necessidades Pendentes',
        value: pendingNeeds,
        formattedValue: pendingNeeds.toString(),
        icon: Clock,
        color: pendingNeeds > 0 ? 'orange' : 'green',
        description: 'Necessidades de compra aguardando processamento',
        unit: 'itens',
      },
      {
        id: 'critical-needs',
        name: 'Necessidades Críticas',
        value: criticalNeeds,
        formattedValue: criticalNeeds.toString(),
        icon: AlertTriangle,
        color: criticalNeeds > 0 ? 'red' : 'green',
        description: 'Necessidades com prioridade crítica',
        unit: 'itens',
      },
      {
        id: 'quotation-rate',
        name: 'Taxa de Aprovação',
        value: quotationApprovalRate,
        formattedValue: `${quotationApprovalRate.toFixed(1)}%`,
        icon: CheckCircle,
        color: quotationApprovalRate >= 70 ? 'green' : quotationApprovalRate >= 50 ? 'yellow' : 'red',
        description: 'Percentual de cotações aprovadas',
        target: 70,
        unit: '%',
      },
      {
        id: 'completion-rate',
        name: 'Taxa de Conclusão',
        value: requisitionCompletionRate,
        formattedValue: `${requisitionCompletionRate.toFixed(1)}%`,
        icon: CheckCircle,
        color: requisitionCompletionRate >= 80 ? 'green' : requisitionCompletionRate >= 60 ? 'yellow' : 'red',
        description: 'Percentual de requisições concluídas',
        target: 80,
        unit: '%',
      },
      {
        id: 'needs-value',
        name: 'Valor das Necessidades',
        value: totalNeedsValue,
        formattedValue: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalNeedsValue),
        icon: DollarSign,
        color: 'blue',
        description: 'Valor total das necessidades de compra',
        unit: 'R$',
      },
      {
        id: 'avg-quotation-time',
        name: 'Tempo Médio Cotação',
        value: avgQuotationTime,
        formattedValue: `${avgQuotationTime.toFixed(1)} dias`,
        icon: Clock,
        color: avgQuotationTime <= 3 ? 'green' : avgQuotationTime <= 5 ? 'yellow' : 'red',
        description: 'Tempo médio para obter cotações',
        target: 3,
        unit: 'dias',
      },
    ];
  };

  const prepareChartData = (movements: MovementItem[]): ChartData[] => {
    const groupedData = movements.reduce((acc, movement) => {
      const date = format(new Date(movement.created_at), 'dd/MM', { locale: ptBR });
      
      if (!acc[date]) {
        acc[date] = { date, entries: 0, exits: 0, adjustments: 0, value: 0 };
      }

      switch (movement.movement_type) {
        case 'entrada':
          acc[date].entries += movement.quantity;
          acc[date].value += movement.quantity * (movement.unit_cost || 0);
          break;
        case 'saida':
          acc[date].exits += movement.quantity;
          break;
        case 'ajuste':
          acc[date].adjustments += Math.abs(movement.quantity);
          break;
      }

      return acc;
    }, {} as Record<string, ChartData>);

    return Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));
  };

  const prepareCategoryData = (inventory: InventoryItem[]): CategoryData[] => {
    const categories = inventory.reduce((acc, item) => {
      const category = item.component || 'Outros';
      acc[category] = (acc[category] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];
    
    return Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getColorClass = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      red: 'text-red-600 bg-red-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      orange: 'text-orange-600 bg-orange-100',
      purple: 'text-purple-600 bg-purple-100',
    };
    return colorMap[color as keyof typeof colorMap] || 'text-gray-600 bg-gray-100';
  };

  const formatPeriodLabel = (period: string) => {
    switch (period) {
      case '7d':
        return 'Últimos 7 dias';
      case '30d':
        return 'Últimos 30 dias';
      case '90d':
        return 'Últimos 90 dias';
      default:
        return period;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard de Estoque e Compras</h2>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Estoque e Compras</h2>
          <p className="text-muted-foreground">
            Última atualização: {format(lastUpdate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value: '7d' | '30d' | '90d') => setPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        {/* Aba de Estoque */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventoryKPIs.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          {kpi.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{kpi.formattedValue}</p>
                          {kpi.trend && getTrendIcon(kpi.trend)}
                        </div>
                        {kpi.trendPercentage !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {kpi.trendPercentage > 0 ? '+' : ''}{kpi.trendPercentage.toFixed(1)}% vs período anterior
                          </p>
                        )}
                        {kpi.target && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Meta: {kpi.target}{kpi.unit}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`p-3 rounded-full ${getColorClass(kpi.color)}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpi.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Gráfico de Movimentações */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações de Estoque - {formatPeriodLabel(period)}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="entries"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Entradas"
                  />
                  <Area
                    type="monotone"
                    dataKey="exits"
                    stackId="1"
                    stroke="#ff7300"
                    fill="#ff7300"
                    name="Saídas"
                  />
                  <Area
                    type="monotone"
                    dataKey="adjustments"
                    stackId="1"
                    stroke="#ffc658"
                    fill="#ffc658"
                    name="Ajustes"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Compras */}
        <TabsContent value="purchases" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseKPIs.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          {kpi.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{kpi.formattedValue}</p>
                          {kpi.trend && getTrendIcon(kpi.trend)}
                        </div>
                        {kpi.trendPercentage !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {kpi.trendPercentage > 0 ? '+' : ''}{kpi.trendPercentage.toFixed(1)}% vs período anterior
                          </p>
                        )}
                        {kpi.target && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Meta: {kpi.target}{kpi.unit}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`p-3 rounded-full ${getColorClass(kpi.color)}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpi.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Aba de Análises */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição do Estoque por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Valor das Movimentações */}
            <Card>
              <CardHeader>
                <CardTitle>Valor das Movimentações - {formatPeriodLabel(period)}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(value)),
                        'Valor',
                      ]}
                    />
                    <Bar dataKey="value" fill="#8884d8" name="Valor (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
