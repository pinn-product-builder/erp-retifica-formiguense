import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WarrantyClaimsManager } from '@/components/warranty/WarrantyClaimsManager';
import { BoschWorkflowManager } from '@/components/warranty/BoschWorkflowManager';
import { EnvironmentConfigManager } from '@/components/warranty/EnvironmentConfigManager';
import { 
  Shield, 
  Award, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Settings,
  MapPin
} from 'lucide-react';

export default function GestaoGarantias() {
  const [activeTab, setActiveTab] = useState('warranty');
  const [isEnvironmentConfigOpen, setIsEnvironmentConfigOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Gestão de Garantias e Workflows Especiais
          </h1>
          <p className="text-gray-600 mt-1">
            Sistema de reclamações, revisões e workflow especializado Bosch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsEnvironmentConfigOpen(true)}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Configurar Ambientes
          </Button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reclamações Ativas</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              3 aguardando avaliação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ordens Bosch</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Workflow especializado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-purple-600">0</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              dias para resolução
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Aprovação</p>
                <p className="text-2xl font-bold text-orange-600">0%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              garantias aprovadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="warranty" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Sistema de Garantias
              </TabsTrigger>
              <TabsTrigger value="bosch" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Workflow Bosch
              </TabsTrigger>
            </TabsList>

            <TabsContent value="warranty" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Reclamações e Avaliação de Garantia</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Aberta</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Aprovada</span>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Negada</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Sistema completo para registro e avaliação técnica de reclamações de garantia. 
                  Classificação automática por tipo de falha (defeito, montagem, desgaste, mau uso) 
                  com priorização de ordens aprovadas no workflow.
                </p>
                <WarrantyClaimsManager />
              </div>
            </TabsContent>

            <TabsContent value="bosch" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Workflow Especializado Bosch</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award className="h-4 w-4 text-green-600" />
                    <span>14 Etapas Certificadas</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Workflow especializado de 14 etapas para componentes Bosch, com controle 
                  rigoroso de ambiente limpo, bancadas homologadas, testes automáticos 
                  e geração de curvas de performance conforme padrão RAM.
                </p>
                <BoschWorkflowManager />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Process Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Processo de Garantia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-800">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Registro da Reclamação</p>
                  <p className="text-xs text-gray-600">Cliente reporta problema via telefone, email ou presencial</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-800">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Avaliação Técnica</p>
                  <p className="text-xs text-gray-600">Análise técnica para classificar tipo de falha</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-800">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Decisão de Cobertura</p>
                  <p className="text-xs text-gray-600">Definição de percentual de cobertura da garantia</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-800">4</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Execução Prioritária</p>
                  <p className="text-xs text-gray-600">Nova OS com prioridade máxima no workflow</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Padrão Bosch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Ambiente limpo obrigatório (ISO 8+)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Bancada de teste homologada</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Peças originais/equivalentes certificados</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Testes automáticos com curvas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Relatório técnico detalhado</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Certificação de conformidade</span>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  14 Etapas Especializadas
                </p>
                <p className="text-xs text-green-600">
                  Desde recepção até certificação final, seguindo rigorosamente 
                  os padrões de qualidade Bosch RAM.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Indicadores de Qualidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">3.2%</div>
              <p className="text-sm text-gray-600">Taxa de Garantia</p>
              <p className="text-xs text-gray-500">Meta: &lt; 5%</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">96.8%</div>
              <p className="text-sm text-gray-600">Satisfação Pós-Garantia</p>
              <p className="text-xs text-gray-500">Meta: &gt; 95%</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
              <p className="text-sm text-gray-600">Conformidade Bosch</p>
              <p className="text-xs text-gray-500">Certificações aprovadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Configuração de Ambientes */}
      <Dialog open={isEnvironmentConfigOpen} onOpenChange={setIsEnvironmentConfigOpen}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuração de Ambientes Especiais</DialogTitle>
          </DialogHeader>
          <EnvironmentConfigManager onClose={() => setIsEnvironmentConfigOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}