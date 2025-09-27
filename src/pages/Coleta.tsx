
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/useSupabase";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { MapPin, User, Building, Wrench, Search, Plus, UserPlus } from "lucide-react";

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

  const [consultants, setConsultants] = useState<Array<{id: string, name: string}>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { loading, getConsultants, createCustomer } = useSupabase();
  const { fetchCustomers, createCustomer: createNewCustomer, loading: customersLoading } = useCustomers();

  const loadConsultants = useCallback(async () => {
    const data = await getConsultants();
    if (data) {
      setConsultants(data);
    }
  }, [getConsultants]);

  useEffect(() => {
    loadConsultants();
  }, [loadConsultants]);

  // Buscar clientes
  const handleSearchCustomers = async (term: string) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      const results = await fetchCustomers(term);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Selecionar cliente existente
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      nomeCliente: customer.name,
      documento: customer.document,
      telefone: customer.phone || "",
      email: customer.email || "",
      endereco: customer.address || "",
      tipoCliente: customer.type,
      nomeOficina: customer.workshop_name || "",
      cnpjOficina: customer.workshop_cnpj || "",
      contatoOficina: customer.workshop_contact || ""
    }));
    setShowSearchResults(false);
    setSearchTerm("");
  };

  // Criar novo cliente
  const handleCreateNewCustomer = async () => {
    const customerData = {
      name: formData.nomeCliente,
      document: formData.documento,
      phone: formData.telefone,
      email: formData.email,
      address: formData.endereco,
      type: formData.tipoCliente as 'direto' | 'oficina',
      workshop_name: formData.tipoCliente === 'oficina' ? formData.nomeOficina : undefined,
      workshop_cnpj: formData.tipoCliente === 'oficina' ? formData.cnpjOficina : undefined,
      workshop_contact: formData.tipoCliente === 'oficina' ? formData.contatoOficina : undefined
    };

    const newCustomer = await createNewCustomer(customerData);
    if (newCustomer) {
      setSelectedCustomer(newCustomer);
      setShowNewCustomerDialog(false);
    }
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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Cliente
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Buscar Cliente</DialogTitle>
                      <DialogDescription>
                        Digite o nome, documento ou telefone para buscar
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Digite para buscar..."
                        value={searchTerm}
                        onChange={(e) => handleSearchCustomers(e.target.value)}
                      />
                      {showSearchResults && searchResults.length > 0 && (
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {searchResults.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSelectCustomer(customer)}
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-600">{customer.document}</div>
                              {customer.phone && (
                                <div className="text-sm text-gray-600">{customer.phone}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {showSearchResults && searchResults.length === 0 && searchTerm.length >= 2 && (
                        <div className="text-center py-4 text-gray-500">
                          Nenhum cliente encontrado
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                      <DialogDescription>
                        Preencha os dados do cliente abaixo
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newClientName">Nome Completo / Razão Social</Label>
                        <Input
                          id="newClientName"
                          value={formData.nomeCliente}
                          onChange={(e) => handleInputChange('nomeCliente', e.target.value)}
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newClientDoc">CPF / CNPJ</Label>
                        <Input
                          id="newClientDoc"
                          value={formData.documento}
                          onChange={(e) => handleInputChange('documento', e.target.value)}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newClientPhone">Telefone</Label>
                        <Input
                          id="newClientPhone"
                          value={formData.telefone}
                          onChange={(e) => handleInputChange('telefone', e.target.value)}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newClientEmail">E-mail</Label>
                        <Input
                          id="newClientEmail"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="cliente@email.com"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="newClientAddress">Endereço</Label>
                        <Input
                          id="newClientAddress"
                          value={formData.endereco}
                          onChange={(e) => handleInputChange('endereco', e.target.value)}
                          placeholder="Endereço completo"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleCreateNewCustomer}
                        disabled={customersLoading}
                      >
                        {customersLoading ? "Cadastrando..." : "Cadastrar Cliente"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedCustomer && (
              <div className="sm:col-span-2 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2 text-green-800">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Cliente Selecionado: {selectedCustomer.name}</span>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="nomeCliente">Nome Completo / Razão Social</Label>
              <Input
                id="nomeCliente"
                placeholder="Nome do cliente"
                value={formData.nomeCliente}
                onChange={(e) => handleInputChange('nomeCliente', e.target.value)}
                required
                disabled={!!selectedCustomer}
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
                disabled={!!selectedCustomer}
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
                disabled={!!selectedCustomer}
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
                disabled={!!selectedCustomer}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="endereco">Endereço Completo</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro, cidade, CEP"
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                disabled={!!selectedCustomer}
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
