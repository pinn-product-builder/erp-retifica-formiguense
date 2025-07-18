
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Check, 
  X,
  DollarSign,
  FileText,
  Clock
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useSupabase } from "@/hooks/useSupabase";
import { useQuery } from "@tanstack/react-query";

interface Budget {
  id: string;
  order_id: string;
  component: string;
  description: string;
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  status: 'pendente' | 'aprovado' | 'reprovado';
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  order?: {
    order_number: string;
    customer: {
      name: string;
    };
  };
}

const Orcamentos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { loading } = useSupabase();

  // Mock data - será substituído por dados reais do Supabase
  const mockBudgets: Budget[] = [
    {
      id: "1",
      order_id: "order-1",
      component: "bloco",
      description: "Retífica completa do bloco do motor",
      labor_cost: 800.00,
      parts_cost: 450.00,
      total_cost: 1250.00,
      status: "pendente",
      created_at: "2024-01-15T10:00:00Z",
      order: {
        order_number: "RF-2024-0001",
        customer: {
          name: "João Silva"
        }
      }
    },
    {
      id: "2",
      order_id: "order-2",
      component: "cabecote",
      description: "Reparo completo do cabeçote",
      labor_cost: 600.00,
      parts_cost: 320.00,
      total_cost: 920.00,
      status: "aprovado",
      approved_by: "Cliente",
      approved_at: "2024-01-14T14:30:00Z",
      created_at: "2024-01-14T10:00:00Z",
      order: {
        order_number: "RF-2024-0002",
        customer: {
          name: "Maria Santos"
        }
      }
    }
  ];

  const budgets = mockBudgets;

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.order?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.order?.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || budget.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: budgets.length,
    pendentes: budgets.filter(b => b.status === 'pendente').length,
    aprovados: budgets.filter(b => b.status === 'aprovado').length,
    reprovados: budgets.filter(b => b.status === 'reprovado').length,
    valorTotal: budgets.reduce((sum, b) => sum + b.total_cost, 0)
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "default",
      aprovado: "default",
      reprovado: "destructive"
    };
    
    const colors = {
      pendente: "bg-yellow-100 text-yellow-800",
      aprovado: "bg-green-100 text-green-800", 
      reprovado: "bg-red-100 text-red-800"
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">
            Gerencie orçamentos de serviços e acompanhe aprovações
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Orçamento</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo orçamento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Ordem de Serviço</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma ordem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order-1">RF-2024-0001 - João Silva</SelectItem>
                    <SelectItem value="order-2">RF-2024-0002 - Maria Santos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Componente</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o componente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bloco">Bloco</SelectItem>
                    <SelectItem value="cabecote">Cabeçote</SelectItem>
                    <SelectItem value="eixo">Eixo</SelectItem>
                    <SelectItem value="biela">Biela</SelectItem>
                    <SelectItem value="comando">Comando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea placeholder="Descreva os serviços necessários..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Mão de Obra</label>
                  <Input type="number" placeholder="0,00" />
                </div>
                <div>
                  <label className="text-sm font-medium">Peças</label>
                  <Input type="number" placeholder="0,00" />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button className="flex-1">
                  Criar Orçamento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Pendentes"
          value={stats.pendentes}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Aprovados"
          value={stats.aprovados}
          icon={Check}
          variant="success"
        />
        <StatCard
          title="Reprovados"
          value={stats.reprovados}
          icon={X}
          variant="danger"
        />
        <StatCard
          title="Valor Total"
          value={`R$ ${stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          variant="primary"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por número da ordem, cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Budgets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Componente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBudgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">
                    {budget.order?.order_number}
                  </TableCell>
                  <TableCell>{budget.order?.customer.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {budget.component.charAt(0).toUpperCase() + budget.component.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {budget.description}
                  </TableCell>
                  <TableCell className="font-medium">
                    R$ {budget.total_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{getStatusBadge(budget.status)}</TableCell>
                  <TableCell>
                    {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredBudgets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum orçamento encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou criar um novo orçamento</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orcamentos;
