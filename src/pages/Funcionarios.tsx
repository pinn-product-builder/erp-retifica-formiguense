
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Clock, UserPlus, Search, Filter } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useEmployees } from "@/hooks/useEmployees";

const Funcionarios = () => {
  const { employees, timeTracking, loading } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filtrar funcionários
  const funcionariosFiltrados = employees.filter(employee => {
    const matchesSearch = 
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'todos' || 
      (filterStatus === 'ativo' && employee.is_active) ||
      (filterStatus === 'inativo' && !employee.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Calcular estatísticas
  const funcionariosAtivos = employees.filter(emp => emp.is_active).length;
  const totalFuncionarios = employees.length;
  
  // Calcular horas trabalhadas do mês atual
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const horasDoMes = timeTracking.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() + 1 === currentMonth && 
           entryDate.getFullYear() === currentYear &&
           entry.status === 'present';
  });
  
  const totalHorasTrabalhadas = horasDoMes.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
  const mediaHorasPorFuncionario = funcionariosAtivos > 0 ? totalHorasTrabalhadas / funcionariosAtivos : 0;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie funcionários e apontamento de horas</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Funcionário</DialogTitle>
              <DialogDescription>
                Adicione um novo funcionário ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right">Nome</Label>
                <Input id="nome" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cargo" className="text-right">Cargo</Label>
                <Input id="cargo" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="setor" className="text-right">Setor</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bloco">Bloco</SelectItem>
                    <SelectItem value="cabecote">Cabeçote</SelectItem>
                    <SelectItem value="biela">Biela</SelectItem>
                    <SelectItem value="comando">Comando</SelectItem>
                    <SelectItem value="eixo">Eixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="telefone" className="text-right">Telefone</Label>
                <Input id="telefone" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsDialogOpen(false)}>
                Salvar Funcionário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total de Funcionários"
          value={totalFuncionarios}
          icon={Users}
          subtitle="Ativos e inativos"
        />
        <StatCard
          title="Funcionários Ativos"
          value={funcionariosAtivos}
          icon={Users}
          subtitle="Trabalhando atualmente"
        />
        <StatCard
          title="Horas Trabalhadas"
          value={Math.round(totalHorasTrabalhadas)}
          icon={Clock}
          subtitle="Total do mês"
        />
        <StatCard
          title="Média por Funcionário"
          value={Math.round(mediaHorasPorFuncionario)}
          icon={Clock}
          subtitle="Horas/mês"
        />
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os funcionários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou cargo..."
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Horas/Meta</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">Carregando funcionários...</p>
                  </TableCell>
                </TableRow>
              ) : funcionariosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum funcionário encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                funcionariosFiltrados.map((employee) => {
                  // Calcular horas do funcionário no mês atual
                  const employeeHours = horasDoMes
                    .filter(entry => entry.employee_id === employee.id)
                    .reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
                  
                  const metaHoras = 176; // Meta padrão de horas mensais
                  
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name || 'Sem nome'}</TableCell>
                      <TableCell>{employee.position || '-'}</TableCell>
                      <TableCell>{employee.department || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                          {employee.is_active ? 'ativo' : 'inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{Math.round(employeeHours)}h / {metaHoras}h</div>
                          <div className="text-muted-foreground">
                            {metaHoras > 0 ? Math.round((employeeHours / metaHoras) * 100) : 0}% da meta
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{employee.phone || '-'}</div>
                          <div className="text-muted-foreground">{employee.email || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Editar</Button>
                          <Button variant="outline" size="sm">Horas</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Funcionarios;
