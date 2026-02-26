import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { PriceHistoryData } from '@/services/PriceHistoryService';

const LINE_COLORS = [
  'hsl(var(--primary))',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
];

interface TrendBadgeProps {
  trend: 'subindo' | 'estavel' | 'caindo';
  variation: number;
}

function TrendBadge({ trend, variation }: TrendBadgeProps) {
  if (trend === 'subindo') {
    return (
      <Badge className="bg-red-500 text-white gap-1">
        <TrendingUp className="w-3 h-3" />
        +{variation.toFixed(1)}%
      </Badge>
    );
  }
  if (trend === 'caindo') {
    return (
      <Badge className="bg-emerald-500 text-white gap-1">
        <TrendingDown className="w-3 h-3" />
        {variation.toFixed(1)}%
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Minus className="w-3 h-3" />
      Estável
    </Badge>
  );
}

interface PriceHistoryChartProps {
  data: PriceHistoryData;
}

export function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  const { stats, chart_data, supplier_names } = data;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Preço Atual</p>
                <p className="text-sm sm:text-base font-bold whitespace-nowrap">{formatCurrency(stats.current_price)}</p>
                <p className="text-xs text-muted-foreground truncate">{stats.current_supplier}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Preço Médio</p>
                <p className="text-sm sm:text-base font-bold whitespace-nowrap">{formatCurrency(stats.avg_price)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Mín / Máx</p>
              <p className="text-sm sm:text-base font-bold whitespace-nowrap">
                <span className="text-emerald-600">{formatCurrency(stats.min_price)}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-red-500">{formatCurrency(stats.max_price)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Tendência</p>
              <TrendBadge trend={stats.trend} variation={stats.variation_percentage} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-sm sm:text-base">Evolução de Preços</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          {chart_data.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
              Sem dados para o período selecionado
            </div>
          ) : (
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart_data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => formatCurrency(v)}
                    width={72}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      fontSize: 12,
                    }}
                  />
                  {supplier_names.length > 1 && (
                    <Legend
                      formatter={(value) => <span className="text-xs">{value}</span>}
                      iconSize={10}
                    />
                  )}
                  {supplier_names.map((supplier, i) => (
                    <Line
                      key={supplier}
                      type="monotone"
                      dataKey={supplier}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
