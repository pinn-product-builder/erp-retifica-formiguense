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

export default function CheckIn() {
  const { engineTypes, fetchEngineTypes } = useEngineTypes();
  const { components: engineComponents } = useEngineComponents();
  
  const [formData, setFormData] = useState({
    // Identificação do Motor
    engineTypeId: undefined as string | undefined,
    marca: "",
    modelo: "",
    combustivel: "",
    numeroSerie: "",
    
    // Checklist
    motorCompleto: false,
    montado: "",
    selectedComponents: [] as string[],
    giraManualmente: false,
    observacoes: ""
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { loading, createEngine, createOrder, uploadPhoto } = useSupabase();

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
    if (formData.motorCompleto && availableComponents.length > 0) {
      const allComponentIds = availableComponents.map((c) => c.id);
      setFormData((prev) => ({
        ...prev,
        selectedComponents: allComponentIds
      }));
    } else if (!formData.motorCompleto && formData.selectedComponents.length === availableComponents.length) {
      setFormData((prev) => ({
        ...prev,
        selectedComponents: []
      }));
    }
  }, [formData.motorCompleto, availableComponents.length]);

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

    const engineData = {
      type: selectedEngineType?.name || formData.marca,
      brand: formData.marca,
      model: formData.modelo,
      fuel_type: formData.combustivel,
      serial_number: formData.numeroSerie || undefined,
      is_complete: formData.motorCompleto,
      assembly_state: formData.montado,
      has_block: formData.selectedComponents.includes('bloco'),
      has_head: formData.selectedComponents.includes('cabecote'),
      has_crankshaft: formData.selectedComponents.includes('virabrequim'),
      has_piston: formData.selectedComponents.includes('pistao'),
      has_connecting_rod: formData.selectedComponents.includes('biela'),
      turns_manually: formData.giraManualmente,
    };

    const engine = await createEngine(engineData);
    if (!engine) return;

    // Criar ordem de serviço
    const orderData = {
      ...coletaData,
      engine_id: engine.id,
      initial_observations: formData.observacoes || undefined,
    };

    const order = await createOrder(orderData);
    if (!order) return;

    // Upload das fotos
    const uploadPromises = Object.entries(fotos)
      .filter(([_, file]) => file !== null)
      .map(([tipo, file]) => uploadPhoto(file!, order.id, tipo, undefined, 'entrada'));

    await Promise.all(uploadPromises);
    
    // Limpar dados da sessão
    sessionStorage.removeItem('coletaData');
    
    toast({
      title: "Check-in realizado",
      description: `Ordem de serviço ${order.order_number} criada com sucesso!`,
    });
    
    navigate('/');
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
                      motorCompleto: false
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="motorCompleto"
                    checked={formData.motorCompleto}
                    onCheckedChange={(checked) => {
                      handleInputChange('motorCompleto', !!checked);
                      if (checked && availableComponents.length > 0) {
                        const allComponentIds = availableComponents.map((c) => c.id);
                        setFormData((prev) => ({
                          ...prev,
                          selectedComponents: allComponentIds
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          selectedComponents: []
                        }));
                      }
                    }}
                  />
                  <Label htmlFor="motorCompleto">Motor completo (seleciona todos os componentes)</Label>
                </div>

                <div>
                  <Label htmlFor="montado">Estado de montagem <span className="text-red-500">*</span></Label>
                  <Select value={formData.montado} onValueChange={(value) => handleInputChange('montado', value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="montado">Montado</SelectItem>
                      <SelectItem value="desmontado">Desmontado</SelectItem>
                      <SelectItem value="parcial">Parcialmente montado</SelectItem>
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
                                    motorCompleto: false
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
          <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Criando OS..." : "Criar Ordem de Serviço"}
          </Button>
        </div>
      </form>
    </div>
  );
}
