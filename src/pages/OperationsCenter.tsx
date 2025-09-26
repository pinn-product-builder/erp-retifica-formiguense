import React, { useState, useEffect } from 'react';
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

  const loadOrderContext = async (orderId: string) => {
    try {
      setLoading(true);
      // TODO: Implementar carregamento real do contexto da ordem
      setOrderContext({
        id: orderId,
        number: `RF-2025-${orderId.slice(-4)}`,
        customer: 'Cliente Exemplo',
        status: 'em_andamento',
        progress: 65,
        currentStep: currentStage
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o contexto da ordem",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Header Contextual */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Título e Contexto */}
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
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  {getStageTitle()}
                </h1>
                <p className="text-sm text-gray-600">
                  {getStageDescription()}
                </p>
              </div>

              {orderContext.number && (
                <Badge variant="outline" className="ml-2">
                  OS: {orderContext.number}
                </Badge>
              )}
            </div>

            {/* Progresso e Ações */}
            <div className="flex items-center gap-4">
              {orderContext.progress && (
                <div className="hidden lg:flex items-center gap-2 min-w-[200px]">
                  <span className="text-sm text-gray-600">Progresso:</span>
                  <Progress value={orderContext.progress} className="flex-1" />
                  <span className="text-sm font-medium">{orderContext.progress}%</span>
                </div>
              )}

              <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar de Navegação */}
          <div className="lg:col-span-3">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Etapas do Processo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStage;
                  const isCompleted = step.status === 'completed';

                  return (
                    <div
                      key={step.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                        ${isActive
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                        }
                      `}
                      onClick={() => handleStageChange(step.id as OperationStage)}
                    >
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full
                        ${isActive
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }
                      `}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`
                          font-medium truncate
                          ${isActive ? 'text-blue-900' : 'text-gray-900'}
                        `}>
                          {step.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {step.description}
                        </p>

                        {step.progress > 0 && (
                          <Progress
                            value={step.progress}
                            className="mt-1 h-1"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Área de Trabalho Principal */}
          <div className="lg:col-span-9">
            <div className="space-y-6">
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
          </div>
        </div>
      </div>
    </div>
  );
}
