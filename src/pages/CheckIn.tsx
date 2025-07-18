
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Camera, ClipboardList, Settings } from "lucide-react";

export default function CheckIn() {
  const [formData, setFormData] = useState({
    // Identificação do Motor
    tipo: "",
    marca: "",
    modelo: "",
    combustivel: "",
    numeroSerie: "",
    
    // Checklist
    motorCompleto: false,
    montado: "",
    temBloco: false,
    temCabecote: false,
    temVirabrequim: false,
    temPistao: false,
    temBiela: false,
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
    etiqueta: null as File | null
  });

  const { toast } = useToast();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (tipo: string, file: File | null) => {
    setFotos(prev => ({ ...prev, [tipo]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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

    // TODO: Salvar dados e fotos no Supabase
    console.log("Dados do check-in:", formData);
    console.log("Fotos:", fotos);
    
    toast({
      title: "Check-in realizado",
      description: "Ordem de serviço criada com sucesso!",
    });
  };

  const renderFileInput = (tipo: string, label: string, obrigatorio = true) => (
    <div className="space-y-2">
      <Label htmlFor={tipo}>
        {label} {obrigatorio && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={tipo}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(tipo, e.target.files?.[0] || null)}
        required={obrigatorio}
      />
      {fotos[tipo as keyof typeof fotos] && (
        <p className="text-sm text-green-600">✓ Foto adicionada</p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Check-in Técnico</h1>
          <p className="text-muted-foreground">Identificação e inspeção inicial do motor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificação do Motor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Identificação do Motor
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo de Motor</Label>
              <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="pesado">Pesado</SelectItem>
                  <SelectItem value="agricola">Agrícola</SelectItem>
                  <SelectItem value="estacionario">Estacionário</SelectItem>
                </SelectContent>
              </Select>
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
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFileInput('frente', 'Frente')}
            {renderFileInput('traseira', 'Traseira')}
            {renderFileInput('lateral1', 'Lateral Esquerda')}
            {renderFileInput('lateral2', 'Lateral Direita')}
            {renderFileInput('cabecote', 'Cabeçote')}
            {renderFileInput('carter', 'Cárter')}
            {renderFileInput('etiqueta', 'Etiqueta', false)}
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="motorCompleto"
                checked={formData.motorCompleto}
                onCheckedChange={(checked) => handleInputChange('motorCompleto', !!checked)}
              />
              <Label htmlFor="motorCompleto">Motor completo?</Label>
            </div>

            <div>
              <Label htmlFor="montado">Estado de montagem</Label>
              <Select value={formData.montado} onValueChange={(value) => handleInputChange('montado', value)}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temBloco"
                  checked={formData.temBloco}
                  onCheckedChange={(checked) => handleInputChange('temBloco', !!checked)}
                />
                <Label htmlFor="temBloco">Tem Bloco</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temCabecote"
                  checked={formData.temCabecote}
                  onCheckedChange={(checked) => handleInputChange('temCabecote', !!checked)}
                />
                <Label htmlFor="temCabecote">Tem Cabeçote</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temVirabrequim"
                  checked={formData.temVirabrequim}
                  onCheckedChange={(checked) => handleInputChange('temVirabrequim', !!checked)}
                />
                <Label htmlFor="temVirabrequim">Tem Virabrequim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temPistao"
                  checked={formData.temPistao}
                  onCheckedChange={(checked) => handleInputChange('temPistao', !!checked)}
                />
                <Label htmlFor="temPistao">Tem Pistão</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temBiela"
                  checked={formData.temBiela}
                  onCheckedChange={(checked) => handleInputChange('temBiela', !!checked)}
                />
                <Label htmlFor="temBiela">Tem Biela</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="giraManualmente"
                  checked={formData.giraManualmente}
                  onCheckedChange={(checked) => handleInputChange('giraManualmente', !!checked)}
                />
                <Label htmlFor="giraManualmente">Gira Manualmente</Label>
              </div>
            </div>

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

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Criar Ordem de Serviço
          </Button>
        </div>
      </form>
    </div>
  );
}
