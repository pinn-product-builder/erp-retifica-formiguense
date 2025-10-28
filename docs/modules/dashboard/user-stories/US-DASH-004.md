# US-DASH-004: Exportação de Dashboard para PDF

**ID:** US-DASH-004  
**Epic:** Dashboard  
**Sprint:** -  
**Prioridade:** Baixa  
**Estimativa:** -  
**Status:** Implementado ✅

---

## 📋 User Story

**Como** gerente da retífica  
**Quero** exportar o dashboard completo em PDF  
**Para** compartilhar relatórios com stakeholders ou imprimir

---

## 🎯 Business Objective

Permitir compartilhamento offline de métricas do dashboard em formato profissional.

---

## 📐 Business Rules

### RN-DASH-010: Conteúdo do PDF
```typescript
// Inclui no PDF:
- Cabeçalho com logo e data
- Todos os KPIs ativos
- Status de orçamentos pendentes
- Gráficos (se houver)
- Rodapé com informações da organização
```

### RN-DASH-011: Formatação
- Formato A4 paisagem
- Cores adaptadas para impressão
- Fonte: Arial ou similar (boa legibilidade)

### RN-DASH-012: Nome do Arquivo
```typescript
const filename = `dashboard-${orgName}-${formatDate(new Date())}.pdf`;
// Ex: dashboard-retifica-formiguense-2025-10-28.pdf
```

---

## 🧪 Implementação Atual

**Hook:** `src/hooks/useDashboardPDF.ts`  
**Biblioteca:** `jspdf`, `html2canvas`

### Função Principal
```typescript
const generateDashboardPDF = async () => {
  // 1. Captura elementos visuais
  const dashboardElement = document.getElementById('dashboard-content');
  const canvas = await html2canvas(dashboardElement);
  
  // 2. Cria PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // 3. Adiciona conteúdo
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 10, 10, 277, 190);
  
  // 4. Salva
  pdf.save(filename);
};
```

---

## ✅ Acceptance Criteria

**AC01:** Botão "Exportar PDF" visível no header do dashboard  
**AC02:** PDF gerado inclui todos os KPIs visíveis  
**AC03:** Formato A4 paisagem, boa qualidade  
**AC04:** Nome do arquivo contém nome da org e data  
**AC05:** Download inicia automaticamente ao clicar

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
