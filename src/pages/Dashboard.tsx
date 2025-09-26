
import React from 'react';
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickActions } from "@/components/QuickActions";
import { EnhancedInsights } from "@/components/EnhancedInsights";
import { useSEO } from "@/hooks/useSEO";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useDashboard } from "@/hooks/useDashboard";
import { motion } from "framer-motion";
import { 
  Users, 
  Wrench, 
  Calendar,
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Activity
} from "lucide-react";

export default function Dashboard() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const { 
    kpis, 
    alerts, 
    recentServices, 
    loading, 
    error, 
    getStatusBadge: getConfiguredStatusBadge, 
    getStatusLabel,
    dismissAlert,
    refetch 
  } = useDashboard();

  // SEO optimization
  useSEO({
    title: 'Dashboard - Retífica Formiguense',
    description: 'Painel principal do sistema de gestão da Retífica Formiguense. Acompanhe orçamentos, serviços, funcionários e métricas em tempo real.',
    keywords: 'dashboard, painel, retífica, gestão, métricas, orçamentos, serviços'
  });

  // Convert KPIs to stats format
  const stats = kpis.map(kpi => ({
    title: kpi.name,
    value: kpi.value || 0,
    subtitle: kpi.subtitle || kpi.description,
    icon: getIconComponent(kpi.icon),
    variant: getVariantFromColor(kpi.color),
    trend: kpi.trend
  }));

  // Helper function to get icon component from string
  function getIconComponent(iconName: string) {
    const iconMap: Record<string, any> = {
      Calendar, Wrench, Users, TrendingUp, AlertTriangle, CheckCircle,
      Package: Calendar, Clock: Wrench, AlertCircle: AlertTriangle
    };
    return iconMap[iconName] || TrendingUp;
  }

  // Helper function to convert color to variant
  function getVariantFromColor(color: string) {
    const colorMap: Record<string, "default" | "warning" | "primary" | "success"> = {
      blue: "primary",
      orange: "warning", 
      green: "success",
      yellow: "warning",
      red: "warning",
      primary: "primary"
    };
    return colorMap[color] || "default";
  }

  const getStatusBadge = (status: string) => {
    const configuredVariant = getConfiguredStatusBadge('order', status);
    if (configuredVariant) {
      return configuredVariant as "default" | "secondary" | "destructive" | "outline";
    }
    
    // Use default variant if no configuration found
    return "default";
  };

  const getPriorityBadge = (priority: string) => {
    const configuredVariant = getConfiguredStatusBadge('priority', priority);
    if (configuredVariant) {
      return configuredVariant as "default" | "secondary" | "destructive" | "outline";
    }
    
    // Use default variant if no configuration found
    return "default";
  };

  const getStatsGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-4';
  };

  const getMainGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    return 'lg:grid-cols-3';
  };

  return (
    <motion.div 
      className={`space-y-${isMobile ? '4' : '6'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Enhanced Header */}
      <motion.div 
        className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-foreground tracking-tight`}>
              Dashboard
            </h1>
            <Badge className="badge-success">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
              Online
            </Badge>
          </div>
          <p className={`text-muted-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
            Visão geral da retífica em tempo real
          </p>
          {!isMobile && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Última atualização: há 2 minutos</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span>Sistema operacional</span>
              </div>
            </div>
          )}
        </div>
        <motion.div 
          className={`flex ${isMobile ? 'flex-col space-y-2' : 'gap-3'}`}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button variant="outline" className="hover:bg-primary/10 border-primary/20" size={isMobile ? "sm" : "default"}>
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button 
            variant="outline" 
            className="hover:bg-primary/10 border-primary/20" 
            size={isMobile ? "sm" : "default"}
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button className="button-primary-enhanced" size={isMobile ? "sm" : "default"}>
            <Download className="w-4 h-4 mr-2" />
            Relatório
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className={`grid gap-${isMobile ? '4' : '6'} ${getStatsGridCols()}`}>
        {loading ? (
          // Loading skeleton for stats
          Array.from({ length: 4 }).map((_, index) => (
            <motion.div 
              key={index}
              className="h-32 bg-card rounded-lg border border-border/50 animate-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            />
          ))
        ) : (
          stats.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: 0.1 + index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ 
              y: -5,
              transition: { duration: 0.2 }
            }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              variant={stat.variant}
              trend={stat.trend}
            />
          </motion.div>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className={`grid gap-${isMobile ? '4' : '6'} ${getMainGridCols()}`}>
        {/* Serviços Recentes - 2/3 em desktop, full em mobile */}
        <motion.div
          className={`${isDesktop ? 'lg:col-span-2' : ''}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-enhanced border-l-4 border-l-primary">
            <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Wrench className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-primary-foreground`} />
                  </div>
                  <div>
                    <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>
                      Serviços Recentes
                    </span>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground font-normal`}>
                      Últimas atualizações
                    </p>
                  </div>
                </CardTitle>
                {!isMobile && (
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className={`space-y-${isMobile ? '3' : '4'}`}>
              {loading ? (
                // Loading skeleton for services
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                ))
              ) : recentServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum serviço recente encontrado</p>
                </div>
              ) : (
                recentServices.map((service, index) => (
                <motion.div 
                  key={service.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`group p-${isMobile ? '3' : '4'} rounded-xl border border-border/50 bg-gradient-to-r from-card via-card/95 to-card/90 hover:shadow-elevated transition-all duration-300 hover:scale-[1.02] relative overflow-hidden`}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-primary"></div>
                  
                  <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
                    <div className="flex-1 space-y-2">
                      <div className={`flex ${isMobile ? 'flex-col space-y-1' : 'items-center gap-3'}`}>
                        <span className={`font-bold text-foreground group-hover:text-primary transition-colors ${isMobile ? 'text-sm' : ''}`}>
                          {service.id}
                        </span>
                        <div className="flex gap-2">
                          <Badge 
                            variant={getStatusBadge(service.status)}
                            className={`badge-enhanced ${isMobile ? 'text-xs' : ''}`}
                          >
                            {service.status}
                          </Badge>
                          <Badge 
                            variant={getPriorityBadge(service.priority)}
                            className={`badge-enhanced ${isMobile ? 'text-xs' : ''}`}
                          >
                            {service.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className={`font-semibold text-foreground ${isMobile ? 'text-sm' : ''}`}>
                          {service.client}
                        </p>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground flex items-center gap-2`}>
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          {service.vehicle}
                        </p>
                      </div>
                    </div>
                    <div className={`${isMobile ? 'flex justify-between items-center' : 'text-right space-y-2'}`}>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground font-medium`}>
                        {service.date}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-primary/10 hover:text-primary transition-colors group-hover:shadow-md"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {isMobile ? '' : 'Detalhes'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
                ))
              )}
              
              <Button variant="outline" className="w-full mt-4 hover:bg-primary/10 border-primary/20" size={isMobile ? "sm" : "default"}>
                <Activity className="w-4 h-4 mr-2" />
                Ver todos os serviços
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar - 1/3 em desktop, full em mobile */}
        <motion.div 
          className={`space-y-${isMobile ? '4' : '6'}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <QuickActions />
          <EnhancedInsights />
        </motion.div>
      </div>

      {/* Dynamic Alerts Section */}
      {alerts.length > 0 && (
        <motion.div 
          className={`grid gap-${isMobile ? '4' : '6'} ${isMobile ? 'grid-cols-1' : alerts.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {alerts.map((alert, index) => (
            <Card 
              key={alert.id}
              className={`border-${alert.severity}/30 bg-gradient-to-r from-${alert.severity}/10 via-${alert.severity}/5 to-transparent shadow-card hover:shadow-elevated transition-all duration-300`}
            >
              <CardContent className={`p-${isMobile ? '4' : '5'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 bg-gradient-${alert.severity} rounded-lg shadow-${alert.severity}/20`}>
                    {alert.severity === 'warning' && <AlertTriangle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />}
                    {alert.severity === 'success' && <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />}
                    {alert.severity === 'error' && <AlertTriangle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />}
                    {alert.severity === 'info' && <Activity className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-foreground mb-1 ${isMobile ? 'text-sm' : ''}`}>
                      {alert.title}
                    </h4>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mb-3`}>
                      {alert.message}
                    </p>
                    <div className="flex gap-2">
                      {alert.action_url && (
                        <Button size="sm" variant="outline" className={`hover:bg-${alert.severity}/10 border-${alert.severity}/30`}>
                          <Eye className="w-4 h-4 mr-2" />
                          {alert.action_label || 'Ver'}
                        </Button>
                      )}
                      {alert.is_dismissible && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => dismissAlert(alert.id)}
                          className="hover:bg-destructive/10"
                        >
                          Dispensar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
