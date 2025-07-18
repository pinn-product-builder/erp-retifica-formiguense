
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, TrendingUp, UserPlus, Search, Filter, DollarSign } from "lucide-react";
import { StatCard } from "@/components/StatCard";

const Consultores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Dados de exemplo para consultores
  const consultores = [
    {
      id: 1,
      nome: "Carlos Vendas",
      email: "carlos@retifica.com",
      telefone: "(11) 99999-4444",
      status: "ativo",
      vendas: 25,
      meta: 30,
      comissao: 0.05,
      valorVendido: 15750.00
    },
    {
      id: 2,
      nome: "Ana Comercial",
      email: "ana@retifica.com", 
      telefone: "(11) 99999-5555",
      status: "ativo",
      vendas: 32,
      meta: 30,
      comissao: 0.06,
      valorVendido: 22100.00
    },
    {
      id: 3,
      nome: "Roberto Silva",
      email: "roberto@retifica.com",
      telefone: "(11) 99999-6666", 
      status: "inativo",
      vendas: 0,
      meta: 30,
      comissao: 0.04,
      valorVendido: 0
    }
  ];

  const consultoresFiltrados = consultores.filter(consultor => {
    const matchesSearch = consultor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || consultor.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const consultoresAtivos = consultores.filter(c => c.status === 'ativo').length;
  const totalVendas = consultores.reduce((sum, c) => sum + c.vendas, 0);
  const valorTotalVendido = consultores.reduce((sum, c) => sum + c.valorVendido, 0);
  const mediaVendasPorConsultor = totalVendas / consultores.filter(c => c.status === 'ativo').length;

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
            <DialogHeader>
              <DialogTitle>Cadastrar Consultor</DialogTitle>
              <DialogDescription>
                Adicione um novo consultor ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right">Nome</Label>
                <Input id="nome" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="telefone" className="text-right">Telefone</Label>
                <Input id="telefone" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comissao" className="text-right">Comissão (%)</Label>
                <Input id="comissao" type="number" step="0.01" min="0" max="100" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="meta" className="text-right">Meta Mensal</Label>
                <Input id="meta" type="number" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsDialogOpen(false)}>
                Salvar Consultor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Consultores Ativos"
          value={consultoresAtivos}
          icon={UserCheck}
          subtitle="Trabalhando atualmente"
        />
        <StatCard
          title="Total de Vendas"
          value={totalVendas}
          icon={TrendingUp}
          subtitle="Vendas do mês"
        />
        <StatCard
          title="Valor Total Vendido"
          value={`R$ ${valorTotalVendido.toFixed(2)}`}
          icon={DollarSign}
          subtitle="Faturamento do mês"
        />
        <StatCard
          title="Média por Consultor"
          value={Math.round(mediaVendasPorConsultor || 0)}
          icon={TrendingUp}
          subtitle="Vendas/consultor"
        />
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vendas/Meta</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Valor Vendido</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultoresFiltrados.map((consultor) => (
                <TableRow key={consultor.id}>
                  <TableCell className="font-medium">{consultor.nome}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{consultor.telefone}</div>
                      <div className="text-muted-foreground">{consultor.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={consultor.status === 'ativo' ? 'default' : 'secondary'}>
                      {consultor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{consultor.vendas} / {consultor.meta}</div>
                      <div className="text-muted-foreground">
                        {Math.round((consultor.vendas / consultor.meta) * 100)}% da meta
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        consultor.vendas >= consultor.meta 
                          ? 'default' 
                          : consultor.vendas >= consultor.meta * 0.8 
                            ? 'secondary' 
                            : 'destructive'
                      }
                    >
                      {consultor.vendas >= consultor.meta 
                        ? 'Acima da meta' 
                        : consultor.vendas >= consultor.meta * 0.8 
                          ? 'Próximo da meta' 
                          : 'Abaixo da meta'
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>{(consultor.comissao * 100).toFixed(1)}%</TableCell>
                  <TableCell>R$ {consultor.valorVendido.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="outline" size="sm">Relatório</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Consultores;
