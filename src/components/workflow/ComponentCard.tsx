
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Camera, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkflowModal } from './WorkflowModal';

interface ComponentCardProps {
  workflow: unknown;
  componentColor: string;
  onUpdate?: () => void;
}

export function ComponentCard({ workflow, componentColor, onUpdate }: ComponentCardProps) {
  const [showModal, setShowModal] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getDaysInStatus = () => {
    // Para workflows concluídos, calcular tempo entre início e conclusão
    // Para workflows em andamento, calcular tempo desde o início até agora
    
    const startDate = workflow.started_at ? new Date(workflow.started_at) : 
                     workflow.created_at ? new Date(workflow.created_at) : null;
    
    if (!startDate) return '0m';
    
    const endDate = workflow.completed_at ? new Date(workflow.completed_at) : new Date();
    
    // Calcular diferença em milissegundos (endDate - startDate deve ser positivo)
    const diffMs = endDate.getTime() - startDate.getTime();
    
    // Se a diferença for negativa (dados inconsistentes), retornar 0
    if (diffMs < 0) {
      return '0m';
    }
    
    // Calcular diferença em horas
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffHours / 24);
    const hours = diffHours % 24;
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return `${Math.max(0, minutes)}m`;
    }
  };

  const getProgressColor = () => {
    const timeString = getDaysInStatus();
    if (typeof timeString === 'string') {
      if (timeString.includes('d')) {
        const days = parseInt(timeString.split('d')[0]);
        if (days <= 2) return 'text-green-600';
        if (days <= 5) return 'text-yellow-600';
        return 'text-red-600';
      } else if (timeString.includes('h')) {
        const hours = parseInt(timeString.split('h')[0]);
        if (hours <= 48) return 'text-green-600'; // 2 dias
        if (hours <= 120) return 'text-yellow-600'; // 5 dias
        return 'text-red-600';
      }
    }
    return 'text-green-600';
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md transition-all duration-200 bg-card border hover:border-primary/20"
        onClick={() => setShowModal(true)}
      >
        <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${componentColor} flex-shrink-0`} />
              <span className="font-semibold text-xs sm:text-sm truncate">
                {workflow.orderNumber}
              </span>
            </div>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 flex-shrink-0">
              OS #{workflow.order.id.slice(-4)}
            </Badge>
          </div>

          {/* Customer & Engine */}
          <div className="space-y-1">
            <p className="font-medium text-xs sm:text-sm truncate" title={workflow.customerName}>
              {workflow.customerName}
            </p>
            <p className="text-xs text-muted-foreground truncate" title={workflow.engineModel}>
              {workflow.engineModel}
            </p>
          </div>

          {/* Status Info */}
          <div className="flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1 text-muted-foreground min-w-0 flex-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{formatDate(workflow.collectionDate)}</span>
            </div>
            {workflow.started_at && (
              <div className={`flex items-center gap-1 ${getProgressColor()} flex-shrink-0`}>
                <Clock className="w-3 h-3" />
                <span>{getDaysInStatus()}</span>
              </div>
            )}
          </div>

          {/* Assigned To */}
          {workflow.assigned_to && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{workflow.assigned_to}</span>
            </div>
          )}

          {/* Action Indicators */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 min-w-0">
              {workflow.photos?.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-600 flex-shrink-0">
                  <Camera className="w-3 h-3" />
                  <span>{workflow.photos.length}</span>
                </div>
              )}
              {workflow.notes && (
                <div className="flex items-center gap-1 text-xs text-green-600 flex-shrink-0">
                  <MessageSquare className="w-3 h-3" />
                </div>
              )}
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-5 sm:h-6 px-1 sm:px-2 text-xs flex-shrink-0"
            >
              <span className="hidden sm:inline">Ver mais</span>
              <span className="sm:hidden">Ver</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <WorkflowModal
        workflow={workflow}
        open={showModal}
        onClose={() => setShowModal(false)}
        onUpdate={onUpdate}
      />
    </>
  );
}
