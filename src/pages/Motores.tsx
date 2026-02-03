import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Settings, Package, CheckCircle, XCircle } from 'lucide-react';
import { EnginesList } from '@/components/operations/EnginesList';
import { EngineService } from '@/services/EngineService';
import { useModuleGuard } from '@/hooks/useRoleGuard';
import { useOrganization } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';

const Motores = () => {
  const { hasPermission } = useModuleGuard('production', 'read', { blockAccess: true });
  const { currentOrganization } = useOrganization();

  const { data: stats } = useQuery({
    queryKey: ['engine-stats', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) {
        return { total: 0, completos: 0, montados: 0, parciais: 0, desmontados: 0 };
      }
      return await EngineService.getEngineStats(currentOrganization.id);
    },
    enabled: !!currentOrganization?.id,
  });

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate flex items-center gap-2 sm:gap-3">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
            Motores Cadastrados
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Visualize todos os motores cadastrados no sistema através do check-in
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total"
          value={stats?.total || 0}
          icon={Package}
          variant="default"
          className="p-3 sm:p-4"
        />
        <StatCard
          title="Completos"
          value={stats?.completos || 0}
          icon={CheckCircle}
          variant="success"
          className="p-3 sm:p-4"
        />
        <StatCard
          title="Montados"
          value={stats?.montados || 0}
          icon={Settings}
          variant="primary"
          className="p-3 sm:p-4"
        />
        <StatCard
          title="Parciais"
          value={stats?.parciais || 0}
          icon={XCircle}
          variant="warning"
          className="p-3 sm:p-4"
        />
      </div>

      <EnginesList />

      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Sobre os Motores</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  • Os motores são cadastrados automaticamente durante o processo de check-in
                </p>
                <p>
                  • Cada motor pode estar associado a uma ou mais ordens de serviço
                </p>
                <p>
                  • O estado de montagem indica se o motor está montado, parcialmente montado ou
                  desmontado
                </p>
                <p>
                  • A informação de componentes presentes ajuda no planejamento do diagnóstico e
                  orçamento
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Motores;
