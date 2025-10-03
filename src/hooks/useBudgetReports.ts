import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { useToast } from './use-toast';

export interface BudgetReportData {
  totalBudgets: number;
  pendingApprovals: number;
  approvedBudgets: number;
  rejectedBudgets: number;
  totalValue: number;
  averageValue: number;
  budgetsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  budgetsByComponent: Array<{
    component: string;
    count: number;
    totalValue: number;
  }>;
  recentBudgets: Array<{
    id: string;
    budget_number: string;
    order_number: string;
    component: string;
    status: string;
    total_value: number;
    created_at: string;
    customer_name: string;
  }>;
}

export function useBudgetReports() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const generateBudgetReport = useCallback(async (): Promise<BudgetReportData | null> => {
    if (!currentOrganization?.id) {
      toast({
        title: 'Erro',
        description: 'Selecione uma organização para gerar relatórios',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Buscar dados dos orçamentos detalhados
      const { data: budgets, error: budgetsError } = await supabase
        .from('detailed_budgets')
        .select(`
          id,
          budget_number,
          order_id,
          component,
          status,
          total_amount,
          created_at,
          orders!inner(
            order_number,
            customers!inner(name)
          )
        `)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (budgetsError) throw budgetsError;

      // Calcular estatísticas
      const totalBudgets = budgets?.length || 0;
      const pendingApprovals = budgets?.filter(b => b.status === 'pending').length || 0;
      const approvedBudgets = budgets?.filter(b => b.status === 'approved').length || 0;
      const rejectedBudgets = budgets?.filter(b => b.status === 'rejected').length || 0;
      
      const totalValue = budgets?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const averageValue = totalBudgets > 0 ? totalValue / totalBudgets : 0;

      // Agrupar por status
      const statusGroups = budgets?.reduce((acc, budget) => {
        const status = budget.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const budgetsByStatus = Object.entries(statusGroups).map(([status, count]) => ({
        status,
        count,
        percentage: totalBudgets > 0 ? (count / totalBudgets) * 100 : 0,
      }));

      // Agrupar por componente
      const componentGroups = budgets?.reduce((acc, budget) => {
        const component = budget.component || 'unknown';
        if (!acc[component]) {
          acc[component] = { count: 0, totalValue: 0 };
        }
        acc[component].count += 1;
        acc[component].totalValue += budget.total_amount || 0;
        return acc;
      }, {} as Record<string, { count: number; totalValue: number }>) || {};

      const budgetsByComponent = Object.entries(componentGroups).map(([component, data]) => ({
        component,
        count: data.count,
        totalValue: data.totalValue,
      }));

      // Orçamentos recentes (últimos 10)
      const recentBudgets = budgets?.slice(0, 10).map(budget => ({
        id: budget.id,
        budget_number: budget.budget_number || `#${budget.id.slice(-6)}`,
        order_number: budget.orders?.order_number || 'N/A',
        component: budget.component || 'N/A',
        status: budget.status || 'unknown',
        total_value: budget.total_amount || 0,
        created_at: budget.created_at,
        customer_name: budget.orders?.customers?.name || 'N/A',
      })) || [];

      return {
        totalBudgets,
        pendingApprovals,
        approvedBudgets,
        rejectedBudgets,
        totalValue,
        averageValue,
        budgetsByStatus,
        budgetsByComponent,
        recentBudgets,
      };
    } catch (error) {
      console.error('Error generating budget report:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório de orçamentos',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentOrganization?.id, toast]);

  const printBudgetReport = useCallback((reportData: BudgetReportData) => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    
    if (!printWindow) {
      console.error('Não foi possível abrir a janela de impressão');
      return;
    }

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('pt-BR');
    };

    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        'pending': 'Pendente',
        'approved': 'Aprovado',
        'rejected': 'Rejeitado',
        'partially_approved': 'Parcialmente Aprovado',
      };
      return labels[status] || status;
    };

    const printHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Orçamentos</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          
          .print-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .header p {
            font-size: 14px;
            color: #666;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }
          
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          
          .stat-label {
            font-size: 14px;
            color: #666;
          }
          
          .section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 15px;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          .table th,
          .table td {
            border: 1px solid #333;
            padding: 8px 12px;
            text-align: left;
          }
          
          .table th {
            background: #f0f0f0;
            font-weight: 600;
          }
          
          .table .text-center {
            text-align: center;
          }
          
          .table .text-right {
            text-align: right;
          }
          
          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }
          
          .status-pending {
            background: #fef3cd;
            color: #856404;
          }
          
          .status-approved {
            background: #d4edda;
            color: #155724;
          }
          
          .status-rejected {
            background: #f8d7da;
            color: #721c24;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #333;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .print-container {
              margin: 0;
              padding: 15px;
              max-width: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Header -->
          <div class="header">
            <h1>RELATÓRIO DE ORÇAMENTOS E APROVAÇÕES</h1>
            <p>Período: ${formatDate(new Date().toISOString())}</p>
            <p>Organização: ${currentOrganization?.name || 'N/A'}</p>
          </div>

          <!-- Estatísticas Gerais -->
          <div class="section">
            <h2 class="section-title">ESTATÍSTICAS GERAIS</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${reportData.totalBudgets}</div>
                <div class="stat-label">Total de Orçamentos</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${reportData.pendingApprovals}</div>
                <div class="stat-label">Pendentes de Aprovação</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${reportData.approvedBudgets}</div>
                <div class="stat-label">Aprovados</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${reportData.rejectedBudgets}</div>
                <div class="stat-label">Rejeitados</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatCurrency(reportData.totalValue)}</div>
                <div class="stat-label">Valor Total</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${formatCurrency(reportData.averageValue)}</div>
                <div class="stat-label">Valor Médio</div>
              </div>
            </div>
          </div>

          <!-- Orçamentos por Status -->
          <div class="section">
            <h2 class="section-title">ORÇAMENTOS POR STATUS</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th class="text-center">Quantidade</th>
                  <th class="text-center">Percentual</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.budgetsByStatus.map(item => `
                <tr>
                  <td>${getStatusLabel(item.status)}</td>
                  <td class="text-center">${item.count}</td>
                  <td class="text-center">${item.percentage.toFixed(1)}%</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Orçamentos por Componente -->
          <div class="section">
            <h2 class="section-title">ORÇAMENTOS POR COMPONENTE</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Componente</th>
                  <th class="text-center">Quantidade</th>
                  <th class="text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.budgetsByComponent.map(item => `
                <tr>
                  <td>${item.component}</td>
                  <td class="text-center">${item.count}</td>
                  <td class="text-right">${formatCurrency(item.totalValue)}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Orçamentos Recentes -->
          <div class="section">
            <h2 class="section-title">ORÇAMENTOS RECENTES</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>OS</th>
                  <th>Cliente</th>
                  <th>Componente</th>
                  <th>Status</th>
                  <th class="text-right">Valor</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.recentBudgets.map(budget => `
                <tr>
                  <td>${budget.budget_number}</td>
                  <td>${budget.order_number}</td>
                  <td>${budget.customer_name}</td>
                  <td>${budget.component}</td>
                  <td>
                    <span class="status-badge status-${budget.status}">
                      ${getStatusLabel(budget.status)}
                    </span>
                  </td>
                  <td class="text-right">${formatCurrency(budget.total_value)}</td>
                  <td>${formatDate(budget.created_at)}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <p>Relatório gerado em ${formatDate(new Date().toISOString())}</p>
            <p>Sistema ERP Retífica Formiguense</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  }, [currentOrganization?.name]);

  return {
    generateBudgetReport,
    printBudgetReport,
  };
}
