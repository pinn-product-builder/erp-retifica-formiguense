import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Wrench, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Package,
  Calendar,
  DollarSign,
  Activity,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Zap,
  Target
} from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Orçamentos Pendentes",
      value: 12,
      subtitle: "Aguardando aprovação",
      icon: Calendar,
      variant: "warning" as const,
      trend: { value: 8, isPositive: true }
    },
    {
      title: "Serviços em Andamento",
      value: 8,
      subtitle: "Em diferentes etapas",
      icon: Wrench,
      variant: "primary" as const
    },
    {
      title: "Funcionários Ativos",
      value: 15,
      subtitle: "Trabalhando hoje",
      icon: Users,
      variant: "success" as const
    },
    {
      title: "Produtividade Hoje",
      value: "87%",
      subtitle: "Meta: 85%",
      icon: TrendingUp,
      variant: "default" as const,
      trend: { value: 12, isPositive: true }
    }
  ];

  const recentServices = [
    {
      id: "RF-2024-001",
      client: "João Silva",
      vehicle: "VW Gol 1.0",
      status: "Diagnóstico",
      priority: "Alta",
      date: "2024-01-15"
    },
    {
      id: "RF-2024-002", 
      client: "Maria Santos",
      vehicle: "Fiat Uno 1.4",
      status: "Orçamento",
      priority: "Média",
      date: "2024-01-14"
    },
    {
      id: "RF-2024-003",
      client: "Pedro Costa",
      vehicle: "Chevrolet Prisma",
      status: "Execução",
      priority: "Baixa",
      date: "2024-01-13"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Diagnóstico": "secondary",
      "Orçamento": "outline", 
      "Execução": "default",
      "Finalizado": "secondary"
    };
    return variants[status] || "default";
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Alta": "destructive",
      "Média": "default",
      "Baixa": "secondary"
    };
    return variants[priority] || "default";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <Badge className="badge-success">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
              Online
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg">Visão geral da retífica em tempo real</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Última atualização: há 2 minutos</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>Sistema operacional</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="hover:bg-primary/10 border-primary/20">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" className="hover:bg-primary/10 border-primary/20">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button className="button-primary-enhanced">
            <Download className="w-4 h-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="animate-bounce-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              variant={stat.variant}
              trend={stat.trend}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Enhanced Recent Services */}
        <Card className="lg:col-span-2 card-enhanced border-l-4 border-l-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Wrench className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-lg font-bold">Serviços Recentes</span>
                  <p className="text-sm text-muted-foreground font-normal">Últimas atualizações</p>
                </div>
              </CardTitle>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentServices.map((service, index) => (
              <div 
                key={service.id}
                className="group p-4 rounded-xl border border-border/50 bg-gradient-to-r from-card via-card/95 to-card/90 hover:shadow-elevated transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Background accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-primary"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {service.id}
                      </span>
                      <Badge 
                        variant={getStatusBadge(service.status)}
                        className="badge-enhanced"
                      >
                        {service.status}
                      </Badge>
                      <Badge 
                        variant={getPriorityBadge(service.priority)}
                        className="badge-enhanced"
                      >
                        {service.priority}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{service.client}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {service.vehicle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">{service.date}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="hover:bg-primary/10 hover:text-primary transition-colors group-hover:shadow-md"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* View all button */}
            <Button variant="outline" className="w-full mt-4 hover:bg-primary/10 border-primary/20">
              <Activity className="w-4 h-4 mr-2" />
              Ver todos os serviços
            </Button>
          </CardContent>
        </Card>

        {/* Enhanced Quick Actions & Insights */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="card-enhanced">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-success rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold">Ações Rápidas</span>
                  <p className="text-sm text-muted-foreground font-normal">Acesso direto</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-primary hover:opacity-90 transition-opacity">
                <Calendar className="w-4 h-4 mr-3" />
                <span className="font-medium">Novo Orçamento</span>
              </Button>
              <Button variant="outline" className="w-full justify-start hover:bg-primary/10 border-primary/20">
                <Wrench className="w-4 h-4 mr-3" />
                <span className="font-medium">Iniciar Serviço</span>
              </Button>
              <Button variant="outline" className="w-full justify-start hover:bg-primary/10 border-primary/20">
                <Users className="w-4 h-4 mr-3" />
                <span className="font-medium">Apontar Horas</span>
              </Button>
              <Button variant="outline" className="w-full justify-start hover:bg-primary/10 border-primary/20">
                <Package className="w-4 h-4 mr-3" />
                <span className="font-medium">Consultar Peça</span>
              </Button>
              <Button variant="outline" className="w-full justify-start hover:bg-primary/10 border-primary/20">
                <DollarSign className="w-4 h-4 mr-3" />
                <span className="font-medium">Relatório Financeiro</span>
              </Button>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card className="card-enhanced bg-gradient-to-br from-info/5 via-card to-card border-info/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-info rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold">Insights</span>
                  <p className="text-sm text-muted-foreground font-normal">Performance hoje</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Produtividade</span>
                  <span className="text-sm font-bold text-success">+12%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-success rounded-full w-[87%] animate-pulse"></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Meta Mensal</span>
                  <span className="text-sm font-bold text-primary">73%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary rounded-full w-[73%]"></div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Meta: R$ 45.000 | Atual: R$ 32.850
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Alerts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-warning/30 bg-gradient-to-r from-warning/10 via-warning/5 to-transparent shadow-card hover:shadow-elevated transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gradient-warning rounded-lg shadow-warning/20">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground mb-1">Atenção Necessária</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  3 orçamentos vencem hoje e 2 peças estão em estoque baixo
                </p>
                <Button size="sm" variant="outline" className="hover:bg-warning/10 border-warning/30">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalhes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/30 bg-gradient-to-r from-success/10 via-success/5 to-transparent shadow-card hover:shadow-elevated transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gradient-success rounded-lg shadow-success/20">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground mb-1">Sistema Saudável</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Todos os sistemas operando normalmente. Produtividade acima da meta.
                </p>
                <div className="flex items-center gap-2 text-xs text-success">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="font-medium">Status operacional</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}