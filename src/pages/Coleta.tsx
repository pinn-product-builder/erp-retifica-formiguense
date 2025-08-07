
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/useSupabase";
import { MapPin, User, Building, Wrench } from "lucide-react";

export default function Coleta() {
  const [formData, setFormData] = useState({
    // Dados da Coleta
    dataColeta: new Date().toISOString().split('T')[0],
    horaColeta: new Date().toTimeString().split(' ')[0].slice(0, 5),
    localColeta: "",
    motorista: "",
    tipoCliente: "",
    motivoFalha: "",
    
    // Cliente
    nomeCliente: "",
    documento: "",
    telefone: "",
    email: "",
    endereco: "",
    
    // Oficina (opcional)
    nomeOficina: "",
    cnpjOficina: "",
    contatoOficina: "",
    
    // Consultor
    consultor: ""
  });

  const [consultants, setConsultants] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { loading, getConsultants, createCustomer } = useSupabase();

  useEffect(() => {
    loadConsultants();
  }, []);

  const loadConsultants = async () => {
    const data = await getConsultants();
    setConsultants(data);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.consultor) {
      toast({
        title: "Erro",
        description: "Selecione um consultor",
        variant: "destructive"
      });
      return;
    }
    
    // Criar cliente
    const customerData = {
      type: formData.tipoCliente as 'oficina' | 'direto',
      name: formData.nomeCliente,
      document: formData.documento,
      phone: formData.telefone,
      email: formData.email || undefined,
      address: formData.endereco || undefined,
      workshop_name: formData.tipoCliente === 'oficina' ? formData.nomeOficina || undefined : undefined,
      workshop_cnpj: formData.tipoCliente === 'oficina' ? formData.cnpjOficina || undefined : undefined,
      workshop_contact: formData.tipoCliente === 'oficina' ? formData.contatoOficina || undefined : undefined,
    };

    const customer = await createCustomer(customerData);
    if (!customer) return;

    // Salvar dados da coleta no sessionStorage para usar no check-in
    const coletaData = {
      customer_id: customer.id,
      consultant_id: formData.consultor,
      collection_date: formData.dataColeta,
      collection_time: formData.horaColeta,
      collection_location: formData.localColeta,
      driver_name: formData.motorista,
      failure_reason: formData.motivoFalha || undefined,
    };
    
    sessionStorage.setItem('coletaData', JSON.stringify(coletaData));
    
    toast({
      title: "Coleta registrada",
      description: "Cliente cadastrado. Prossiga para o check-in técnico.",
    });
    
    navigate('/checkin');
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
        <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Coleta e Cadastro do Motor</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Registre os dados da coleta e do cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Dados da Coleta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Dados da Coleta
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataColeta">Data da Coleta</Label>
              <Input
                id="dataColeta"
                type="date"
                value={formData.dataColeta}
                onChange={(e) => handleInputChange('dataColeta', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="horaColeta">Hora da Coleta</Label>
              <Input
                id="horaColeta"
                type="time"
                value={formData.horaColeta}
                onChange={(e) => handleInputChange('horaColeta', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="localColeta">Local da Coleta</Label>
              <Input
                id="localColeta"
                placeholder="Endereço completo"
                value={formData.localColeta}
                onChange={(e) => handleInputChange('localColeta', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="motorista">Motorista/Coletor</Label>
              <Input
                id="motorista"
                placeholder="Nome do responsável"
                value={formData.motorista}
                onChange={(e) => handleInputChange('motorista', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="tipoCliente">Tipo de Cliente</Label>
              <Select value={formData.tipoCliente} onValueChange={(value) => handleInputChange('tipoCliente', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oficina">Oficina</SelectItem>
                  <SelectItem value="direto">Cliente Direto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="motivoFalha">Motivo da Falha</Label>
              <Textarea
                id="motivoFalha"
                placeholder="Descreva o problema relatado pelo cliente"
                value={formData.motivoFalha}
                onChange={(e) => handleInputChange('motivoFalha', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dados do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nomeCliente">Nome Completo / Razão Social</Label>
              <Input
                id="nomeCliente"
                placeholder="Nome do cliente"
                value={formData.nomeCliente}
                onChange={(e) => handleInputChange('nomeCliente', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="documento">CPF / CNPJ</Label>
              <Input
                id="documento"
                placeholder="000.000.000-00"
                value={formData.documento}
                onChange={(e) => handleInputChange('documento', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="endereco">Endereço Completo</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro, cidade, CEP"
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Oficina (Condicional) */}
        {formData.tipoCliente === "oficina" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Oficina
              </CardTitle>
              <CardDescription>
                Dados da oficina parceira (opcional para cliente direto)
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeOficina">Nome da Oficina</Label>
                <Input
                  id="nomeOficina"
                  placeholder="Nome da oficina"
                  value={formData.nomeOficina}
                  onChange={(e) => handleInputChange('nomeOficina', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cnpjOficina">CNPJ / CPF</Label>
                <Input
                  id="cnpjOficina"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpjOficina}
                  onChange={(e) => handleInputChange('cnpjOficina', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="contatoOficina">Contato (WhatsApp)</Label>
                <Input
                  id="contatoOficina"
                  placeholder="(00) 00000-0000"
                  value={formData.contatoOficina}
                  onChange={(e) => handleInputChange('contatoOficina', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Consultor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Consultor Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="consultor">Consultor</Label>
              <Select value={formData.consultor} onValueChange={(value) => handleInputChange('consultor', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o consultor" />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map((consultant) => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center sm:justify-end">
          <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Salvando..." : "Avançar para Check-in Técnico"}
          </Button>
        </div>
      </form>
    </div>
  );
}
