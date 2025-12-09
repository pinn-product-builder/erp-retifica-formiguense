import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Camera, MessageSquare, AlertTriangle, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkflowModal } from './WorkflowModal';
import { EmployeeDirectoryEntry } from '@/hooks/useEmployeesDirectory';

interface OrderCardProps {
  order: Record<string, any>;
  workflows: Array<Record<string, any>>;
  statusConfig?: any;
  onUpdate?: () => void;
  employeeOptions: EmployeeDirectoryEntry[];
  employeesLoading: boolean;
}

export function OrderCard({ order, workflows, statusConfig, onUpdate, employeeOptions, employeesLoading }: OrderCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Record<string, any> | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const completedComponents = workflows.filter((w: any) => w.completed_at).length;
  const totalComponents = workflows.length;
  const progressPercent = totalComponents > 0 ? Math.round((completedComponents / totalComponents) * 100) : 0;

  const getLatestWorkflow = () => {
    if (workflows.length === 0) return null;
    return workflows.reduce((latest: any, current: any) => {
      const latestTime = latest.updated_at || latest.started_at || latest.created_at;
      const currentTime = current.updated_at || current.started_at || current.created_at;
      return new Date(currentTime) > new Date(latestTime) ? current : latest;
    });
  };

  const latestWorkflow = getLatestWorkflow();

  const handleCardClick = () => {
    if (latestWorkflow) {
      setSelectedWorkflow(latestWorkflow);
      setShowModal(true);
    }
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md transition-all duration-200 bg-card border hover:border-primary/20"
        onClick={handleCardClick}
      >
        <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-xs sm:text-sm truncate">
                OS #{order.order_number}
              </span>
            </div>
            {totalComponents > 0 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 flex-shrink-0">
                {completedComponents}/{totalComponents}
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <p className="font-medium text-xs sm:text-sm truncate" title={order.customers?.name}>
              {order.customers?.name || 'Cliente não informado'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {order.engines ? `${order.engines.brand || ''} ${order.engines.model || ''}`.trim() : 'Motor não informado'}
            </p>
          </div>

          {totalComponents > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {workflows.slice(0, 3).map((w: any) => (
                  <Badge 
                    key={w.id} 
                    variant={w.completed_at ? "default" : "secondary"}
                    className="text-xs px-1 py-0"
                  >
                    {w.component}
                  </Badge>
                ))}
                {workflows.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{workflows.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {order.collection_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{formatDate(order.collection_date)}</span>
            </div>
          )}

          <Button 
            size="sm" 
            variant="ghost" 
            className="h-5 sm:h-6 px-1 sm:px-2 text-xs w-full"
          >
            Ver detalhes
          </Button>
        </CardContent>
      </Card>

      {selectedWorkflow && (
        <WorkflowModal
          workflow={selectedWorkflow}
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedWorkflow(null);
          }}
          onUpdate={onUpdate}
          employeeOptions={employeeOptions}
          employeesLoading={employeesLoading}
        />
      )}
    </>
  );
}

