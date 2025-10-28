# Módulo de Metrologia

## 📋 Visão Geral

O módulo de Metrologia é um submódulo do **Operações & Serviços** responsável pela análise dimensional e visual de componentes de motores durante o processo de retífica. Este módulo digitaliza o processo de inspeção metrológica, substituindo formulários em papel por um workflow digital estruturado.

## 🎯 Objetivo

Fornecer um sistema completo de gestão de inspeções metrológicas que permita:
- Registro estruturado de identificação de motores
- Análise visual padronizada com checklists digitais
- Medições dimensionais com controle de tolerâncias
- Geração automática de pareceres técnicos em PDF
- Rastreabilidade completa do histórico do motor (DNA)
- Integração direta com o sistema de orçamentos

## 📊 Métricas de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Tempo médio de análise | 32h | ≤24h |
| Taxa de completude de documentação | 65% | 100% |
| Taxa de retrabalho | 8% | ≤2% |
| Tempo de transição para orçamento | 4h | ≤15min |

## 🗂️ Estrutura de Arquivos

```
metrologia/
├── README.md (este arquivo)
├── user-stories/
│   ├── US-MET-001.md (Iniciar Metrologia)
│   ├── US-MET-002.md (Identificação do Motor)
│   ├── US-MET-003.md (Componentes Recebidos)
│   ├── US-MET-004.md (Análise Visual)
│   ├── US-MET-005.md (Medições Dimensionais)
│   ├── US-MET-006.md (Parecer Técnico PDF)
│   ├── US-MET-007.md (Transição para Orçamento)
│   ├── US-MET-008.md (DNA do Motor)
│   ├── US-MET-009.md (Aba em OrderDetails)
│   └── US-MET-010.md (Dashboard KPIs)
├── flows/
│   ├── metrologia-complete-flow.md
│   ├── metrology-to-budget-flow.md
│   └── motor-dna-flow.md
├── diagrams/
│   ├── workflow-stages.mmd
│   ├── database-erd.mmd
│   ├── component-architecture.mmd
│   └── data-flow.mmd
├── database/
│   ├── migrations.sql
│   ├── views.sql
│   ├── functions.sql
│   └── policies.sql
├── technical/
│   ├── components.md
│   ├── hooks.md
│   ├── utils.md
│   └── types.md
├── api/
│   ├── edge-functions.md
│   └── queries.md
├── wireframes/
│   ├── inspection-form.md
│   ├── motor-dna.md
│   └── dashboard.md
└── testing/
    ├── e2e-scenarios.md
    └── acceptance-criteria.md
```

## 🎭 Épicos e Histórias

### **Épico 1: Formulário Digital de Metrologia**
- **US-MET-001**: Iniciar Metrologia via Workflow Kanban
- **US-MET-002**: Registrar Identificação do Motor (Etapa 1/5)
- **US-MET-003**: Selecionar Componentes Recebidos (Etapa 2/5)
- **US-MET-004**: Realizar Análise Visual (Etapa 3/5)
- **US-MET-005**: Registrar Medições Dimensionais (Etapa 4/5)

### **Épico 2: Parecer Técnico e Orçamento**
- **US-MET-006**: Gerar Parecer Técnico em PDF (Etapa 5/5)
- **US-MET-007**: Transição Automática para Orçamento

### **Épico 3: DNA do Motor**
- **US-MET-008**: Visualizar Histórico Completo (DNA)

### **Épico 4: Dashboard e Integrações**
- **US-MET-009**: Aba "Metrologia" em OrderDetails
- **US-MET-010**: Dashboard de KPIs em Tempo Real

## 🔗 Integração com Outros Módulos

### **Workflow Kanban (Operações)**
- Stage 8 (Metrologia) dispara início da inspeção
- Conclusão da metrologia avança para Stage 9 (Orçamento)

### **Ordens de Serviço**
- Inspeção vinculada via `order_id`
- Status da OS atualizado automaticamente

### **Orçamentos**
- Serviços sugeridos pré-preenchidos
- Parecer técnico anexado automaticamente

### **Clientes**
- Dados do cliente recuperados da OS
- PDF do parecer pode ser enviado ao cliente

## 🛠️ Stack Tecnológico

### **Frontend**
- React 18 + TypeScript
- React Hook Form + Zod (validação)
- Recharts (gráficos)
- React Beautiful DND (drag-and-drop)
- Shadcn/ui (componentes)

### **Backend**
- Supabase (PostgreSQL + RLS)
- Edge Functions (geração de PDF)
- Storage (armazenamento de PDFs e fotos)

### **Bibliotecas Específicas**
- `jsPDF` ou `html2canvas` (geração de PDF client-side)
- `date-fns` (manipulação de datas)
- `imask` (máscaras de input)

## 📅 Cronograma de Desenvolvimento

| Fase | Duração Estimada | Histórias |
|------|------------------|-----------|
| **Sprint 1** | 2 semanas | US-MET-001, US-MET-002, US-MET-003 |
| **Sprint 2** | 2 semanas | US-MET-004, US-MET-005 |
| **Sprint 3** | 2 semanas | US-MET-006, US-MET-007 |
| **Sprint 4** | 1 semana | US-MET-008, US-MET-009 |
| **Sprint 5** | 1 semana | US-MET-010, Testes E2E |

## 🔐 Segurança e Permissões

### **Perfis com Acesso**
- **Metrologista**: CRUD completo de inspeções
- **Gerente de Produção**: Visualização + Dashboard
- **Admin/Owner**: Acesso total
- **Consultor Comercial**: Apenas visualização de resumo e PDF

### **RLS Policies**
- Isolamento por `org_id` (multitenancy)
- Metrologista só edita suas próprias inspeções (exceto gerentes)
- PDFs acessíveis apenas pela organização proprietária

## 📖 Guia de Navegação

1. **Para Desenvolvedores Frontend**: Comece por [technical/components.md](./technical/components.md)
2. **Para Desenvolvedores Backend**: Veja [database/migrations.sql](./database/migrations.sql)
3. **Para QA**: Consulte [testing/e2e-scenarios.md](./testing/e2e-scenarios.md)
4. **Para Product Owners**: Leia as [user-stories/](./user-stories/)

## 🚀 Próximos Passos

1. ✅ Documentação completa criada
2. ⏳ Aprovação das histórias de usuário
3. ⏳ Execução das migrations SQL
4. ⏳ Desenvolvimento dos componentes React
5. ⏳ Implementação das Edge Functions
6. ⏳ Testes E2E e UAT

---

**Última Atualização**: 28/10/2025  
**Responsável**: Equipe de Desenvolvimento ERP Retífica
