import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaxTypeManagement } from '@/components/fiscal/TaxTypeManagement';
import { TaxRegimeManagement } from '@/components/fiscal/TaxRegimeManagement';
import { FiscalClassificationManagement } from '@/components/fiscal/FiscalClassificationManagement';
import { TaxRuleManagement } from '@/components/fiscal/TaxRuleManagement';
import { TaxRateTableManagement } from '@/components/fiscal/TaxRateTableManagement';
import { CompanyFiscalSettings } from '@/components/fiscal/CompanyFiscalSettings';
import { ObligationKindManagement } from '@/components/fiscal/ObligationKindManagement';
import ObligationManagement from '@/components/fiscal/ObligationManagement';
import { TaxCalculationPage } from '@/components/fiscal/TaxCalculationPage';
import { TaxReports } from '@/components/fiscal/TaxReports';
import { ApuracaoFiscal } from '@/components/fiscal/ApuracaoFiscal';
import { 
  Calculator, 
  FileText, 
  Settings, 
  Receipt, 
  Building2, 
  BookOpen, 
  Gavel, 
  AlertTriangle,
  Percent,
  Building
} from 'lucide-react';

export default function ModuloFiscal() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Módulo Fiscal</h1>
          <p className="text-muted-foreground">
            Gestão completa de tributos, obrigações acessórias e apuração de impostos
          </p>
        </div>
      </div>

      <Tabs defaultValue="tributos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11">
          <TabsTrigger value="tributos" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Tributos
          </TabsTrigger>
          <TabsTrigger value="regimes" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Regimes
          </TabsTrigger>
          <TabsTrigger value="classificacoes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Classificações
          </TabsTrigger>
          <TabsTrigger value="regras" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="aliquotas" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Alíquotas
          </TabsTrigger>
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="obrigacoes-tipos" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Tipos Obrig.
          </TabsTrigger>
          <TabsTrigger value="obrigacoes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Obrigações
          </TabsTrigger>
          <TabsTrigger value="calculos" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Cálculos
          </TabsTrigger>
          <TabsTrigger value="apuracao" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Apuração
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tributos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Gestão de Tipos de Tributos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaxTypeManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regimes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gestão de Regimes Tributários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaxRegimeManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classificacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Gestão de Classificações Fiscais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FiscalClassificationManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regras" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Gestão de Regras Fiscais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaxRuleManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aliquotas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Gestão de Tabelas de Alíquotas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaxRateTableManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Configurações Fiscais da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyFiscalSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obrigacoes-tipos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gestão de Tipos de Obrigações Acessórias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ObligationKindManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obrigacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Gestão de Obrigações Acessórias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ObligationManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Cálculo e Simulação de Impostos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaxCalculationPage />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apuracao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Apuração Fiscal Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApuracaoFiscal />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatórios Fiscais e Apuração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaxReports />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
