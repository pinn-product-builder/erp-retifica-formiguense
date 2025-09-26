import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Shield, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Wrench,
  Microscope,
  TestTube,
  FileText,
  Award,
  MapPin,
  Calendar,
  User,
  BarChart3
} from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface BoschWorkflowStep {
  step_number: number;
  step_name: string;
  description: string;
  estimated_hours: number;
  requires_clean_room: boolean;
  requires_certified_equipment: boolean;
  quality_checkpoints: string[];
  measurement_requirements: MeasurementRequirement[];
  test_procedures: TestProcedure[];
}

interface MeasurementRequirement {
  parameter: string;
  expected_value: number;
  tolerance: number;
  unit: string;
  equipment_required: string;
}

interface TestProcedure {
  test_name: string;
  test_description: string;
  acceptance_criteria: string;
  equipment_required: string;
  curve_generation: boolean;
}

interface BoschOrder {
  id: string;
  order_id: string;
  component_type: 'injection_pump' | 'injector' | 'common_rail' | 'turbo';
  current_step: number;
  total_steps: number;
  progress_percentage: number;
  clean_room_reserved: boolean;
  certified_equipment_assigned: boolean;
  quality_approved: boolean;
  test_curves_generated: boolean;
  parts_validation_status: 'pending' | 'approved' | 'rejected';
  final_report_generated: boolean;
  bosch_certification: boolean;
  started_at: string;
  estimated_completion: string;
  actual_completion?: string;
  assigned_technician: string;
  supervisor: string;
  order?: {
    order_number: string;
    customer: { name: string };
  };
}

interface SpecialEnvironment {
  id: string;
  environment_name: string;
  environment_type: 'clean_room' | 'test_bench' | 'calibration_station';
  current_status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  temperature_min: number;
  temperature_max: number;
  humidity_min: number;
  humidity_max: number;
  cleanliness_class: string;
  certification_valid_until: string;
  last_maintenance: string;
  next_maintenance: string;
}

const BOSCH_WORKFLOW_STEPS: BoschWorkflowStep[] = [
  {
    step_number: 1,
    step_name: "Recepção e Catalogação",
    description: "Recebimento e identificação do componente Bosch",
    estimated_hours: 0.5,
    requires_clean_room: false,
    requires_certified_equipment: false,
    quality_checkpoints: ["Verificação de integridade", "Identificação de código"],
    measurement_requirements: [],
    test_procedures: []
  },
  {
    step_number: 2,
    step_name: "Inspeção Visual Inicial",
    description: "Inspeção visual externa detalhada",
    estimated_hours: 1,
    requires_clean_room: false,
    requires_certified_equipment: false,
    quality_checkpoints: ["Danos externos", "Corrosão", "Desgaste visível"],
    measurement_requirements: [],
    test_procedures: []
  },
  {
    step_number: 3,
    step_name: "Preparação para Desmontagem",
    description: "Preparação em ambiente limpo para desmontagem",
    estimated_hours: 1,
    requires_clean_room: true,
    requires_certified_equipment: false,
    quality_checkpoints: ["Limpeza externa", "Preparação de ferramentas"],
    measurement_requirements: [],
    test_procedures: []
  },
  {
    step_number: 4,
    step_name: "Desmontagem Controlada",
    description: "Desmontagem seguindo procedimentos Bosch",
    estimated_hours: 2,
    requires_clean_room: true,
    requires_certified_equipment: true,
    quality_checkpoints: ["Sequência de desmontagem", "Identificação de peças"],
    measurement_requirements: [],
    test_procedures: []
  },
  {
    step_number: 5,
    step_name: "Inspeção de Componentes",
    description: "Inspeção detalhada de cada componente interno",
    estimated_hours: 3,
    requires_clean_room: true,
    requires_certified_equipment: true,
    quality_checkpoints: ["Estado das peças", "Medições dimensionais"],
    measurement_requirements: [
      {
        parameter: "Diâmetro interno",
        expected_value: 10.0,
        tolerance: 0.005,
        unit: "mm",
        equipment_required: "Micrômetro calibrado"
      }
    ],
    test_procedures: []
  },
  // ... continuar com os 14 passos
];

