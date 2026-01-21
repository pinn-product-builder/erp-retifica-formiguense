// @ts-nocheck
import { useCallback } from 'react';
import { DetailedBudget } from '@/hooks/useDetailedBudgets';

export function useBudgetPDF() {
  const generateBudgetPDF = useCallback((budget: DetailedBudget) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
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
        'draft': 'Rascunho',
        'cancelled': 'Cancelado',
        'expired': 'Expirado',
      };
      return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
        'pending': '#f59e0b',
        'approved': '#10b981',
        'rejected': '#ef4444',
        'partially_approved': '#3b82f6',
      };
      return colors[status] || '#6b7280';
    };

    const printHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Orçamento ${budget.budget_number || budget.id.slice(-6)}</title>
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
            max-width: 800px;
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
          
          .header h2 {
            font-size: 24px;
            font-weight: 600;
            color: #666;
            margin-bottom: 15px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            color: white;
            background-color: ${getStatusColor(budget.status)};
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          
          .info-section {
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
          }
          
          .info-section h3 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 4px 0;
          }
          
          .info-label {
            font-weight: 500;
            color: #333;
          }
          
          .info-value {
            color: #666;
            text-align: right;
          }
          
          .parts-section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 15px;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
          }
          
          .parts-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          .parts-table th,
          .parts-table td {
            border: 1px solid #333;
            padding: 12px 8px;
            text-align: left;
          }
          
          .parts-table th {
            background: #f0f0f0;
            font-weight: 600;
          }
          
          .parts-table .text-center {
            text-align: center;
          }
          
          .parts-table .text-right {
            text-align: right;
          }
          
          .subtotal-section {
            margin-top: 15px;
            padding: 15px;
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          
          .subtotal-row {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: 600;
          }
          
          .total-section {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border: 2px solid #333;
            border-radius: 8px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 16px;
          }
          
          .total-final {
            font-size: 20px;
            font-weight: bold;
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #333;
          }
          
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 20px;
          }
          
          .signature-box {
            text-align: center;
          }
          
          .signature-line {
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
            margin-bottom: 15px;
            font-weight: 500;
          }
          
          .signature-space {
            height: 60px;
          }
          
          .signature-label {
            font-size: 12px;
            color: #666;
          }
          
          .generated-info {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
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
            <h1>ORÇAMENTO</h1>
            <h2>${budget.budget_number || `#${budget.id.slice(-6)}`}</h2>
            <div class="status-badge">${getStatusLabel(budget.status)}</div>
          </div>

          <!-- Informações Gerais -->
          <div class="info-grid">
            <div class="info-section">
              <h3>DADOS DO ORÇAMENTO</h3>
              <div class="info-item">
                <span class="info-label">Número:</span>
                <span class="info-value">${budget.budget_number || `#${budget.id.slice(-6)}`}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value">${getStatusLabel(budget.status)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Componente:</span>
                <span class="info-value">${budget.component || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Data de Criação:</span>
                <span class="info-value">${formatDate(budget.created_at)}</span>
              </div>
              ${budget.estimated_delivery_days ? `
              <div class="info-item">
                <span class="info-label">Prazo de Entrega:</span>
                <span class="info-value">${budget.estimated_delivery_days} dias</span>
              </div>
              ` : ''}
              ${budget.warranty_months ? `
              <div class="info-item">
                <span class="info-label">Garantia:</span>
                <span class="info-value">${budget.warranty_months} meses</span>
              </div>
              ` : ''}
            </div>
            
            <div class="info-section">
              <h3>DADOS DA ORDEM</h3>
              <div class="info-item">
                <span class="info-label">Número da OS:</span>
                <span class="info-value">${budget.order?.order_number || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Cliente:</span>
                <span class="info-value">${budget.order?.customer?.name || 'N/A'}</span>
              </div>
              ${budget.order?.customer?.phone ? `
              <div class="info-item">
                <span class="info-label">Telefone:</span>
                <span class="info-value">${budget.order.customer.phone}</span>
              </div>
              ` : ''}
              ${budget.order?.customer?.email ? `
              <div class="info-item">
                <span class="info-label">E-mail:</span>
                <span class="info-value">${budget.order.customer.email}</span>
              </div>
              ` : ''}
            </div>
          </div>

          ${(() => {
            const parts = budget.parts && Array.isArray(budget.parts) ? budget.parts : [];
            const services = budget.services && Array.isArray(budget.services) ? budget.services : [];
            
            let html = '';
            
            if (parts.length > 0) {
              html += `
                <div class="parts-section">
                  <h2 class="section-title">PEÇAS</h2>
                  <table class="parts-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Código</th>
                        <th class="text-center">Quantidade</th>
                        <th class="text-right">Preço Unitário</th>
                        <th class="text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
              `;
              
              parts.forEach((part: any) => {
                const quantity = Number(part.quantity) || 1;
                const unitPrice = Number(part.unit_price) || 0;
                const total = Number(part.total) || (quantity * unitPrice);
                html += `
                  <tr>
                    <td>
                      <div style="font-weight: 500;">${part.part_name || part.name || 'N/A'}</div>
                    </td>
                    <td>${part.part_code || part.code || 'N/A'}</td>
                    <td class="text-center">${quantity}</td>
                    <td class="text-right">${formatCurrency(unitPrice)}</td>
                    <td class="text-right">${formatCurrency(total)}</td>
                  </tr>
                `;
              });
              
              html += `
                    </tbody>
                  </table>
                  <div class="subtotal-section">
                    <div class="subtotal-row">
                      <span>Subtotal Peças:</span>
                      <span>${formatCurrency(budget.parts_total || parts.reduce((sum: number, p: any) => sum + (Number(p.total) || 0), 0))}</span>
                    </div>
                  </div>
                </div>
              `;
            }
            
            if (services.length > 0) {
              html += `
                <div class="parts-section">
                  <h2 class="section-title">SERVIÇOS</h2>
                  <table class="parts-table">
                    <thead>
                      <tr>
                        <th>Descrição</th>
                        <th class="text-center">Quantidade</th>
                        <th class="text-right">Preço Unitário</th>
                        <th class="text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
              `;
              
              services.forEach((service: any) => {
                const quantity = Number(service.quantity) || 1;
                const unitPrice = Number(service.unit_price) || 0;
                const total = Number(service.total) || (quantity * unitPrice);
                html += `
                  <tr>
                    <td>
                      <div style="font-weight: 500;">${service.description || service.name || 'N/A'}</div>
                    </td>
                    <td class="text-center">${quantity}</td>
                    <td class="text-right">${formatCurrency(unitPrice)}</td>
                    <td class="text-right">${formatCurrency(total)}</td>
                  </tr>
                `;
              });
              
              html += `
                    </tbody>
                  </table>
                  <div class="subtotal-section">
                    <div class="subtotal-row">
                      <span>Subtotal Serviços:</span>
                      <span>${formatCurrency(budget.labor_total || services.reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0))}</span>
                    </div>
                  </div>
                </div>
              `;
            }
            
            if (parts.length === 0 && services.length === 0) {
              html = `
                <div class="parts-section">
                  <h2 class="section-title">PEÇAS E SERVIÇOS</h2>
                  <div style="text-align: center; padding: 40px; color: #666;">
                    Nenhum item cadastrado
                  </div>
                </div>
              `;
            }
            
            return html;
          })()}
          
          <div class="total-section">
            <h2 class="section-title">RESUMO FINANCEIRO</h2>
            ${(() => {
              const parts = budget.parts && Array.isArray(budget.parts) ? budget.parts : [];
              const services = budget.services && Array.isArray(budget.services) ? budget.services : [];
              const partsTotal = budget.parts_total || parts.reduce((sum: number, p: any) => sum + (Number(p.total) || 0), 0);
              const servicesTotal = budget.labor_total || services.reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
              
              let html = '';
              
              if (parts.length > 0) {
                html += `
                  <div class="total-row">
                    <span>Subtotal Peças:</span>
                    <span>${formatCurrency(partsTotal)}</span>
                  </div>
                `;
              }
              
              if (services.length > 0) {
                html += `
                  <div class="total-row">
                    <span>Subtotal Serviços:</span>
                    <span>${formatCurrency(servicesTotal)}</span>
                  </div>
                `;
              }
              
              return html;
            })()}
            ${budget.discount && budget.discount > 0 ? `
            <div class="total-row">
              <span>Desconto (${budget.discount}%):</span>
              <span>-${formatCurrency(((budget.labor_total || 0) + (budget.parts_total || 0)) * (budget.discount / 100))}</span>
            </div>
            ` : ''}
            ${budget.tax_amount && budget.tax_amount > 0 ? `
            <div class="total-row">
              <span>Impostos (${budget.tax_percentage || 0}%):</span>
              <span>${formatCurrency(budget.tax_amount)}</span>
            </div>
            ` : ''}
            <div class="total-row total-final">
              <span>TOTAL:</span>
              <span>${formatCurrency(budget.total_amount || 0)}</span>
            </div>
          </div>


          <!-- Rodapé -->
          <div class="footer">
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line">Responsável Técnico</div>
                <div class="signature-space"></div>
                <div class="signature-label">Assinatura</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">Cliente</div>
                <div class="signature-space"></div>
                <div class="signature-label">Assinatura</div>
              </div>
            </div>
            <div class="generated-info">
              <p>Documento gerado em ${formatDate(new Date().toISOString())}</p>
              <p>Sistema ERP Retífica Formiguense</p>
            </div>
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
  }, []);

  return { generateBudgetPDF };
}
