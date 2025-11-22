// @ts-nocheck

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/useSupabase";
import { Camera, ClipboardList, Settings, AlertCircle, ArrowRight } from "lucide-react";
import { EngineTypeSelect } from "@/components/ui/EngineTypeSelect";
import { useEngineTypes } from "@/hooks/useEngineTypes";
import { useEngineComponents } from "@/hooks/useEngineComponents";
import { useEmployees } from "@/hooks/useEmployees";

export default function CheckIn() {
  const { engineTypes, fetchEngineTypes } = useEngineTypes();
  const { components: engineComponents } = useEngineComponents();
  const { employees, loading: employeesLoading } = useEmployees();
  
  const [formData, setFormData] = useState({
    // Identificação do Motor
    engineTypeId: undefined as string | undefined,
    marca: "",
    modelo: "",
    combustivel: "",
    numeroSerie: "",
    
    // Checklist
    estadoMotor: "",
    montado: "",
    selectedComponents: [] as string[],
    giraManualmente: false,
    observacoes: "",
    
    // Remoção
    removidoPorEmpresa: false,
    removidoPorFuncionario: ""
  });

  const [fotos, setFotos] = useState({
    frente: null as File | null,
    traseira: null as File | null,
    lateral1: null as File | null,
    lateral2: null as File | null,
    cabecote: null as File | null,
    carter: null as File | null,
    etiqueta: null as File | null,
    documento_carro: null as File | null
  });

  const [coletaData, setColetaData] = useState<unknown>(null);
  const [hasColetaData, setHasColetaData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createEngine, createOrder, uploadPhoto } = useSupabase();

  useEffect(() => {
    fetchEngineTypes();
    
    const savedColetaData = sessionStorage.getItem('coletaData');
    if (savedColetaData) {
      setColetaData(JSON.parse(savedColetaData));
      setHasColetaData(true);
    } else {
      setHasColetaData(false);
    }
  }, [fetchEngineTypes]);

  const selectedEngineType = useMemo(() => {
    return engineTypes.find((et) => et.id === formData.engineTypeId);
  }, [engineTypes, formData.engineTypeId]);

  const availableComponents = useMemo(() => {
    if (!selectedEngineType || !selectedEngineType.required_components) {
      return [];
    }
    return selectedEngineType.required_components.map((componentId) => {
      const component = engineComponents.find((c) => c.value === componentId);
      return {
        id: componentId,
        label: component?.label || componentId
      };
    });
  }, [selectedEngineType, engineComponents]);

  useEffect(() => {
    if (formData.estadoMotor === 'completo' && availableComponents.length > 0) {
      const allComponentIds = availableComponents.map((c) => c.id);
      setFormData((prev) => ({
        ...prev,
        selectedComponents: allComponentIds
      }));
    } else if (formData.estadoMotor !== 'completo' && formData.selectedComponents.length === availableComponents.length) {
      setFormData((prev) => ({
        ...prev,
        selectedComponents: []
      }));
    }
  }, [formData.estadoMotor, availableComponents.length]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (tipo: string, file: File | null) => {
    setFotos(prev => ({ ...prev, [tipo]: file }));
  };

  const handleGoToColeta = () => {
    navigate('/coleta');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coletaData) {
      toast({
        title: "Erro",
        description: "Dados da coleta não encontrados. Complete a coleta primeiro.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.engineTypeId) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o tipo de motor",
        variant: "destructive"
      });
      return;
    }

    if (!formData.estadoMotor) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o estado do motor",
        variant: "destructive"
      });
      return;
    }

    if (!formData.montado) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o estado de montagem do motor",
        variant: "destructive"
      });
      return;
    }

    // Verificar fotos obrigatórias
    const fotosObrigatorias = ['frente', 'traseira', 'lateral1', 'lateral2', 'cabecote', 'carter'];
    const fotosFaltando = fotosObrigatorias.filter(tipo => !fotos[tipo as keyof typeof fotos]);
    
    if (fotosFaltando.length > 0) {
      toast({
        title: "Fotos obrigatórias",
        description: `Adicione as fotos: ${fotosFaltando.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const engineData = {
        type: selectedEngineType?.name || formData.marca,
        brand: formData.marca,
        model: formData.modelo,
        fuel_type: formData.combustivel,
        serial_number: formData.numeroSerie || undefined,
        is_complete: formData.estadoMotor === 'completo',
        assembly_state: formData.montado,
        has_block: formData.selectedComponents.includes('bloco'),
        has_head: formData.selectedComponents.includes('cabecote'),
        has_crankshaft: formData.selectedComponents.includes('virabrequim'),
        has_piston: formData.selectedComponents.includes('pistao'),
        has_connecting_rod: formData.selectedComponents.includes('biela'),
        turns_manually: formData.giraManualmente,
        removed_by_company: formData.removidoPorEmpresa,
        removed_by_employee_name: formData.removidoPorEmpresa ? formData.removidoPorFuncionario : undefined,
        engine_type_id: formData.engineTypeId || undefined,
      };

      const engine = await createEngine(engineData);
      if (!engine) {
        setIsSubmitting(false);
        return;
      }

      // Criar ordem de serviço
      const orderData = {
        ...coletaData,
        engine_id: engine.id,
        initial_observations: formData.observacoes || undefined,
      };

      const order = await createOrder(orderData);
      if (!order) {
        setIsSubmitting(false);
        return;
      }

      // Upload das fotos (não bloqueia a conclusão)
      const uploadPromises = Object.entries(fotos)
        .filter(([_, file]) => file !== null)
        .map(([tipo, file]) => uploadPhoto(file!, order.id, tipo, undefined, 'entrada'));

      // Não aguardar upload para não bloquear a UI
      Promise.all(uploadPromises).catch((error) => {
        console.error('Erro ao fazer upload das fotos:', error);
        toast({
          title: "Aviso",
          description: "Ordem criada, mas houve erro no upload de algumas fotos.",
          variant: "default"
        });
      });
      
      // Limpar dados da sessão
      sessionStorage.removeItem('coletaData');
      
      setIsSubmitting(false);
      
      toast({
        title: "Check-in realizado",
        description: `Ordem de serviço ${order.order_number} criada com sucesso!`,
      });
      
      // Pequeno delay para garantir que o toast seja exibido
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
      setIsSubmitting(false);
    }
  };

  const renderFileInput = (tipo: string, label: string, obrigatorio = true, accept = 'image/*') => (
    <div className="space-y-2">
      <Label htmlFor={tipo}>
        {label} {obrigatorio && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={tipo}
        type="file"
        accept={accept}
        onChange={(e) => handleFileChange(tipo, e.target.files?.[0] || null)}
        required={obrigatorio}
      />
      {fotos[tipo as keyof typeof fotos] && (
        <p className="text-sm text-green-600">✓ {tipo === 'documento_carro' ? 'Documento' : 'Foto'} adicionada</p>
      )}
    </div>
  );

  // Se não há dados de coleta, mostrar tela explicativa
  if (!hasColetaData) {
    return (
      <div className="container mx-auto py-4 sm:py-6 px-4 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
          <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Check-in Técnico</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Identificação e inspeção inicial do motor</p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">Coleta Necessária</CardTitle>
            <CardDescription className="text-lg">
              Para realizar o check-in técnico, é necessário primeiro registrar os dados da coleta e do cliente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">O processo completo inclui:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Registro dos dados da coleta (data, hora, local)</li>
                <li>• Cadastro do cliente e informações de contato</li>
                <li>• Informações da oficina (quando aplicável)</li>
                <li>• Definição do consultor responsável</li>
                <li>• Descrição inicial do problema</li>
              </ul>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleGoToColeta} size="lg" className="gap-2">
                Iniciar Processo de Coleta
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderizar formulário normal quando há dados de coleta
  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
        <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Check-in Técnico</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Identificação e inspeção inicial do motor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Identificação do Motor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Identificação do Motor
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="engineTypeId">Tipo de Motor <span className="text-red-500">*</span></Label>
              <EngineTypeSelect
                value={formData.engineTypeId}
                onChange={(value) => {
                  handleInputChange('engineTypeId', value || '');
                  if (!value) {
                    setFormData((prev) => ({
                      ...prev,
                      selectedComponents: [],
                      estadoMotor: ''
                    }));
                  }
                }}
                placeholder="Busque e selecione um tipo de motor..."
              />
            </div>
            <div>
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                placeholder="Ex: Volkswagen, Ford, etc."
                value={formData.marca}
                onChange={(e) => handleInputChange('marca', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                placeholder="Ex: AP 1.0, CHT 1.6, etc."
                value={formData.modelo}
                onChange={(e) => handleInputChange('modelo', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="combustivel">Combustível</Label>
              <Select value={formData.combustivel} onValueChange={(value) => handleInputChange('combustivel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasolina">Gasolina</SelectItem>
                  <SelectItem value="etanol">Etanol</SelectItem>
                  <SelectItem value="flex">Flex</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="gnv">GNV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="numeroSerie">Número de Série</Label>
              <Input
                id="numeroSerie"
                placeholder="Número de série do motor"
                value={formData.numeroSerie}
                onChange={(e) => handleInputChange('numeroSerie', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload de Fotos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Fotos do Motor
            </CardTitle>
            <CardDescription>
              Adicione fotos de todos os ângulos obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFileInput('frente', 'Frente')}
            {renderFileInput('traseira', 'Traseira')}
            {renderFileInput('lateral1', 'Lateral Esquerda')}
            {renderFileInput('lateral2', 'Lateral Direita')}
            {renderFileInput('cabecote', 'Cabeçote')}
            {renderFileInput('carter', 'Cárter')}
            {renderFileInput('etiqueta', 'Etiqueta', false)}
            {renderFileInput('documento_carro', 'Documento do Carro', false, 'image/*,application/pdf')}
          </CardContent>
        </Card>

        {/* Checklist Inicial */}
        <Card>
          <CardHeader>
            <CardTitle>Checklist Inicial</CardTitle>
            <CardDescription>
              Verifique o estado atual do motor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedEngineType && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Selecione um tipo de motor acima para visualizar os componentes disponíveis.
                </p>
              </div>
            )}

            {selectedEngineType && (
              <>
                <div>
                  <Label htmlFor="estadoMotor">Estado do Motor <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.estadoMotor} 
                    onValueChange={(value) => {
                      handleInputChange('estadoMotor', value);
                      if (value === 'completo' && availableComponents.length > 0) {
                        const allComponentIds = availableComponents.map((c) => c.id);
                        setFormData((prev) => ({
                          ...prev,
                          selectedComponents: allComponentIds
                        }));
                      } else if (value !== 'completo') {
                        setFormData((prev) => ({
                          ...prev,
                          selectedComponents: []
                        }));
                      }
                    }} 
                    required
                  >
                    <SelectTrigger id="estadoMotor">
                      <SelectValue placeholder="Selecione o estado do motor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completo">Motor Completo</SelectItem>
                      <SelectItem value="parcial">Motor Parcial</SelectItem>
                      <SelectItem value="avulsos">Componentes Avulsos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="montado">Estado de Montagem <span className="text-red-500">*</span></Label>
                  <Select value={formData.montado} onValueChange={(value) => handleInputChange('montado', value)} required>
                    <SelectTrigger id="montado">
                      <SelectValue placeholder="Selecione o estado de montagem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="montado">Montado</SelectItem>
                      <SelectItem value="parcialmente_montado">Parcialmente Montado</SelectItem>
                      <SelectItem value="desmontado">Desmontado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {availableComponents.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Componentes Presentes</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableComponents.map((component) => {
                        const isChecked = formData.selectedComponents.includes(component.id);
                        return (
                          <div key={component.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={component.id}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    selectedComponents: [...prev.selectedComponents, component.id]
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    selectedComponents: prev.selectedComponents.filter((id) => id !== component.id),
                                    estadoMotor: formData.estadoMotor === 'completo' ? 'parcial' : formData.estadoMotor
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={component.id} className="cursor-pointer">
                              {component.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="giraManualmente"
                    checked={formData.giraManualmente}
                    onCheckedChange={(checked) => handleInputChange('giraManualmente', !!checked)}
                  />
                  <Label htmlFor="giraManualmente">Gira Manualmente</Label>
                </div>

                <div className="space-y-3">
                  <Label>Motor Removido por Mecânicos da Empresa?</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="removidoNao"
                        name="removidoPorEmpresa"
                        checked={!formData.removidoPorEmpresa}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            removidoPorEmpresa: false,
                            removidoPorFuncionario: ""
                          }));
                        }}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="removidoNao" className="cursor-pointer">NÃO</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="removidoSim"
                        name="removidoPorEmpresa"
                        checked={formData.removidoPorEmpresa}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            removidoPorEmpresa: true
                          }));
                        }}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="removidoSim" className="cursor-pointer">SIM, quem?</Label>
                    </div>
                  </div>
                  {formData.removidoPorEmpresa && (
                    <Select
                      value={formData.removidoPorFuncionario}
                      onValueChange={(value) => handleInputChange('removidoPorFuncionario', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeesLoading ? (
                          <SelectItem value="loading" disabled>Carregando funcionários...</SelectItem>
                        ) : employees.filter(emp => emp.is_active).length === 0 ? (
                          <SelectItem value="empty" disabled>Nenhum funcionário ativo encontrado</SelectItem>
                        ) : (
                          employees
                            .filter(emp => emp.is_active)
                            .map((employee) => (
                              <SelectItem key={employee.id} value={employee.full_name}>
                                {employee.full_name} {employee.position ? `- ${employee.position}` : ''}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </>
            )}

            <div>
              <Label htmlFor="observacoes">Observações Adicionais</Label>
              <Textarea
                id="observacoes"
                placeholder="Descreva qualquer observação importante sobre o estado do motor"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center sm:justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Criando OS..." : "Criar Ordem de Serviço"}
          </Button>
        </div>
      </form>
    </div>
  );
}
