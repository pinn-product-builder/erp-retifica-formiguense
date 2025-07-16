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
  Activity
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da retífica</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="default">
            <Calendar className="w-4 h-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            variant={stat.variant}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Services */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Serviços Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentServices.map((service) => (
                <div 
                  key={service.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-foreground">{service.id}</span>
                      <Badge variant={getStatusBadge(service.status)}>
                        {service.status}
                      </Badge>
                      <Badge variant={getPriorityBadge(service.priority)}>
                        {service.priority}
                      </Badge>
                    </div>
                    <p className="font-medium text-foreground">{service.client}</p>
                    <p className="text-sm text-muted-foreground">{service.vehicle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{service.date}</p>
                    <Button variant="ghost" size="sm" className="mt-1">
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Wrench className="w-4 h-4 mr-2" />
              Iniciar Serviço
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Apontar Horas
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Package className="w-4 h-4 mr-2" />
              Consultar Peça
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Relatório Financeiro
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-warning/20 bg-warning/5 shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
            <div>
              <h4 className="font-medium text-foreground">Atenção Necessária</h4>
              <p className="text-sm text-muted-foreground">
                3 orçamentos vencem hoje e 2 peças estão em estoque baixo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}