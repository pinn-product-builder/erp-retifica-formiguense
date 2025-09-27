import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserCheck, TrendingUp, UserPlus, Search, Filter, DollarSign, Edit, Trash2, Loader2, Users } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useConsultants, Consultant } from "@/hooks/useConsultants";
import { useToast } from "@/hooks/use-toast";

const Consultores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    commission_rate: 0,
    is_active: true
  });

  const { consultants, loading, fetchConsultants, createConsultant, updateConsultant, deleteConsultant, toggleConsultantStatus } = useConsultants();
  const { toast } = useToast();

  useEffect(() => {
    loadConsultants();
  }, []);

  const loadConsultants = async () => {
    await fetchConsultants();
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      await fetchConsultants(term);
    } else {
      await fetchConsultants();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      commission_rate: 0,
      is_active: true
    });
    setEditingConsultant(null);
  };

  const handleEdit = (consultant: Consultant) => {
    setEditingConsultant(consultant);
    setFormData({
      name: consultant.name,
      phone: consultant.phone || '',
      email: consultant.email || '',
      commission_rate: consultant.commission_rate,
      is_active: consultant.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (formData.commission_rate < 0 || formData.commission_rate > 1) {
      toast({
        title: "Erro",
        description: "Taxa de comissão deve estar entre 0% e 100%",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingConsultant) {
        await updateConsultant(editingConsultant.id, formData);
      } else {
        await createConsultant(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
      await loadConsultants();
    } catch (error) {
      console.error('Erro ao salvar consultor:', error);
    }
  };

  const handleDelete = async (consultantId: string) => {
    try {
      const success = await deleteConsultant(consultantId);
      if (success) {
        await loadConsultants();
      }
    } catch (error) {
      console.error('Erro ao excluir consultor:', error);
    }
  };

  const handleToggleStatus = async (consultantId: string, isActive: boolean) => {
    try {
      await toggleConsultantStatus(consultantId, isActive);
      await loadConsultants();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const filteredConsultants = consultants.filter(consultant => {
    const matchesSearch = consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (consultant.email && consultant.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (consultant.phone && consultant.phone.includes(searchTerm));
    const matchesStatus = filterStatus === 'todos' || 
                         (filterStatus === 'ativo' && consultant.is_active) ||
                         (filterStatus === 'inativo' && !consultant.is_active);
    return matchesSearch && matchesStatus;
  });

  const totalConsultants = consultants.length;
  const activeConsultants = consultants.filter(c => c.is_active).length;
  const inactiveConsultants = consultants.filter(c => !c.is_active).length;
  const averageCommission = consultants.length > 0 
    ? consultants.reduce((sum, c) => sum + c.commission_rate, 0) / consultants.length 
    : 0;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Consultores</h1>
          <p className="text-muted-foreground">
            Gerencie todos os consultores da retífica
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Consultor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingConsultant ? 'Editar Consultor' : 'Novo Consultor'}
              </DialogTitle>
              <DialogDescription>
                {editingConsultant ? 'Atualize os dados do consultor' : 'Cadastre um novo consultor'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo do consultor"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="consultor@email.com"
                />
              </div>
              <div>
                <Label htmlFor="commission_rate">Taxa de Comissão (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commission_rate * 100}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    commission_rate: parseFloat(e.target.value) / 100 
                  }))}
                  placeholder="5.00"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Consultor Ativo</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingConsultant ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Consultores"
          value={totalConsultants}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Consultores Ativos"
          value={activeConsultants}
          icon={UserCheck}
          loading={loading}
        />
        <StatCard
          title="Consultores Inativos"
          value={inactiveConsultants}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Comissão Média"
          value={`${(averageCommission * 100).toFixed(1)}%`}
          icon={DollarSign}
          loading={loading}
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
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <div className="relative">
                <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">Ativos</option>
                  <option value="inativo">Inativos</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Consultores</CardTitle>
          <CardDescription>
            {filteredConsultants.length} consultor(es) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando consultores...</span>
            </div>
          ) : filteredConsultants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum consultor encontrado com os filtros aplicados' : 'Nenhum consultor cadastrado'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultants.map((consultant) => (
                    <TableRow key={consultant.id}>
                      <TableCell className="font-medium">{consultant.name}</TableCell>
                      <TableCell>{consultant.email || '-'}</TableCell>
                      <TableCell>{consultant.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {(consultant.commission_rate * 100).toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={consultant.is_active ? 'default' : 'secondary'}>
                            {consultant.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Switch
                            checked={consultant.is_active}
                            onCheckedChange={(checked) => handleToggleStatus(consultant.id, checked)}
                            size="sm"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(consultant)}
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
                                  Tem certeza que deseja excluir o consultor "{consultant.name}"?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(consultant.id)}
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

export default Consultores;