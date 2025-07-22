
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export function EnhancedInsights() {
  const { isMobile } = useBreakpoint();

  const metrics = [
    {
      label: 'Produtividade',
      value: 87,
      target: 85,
      trend: 12,
      isPositive: true,
      color: 'text-success'
    },
    {
      label: 'Meta Mensal',
      value: 73,
      target: 100,
      trend: -5,
      isPositive: false,
      color: 'text-primary'
    },
    {
      label: 'Satisfação',
      value: 94,
      target: 90,
      trend: 8,
      isPositive: true,
      color: 'text-success'
    }
  ];

  return (
    <Card className="card-enhanced bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
      <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Target className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-primary-foreground`} />
          </div>
          <div>
            <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>Insights</span>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground font-normal`}>
              Performance atual
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-${isMobile ? '3' : '4'}`}>
        {metrics.map((metric, index) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                {metric.label}
              </span>
              <div className="flex items-center gap-2">
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold`}>
                  {metric.value}%
                </span>
                <Badge variant="secondary" className="text-xs">
                  {metric.isPositive ? 
                    <TrendingUp className="w-3 h-3 mr-1" /> : 
                    <TrendingDown className="w-3 h-3 mr-1" />
                  }
                  {metric.trend}%
                </Badge>
              </div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${
                  metric.value >= metric.target ? 'bg-gradient-success' : 'bg-gradient-primary'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{ delay: 0.5 + index * 0.2, duration: 0.8 }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
