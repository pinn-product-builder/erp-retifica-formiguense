
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, AlertTriangle, Plus, Search, Filter, TrendingDown } from "lucide-react";
import { StatCard } from "@/components/StatCard";

const Estoque = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Dados de exemplo para estoque
  const pecas = [
    {
      id: 1,
      codigo: "PIV-001",
      nome: "Pistão 1.0 8V",
      categoria: "Pistão",
      quantidade: 15,
      minimo: 10,
      preco: 45.90,
      fornecedor: "AutoPeças SP",
      localizacao: "A1-P2"
    },
    {
      id: 2,
      codigo: "BIE-002", 
      nome: "Biela Corsa 1.4",
      categoria: "Biela",
      quantidade: 5,
      minimo: 8,
      preco: 89.50,
      fornecedor: "Metal Parts",
      localizacao: "B2-P1"
    },
    {
      id: 3,
      codigo: "VAL-003",
      nome: "Válvula Admissão",
      categoria: "Válvula", 
      quantidade: 25,
      minimo: 20,
      preco: 12.30,
      fornecedor: "Válvulas Brasil",
      localizacao: "C1-P3"
    },
    {
      id: 4,
      codigo: "RET-004",
      nome: "Retentor Válvula",
      categoria: "Vedação",
      quantidade: 3,
      minimo: 15,
      preco: 2.80,
      fornecedor: "Vedações Tech",
      localizacao: "D1-P1"
    }
  ];

  const pecasFiltradas = pecas.filter(peca => {
    const matchesSearch = peca.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         peca.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'todos' || peca.categoria === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPecas = pecas.length;
  const pecasAbaixoMinimo = pecas.filter(p => p.quantidade < p.minimo).length;
  const valorTotalEstoque = pecas.reduce((sum, p) => sum + (p.quantidade * p.preco), 0);
  const categorias = [...new Set(pecas.map(p => p.categoria))];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estoque de Peças</h1>
          <p className="text-muted-foreground">Controle de inventário e alertas de reposição</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Peça
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Peça</DialogTitle>
              <DialogDescription>
                Adicione uma nova peça ao estoque
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="codigo" className="text-right">Código</Label>
                <Input id="codigo" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right">Nome</Label>
                <Input id="nome" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoria" className="text-right">Categoria</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pistao">Pistão</SelectItem>
                    <SelectItem value="biela">Biela</SelectItem>
                    <SelectItem value="valvula">Válvula</SelectItem>
                    <SelectItem value="vedacao">Vedação</SelectItem>
                    <SelectItem value="rolamento">Rolamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantidade" className="text-right">Quantidade</Label>
                <Input id="quantidade" type="number" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minimo" className="text-right">Mínimo</Label>
                <Input id="minimo" type="number" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="preco" className="text-right">Preço</Label>
                <Input id="preco" type="number" step="0.01" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsDialogOpen(false)}>
                Salvar Peça
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total de Peças"
          value={totalPecas}
          icon={Package}
          subtitle="Itens cadastrados"
        />
        <StatCard
          title="Alertas de Reposição"
          value={pecasAbaixoMinimo}
          icon={AlertTriangle}
          subtitle="Abaixo do mínimo"
        />
        <StatCard
          title="Valor do Estoque"
          value={`R$ ${valorTotalEstoque.toFixed(2)}`}
          icon={TrendingDown}
          subtitle="Valor total"
        />
        <StatCard
          title="Categorias"
          value={categorias.length}
          icon={Filter}
          subtitle="Tipos diferentes"
        />
      </div>

      {/* Alertas */}
      {pecasAbaixoMinimo > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Atenção: Peças com estoque baixo
            </CardTitle>
            <CardDescription className="text-orange-700">
              {pecasAbaixoMinimo} peça(s) estão abaixo do estoque mínimo e precisam de reposição
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Lista de peças */}
      <Card>
        <CardHeader>
          <CardTitle>Inventário de Peças</CardTitle>
          <CardDescription>
            Visualize e gerencie o estoque de peças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {categorias.map(categoria => (
                  <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Preço Unit.</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pecasFiltradas.map((peca) => (
                <TableRow key={peca.id}>
                  <TableCell className="font-medium">{peca.codigo}</TableCell>
                  <TableCell>{peca.nome}</TableCell>
                  <TableCell>{peca.categoria}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{peca.quantidade}</span>
                      {peca.quantidade < peca.minimo && (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={peca.quantidade >= peca.minimo ? 'default' : 'destructive'}>
                      {peca.quantidade >= peca.minimo ? 'OK' : 'Baixo'}
                    </Badge>
                  </TableCell>
                  <TableCell>R$ {peca.preco.toFixed(2)}</TableCell>
                  <TableCell>{peca.localizacao}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="outline" size="sm">Movimentar</Button>
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

export default Estoque;
