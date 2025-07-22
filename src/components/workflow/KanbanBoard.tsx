
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { ComponentCard } from './ComponentCard';
import { useWorkflowUpdate } from '@/hooks/useWorkflowUpdate';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Badge } from '@/components/ui/badge';

const COMPONENTS = [
  { id: 'bloco', name: 'Bloco', color: 'bg-green-500' },
  { id: 'eixo', name: 'Eixo', color: 'bg-orange-500' },
  { id: 'biela', name: 'Biela', color: 'bg-yellow-500' },
  { id: 'comando', name: 'Comando', color: 'bg-purple-500' },
  { id: 'cabecote', name: 'Cabeçote', color: 'bg-red-500' }
];

const STATUS_ORDER = [
  'entrada',
  'metrologia', 
  'usinagem',
  'montagem',
  'pronto',
  'garantia',
  'entregue'
];

interface KanbanBoardProps {
  orders: any[];
  onOrderUpdate: () => void;
}

export function KanbanBoard({ orders, onOrderUpdate }: KanbanBoardProps) {
  const { updateWorkflowStatus } = useWorkflowUpdate();
  const { isMobile, isTablet } = useBreakpoint();
  const [selectedComponent, setSelectedComponent] = useState<string>('bloco');

  // Organizar workflows por status para o componente selecionado
  const organizeWorkflowsByStatus = () => {
    const workflowsByStatus: Record<string, any[]> = {};
    
    STATUS_ORDER.forEach(status => {
      workflowsByStatus[status] = [];
    });

    orders.forEach(order => {
      if (order.order_workflow) {
        const componentWorkflow = order.order_workflow.find(
          (wf: any) => wf.component === selectedComponent
        );
        
        if (componentWorkflow) {
          const workflowItem = {
            ...componentWorkflow,
            order: order,
            orderNumber: order.order_number,
            customerName: order.customer?.name,
            engineModel: `${order.engine?.brand} ${order.engine?.model}`,
            collectionDate: order.collection_date
          };
          
          workflowsByStatus[componentWorkflow.status]?.push(workflowItem);
        }
      }
    });

    return workflowsByStatus;
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const workflowId = draggableId;
    const newStatus = destination.droppableId;

    const success = await updateWorkflowStatus(workflowId, newStatus);
    
    if (success) {
      onOrderUpdate();
    }
  };

  const workflowsByStatus = organizeWorkflowsByStatus();
  const selectedComponentData = COMPONENTS.find(c => c.id === selectedComponent);

  const getKanbanGridCols = () => {
    if (isMobile) return 'flex overflow-x-auto space-x-4 pb-4';
    if (isTablet) return 'grid grid-cols-4 gap-4';
    return 'grid grid-cols-7 gap-4';
  };

  const getComponentGridCols = () => {
    if (isMobile) return 'grid grid-cols-2 gap-2';
    if (isTablet) return 'grid grid-cols-3 gap-2';
    return 'flex flex-wrap gap-2';
  };

  return (
    <div className={`space-y-${isMobile ? '4' : '6'}`}>
      {/* Component Selector */}
      <div className={getComponentGridCols()}>
        {COMPONENTS.map(component => (
          <button
            key={component.id}
            onClick={() => setSelectedComponent(component.id)}
            className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2'} rounded-lg font-medium transition-colors ${
              selectedComponent === component.id
                ? `${component.color} text-white`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {component.name}
          </button>
        ))}
      </div>

      {/* Component Header */}
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full ${selectedComponentData?.color}`} />
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
          Workflow - {selectedComponentData?.name}
        </h2>
        <Badge variant="secondary" className={isMobile ? "text-xs" : ""}>
          {Object.values(workflowsByStatus).flat().length} itens
        </Badge>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={`${getKanbanGridCols()} ${isMobile ? 'min-h-[500px]' : 'min-h-[600px]'}`}>
          {STATUS_ORDER.map(status => (
            <div 
              key={status} 
              className={isMobile ? 'min-w-[280px] flex-shrink-0' : ''}
            >
              <KanbanColumn
                status={status}
                workflows={workflowsByStatus[status] || []}
                componentColor={selectedComponentData?.color || 'bg-gray-500'}
              />
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
