import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Building2, UserPlus, Search, Filter, Phone, Edit, Trash2, Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { MaskedInput } from "@/components/ui/masked-input";
import { validateCPFCNPJ, validatePhone, getCPFCNPJErrorMessage, getPhoneErrorMessage } from "@/utils/validators";

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Customer | null>(null);
  const [deletingClient, setDeletingClient] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    type: 'direto' as 'direto' | 'oficina',
    has_workshop: false,
    workshop_name: '',
    workshop_cnpj: '',
    workshop_contact: ''
  });
  
  const [errors, setErrors] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    workshop_name: '',
    workshop_cnpj: '',
    workshop_contact: ''
  });

  const { customers, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { toast } = useToast();

  const loadCustomers = useCallback(async () => {
    await fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      await fetchCustomers(term);
    } else {
      await fetchCustomers();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      type: 'direto',
      has_workshop: false,
      workshop_name: '',
      workshop_cnpj: '',
      workshop_contact: ''
    });
    setErrors({
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      workshop_name: '',
      workshop_cnpj: '',
      workshop_contact: ''
    });
    setEditingClient(null);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm(); // Resetar formulário quando fechar
    }
  };

  const handleEdit = (client: Customer) => {
    setEditingClient(client);
    const hasWorkshop = !!(client.workshop_name || client.workshop_cnpj || client.workshop_contact);
    setFormData({
      name: client.name,
      document: client.document,
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      type: client.type,
      has_workshop: hasWorkshop,
      workshop_name: client.workshop_name || '',
      workshop_cnpj: client.workshop_cnpj || '',
      workshop_contact: client.workshop_contact || ''
    });
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      workshop_name: '',
      workshop_cnpj: '',
      workshop_contact: ''
    };

    // Validar nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Nome deve ter no máximo 50 caracteres';
    }

    // Validar documento
    if (!formData.document.trim()) {
      newErrors.document = 'CPF ou CNPJ é obrigatório';
    } else {
      const documentNumbers = formData.document.replace(/\D/g, '');
      if (documentNumbers.length !== 11 && documentNumbers.length !== 14) {
        newErrors.document = 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos';
      }
    }

    // Validar telefone (se preenchido)
    if (formData.phone && formData.phone.length > 0) {
      if (formData.phone.length < 10) {
        newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos';
      } else if (formData.phone.length > 11) {
        newErrors.phone = 'Telefone deve ter no máximo 11 dígitos';
      }
    }

    // Validar email (se preenchido)
    if (formData.email && formData.email.length > 0) {
      if (formData.email.length > 50) {
        newErrors.email = 'E-mail deve ter no máximo 50 caracteres';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'E-mail inválido';
      }
    }

    // Validar endereço (se preenchido)
    if (formData.address && formData.address.length > 200) {
      newErrors.address = 'Endereço deve ter no máximo 200 caracteres';
    }

    // Validar nome da oficina (se preenchido)
    if (formData.workshop_name && formData.workshop_name.length > 50) {
      newErrors.workshop_name = 'Nome da oficina deve ter no máximo 50 caracteres';
    }

    // Validar telefone da oficina (se preenchido)
    if (formData.workshop_contact && formData.workshop_contact.length > 0) {
      if (formData.workshop_contact.length < 10) {
        newErrors.workshop_contact = 'Telefone da oficina deve ter pelo menos 10 dígitos';
      } else if (formData.workshop_contact.length > 11) {
        newErrors.workshop_contact = 'Telefone da oficina deve ter no máximo 11 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os erros nos campos destacados",
        variant: "destructive"
      });
      return;
    }

    try {
      const { has_workshop, ...customerData } = formData;
      const dataToSave = {
        ...customerData,
        type: has_workshop ? 'oficina' : 'direto'
      };
      
      if (editingClient) {
        await updateCustomer(editingClient.id, dataToSave);
      } else {
        await createCustomer(dataToSave);
      }
      
      setIsDialogOpen(false);
      resetForm();
      await loadCustomers();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  const handleDelete = async (clientId: string) => {
    try {
      const success = await deleteCustomer(clientId);
      if (success) {
        await loadCustomers();
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.document.includes(searchTerm) ||
                         (customer.phone && customer.phone.includes(searchTerm));
    const matchesType = filterType === 'todos' || 
                       (filterType === 'direto' && customer.type === 'direto') ||
                       (filterType === 'oficina' && customer.type === 'oficina');
    return matchesSearch && matchesType;
  });

  const totalCustomers = customers.length;
  const directCustomers = customers.filter(c => c.type === 'direto').length;
  const workshopCustomers = customers.filter(c => c.type === 'oficina').length;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie todos os clientes da retífica
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
              <DialogDescription>
                {editingClient ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome / Razão Social *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 50); // Truncar para máximo 50 caracteres
                    setFormData(prev => ({ ...prev, name: value }));
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  placeholder="Nome completo ou razão social"
                  className={errors.name ? 'border-red-500' : ''}
                  maxLength={50}
                  required
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="document">CPF ou CNPJ *</Label>
                <MaskedInput
                  id="document"
                  mask="cpfcnpj"
                  value={formData.document}
                  onChange={(maskedValue, rawValue) => {
                    setFormData(prev => ({ ...prev, document: rawValue }));
                    if (errors.document) {
                      setErrors(prev => ({ ...prev, document: '' }));
                    }
                  }}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  required
                />
                {errors.document && (
                  <p className="text-sm text-red-500 mt-1">{errors.document}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <MaskedInput
                  id="phone"
                  mask="phone"
                  value={formData.phone}
                  onChange={(maskedValue, rawValue) => {
                    setFormData(prev => ({ ...prev, phone: rawValue }));
                    // Limpar erro ao digitar
                    if (errors.phone) {
                      setErrors(prev => ({ ...prev, phone: '' }));
                    }
                  }}
                  placeholder="(00) 00000-0000"
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 50); // Truncar para máximo 50 caracteres
                    setFormData(prev => ({ ...prev, email: value }));
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder="cliente@email.com"
                  className={errors.email ? 'border-red-500' : ''}
                  maxLength={50}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 200); // Truncar para máximo 200 caracteres
                    setFormData(prev => ({ ...prev, address: value }));
                    if (errors.address) {
                      setErrors(prev => ({ ...prev, address: '' }));
                    }
                  }}
                  placeholder="Endereço completo"
                  className={errors.address ? 'border-red-500' : ''}
                  maxLength={200}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 pt-2 pb-2">
                <input
                  type="checkbox"
                  id="has_workshop"
                  checked={formData.has_workshop}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, has_workshop: e.target.checked }));
                    if (!e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        workshop_name: '',
                        workshop_cnpj: '',
                        workshop_contact: ''
                      }));
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="has_workshop" className="text-sm font-normal cursor-pointer">
                  Tem oficina?
                </Label>
              </div>
              
              {/* Campos específicos para oficina */}
              {formData.has_workshop && (
                <>
                  <div>
                    <Label htmlFor="workshop_name">Nome da Oficina</Label>
                    <Input
                      id="workshop_name"
                      value={formData.workshop_name}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, 50); // Truncar para máximo 50 caracteres
                        setFormData(prev => ({ ...prev, workshop_name: value }));
                        if (errors.workshop_name) {
                          setErrors(prev => ({ ...prev, workshop_name: '' }));
                        }
                      }}
                      placeholder="Nome da oficina"
                      className={errors.workshop_name ? 'border-red-500' : ''}
                      maxLength={50}
                    />
                    {errors.workshop_name && (
                      <p className="text-sm text-red-500 mt-1">{errors.workshop_name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="workshop_cnpj">CNPJ da Oficina</Label>
                    <MaskedInput
                      id="workshop_cnpj"
                      mask="cnpj"
                      value={formData.workshop_cnpj}
                      onChange={(maskedValue, rawValue) => {
                        setFormData(prev => ({ ...prev, workshop_cnpj: rawValue }));
                        // Limpar erro ao digitar
                        if (errors.workshop_cnpj) {
                          setErrors(prev => ({ ...prev, workshop_cnpj: '' }));
                        }
                      }}
                      placeholder="00.000.000/0000-00"
                    />
                    {errors.workshop_cnpj && (
                      <p className="text-sm text-red-500 mt-1">{errors.workshop_cnpj}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="workshop_contact">Contato da Oficina</Label>
                    <MaskedInput
                      id="workshop_contact"
                      mask="phone"
                      value={formData.workshop_contact}
                      onChange={(maskedValue, rawValue) => {
                        setFormData(prev => ({ ...prev, workshop_contact: rawValue }));
                        // Limpar erro ao digitar
                        if (errors.workshop_contact) {
                          setErrors(prev => ({ ...prev, workshop_contact: '' }));
                        }
                      }}
                      placeholder="(00) 00000-0000"
                    />
                    {errors.workshop_contact && (
                      <p className="text-sm text-red-500 mt-1">{errors.workshop_contact}</p>
                    )}
                  </div>
                </>
              )}
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingClient ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total de Clientes"
          value={totalCustomers}
          icon={Users}
        />
        <StatCard
          title="Clientes Diretos"
          value={directCustomers}
          icon={Users}
        />
        <StatCard
          title="Oficinas"
          value={workshopCustomers}
          icon={Building2}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, documento ou telefone..."
                value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
              />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="direto">Cliente Direto</SelectItem>
                <SelectItem value="oficina">Oficina</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {filteredCustomers.length} cliente(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando clientes...</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum cliente encontrado com os filtros aplicados' : 'Nenhum cliente cadastrado'}
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                    <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Documento</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <Badge variant={customer.type === 'direto' ? 'default' : 'secondary'}>
                          {customer.type === 'direto' ? 'Cliente Direto' : 'Oficina'}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.document}</TableCell>
                      <TableCell>
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                    </div>
                        )}
                  </TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o cliente "{customer.name}"?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(customer.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clientes;