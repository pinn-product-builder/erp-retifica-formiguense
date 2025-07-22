
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Wrench, 
  Clock, 
  Package, 
  FileText, 
  DollarSign,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export function QuickActions() {
  const actions = [
    {
      title: 'Novo Orçamento',
      icon: Plus,
      description: 'Criar novo orçamento',
      href: '/orcamentos',
      variant: 'default' as const,
      featured: true
    },
    {
      title: 'Iniciar Serviço',
      icon: Wrench,
      description: 'Começar novo serviço',
      href: '/workflow',
      variant: 'outline' as const
    },
    {
      title: 'Apontar Horas',
      icon: Clock,
      description: 'Registrar horas',
      href: '/funcionarios',
      variant: 'outline' as const
    },
    {
      title: 'Consultar Peça',
      icon: Package,
      description: 'Buscar estoque',
      href: '/estoque',
      variant: 'outline' as const
    },
    {
      title: 'Relatórios',
      icon: DollarSign,
      description: 'Ver relatórios',
      href: '/relatorios',
      variant: 'outline' as const
    }
  ];

  return (
    <Card className="card-enhanced">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold">Ações Rápidas</span>
            <p className="text-sm text-muted-foreground font-normal">Acesso direto</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                className={`w-full justify-between group transition-all duration-300 h-auto py-3 ${
                  action.featured 
                    ? 'bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-primary'
                    : 'hover:bg-primary/10 border-primary/20'
                }`}
                variant={action.featured ? "default" : action.variant}
                size="sm"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md transition-colors ${
                    action.featured 
                      ? 'bg-white/20' 
                      : 'bg-primary/10 group-hover:bg-primary/20'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium block text-sm">{action.title}</span>
                    <span className={`text-xs ${
                      action.featured ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {action.description}
                    </span>
                  </div>
                </div>
                {action.featured && (
                  <Badge className="bg-white/20 text-primary-foreground hover:bg-white/30 px-2 py-1">
                    <ArrowRight className="w-3 h-3" />
                  </Badge>
                )}
              </Button>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
