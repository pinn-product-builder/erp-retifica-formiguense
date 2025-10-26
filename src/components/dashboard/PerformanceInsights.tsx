import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Activity,
  Calendar,
  Users,
  Clock,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  category: 'productivity' | 'quality' | 'financial' | 'time';
}

interface GoalProgress {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
}

export function PerformanceInsights() {
  const { currentOrganization } = useOrganization();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchPerformanceData();
      
      // WebSocket para atualizar metas em tempo real
      const channel = supabase
        .channel(`performance-goals-${currentOrganization.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kpi_targets',
            filter: `org_id=eq.${currentOrganization.id}`
          },
          (payload) => {
            console.log('Meta atualizada:', payload);
            // Recarregar apenas as metas
            fetchGoals().then(goalsData => setGoals(goalsData));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id, selectedPeriod]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      // Buscar métricas de performance
      const metricsData = await calculateMetrics();
      setMetrics(metricsData);

      // Buscar metas e progresso
      const goalsData = await fetchGoals();
      setGoals(goalsData);

    } catch (error) {
      console.error('Erro ao buscar dados de performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = async (): Promise<PerformanceMetric[]> => {
    if (!currentOrganization) return [];

    const now = new Date();
    const startDate = new Date();
    
    // Ajustar período
    if (selectedPeriod === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setMonth(now.getMonth() - 3);
    }

    // Buscar pedidos do período
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('org_id', currentOrganization.id)
      .gte('created_at', startDate.toISOString());

    // Buscar orçamentos do período
    const { data: budgets } = await supabase
      .from('detailed_budgets')
      .select('*')
      .eq('org_id', currentOrganization.id)
      .gte('created_at', startDate.toISOString());

    const totalOrders = orders?.length || 0;
    const completedOrders = orders?.filter(o => o.status === 'concluida').length || 0;
    const totalRevenue = budgets?.filter(b => b.status === 'approved').reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const avgOrderValue = totalRevenue / (completedOrders || 1);

    // Calcular taxa de conclusão
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Calcular tempo médio de conclusão (real)
    const ordersWithDelivery = orders?.filter(o => o.status === 'concluida' && o.actual_delivery && o.created_at) || [];
    const avgCompletionTime = ordersWithDelivery.length > 0
      ? ordersWithDelivery.reduce((sum, o) => {
          const start = new Date(o.created_at).getTime();
          const end = new Date(o.actual_delivery).getTime();
          const days = (end - start) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / ordersWithDelivery.length
      : 0;

    return [
      {
        id: '1',
        name: 'Taxa de Conclusão',
        value: completionRate,
        target: 85,
        unit: '%',
        trend: completionRate >= 85 ? 'up' : completionRate >= 70 ? 'stable' : 'down',
        trendValue: 0, // Seria calculado comparando com período anterior
        category: 'productivity'
      },
      {
        id: '2',
        name: 'Ticket Médio',
        value: avgOrderValue,
        target: 5000,
        unit: 'R$',
        trend: avgOrderValue >= 5000 ? 'up' : avgOrderValue >= 4000 ? 'stable' : 'down',
        trendValue: 0, // Seria calculado comparando com período anterior
        category: 'financial'
      },
      {
        id: '3',
        name: 'Tempo Médio de Conclusão',
        value: avgCompletionTime,
        target: 7,
        unit: 'dias',
        trend: avgCompletionTime <= 7 ? 'up' : avgCompletionTime <= 10 ? 'stable' : 'down',
        trendValue: 0, // Seria calculado comparando com período anterior
        category: 'time'
      },
      {
        id: '4',
        name: 'Pedidos Concluídos',
        value: completedOrders,
        target: 50,
        unit: 'pedidos',
        trend: completedOrders >= 50 ? 'up' : completedOrders >= 40 ? 'stable' : 'down',
        trendValue: 0, // Seria calculado comparando com período anterior
        category: 'productivity'
      }
    ];
  };

  const fetchGoals = async (): Promise<GoalProgress[]> => {
    if (!currentOrganization) return [];

    try {
      const { data: targets, error } = await supabase
        .from('kpi_targets')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('priority', { ascending: false })
        .order('target_period_end', { ascending: true })
        .limit(3);

      if (error) {
        console.error('Erro ao buscar metas:', error);
        return [];
      }

      if (!targets || targets.length === 0) {
        // Retornar metas placeholder com valores zerados para manter layout
        return [
          {
            id: 'placeholder-1',
            title: 'Nenhuma meta configurada',
            description: 'Crie metas para acompanhar o progresso',
            current: 0,
            target: 100,
            unit: '%',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'on_track' as const
          },
          {
            id: 'placeholder-2',
            title: 'Nenhuma meta configurada',
            description: 'Crie metas para acompanhar o progresso',
            current: 0,
            target: 100,
            unit: '%',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'on_track' as const
          },
          {
            id: 'placeholder-3',
            title: 'Nenhuma meta configurada',
            description: 'Crie metas para acompanhar o progresso',
            current: 0,
            target: 100,
            unit: '%',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'on_track' as const
          }
        ];
      }

      // Mapear targets para GoalProgress
      const mappedTargets = targets.map((target) => {
        const t = target as Record<string, unknown>;
        // Mapear unidades
        let unit = '';
        if (t.progress_unit === 'currency') unit = 'R$';
        else if (t.progress_unit === 'percentage') unit = '%';
        else unit = (t.progress_unit as string) || '';

        return {
          id: t.id as string,
          title: (t.description as string) || 'Meta sem título',
          description: (t.description as string) || '',
          current: (t.progress_current as number) || 0,
          target: (t.target_value as number) || 0,
          unit: unit,
          deadline: (t.target_period_end as string) || new Date().toISOString(),
          status: (t.status as string) || 'pending'
        };
      });

      // Preencher com placeholders se houver menos de 3 metas
      while (mappedTargets.length < 3) {
        mappedTargets.push({
          id: `placeholder-${mappedTargets.length + 1}`,
          title: 'Nenhuma meta configurada',
          description: 'Crie metas para acompanhar o progresso',
          current: 0,
          target: 100,
          unit: '%',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending' as const
        });
      }

      return mappedTargets as GoalProgress[];
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      return [];
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-success" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity':
        return <Activity className="w-5 h-5" />;
      case 'quality':
        return <Award className="w-5 h-5" />;
      case 'financial':
        return <DollarSign className="w-5 h-5" />;
      case 'time':
        return <Clock className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'on_track':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'at_risk':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'delayed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'on_track':
        return 'No Prazo';
      case 'at_risk':
        return 'Em Risco';
      case 'delayed':
        return 'Atrasada';
      default:
        return 'Pendente';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'R$') {
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(value);
    }
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    return `${value} ${unit}`;
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando insights...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Insights de Performance
            </CardTitle>
            <Tabs value={selectedPeriod} onValueChange={(v) => {
              if (v === 'week' || v === 'month' || v === 'quarter') {
                setSelectedPeriod(v);
              }
            }}>
              <TabsList>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mês</TabsTrigger>
                <TabsTrigger value="quarter">Trimestre</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Métricas de Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.id} className="bg-card border">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getCategoryIcon(metric.category)}
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(metric.trend)}
                        <span className={`text-xs font-medium ${
                          metric.trend === 'up' ? 'text-success' : 
                          metric.trend === 'down' ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{metric.name}</p>
                      <p className="text-2xl font-bold">
                        {formatValue(metric.value, metric.unit)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Meta: {formatValue(metric.target, metric.unit)}
                      </p>
                    </div>
                    <Progress 
                      value={calculateProgress(metric.value, metric.target)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Metas e Progresso */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Metas do Período
            </h3>
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = calculateProgress(goal.current, goal.target);
                const daysRemaining = Math.ceil(
                  (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <Card key={goal.id} className="bg-card border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{goal.title}</h4>
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          </div>
                          <Badge className={getStatusColor(goal.status)}>
                            {getStatusLabel(goal.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatValue(goal.current, goal.unit)} de {formatValue(goal.target, goal.unit)}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Prazo expirado'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <Progress value={progress} className="h-3" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span className="font-medium">{progress.toFixed(1)}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
