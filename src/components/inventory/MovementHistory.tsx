import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  AlertCircle,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { useInventoryMovements, MovementType } from '@/hooks/useInventoryMovements';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MovementHistoryProps {
  partId?: string;
  orderId?: string;
  showFilters?: boolean;
}

const MOVEMENT_TYPE_CONFIG = {
  entrada: { 
    label: 'Entrada', 
    icon: TrendingUp, 
    color: 'bg-green-500/20 text-green-700 border-green-300',
    iconColor: 'text-green-600'
  },
  saida: { 
    label: 'Saída', 
    icon: TrendingDown, 
    color: 'bg-red-500/20 text-red-700 border-red-300',
    iconColor: 'text-red-600'
  },
  ajuste: { 
    label: 'Ajuste', 
    icon: RefreshCw, 
    color: 'bg-blue-500/20 text-blue-700 border-blue-300',
    iconColor: 'text-blue-600'
  },
  baixa: { 
    label: 'Baixa', 
    icon: AlertCircle, 
    color: 'bg-orange-500/20 text-orange-700 border-orange-300',
    iconColor: 'text-orange-600'
  },
  transferencia: { 
    label: 'Transferência', 
    icon: ArrowUpDown, 
    color: 'bg-purple-500/20 text-purple-700 border-purple-300',
    iconColor: 'text-purple-600'
  },
  reserva: { 
    label: 'Reserva', 
    icon: AlertCircle, 
    color: 'bg-yellow-500/20 text-yellow-700 border-yellow-300',
    iconColor: 'text-yellow-600'
  },
};

export function MovementHistory({ partId, orderId, showFilters = true }: MovementHistoryProps) {
  const { movements, loading, fetchMovements, fetchPartMovements, fetchOrderMovements } = useInventoryMovements();
  
  const [filters, setFilters] = useState({
    movement_type: '',
    start_date: '',
    end_date: '',
  });

  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    if (partId) {
      fetchPartMovements(partId);
    } else if (orderId) {
      fetchOrderMovements(orderId);
    } else {
      fetchMovements();
    }
  }, [partId, orderId]);

  const handleFilter = () => {
    const filterParams: any = {};
    
    if (partId) filterParams.part_id = partId;
    if (orderId) filterParams.order_id = orderId;
    if (filters.movement_type && filters.movement_type !== 'all') {
      filterParams.movement_type = filters.movement_type as MovementType;
    }
    if (filters.start_date) filterParams.start_date = filters.start_date;
    if (filters.end_date) filterParams.end_date = filters.end_date;

    fetchMovements(filterParams);
  };

  const clearFilters = () => {
    setFilters({
      movement_type: '',
      start_date: '',
      end_date: '',
    });
    
    if (partId) {
      fetchPartMovements(partId);
    } else if (orderId) {
      fetchOrderMovements(orderId);
    } else {
      fetchMovements();
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return date;
    }
  };

  const formatQuantityChange = (type: MovementType, quantity: number) => {
    if (type === 'entrada' || (type === 'ajuste' && quantity > 0)) {
      return `+${quantity}`;
    } else {
      return `-${quantity}`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Histórico de Movimentações</span>
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ movement_type: '', start_date: '', end_date: '' })}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        {showFilters && (
          <div className="mb-4 p-4 border rounded-lg space-y-4 bg-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filter_type">Tipo de Movimentação</Label>
                <Select
                  value={filters.movement_type}
                  onValueChange={(value) => setFilters({ ...filters, movement_type: value })}
                >
                  <SelectTrigger id="filter_type">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(MOVEMENT_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter_start">Data Início</Label>
                <Input
                  id="filter_start"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="filter_end">Data Fim</Label>
                <Input
                  id="filter_end"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleFilter} size="sm">
                Aplicar Filtros
              </Button>
              <Button onClick={clearFilters} variant="outline" size="sm">
                Limpar
              </Button>
            </div>
          </div>
        )}

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando movimentações...</div>
        ) : movements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma movimentação encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Peça</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Estoque Anterior</TableHead>
                  <TableHead className="text-right">Estoque Novo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => {
                  const config = MOVEMENT_TYPE_CONFIG[movement.movement_type];
                  const Icon = config?.icon;
                  const isExpanded = expandedRow === movement.id;

                  return (
                    <React.Fragment key={movement.id}>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedRow(isExpanded ? null : movement.id)}
                      >
                        <TableCell className="text-sm">
                          {formatDate(movement.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge className={config?.color} variant="outline">
                            {Icon && <Icon className={`h-3 w-3 mr-1 ${config.iconColor}`} />}
                            {config?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.part_code} - {movement.part_name}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatQuantityChange(movement.movement_type, movement.quantity)}
                        </TableCell>
                        <TableCell className="text-right">{movement.previous_quantity}</TableCell>
                        <TableCell className="text-right font-semibold">{movement.new_quantity}</TableCell>
                        <TableCell className="max-w-xs truncate">{movement.reason}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.created_by_name || 'Sistema'}
                        </TableCell>
                      </TableRow>

                      {/* Linha expandida com detalhes */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-muted/30">
                            <div className="p-4 space-y-2">
                              {movement.notes && (
                                <div>
                                  <strong className="text-sm">Observações:</strong>
                                  <p className="text-sm text-muted-foreground">{movement.notes}</p>
                                </div>
                              )}
                              {movement.order && (
                                <div>
                                  <strong className="text-sm">Ordem de Serviço:</strong>
                                  <p className="text-sm text-muted-foreground">{movement.order.order_number}</p>
                                </div>
                              )}
                              {movement.unit_cost && (
                                <div>
                                  <strong className="text-sm">Custo Unitário:</strong>
                                  <p className="text-sm text-muted-foreground">
                                    R$ {movement.unit_cost.toFixed(2)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

