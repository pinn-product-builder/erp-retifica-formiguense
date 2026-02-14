import React, { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Autocomplete, Chip, TextField, Stack, InputAdornment } from '@mui/material';
import { KanbanColumn } from './KanbanColumn';
import { useWorkflowUpdate } from '@/hooks/useWorkflowUpdate';
import { useWorkflowStatusConfig, WorkflowStatusConfig } from '@/hooks/useWorkflowStatusConfig';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { Badge } from '@/components/ui/badge';
import { useMuiTheme } from '@/config/muiTheme';
import { useEmployeesDirectory } from '@/hooks/useEmployeesDirectory';
import { useToast } from '@/hooks/use-toast';
import { Search, X } from 'lucide-react';
import { getComponentColor, getComponentColorHex } from '@/utils/componentColors';

// Tipos para ajudar na organização dos dados
interface OrderWorkflow {
  id: string;
  status: string;
  component: string;
  order_id: string;
  assigned_to?: string;
  assignedEmployeeName?: string;
  notes?: string;
  photos?: any[];
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface Order {
  id: string;
  order_number: string;
  collection_date?: string;
  customers?: {
    name: string;
  };
  engines?: {
    brand: string;
    model: string;
  };
  order_workflow: OrderWorkflow[];
  [key: string]: any;
}

interface OrderCardData {
  type: 'order';
  order: Order;
  orderId: string;
  workflows: OrderWorkflow[];
  orderNumber: string;
  customerName?: string;
  engineModel: string;
  collectionDate?: string;
  statusConfig?: WorkflowStatusConfig;
  allowComponentSplit: boolean;
}

interface KanbanBoardProps {
  orders: Order[];
  onOrderUpdate: () => void;
}

export function KanbanBoard({ orders, onOrderUpdate }: KanbanBoardProps) {
  const { updateWorkflowStatus, checkAndAdvanceOrderWorkflows } = useWorkflowUpdate();
  const { workflowStatuses, getStatusColors, getNextAllowedStatuses, prerequisites, loading } = useWorkflowStatusConfig();
  const { isMobile, isTablet } = useBreakpoint();
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();
  const { employees: employeeDirectory, loading: employeesLoading } = useEmployeesDirectory();
  const { toast } = useToast();
  const theme = useMuiTheme();
  
  const KANBAN_CACHE_KEY = 'kanban-order-search-filter';
  
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    const cachedSearch = localStorage.getItem(KANBAN_CACHE_KEY);
    if (cachedSearch) {
      setOrderSearch(cachedSearch);
    }
  }, []);

  useEffect(() => {
    if (orderSearch) {
      localStorage.setItem(KANBAN_CACHE_KEY, orderSearch);
    } else {
      localStorage.removeItem(KANBAN_CACHE_KEY);
    }
  }, [orderSearch]);
  
  // Construir lista de componentes
  const COMPONENTS = useMemo(() => {
    return engineComponents.map(comp => ({
      id: comp.value,
      name: comp.label,
      color: getComponentColor(comp.value)
    }));
  }, [engineComponents]);

  // Opções para o Autocomplete (formato que Material UI espera)
  const componentOptions = useMemo(() => {
    return COMPONENTS.map(comp => ({
      value: comp.id,
      label: comp.name,
      color: getComponentColorHex(comp.color)
    }));
  }, [COMPONENTS]);

  const orderOptions = useMemo(() => {
    const uniqueOrders = new Set<string>();
    orders.forEach(order => {
      if (order.order_number) {
        uniqueOrders.add(String(order.order_number));
      }
    });
    return Array.from(uniqueOrders);
  }, [orders]);

  const statusConfigMap = useMemo(() => {
    return workflowStatuses.reduce((acc, status) => {
      acc[status.status_key] = status;
      return acc;
    }, {} as Record<string, WorkflowStatusConfig>);
  }, [workflowStatuses]);

  const statusOrder = useMemo(() => {
    const activeStatuses = workflowStatuses
      .filter(status => status.is_active)
      .sort((a, b) => a.display_order - b.display_order);

    const entryStatus = activeStatuses.find(status => status.status_key === 'entrada');
    const deliveredStatus = activeStatuses.find(status => status.status_key === 'entregue');
    const middleStatuses = activeStatuses
      .filter(status => status.status_key !== 'entrada' && status.status_key !== 'entregue')
      .map(status => status.status_key);

    const orderedKeys: string[] = [];
    if (entryStatus) {
      orderedKeys.push(entryStatus.status_key);
    } else {
      orderedKeys.push('entrada');
    }

    middleStatuses.forEach(statusKey => {
      if (!orderedKeys.includes(statusKey)) {
        orderedKeys.push(statusKey);
      }
    });

    if (deliveredStatus) {
      orderedKeys.push(deliveredStatus.status_key);
    } else {
      orderedKeys.push('entregue');
    }

    return orderedKeys;
  }, [workflowStatuses]);

  const statusColors = getStatusColors();

  const employeeMap = useMemo(() => {
    return employeeDirectory.reduce<Record<string, string>>((acc, employee) => {
      acc[employee.id] = employee.full_name;
      return acc;
    }, {});
  }, [employeeDirectory]);

  // Função para obter cor do componente
  const getComponentColorById = (component: string) => {
    const componentData = COMPONENTS.find(c => c.id === component);
    return componentData?.color || getComponentColor(component);
  };

  // Organizar workflows por status - SEMPRE agrupar por OS
  const organizeWorkflowsByStatus = () => {
    const workflowsByStatus: Record<string, OrderCardData[]> = {};
    const normalizedOrderSearch = orderSearch.trim().toLowerCase();
    
    statusOrder.forEach(status => {
      workflowsByStatus[status] = [];
    });

    orders.forEach(order => {
      const matchesOrderFilter = !normalizedOrderSearch
        || String(order.order_number || '').toLowerCase().includes(normalizedOrderSearch);

      if (!matchesOrderFilter || !order.order_workflow || order.order_workflow.length === 0) {
        return;
      }

      // Agrupar workflows por status para esta OS
      const workflowsByStatusForOrder: Record<string, OrderWorkflow[]> = {};
      
      order.order_workflow.forEach((workflow) => {
        const status = workflow.status;
        if (!status) return;
        
        if (!workflowsByStatusForOrder[status]) {
          workflowsByStatusForOrder[status] = [];
        }
        
        const workflowItem: OrderWorkflow = {
          ...workflow,
          order: order,
          orderNumber: order.order_number,
          customerName: order.customers?.name,
          engineModel: order.engines ? `${order.engines.brand || ''} ${order.engines.model || ''}`.trim() : 'Motor não informado',
          collectionDate: order.collection_date,
          componentColor: getComponentColorById(workflow.component),
          statusConfig: statusConfigMap[workflow.status],
          assignedEmployeeName: workflow.assignedEmployeeName || employeeMap[workflow.assigned_to || ''] || workflow.assigned_to || null
        };
        
        workflowsByStatusForOrder[status].push(workflowItem);
      });

      // Para cada status que esta OS tem workflows, criar um card de OS
      Object.keys(workflowsByStatusForOrder).forEach(status => {
        if (!workflowsByStatus[status]) {
          workflowsByStatus[status] = [];
        }

        const statusConfig = statusConfigMap[status];
        const workflowsForStatus = workflowsByStatusForOrder[status];

        // Filtrar por allowed_components se configurado no status
        let allowedComponentsForStatus = workflowsForStatus;
        if (statusConfig?.allowed_components && Array.isArray(statusConfig.allowed_components)) {
          // Se allowed_components está definido e não é vazio, filtrar
          if (statusConfig.allowed_components.length > 0) {
            allowedComponentsForStatus = workflowsForStatus.filter((w) => 
              statusConfig.allowed_components!.includes(w.component)
            );
          }
        }
        // Se allowed_components é null ou undefined, permitir todos

        // Aplicar filtro de componentes do usuário se houver
        const filteredWorkflows = selectedComponents.length > 0
          ? allowedComponentsForStatus.filter((w) => selectedComponents.includes(w.component))
          : allowedComponentsForStatus;

        // Se após filtrar não sobrou nenhum workflow, não adicionar o card
        if (filteredWorkflows.length === 0) {
          return;
        }

        // Se o status permite desmembramento, criar um card por componente
        if (statusConfig?.allow_component_split === true) {
          filteredWorkflows.forEach((workflow) => {
            const orderCardData: OrderCardData = {
              type: 'order',
              order: order,
              orderId: order.id,
              workflows: [workflow], // Apenas este componente
              orderNumber: order.order_number,
              customerName: order.customers?.name,
              engineModel: order.engines ? `${order.engines.brand || ''} ${order.engines.model || ''}`.trim() : 'Motor não informado',
              collectionDate: order.collection_date,
              statusConfig: statusConfig,
              allowComponentSplit: true
            };
            
            workflowsByStatus[status].push(orderCardData);
          });
        } else {
          // Caso contrário, criar um único card com todos os workflows
          const orderCardData: OrderCardData = {
            type: 'order',
            order: order,
            orderId: order.id,
            workflows: filteredWorkflows,
            orderNumber: order.order_number,
            customerName: order.customers?.name,
            engineModel: order.engines ? `${order.engines.brand || ''} ${order.engines.model || ''}`.trim() : 'Motor não informado',
            collectionDate: order.collection_date,
            statusConfig: statusConfig,
            allowComponentSplit: false
          };
          
          workflowsByStatus[status].push(orderCardData);
        }
      });
    });

    // Ordenar por timestamp
    Object.keys(workflowsByStatus).forEach(statusKey => {
      workflowsByStatus[statusKey].sort((a, b) => {
        const getTimestamp = (item: OrderCardData) => {
          const workflows = item.workflows;
          if (workflows && workflows.length > 0) {
            const latest = workflows.reduce((latest, current) => {
              const latestTime = latest.updated_at || latest.started_at || latest.created_at;
              const currentTime = current.updated_at || current.started_at || current.created_at;
              return new Date(currentTime || 0).getTime() > new Date(latestTime || 0).getTime() ? current : latest;
            });
            return latest.updated_at || latest.started_at || latest.created_at 
              ? new Date(latest.updated_at || latest.started_at || latest.created_at).getTime() 
              : 0;
          }
          return 0;
        };
        return getTimestamp(b) - getTimestamp(a);
      });
    });

    return workflowsByStatus;
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      setIsDragging(false);
      return;
    }

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      setIsDragging(false);
      return;
    }

    setIsDragging(true);

    const currentStatus = source.droppableId;
    const newStatus = destination.droppableId;

    // Agora TODOS os cards são de OS (sempre começam com "order-")
    if (!draggableId.startsWith('order-')) {
      console.error('Invalid draggable ID format:', draggableId);
      setIsDragging(false);
      return;
    }

    // Extrair orderId e componente (se houver) do draggableId
    // Formato: "order-{uuid}" ou "order-{uuid}-{component}"
    const idParts = draggableId.replace('order-', '').split('-');
    let orderId: string;
    let specificComponent: string | null = null;

    if (idParts.length > 5) {
      // UUID tem 5 partes separadas por hífen, então se tem mais, o último é o componente
      specificComponent = idParts[idParts.length - 1];
      orderId = idParts.slice(0, -1).join('-');
    } else {
      orderId = idParts.join('-');
    }
    
    // Buscar a OS e todos os seus workflows no status atual
    const order = orders.find((o) => o.id === orderId);
    if (!order || !order.order_workflow) {
      console.log('Order not found or no workflows:', orderId);
      setIsDragging(false);
      return;
    }

    // Verificar se o status de origem permite desmembramento
    const sourceStatusConfig = statusConfigMap[currentStatus];
    const sourceAllowsSplit = sourceStatusConfig?.allow_component_split === true;

    let workflowsToMove: OrderWorkflow[] = [];

    if (specificComponent) {
      // Está arrastando um card de componente individual específico
      workflowsToMove = order.order_workflow.filter(
        (w) => w.status === currentStatus && w.component === specificComponent
      );
      console.log('Moving individual component:', specificComponent);
    } else {
      // Está arrastando um card de OS completa - mover todos os workflows no status atual
      workflowsToMove = order.order_workflow.filter(
        (w) => w.status === currentStatus
      );
    }

    if (workflowsToMove.length === 0) {
      console.log('No workflows to move');
      setIsDragging(false);
      return;
    }

    console.log('Moving order:', order.order_number, 'from', currentStatus, 'to', newStatus);
    console.log('Workflows to move:', workflowsToMove.length);

    if (currentStatus === 'entrada' && newStatus !== 'orcamentos') {
      toast({
        title: "Transição não permitida",
        description: "A OS precisa estar em Orçamento antes de avançar para o próximo status",
        variant: "destructive"
      });
      setIsDragging(false);
      return;
    }

    // Validar transição sem filtro de componente específico
    const allowedTransitions = getNextAllowedStatuses(currentStatus, undefined);
    
    console.log('Allowed transitions:', allowedTransitions);
    console.log('Prerequisites:', prerequisites);
    
    // Verificar se há pré-requisitos configurados no sistema
    const hasAnyPrerequisites = prerequisites && prerequisites.length > 0;
    
    let isTransitionAllowed = false;
    
    if (hasAnyPrerequisites) {
      // Há pré-requisitos no sistema: verificar se a transição específica está permitida
      if (allowedTransitions.length > 0) {
        isTransitionAllowed = allowedTransitions.some(
          transition => transition.to_status_key === newStatus
        );
      } else {
        // Há pré-requisitos no sistema, mas nenhum para este status específico
        isTransitionAllowed = false;
      }
    } else {
      // Não há pré-requisitos configurados no sistema: permitir qualquer transição
      isTransitionAllowed = true;
    }

    if (!isTransitionAllowed) {
      console.log('Transition not allowed');
      toast({
        title: "Transição não permitida",
        description: "Esta transição de status não é permitida pelas regras configuradas",
        variant: "destructive"
      });
      setIsDragging(false);
      return;
    }

    // Mover os workflows selecionados
    console.log('Updating workflows:', workflowsToMove.map((w) => w.id));

    // Atualizar os workflows
    const updatePromises = workflowsToMove.map((workflow) =>
      updateWorkflowStatus(workflow.id, newStatus, sourceAllowsSplit && workflowsToMove.length === 1 
        ? 'Componente movido para novo status' 
        : 'OS movida para novo status')
    );

    const results = await Promise.all(updatePromises);
    const allSuccess = results.every(r => r === true);

    console.log('Update results:', results);

    if (allSuccess) {
      const statusConfig = statusConfigMap[newStatus];
      const newStatusLabel = statusConfig?.status_label || newStatus;
      
      const moveMessage = workflowsToMove.length === 1 && sourceAllowsSplit
        ? `Componente ${workflowsToMove[0].component} movido para ${newStatusLabel}`
        : `${workflowsToMove.length} componente(s) movido(s) para ${newStatusLabel}`;
      
      toast({
        title: "Movido com sucesso!",
        description: moveMessage,
      });
      
      // Verificar se precisa avançar automaticamente
      await checkAndAdvanceOrderWorkflows(orderId, newStatus);
      
      onOrderUpdate();
    } else {
      toast({
        title: "Erro ao mover",
        description: "Alguns componentes não puderam ser movidos",
        variant: "destructive"
      });
    }
    
    setIsDragging(false);
  };

  const workflowsByStatus = organizeWorkflowsByStatus();
  
  // Para exibição no header: mostrar "Todos" se nenhum selecionado, ou lista dos selecionados
  const selectedComponentsLabels = useMemo(() => {
    if (selectedComponents.length === 0) {
      return ['Todos'];
    }
    return selectedComponents.map(id => {
      const comp = COMPONENTS.find(c => c.id === id);
      return comp?.name || id;
    });
  }, [selectedComponents, COMPONENTS]);

  const displayText = selectedComponents.length === 0 
    ? 'Todos' 
    : selectedComponents.length === 1
      ? selectedComponentsLabels[0]
      : `${selectedComponents.length} componentes`;

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

  return (
    <div className="h-full flex flex-col relative">
      {/* Loading Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm font-medium">Movendo componentes...</p>
          </div>
        </div>
      )}
      
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 space-y-4 mb-6">
        {/* Filters */}
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          sx={{ width: '100%' }}
        >
          <Autocomplete
            multiple
            options={componentOptions}
            getOptionLabel={(option) => option.label}
            value={componentOptions.filter(opt => selectedComponents.includes(opt.value))}
            onChange={(_, newValue) => {
              setSelectedComponents(newValue.map(v => v.value));
            }}
            loading={componentsLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filtrar por Componentes"
                placeholder={selectedComponents.length === 0 ? "Selecione componentes (deixe vazio para Todos)" : "Componentes selecionados"}
                variant="outlined"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option.label}
                    {...tagProps}
                    sx={{
                      backgroundColor: option.color,
                      color: 'white',
                      '& .MuiChip-deleteIcon': {
                        color: 'white'
                      }
                    }}
                  />
                );
              })
            }
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.grey[900] 
                  : theme.palette.background.paper,
              }
            }}
          />

          <Autocomplete
            freeSolo
            options={orderOptions}
            value={orderSearch}
            onChange={(_, newValue) => setOrderSearch(newValue || '')}
            inputValue={orderSearch}
            onInputChange={(_, newInputValue, reason) => {
              if (reason === 'reset') return;
              setOrderSearch(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar OS"
                placeholder="Digite o número da OS"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <Search className="w-4 h-4 text-muted-foreground" />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  )
                }}
              />
            )}
            sx={{
              flex: 1,
              minWidth: isMobile ? '100%' : 260,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.grey[900] 
                  : theme.palette.background.paper,
              }
            }}
          />
        </Stack>

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
            Workflow - Ordens de Serviço
            {selectedComponents.length > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                ({selectedComponents.length} componente{selectedComponents.length > 1 ? 's' : ''} selecionado{selectedComponents.length > 1 ? 's' : ''})
              </span>
            )}
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
                    componentColor="bg-gray-500"
                    statusColors={statusColors}
                    statusConfig={statusConfigMap[status]}
                    onUpdate={onOrderUpdate}
                    employeeOptions={employeeDirectory}
                    employeesLoading={employeesLoading}
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
