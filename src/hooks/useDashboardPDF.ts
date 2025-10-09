import { useCallback } from 'react';
import { useDashboard } from './useDashboard';
import { useDashboardTabs } from './useDashboardTabs';

export function useDashboardPDF() {
  const { kpis } = useDashboard();
  const { activeTab, tabs } = useDashboardTabs();

  const generateDashboardPDF = useCallback(() => {
    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    
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

    const formatNumber = (value: number) => {
      return new Intl.NumberFormat('pt-BR').format(value);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };

    const currentDate = formatDate(new Date());
    const currentTab = tabs.find(tab => tab.id === activeTab);

    // Organizar KPIs em grupos
    const kpiGroups = {
      orders: kpis.filter(kpi => 
        kpi.code.includes('order') || 
        kpi.name.toLowerCase().includes('pedido') ||
        kpi.name.toLowerCase().includes('ordem')
      ),
      services: kpis.filter(kpi => 
        kpi.code.includes('service') || 
        kpi.name.toLowerCase().includes('serviço')
      ),
      financial: kpis.filter(kpi => 
        kpi.code.includes('revenue') || 
        kpi.code.includes('value') ||
        kpi.name.toLowerCase().includes('faturamento') ||
        kpi.name.toLowerCase().includes('valor')
      ),
      other: kpis.filter(kpi => 
        !kpi.code.includes('order') && 
        !kpi.code.includes('service') && 
        !kpi.code.includes('revenue') && 
        !kpi.code.includes('value') &&
        !kpi.name.toLowerCase().includes('pedido') &&
        !kpi.name.toLowerCase().includes('ordem') &&
        !kpi.name.toLowerCase().includes('serviço') &&
        !kpi.name.toLowerCase().includes('faturamento') &&
        !kpi.name.toLowerCase().includes('valor')
      )
    };

    const printHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - Retífica Formiguense</title>
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
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #1a1a1a;
          }
          
          .header h2 {
            font-size: 20px;
            font-weight: 600;
            color: #666;
            margin-bottom: 10px;
          }
          
          .header-info {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            font-size: 14px;
            color: #666;
          }
          
          .section-title {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #333;
            color: #1a1a1a;
          }
          
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .kpi-card {
            background: #f8f9fa;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          
          .kpi-title {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
            font-weight: 500;
            text-transform: uppercase;
          }
          
          .kpi-value {
            font-size: 24px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 5px;
          }
          
          .kpi-subtitle {
            font-size: 11px;
            color: #999;
          }
          
          .kpi-trend {
            display: inline-block;
            margin-top: 8px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
          }
          
          .kpi-trend.positive {
            background: #d1fae5;
            color: #065f46;
          }
          
          .kpi-trend.negative {
            background: #fee2e2;
            color: #991b1b;
          }
          
          .section-group {
            margin-bottom: 30px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #333;
            text-align: center;
          }
          
          .footer-info {
            font-size: 12px;
            color: #666;
            line-height: 1.8;
          }
          
          .watermark {
            position: fixed;
            bottom: 20px;
            right: 20px;
            opacity: 0.1;
            font-size: 80px;
            font-weight: bold;
            color: #333;
            transform: rotate(-45deg);
            pointer-events: none;
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
            
            .kpi-grid {
              break-inside: avoid;
            }
            
            .section-group {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Header -->
          <div class="header">
            <h1>📊 DASHBOARD - RETÍFICA FORMIGUENSE</h1>
            <h2>${currentTab?.label || 'Visão Geral'}</h2>
            <div class="header-info">
              <span>📅 Gerado em: ${currentDate}</span>
              <span>👤 Sistema ERP</span>
            </div>
          </div>

          ${kpiGroups.orders.length > 0 ? `
          <!-- Pedidos e Ordens -->
          <div class="section-group">
            <h2 class="section-title">📋 Pedidos e Ordens de Serviço</h2>
            <div class="kpi-grid">
              ${kpiGroups.orders.map(kpi => `
                <div class="kpi-card">
                  <div class="kpi-title">${kpi.name}</div>
                  <div class="kpi-value">${kpi.formattedValue || kpi.value || 0}</div>
                  ${kpi.subtitle ? `<div class="kpi-subtitle">${kpi.subtitle}</div>` : ''}
                  ${kpi.trend ? `
                    <div class="kpi-trend ${kpi.trend.isPositive ? 'positive' : 'negative'}">
                      ${kpi.trend.isPositive ? '↗' : '↘'} ${Math.abs(kpi.trend.value)}%
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${kpiGroups.services.length > 0 ? `
          <!-- Serviços -->
          <div class="section-group">
            <h2 class="section-title">🔧 Serviços</h2>
            <div class="kpi-grid">
              ${kpiGroups.services.map(kpi => `
                <div class="kpi-card">
                  <div class="kpi-title">${kpi.name}</div>
                  <div class="kpi-value">${kpi.formattedValue || kpi.value || 0}</div>
                  ${kpi.subtitle ? `<div class="kpi-subtitle">${kpi.subtitle}</div>` : ''}
                  ${kpi.trend ? `
                    <div class="kpi-trend ${kpi.trend.isPositive ? 'positive' : 'negative'}">
                      ${kpi.trend.isPositive ? '↗' : '↘'} ${Math.abs(kpi.trend.value)}%
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${kpiGroups.financial.length > 0 ? `
          <!-- Financeiro -->
          <div class="section-group">
            <h2 class="section-title">💰 Financeiro</h2>
            <div class="kpi-grid">
              ${kpiGroups.financial.map(kpi => `
                <div class="kpi-card">
                  <div class="kpi-title">${kpi.name}</div>
                  <div class="kpi-value">${kpi.formattedValue || kpi.value || 0}</div>
                  ${kpi.subtitle ? `<div class="kpi-subtitle">${kpi.subtitle}</div>` : ''}
                  ${kpi.trend ? `
                    <div class="kpi-trend ${kpi.trend.isPositive ? 'positive' : 'negative'}">
                      ${kpi.trend.isPositive ? '↗' : '↘'} ${Math.abs(kpi.trend.value)}%
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${kpiGroups.other.length > 0 ? `
          <!-- Outras Métricas -->
          <div class="section-group">
            <h2 class="section-title">📊 Outras Métricas</h2>
            <div class="kpi-grid">
              ${kpiGroups.other.map(kpi => `
                <div class="kpi-card">
                  <div class="kpi-title">${kpi.name}</div>
                  <div class="kpi-value">${kpi.formattedValue || kpi.value || 0}</div>
                  ${kpi.subtitle ? `<div class="kpi-subtitle">${kpi.subtitle}</div>` : ''}
                  ${kpi.trend ? `
                    <div class="kpi-trend ${kpi.trend.isPositive ? 'positive' : 'negative'}">
                      ${kpi.trend.isPositive ? '↗' : '↘'} ${Math.abs(kpi.trend.value)}%
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <div class="footer-info">
              <p><strong>Sistema ERP - Retífica Formiguense</strong></p>
              <p>Relatório gerado automaticamente em ${currentDate}</p>
              <p>Este documento contém informações confidenciais da empresa</p>
              <p>Aba atual: ${currentTab?.label || 'Dashboard'}</p>
            </div>
          </div>
        </div>
        
        <div class="watermark">ERP</div>
      </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }, [kpis, activeTab, tabs]);

  return { generateDashboardPDF };
}

