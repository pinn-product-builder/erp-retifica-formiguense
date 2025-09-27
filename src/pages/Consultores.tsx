
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, TrendingUp, UserPlus, Search, Filter, DollarSign, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useConsultants, CreateConsultantData } from "@/hooks/useConsultants";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Consultores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<any>(null);
  const [formData, setFormData] = useState<CreateConsultantData>({
    name: '',
    email: '',
    phone: '',
    commission_rate: 0,
    active: true
  });

  const { consultants, loading, createConsultant, updateConsultant, deleteConsultant, toggleConsultantStatus } = useConsultants();

  const consultoresFiltrados = consultants.filter(consultor => {
    const matchesSearch = consultor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (consultor.email && consultor.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'todos' || 
                         (filterStatus === 'ativo' && consultor.active) ||
                         (filterStatus === 'inativo' && !consultor.active);
    return matchesSearch && matchesStatus;
  });

  const consultoresAtivos = consultants.filter(c => c.active).length;
  const totalConsultores = consultants.length;
  const comissaoMedia = consultants.length > 0 
    ? consultants.reduce((sum, c) => sum + c.commission_rate, 0) / consultants.length 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = editingConsultant 
      ? await updateConsultant(editingConsultant.id, formData)
      : await createConsultant(formData);
    
    if (success) {
      setIsDialogOpen(false);
      setEditingConsultant(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        commission_rate: 0,
        active: true
      });
    }
  };

  const handleEdit = (consultant: any) => {
    setEditingConsultant(consultant);
    setFormData({
      name: consultant.name,
      email: consultant.email || '',
      phone: consultant.phone || '',
      commission_rate: consultant.commission_rate,
      active: consultant.active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteConsultant(id);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Consultores</h1>
          <p className="text-muted-foreground">Gerencie consultores, metas e comissões</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Novo Consultor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingConsultant ? 'Editar Consultor' : 'Cadastrar Consultor'}
                </DialogTitle>
                <DialogDescription>
                  {editingConsultant ? 'Atualize os dados do consultor' : 'Adicione um novo consultor ao sistema'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">Nome *</Label>
                  <Input 
                    id="nome" 
                    className="col-span-3"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    className="col-span-3"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="telefone" className="text-right">Telefone</Label>
                  <Input 
                    id="telefone" 
                    className="col-span-3"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="comissao" className="text-right">Comissão (%)</Label>
                  <Input 
                    id="comissao" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="100" 
                    className="col-span-3"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: Number(e.target.value) }))}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">Status</Label>
                  <Select 
                    value={formData.active ? 'ativo' : 'inativo'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, active: value === 'ativo' }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingConsultant(null);
                  setFormData({ name: '', email: '', phone: '', commission_rate: 0, active: true });
                }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingConsultant ? 'Atualizar' : 'Salvar'} Consultor
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard
              title="Consultores Ativos"
              value={consultoresAtivos}
              icon={UserCheck}
              subtitle={`${consultoresAtivos} de ${totalConsultores} consultores`}
            />
            <StatCard
              title="Total de Consultores"
              value={totalConsultores}
              icon={TrendingUp}
              subtitle="Cadastrados no sistema"
            />
            <StatCard
              title="Comissão Média"
              value={`${comissaoMedia.toFixed(1)}%`}
              icon={DollarSign}
              subtitle="Taxa média de comissão"
            />
            <StatCard
              title="Taxa de Atividade"
              value={`${totalConsultores > 0 ? Math.round((consultoresAtivos / totalConsultores) * 100) : 0}%`}
              icon={TrendingUp}
              subtitle="Consultores ativos/total"
            />
          </>
        )}
      </div>

      {/* Lista de consultores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Consultores</CardTitle>
          <CardDescription>
            Visualize performance e gerencie consultores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultoresFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {consultants.length === 0 ? 'Nenhum consultor cadastrado' : 'Nenhum consultor encontrado com os filtros aplicados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  consultoresFiltrados.map((consultor) => (
                <TableRow key={consultor.id}>
                  <TableCell className="font-medium">{consultor.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{consultor.phone || '-'}</div>
                      <div className="text-muted-foreground">{consultor.email || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={consultor.active ? 'default' : 'secondary'}>
                      {consultor.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>{consultor.commission_rate}%</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(consultor.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(consultor)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleConsultantStatus(consultor.id)}
                        title={consultor.active ? 'Desativar' : 'Ativar'}
                      >
                        {consultor.active ? 
                          <ToggleRight className="w-4 h-4 text-green-600" /> : 
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                        }
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o consultor "{consultor.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(consultor.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Consultores;
