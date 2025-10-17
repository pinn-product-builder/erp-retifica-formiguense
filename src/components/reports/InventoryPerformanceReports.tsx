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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Award,
  Star,
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces para os dados dos relatórios
interface ABCAnalysisItem {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  annual_consumption: number;
  annual_value: number;
  abc_class: 'A' | 'B' | 'C';
  percentage_value: number;
  cumulative_percentage: number;
  turnover_rate: number;
  days_of_supply: number;
}

interface TurnoverAnalysisItem {
  id: string;
  part_code: string;
  part_name: string;
  avg_inventory: number;
  annual_consumption: number;
  turnover_rate: number;
  days_of_supply: number;
  classification: 'Fast' | 'Medium' | 'Slow' | 'Dead';
  last_movement: string | null;
  total_value: number;
}

interface AccuracyAnalysisItem {
  id: string;
  part_code: string;
  part_name: string;
  system_quantity: number;
  physical_quantity: number;
  variance: number;
  variance_percentage: number;
  variance_value: number;
  last_count_date: string | null;
  accuracy_score: number;
}

interface PerformanceMetrics {
  totalItems: number;
  totalValue: number;
  abcDistribution: { class: string; count: number; value: number }[];
  turnoverDistribution: { classification: string; count: number; value: number }[];
  averageAccuracy: number;
  averageTurnover: number;
  deadStockValue: number;
  fastMovingItems: number;
}

