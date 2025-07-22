
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Wrench
} from 'lucide-react';
import { motion } from 'framer-motion';

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: 'service_started',
      message: 'Serviço RF-2024-001 iniciado',
      user: 'Carlos Silva',
      time: '10 min atrás',
      icon: Wrench,
      color: 'text-primary'
    },
    {
      id: 2,
      type: 'quote_approved',
      message: 'Orçamento #458 aprovado',
      user: 'Maria Santos',
      time: '25 min atrás',
      icon: CheckCircle,
      color: 'text-success'
    },
    {
      id: 3,
      type: 'employee_checkin',
      message: 'João Pereira fez check-in',
      user: 'Sistema',
      time: '1h atrás',
      icon: User,
      color: 'text-muted-foreground'
    },
    {
      id: 4,
      type: 'deadline_alert',
      message: 'Prazo de entrega próximo',
      user: 'Sistema',
      time: '2h atrás',
      icon: AlertCircle,
      color: 'text-warning'
    }
  ];

  return (
    <Card className="card-enhanced">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Clock className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold">Atividade Recente</span>
            <p className="text-sm text-muted-foreground font-normal">Últimas ações do sistema</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card transition-colors"
            >
              <div className={`p-2 rounded-lg bg-muted ${activity.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.user}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
