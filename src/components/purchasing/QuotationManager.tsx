import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  Truck,
  DollarSign,
  Calendar,
  Building2,
} from 'lucide-react';
import { useQuotations, type Quotation } from '@/hooks/useQuotations';
import { usePurchasing } from '@/hooks/usePurchasing';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QuotationForm from './QuotationForm';
import QuotationComparison from './QuotationComparison';

const STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  approved: {
    label: 'Aprovada',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejeitada',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
};

export default function QuotationManager() {
  const {
    quotations,
    loading,
    fetchQuotations,
    updateQuotationStatus,
    compareQuotations,
  } = useQuotations();
  
  const { requisitions, fetchRequisitions } = usePurchasing();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequisition, setSelectedRequisition] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [selectedQuotations, setSelectedQuotations] = useState<Quotation[]>([]);

  useEffect(() => {
    fetchQuotations();
    fetchRequisitions();
  }, [fetchQuotations, fetchRequisitions]);

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = 
      quotation.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.quote_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    const matchesRequisition = selectedRequisition === 'all' || quotation.requisition_id === selectedRequisition;
    
    return matchesSearch && matchesStatus && matchesRequisition;
  });

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return date;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleCompareQuotations = (requisitionId: string | null | undefined) => {
    if (!requisitionId) {
      console.warn('requisition_id não fornecido');
      return;
    }

    console.log('Comparando cotações para requisição:', requisitionId);
    
    // Buscar todas as cotações pendentes para a requisição
    const quotationsForRequisition = quotations.filter(
      q => q.requisition_id === requisitionId && q.status === 'pending'
    );
    
    console.log('Cotações pendentes encontradas:', quotationsForRequisition.length);
    
    let quotationsToCompare: Quotation[] = [];
    
    if (quotationsForRequisition.length < 2) {
      // Se não houver pelo menos 2 pendentes, buscar todas as cotações da requisição
      const allQuotationsForRequisition = quotations.filter(
        q => q.requisition_id === requisitionId
      );
      
      console.log('Total de cotações para a requisição:', allQuotationsForRequisition.length);
      
      if (allQuotationsForRequisition.length < 2) {
        console.warn('É necessário pelo menos 2 cotações para comparar');
        return;
      }
      
      quotationsToCompare = allQuotationsForRequisition;
    } else {
      quotationsToCompare = quotationsForRequisition;
    }
    
    console.log('Abrindo modal de comparação com', quotationsToCompare.length, 'cotações');
    setSelectedQuotations(quotationsToCompare);
    setShowComparisonDialog(true);
  };

  const getQuotationStats = () => {
    const total = quotations.length;
    const pending = quotations.filter(q => q.status === 'pending').length;
    const approved = quotations.filter(q => q.status === 'approved').length;
    const rejected = quotations.filter(q => q.status === 'rejected').length;
    const totalValue = quotations
      .filter(q => q.status === 'approved')
      .reduce((sum, q) => sum + q.total_value, 0);

    return { total, pending, approved, rejected, totalValue };
  };

  const stats = getQuotationStats();

  // Agrupar cotações por requisição para facilitar comparação
  const quotationsByRequisition = quotations.reduce((acc, quotation) => {
    const reqId = quotation.requisition_id;
    // Ignorar cotações sem requisition_id
    if (!reqId) return acc;
    if (!acc[reqId]) {
      acc[reqId] = [];
    }
    acc[reqId].push(quotation);
    return acc;
  }, {} as Record<string, Quotation[]>);

  // Verificar se há pelo menos 2 cotações por requisição (para mostrar botão de comparar)
  const canCompareByRequisition = quotations.reduce((acc, quotation) => {
    const reqId = quotation.requisition_id;
    // Ignorar cotações sem requisition_id
    if (!reqId) return acc;
    if (!acc[reqId]) {
      acc[reqId] = { total: 0, pending: 0 };
    }
    acc[reqId].total++;
    if (quotation.status === 'pending') {
      acc[reqId].pending++;
    }
    return acc;
  }, {} as Record<string, { total: number; pending: number }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Sistema de Cotações</h2>
          <p className="text-muted-foreground">
            Gerencie cotações de fornecedores e compare propostas
          </p>
        </div>
        <Dialog 
        open={showCreateDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
          } else {
            setShowCreateDialog(open);
          }
        }}
      >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Cotação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Cotação</DialogTitle>
            </DialogHeader>
            {showCreateDialog && (
              <QuotationForm
                onSuccess={() => {
                  setShowCreateDialog(false);
                  fetchQuotations();
                }}
                onCancel={() => {
                  setShowCreateDialog(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejeitadas</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por fornecedor ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:w-48">
              <Label htmlFor="requisition">Requisição</Label>
              <Select value={selectedRequisition} onValueChange={setSelectedRequisition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Requisições</SelectItem>
                  {requisitions.map((req) => (
                    <SelectItem key={req.id} value={req.id}>
                      {req.requisition_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cotações */}
      <Card>
        <CardHeader>
          <CardTitle>Cotações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando cotações...</p>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma cotação encontrada</p>
              {searchTerm || statusFilter !== 'all' || selectedRequisition !== 'all' ? (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              ) : (
                <p className="text-sm">Crie uma nova cotação para começar</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-mono text-sm">
                        {quotation.quote_number || `COT-${quotation.id.slice(0, 8)}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{quotation.supplier?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatDate(quotation.quote_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {quotation.validity_date ? formatDate(quotation.validity_date) : '-'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(quotation.total_value)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          {quotation.delivery_time || quotation.supplier?.delivery_days || 0} dias
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(quotation.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {quotation.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuotationStatus(quotation.id, 'approved')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuotationStatus(quotation.id, 'rejected')}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                          
                          {/* Botão de comparação - só aparece se há múltiplas cotações para a mesma requisição */}
                          {(() => {
                            const reqId = quotation.requisition_id;
                            const canCompare = canCompareByRequisition[reqId];
                            const hasMultiple = (canCompare?.total || 0) >= 2;
                            
                            if (!hasMultiple) return null;
                            
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Botão Comparar clicado para requisição:', reqId);
                                  if (reqId) {
                                    handleCompareQuotations(reqId);
                                  } else {
                                    console.error('requisition_id é null ou undefined');
                                  }
                                }}
                              >
                                <Award className="w-4 h-4 mr-1" />
                                Comparar
                              </Button>
                            );
                          })()}
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

      {/* Modal de Comparação */}
      <Dialog 
        open={showComparisonDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setShowComparisonDialog(false);
            setSelectedQuotations([]);
          } else {
            setShowComparisonDialog(open);
          }
        }}
      >
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>Comparação de Cotações</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 min-h-0">
            {showComparisonDialog && selectedQuotations.length > 0 && (
              <QuotationComparison
                quotations={selectedQuotations}
                onApprove={(quotationId) => {
                  updateQuotationStatus(quotationId, 'approved');
                  // Rejeitar todas as outras cotações da mesma requisição
                  selectedQuotations
                    .filter(q => q.id !== quotationId)
                    .forEach(q => updateQuotationStatus(q.id, 'rejected'));
                  setShowComparisonDialog(false);
                  setSelectedQuotations([]);
                  fetchQuotations();
                }}
                onReject={(quotationId) => {
                  updateQuotationStatus(quotationId, 'rejected');
                  fetchQuotations();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
