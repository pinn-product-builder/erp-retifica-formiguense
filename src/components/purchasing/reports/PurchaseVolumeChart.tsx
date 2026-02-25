import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';
import { type VolumeByMonth } from '@/services/PurchasingReportsService';

interface Props {
  data: VolumeByMonth[];
}

const formatValue = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v);

export function PurchaseVolumeChart({ data }: Props) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-5 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <BarChart2 className="h-4 w-4 text-primary" />
          Compras por Período
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-5 pt-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
            Sem dados para o período selecionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
                width={56}
              />
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                }
                labelStyle={{ fontWeight: 600, fontSize: 12 }}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Bar dataKey="total_value" name="Valor Total" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
