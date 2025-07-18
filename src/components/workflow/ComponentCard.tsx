
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Camera, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkflowModal } from './WorkflowModal';

interface ComponentCardProps {
  workflow: any;
  componentColor: string;
}

export function ComponentCard({ workflow, componentColor }: ComponentCardProps) {
  const [showModal, setShowModal] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getDaysInStatus = () => {
    if (!workflow.started_at) return 0;
    const startDate = new Date(workflow.started_at);
    const now = new Date();
    return Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getProgressColor = () => {
    const days = getDaysInStatus();
    if (days <= 2) return 'text-green-600';
    if (days <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow bg-white"
        onClick={() => setShowModal(true)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${componentColor}`} />
              <span className="font-semibold text-sm">
                {workflow.orderNumber}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              OS #{workflow.order.id.slice(-4)}
            </Badge>
          </div>

          {/* Customer & Engine */}
          <div className="space-y-1">
            <p className="font-medium text-sm truncate">
              {workflow.customerName}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {workflow.engineModel}
            </p>
          </div>

          {/* Status Info */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="w-3 h-3" />
              {formatDate(workflow.collectionDate)}
            </div>
            {workflow.started_at && (
              <div className={`flex items-center gap-1 ${getProgressColor()}`}>
                <Clock className="w-3 h-3" />
                {getDaysInStatus()}d
              </div>
            )}
          </div>

          {/* Assigned To */}
          {workflow.assigned_to && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <User className="w-3 h-3" />
              {workflow.assigned_to}
            </div>
          )}

          {/* Action Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {workflow.photos?.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Camera className="w-3 h-3" />
                  {workflow.photos.length}
                </div>
              )}
              {workflow.notes && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <MessageSquare className="w-3 h-3" />
                </div>
              )}
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2 text-xs"
            >
              Ver mais
            </Button>
          </div>
        </CardContent>
      </Card>

      <WorkflowModal
        workflow={workflow}
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
