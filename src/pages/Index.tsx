import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Wrench, DollarSign, BarChart3, Calendar } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            ERP Retíficas
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Sistema completo de gestão para retíficas de motores
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Acessar Sistema</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth">Fazer Login</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestão de Clientes
              </CardTitle>
              <CardDescription>
                Controle completo de clientes, oficinas e dados de contato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cadastro e gerenciamento de clientes com histórico completo de serviços
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Workflow Kanban
              </CardTitle>
              <CardDescription>
                Acompanhe o progresso de cada motor em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Controle visual do status de cada componente do motor
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Gestão Financeira
              </CardTitle>
              <CardDescription>
                Contas a pagar, receber e fluxo de caixa completo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Controle financeiro integrado com relatórios detalhados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Relatórios Avançados
              </CardTitle>
              <CardDescription>
                DRE, análises de performance e indicadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Dashboards interativos com métricas importantes do negócio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Orçamentos
              </CardTitle>
              <CardDescription>
                Geração e aprovação de orçamentos automatizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sistema completo de orçamentação com aprovação eletrônica
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Check-in Técnico
              </CardTitle>
              <CardDescription>
                Documentação fotográfica e técnica completa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Registro detalhado do estado de cada motor recebido
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}