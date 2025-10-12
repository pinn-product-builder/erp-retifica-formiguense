import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { formatCurrency } from '@/lib/utils';

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

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchStats();
      fetchTopMovedParts();
    }
  }, [currentOrganization?.id]);

  const fetchStats = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      // Total de itens e valor em estoque
      const { data: inventory, error: invError } = await supabase
        .from('parts_inventory')
        .select('quantity, unit_cost')
        .eq('org_id', currentOrganization.id);

      if (invError) throw invError;

      const totalItems = inventory?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const totalValue =
        inventory?.reduce((sum, item) => sum + item.quantity * (item.unit_cost || 0), 0) || 0;

      // Itens com estoque baixo
      const { count: lowStockCount, error: lowStockError } = await supabase
        .from('stock_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', currentOrganization.id)
        .eq('alert_type', 'low_stock')
        .eq('is_active', true);

      if (lowStockError) throw lowStockError;

      // Movimentações do mês atual
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { data: movements, error: movError } = await supabase
        .from('inventory_movements')
        .select('movement_type')
        .eq('org_id', currentOrganization.id)
        .gte('created_at', firstDayOfMonth.toISOString());

      if (movError) throw movError;

      const entriesCount = movements?.filter((m) => m.movement_type === 'entrada').length || 0;
      const exitsCount =
        movements?.filter((m) =>
          ['saida', 'baixa'].includes(m.movement_type)
        ).length || 0;

      setStats({
        totalItems,
        totalValue,
        lowStockItems: lowStockCount || 0,
        movementsThisMonth: movements?.length || 0,
        entriesThisMonth: entriesCount,
        exitsThisMonth: exitsCount,
      });
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopMovedParts = async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          part_id,
          created_at,
          part:parts_inventory(part_name, part_code)
        `)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Contar movimentações por peça
      const partCounts: Record<
        string,
        { name: string; code: string; count: number; lastMovement: string }
      > = {};

      data?.forEach((movement: any) => {
        const partId = movement.part_id;
        if (!partCounts[partId]) {
          partCounts[partId] = {
            name: movement.part?.part_name || 'N/A',
            code: movement.part?.part_code || 'N/A',
            count: 0,
            lastMovement: movement.created_at,
          };
        }
        partCounts[partId].count++;
      });

      // Ordenar e pegar top 5
      const top = Object.values(partCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((part) => ({
          part_name: part.name,
          part_code: part.code,
          total_movements: part.count,
          last_movement: part.lastMovement,
        }));

      setTopParts(top);
    } catch (error) {
      console.error('Error fetching top moved parts:', error);
    }
  };

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
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Itens em Estoque</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold">{stats.lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Movimentações (Mês)</p>
                <p className="text-2xl font-bold">{stats.movementsThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movimentações do Mês */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações deste Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-xl font-bold">{stats.entriesThisMonth}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Saídas/Baixas</p>
                <p className="text-xl font-bold">{stats.exitsThisMonth}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Peças Mais Movimentadas */}
      <Card>
        <CardHeader>
          <CardTitle>Peças Mais Movimentadas (Últimos 100 registros)</CardTitle>
        </CardHeader>
        <CardContent>
          {topParts.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma movimentação registrada
            </p>
          ) : (
            <div className="space-y-3">
              {topParts.map((part, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{part.part_name}</p>
                      <p className="text-sm text-muted-foreground">{part.part_code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{part.total_movements} movimentações</p>
                    <p className="text-xs text-muted-foreground">
                      Última: {new Date(part.last_movement).toLocaleDateString()}
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

