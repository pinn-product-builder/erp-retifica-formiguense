
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  XCircle,
  Copy,
  Download,
  Trash2
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useDetailedBudgets, type DetailedBudget } from "@/hooks/useDetailedBudgets";
import { useQuery } from "@tanstack/react-query";
import BudgetApprovalModal from "@/components/budgets/BudgetApprovalModal";
import BudgetDetails from "@/components/budgets/BudgetDetails";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useBudgetReports } from "@/hooks/useBudgetReports";
import { BUDGET_STATUS, translateStatus, translateAction, translateMessage } from "@/utils/statusTranslations";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { ResponsiveModalContent } from "@/components/ui/responsive-modal";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useModuleGuard } from "@/hooks/useRoleGuard";

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const Orcamentos = () => {
  const { hasPermission, permissions } = useModuleGuard('orders', 'read', { blockAccess: true });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [componentFilter, setComponentFilter] = useState<string>("todos");
  const [selectedBudget, setSelectedBudget] = useState<DetailedBudget | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<DetailedBudget | null>(null);
  const [duplicatedBudgetData, setDuplicatedBudgetData] = useState<Partial<DetailedBudget> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [budgetToDelete, setBudgetToDelete] = useState<DetailedBudget | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { generateBudgetReport, printBudgetReport } = useBudgetReports();
  
  const { getDetailedBudgets, createDetailedBudget, updateDetailedBudget, duplicateBudget, deleteDetailedBudget, loading } = useDetailedBudgets();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  
  const canEdit = permissions.canEditModule('orders');

  // Buscar orçamentos detalhados
  const { data: budgets = [], refetch, isLoading: queryLoading } = useQuery({
    queryKey: ['detailed-budgets', statusFilter, componentFilter],
    queryFn: () => getDetailedBudgets({
      status: statusFilter === 'todos' ? undefined : statusFilter,
      component: componentFilter === 'todos' ? undefined : componentFilter
    }),
    enabled: !!currentOrganization?.id
  });

  const filteredBudgets = React.useMemo(() => {
    const filtered = budgets.filter(budget => {
      // Se não há termo de busca, mostrar todos
      if (!searchTerm) return true;
      
      const orderNumber = budget.order?.order_number?.toLowerCase() || '';
      const customerName = budget.order?.customer?.name?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = orderNumber.includes(searchLower) || customerName.includes(searchLower);
      
      return matchesSearch;
    });
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [budgets, searchTerm]);

  const paginatedBudgets = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredBudgets.slice(startIndex, endIndex);
  }, [filteredBudgets, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredBudgets.length / pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, componentFilter]);

  const stats = {
    total: budgets.length,
    rascunhos: budgets.filter(b => b.status === 'draft').length,
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
      draft: translateStatus('draft', 'budget'),
      approved: translateStatus('approved', 'budget'),
      partially_approved: translateStatus('partial', 'budget'),
      rejected: translateStatus('rejected', 'budget')
    };

    const icons = {
      draft: <Clock className="w-3 h-3 mr-1" />,
      approved: <CheckCircle className="w-3 h-3 mr-1" />,
      partially_approved: <AlertTriangle className="w-3 h-3 mr-1" />,
      rejected: <XCircle className="w-3 h-3 mr-1" />
    };

    return (
      <Badge className={`${colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"} text-xs px-2 py-1`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleDuplicate = async (budget: DetailedBudget) => {
    const result = await duplicateBudget(budget.id);
    if (result) {
      // Guardar os dados duplicados e abrir formulário
      setDuplicatedBudgetData(result as Partial<DetailedBudget>);
      setEditingBudget(null); // Modo criar novo, não editar
      setIsFormOpen(true);
      
      toast({
        title: "Dados copiados!",
        description: "Selecione a ordem e componente para criar o novo orçamento.",
      });
    }
  };

  const handleApprovalCreated = () => {
    refetch();
    setIsApprovalModalOpen(false);
    setSelectedBudget(null);
  };

  const handleCreateBudget = async (budgetData: Partial<DetailedBudget>) => {
    const result = await createDetailedBudget(budgetData);
    if (result) {
      refetch();
      setIsFormOpen(false);
      setDuplicatedBudgetData(null); // Limpar dados duplicados
    }
  };

  const handleUpdateBudget = async (budgetData: Partial<DetailedBudget>) => {
    if (!editingBudget) return;
    const result = await updateDetailedBudget(editingBudget.id, budgetData);
    if (result) {
      refetch();
      setIsFormOpen(false);
      setEditingBudget(null);
    }
  };

  const handleEditBudget = (budget: DetailedBudget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;
    
    const success = await deleteDetailedBudget(budgetToDelete.id);
    if (success) {
      refetch();
      setIsDeleteDialogOpen(false);
      setBudgetToDelete(null);
    }
  };

  const handleGenerateReport = async () => {
    const reportData = await generateBudgetReport();
    if (reportData) {
      printBudgetReport(reportData);
    }
  };

  // Estado de carregamento combinado
  const isPageLoading = loading || queryLoading || !currentOrganization;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">
            Acompanhe e processe aprovações de orçamentos gerados automaticamente
          </p>
        </div>
        
        {canEdit && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={handleGenerateReport}
              disabled={isPageLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Relatório
            </Button>
            <Button 
              onClick={() => {
                setEditingBudget(null);
                setDuplicatedBudgetData(null);
                setIsFormOpen(true);
              }}
              disabled={isPageLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Rascunhos"
          value={stats.rascunhos}
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
          value={formatCurrency(stats.valorTotal)}
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
                <SelectItem value="draft">{translateStatus('draft', 'budget')}</SelectItem>
                <SelectItem value="approved">{translateStatus('approved', 'budget')}</SelectItem>
                <SelectItem value="partially_approved">{translateStatus('partial', 'budget')}</SelectItem>
                <SelectItem value="rejected">{translateStatus('rejected', 'budget')}</SelectItem>
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
          <ResponsiveTable
            data={paginatedBudgets}
            keyExtractor={(budget) => budget.id}
            emptyMessage="Nenhum orçamento encontrado"
            columns={[
              {
                key: 'budget_number',
                header: 'Nº Orçamento',
                mobileLabel: 'Nº Orçamento',
                priority: 1,
                minWidth: 120,
                render: (budget) => (
                  <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                    {budget.budget_number || `#${budget.id.slice(-6)}`}
                  </span>
                )
              },
              {
                key: 'order',
                header: 'Ordem',
                mobileLabel: 'Ordem',
                priority: 2,
                minWidth: 100,
                render: (budget) => (
                  <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                    {budget.order?.order_number || '-'}
                  </span>
                )
              },
              {
                key: 'customer',
                header: 'Cliente',
                mobileLabel: 'Cliente',
                priority: 3,
                minWidth: 150,
                render: (budget) => <span className="text-xs sm:text-sm">{budget.order?.customer?.name || '-'}</span>
              },
              {
                key: 'component',
                header: 'Componente',
                mobileLabel: 'Componente',
                priority: 4,
                minWidth: 120,
                render: (budget) => (
                  <Badge variant="outline" className="text-xs">
                    {budget.component.charAt(0).toUpperCase() + budget.component.slice(1)}
                  </Badge>
                )
              },
              {
                key: 'total_amount',
                header: 'Valor Total',
                mobileLabel: 'Valor',
                priority: 2,
                minWidth: 120,
                render: (budget) => (
                  <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                    {formatCurrency(budget.total_amount)}
                  </span>
                )
              },
              {
                key: 'status',
                header: 'Status',
                mobileLabel: 'Status',
                priority: 3,
                minWidth: 100,
                render: (budget) => getStatusBadge(budget.status)
              },
              {
                key: 'created_at',
                header: 'Data',
                mobileLabel: 'Data',
                priority: 5,
                minWidth: 100,
                hideInMobile: true,
                render: (budget) => new Date(budget.created_at).toLocaleDateString('pt-BR')
              },
              {
                key: 'actions',
                header: 'Ações',
                mobileLabel: 'Ações',
                priority: 1,
                minWidth: 150,
                render: (budget) => (
                  <div className="flex gap-0.5 sm:gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      onClick={() => {
                        setSelectedBudget(budget);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    {canEdit && (
                      <>
                        {budget.status === 'draft' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              onClick={() => handleEditBudget(budget)}
                            >
                              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              onClick={() => {
                                setSelectedBudget(budget);
                                setIsApprovalModalOpen(true);
                              }}
                            >
                              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          onClick={() => handleDuplicate(budget)}
                        >
                          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                        {budget.status === 'draft' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setBudgetToDelete(budget);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )
              }
            ]}
          />
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                        }
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                        }
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="text-center text-sm text-muted-foreground mt-2">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredBudgets.length)} de {filteredBudgets.length} orçamentos
              </div>
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
        <ResponsiveModalContent size="xl">
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
        </ResponsiveModalContent>
      </Dialog>

      {/* Modal de Formulário de Orçamento */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) {
          setEditingBudget(null);
          setDuplicatedBudgetData(null);
        }
      }}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingBudget 
                ? 'Atualize os dados do orçamento. Apenas orçamentos em rascunho podem ser editados.'
                : 'Preencha os dados para criar um novo orçamento detalhado.'
              }
            </DialogDescription>
          </DialogHeader>
          <BudgetForm
            budget={(editingBudget || duplicatedBudgetData || undefined) as DetailedBudget | undefined}
            onSave={editingBudget ? handleUpdateBudget : handleCreateBudget}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingBudget(null);
              setDuplicatedBudgetData(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o orçamento <strong>{budgetToDelete?.budget_number || `#${budgetToDelete?.id.slice(-6)}`}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setBudgetToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBudget}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orcamentos;