export default function InventoryPerformanceReports() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30d' | '90d' | '180d' | '365d'>('365d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  
  // Dados dos relatórios
  const [abcAnalysis, setAbcAnalysis] = useState<ABCAnalysisItem[]>([]);
  const [turnoverAnalysis, setTurnoverAnalysis] = useState<TurnoverAnalysisItem[]>([]);
  const [accuracyAnalysis, setAccuracyAnalysis] = useState<AccuracyAnalysisItem[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    totalItems: 0,
    totalValue: 0,
    abcDistribution: [],
    turnoverDistribution: [],
    averageAccuracy: 0,
    averageTurnover: 0,
    deadStockValue: 0,
    fastMovingItems: 0,
  });

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchReportsData();
    }
  }, [currentOrganization?.id, period]);

  const fetchReportsData = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      // Calcular período em dias
      const periodDays = period === '30d' ? 30 : period === '90d' ? 90 : period === '180d' ? 180 : 365;
      const startDate = subDays(new Date(), periodDays);

      // Buscar dados base
      const [inventoryData, movementsData, countsData] = await Promise.all([
        fetchInventoryData(),
        fetchMovementsData(startDate),
        fetchInventoryCountsData(),
      ]);

      // Calcular análises
      const abcData = calculateABCAnalysis(inventoryData, movementsData, periodDays);
      const turnoverData = calculateTurnoverAnalysis(inventoryData, movementsData, periodDays);
      const accuracyData = calculateAccuracyAnalysis(inventoryData, countsData);
      const metricsData = calculatePerformanceMetrics(abcData, turnoverData, accuracyData);

      setAbcAnalysis(abcData);
      setTurnoverAnalysis(turnoverData);
      setAccuracyAnalysis(accuracyData);
      setPerformanceMetrics(metricsData);

    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados dos relatórios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, period, toast]);

  const fetchInventoryData = async () => {
    const { data, error } = await supabase
      .from('parts_inventory')
      .select('*')
      .eq('org_id', currentOrganization?.id);

    if (error) throw error;
    return data || [];
  };

  const fetchMovementsData = async (startDate: Date) => {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('org_id', currentOrganization?.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const fetchInventoryCountsData = async () => {
    // Primeiro buscar as contagens concluídas
    const { data: counts, error: countsError } = await supabase
      .from('inventory_counts')
      .select('id, completed_at')
      .eq('org_id', currentOrganization?.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10); // Últimas 10 contagens

    if (countsError) throw countsError;
    if (!counts || counts.length === 0) return [];

    // Buscar os itens das contagens
    const countIds = counts.map(c => c.id);
    const { data: items, error: itemsError } = await supabase
      .from('inventory_count_items')
      .select('*')
      .in('count_id', countIds);

    if (itemsError) throw itemsError;

    // Adicionar informações da contagem aos itens
    const itemsWithCounts = (items || []).map(item => ({
      ...item,
      inventory_counts: counts.find(c => c.id === item.count_id)
    }));

    return itemsWithCounts;
  };

  const calculateABCAnalysis = (
    inventory: any[],
    movements: any[],
    periodDays: number
  ): ABCAnalysisItem[] => {
    const annualFactor = 365 / periodDays;

    const analysisData = inventory.map(item => {
      // Calcular consumo no período
      const itemMovements = movements.filter(m => 
        m.part_id === item.id && m.movement_type === 'saida'
      );
      const periodConsumption = itemMovements.reduce((sum, m) => sum + m.quantity, 0);
      const annualConsumption = periodConsumption * annualFactor;
      const annualValue = annualConsumption * (item.unit_cost || 0);

      return {
        id: item.id,
        part_code: item.part_code || '',
        part_name: item.part_name || '',
        quantity: item.quantity || 0,
        unit_cost: item.unit_cost || 0,
        total_value: (item.quantity || 0) * (item.unit_cost || 0),
        annual_consumption: annualConsumption,
        annual_value: annualValue,
        abc_class: 'C' as 'A' | 'B' | 'C',
        percentage_value: 0,
        cumulative_percentage: 0,
        turnover_rate: item.quantity > 0 ? annualConsumption / item.quantity : 0,
        days_of_supply: annualConsumption > 0 ? (item.quantity / annualConsumption) * 365 : 999,
      };
    });

    // Ordenar por valor anual decrescente
    analysisData.sort((a, b) => b.annual_value - a.annual_value);

    // Calcular percentuais e classificação ABC
    const totalValue = analysisData.reduce((sum, item) => sum + item.annual_value, 0);
    let cumulativeValue = 0;

    analysisData.forEach(item => {
      item.percentage_value = totalValue > 0 ? (item.annual_value / totalValue) * 100 : 0;
      cumulativeValue += item.annual_value;
      item.cumulative_percentage = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0;

      // Classificação ABC (80-15-5 rule)
      if (item.cumulative_percentage <= 80) {
        item.abc_class = 'A';
      } else if (item.cumulative_percentage <= 95) {
        item.abc_class = 'B';
      } else {
        item.abc_class = 'C';
      }
    });

    return analysisData;
  };

  const calculateTurnoverAnalysis = (
    inventory: any[],
    movements: any[],
    periodDays: number
  ): TurnoverAnalysisItem[] => {
    const annualFactor = 365 / periodDays;

    return inventory.map(item => {
      const itemMovements = movements.filter(m => m.part_id === item.id);
      const exits = itemMovements.filter(m => m.movement_type === 'saida');
      const periodConsumption = exits.reduce((sum, m) => sum + m.quantity, 0);
      const annualConsumption = periodConsumption * annualFactor;
      
      const avgInventory = item.quantity || 1; // Simplificado - idealmente seria média do período
      const turnoverRate = avgInventory > 0 ? annualConsumption / avgInventory : 0;
      const daysOfSupply = annualConsumption > 0 ? (avgInventory / annualConsumption) * 365 : 999;
      
      const lastMovement = itemMovements.length > 0 
        ? itemMovements[0].created_at 
        : null;

      // Classificação baseada no giro
      let classification: 'Fast' | 'Medium' | 'Slow' | 'Dead';
      if (turnoverRate >= 12) {
        classification = 'Fast';
      } else if (turnoverRate >= 4) {
        classification = 'Medium';
      } else if (turnoverRate >= 1) {
        classification = 'Slow';
      } else {
        classification = 'Dead';
      }

      return {
        id: item.id,
        part_code: item.part_code || '',
        part_name: item.part_name || '',
        avg_inventory: avgInventory,
        annual_consumption: annualConsumption,
        turnover_rate: turnoverRate,
        days_of_supply: daysOfSupply,
        classification,
        last_movement: lastMovement,
        total_value: avgInventory * (item.unit_cost || 0),
      };
    });
  };

  const calculateAccuracyAnalysis = (
    inventory: any[],
    countItems: any[]
  ): AccuracyAnalysisItem[] => {
    return inventory.map(item => {
      // Buscar último count para este item
      const itemCounts = countItems.filter(c => c.part_id === item.id);
      const lastCount = itemCounts.length > 0 ? itemCounts[0] : null;

      const systemQuantity = item.quantity || 0;
      const physicalQuantity = lastCount?.counted_quantity || systemQuantity;
      const variance = physicalQuantity - systemQuantity;
      const variancePercentage = systemQuantity > 0 ? (variance / systemQuantity) * 100 : 0;
      const varianceValue = variance * (item.unit_cost || 0);
      const accuracyScore = Math.max(0, 100 - Math.abs(variancePercentage));

      return {
        id: item.id,
        part_code: item.part_code || '',
        part_name: item.part_name || '',
        system_quantity: systemQuantity,
        physical_quantity: physicalQuantity,
        variance,
        variance_percentage: variancePercentage,
        variance_value: varianceValue,
        last_count_date: lastCount?.inventory_counts?.completed_at || null,
        accuracy_score: accuracyScore,
      };
    });
  };

  const calculatePerformanceMetrics = (
    abcData: ABCAnalysisItem[],
    turnoverData: TurnoverAnalysisItem[],
    accuracyData: AccuracyAnalysisItem[]
  ): PerformanceMetrics => {
    const totalItems = abcData.length;
    const totalValue = abcData.reduce((sum, item) => sum + item.total_value, 0);

    // Distribuição ABC
    const abcDistribution = [
      {
        class: 'A',
        count: abcData.filter(item => item.abc_class === 'A').length,
        value: abcData.filter(item => item.abc_class === 'A').reduce((sum, item) => sum + item.total_value, 0),
      },
      {
        class: 'B',
        count: abcData.filter(item => item.abc_class === 'B').length,
        value: abcData.filter(item => item.abc_class === 'B').reduce((sum, item) => sum + item.total_value, 0),
      },
      {
        class: 'C',
        count: abcData.filter(item => item.abc_class === 'C').length,
        value: abcData.filter(item => item.abc_class === 'C').reduce((sum, item) => sum + item.total_value, 0),
      },
    ];

    // Distribuição de Giro
    const turnoverDistribution = [
      {
        classification: 'Fast',
        count: turnoverData.filter(item => item.classification === 'Fast').length,
        value: turnoverData.filter(item => item.classification === 'Fast').reduce((sum, item) => sum + item.total_value, 0),
      },
      {
        classification: 'Medium',
        count: turnoverData.filter(item => item.classification === 'Medium').length,
        value: turnoverData.filter(item => item.classification === 'Medium').reduce((sum, item) => sum + item.total_value, 0),
      },
      {
        classification: 'Slow',
        count: turnoverData.filter(item => item.classification === 'Slow').length,
        value: turnoverData.filter(item => item.classification === 'Slow').reduce((sum, item) => sum + item.total_value, 0),
      },
      {
        classification: 'Dead',
        count: turnoverData.filter(item => item.classification === 'Dead').length,
        value: turnoverData.filter(item => item.classification === 'Dead').reduce((sum, item) => sum + item.total_value, 0),
      },
    ];

    const averageAccuracy = accuracyData.length > 0 
      ? accuracyData.reduce((sum, item) => sum + item.accuracy_score, 0) / accuracyData.length 
      : 0;

    const averageTurnover = turnoverData.length > 0
      ? turnoverData.reduce((sum, item) => sum + item.turnover_rate, 0) / turnoverData.length
      : 0;

    const deadStockValue = turnoverData
      .filter(item => item.classification === 'Dead')
      .reduce((sum, item) => sum + item.total_value, 0);

    const fastMovingItems = turnoverData.filter(item => item.classification === 'Fast').length;

    return {
      totalItems,
      totalValue,
      abcDistribution,
      turnoverDistribution,
      averageAccuracy,
      averageTurnover,
      deadStockValue,
      fastMovingItems,
    };
  };

  // Filtrar dados baseado na busca e filtros
  const filteredABCData = abcAnalysis.filter(item => {
    const matchesSearch = item.part_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.part_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || item.abc_class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const filteredTurnoverData = turnoverAnalysis.filter(item => {
    const matchesSearch = item.part_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.part_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || 
                        (selectedClass === 'Fast' && item.classification === 'Fast') ||
                        (selectedClass === 'Medium' && item.classification === 'Medium') ||
                        (selectedClass === 'Slow' && item.classification === 'Slow') ||
                        (selectedClass === 'Dead' && item.classification === 'Dead');
    return matchesSearch && matchesClass;
  });

  const filteredAccuracyData = accuracyAnalysis.filter(item => {
    return item.part_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.part_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getClassColor = (abcClass: string) => {
    switch (abcClass) {
      case 'A': return 'bg-red-100 text-red-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTurnoverColor = (classification: string) => {
    switch (classification) {
      case 'Fast': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'Slow': return 'bg-yellow-100 text-yellow-800';
      case 'Dead': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const translateTurnoverClassification = (classification: string) => {
    switch (classification) {
      case 'Fast': return 'Rápido';
      case 'Medium': return 'Médio';
      case 'Slow': return 'Lento';
      case 'Dead': return 'Morto';
      default: return classification;
    }
  };

  const getAccuracyColor = (score: number) => {
    if (score >= 95) return 'bg-green-100 text-green-800';
    if (score >= 85) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Relatórios de Performance</h2>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
          <h2 className="text-2xl font-bold">Relatórios de Performance</h2>
          <p className="text-muted-foreground">
            Análises avançadas de estoque e performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value: '30d' | '90d' | '180d' | '365d') => setPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="180d">Últimos 180 dias</SelectItem>
              <SelectItem value="365d">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchReportsData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{performanceMetrics.totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(performanceMetrics.totalValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acurácia Média</p>
                <p className="text-2xl font-bold">{formatPercentage(performanceMetrics.averageAccuracy)}</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Giro Médio</p>
                <p className="text-2xl font-bold">{performanceMetrics.averageTurnover.toFixed(1)}x</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por código ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="class-filter">Filtrar por Classe</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Classes</SelectItem>
                  <SelectItem value="A">Classe A</SelectItem>
                  <SelectItem value="B">Classe B</SelectItem>
                  <SelectItem value="C">Classe C</SelectItem>
                  <SelectItem value="Fast">Giro Rápido</SelectItem>
                  <SelectItem value="Medium">Giro Médio</SelectItem>
                  <SelectItem value="Slow">Giro Lento</SelectItem>
                  <SelectItem value="Dead">Estoque Morto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs dos Relatórios */}
      <Tabs defaultValue="abc" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="abc">Curva ABC</TabsTrigger>
          <TabsTrigger value="turnover">Giro de Estoque</TabsTrigger>
          <TabsTrigger value="accuracy">Acurácia</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
        </TabsList>

        {/* Aba Curva ABC */}
        <TabsContent value="abc" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Análise Curva ABC</h3>
            <Button 
              onClick={() => exportToCSV(filteredABCData, 'curva-abc')}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Qtd Estoque</TableHead>
                    <TableHead>Valor Unitário</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Consumo Anual</TableHead>
                    <TableHead>Valor Anual</TableHead>
                    <TableHead>% Valor</TableHead>
                    <TableHead>% Acumulado</TableHead>
                    <TableHead>Giro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredABCData.slice(0, 50).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.part_code}</TableCell>
                      <TableCell>{item.part_name}</TableCell>
                      <TableCell>
                        <Badge className={getClassColor(item.abc_class)}>
                          {item.abc_class}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                      <TableCell>{formatCurrency(item.total_value)}</TableCell>
                      <TableCell>{item.annual_consumption.toFixed(0)}</TableCell>
                      <TableCell>{formatCurrency(item.annual_value)}</TableCell>
                      <TableCell>{formatPercentage(item.percentage_value)}</TableCell>
                      <TableCell>{formatPercentage(item.cumulative_percentage)}</TableCell>
                      <TableCell>{item.turnover_rate.toFixed(1)}x</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Giro de Estoque */}
        <TabsContent value="turnover" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Análise de Giro de Estoque</h3>
            <Button 
              onClick={() => exportToCSV(filteredTurnoverData, 'giro-estoque')}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Estoque Médio</TableHead>
                    <TableHead>Consumo Anual</TableHead>
                    <TableHead>Taxa de Giro</TableHead>
                    <TableHead>Dias de Suprimento</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Última Movimentação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTurnoverData.slice(0, 50).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.part_code}</TableCell>
                      <TableCell>{item.part_name}</TableCell>
                      <TableCell>
                        <Badge className={getTurnoverColor(item.classification)}>
                          {translateTurnoverClassification(item.classification)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.avg_inventory.toFixed(0)}</TableCell>
                      <TableCell>{item.annual_consumption.toFixed(0)}</TableCell>
                      <TableCell>{item.turnover_rate.toFixed(1)}x</TableCell>
                      <TableCell>{item.days_of_supply.toFixed(0)} dias</TableCell>
                      <TableCell>{formatCurrency(item.total_value)}</TableCell>
                      <TableCell>
                        {item.last_movement 
                          ? format(new Date(item.last_movement), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Nunca'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Acurácia */}
        <TabsContent value="accuracy" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Análise de Acurácia</h3>
            <Button 
              onClick={() => exportToCSV(filteredAccuracyData, 'acuracia-estoque')}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Qtd Sistema</TableHead>
                    <TableHead>Qtd Física</TableHead>
                    <TableHead>Variação</TableHead>
                    <TableHead>% Variação</TableHead>
                    <TableHead>Valor Variação</TableHead>
                    <TableHead>Score Acurácia</TableHead>
                    <TableHead>Última Contagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccuracyData.slice(0, 50).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.part_code}</TableCell>
                      <TableCell>{item.part_name}</TableCell>
                      <TableCell>{item.system_quantity}</TableCell>
                      <TableCell>{item.physical_quantity}</TableCell>
                      <TableCell className={item.variance > 0 ? 'text-green-600' : item.variance < 0 ? 'text-red-600' : ''}>
                        {item.variance > 0 ? '+' : ''}{item.variance}
                      </TableCell>
                      <TableCell className={item.variance_percentage > 0 ? 'text-green-600' : item.variance_percentage < 0 ? 'text-red-600' : ''}>
                        {formatPercentage(item.variance_percentage)}
                      </TableCell>
                      <TableCell className={item.variance_value > 0 ? 'text-green-600' : item.variance_value < 0 ? 'text-red-600' : ''}>
                        {formatCurrency(item.variance_value)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getAccuracyColor(item.accuracy_score)}>
                          {formatPercentage(item.accuracy_score)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.last_count_date 
                          ? format(new Date(item.last_count_date), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Nunca'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Gráficos */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição ABC */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição ABC por Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceMetrics.abcDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ class: className, value }) => 
                        `${className}: ${formatCurrency(value)}`
                      }
                    >
                      {performanceMetrics.abcDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.class === 'A' ? '#ef4444' : entry.class === 'B' ? '#f59e0b' : '#22c55e'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição de Giro */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Giro</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceMetrics.turnoverDistribution.map(item => ({
                    ...item,
                    classification: translateTurnoverClassification(item.classification)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="classification" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Quantidade']} />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Dispersão ABC */}
            <Card>
              <CardHeader>
                <CardTitle>Análise ABC - Valor vs Giro</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={abcAnalysis.slice(0, 100)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="annual_value" 
                      type="number"
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <YAxis 
                      dataKey="turnover_rate" 
                      type="number"
                      tickFormatter={(value) => `${value}x`}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'annual_value' ? formatCurrency(Number(value)) : `${value}x`,
                        name === 'annual_value' ? 'Valor Anual' : 'Taxa de Giro'
                      ]}
                      labelFormatter={(label, payload) => 
                        payload?.[0]?.payload?.part_code || ''
                      }
                    />
                    <Scatter 
                      dataKey="turnover_rate" 
                      fill="#8884d8"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resumo de Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estoque Morto</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(performanceMetrics.deadStockValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Itens Giro Rápido</span>
                  <span className="font-semibold text-green-600">
                    {performanceMetrics.fastMovingItems} itens
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Classe A (Valor)</span>
                  <span className="font-semibold">
                    {formatCurrency(performanceMetrics.abcDistribution.find(d => d.class === 'A')?.value || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Classe A (Itens)</span>
                  <span className="font-semibold">
                    {performanceMetrics.abcDistribution.find(d => d.class === 'A')?.count || 0} itens
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
