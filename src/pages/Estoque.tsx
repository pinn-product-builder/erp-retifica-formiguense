import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  BookOpen,
  Archive,
  TrendingUp
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { usePartsInventory, type PartInventory } from "@/hooks/usePartsInventory";
import { PartForm } from "@/components/inventory/PartForm";
import { PartDetails } from "@/components/inventory/PartDetails";
import ReservationManager from "@/components/inventory/ReservationManager";
import { MovementHistory } from "@/components/inventory/MovementHistory";
import InventoryCountManager from "@/components/inventory/InventoryCountManager";
import PartsSeparationManager from "@/components/inventory/PartsSeparationManager";

const Estoque = () => {
  const { parts, loading, deletePart, fetchParts } = usePartsInventory();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [componentFilter, setComponentFilter] = useState<string>("todos");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<PartInventory | null>(null);

  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.part_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || part.status === statusFilter;
    const matchesComponent = componentFilter === 'todos' || part.component === componentFilter;

    return matchesSearch && matchesStatus && matchesComponent;
  });

  const stats = {
    total: parts.reduce((sum, p) => sum + p.quantity, 0),
    disponivel: parts.filter(p => p.status === 'disponivel').reduce((sum, p) => sum + p.quantity, 0),
    reservado: parts.filter(p => p.status === 'reservado').reduce((sum, p) => sum + p.quantity, 0),
    tipos: new Set(parts.map(p => p.part_code)).size,
    valor: parts.reduce((sum, p) => sum + (p.unit_cost * p.quantity), 0)
  };

  const getStatusBadge = (status: string) => {
    const config = {
      disponivel: { variant: 'default' as const, icon: CheckCircle, label: 'Disponível', color: 'bg-green-100 text-green-800' },
      reservado: { variant: 'secondary' as const, icon: Clock, label: 'Reservado', color: 'bg-yellow-100 text-yellow-800' },
      usado: { variant: 'secondary' as const, icon: Package, label: 'Usado', color: 'bg-blue-100 text-blue-800' },
      pendente: { variant: 'secondary' as const, icon: AlertCircle, label: 'Pendente', color: 'bg-gray-100 text-gray-800' }
    };

    const { icon: Icon, label, color } = config[status as keyof typeof config] || config.pendente;

    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getComponentLabel = (component?: string) => {
    const components = {
      bloco: "Bloco",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      pistao: "Pistão",
      biela: "Biela",
      comando: "Comando",
      eixo: "Eixo"
    };
    return component ? components[component as keyof typeof components] || component : '-';
  };

  const handleDelete = async () => {
    if (!selectedPart) return;
    
    const success = await deletePart(selectedPart.id);
    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedPart(null);
      fetchParts();
    }
  };

  if (loading && parts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando estoque...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie inventário, reservas e movimentações de peças
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Peça
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Peça ao Estoque</DialogTitle>
              <DialogDescription>
                Preencha os dados da peça para adicionar ao inventário
              </DialogDescription>
            </DialogHeader>
            <PartForm 
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                fetchParts();
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total de Peças"
          value={stats.total}
          icon={Package}
          subtitle="Quantidade total em estoque"
        />
        <StatCard
          title="Disponíveis"
          value={stats.disponivel}
          icon={CheckCircle}
          subtitle="Peças prontas para uso"
          variant="success"
        />
        <StatCard
          title="Reservadas"
          value={stats.reservado}
          icon={Clock}
          subtitle="Peças reservadas"
          variant="warning"
        />
        <StatCard
          title="Tipos de Peças"
          value={stats.tipos}
          icon={Package}
          subtitle="Códigos diferentes"
        />
        <StatCard
          title="Valor Total"
          value={`R$ ${stats.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Package}
          subtitle="Valor do estoque"
          variant="primary"
        />
      </div>

      {/* Tabs de Navegação */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventário
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Reservas
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Movimentações
          </TabsTrigger>
          <TabsTrigger value="separation" className="flex items-center gap-2">
            <Archive className="w-4 h-4" />
            Separação
          </TabsTrigger>
          <TabsTrigger value="counts" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Inventário Físico
          </TabsTrigger>
        </TabsList>

        {/* Aba de Inventário */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="usado">Usado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={componentFilter} onValueChange={setComponentFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Componentes</SelectItem>
                  <SelectItem value="bloco">Bloco</SelectItem>
                  <SelectItem value="cabecote">Cabeçote</SelectItem>
                  <SelectItem value="virabrequim">Virabrequim</SelectItem>
                  <SelectItem value="pistao">Pistão</SelectItem>
                  <SelectItem value="biela">Biela</SelectItem>
                  <SelectItem value="comando">Comando</SelectItem>
                  <SelectItem value="eixo">Eixo</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Parts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventário de Peças</CardTitle>
              <CardDescription>
                {filteredParts.length} {filteredParts.length === 1 ? 'peça' : 'peças'} encontrada{filteredParts.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Componente</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor Unit.</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">
                        {part.part_code || '-'}
                      </TableCell>
                      <TableCell>{part.part_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getComponentLabel(part.component)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={part.quantity < 5 ? 'text-red-600 font-bold' : ''}>
                          {part.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        R$ {part.unit_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {(part.unit_cost * part.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{getStatusBadge(part.status)}</TableCell>
                      <TableCell>{part.supplier || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPart(part);
                              setIsDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPart(part);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPart(part);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredParts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhuma peça encontrada.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Reservas */}
        <TabsContent value="reservations" className="space-y-4">
          <ReservationManager />
        </TabsContent>

        {/* Aba de Movimentações */}
        <TabsContent value="movements" className="space-y-4">
          <MovementHistory />
        </TabsContent>

        {/* Aba de Separação de Peças */}
        <TabsContent value="separation" className="space-y-4">
          <PartsSeparationManager />
        </TabsContent>

        {/* Aba de Inventário Físico */}
        <TabsContent value="counts" className="space-y-4">
          <InventoryCountManager />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Peça</DialogTitle>
            <DialogDescription>
              Atualize as informações da peça no estoque
            </DialogDescription>
          </DialogHeader>
          {selectedPart && (
            <PartForm 
              part={selectedPart} 
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedPart(null);
                fetchParts();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Peça</DialogTitle>
          </DialogHeader>
          {selectedPart && <PartDetails part={selectedPart} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta peça do estoque? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedPart && (
            <div className="py-4">
              <p className="font-medium">{selectedPart.part_name}</p>
              <p className="text-sm text-muted-foreground">
                Código: {selectedPart.part_code || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                Quantidade: {selectedPart.quantity}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;
