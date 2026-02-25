import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { type SupplierVolume } from '@/services/PurchasingReportsService';

interface Props {
  data: SupplierVolume[];
}

const RANK_COLORS = [
  'text-yellow-500',
  'text-slate-400',
  'text-amber-600',
  'text-muted-foreground',
  'text-muted-foreground',
];

export function SupplierRankingTable({ data }: Props) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-5 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Top Fornecedores
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-5 pt-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Sem dados para o período
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((s, i) => (
              <div key={s.supplier_id} className="flex items-center gap-3 py-2 border-b last:border-0">
                <span className={`font-bold text-base sm:text-lg w-5 flex-shrink-0 ${RANK_COLORS[i] ?? 'text-muted-foreground'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">{s.supplier_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.total_orders} {s.total_orders === 1 ? 'pedido' : 'pedidos'}
                    {s.avg_lead_time_days != null && ` · ${s.avg_lead_time_days.toFixed(1)}d lead`}
                  </p>
                </div>
                <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                  {formatCurrency(s.total_value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