export function BoschWorkflowManager() {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  
  const [boschOrders, setBoschOrders] = useState<BoschOrder[]>([]);
  const [environments, setEnvironments] = useState<SpecialEnvironment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<BoschOrder | null>(null);
  const [activeTab, setActiveTab] = useState('workflow');

  useEffect(() => {
    loadBoschOrders();
    loadSpecialEnvironments();
  }, []);

  const loadBoschOrders = async () => {
    try {
      // Buscar ordens que têm componentes Bosch identificados
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(name),
          engines(
            type,
            brand,
            model
          )
        `)
        .eq('engines.brand', 'Bosch')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Simular dados de workflow Bosch (em produção viria de tabela específica)
      const boschOrdersData: BoschOrder[] = (data || []).map(order => ({
        id: `bosch_${order.id}`,
        order_id: order.id,
        component_type: 'injection_pump',
        current_step: Math.floor(Math.random() * 14) + 1,
        total_steps: 14,
        progress_percentage: Math.floor(Math.random() * 100),
        clean_room_reserved: Math.random() > 0.5,
        certified_equipment_assigned: Math.random() > 0.3,
        quality_approved: Math.random() > 0.7,
        test_curves_generated: Math.random() > 0.6,
        parts_validation_status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)] as any,
        final_report_generated: Math.random() > 0.8,
        bosch_certification: Math.random() > 0.9,
        started_at: order.created_at,
        estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_technician: 'João Silva',
        supervisor: 'Maria Santos',
        order: {
          order_number: order.order_number,
          customer: order.customer
        }
      }));

      setBoschOrders(boschOrdersData);
    } catch (error) {
      console.error('Erro ao carregar ordens Bosch:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as ordens Bosch",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialEnvironments = async () => {
    try {
      const { data, error } = await supabase
        .from('special_environments')
        .select('*')
        .order('environment_name', { ascending: true });

      if (error) throw error;
      setEnvironments(data || []);
    } catch (error) {
      console.error('Erro ao carregar ambientes especiais:', error);
    }
  };

  const reserveCleanRoom = async (orderId: string, environmentId: string) => {
    try {
      const { error } = await supabase
        .from('environment_reservations')
        .insert({
          environment_id: environmentId,
          order_id: orderId,
          component: 'injection_system',
          workflow_step_key: 'bosch_clean_room',
          reserved_from: new Date().toISOString(),
          reserved_until: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 horas
          reservation_status: 'reserved',
          reserved_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Sala limpa reservada com sucesso",
        variant: "default"
      });

      loadBoschOrders();
    } catch (error) {
      console.error('Erro ao reservar sala limpa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reservar a sala limpa",
        variant: "destructive"
      });
    }
  };

  const validateBoschParts = async (orderId: string, approved: boolean) => {
    try {
      // Simular validação de peças Bosch
      toast({
        title: "Sucesso",
        description: `Peças ${approved ? 'aprovadas' : 'rejeitadas'} conforme padrão Bosch`,
        variant: approved ? "default" : "destructive"
      });

      loadBoschOrders();
    } catch (error) {
      console.error('Erro na validação de peças:', error);
    }
  };

  const generateTestCurves = async (orderId: string) => {
    try {
      // Simular geração de curvas de teste automáticas
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Sucesso",
        description: "Curvas de teste geradas automaticamente",
        variant: "default"
      });

      loadBoschOrders();
    } catch (error) {
      console.error('Erro ao gerar curvas de teste:', error);
    }
  };

  const getComponentTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
      injection_pump: { label: 'Bomba Injetora', icon: Wrench, color: 'blue' },
      injector: { label: 'Injetor', icon: TestTube, color: 'green' },
      common_rail: { label: 'Common Rail', icon: Settings, color: 'purple' },
      turbo: { label: 'Turbo', icon: BarChart3, color: 'orange' }
    };

    const config = typeConfig[type] || { label: type, icon: Settings, color: 'gray' };
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`border-${config.color}-300 text-${config.color}-700`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getEnvironmentStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: 'Disponível', variant: 'default' as const, icon: CheckCircle },
      occupied: { label: 'Ocupado', variant: 'destructive' as const, icon: Clock },
      maintenance: { label: 'Manutenção', variant: 'secondary' as const, icon: AlertTriangle },
      reserved: { label: 'Reservado', variant: 'default' as const, icon: MapPin }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge variant={config?.variant || 'secondary'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config?.label || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            Workflow Especializado Bosch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="workflow">Workflow Ativo</TabsTrigger>
              <TabsTrigger value="environments">Ambientes Especiais</TabsTrigger>
              <TabsTrigger value="standards">Padrões Bosch</TabsTrigger>
            </TabsList>

            <TabsContent value="workflow" className="space-y-6">
              <div className="space-y-4">
                {boschOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma ordem Bosch ativa</h3>
                    <p>Ordens com componentes Bosch aparecerão aqui automaticamente.</p>
                  </div>
                ) : (
                  boschOrders.map((boschOrder) => (
                    <Card key={boschOrder.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="font-medium text-lg">
                                {boschOrder.order?.order_number}
                              </h3>
                              {getComponentTypeBadge(boschOrder.component_type)}
                              {boschOrder.bosch_certification && (
                                <Badge variant="default" className="bg-green-600">
                                  <Award className="h-3 w-3 mr-1" />
                                  Certificado Bosch
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                              <div>
                                <p className="font-medium text-gray-900">Cliente</p>
                                <p>{boschOrder.order?.customer?.name}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Técnico</p>
                                <p>{boschOrder.assigned_technician}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Supervisor</p>
                                <p>{boschOrder.supervisor}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Previsão</p>
                                <p>{new Date(boschOrder.estimated_completion).toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  Progresso: Etapa {boschOrder.current_step} de {boschOrder.total_steps}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {boschOrder.progress_percentage}%
                                </span>
                              </div>
                              <Progress value={boschOrder.progress_percentage} className="h-2" />
                            </div>

                            {/* Status dos Requisitos */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                {boschOrder.clean_room_reserved ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-orange-600" />
                                )}
                                <span>Sala Limpa</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {boschOrder.certified_equipment_assigned ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-orange-600" />
                                )}
                                <span>Equipamento</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {boschOrder.parts_validation_status === 'approved' ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : boschOrder.parts_validation_status === 'rejected' ? (
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-orange-600" />
                                )}
                                <span>Peças Validadas</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {boschOrder.test_curves_generated ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-orange-600" />
                                )}
                                <span>Curvas de Teste</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {!boschOrder.clean_room_reserved && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Reservar Sala
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reservar Ambiente Limpo</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-sm text-gray-600">
                                      Selecione o ambiente limpo para as etapas de desmontagem e montagem Bosch.
                                    </p>
                                    <Select>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o ambiente" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {environments
                                          .filter(env => env.environment_type === 'clean_room' && env.current_status === 'available')
                                          .map(env => (
                                            <SelectItem key={env.id} value={env.id}>
                                              {env.environment_name} - Classe {env.cleanliness_class}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                    <Button 
                                      className="w-full"
                                      onClick={() => reserveCleanRoom(boschOrder.order_id, environments[0]?.id)}
                                    >
                                      Confirmar Reserva
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            {boschOrder.parts_validation_status === 'pending' && (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => validateBoschParts(boschOrder.id, false)}
                                >
                                  Rejeitar
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => validateBoschParts(boschOrder.id, true)}
                                >
                                  Aprovar
                                </Button>
                              </div>
                            )}

                            {!boschOrder.test_curves_generated && boschOrder.progress_percentage > 70 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => generateTestCurves(boschOrder.id)}
                              >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Gerar Curvas
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="environments" className="space-y-6">
              <div className="grid gap-4">
                {environments.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ambiente configurado</h3>
                    <p className="text-gray-600 mb-4">
                      Configure ambientes especiais para workflow Bosch.
                    </p>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Ambientes
                    </Button>
                  </div>
                ) : (
                  environments.map((environment) => (
                    <Card key={environment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{environment.environment_name}</h3>
                              {getEnvironmentStatusBadge(environment.current_status)}
                              <Badge variant="outline" className="text-xs">
                                Classe {environment.cleanliness_class}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                              <div>
                                <p className="font-medium text-gray-900">Temperatura</p>
                                <p>{environment.temperature_min}°C - {environment.temperature_max}°C</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Umidade</p>
                                <p>{environment.humidity_min}% - {environment.humidity_max}%</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Certificação</p>
                                <p>{new Date(environment.certification_valid_until).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Próxima Manutenção</p>
                                <p>{new Date(environment.next_maintenance).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                          
                          <Button size="sm" variant="outline" disabled={environment.current_status !== 'available'}>
                            {environment.current_status === 'available' ? 'Reservar' : 'Indisponível'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="standards" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Padrão Bosch RAM
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Workflow especializado de 14 etapas para componentes de injeção Bosch, 
                      seguindo rigorosamente os padrões de qualidade da marca.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Requisitos Obrigatórios</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Ambiente limpo (Classe ISO 8 ou superior)
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Bancada de teste homologada Bosch
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Ferramentas e equipamentos certificados
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Peças originais ou equivalentes homologados
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Técnico com certificação Bosch
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Controles de Qualidade</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-center gap-2">
                            <TestTube className="w-4 h-4 text-blue-500" />
                            Testes de pressão automáticos
                          </li>
                          <li className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                            Geração de curvas de performance
                          </li>
                          <li className="flex items-center gap-2">
                            <Microscope className="w-4 h-4 text-blue-500" />
                            Inspeção dimensional rigorosa
                          </li>
                          <li className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            Relatório técnico detalhado
                          </li>
                          <li className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-blue-500" />
                            Certificação de conformidade
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>14 Etapas do Workflow Bosch</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {BOSCH_WORKFLOW_STEPS.slice(0, 6).map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-800">{step.step_number}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{step.step_name}</h4>
                            <p className="text-xs text-gray-600">{step.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{step.estimated_hours}h estimadas</span>
                              {step.requires_clean_room && (
                                <Badge variant="outline" className="text-xs">Sala Limpa</Badge>
                              )}
                              {step.requires_certified_equipment && (
                                <Badge variant="outline" className="text-xs">Equipamento Certificado</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">... e mais 8 etapas especializadas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
