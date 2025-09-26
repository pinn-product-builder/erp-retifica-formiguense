
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
  Check, 
  X,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Copy,
  Download
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useDetailedBudgets, type DetailedBudget } from "@/hooks/useDetailedBudgets";
import { useQuery } from "@tanstack/react-query";
import BudgetApprovalModal from "@/components/budgets/BudgetApprovalModal";
import BudgetDetails from "@/components/budgets/BudgetDetails";
import { useToast } from "@/hooks/use-toast";

const Orcamentos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [componentFilter, setComponentFilter] = useState<string>("todos");
  const [selectedBudget, setSelectedBudget] = useState<DetailedBudget | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const { getDetailedBudgets, duplicateBudget, loading } = useDetailedBudgets();
  const { toast } = useToast();

  // Buscar orçamentos detalhados
  const { data: budgets = [], refetch } = useQuery({
    queryKey: ['detailed-budgets', statusFilter, componentFilter],
    queryFn: () => getDetailedBudgets({
      status: statusFilter === 'todos' ? undefined : statusFilter,
      component: componentFilter === 'todos' ? undefined : componentFilter
    }),
    enabled: true
  });

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.order?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.order?.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const stats = {
    total: budgets.length,
    pendentes: budgets.filter(b => b.status === 'draft').length,
    aprovados: budgets.filter(b => b.status === 'approved').length,
    reprovados: budgets.filter(b => b.status === 'rejected').length,
    parciais: budgets.filter(b => b.status === 'partially_approved').length,
    valorTotal: budgets.reduce((sum, b) => sum + b.total_amount, 0)
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      approved: "bg-green-100 text-green-800", 
      partially_approved: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800"
    };

    const labels = {
      draft: "Rascunho",
      approved: "Aprovado",
      partially_approved: "Parcial",
      rejected: "Rejeitado"
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleDuplicate = async (budget: DetailedBudget) => {
    const result = await duplicateBudget(budget.id);
    if (result) {
      refetch();
    }
  };

  const handleApprovalCreated = () => {
    refetch();
    setIsApprovalModalOpen(false);
    setSelectedBudget(null);
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
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Rascunhos"
          value={stats.pendentes}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Aprovados"
          value={stats.aprovados}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Parciais"
          value={stats.parciais}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Rejeitados"
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
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="partially_approved">Parcial</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={componentFilter} onValueChange={setComponentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Componente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Componentes</SelectItem>
                <SelectItem value="bloco">Bloco</SelectItem>
                <SelectItem value="cabecote">Cabeçote</SelectItem>
                <SelectItem value="eixo">Eixo</SelectItem>
                <SelectItem value="biela">Biela</SelectItem>
                <SelectItem value="comando">Comando</SelectItem>
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
                <TableHead>Nº Orçamento</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Componente</TableHead>
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
                    {budget.budget_number || `#${budget.id.slice(-6)}`}
                  </TableCell>
                  <TableCell className="font-medium">
                    {budget.order?.order_number}
                  </TableCell>
                  <TableCell>{budget.order?.customer.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {budget.component.charAt(0).toUpperCase() + budget.component.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    R$ {budget.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{getStatusBadge(budget.status)}</TableCell>
                  <TableCell>
                    {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedBudget(budget);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {budget.status === 'draft' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedBudget(budget);
                            setIsApprovalModalOpen(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDuplicate(budget)}
                      >
                        <Copy className="w-4 h-4" />
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

      {/* Modais */}
      <BudgetApprovalModal
        budget={selectedBudget}
        open={isApprovalModalOpen}
        onOpenChange={setIsApprovalModalOpen}
        onApprovalCreated={handleApprovalCreated}
      />

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Orçamento</DialogTitle>
          </DialogHeader>
          {selectedBudget && (
            <BudgetDetails
              budget={selectedBudget}
              onDuplicate={() => {
                handleDuplicate(selectedBudget);
                setIsDetailsModalOpen(false);
              }}
              onGeneratePDF={() => {
                toast({
                  title: "Funcionalidade em desenvolvimento",
                  description: "A geração de PDF será implementada em breve"
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orcamentos;
