
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

export function EnhancedInsights() {
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

  const miniStats = [
    {
      icon: DollarSign,
      label: 'Receita Hoje',
      value: 'R$ 3.200',
      change: '+15%'
    },
    {
      icon: Calendar,
      label: 'Entregas',
      value: '7',
      change: '+2'
    },
    {
      icon: Users,
      label: 'Presentes',
      value: '15/17',
      change: '88%'
    }
  ];

  return (
    <Card className="card-enhanced bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold">Performance & Insights</span>
            <p className="text-sm text-muted-foreground font-normal">Métricas em tempo real</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Metrics */}
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{metric.value}%</span>
                  <Badge variant="secondary" className="text-xs">
                    {metric.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
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
        </div>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-1 gap-3 pt-4 border-t border-border/50">
          {miniStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {stat.change}
                </Badge>
              </motion.div>
            );
          })}
        </div>

        {/* Financial Summary */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Meta Mensal</span>
            <span className="text-xs font-medium">R$ 45.000</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">Atual</span>
            <span className="text-xs font-bold text-primary">R$ 32.850</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
