
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MaskedInput } from "@/components/ui/masked-input";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/useSupabase";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { useConsultants } from "@/hooks/useConsultants";
import { MapPin, User, Building, Wrench, Search, Plus, UserPlus, Check } from "lucide-react";

export default function Coleta() {
  const [formData, setFormData] = useState({
    dataColeta: new Date().toISOString().split('T')[0],
    horaColeta: new Date().toTimeString().split(' ')[0].slice(0, 5),
    localColeta: "",
    motivoFalha: "",
    nomeCliente: "",
    documento: "",
    telefone: "",
    email: "",
    endereco: "",
    nomeOficina: "",
    cnpjOficina: "",
    contatoOficina: "",
    consultor: ""
  });

  // Estado para controlar o tipo de documento (CPF/CNPJ)
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj' | 'auto'>('auto');

  // Estado separado para o formulário de criação de cliente (modal)
  const [newCustomerForm, setNewCustomerForm] = useState({
    nomeCliente: "",
    documento: "",
    telefone: "",
    email: "",
    endereco: "",
    tipoCliente: "",
    nomeOficina: "",
    cnpjOficina: "",
    contatoOficina: ""
  });
  const [newCustomerDocumentType, setNewCustomerDocumentType] = useState<'cpf' | 'cnpj' | 'auto'>('auto');

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { loading } = useSupabase();
  const { fetchCustomers, createCustomer: createNewCustomer, checkDocumentExists, loading: customersLoading } = useCustomers();
  const { consultants, loading: consultantsLoading, fetchConsultants } = useConsultants();

  useEffect(() => {
    fetchConsultants();
  }, [fetchConsultants]);

  // Carregar todos os clientes quando o modal de busca é aberto
  useEffect(() => {
    if (showSearchDialog && searchResults.length === 0 && !customersLoading) {
      fetchCustomers().then(results => {
        setSearchResults(results);
        setShowSearchResults(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSearchDialog]);

  // Função para detectar automaticamente o tipo de documento
  const detectDocumentType = (value: string): 'cpf' | 'cnpj' => {
    const numbers = value.replace(/\D/g, '');
    return numbers.length <= 11 ? 'cpf' : 'cnpj';
  };

  // Buscar clientes
  const handleSearchCustomers = async (term: string) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      const results = await fetchCustomers(term);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      // Carregar todos os clientes quando o campo está vazio ou com menos de 2 caracteres
      if (term.length === 0) {
        const allResults = await fetchCustomers();
        setSearchResults(allResults);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }
  };

  // Selecionar cliente existente
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    
    // Detectar tipo de documento baseado no tamanho
    const detectedDocType = detectDocumentType(customer.document);
    
    setFormData(prev => ({
      ...prev,
      nomeCliente: customer.name,
      documento: customer.document, // Manter o documento como está (pode estar formatado ou não)
      telefone: customer.phone || "",
      email: customer.email || "",
      endereco: customer.address || "",
      nomeOficina: customer.workshop_name || "",
      cnpjOficina: customer.workshop_cnpj || "",
      contatoOficina: customer.workshop_contact || ""
    }));
    
    // Atualizar tipo de documento baseado no documento do cliente
    setDocumentType(detectedDocType);
    setShowSearchResults(false);
    setSearchTerm("");
    setShowSearchDialog(false); // Fechar o modal após seleção
  };

  // Criar novo cliente (apenas no dialog)
  const handleCreateNewCustomer = async () => {
    if (!newCustomerForm.nomeCliente || !newCustomerForm.documento) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o nome e documento do cliente",
        variant: "destructive"
      });
      return;
    }

    // Validar se o CPF/CNPJ já existe
    const existingCustomer = await checkDocumentExists(newCustomerForm.documento);
    if (existingCustomer) {
      toast({
        title: "Erro",
        description: `Já existe um cliente cadastrado com este CPF/CNPJ: ${existingCustomer.name}`,
        variant: "destructive"
      });
      return;
    }

    const customerData = {
      name: newCustomerForm.nomeCliente,
      document: newCustomerForm.documento,
      phone: newCustomerForm.telefone || undefined,
      email: newCustomerForm.email || undefined,
      address: newCustomerForm.endereco || undefined,
      type: (newCustomerForm.tipoCliente || 'direto') as 'direto' | 'oficina',
      workshop_name: newCustomerForm.tipoCliente === 'oficina' ? newCustomerForm.nomeOficina || undefined : undefined,
      workshop_cnpj: newCustomerForm.tipoCliente === 'oficina' ? newCustomerForm.cnpjOficina || undefined : undefined,
      workshop_contact: newCustomerForm.tipoCliente === 'oficina' ? newCustomerForm.contatoOficina || undefined : undefined
    };

    const newCustomer = await createNewCustomer(customerData);
    if (newCustomer) {
      // Atualizar a listagem de clientes (refresh)
      const updatedCustomers = await fetchCustomers();
      setSearchResults(updatedCustomers);
      
      // Fechar o dialog
      setShowNewCustomerDialog(false);
      
      // Selecionar o cliente recém-criado (isso vai preencher os campos do formulário principal)
      // O handleSelectCustomer já atualiza o formData com os dados do cliente
      handleSelectCustomer(newCustomer);
      
      toast({
        title: "Sucesso",
        description: "Cliente cadastrado e selecionado com sucesso",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Função no-op para campos disabled (apenas visualização)
  const noOpChange = useCallback((_value: string, _rawValue: string) => {
    // Não faz nada - apenas para evitar warnings do React
  }, []);

  // Função para lidar com mudanças no campo de documento (modal de criação)
  const handleNewCustomerDocumentChange = (maskedValue: string, rawValue: string) => {
    setNewCustomerForm(prev => ({ ...prev, documento: rawValue }));
    // Atualizar o tipo de documento baseado no tamanho
    if (rawValue.length > 0) {
      setNewCustomerDocumentType(detectDocumentType(rawValue));
    } else {
      setNewCustomerDocumentType('auto');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast({
        title: "Erro",
        description: "Selecione ou cadastre um cliente",
        variant: "destructive"
      });
      return;
    }

    if (!formData.consultor) {
      toast({
        title: "Erro",
        description: "Selecione um consultor",
        variant: "destructive"
      });
      return;
    }

    const consultantInfo = consultants.find((consultant) => consultant.id === formData.consultor);
    if (!consultantInfo) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar o consultor selecionado",
        variant: "destructive"
      });
      return;
    }

    // Salvar dados da coleta no sessionStorage para usar no check-in
    const coletaData = {
      customer_id: selectedCustomer.id,
      consultant_id: formData.consultor,
      collection_date: formData.dataColeta,
      collection_time: formData.horaColeta,
      collection_location: formData.localColeta,
      driver_name: consultantInfo.name,
      failure_reason: formData.motivoFalha || undefined,
    };
    
    sessionStorage.setItem('coletaData', JSON.stringify(coletaData));
    
    toast({
      title: "Coleta registrada",
      description: "Dados salvos. Prossiga para o check-in técnico.",
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
                <Dialog 
                  open={showSearchDialog} 
                  onOpenChange={(open) => {
                    setShowSearchDialog(open);
                    if (!open) {
                      // Limpar busca quando modal for fechado
                      setSearchTerm("");
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }
                  }}
                >
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
                    <Command className="rounded-lg border shadow-md">
                      <CommandInput
                        placeholder="Buscar cliente por nome, documento ou telefone..."
                        value={searchTerm}
                        onValueChange={handleSearchCustomers}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {searchTerm.length >= 2 
                            ? "Nenhum cliente encontrado" 
                            : "Digite pelo menos 2 caracteres para buscar"}
                        </CommandEmpty>
                        <CommandGroup>
                          {searchResults.length > 0 && searchResults.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={`${customer.id} ${customer.name} ${customer.document} ${customer.phone || ''}`}
                              onSelect={() => handleSelectCustomer(customer)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col w-full">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{customer.name}</div>
                                  {selectedCustomer?.id === customer.id && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  <span>{customer.document}</span>
                                  {customer.phone && (
                                    <span className="ml-2">• {customer.phone}</span>
                                  )}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    {customersLoading && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Buscando clientes...
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Dialog 
                  open={showNewCustomerDialog} 
                  onOpenChange={(open) => {
                    setShowNewCustomerDialog(open);
                    // Limpar campos do formulário do modal quando abrir
                    if (open) {
                      setNewCustomerForm({
                        nomeCliente: "",
                        documento: "",
                        telefone: "",
                        email: "",
                        endereco: "",
                        nomeOficina: "",
                        cnpjOficina: "",
                        contatoOficina: "",
                        tipoCliente: ""
                      });
                      setNewCustomerDocumentType('auto');
                    }
                  }}
                >
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
                        <Label htmlFor="newClientType">Tipo de Cliente</Label>
                        <Select 
                          value={newCustomerForm.tipoCliente} 
                          onValueChange={(value) => setNewCustomerForm(prev => ({ ...prev, tipoCliente: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oficina">Oficina</SelectItem>
                            <SelectItem value="direto">Cliente Direto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div></div>
                      <div>
                        <Label htmlFor="newClientName">Nome Completo / Razão Social *</Label>
                        <Input
                          id="newClientName"
                          value={newCustomerForm.nomeCliente}
                          onChange={(e) => setNewCustomerForm(prev => ({ ...prev, nomeCliente: e.target.value }))}
                          placeholder="Nome do cliente"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newClientDoc">CPF / CNPJ *</Label>
                        <MaskedInput
                          id="newClientDoc"
                          mask="cpfcnpj"
                          value={newCustomerForm.documento}
                          onChange={handleNewCustomerDocumentChange}
                          
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newClientPhone">Telefone</Label>
                        <MaskedInput
                          id="newClientPhone"
                          mask="phone"
                          value={newCustomerForm.telefone}
                          onChange={(maskedValue, rawValue) => {
                            setNewCustomerForm(prev => ({ ...prev, telefone: rawValue }));
                          }}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newClientEmail">E-mail</Label>
                        <Input
                          id="newClientEmail"
                          value={newCustomerForm.email}
                          onChange={(e) => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="cliente@email.com"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="newClientAddress">Endereço</Label>
                        <Input
                          id="newClientAddress"
                          value={newCustomerForm.endereco}
                          onChange={(e) => setNewCustomerForm(prev => ({ ...prev, endereco: e.target.value }))}
                          placeholder="Endereço completo"
                        />
                      </div>
                      {newCustomerForm.tipoCliente === "oficina" && (
                        <>
                          <div>
                            <Label htmlFor="newClientWorkshopName">Nome da Oficina</Label>
                            <Input
                              id="newClientWorkshopName"
                              value={newCustomerForm.nomeOficina}
                              onChange={(e) => setNewCustomerForm(prev => ({ ...prev, nomeOficina: e.target.value }))}
                              placeholder="Nome da oficina"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newClientWorkshopDoc">CNPJ / CPF da Oficina</Label>
                            <MaskedInput
                              id="newClientWorkshopDoc"
                              mask="cpfcnpj"
                              value={newCustomerForm.cnpjOficina}
                              onChange={(maskedValue, rawValue) => {
                                setNewCustomerForm(prev => ({ ...prev, cnpjOficina: rawValue }));
                              }}
                              placeholder="00.000.000/0000-00"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Label htmlFor="newClientWorkshopContact">Contato da Oficina (WhatsApp)</Label>
                            <MaskedInput
                              id="newClientWorkshopContact"
                              mask="phone"
                              value={newCustomerForm.contatoOficina}
                              onChange={(maskedValue, rawValue) => {
                                setNewCustomerForm(prev => ({ ...prev, contatoOficina: rawValue }));
                              }}
                              placeholder="(00) 00000-0000"
                            />
                          </div>
                        </>
                      )}
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
            {!selectedCustomer ? (
              <div className="sm:col-span-2 p-4 bg-muted border border-dashed rounded-lg text-center text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum cliente selecionado</p>
                <p className="text-xs mt-1">Use os botões acima para buscar ou cadastrar um cliente</p>
              </div>
            ) : (
              <>
                <div className="sm:col-span-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <User className="w-4 h-4" />
                    <span className="font-medium">Cliente Selecionado: {selectedCustomer.name}</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="nomeCliente">Nome Completo / Razão Social</Label>
                  <Input
                    id="nomeCliente"
                    value={formData.nomeCliente}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label htmlFor="documento">CPF / CNPJ</Label>
                  <MaskedInput
                    id="documento"
                    mask="cpfcnpj"
                    value={formData.documento}
                    // onChange={noOpChange}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <MaskedInput
                    id="telefone"
                    mask="phone"
                    value={formData.telefone}
                    // onChange={noOpChange}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="endereco">Endereço Completo</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Oficina (Condicional - Apenas Visualização) */}
        {selectedCustomer && selectedCustomer.type === "oficina" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Oficina
              </CardTitle>
              <CardDescription>
                Dados da oficina parceira
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeOficina">Nome da Oficina</Label>
                <Input
                  id="nomeOficina"
                  value={formData.nomeOficina}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>
              <div>
                <Label htmlFor="cnpjOficina">CNPJ / CPF</Label>
                <MaskedInput
                  id="cnpjOficina"
                  mask="cpfcnpj"
                  value={formData.cnpjOficina}
                  onChange={noOpChange}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="contatoOficina">Contato (WhatsApp)</Label>
                <MaskedInput
                  id="contatoOficina"
                  mask="phone"
                  value={formData.contatoOficina}
                  onChange={noOpChange}
                  disabled
                  className="bg-muted cursor-not-allowed"
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
          <Button type="submit" size="lg" disabled={loading || customersLoading || consultantsLoading} className="w-full sm:w-auto">
            {(loading || customersLoading || consultantsLoading) ? "Salvando..." : "Avançar para Check-in Técnico"}
          </Button>
        </div>
      </form>
    </div>
  );
}
