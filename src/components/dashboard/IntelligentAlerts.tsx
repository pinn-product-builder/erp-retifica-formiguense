import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  X,
  Eye,
  Clock,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
  id: string;
  org_id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  is_active: boolean;
  is_dismissible: boolean;
  auto_dismiss_after: number | null;
  target_users: string[];
  action_label: string | null;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

interface AlertHistoryItem {
  id: string;
  alert_id: string;
  org_id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  dismissed_by: string | null;
  dismissed_at: string | null;
  action_taken: string | null;
  action_taken_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface AlertCategory {
  severity: 'info' | 'warning' | 'error' | 'success';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

const ALERT_CATEGORIES: Record<string, AlertCategory> = {
  info: {
    severity: 'info',
    label: 'Informação',
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  warning: {
    severity: 'warning',
    label: 'Atenção',
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20'
  },
  error: {
    severity: 'error',
    label: 'Crítico',
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20'
  },
  success: {
    severity: 'success',
    label: 'Sucesso',
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20'
  }
};

export function IntelligentAlerts() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchAlerts();
      fetchAlertHistory();
      setupRealtimeSubscription();
    }
  }, [currentOrganization?.id]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('org_id', currentOrganization?.id)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const typedAlerts: Alert[] = data.map((alert: unknown) => ({
          ...alert,
          severity: alert.severity as 'info' | 'warning' | 'error' | 'success'
        }));
        setAlerts(typedAlerts);
      }
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar alertas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('alert_history')
        .select('*')
        .eq('org_id', currentOrganization?.id)
        .order('dismissed_at', { ascending: false })
        .limit(50); // Últimos 50 alertas

      if (error) throw error;
      setAlertHistory(data as AlertHistoryItem[]|| []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`alerts-${currentOrganization?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `org_id=eq.${currentOrganization?.id}`
        },
        (payload) => {
          console.log('Alert change detected:', payload);
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;

      setDismissedAlerts(prev => new Set([...prev, alertId]));
      
      toast({
        title: "Alerta dispensado",
        description: "O alerta foi removido com sucesso"
      });

      // Atualizar lista local
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Erro ao dispensar alerta:', error);
      toast({
        title: "Erro",
        description: "Erro ao dispensar alerta",
        variant: "destructive"
      });
    }
  };

  const filteredAlerts = selectedSeverity === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.severity === selectedSeverity);

  const alertCounts = {
    all: alerts.length,
    info: alerts.filter(a => a.severity === 'info').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    error: alerts.filter(a => a.severity === 'error').length,
    success: alerts.filter(a => a.severity === 'success').length
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffMs = now.getTime() - alertDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando alertas...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Alertas Inteligentes
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={showHistory ? "outline" : "secondary"}
              size="sm"
              onClick={() => setShowHistory(false)}
            >
              Ativos ({alertCounts.all})
            </Button>
            <Button
              variant={showHistory ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowHistory(true)}
            >
              Histórico ({alertHistory.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros por Severidade */}
        <Tabs value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="relative">
              Todos
              {alertCounts.all > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {alertCounts.all}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="error" className="relative">
              Críticos
              {alertCounts.error > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {alertCounts.error}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="warning" className="relative">
              Atenção
              {alertCounts.warning > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-xs bg-warning/10 text-warning">
                  {alertCounts.warning}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="info" className="relative">
              Info
              {alertCounts.info > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {alertCounts.info}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="success" className="relative">
              Sucesso
              {alertCounts.success > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-xs bg-success/10 text-success">
                  {alertCounts.success}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista de Alertas ou Histórico */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {showHistory ? (
              // Histórico de Alertas
              alertHistory.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum histórico</h3>
                  <p className="text-muted-foreground">
                    Não há alertas dispensados ainda
                  </p>
                </motion.div>
              ) : (
                alertHistory.map((historyItem, index) => {
                  const category = ALERT_CATEGORIES[historyItem.severity];
                  const Icon = category.icon;

                  return (
                    <motion.div
                      key={historyItem.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border rounded-lg p-4 ${category.borderColor} bg-muted/30 opacity-75`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-card flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${category.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{historyItem.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{historyItem.message}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {historyItem.dismissed_at && getTimeSince(historyItem.dismissed_at)}
                            </Badge>
                          </div>
                          {historyItem.action_taken && (
                            <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                              <strong>Ação tomada:</strong> {historyItem.action_taken}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )
            ) : (
              // Alertas Ativos
              filteredAlerts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum alerta</h3>
                  <p className="text-muted-foreground">
                    {selectedSeverity === 'all' 
                      ? 'Não há alertas ativos no momento'
                      : `Não há alertas de ${ALERT_CATEGORIES[selectedSeverity]?.label.toLowerCase()}`
                    }
                  </p>
                </motion.div>
              ) : (
              filteredAlerts.map((alert, index) => {
                const category = ALERT_CATEGORIES[alert.severity];
                const Icon = category.icon;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border rounded-lg p-4 ${category.borderColor} ${category.bgColor}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-card flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${category.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{alert.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {getTimeSince(alert.created_at)}
                            </Badge>
                            {alert.is_dismissible && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissAlert(alert.id)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {alert.action_url && alert.action_label && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => window.location.href = alert.action_url!}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {alert.action_label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
              )
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
