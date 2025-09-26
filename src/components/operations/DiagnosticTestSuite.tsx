import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RotateCcw,
  Database,
  Upload,
  Calculator,
  FileText
} from "lucide-react";
import { useDiagnosticChecklists } from "@/hooks/useDiagnosticChecklists";
import { useBudgets } from "@/hooks/useBudgets";
import { useEngineTypes } from "@/hooks/useEngineTypes";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  details?: any;
}

const DiagnosticTestSuite = () => {
  const { toast } = useToast();
  const { getDiagnosticChecklists, createDiagnosticChecklist, createDiagnosticChecklistItem } = useDiagnosticChecklists();
  const { getServicePrices, getPartsPrices, calculateBudgetFromServices } = useBudgets();
  const { getEngineTypes } = useEngineTypes();
  const { getOrders } = useOrders();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const tests = [
    {
      id: 'database_connection',
      name: 'Conexão com Banco de Dados',
      test: async () => {
        const engineTypes = await getEngineTypes();
        return engineTypes && engineTypes.length > 0;
      }
    },
    {
      id: 'checklist_crud',
      name: 'CRUD de Checklists',
      test: async () => {
        // Test create checklist
        const testChecklist = await createDiagnosticChecklist({
          name: 'Teste Checklist',
          description: 'Checklist para testes',
          component: 'bloco',
          is_active: true
        });
        
        if (!testChecklist) return false;

        // Test create checklist item
        const testItem = await createDiagnosticChecklistItem({
          checklist_id: testChecklist.id,
          item_name: 'Item de Teste',
          item_description: 'Descrição do item',
          item_type: 'checkbox',
          is_required: true,
          triggers_service: ['Serviço de Teste'],
          display_order: 1
        });

        return !!testItem;
      }
    },
    {
      id: 'price_tables',
      name: 'Tabelas de Preços',
      test: async () => {
        const servicePrices = await getServicePrices();
        const partsPrices = await getPartsPrices();
        return servicePrices !== null && partsPrices !== null;
      }
    },
    {
      id: 'budget_calculation',
      name: 'Cálculo de Orçamento',
      test: async () => {
        const testServices = [
          { name: 'Serviço Teste', labor_hours: 2, labor_rate: 50 }
        ];
        const testParts = [
          { name: 'Peça Teste', quantity: 1, unit_price: 100 }
        ];
        
        const result = await calculateBudgetFromServices(testServices, testParts);
        return result && result.total_amount > 0;
      }
    },
    {
      id: 'checklist_validation',
      name: 'Validação de Checklist',
      test: async () => {
        const checklists = await getDiagnosticChecklists();
        return checklists && checklists.length > 0;
      }
    },
    {
      id: 'orders_integration',
      name: 'Integração com Ordens',
      test: async () => {
        const orders = await getOrders();
        return orders !== null;
      }
    }
  ];

  const runTest = async (test: typeof tests[0]): Promise<TestResult> => {
    const result: TestResult = {
      id: test.id,
      name: test.name,
      status: 'running',
      message: 'Executando teste...'
    };

    try {
      const passed = await test.test();
      result.status = passed ? 'passed' : 'failed';
      result.message = passed ? 'Teste passou com sucesso' : 'Teste falhou';
    } catch (error) {
      result.status = 'failed';
      result.message = `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    }

    return result;
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const results: TestResult[] = [];
    
    for (const test of tests) {
      const result = await runTest(test);
      results.push(result);
      setTestResults([...results]);
      
      // Pequena pausa entre testes para visualização
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);

    const passedTests = results.filter(r => r.status === 'passed').length;
    const totalTests = results.length;

    toast({
      title: "Testes Concluídos",
      description: `${passedTests}/${totalTests} testes passaram`,
      variant: passedTests === totalTests ? "default" : "destructive"
    });
  };

  const runSingleTest = async (test: typeof tests[0]) => {
    const result = await runTest(test);
    setTestResults(prev => {
      const filtered = prev.filter(r => r.id !== test.id);
      return [...filtered, result];
    });
  };

  const resetTests = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
      case 'running':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'running':
        return <Badge variant="secondary">Executando</Badge>;
      case 'passed':
        return <Badge variant="default" className="bg-green-500">Passou</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
    }
  };

  const passedTests = testResults.filter(r => r.status === 'passed').length;
  const failedTests = testResults.filter(r => r.status === 'failed').length;
  const totalTests = testResults.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Suite de Testes - Sistema de Diagnóstico
          </CardTitle>
          <CardDescription>
            Execute testes automatizados para verificar a integração completa do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumo dos Testes */}
          {totalTests > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                <div className="text-sm text-green-700">Testes Passaram</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                <div className="text-sm text-red-700">Testes Falharam</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
                <div className="text-sm text-blue-700">Total de Testes</div>
              </div>
            </div>
          )}

          {/* Controles */}
          <div className="flex gap-2">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Executar Todos os Testes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={resetTests}
              disabled={isRunning}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar
            </Button>
          </div>

          {/* Status Geral */}
          {totalTests > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {passedTests === totalTests ? (
                  <span className="text-green-700">
                    ✅ Todos os testes passaram! O sistema está funcionando corretamente.
                  </span>
                ) : failedTests > 0 ? (
                  <span className="text-red-700">
                    ❌ {failedTests} teste(s) falharam. Verifique os detalhes abaixo.
                  </span>
                ) : (
                  <span className="text-blue-700">
                    ⏳ Testes em andamento...
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Lista de Testes */}
      <div className="space-y-4">
        {tests.map((test) => {
          const result = testResults.find(r => r.id === test.id);
          const status = result?.status || 'pending';
          const message = result?.message || 'Aguardando execução';

          return (
            <Card key={test.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <div>
                      <h3 className="font-medium">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">{message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(status)}
                    {status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runSingleTest(test)}
                        disabled={isRunning}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Executar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detalhes dos Testes */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes dos Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-3 rounded border-l-4 ${
                    result.status === 'passed'
                      ? 'border-green-500 bg-green-50'
                      : result.status === 'failed'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.name}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiagnosticTestSuite;
