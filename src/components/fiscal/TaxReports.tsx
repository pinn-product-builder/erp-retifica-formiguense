
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Calendar, Calculator } from 'lucide-react';

export function TaxReports() {
  const [reportPeriod, setReportPeriod] = useState({
    startDate: '',
    endDate: ''
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Data Inicial</Label>
          <Input
            id="startDate"
            type="date"
            value={reportPeriod.startDate}
            onChange={(e) => setReportPeriod({ ...reportPeriod, startDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="endDate">Data Final</Label>
          <Input
            id="endDate"
            type="date"
            value={reportPeriod.endDate}
            onChange={(e) => setReportPeriod({ ...reportPeriod, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Relatório de Impostos Calculados
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              Total de impostos no período
            </p>
            <Button className="w-full mt-4" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Apuração Mensal
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Períodos apurados
            </p>
            <Button className="w-full mt-4" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Ver Apuração
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Obrigações Pendentes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Obrigações em aberto
            </p>
            <Button className="w-full mt-4" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Ver Obrigações
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Relatórios Disponíveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Demonstrativo de Cálculo de ICMS</h4>
                  <p className="text-sm text-muted-foreground">Relatório detalhado por operação</p>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Livro de Apuração de ISS</h4>
                  <p className="text-sm text-muted-foreground">Consolidação mensal do ISS</p>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Relatório de PIS/COFINS</h4>
                  <p className="text-sm text-muted-foreground">Apuração de contribuições federais</p>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Simulação de Carga Tributária</h4>
                  <p className="text-sm text-muted-foreground">Análise por tipo de operação</p>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
