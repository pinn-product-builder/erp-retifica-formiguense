import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  ClipboardCheck, 
  Camera, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  User,
  Building,
  Wrench
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { supabase } from '@/integrations/supabase/client';

interface IntakeWizardProps {
  onComplete: () => void;
}

type WizardStep = 'collection' | 'customer' | 'checkin' | 'photos' | 'review';

interface CollectionData {
  dataColeta: string;
  horaColeta: string;
  localColeta: string;
  motorista: string;
  motivoFalha: string;
}

interface CustomerData {
  tipoCliente: 'direto' | 'oficina';
  nomeCliente: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
  // Oficina específico
  nomeOficina?: string;
  cnpjOficina?: string;
  contatoOficina?: string;
}

interface CheckinData {
  tipo: string;
  marca: string;
  modelo: string;
  combustivel: string;
  numeroSerie: string;
  motorCompleto: boolean;
  montado: string;
  temBloco: boolean;
  temCabecote: boolean;
  temVirabrequim: boolean;
  temPistao: boolean;
  temBiela: boolean;
  giraManualmente: boolean;
  observacoes: string;
}

export function IntakeWizard({ onComplete }: IntakeWizardProps) {
  const { toast } = useToast();
  const { createCustomer, createEngine, createOrder } = useSupabase();
  const [currentStep, setCurrentStep] = useState<WizardStep>('collection');
  const [loading, setLoading] = useState(false);

  // Estados dos dados
  const [collectionData, setCollectionData] = useState<CollectionData>({
    dataColeta: new Date().toISOString().split('T')[0],
    horaColeta: new Date().toTimeString().split(' ')[0].slice(0, 5),
    localColeta: '',
    motorista: '',
    motivoFalha: ''
  });

  const [customerData, setCustomerData] = useState<CustomerData>({
    tipoCliente: 'direto',
    nomeCliente: '',
    documento: '',
    telefone: '',
    email: '',
    endereco: ''
  });

  const [checkinData, setCheckinData] = useState<CheckinData>({
    tipo: '',
    marca: '',
    modelo: '',
    combustivel: '',
    numeroSerie: '',
    motorCompleto: false,
    montado: '',
    temBloco: false,
    temCabecote: false,
    temVirabrequim: false,
    temPistao: false,
    temBiela: false,
    giraManualmente: false,
    observacoes: ''
  });

  const [photos, setPhotos] = useState<{[key: string]: File | null}>({
    frente: null,
    traseira: null,
    lateral1: null,
    lateral2: null,
    cabecote: null,
    carter: null,
    etiqueta: null
  });

  const steps: Array<{ id: WizardStep; name: string; icon: any; progress: number }> = [
    { id: 'collection', name: 'Coleta', icon: Truck, progress: 20 },
    { id: 'customer', name: 'Cliente', icon: User, progress: 40 },
    { id: 'checkin', name: 'Check-in', icon: ClipboardCheck, progress: 60 },
    { id: 'photos', name: 'Fotos', icon: Camera, progress: 80 },
    { id: 'review', name: 'Revisão', icon: CheckCircle, progress: 100 }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const getCurrentProgress = () => steps.find(step => step.id === currentStep)?.progress || 0;

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      
      // 1. Criar cliente
      const customer = await createCustomer({
        type: customerData.tipoCliente,
        name: customerData.nomeCliente,
        document: customerData.documento,
        phone: customerData.telefone,
        email: customerData.email,
        address: customerData.endereco,
        workshop_name: customerData.nomeOficina,
        workshop_cnpj: customerData.cnpjOficina,
        workshop_contact: customerData.contatoOficina
      });

      if (!customer) {
        throw new Error('Erro ao criar cliente');
      }

      // 2. Criar motor
      const engine = await createEngine({
        type: checkinData.tipo,
        brand: checkinData.marca,
        model: checkinData.modelo,
        fuel_type: checkinData.combustivel,
        serial_number: checkinData.numeroSerie,
        is_complete: checkinData.motorCompleto,
        assembly_state: checkinData.montado,
        has_block: checkinData.temBloco,
        has_head: checkinData.temCabecote,
        has_crankshaft: checkinData.temVirabrequim,
        has_piston: checkinData.temPistao,
        has_connecting_rod: checkinData.temBiela,
        turns_manually: checkinData.giraManualmente
      });

      if (!engine) {
        throw new Error('Erro ao criar motor');
      }

      // 3. Buscar consultor disponível
      const consultants = await supabase.from('consultants').select('id').limit(1);
      const consultantId = consultants.data?.[0]?.id;

      if (!consultantId) {
        throw new Error('Nenhum consultor disponível');
      }

      // 4. Criar ordem de serviço
      const order = await createOrder({
        customer_id: customer.id,
        consultant_id: consultantId,
        engine_id: engine.id,
        collection_date: collectionData.dataColeta,
        collection_time: collectionData.horaColeta,
        collection_location: collectionData.localColeta,
        driver_name: collectionData.motorista,
        failure_reason: collectionData.motivoFalha,
        initial_observations: checkinData.observacoes
      });

      if (!order) {
        throw new Error('Erro ao criar ordem de serviço');
      }
      
      toast({
        title: "Sucesso!",
        description: `Ordem ${order.order_number} criada com sucesso!`,
      });
      
      onComplete();
    } catch (error) {
      console.error('Erro ao processar entrada:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível processar a entrada",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (key: string, file: File | null) => {
    setPhotos(prev => ({ ...prev, [key]: file }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'collection':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Truck className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Dados da Coleta</h3>
              <p className="text-gray-600">Registre as informações da coleta do motor</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataColeta">Data da Coleta</Label>
                <Input
                  id="dataColeta"
                  type="date"
                  value={collectionData.dataColeta}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, dataColeta: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="horaColeta">Hora da Coleta</Label>
                <Input
                  id="horaColeta"
                  type="time"
                  value={collectionData.horaColeta}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, horaColeta: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="localColeta">Local da Coleta</Label>
                <Input
                  id="localColeta"
                  placeholder="Endereço completo"
                  value={collectionData.localColeta}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, localColeta: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="motorista">Motorista</Label>
                <Input
                  id="motorista"
                  placeholder="Nome do motorista"
                  value={collectionData.motorista}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, motorista: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="motivoFalha">Motivo da Falha</Label>
              <Textarea
                id="motivoFalha"
                placeholder="Descreva o motivo da falha relatado pelo cliente"
                value={collectionData.motivoFalha}
                onChange={(e) => setCollectionData(prev => ({ ...prev, motivoFalha: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'customer':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              {customerData.tipoCliente === 'direto' ? (
                <User className="h-12 w-12 text-green-600 mx-auto mb-2" />
              ) : (
                <Building className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              )}
              <h3 className="text-lg font-semibold">Dados do Cliente</h3>
              <p className="text-gray-600">Registre as informações do cliente</p>
            </div>

            <div>
              <Label>Tipo de Cliente</Label>
              <Select
                value={customerData.tipoCliente}
                onValueChange={(value: 'direto' | 'oficina') => 
                  setCustomerData(prev => ({ ...prev, tipoCliente: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direto">Cliente Direto</SelectItem>
                  <SelectItem value="oficina">Oficina Parceira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeCliente">Nome do Cliente</Label>
                <Input
                  id="nomeCliente"
                  placeholder="Nome completo"
                  value={customerData.nomeCliente}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, nomeCliente: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="documento">
                  {customerData.tipoCliente === 'direto' ? 'CPF' : 'CNPJ'}
                </Label>
                <Input
                  id="documento"
                  placeholder={customerData.tipoCliente === 'direto' ? '000.000.000-00' : '00.000.000/0000-00'}
                  value={customerData.documento}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, documento: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 99999-9999"
                  value={customerData.telefone}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={customerData.email}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endereco">Endereço Completo</Label>
              <Textarea
                id="endereco"
                placeholder="Rua, número, bairro, cidade, CEP"
                value={customerData.endereco}
                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: e.target.value }))}
              />
            </div>

            {customerData.tipoCliente === 'oficina' && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-sm text-purple-800">Dados da Oficina</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nomeOficina">Nome da Oficina</Label>
                      <Input
                        id="nomeOficina"
                        placeholder="Razão social"
                        value={customerData.nomeOficina || ''}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, nomeOficina: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnpjOficina">CNPJ da Oficina</Label>
                      <Input
                        id="cnpjOficina"
                        placeholder="00.000.000/0000-00"
                        value={customerData.cnpjOficina || ''}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, cnpjOficina: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contatoOficina">Contato na Oficina</Label>
                    <Input
                      id="contatoOficina"
                      placeholder="Nome do responsável"
                      value={customerData.contatoOficina || ''}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, contatoOficina: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'checkin':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Wrench className="h-12 w-12 text-orange-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Check-in Técnico</h3>
              <p className="text-gray-600">Avaliação técnica inicial do motor</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo do Motor</Label>
                <Input
                  id="tipo"
                  placeholder="Ex: 1.0, 1.4, 1.6, 2.0"
                  value={checkinData.tipo}
                  onChange={(e) => setCheckinData(prev => ({ ...prev, tipo: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="marca">Marca</Label>
                <Select
                  value={checkinData.marca}
                  onValueChange={(value) => setCheckinData(prev => ({ ...prev, marca: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volkswagen">Volkswagen</SelectItem>
                    <SelectItem value="chevrolet">Chevrolet</SelectItem>
                    <SelectItem value="ford">Ford</SelectItem>
                    <SelectItem value="fiat">Fiat</SelectItem>
                    <SelectItem value="renault">Renault</SelectItem>
                    <SelectItem value="peugeot">Peugeot</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  placeholder="Ex: Gol, Corsa, Fiesta"
                  value={checkinData.modelo}
                  onChange={(e) => setCheckinData(prev => ({ ...prev, modelo: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="combustivel">Combustível</Label>
                <Select
                  value={checkinData.combustivel}
                  onValueChange={(value) => setCheckinData(prev => ({ ...prev, combustivel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de combustível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasolina">Gasolina</SelectItem>
                    <SelectItem value="etanol">Etanol</SelectItem>
                    <SelectItem value="flex">Flex</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="numeroSerie">Número de Série</Label>
              <Input
                id="numeroSerie"
                placeholder="Número de série do motor"
                value={checkinData.numeroSerie}
                onChange={(e) => setCheckinData(prev => ({ ...prev, numeroSerie: e.target.value }))}
              />
            </div>

            <Card className="border-primary/20 bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Checklist de Componentes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Marque os componentes presentes no motor
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Componentes Principais */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground border-b pb-2">
                    Componentes Principais
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="motorCompleto"
                        checked={checkinData.motorCompleto}
                        onCheckedChange={(checked) => 
                          setCheckinData(prev => ({ ...prev, motorCompleto: checked as boolean }))
                        }
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label htmlFor="motorCompleto" className="text-sm font-medium cursor-pointer">
                        Motor Completo
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="temBloco"
                        checked={checkinData.temBloco}
                        onCheckedChange={(checked) => 
                          setCheckinData(prev => ({ ...prev, temBloco: checked as boolean }))
                        }
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label htmlFor="temBloco" className="text-sm font-medium cursor-pointer">
                        Bloco do Motor
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="temCabecote"
                        checked={checkinData.temCabecote}
                        onCheckedChange={(checked) => 
                          setCheckinData(prev => ({ ...prev, temCabecote: checked as boolean }))
                        }
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label htmlFor="temCabecote" className="text-sm font-medium cursor-pointer">
                        Cabeçote
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Componentes Internos */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground border-b pb-2">
                    Componentes Internos
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="temVirabrequim"
                        checked={checkinData.temVirabrequim}
                        onCheckedChange={(checked) => 
                          setCheckinData(prev => ({ ...prev, temVirabrequim: checked as boolean }))
                        }
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label htmlFor="temVirabrequim" className="text-sm font-medium cursor-pointer">
                        Virabrequim
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="temPistao"
                        checked={checkinData.temPistao}
                        onCheckedChange={(checked) => 
                          setCheckinData(prev => ({ ...prev, temPistao: checked as boolean }))
                        }
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label htmlFor="temPistao" className="text-sm font-medium cursor-pointer">
                        Pistões
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="temBiela"
                        checked={checkinData.temBiela}
                        onCheckedChange={(checked) => 
                          setCheckinData(prev => ({ ...prev, temBiela: checked as boolean }))
                        }
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label htmlFor="temBiela" className="text-sm font-medium cursor-pointer">
                        Bielas
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Teste Funcional */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground border-b pb-2">
                    Teste Funcional
                  </h4>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id="giraManualmente"
                      checked={checkinData.giraManualmente}
                      onCheckedChange={(checked) => 
                        setCheckinData(prev => ({ ...prev, giraManualmente: checked as boolean }))
                      }
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="giraManualmente" className="text-sm font-medium cursor-pointer">
                      Motor gira manualmente
                    </Label>
                  </div>
                </div>

                {/* Estado de Montagem */}
                <div className="space-y-3">
                  <Label htmlFor="montado" className="text-sm font-medium">
                    Estado de Montagem
                  </Label>
                  <Select
                    value={checkinData.montado}
                    onValueChange={(value) => setCheckinData(prev => ({ ...prev, montado: value }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="montado">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Montado
                        </div>
                      </SelectItem>
                      <SelectItem value="parcialmente_desmontado">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Parcialmente Desmontado
                        </div>
                      </SelectItem>
                      <SelectItem value="desmontado">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Completamente Desmontado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Observações */}
                <div className="space-y-3">
                  <Label htmlFor="observacoes" className="text-sm font-medium">
                    Observações Técnicas
                  </Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Descreva o estado geral do motor, danos visíveis, peças faltantes ou outras observações importantes..."
                    value={checkinData.observacoes}
                    onChange={(e) => setCheckinData(prev => ({ ...prev, observacoes: e.target.value }))}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'photos':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Camera className="h-12 w-12 text-indigo-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Documentação Fotográfica</h3>
              <p className="text-gray-600">Registre fotos do motor para documentação</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'frente', label: 'Vista Frontal', required: true },
                { key: 'traseira', label: 'Vista Traseira', required: true },
                { key: 'lateral1', label: 'Lateral Esquerda', required: false },
                { key: 'lateral2', label: 'Lateral Direita', required: false },
                { key: 'cabecote', label: 'Cabeçote', required: false },
                { key: 'carter', label: 'Cárter', required: false },
                { key: 'etiqueta', label: 'Etiqueta/Série', required: true }
              ].map(({ key, label, required }) => (
                <Card key={key} className="border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors">
                  <CardContent className="p-4 text-center">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium mb-2">
                      {label}
                      {required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(key, e.target.files?.[0] || null)}
                      className="hidden"
                      id={`photo-${key}`}
                    />
                    
                    <Label htmlFor={`photo-${key}`} className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          {photos[key] ? 'Alterar' : 'Adicionar'}
                        </span>
                      </Button>
                    </Label>
                    
                    {photos[key] && (
                      <Badge variant="secondary" className="mt-2 block">
                        ✓ Foto adicionada
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Dicas para Fotos</p>
                  <ul className="text-xs text-amber-700 mt-1 space-y-1">
                    <li>• Use boa iluminação</li>
                    <li>• Mantenha o foco nítido</li>
                    <li>• Capture detalhes importantes</li>
                    <li>• Fotos obrigatórias: Frontal, Traseira e Etiqueta</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Revisão Final</h3>
              <p className="text-gray-600">Confirme todos os dados antes de finalizar</p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Dados da Coleta
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Data/Hora:</strong> {collectionData.dataColeta} às {collectionData.horaColeta}</p>
                  <p><strong>Local:</strong> {collectionData.localColeta}</p>
                  <p><strong>Motorista:</strong> {collectionData.motorista}</p>
                  <p><strong>Motivo:</strong> {collectionData.motivoFalha}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {customerData.tipoCliente === 'direto' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Building className="h-4 w-4" />
                    )}
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Tipo:</strong> {customerData.tipoCliente === 'direto' ? 'Cliente Direto' : 'Oficina Parceira'}</p>
                  <p><strong>Nome:</strong> {customerData.nomeCliente}</p>
                  <p><strong>Documento:</strong> {customerData.documento}</p>
                  <p><strong>Telefone:</strong> {customerData.telefone}</p>
                  <p><strong>E-mail:</strong> {customerData.email}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Check-in Técnico
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Motor:</strong> {checkinData.marca} {checkinData.modelo} {checkinData.tipo}</p>
                  <p><strong>Combustível:</strong> {checkinData.combustivel}</p>
                  <p><strong>Série:</strong> {checkinData.numeroSerie}</p>
                  <p><strong>Estado:</strong> {checkinData.montado}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {checkinData.motorCompleto && <Badge variant="secondary">Motor Completo</Badge>}
                    {checkinData.temBloco && <Badge variant="outline">Bloco</Badge>}
                    {checkinData.temCabecote && <Badge variant="outline">Cabeçote</Badge>}
                    {checkinData.temVirabrequim && <Badge variant="outline">Virabrequim</Badge>}
                    {checkinData.giraManualmente && <Badge variant="secondary">Gira Manualmente</Badge>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Documentação Fotográfica
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>Fotos registradas: {Object.values(photos).filter(photo => photo !== null).length} de 7</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(photos).map(([key, photo]) => (
                      photo && (
                        <Badge key={key} variant="secondary">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Badge>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Entrada de Motor</h2>
          <Badge variant="outline">
            Etapa {getCurrentStepIndex() + 1} de {steps.length}
          </Badge>
        </div>
        
        <Progress value={getCurrentProgress()} className="mb-4" />
        
        <div className="flex justify-center">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = getCurrentStepIndex() > index;
              
              return (
                <div
                  key={step.id}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap
                    ${isActive 
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                      : isCompleted 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{step.name}</span>
                  {isCompleted && <CheckCircle className="h-4 w-4" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 'collection'}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        {currentStep === 'review' ? (
          <Button
            onClick={handleComplete}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processando...
              </>
            ) : (
              <>
                Finalizar Entrada
                <CheckCircle className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={getCurrentStepIndex() === steps.length - 1}
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
