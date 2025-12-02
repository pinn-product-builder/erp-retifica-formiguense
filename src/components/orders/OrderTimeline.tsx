import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, FileText, Package, Shield, FileCheck, GitBranch, Activity, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderTimeline } from '@/hooks/useOrderTimeline';

interface OrderTimelineProps {
  orderId: string;
  enabled?: boolean;
}

const ICON_MAP = {
  status: Activity,
  workflow: GitBranch,
  diagnostic: FileCheck,
  budget: CheckCircle,
  package: Package,
  file: FileText,
  shield: Shield,
};

const STATUS_COLORS = {
  'coletado': 'bg-blue-500',
  'em_analise': 'bg-yellow-500',
  'orcamento_aprovado': 'bg-orange-500',
  'em_producao': 'bg-purple-500',
  'concluido': 'bg-green-500',
  'entregue': 'bg-gray-500',
  'cancelado': 'bg-red-500'
};

const STATUS_LABELS = {
  'coletado': 'Coletado',
  'em_analise': 'Em Análise',
  'orcamento_aprovado': 'Orçamento Aprovado',
  'em_producao': 'Em Produção',
  'concluido': 'Concluído',
  'entregue': 'Entregue',
  'cancelado': 'Cancelado'
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  'order_status': 'Status da Ordem',
  'workflow_status': 'Status do Workflow',
  'diagnostic': 'Diagnóstico',
  'budget': 'Orçamento',
  'reservation': 'Reserva de Peça',
  'material': 'Material',
  'report': 'Relatório Técnico',
  'warranty': 'Garantia'
};

export function OrderTimeline({ orderId, enabled = true }: OrderTimelineProps) {
  const { events, loading } = useOrderTimeline(orderId, enabled);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum evento registrado</h3>
          <p className="text-muted-foreground text-center">
            O histórico de eventos desta ordem aparecerá aqui conforme o progresso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Linha do Tempo - {events.length} Eventos
        </h3>
        
        <div className="space-y-6">
          {events.map((event, index) => {
            const isFirst = index === 0;
            const EventIcon = ICON_MAP[event.icon_type] || Activity;
            
            return (
              <div key={event.id} className="flex items-start gap-4">
                {/* Timeline line and icon */}
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full ${event.color} flex items-center justify-center ${
                      isFirst ? 'ring-4 ring-background shadow-lg' : ''
                    }`}
                  >
                    <EventIcon className="h-5 w-5 text-white" />
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-0.5 h-full min-h-[40px] bg-border mt-2" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pb-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {format(new Date(event.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                    </Badge>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-foreground mt-2">{event.description}</p>
                  )}
                  
                  {event.details && Object.keys(event.details).length > 0 && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Detalhes:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(event.details).map(([key, value]) => {
                          const fieldLabels: Record<string, string> = {
                            'old_status': 'Status Anterior',
                            'new_status': 'Novo Status',
                            'component': 'Componente',
                            'budget_number': 'Número do Orçamento',
                            'status': 'Status',
                            'total_amount': 'Valor Total',
                            'approval_type': 'Tipo de Aprovação',
                            'approved_amount': 'Valor Aprovado',
                            'part_code': 'Código da Peça',
                            'quantity': 'Quantidade',
                            'report_type': 'Tipo de Relatório',
                            'conformity_status': 'Status de Conformidade',
                            'warranty_type': 'Tipo de Garantia',
                            'start_date': 'Data de Início',
                            'end_date': 'Data de Término'
                          };
                          const label = fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          return (
                            <div key={key} className="text-xs">
                              <span className="font-medium">{label}:</span>{' '}
                              <span className="text-muted-foreground">{String(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {event.user_name && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Usuário: {event.user_name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}