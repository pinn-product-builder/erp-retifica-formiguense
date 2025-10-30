// @ts-nocheck

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { ComponentCard } from './ComponentCard';
import { useWorkflowUpdate } from '@/hooks/useWorkflowUpdate';
import { useWorkflowStatusConfig } from '@/hooks/useWorkflowStatusConfig';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { Badge } from '@/components/ui/badge';

// Função para obter cor do componente
const getComponentColor = (componentId: string): string => {
  const colorMap: Record<string, string> = {
    'todos': 'bg-blue-500',
    'bloco': 'bg-green-500',
    'eixo': 'bg-orange-500',
    'biela': 'bg-yellow-500',
    'comando': 'bg-purple-500',
    'cabecote': 'bg-red-500',
    'virabrequim': 'bg-cyan-500',
    'pistao': 'bg-pink-500',
    'pistao_com_anel': 'bg-rose-500',
    'anel': 'bg-indigo-500',
    'camisas': 'bg-teal-500',
    'bucha_comando': 'bg-violet-500',
    'retentores_dianteiro': 'bg-blue-600',
    'retentores_traseiro': 'bg-blue-700',
    'pista_virabrequim': 'bg-sky-500',
    'selo_comando': 'bg-fuchsia-500',
    'gaxeta': 'bg-emerald-500',
    'selo_dagua': 'bg-amber-500',
    'borrachas_camisa': 'bg-lime-500',
    'calco_camisas': 'bg-green-600',
    'bujao_carter': 'bg-stone-500',
    'tubo_bloco': 'bg-gray-500'
  };
  return colorMap[componentId] || 'bg-gray-500';
};

// STATUS_ORDER será obtido dinamicamente das configurações

interface KanbanBoardProps {
  orders: Array<Record<string, unknown>>;
  onOrderUpdate: () => void;
}

export function KanbanBoard({ orders, onOrderUpdate }: KanbanBoardProps) {
  const { updateWorkflowStatus } = useWorkflowUpdate();
  const { workflowStatuses, getStatusColors, getNextAllowedStatuses, loading } = useWorkflowStatusConfig();
  const { isMobile, isTablet } = useBreakpoint();
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();
  const [selectedComponent, setSelectedComponent] = useState<string>('todos');
  
  // Construir lista de componentes incluindo "todos"
  const COMPONENTS = [
    { id: 'todos', name: 'Todos', color: 'bg-blue-500' },
    ...engineComponents.map(comp => ({
      id: comp.value,
      name: comp.label,
      color: getComponentColor(comp.value)
    }))
  ];

  // Obter ordem dos status das configurações
  const statusOrder = workflowStatuses
    .filter(status => status.is_active)
    .sort((a, b) => a.display_order - b.display_order)
    .map(status => status.status_key);

  const statusColors = getStatusColors();

  // Função para obter cor do componente
  const getComponentColorById = (component: string) => {
    const componentData = COMPONENTS.find(c => c.id === component);
    return componentData?.color || getComponentColor(component);
  };

  // Organizar workflows por status para o componente selecionado
  const organizeWorkflowsByStatus = () => {
    const workflowsByStatus: Record<string, Array<Record<string, unknown>>> = {};
    
    statusOrder.forEach(status => {
      workflowsByStatus[status] = [];
    });

    orders.forEach(order => {
      if (order.order_workflow) {
        if (selectedComponent === 'todos') {
          // Mostrar todos os componentes com suas respectivas cores
          order.order_workflow.forEach((workflow: unknown) => {
            const workflowItem = {
              ...workflow,
              order: order,
              orderNumber: order.order_number,
              customerName: order.customers?.name,
              engineModel: order.engines ? `${order.engines.brand || ''} ${order.engines.model || ''}`.trim() : 'Motor não informado',
              collectionDate: order.collection_date,
              componentColor: getComponentColorById(workflow.component) // Adicionar cor específica do componente
            };
            
            workflowsByStatus[workflow.status]?.push(workflowItem);
          });
        } else {
          // Mostrar apenas o componente selecionado
          const componentWorkflow = order.order_workflow.find(
            (wf: unknown) => wf.component === selectedComponent
          );
          
          if (componentWorkflow) {
            const workflowItem = {
              ...componentWorkflow,
              order: order,
              orderNumber: order.order_number,
              customerName: order.customers?.name,
              engineModel: order.engines ? `${order.engines.brand || ''} ${order.engines.model || ''}`.trim() : 'Motor não informado',
              collectionDate: order.collection_date,
              componentColor: getComponentColorById(componentWorkflow.component) // Adicionar cor específica do componente
            };
            
            workflowsByStatus[componentWorkflow.status]?.push(workflowItem);
          }
        }
      }
    });

    return workflowsByStatus;
  };

  const handleDragEnd = async (result: unknown) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const workflowId = draggableId;
    const currentStatus = source.droppableId;
    const newStatus = destination.droppableId;

    // Validar se a transição é permitida pelos pré-requisitos
    const allowedTransitions = getNextAllowedStatuses(currentStatus, selectedComponent);
    const isTransitionAllowed = allowedTransitions.some(
      transition => transition.to_status_key === newStatus
    );

    if (!isTransitionAllowed) {
      // Mostrar toast de erro sobre transição não permitida
      return;
    }

    const success = await updateWorkflowStatus(workflowId, newStatus);
    
    if (success) {
      onOrderUpdate();
    }
  };

  const workflowsByStatus = organizeWorkflowsByStatus();
  const selectedComponentData = COMPONENTS.find(c => c.id === selectedComponent);

  const getKanbanGridCols = () => {
    const columnCount = statusOrder.length;
    if (isMobile) {
      return 'flex overflow-x-auto space-x-4 pb-4';
    }
    if (isTablet) {
      // Em tablet, mostra até 3 colunas lado a lado, depois quebra linha
      return `grid grid-cols-${Math.min(columnCount, 3)} gap-3`;
    }
    // Desktop: sempre lado a lado com scroll horizontal se necessário
    return `flex gap-4 overflow-x-auto pb-2`;
  };

  const getComponentGridCols = () => {
    if (isMobile) return 'grid grid-cols-2 gap-2';
    if (isTablet) return 'grid grid-cols-3 gap-2';
    return 'flex flex-wrap gap-2';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 space-y-4 mb-6">
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
      </div>

      {/* Kanban Board - Scrollable */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">Carregando configurações...</div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className={`${getKanbanGridCols()} h-full`}>
              {statusOrder.map(status => (
                <div 
                  key={status} 
                  className={
                    isMobile 
                      ? 'min-w-[280px] flex-shrink-0' 
                      : isTablet 
                        ? 'h-full' 
                        : 'min-w-[300px] flex-shrink-0 h-full'
                  }
                >
                  <KanbanColumn
                    status={status}
                    workflows={workflowsByStatus[status] || []}
                    componentColor={selectedComponentData?.color || 'bg-gray-500'}
                    statusColors={statusColors}
                    onUpdate={onOrderUpdate}
                  />
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
