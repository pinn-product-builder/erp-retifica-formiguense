import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QualityChecklistManager } from '@/components/quality/QualityChecklistManager';
import { TechnicalReportsManager } from '@/components/quality/TechnicalReportsManager';
import { WarrantyClaimsManager } from '@/components/warranty/WarrantyClaimsManager';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Award,
  Clock,
  TrendingUp
} from 'lucide-react';

interface OrderContext {
  id?: string;
  number?: string;
  customer?: string;
  status?: string;
  progress?: number;
  currentStep?: string;
}

interface QualityCenterProps {
  orderContext?: OrderContext;
}

export function QualityCenter({ orderContext }: QualityCenterProps) {
  const [activeTab, setActiveTab] = useState('checklists');

  // Dados simulados para demonstração
  const qualityStats = {
    checklistsAtivos: 0,
    relatoriosGerados: 0,
    taxaConformidade: 0,
    naoConformidades: 0,
    garantiasAtivas: 0,
    reclamacoesAbertas: 0
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header com contexto da ordem */}
      {orderContext?.number && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900">
                  Controle de Qualidade - OS: {orderContext.number}
                </h3>
                <p className="text-sm text-green-700">
                  Cliente: {orderContext.customer}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="border-green-300 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Qualidade em Análise
                </Badge>
                {orderContext.progress && (
                  <div className="mt-2 w-32">
                    <Progress value={orderContext.progress} className="bg-green-100" />
                    <p className="text-xs text-green-600 mt-1">
                      {orderContext.progress}% concluído
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard de Qualidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Checklists Ativos</p>
                <p className="text-2xl font-bold text-blue-600">{qualityStats.checklistsAtivos}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Por etapa de produção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Relatórios Gerados</p>
                <p className="text-2xl font-bold text-green-600">{qualityStats.relatoriosGerados}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Automáticos por norma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conformidade</p>
                <p className="text-2xl font-bold text-purple-600">{qualityStats.taxaConformidade}%</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Meta: &gt; 95%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Não Conformidades</p>
                <p className="text-2xl font-bold text-orange-600">{qualityStats.naoConformidades}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Abertas este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Garantias Ativas</p>
                <p className="text-2xl font-bold text-indigo-600">{qualityStats.garantiasAtivas}</p>
              </div>
              <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <Award className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Em período de cobertura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reclamações</p>
                <p className="text-2xl font-bold text-red-600">{qualityStats.reclamacoesAbertas}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Aguardando resolução
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Centro de Qualidade e Garantias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checklists" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Checklists
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Relatórios
              </TabsTrigger>
              <TabsTrigger value="warranty" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Garantias
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checklists" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Checklists de Qualidade por Etapa</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Controle de qualidade obrigatório para cada etapa do processo produtivo, 
                      seguindo normas técnicas específicas (NBR 13032, Bosch RAM).
                    </p>
                  </div>
                </div>
              </div>
              <QualityChecklistManager />
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Relatórios Técnicos Automáticos</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Geração automática de relatórios técnicos ao concluir etapas, 
                      com documentação completa e certificação de qualidade.
                    </p>
                  </div>
                </div>
              </div>
              <TechnicalReportsManager />
            </TabsContent>

            <TabsContent value="warranty" className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">Sistema de Garantias e Reclamações</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Gestão completa de garantias pós-serviço, controle de reclamações 
                      e workflow especializado para atendimento Bosch.
                    </p>
                  </div>
                </div>
              </div>
              <WarrantyClaimsManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Resumo de Processos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Processo de Qualidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Checklist por Etapa</p>
                  <p className="text-sm text-gray-600">Verificação obrigatória antes de avançar</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-green-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Aprovação Supervisão</p>
                  <p className="text-sm text-gray-600">Validação por supervisor qualificado</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Relatório Automático</p>
                  <p className="text-sm text-gray-600">Geração de documentação técnica</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              Fluxo de Garantias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-orange-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Ativação Automática</p>
                  <p className="text-sm text-gray-600">Garantia criada na entrega</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-red-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Reclamações</p>
                  <p className="text-sm text-gray-600">Sistema de atendimento especializado</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Workflow Bosch</p>
                  <p className="text-sm text-gray-600">Processo especializado para parceiros</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
