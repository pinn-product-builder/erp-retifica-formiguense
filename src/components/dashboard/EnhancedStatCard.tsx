import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EnhancedStatCardProps {
  kpi: {
    id: string;
    code: string;
    name: string;
    value: number;
    previousValue: number;
    changePercentage: number;
    trendDirection: 'up' | 'down' | 'stable';
    lastUpdated: string;
    icon: string;
    color: string;
    unit: string;
  };
  showTrend?: boolean;
  showComparison?: boolean;
  autoRefresh?: boolean;
  className?: string;
}

export const EnhancedStatCard: React.FC<EnhancedStatCardProps> = ({
  kpi,
  showTrend = true,
  showComparison = true,
  autoRefresh = true,
  className
}) => {
  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value);
      case 'percentage':
        return `${Number(value.toFixed(2))}%`;
      case 'number':
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(value);
      default:
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(value);
    }
  };

  const getTrendIcon = () => {
    switch (kpi.trendDirection) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (kpi.trendDirection) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getIconComponent = (iconName: string) => {
    // Mapear ícones - implementar conforme necessário
    const iconMap: Record<string, unknown> = {
      Calendar: '📅',
      Wrench: '🔧',
      Users: '👥',
      TrendingUp: '📈',
      AlertTriangle: '⚠️',
      CheckCircle: '✅',
      Package: '📦',
      Clock: '🕐',
      AlertCircle: '🔴',
      DollarSign: '💰',
      Heart: '❤️'
    };
    return iconMap[iconName] || '📊';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('h-full', className)}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {kpi.name}
          </CardTitle>
          <div className="text-2xl">
            {String(getIconComponent(kpi.icon))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {formatValue(kpi.value, kpi.unit)}
            </div>
            
            {showTrend && (
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="secondary" 
                  className={cn('text-xs', getTrendColor())}
                >
                  {getTrendIcon()}
                  <span className="ml-1">
                    {kpi.changePercentage > 0 ? '+' : ''}
                    {Number(kpi.changePercentage.toFixed(2))}%
                  </span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  vs. anterior
                </span>
              </div>
            )}

            {showComparison && (
              <div className="text-xs text-muted-foreground">
                Anterior: {formatValue(kpi.previousValue, kpi.unit)}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Atualizado: {new Date(kpi.lastUpdated).toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
