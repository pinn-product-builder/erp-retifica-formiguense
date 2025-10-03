import { useCallback } from 'react';
import { Order } from './useOrders';

export function usePrintOrder() {
  const printOrder = useCallback((order: Order) => {
    // Funções auxiliares
    const formatDate = (date: string) => {
      return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatDateOnly = (date: string) => {
      return new Date(date).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        'ativa': 'Ativa',
        'em_analise': 'Em Análise',
        'aprovada': 'Aprovada',
        'em_producao': 'Em Produção',
        'concluida': 'Concluída',
        'entregue': 'Entregue',
        'cancelada': 'Cancelada'
      };
      return labels[status] || status;
    };

    const getPriorityLabel = (priority: number) => {
      const labels = {
        1: 'Normal',
        2: 'Alta',
        3: 'Urgente'
      };
      return labels[priority as keyof typeof labels] || 'Normal';
    };

    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      console.error('Não foi possível abrir a janela de impressão');
      return;
    }

    // HTML completo da página de impressão
    const printHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OS ${order.order_number}</title>
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
          }
          
          .status-badges {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 15px;
          }
          
          .badge {
            padding: 6px 12px;
            background: #f0f0f0;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
          }
          
          .section {
            margin-bottom: 25px;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          
          .info-label {
            font-weight: 500;
          }
          
          .observations {
            background: #f8f8f8;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-top: 10px;
          }
          
          .materials-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          .materials-table th,
          .materials-table td {
            border: 1px solid #333;
            padding: 8px 12px;
            text-align: left;
          }
          
          .materials-table th {
            background: #f0f0f0;
            font-weight: 600;
          }
          
          .materials-table .text-center {
            text-align: center;
          }
          
          .materials-table .text-right {
            text-align: right;
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
            
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Header -->
          <div class="header">
            <h1>ORDEM DE SERVIÇO</h1>
            <h2>#${order.order_number}</h2>
            <div class="status-badges">
              <span class="badge">Status: ${getStatusLabel(order.status)}</span>
              <span class="badge">Prioridade: ${getPriorityLabel(order.priority)}</span>
            </div>
          </div>

          <!-- Informações Gerais -->
          <div class="section">
            <div class="info-grid">
              <div>
                <h3 class="section-title">DADOS DA ORDEM</h3>
                <div class="info-item">
                  <span class="info-label">Número da OS:</span>
                  <span>${order.order_number}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Data de Criação:</span>
                  <span>${formatDate(order.created_at)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Última Atualização:</span>
                  <span>${formatDate(order.updated_at)}</span>
                </div>
                ${order.estimated_delivery ? `
                <div class="info-item">
                  <span class="info-label">Previsão de Entrega:</span>
                  <span>${formatDateOnly(order.estimated_delivery)}</span>
                </div>
                ` : ''}
                ${order.actual_delivery ? `
                <div class="info-item">
                  <span class="info-label">Data de Entrega:</span>
                  <span>${formatDateOnly(order.actual_delivery)}</span>
                </div>
                ` : ''}
                ${order.warranty_months ? `
                <div class="info-item">
                  <span class="info-label">Garantia:</span>
                  <span>${order.warranty_months} meses</span>
                </div>
                ` : ''}
              </div>
              
              <div>
                <h3 class="section-title">DADOS DA COLETA</h3>
                ${order.collection_date ? `
                <div class="info-item">
                  <span class="info-label">Data da Coleta:</span>
                  <span>${formatDateOnly(order.collection_date)}</span>
                </div>
                ` : ''}
                ${order.collection_time ? `
                <div class="info-item">
                  <span class="info-label">Hora da Coleta:</span>
                  <span>${order.collection_time}</span>
                </div>
                ` : ''}
                ${order.collection_location ? `
                <div class="info-item">
                  <span class="info-label">Local da Coleta:</span>
                  <span>${order.collection_location}</span>
                </div>
                ` : ''}
                ${order.driver_name ? `
                <div class="info-item">
                  <span class="info-label">Motorista:</span>
                  <span>${order.driver_name}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Cliente -->
          ${order.customer ? `
          <div class="section">
            <h3 class="section-title">DADOS DO CLIENTE</h3>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">Nome:</span>
                  <span>${order.customer.name}</span>
                </div>
                ${order.customer.phone ? `
                <div class="info-item">
                  <span class="info-label">Telefone:</span>
                  <span>${order.customer.phone}</span>
                </div>
                ` : ''}
              </div>
              <div>
                ${order.customer.email ? `
                <div class="info-item">
                  <span class="info-label">E-mail:</span>
                  <span>${order.customer.email}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Consultor -->
          ${order.consultant ? `
          <div class="section">
            <h3 class="section-title">CONSULTOR RESPONSÁVEL</h3>
            <div class="info-item">
              <span class="info-label">Nome:</span>
              <span>${order.consultant.full_name}</span>
            </div>
          </div>
          ` : ''}

          <!-- Motor -->
          ${order.engine ? `
          <div class="section">
            <h3 class="section-title">DADOS DO MOTOR</h3>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">Tipo:</span>
                  <span>${order.engine.type}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Marca:</span>
                  <span>${order.engine.brand}</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">Modelo:</span>
                  <span>${order.engine.model}</span>
                </div>
              </div>
            </div>
          </div>
          ` : ''}


          <!-- Materiais -->
          ${order.materials && order.materials.length > 0 ? `
          <div class="section">
            <h3 class="section-title">MATERIAIS UTILIZADOS</h3>
            <table class="materials-table">
              <thead>
                <tr>
                  <th>Peça</th>
                  <th>Código</th>
                  <th class="text-center">Qtd</th>
                  <th class="text-right">Custo Unit.</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.materials.map(material => `
                <tr>
                  <td>${material.part_name}</td>
                  <td>${material.part_code}</td>
                  <td class="text-center">${material.quantity}</td>
                  <td class="text-right">${formatCurrency(material.unit_cost)}</td>
                  <td class="text-right">${formatCurrency(material.total_cost)}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <!-- Rodapé -->
          <div class="footer">
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line">Responsável pela Coleta</div>
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
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Escrever o HTML na janela
    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Aguardar o carregamento e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  }, []);

  return { printOrder };
}
