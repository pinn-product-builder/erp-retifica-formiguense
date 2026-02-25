import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, AlertTriangle, Package, ShoppingCart, Undo2 } from 'lucide-react';
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import type { ConditionalOrder } from '@/services/ConditionalOrderService';

interface ConditionalDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conditional: ConditionalOrder | null;
  onDecide?: (selectedIds: string[]) => void;
}

function getDeadlineInfo(expiryDate: string) {
  const now = new Date();
  const deadline = new Date(expiryDate);
  const days = differenceInDays(deadline, now);
  const hours = differenceInHours(deadline, now);

  if (days < 0)
    return { text: `Vencido há ${Math.abs(days)} dia(s)`, color: 'text-red-600', progress: 100 };
  if (days === 0)
    return {
      text: hours > 0 ? `Vence em ${hours}h` : 'Vence hoje!',
      color: 'text-red-600',
      progress: 95,
    };
  if (days <= 3)
    return { text: `Vence em ${days} dia(s)`, color: 'text-yellow-600', progress: 75 };
  return { text: `Vence em ${days} dias`, color: 'text-green-600', progress: 25 };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_analysis: 'Em Análise',
  approved: 'Aprovado',
  partial_return: 'Devolução Parcial',
  returned: 'Devolvido',
  purchased: 'Comprado',
  overdue: 'Vencido',
};

const DECISION_LABELS: Record<string, string> = {
  approve: 'Aprovado',
  return: 'Devolvido',
};

export function ConditionalDetailsModal({
  open,
  onOpenChange,
  conditional,
  onDecide,
}: ConditionalDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('items');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  if (!conditional) return null;

  const deadlineInfo = getDeadlineInfo(conditional.expiry_date);
  const isOverdue = conditional.status === 'overdue';
  const canDecide = ['pending', 'in_analysis', 'overdue'].includes(conditional.status);
  const items = conditional.items ?? [];

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                {conditional.conditional_number}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {conditional.supplier?.name}
              </DialogDescription>
            </div>
            <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="flex-shrink-0 text-xs">
              {STATUS_LABELS[conditional.status] ?? conditional.status}
            </Badge>
          </div>
        </DialogHeader>

        <Card className={isOverdue ? 'border-destructive bg-destructive/5' : 'border-primary/20 bg-primary/5'}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {isOverdue ? (
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                )}
                <span className={`font-medium text-xs sm:text-sm ${deadlineInfo.color}`}>
                  {deadlineInfo.text}
                </span>
              </div>
              <span className="font-bold text-sm sm:text-base whitespace-nowrap">
                {formatCurrency(conditional.total_amount)}
              </span>
            </div>
            <Progress value={deadlineInfo.progress} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="items" className="text-xs sm:text-sm">Itens</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">Histórico</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto py-3">
            <TabsContent value="items" className="mt-0 space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {canDecide && <TableHead className="w-[40px]"></TableHead>}
                      <TableHead className="text-xs">Item</TableHead>
                      <TableHead className="text-xs text-right">Qtd</TableHead>
                      <TableHead className="text-xs text-right">Preço Unit.</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                      <TableHead className="text-xs">Decisão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        {canDecide && (
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={() => toggleItem(item.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <p className="font-medium text-xs sm:text-sm">{item.part_name}</p>
                          {item.part_code && (
                            <p className="text-xs text-muted-foreground">{item.part_code}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{item.quantity}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm whitespace-nowrap">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm whitespace-nowrap font-medium">
                          {formatCurrency(item.total_price)}
                        </TableCell>
                        <TableCell>
                          {item.decision ? (
                            <Badge
                              variant={item.decision === 'approve' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {DECISION_LABELS[item.decision]}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pendente</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {canDecide && selectedItems.length > 0 && (
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                      {selectedItems.length} item(ns) selecionado(s)
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        className="flex-1 text-xs sm:text-sm"
                        onClick={() => onDecide?.(selectedItems)}
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                        Decidir Itens
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Card>
                <CardContent className="p-3 sm:p-4 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Condicional criada</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conditional.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  {conditional.decided_at && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Decisão registrada</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(conditional.decided_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {conditional.justification && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {conditional.justification}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {conditional.notes && (
                <Card className="mt-3">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm">{conditional.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
