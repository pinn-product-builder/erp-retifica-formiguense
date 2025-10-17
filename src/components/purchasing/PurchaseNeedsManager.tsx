import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Search,
  Filter,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  TrendingDown,
  ShoppingCart,
  RefreshCw,
  FileText,
  Building2,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { usePurchaseNeeds, type PurchaseNeed } from '@/hooks/usePurchaseNeeds';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PurchaseNeedForm from './PurchaseNeedForm';

const PRIORITY_CONFIG = {
  critical: {
    label: 'Crítica',
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
  },
  high: {
    label: 'Alta',
    color: 'bg-orange-100 text-orange-800',
    icon: TrendingDown,
  },
  medium: {
    label: 'Média',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  low: {
    label: 'Baixa',
    color: 'bg-blue-100 text-blue-800',
    icon: Package,
  },
};

const STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  in_quotation: {
    label: 'Em Cotação',
    color: 'bg-blue-100 text-blue-800',
    icon: FileText,
  },
  ordered: {
    label: 'Pedido',
    color: 'bg-green-100 text-green-800',
    icon: ShoppingCart,
  },
  received: {
    label: 'Recebido',
    color: 'bg-green-200 text-green-900',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-gray-100 text-gray-800',
    icon: AlertTriangle,
  },
};

export default function PurchaseNeedsManager() {
  const {
    needs,
    loading,
    fetchNeeds,
    updateNeedStatus,
    generateAutoNeeds,
    convertToRequisition,
    getNeedsStats,
    getCriticalNeeds,
  } = usePurchaseNeeds();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [generatingAuto, setGeneratingAuto] = useState(false);
  const [convertingToReq, setConvertingToReq] = useState(false);

  useEffect(() => {
    fetchNeeds();
  }, [fetchNeeds]);

  const filteredNeeds = needs.filter(need => {
    const matchesSearch = 
      need.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      need.part_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || need.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || need.priority_level === priorityFilter;
    const matchesType = typeFilter === 'all' || need.need_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const stats = getNeedsStats();
  const criticalNeeds = getCriticalNeeds();

  const getPriorityBadge = (priority: string) => {
    const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

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

  const handleSelectNeed = (needId: string, checked: boolean) => {
    if (checked) {
      setSelectedNeeds(prev => [...prev, needId]);
    } else {
      setSelectedNeeds(prev => prev.filter(id => id !== needId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNeeds(filteredNeeds.map(need => need.id));
    } else {
      setSelectedNeeds([]);
    }
  };

  const handleGenerateAutoNeeds = async () => {
    setGeneratingAuto(true);
    await generateAutoNeeds();
    setGeneratingAuto(false);
  };

  const handleConvertToRequisition = async () => {
    if (selectedNeeds.length === 0) return;
    
    setConvertingToReq(true);
    const result = await convertToRequisition(selectedNeeds);
    if (result) {
      setSelectedNeeds([]);
    }
    setConvertingToReq(false);
  };

  const getTypeLabel = (type: string) => {
    const types = {
      auto_reorder: 'Reposição Automática',
      manual_request: 'Solicitação Manual',
      project_requirement: 'Projeto',
      maintenance: 'Manutenção',
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Necessidades de Compra</h2>
          <p className="text-muted-foreground">
            Gerencie necessidades automáticas e manuais de compra
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateAutoNeeds}
            disabled={generatingAuto}
          >
            {generatingAuto ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Gerar Automáticas
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Necessidade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Necessidade de Compra</DialogTitle>
              </DialogHeader>
              <PurchaseNeedForm
                onSuccess={() => {
                  setShowCreateDialog(false);
                  fetchNeeds();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alertas Críticos */}
      {criticalNeeds.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">
                {criticalNeeds.length} necessidades críticas requerem atenção imediata!
              </p>
              <div className="text-sm">
                {criticalNeeds.slice(0, 3).map((need) => (
                  <div key={need.id} className="flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    <span>{need.part_name} ({need.part_code})</span>
                    <span>- Falta: {need.shortage_quantity}</span>
                  </div>
                ))}
                {criticalNeeds.length > 3 && (
                  <p className="mt-1">... e mais {criticalNeeds.length - 3} itens</p>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
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
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Críticas</p>
                <p className="text-2xl font-bold">{stats.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alta Prioridade</p>
                <p className="text-2xl font-bold">{stats.high}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Cotação</p>
                <p className="text-2xl font-bold">{stats.inQuotation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Estimado</p>
                <p className="text-lg font-bold">{formatCurrency(stats.totalEstimatedCost)}</p>
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
                  placeholder="Buscar por peça ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-40">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_quotation">Em Cotação</SelectItem>
                  <SelectItem value="ordered">Pedido</SelectItem>
                  <SelectItem value="received">Recebido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:w-40">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:w-40">
              <Label htmlFor="type">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="auto_reorder">Automática</SelectItem>
                  <SelectItem value="manual_request">Manual</SelectItem>
                  <SelectItem value="project_requirement">Projeto</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações em Lote */}
      {selectedNeeds.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {selectedNeeds.length} necessidade{selectedNeeds.length !== 1 ? 's' : ''} selecionada{selectedNeeds.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedNeeds([])}
                >
                  Limpar Seleção
                </Button>
                <Button
                  onClick={handleConvertToRequisition}
                  disabled={convertingToReq}
                >
                  {convertingToReq ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Criar Requisição
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Necessidades */}
      <Card>
        <CardHeader>
          <CardTitle>Necessidades de Compra</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando necessidades...</p>
            </div>
          ) : filteredNeeds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma necessidade encontrada</p>
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' ? (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              ) : (
                <p className="text-sm">Use "Gerar Automáticas" para analisar o estoque</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedNeeds.length === filteredNeeds.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Peça</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Necessário</TableHead>
                    <TableHead>Disponível</TableHead>
                    <TableHead>Falta</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor Est.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNeeds.map((need) => (
                    <TableRow key={need.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedNeeds.includes(need.id)}
                          onCheckedChange={(checked) => handleSelectNeed(need.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{need.part_name}</TableCell>
                      <TableCell className="font-mono text-sm">{need.part_code}</TableCell>
                      <TableCell>{need.required_quantity}</TableCell>
                      <TableCell>{need.available_quantity}</TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {need.shortage_quantity}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(need.priority_level)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getTypeLabel(need.need_type)}</span>
                      </TableCell>
                      <TableCell>{formatCurrency(need.estimated_cost)}</TableCell>
                      <TableCell>
                        {getStatusBadge(need.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatDate(need.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {need.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateNeedStatus(need.id, 'in_quotation')}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Cotar
                            </Button>
                          )}
                          {need.status === 'in_quotation' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateNeedStatus(need.id, 'ordered')}
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Pedido
                            </Button>
                          )}
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
    </div>
  );
}
