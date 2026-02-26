import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { SupplierPriceStats } from '@/services/PriceHistoryService';

interface TrendCellProps {
  trend: 'subindo' | 'estavel' | 'caindo';
  variation: number;
}

function TrendCell({ trend, variation }: TrendCellProps) {
  if (trend === 'subindo') {
    return (
      <div className="flex items-center gap-1 text-red-500 text-xs whitespace-nowrap">
        <TrendingUp className="w-3 h-3" />
        +{variation.toFixed(1)}%
      </div>
    );
  }
  if (trend === 'caindo') {
    return (
      <div className="flex items-center gap-1 text-emerald-600 text-xs whitespace-nowrap">
        <TrendingDown className="w-3 h-3" />
        {variation.toFixed(1)}%
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground text-xs">
      <Minus className="w-3 h-3" />
      Estável
    </div>
  );
}

interface SupplierPriceComparisonProps {
  suppliers: SupplierPriceStats[];
}

export function SupplierPriceComparison({ suppliers }: SupplierPriceComparisonProps) {
  if (suppliers.length === 0) {
    return null;
  }

  const lowestPrice = Math.min(...suppliers.map(s => s.last_price));

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 pb-2">
        <CardTitle className="text-sm sm:text-base">Comparativo por Fornecedor</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-2">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Último Preço</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Preço Médio</TableHead>
                <TableHead className="text-right hidden md:table-cell">Mínimo</TableHead>
                <TableHead className="text-right hidden md:table-cell">Máximo</TableHead>
                <TableHead className="text-center">Compras</TableHead>
                <TableHead className="text-center">Tendência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => {
                const isBest = supplier.last_price === lowestPrice;
                return (
                  <TableRow key={supplier.supplier_id} className={isBest ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                          {supplier.supplier_name}
                        </span>
                        {isBest && (
                          <Badge className="bg-emerald-500 text-white text-xs hidden sm:inline-flex">
                            Menor preço
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-xs sm:text-sm font-bold whitespace-nowrap ${isBest ? 'text-emerald-600' : ''}`}>
                        {formatCurrency(supplier.last_price)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell whitespace-nowrap text-xs sm:text-sm">
                      {formatCurrency(supplier.avg_price)}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell whitespace-nowrap text-xs text-emerald-600">
                      {formatCurrency(supplier.min_price)}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell whitespace-nowrap text-xs text-red-500">
                      {formatCurrency(supplier.max_price)}
                    </TableCell>
                    <TableCell className="text-center text-xs sm:text-sm">
                      {supplier.times_purchased}
                    </TableCell>
                    <TableCell className="text-center">
                      <TrendCell trend={supplier.trend} variation={supplier.variation_percentage} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
