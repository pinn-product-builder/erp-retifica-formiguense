import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useInventoryCounts, CountStatus } from '@/hooks/useInventoryCounts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG = {
  draft: {
    label: 'Rascunho',
    color: 'bg-gray-500/20 text-gray-700 border-gray-300',
    icon: AlertCircle,
  },
  in_progress: {
    label: 'Em Andamento',
    color: 'bg-blue-500/20 text-blue-700 border-blue-300',
    icon: Play,
  },
  completed: {
    label: 'Concluída',
    color: 'bg-green-500/20 text-green-700 border-green-300',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelada',
    color: 'bg-red-500/20 text-red-700 border-red-300',
    icon: XCircle,
  },
};

/**
 * Componente para linha individual de item de contagem
 * Isolado para manter o estado local de cada item
 */
interface CountItemRowProps {
  item: {
    id: string;
    part_id: string;
    expected_quantity: number;
    counted_quantity?: number;
    difference?: number;
    notes?: string;
    part?: {
      part_code: string;
      part_name: string;
    };
  };
  onUpdate: (itemId: string, quantity: number, notes?: string) => Promise<void>;
  isCompleted: boolean;
  canEdit: boolean;
}

function CountItemRow({ item, onUpdate, isCompleted, canEdit }: CountItemRowProps) {
  const [counted, setCounted] = useState(item.counted_quantity?.toString() || '');
  const [itemNotes, setItemNotes] = useState(item.notes || '');

  // Atualizar quando o item mudar (após salvar)
  useEffect(() => {
    if (item.counted_quantity !== undefined && item.counted_quantity !== null) {
      setCounted(item.counted_quantity.toString());
    }
    if (item.notes) {
      setItemNotes(item.notes);
    }
  }, [item.counted_quantity, item.notes]);

  const handleSave = () => {
    const quantity = parseInt(counted);
    if (!isNaN(quantity) && quantity >= 0) {
      onUpdate(item.id, quantity, itemNotes || undefined);
    }
  };

  const diff = item.difference || 0;
  const hasDivergence = item.counted_quantity !== undefined && diff !== 0;

  return (
    <TableRow className={hasDivergence ? 'bg-yellow-50' : ''}>
      <TableCell className="font-mono text-sm">
        {item.part?.part_code}
      </TableCell>
      <TableCell className="font-medium">{item.part?.part_name}</TableCell>
      <TableCell className="text-right">{item.expected_quantity}</TableCell>
      <TableCell className="text-right">
        {isCompleted ? (
          item.counted_quantity
        ) : (
          <Input
            type="number"
            min="0"
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
            onBlur={handleSave}
            className="w-20 text-right"
            disabled={!canEdit}
          />
        )}
      </TableCell>
      <TableCell className="text-right">
        {item.counted_quantity !== undefined && (
          <span
            className={
              diff > 0
                ? 'text-green-600 font-semibold'
                : diff < 0
                ? 'text-red-600 font-semibold'
                : ''
            }
          >
            {diff > 0 ? '+' : ''}
            {diff}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function InventoryCountManager() {
  const {
    counts,
    currentCount,
    countItems,
    loading,
    fetchCounts,
    fetchCountById,
    createCount,
    startCount,
    updateCountItem,
    processCount,
    cancelCount,
    getDivergenceReport,
  } = useInventoryCounts();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCountDialog, setShowCountDialog] = useState(false);
  const [selectedCountId, setSelectedCountId] = useState<string | null>(null);

  const [newCountData, setNewCountData] = useState({
    count_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCounts().catch(() => {
      setError('Erro ao carregar contagens. Verifique se as tabelas foram criadas no banco de dados.');
    });
  }, [fetchCounts]);

  const handleCreateCount = async () => {
    const count = await createCount({
      ...newCountData,
      count_type: 'total',
      include_all_parts: true,
    });

    if (count) {
      setShowCreateDialog(false);
      setNewCountData({
        count_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  };

  const handleOpenCount = async (countId: string) => {
    setSelectedCountId(countId);
    await fetchCountById(countId);
    setShowCountDialog(true);
  };

  const handleUpdateItem = async (itemId: string, countedQuantity: number, notes?: string) => {
    await updateCountItem({ item_id: itemId, counted_quantity: countedQuantity, notes });
  };

  const handleProcessCount = async () => {
    if (currentCount?.id) {
      const success = await processCount(currentCount.id);
      if (success) {
        setShowCountDialog(false);
        fetchCounts();
      }
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return date;
    }
  };

  const divergenceReport = currentCount ? getDivergenceReport(countItems) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Inventário Físico</h2>
          <p className="text-muted-foreground">
            Gerencie contagens de estoque e ajustes de inventário
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Contagem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Contagem de Inventário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="count_date">Data da Contagem</Label>
                <Input
                  id="count_date"
                  type="date"
                  value={newCountData.count_date}
                  onChange={(e) =>
                    setNewCountData({ ...newCountData, count_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newCountData.notes}
                  onChange={(e) =>
                    setNewCountData({ ...newCountData, notes: e.target.value })
                  }
                  placeholder="Motivo da contagem, observações gerais..."
                  rows={3}
                />
              </div>
              <Alert>
                <AlertDescription>
                  Todas as peças do estoque serão incluídas nesta contagem.
                </AlertDescription>
              </Alert>
              <Button onClick={handleCreateCount} disabled={loading} className="w-full">
                {loading ? 'Criando...' : 'Criar Contagem'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">{error}</p>
              <p className="text-sm">
                As tabelas de inventário precisam ser criadas no banco de dados.
                <br />
                Por favor, aplique as migrations localizadas em:
                <code className="block mt-2 p-2 bg-black/10 rounded text-xs">
                  supabase/migrations/
                </code>
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Contagens */}
      {!error && (
        <Card>
          <CardHeader>
            <CardTitle>Contagens de Inventário</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !counts.length ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando contagens...
              </div>
            ) : counts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma contagem encontrada. Crie uma nova contagem para começar.
              </div>
            ) : (
            <div className="space-y-3">
              {counts.map((count) => {
                const config = STATUS_CONFIG[count.status as CountStatus];
                const Icon = config.icon;

                return (
                  <div
                    key={count.id}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{count.count_number}</span>
                          <Badge className={config.color} variant="outline">
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Data: {formatDate(count.count_date)}
                        </p>
                        {count.notes && (
                          <p className="text-sm text-muted-foreground">{count.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {count.status === 'draft' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startCount(count.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Iniciar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => cancelCount(count.id)}
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        {count.status === 'in_progress' && (
                          <Button size="sm" onClick={() => handleOpenCount(count.id)}>
                            Contar
                          </Button>
                        )}
                        {count.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCount(count.id)}
                          >
                            Ver Detalhes
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Contagem */}
      <Dialog open={showCountDialog} onOpenChange={setShowCountDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Contagem: {currentCount?.count_number}
              {currentCount && (
                <Badge className={STATUS_CONFIG[currentCount.status as CountStatus].color} variant="outline">
                  {STATUS_CONFIG[currentCount.status as CountStatus].label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Resumo de Divergências */}
          {divergenceReport && divergenceReport.totalDivergences > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-semibold">
                    {divergenceReport.totalDivergences} divergências encontradas
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      Sobra: {divergenceReport.totalIncrease}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <TrendingDown className="h-3 w-3" />
                      Falta: {divergenceReport.totalDecrease}
                    </span>
                    {divergenceReport.financialImpact !== 0 && (
                      <span className="text-muted-foreground">
                        Impacto: R$ {Math.abs(divergenceReport.financialImpact).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Tabela de Itens */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Peça</TableHead>
                  <TableHead className="text-right">Esperado</TableHead>
                  <TableHead className="text-right">Contado</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countItems.map((item) => (
                  <CountItemRow
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdateItem}
                    isCompleted={currentCount?.status === 'completed'}
                    canEdit={currentCount?.status === 'in_progress'}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Botões de Ação */}
          {currentCount?.status === 'in_progress' && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCountDialog(false)}>
                Salvar e Fechar
              </Button>
              <Button onClick={handleProcessCount} disabled={loading}>
                {loading ? 'Processando...' : 'Concluir e Processar Ajustes'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
