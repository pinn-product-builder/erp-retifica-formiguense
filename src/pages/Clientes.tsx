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
    workshop_name: '',
    workshop_cnpj: '',
    workshop_contact: ''
  });
  
  const [errors, setErrors] = useState({
    document: '',
    phone: '',
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
      workshop_name: '',
      workshop_cnpj: '',
      workshop_contact: ''
    });
    setEditingClient(null);
  };

  const handleEdit = (client: Customer) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      document: client.document,
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      type: client.type,
      workshop_name: client.workshop_name || '',
      workshop_cnpj: client.workshop_cnpj || '',
      workshop_contact: client.workshop_contact || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.document) {
      toast({
        title: "Erro",
        description: "Nome e documento são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingClient) {
        await updateCustomer(editingClient.id, formData);
      } else {
        await createCustomer(formData);
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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo ou razão social"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de Cliente *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'direto' | 'oficina') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direto">Cliente Direto</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="document">
                  {formData.type === 'direto' ? 'CPF' : 'CNPJ'} *
                </Label>
                <MaskedInput
                  id="document"
                  mask={formData.type === 'direto' ? 'cpf' : 'cnpj'}
                  value={formData.document}
                  onChange={(maskedValue, rawValue) => {
                    setFormData(prev => ({ ...prev, document: rawValue }));
                    // Limpar erro ao digitar
                    if (errors.document) {
                      setErrors(prev => ({ ...prev, document: '' }));
                    }
                  }}
                  placeholder={formData.type === 'direto' ? '000.000.000-00' : '00.000.000/0000-00'}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo"
                />
              </div>
              
              {/* Campos específicos para oficina */}
              {formData.type === 'oficina' && (
                <>
                  <div>
                    <Label htmlFor="workshop_name">Nome da Oficina</Label>
                    <Input
                      id="workshop_name"
                      value={formData.workshop_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, workshop_name: e.target.value }))}
                      placeholder="Nome da oficina"
                    />
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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