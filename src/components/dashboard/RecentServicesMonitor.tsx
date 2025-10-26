import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  User, 
  Car, 
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Pause,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useDashboard } from '@/hooks/useDashboard';
import { Link } from 'react-router-dom';

interface RecentService {
  id: string;
  client: string;
  vehicle: string;
  status: string;
  priority: string;
  date: string;
}

export function RecentServicesMonitor() {
  const { isMobile, isTablet } = useBreakpoint();
  const { recentServices, getStatusBadge, getStatusLabel } = useDashboard();

  // Mapear ícones de status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Clock className="w-3 h-3" />;
      case 'em_andamento':
        return <Pause className="w-3 h-3" />;
      case 'concluida':
        return <CheckCircle className="w-3 h-3" />;
      case 'cancelada':
        return <XCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  // Mapear cores de prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      case 'baixa':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  if (recentServices.length === 0) {
    return (
      <Card className="card-enhanced">
        <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-primary-foreground`} />
            </div>
            <div>
              <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>Serviços Recentes</span>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground font-normal`}>
                Últimos 5 serviços
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Nenhum serviço encontrado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced">
      <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-primary-foreground`} />
            </div>
            <div>
              <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>Serviços Recentes</span>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground font-normal`}>
                Últimos 5 serviços
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/workflow">
              <span className="hidden sm:inline">Ver todos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start h-auto p-3 hover:bg-primary/5"
              >
                <Link to={`/workflow/${service.id}`}>
                  <div className="flex items-center gap-3 w-full">
                    {/* Ícone de status */}
                    <div className="flex-shrink-0">
                      {getStatusIcon(service.status)}
                    </div>
                    
                    {/* Informações do serviço */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {service.client}
                        </span>
                        <Badge 
                          variant={getStatusBadge('order', service.status) as 'default' | 'destructive' | 'outline' | 'secondary'}
                          className="text-xs"
                        >
                          {getStatusLabel('order', service.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Car className="w-3 h-3" />
                        <span className="truncate">{service.vehicle}</span>
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(service.date)}</span>
                      </div>
                    </div>
                    
                    {/* Prioridade */}
                    <div className="flex-shrink-0">
                      <Badge 
                        variant={getPriorityColor(service.priority) as 'default' | 'destructive' | 'outline' | 'secondary'}
                        className="text-xs"
                      >
                        {service.priority}
                      </Badge>
                    </div>
                  </div>
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
