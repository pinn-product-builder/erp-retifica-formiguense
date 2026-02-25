import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Props {
  savings: number;
  savingsPercentage: number;
  returnRate: number;
}

export function SavingsReport({ savings, savingsPercentage, returnRate }: Props) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-5 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <TrendingDown className="h-4 w-4 text-green-500" />
          Economia &amp; Qualidade
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-5 pt-0 space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Economia em cotações</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">
            {formatCurrency(savings)}
          </p>
          {savingsPercentage > 0 && (
            <p className="text-xs text-green-600 font-medium">
              {savingsPercentage.toFixed(1)}% abaixo do maior preço cotado
            </p>
          )}
          {savings === 0 && (
            <p className="text-xs text-muted-foreground">Sem cotações comparativas no período</p>
          )}
        </div>

        <div className="border-t pt-3 space-y-1">
          <p className="text-xs text-muted-foreground">Taxa de Devolução</p>
          <p className={`text-lg sm:text-xl font-bold ${returnRate > 5 ? 'text-red-500' : returnRate > 0 ? 'text-amber-500' : 'text-green-600'}`}>
            {returnRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {returnRate === 0
              ? 'Nenhuma devolução no período'
              : returnRate <= 5
                ? 'Dentro do aceitável'
                : 'Atenção: acima de 5%'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
