import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Truck,
  ClipboardCheck,
  Kanban,
  Shield,
  Package,
  FileText,
  Settings,
  Home
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';

// Componentes contextuais - serão importados dinamicamente
import { IntakeWizard } from '@/components/operations/IntakeWizard';
import { KanbanInterface } from '@/components/operations/KanbanInterface';
import { QualityCenter } from '@/components/operations/QualityCenter';
import { MaterialsCenter } from '@/components/operations/MaterialsCenter';
import { DeliveryPanel } from '@/components/operations/DeliveryPanel';

// Types
interface ProcessStep {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  progress: number;
}

interface OrderContext {
  id?: string;
  number?: string;
  customer?: string;
  status?: string;
  progress?: number;
  currentStep?: string;
}

type OperationStage = 'intake' | 'workflow' | 'quality' | 'materials' | 'delivery';

export default function OperationsCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchOrderDetails } = useOrders();

  // Estados principais
  const [currentStage, setCurrentStage] = useState<OperationStage>('intake');
  const [orderContext, setOrderContext] = useState<OrderContext>({});
  const [loading, setLoading] = useState(false);

  // Definição das etapas do processo
  const processSteps: ProcessStep[] = [
    {
      id: 'intake',
      name: 'Entrada',
      description: 'Coleta e Check-in',
      icon: Truck,
      status: currentStage === 'intake' ? 'active' : 'pending',
      progress: currentStage === 'intake' ? 50 : 0
    },
    {
      id: 'workflow',
      name: 'Produção',
      description: 'Workflow Kanban',
      icon: Kanban,
      status: currentStage === 'workflow' ? 'active' : 'pending',
      progress: currentStage === 'workflow' ? 75 : 0
    },
    {
      id: 'quality',
      name: 'Qualidade',
      description: 'Controle e Garantias',
      icon: Shield,
      status: currentStage === 'quality' ? 'active' : 'pending',
      progress: currentStage === 'quality' ? 60 : 0
    },
    {
      id: 'materials',
      name: 'Materiais',
      description: 'Estoque e Compras',
      icon: Package,
      status: currentStage === 'materials' ? 'active' : 'pending',
      progress: currentStage === 'materials' ? 40 : 0
    },
    {
      id: 'delivery',
      name: 'Entrega',
      description: 'Finalização',
      icon: CheckCircle,
      status: currentStage === 'delivery' ? 'active' : 'pending',
      progress: currentStage === 'delivery' ? 90 : 0
    }
  ];

  const loadOrderContext = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
      const orderDetails = await fetchOrderDetails(orderId);
      
      if (orderDetails) {
        // Calcular progresso baseado no workflow
        const totalComponents = 5; // bloco, cabeçote, eixo, biela, comando
        
        // Buscar workflows da ordem para calcular progresso real
        const { data: workflows } = await supabase
          .from('order_workflow')
          .select('status')
          .eq('order_id', orderDetails.id);
        
        const completedComponents = workflows?.filter(wf => 
          ['pronto', 'garantia', 'entregue'].includes(wf.status)
        ).length || 0;
        
        const progress = Math.round((completedComponents / totalComponents) * 100);
        
        setOrderContext({
          id: orderDetails.id,
          number: orderDetails.order_number,
          customer: orderDetails.customer?.name || 'Cliente não identificado',
          status: orderDetails.status,
          progress: progress,
          currentStep: currentStage
        });
      } else {
        throw new Error('Ordem não encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar contexto da ordem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o contexto da ordem",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [fetchOrderDetails, currentStage, toast]);

  // Inicialização baseada em parâmetros da URL
  useEffect(() => {
    const stage = searchParams.get('stage') as OperationStage;
    const orderId = searchParams.get('order');

    if (stage && ['intake', 'workflow', 'quality', 'materials', 'delivery'].includes(stage)) {
      setCurrentStage(stage);
    }

    if (orderId) {
      loadOrderContext(orderId);
    }
  }, [searchParams, loadOrderContext]);



  const handleStageChange = (newStage: OperationStage) => {
    setCurrentStage(newStage);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('stage', newStage);
      return newParams;
    });
  };

  const handleNextStep = () => {
    const currentIndex = processSteps.findIndex(step => step.id === currentStage);
    if (currentIndex < processSteps.length - 1) {
      const nextStage = processSteps[currentIndex + 1].id as OperationStage;
      handleStageChange(nextStage);
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = processSteps.findIndex(step => step.id === currentStage);
    if (currentIndex > 0) {
      const prevStage = processSteps[currentIndex - 1].id as OperationStage;
      handleStageChange(prevStage);
    }
  };

  const getStageTitle = () => {
    const step = processSteps.find(s => s.id === currentStage);
    return step ? step.name : 'Operações';
  };

  const getStageDescription = () => {
    const step = processSteps.find(s => s.id === currentStage);
    return step ? step.description : 'Central de Operações';
  };

  const renderContextualContent = () => {
    switch (currentStage) {
      case 'intake':
        return <IntakeWizard onComplete={() => handleStageChange('workflow')} />;
      case 'workflow':
        return <KanbanInterface orderContext={orderContext} />;
      case 'quality':
        return <QualityCenter orderContext={orderContext} />;
      case 'materials':
        return <MaterialsCenter orderContext={orderContext} />;
      case 'delivery':
        return <DeliveryPanel orderContext={orderContext} />;
      default:
        return <IntakeWizard onComplete={() => handleStageChange('workflow')} />;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="p-2"
          >
            <Home className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {getStageTitle()}
            </h1>
            <p className="text-muted-foreground">
              {getStageDescription()}
            </p>
          </div>

          {orderContext.number && (
            <Badge variant="outline" className="ml-2">
              OS: {orderContext.number}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {orderContext.progress && (
            <div className="hidden lg:flex items-center gap-2 min-w-[200px]">
              <span className="text-sm text-muted-foreground">Progresso:</span>
              <Progress value={orderContext.progress} className="flex-1" />
              <span className="text-sm font-medium">{orderContext.progress}%</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousStep}
            disabled={currentStage === 'intake'}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <Button
            size="sm"
            onClick={handleNextStep}
            disabled={currentStage === 'delivery'}
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Etapas do Processo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Etapas do Processo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStage;
              const isCompleted = step.status === 'completed';

              return (
                <div
                  key={step.id}
                  className={`
                    flex flex-col items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2
                    ${isActive
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted border-transparent'
                    }
                  `}
                  onClick={() => handleStageChange(step.id as OperationStage)}
                >
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>

                  <div className="text-center">
                    <p className={`
                      font-medium text-sm
                      ${isActive ? 'text-primary' : ''}
                    `}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>

                    {step.progress > 0 && (
                      <Progress
                        value={step.progress}
                        className="mt-2 h-1"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo Contextual */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 animate-spin" />
                <span>Carregando...</span>
              </div>
            </div>
          ) : (
            renderContextualContent()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
