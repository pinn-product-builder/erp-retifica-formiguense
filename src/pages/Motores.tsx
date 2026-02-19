import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/StatCard';
import { Settings, Package, CheckCircle, XCircle, FileText } from 'lucide-react';
import { EnginesList } from '@/components/operations/EnginesList';
import { EngineTemplatesList } from '@/components/operations/EngineTemplatesList';
import { EngineTemplateForm } from '@/components/operations/EngineTemplateForm';
import { EngineService } from '@/services/EngineService';
import { useModuleGuard } from '@/hooks/useRoleGuard';
import { useOrganization } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { EngineTemplate } from '@/services/EngineTemplateService';
import { formatCurrency } from '@/utils/masks';

type FormMode = 'create' | 'edit' | 'duplicate' | 'import';

const Motores = () => {
  const { hasPermission } = useModuleGuard('production', 'read', { blockAccess: true });
  const { currentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState('motores');
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [selectedTemplate, setSelectedTemplate] = useState<EngineTemplate | null>(null);

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

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleView = (template: EngineTemplate) => {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  };

  const handleEdit = (template: EngineTemplate) => {
    setSelectedTemplate(template);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDuplicate = (template: EngineTemplate) => {
    setSelectedTemplate(template);
    setFormMode('duplicate');
    setFormOpen(true);
  };

  const calculateTotalValue = (template: EngineTemplate): number => {
    const partsTotal =
      template.parts?.reduce((sum, p) => {
        const unitCost = p.part?.unit_cost || 0;
        return sum + unitCost * p.quantity;
      }, 0) || 0;

    const servicesTotal =
      template.services?.reduce((sum, s) => {
        const value = s.service?.value || 0;
        return sum + value * s.quantity;
      }, 0) || 0;

    const laborCost = template.labor_cost ?? 0;

    return partsTotal + servicesTotal + laborCost;
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate flex items-center gap-2 sm:gap-3">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
            Gestão de Motores
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Motores cadastrados e templates de peças/serviços por modelo
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm">
          <TabsTrigger value="motores" className="gap-1 sm:gap-2">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Motores Cadastrados</span>
            <span className="sm:hidden">Motores</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1 sm:gap-2">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Templates de Motor</span>
            <span className="sm:hidden">Templates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="motores" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
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
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 sm:p-4">
              <div className="flex gap-2 sm:gap-3">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Como usar os Templates:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                    <li>Crie templates com peças e serviços específicos para cada modelo de motor</li>
                    <li>
                      Ao criar um diagnóstico, o sistema sugerirá automaticamente as peças e serviços
                      do template
                    </li>
                    <li>
                      Duplique templates existentes para criar variações de modelos similares
                    </li>
                    <li>Edite templates para manter as informações sempre atualizadas</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <EngineTemplatesList
            onCreateNew={handleCreateNew}
            onView={handleView}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
          />
        </TabsContent>
      </Tabs>

      <EngineTemplateForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        mode={formMode}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detalhes do Template</DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Nome</div>
                      <div className="text-sm font-medium">{selectedTemplate.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Motor</div>
                      <div className="text-sm font-medium">
                        {selectedTemplate.engine_brand} - {selectedTemplate.engine_model}
                      </div>
                    </div>
                  </div>
                  {selectedTemplate.description && (
                    <div>
                      <div className="text-xs text-muted-foreground">Descrição</div>
                      <div className="text-sm">{selectedTemplate.description}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedTemplate.parts && selectedTemplate.parts.length > 0 && (
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                      <div className="text-base sm:text-lg font-semibold">
                        Peças ({selectedTemplate.parts.length})
                      </div>
                    </div>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {selectedTemplate.parts.map((part, index) => (
                          <div key={part.id}>
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm font-medium truncate">
                                  {part.part?.part_code}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {part.part?.part_name}
                                </div>
                                {part.notes && (
                                  <div className="text-xs text-muted-foreground italic mt-1">
                                    {part.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge variant="secondary" className="text-xs mb-1">
                                  Qtd: {part.quantity}
                                </Badge>
                                <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                                  {formatCurrency((part.part?.unit_cost || 0) * part.quantity)}
                                </div>
                              </div>
                            </div>
                            {index < selectedTemplate.parts!.length - 1 && (
                              <Separator className="mt-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Separator className="my-3" />
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-semibold">Total de Peças:</div>
                      <div className="text-sm font-bold">
                        {formatCurrency(
                          selectedTemplate.parts.reduce(
                            (sum, p) => sum + (p.part?.unit_cost || 0) * p.quantity,
                            0
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedTemplate.services && selectedTemplate.services.length > 0 && (
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                      <div className="text-base sm:text-lg font-semibold">
                        Serviços ({selectedTemplate.services.length})
                      </div>
                    </div>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {selectedTemplate.services.map((service, index) => (
                          <div key={service.id}>
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm font-medium truncate">
                                  {service.service?.description}
                                </div>
                                {service.notes && (
                                  <div className="text-xs text-muted-foreground italic mt-1">
                                    {service.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge variant="secondary" className="text-xs mb-1">
                                  Qtd: {service.quantity}
                                </Badge>
                                <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                                  {formatCurrency(
                                    (service.service?.value || 0) * service.quantity
                                  )}
                                </div>
                              </div>
                            </div>
                            {index < selectedTemplate.services!.length - 1 && (
                              <Separator className="mt-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Separator className="my-3" />
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-semibold">Total de Serviços:</div>
                      <div className="text-sm font-bold">
                        {formatCurrency(
                          selectedTemplate.services.reduce(
                            (sum, s) => sum + (s.service?.value || 0) * s.quantity,
                            0
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-primary/5">
                <CardContent className="p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total de Peças:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        selectedTemplate.parts?.reduce(
                          (sum, p) => sum + (p.part?.unit_cost || 0) * p.quantity,
                          0
                        ) || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total de Serviços:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        selectedTemplate.services?.reduce(
                          (sum, s) => sum + (s.service?.value || 0) * s.quantity,
                          0
                        ) || 0
                      )}
                    </span>
                  </div>
                  {(selectedTemplate.labor_cost ?? 0) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Mão de Obra:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedTemplate.labor_cost ?? 0)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div className="text-base sm:text-lg font-bold">Valor Total:</div>
                    <div className="text-lg sm:text-xl font-bold text-primary">
                      {formatCurrency(calculateTotalValue(selectedTemplate))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Motores;
