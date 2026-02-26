import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/hooks/useOrganization';
import { formatCurrency } from '@/lib/utils';
import { inventoryService } from '@/services/InventoryService';

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  movementsThisMonth: number;
  entriesThisMonth: number;
  exitsThisMonth: number;
}

interface TopMovedPart {
  part_name: string;
  part_code: string;
  total_movements: number;
  last_movement: string;
}

export function InventoryDashboard() {
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    movementsThisMonth: 0,
    entriesThisMonth: 0,
    exitsThisMonth: 0,
  });
  const [topParts, setTopParts] = useState<TopMovedPart[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  const fetchData = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      setLoading(true);
      const [dashStats, top] = await Promise.all([
        inventoryService.getDashboardStats(currentOrganization.id),
        inventoryService.getTopMovedParts(currentOrganization.id, 5),
      ]);
      setStats(dashStats);
      setTopParts(top);
    } catch (error) {
      console.error('Error fetching inventory dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchData();
    }
  }, [currentOrganization?.id, fetchData]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Carregando estatísticas...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold">Visão Geral do Estoque</h2>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Itens em Estoque</p>
                <p className="text-xl sm:text-2xl font-bold truncate">{stats.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                  {formatCurrency(stats.totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Movimentações (Mês)</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.movementsThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Movimentações deste Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Entradas</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">{stats.entriesThisMonth}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg flex-shrink-0">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Saídas/Baixas</p>
                <p className="text-lg sm:text-xl font-bold text-red-600">{stats.exitsThisMonth}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Top 5 Peças Mais Movimentadas</CardTitle>
        </CardHeader>
        <CardContent>
          {topParts.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Nenhuma movimentação registrada
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {topParts.map((part, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 sm:p-3 border rounded-lg gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Badge variant="outline" className="font-mono text-xs flex-shrink-0">
                      #{index + 1}
                    </Badge>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{part.part_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{part.part_code}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                      {part.total_movements} mov.
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(part.last_movement).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
