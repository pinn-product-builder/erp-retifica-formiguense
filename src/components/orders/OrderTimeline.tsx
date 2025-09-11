import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrderStatusHistory } from '@/hooks/useOrders';

interface OrderTimelineProps {
  statusHistory: OrderStatusHistory[];
}

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

export function OrderTimeline({ statusHistory }: OrderTimelineProps) {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-center">
            Nenhum histórico de status disponível.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Status
        </h3>
        
        <div className="space-y-4">
          {statusHistory.map((entry, index) => {
            const isFirst = index === 0;
            const statusColor = STATUS_COLORS[entry.new_status as keyof typeof STATUS_COLORS] || 'bg-gray-500';
            
            return (
              <div key={entry.id} className="flex items-start gap-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-3 h-3 rounded-full ${statusColor} ${isFirst ? 'ring-2 ring-background shadow-lg' : ''}`}
                  />
                  {index < statusHistory.length - 1 && (
                    <div className="w-0.5 h-8 bg-border mt-2" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">
                      {STATUS_LABELS[entry.new_status as keyof typeof STATUS_LABELS] || entry.new_status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {entry.old_status && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Alterado de: {STATUS_LABELS[entry.old_status as keyof typeof STATUS_LABELS] || entry.old_status}
                    </p>
                  )}
                  
                  {entry.notes && (
                    <div className="mt-2 flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground">{entry.notes}</p>
                    </div>
                  )}
                  
                  {entry.changed_by && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Alterado por usuário ID: {entry.changed_by}</span>
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