
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Building2, UserPlus, Search, Filter, Phone } from "lucide-react";
import { StatCard } from "@/components/StatCard";

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Dados de exemplo para clientes
  const clientes = [
    {
      id: 1,
      nome: "João da Silva",
      tipo: "direto",
      documento: "123.456.789-00",
      telefone: "(11) 99999-7777",
      email: "joao@email.com",
      endereco: "Rua A, 123 - São Paulo/SP",
      servicos: 5,
      ultimoServico: "2024-01-15"
    },
    {
      id: 2,
      nome: "Oficina do Pedro",
      tipo: "oficina",
      documento: "12.345.678/0001-90",
      telefone: "(11) 99999-8888",
      email: "contato@oficinapedro.com",
      endereco: "Av. B, 456 - Santos/SP",
      servicos: 12,
      ultimoServico: "2024-01-18",
      nomeOficina: "Oficina do Pedro",
      cnpjOficina: "12.345.678/0001-90",
      contatoOficina: "Pedro Santos"
    },
    {
      id: 3,
      nome: "Maria Costa",
      tipo: "direto",
      documento: "987.654.321-00",
      telefone: "(11) 99999-9999",
      email: "maria@email.com",
      endereco: "Rua C, 789 - Campinas/SP",
      servicos: 2,
      ultimoServico: "2024-01-10"
    },
    {
      id: 4,
      nome: "AutoCenter Central",
      tipo: "oficina",
      documento: "98.765.432/0001-10",
      telefone: "(11) 99999-0000",
      email: "vendas@autocentral.com",
      endereco: "Rod. D, 1000 - Guarulhos/SP",
      servicos: 8,
      ultimoServico: "2024-01-20",
      nomeOficina: "AutoCenter Central",
      cnpjOficina: "98.765.432/0001-10",
      contatoOficina: "Ana Pereira"
    }
  ];

  const clientesFiltrados = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.documento.includes(searchTerm) ||
                         cliente.telefone.includes(searchTerm);
    const matchesType = filterType === 'todos' || cliente.tipo === filterType;
    return matchesSearch && matchesType;
  });

  const totalClientes = clientes.length;
  const clientesDiretos = clientes.filter(c => c.tipo === 'direto').length;
  const oficinas = clientes.filter(c => c.tipo === 'oficina').length;
  const totalServicos = clientes.reduce((sum, c) => sum + c.servicos, 0);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie clientes diretos e oficinas parceiras</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Cliente</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] mx-4">
            <DialogHeader>
              <DialogTitle>Cadastrar Cliente</DialogTitle>
              <DialogDescription>
                Adicione um novo cliente ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tipo" className="text-right">Tipo</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direto">Cliente Direto</SelectItem>
                    <SelectItem value="oficina">Oficina Parceira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right">Nome</Label>
                <Input id="nome" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="documento" className="text-right">CPF/CNPJ</Label>
                <Input id="documento" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="telefone" className="text-right">Telefone</Label>
                <Input id="telefone" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endereco" className="text-right">Endereço</Label>
                <Input id="endereco" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsDialogOpen(false)}>
                Salvar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total de Clientes"
          value={totalClientes}
          icon={Users}
          subtitle="Ativos no sistema"
        />
        <StatCard
          title="Clientes Diretos"
          value={clientesDiretos}
          icon={Users}
          subtitle="Pessoa física"
        />
        <StatCard
          title="Oficinas Parceiras"
          value={oficinas}
          icon={Building2}
          subtitle="Pessoa jurídica"
        />
        <StatCard
          title="Total de Serviços"
          value={totalServicos}
          icon={Phone}
          subtitle="Serviços realizados"
        />
      </div>

      {/* Lista de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, documento ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="direto">Clientes Diretos</SelectItem>
                <SelectItem value="oficina">Oficinas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome/Razão Social</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Serviços</TableHead>
                <TableHead>Último Serviço</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="min-w-[150px]">
                    <div>
                      <div className="font-medium truncate">{cliente.nome}</div>
                      {cliente.tipo === 'oficina' && cliente.contatoOficina && (
                        <div className="text-sm text-muted-foreground truncate">
                          Contato: {cliente.contatoOficina}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[100px]">
                    <Badge variant={cliente.tipo === 'direto' ? 'default' : 'secondary'}>
                      {cliente.tipo === 'direto' ? 'Direto' : 'Oficina'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm min-w-[140px]">{cliente.documento}</TableCell>
                  <TableCell className="min-w-[160px]">
                    <div className="text-sm">
                      <div className="truncate">{cliente.telefone}</div>
                      <div className="text-muted-foreground truncate">{cliente.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[100px]">
                    <Badge variant="outline">
                      {cliente.servicos} serviços
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[110px]">
                    <div className="text-sm">
                      {new Date(cliente.ultimoServico).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <div className="flex gap-1 sm:gap-2">
                      <Button variant="outline" size="sm" className="text-xs">Editar</Button>
                      <Button variant="outline" size="sm" className="text-xs">Histórico</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clientes;
