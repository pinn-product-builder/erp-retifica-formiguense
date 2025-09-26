import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QualityChecklistManager } from '@/components/quality/QualityChecklistManager';
import { TechnicalReportsManager } from '@/components/quality/TechnicalReportsManager';
import { QualityTemplateManager } from '@/components/quality/QualityTemplateManager';
import { 
  CheckSquare, 
  FileText, 
  Shield, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  Settings,
  Plus,
  Edit
} from 'lucide-react';

export default function ControleQualidade() {
  const [activeTab, setActiveTab] = useState('checklists');
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Controle de Qualidade e Normas Técnicas
          </h1>
          <p className="text-gray-600 mt-1">
            Checklists por etapa e relatórios técnicos automáticos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsTemplateManagerOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Templates
          </Button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Checklists Ativos</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Aguardando preenchimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Relatórios Gerados</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              +18 este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conformidade</p>
                <p className="text-2xl font-bold text-purple-600">0%</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Meta: 95%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Não Conformidades</p>
                <p className="text-2xl font-bold text-orange-600">0</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              2 críticas, 3 médias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="checklists" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Checklists de Qualidade
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Relatórios Técnicos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checklists" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Checklists por Etapa do Workflow</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Pendente</span>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Em Andamento</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Aprovado</span>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Reprovado</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Sistema de checklists obrigatórios por etapa do workflow, seguindo normas técnicas 
                  específicas (NBR 13032, Bosch RAM). Bloqueios automáticos para itens críticos 
                  e aprovação por supervisores quando necessário.
                </p>
                <QualityChecklistManager />
              </div>
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Relatórios Técnicos Automáticos</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BarChart3 className="h-4 w-4" />
                    <span>Geração Automática</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Relatórios técnicos gerados automaticamente ao concluir etapas importantes, 
                  incluindo medições, fotos, observações e conformidade com normas. 
                  Templates configuráveis por norma técnica.
                </p>
                <TechnicalReportsManager />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Standards Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              NBR 13032
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Norma brasileira para retífica de motores, estabelecendo padrões para medições e tolerâncias.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Medições dimensionais
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Tolerâncias geométricas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Acabamento superficial
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Testes de pressão
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Bosch RAM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Padrão Bosch para retífica de componentes de injeção, com 14 etapas específicas.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Ambiente limpo obrigatório
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Bancada homologada
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Curvas de teste automáticas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Peças originais/homologadas
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              ISO 9001
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Sistema de gestão da qualidade para garantia de processos e rastreabilidade.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Rastreabilidade completa
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Controle de documentos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Ações corretivas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Melhoria contínua
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Gerenciador de Templates */}
      <Dialog open={isTemplateManagerOpen} onOpenChange={setIsTemplateManagerOpen}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciador de Templates de Qualidade</DialogTitle>
          </DialogHeader>
          <QualityTemplateManager onClose={() => setIsTemplateManagerOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
