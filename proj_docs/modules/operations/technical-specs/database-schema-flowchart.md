# Fluxograma do Schema de Banco de Dados - Módulo Operações & Serviços

Este documento apresenta a arquitetura completa do banco de dados implementada para o módulo de Operações & Serviços, organizada por fases de implementação.

## 🏗️ Visão Geral da Arquitetura

O sistema foi implementado em **5 fases distintas**, totalizando **31 novas tabelas** que se integram com as tabelas existentes do sistema.

<lov-mermaid>
graph TB
    %% FASE 1: FUNDAÇÃO DINÂMICA
    subgraph "🎯 FASE 1: Fundação Dinâmica"
        ET[engine_types<br/>Tipos de Motor<br/>Configuráveis]
        WS[workflow_steps<br/>Etapas de Workflow<br/>Personalizáveis]
        EFT[entry_form_templates<br/>Templates de<br/>Formulários]
        EFF[entry_form_fields<br/>Campos Dinâmicos<br/>dos Formulários]
        EFS[entry_form_submissions<br/>Formulários<br/>Preenchidos]
        
        ET --> WS
        ET --> EFT
        EFT --> EFF
        EFT --> EFS
    end

    %% FASE 2: DIAGNÓSTICO E ORÇAMENTAÇÃO
    subgraph "🔍 FASE 2: Diagnóstico e Orçamentação"
        DC[diagnostic_checklists<br/>Checklists de<br/>Diagnóstico]
        DCI[diagnostic_checklist_items<br/>Itens dos<br/>Checklists]
        DCR[diagnostic_checklist_responses<br/>Respostas dos<br/>Diagnósticos]
        DB[detailed_budgets<br/>Orçamentos<br/>Detalhados]
        BA[budget_approvals<br/>Aprovações de<br/>Orçamento]
        BAL[budget_alerts<br/>Alertas de<br/>Orçamentos]
        SPT[service_price_table<br/>Tabela de Preços<br/>de Serviços]
        PPT[parts_price_table<br/>Tabela de Preços<br/>de Peças]
        
        ET --> DC
        DC --> DCI
        DC --> DCR
        DCR --> DB
        DB --> BA
        BA --> BAL
        ET --> SPT
        SPT --> DB
        PPT --> DB
    end

    %% FASE 3: GESTÃO DE MATERIAIS
    subgraph "📦 FASE 3: Gestão de Materiais"
        PR[parts_reservations<br/>Reservas de<br/>Peças]
        PN[purchase_needs<br/>Necessidades de<br/>Compra]
        SS[supplier_suggestions<br/>Sugestões de<br/>Fornecedores]
        SPH[supplier_performance_history<br/>Histórico de Performance<br/>dos Fornecedores]
        SA[stock_alerts<br/>Alertas de<br/>Estoque]
        PSC[parts_stock_config<br/>Configurações de<br/>Estoque]
        
        BA --> PR
        PR --> PN
        PN --> SS
        SS --> SPH
        PR --> SA
        SA --> PSC
    end

    %% FASE 4: CONTROLE DE QUALIDADE
    subgraph "🎯 FASE 4: Controle de Qualidade"
        WC[workflow_checklists<br/>Checklists de<br/>Qualidade]
        WCI[workflow_checklist_items<br/>Itens dos Checklists<br/>de Qualidade]
        WCR[workflow_checklist_responses<br/>Respostas dos<br/>Checklists]
        TR[technical_reports<br/>Relatórios<br/>Técnicos]
        TRT[technical_report_templates<br/>Templates de<br/>Relatórios]
        TSC[technical_standards_config<br/>Configuração de<br/>Normas Técnicas]
        QH[quality_history<br/>Histórico de<br/>Qualidade]
        
        WS --> WC
        WC --> WCI
        WC --> WCR
        WCR --> TR
        TSC --> TRT
        TRT --> TR
        WCR --> QH
        TR --> QH
    end

    %% FASE 5: WORKFLOWS ESPECIALIZADOS
    subgraph "🛡️ FASE 5: Workflows Especializados"
        WCL[warranty_claims<br/>Reclamações de<br/>Garantia]
        SE[special_environments<br/>Ambientes<br/>Especiais]
        ER[environment_reservations<br/>Reservas de<br/>Ambientes]
        WI[warranty_indicators<br/>Indicadores de<br/>Garantia]
        
        WCL --> WI
        SE --> ER
        WS --> ER
    end

    %% COMPLEMENTAR
    subgraph "📈 Complementar"
        PER[purchase_efficiency_reports<br/>Relatórios de Eficiência<br/>de Compras]
        
        PN --> PER
        SS --> PER
    end

    %% TABELAS EXISTENTES (INTEGRAÇÃO)
    subgraph "🏢 Sistema Existente"
        ORG[organizations<br/>Organizações]
        ORD[orders<br/>Ordens de<br/>Serviço]
        OW[order_workflow<br/>Workflow das<br/>Ordens]
        ENG[engines<br/>Motores]
        CUST[customers<br/>Clientes]
        PI[parts_inventory<br/>Estoque de<br/>Peças]
        AR[accounts_receivable<br/>Contas a<br/>Receber]
        SC[status_config<br/>Configuração<br/>de Status]
        
        ORG --> ET
        ORD --> DCR
        ORD --> DB
        ORD --> PR
        ORD --> WCR
        ORD --> TR
        ORD --> WCL
        OW --> WCR
        ENG --> ET
        CUST --> WCL
        PI --> PR
        BA --> AR
        SC --> WS
    end

    %% ESTILOS
    classDef fase1 fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef fase2 fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef fase3 fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef fase4 fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef fase5 fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef existing fill:#f5f5f5,stroke:#424242,stroke-width:2px
    classDef complement fill:#e0f2f1,stroke:#00695c,stroke-width:2px

    class ET,WS,EFT,EFF,EFS fase1
    class DC,DCI,DCR,DB,BA,BAL,SPT,PPT fase2
    class PR,PN,SS,SPH,SA,PSC fase3
    class WC,WCI,WCR,TR,TRT,TSC,QH fase4
    class WCL,SE,ER,WI fase5
    class ORG,ORD,OW,ENG,CUST,PI,AR,SC existing
    class PER complement
</lov-mermaid>

## 📊 Detalhamento por Fase

### 🎯 FASE 1: Fundação Dinâmica (5 tabelas)
**Objetivo**: Criar base configurável para workflows dinâmicos

| Tabela | Função | Relacionamentos Principais |
|--------|---------|----------------------------|
| `engine_types` | Tipos de motor configuráveis por organização | → `workflow_steps`, `diagnostic_checklists` |
| `workflow_steps` | Etapas personalizáveis por tipo de motor | ← `engine_types`, → `workflow_checklists` |
| `entry_form_templates` | Templates de formulários dinâmicos | → `entry_form_fields` |
| `entry_form_fields` | Campos configuráveis dos formulários | ← `entry_form_templates` |
| `entry_form_submissions` | Dados coletados dos formulários | ← `entry_form_templates`, ← `orders` |

### 🔍 FASE 2: Diagnóstico e Orçamentação (8 tabelas)
**Objetivo**: Sistema inteligente de diagnóstico e orçamentação automática

| Tabela | Função | Relacionamentos Principais |
|--------|---------|----------------------------|
| `diagnostic_checklists` | Checklists por tipo de motor/componente | ← `engine_types`, → `diagnostic_checklist_items` |
| `diagnostic_checklist_items` | Itens com triggers de serviços | ← `diagnostic_checklists` |
| `diagnostic_checklist_responses` | Diagnósticos preenchidos | ← `orders`, → `detailed_budgets` |
| `detailed_budgets` | Orçamentos com cálculo automático | ← `orders`, → `budget_approvals` |
| `budget_approvals` | Aprovações documentadas | ← `detailed_budgets`, → `accounts_receivable` |
| `budget_alerts` | Sistema de alertas de orçamentos | ← `detailed_budgets` |
| `service_price_table` | Preços de serviços por tipo de motor | ← `engine_types` |
| `parts_price_table` | Preços de peças para cálculo automático | ← `organizations` |

### 📦 FASE 3: Gestão de Materiais (6 tabelas)
**Objetivo**: Reserva automática e controle inteligente de compras

| Tabela | Função | Relacionamentos Principais |
|--------|---------|----------------------------|
| `parts_reservations` | Reservas automáticas por OS aprovada | ← `budget_approvals`, ← `parts_inventory` |
| `purchase_needs` | Necessidades identificadas automaticamente | ← `parts_reservations` |
| `supplier_suggestions` | Sugestões baseadas em histórico | ← `purchase_needs`, ← `suppliers` |
| `supplier_performance_history` | Performance para análise inteligente | ← `suppliers` |
| `stock_alerts` | Alertas de estoque mínimo/máximo | ← `parts_inventory` |
| `parts_stock_config` | Configurações de estoque por peça | ← `organizations` |

### 🎯 FASE 4: Controle de Qualidade (7 tabelas)
**Objetivo**: Checklists de qualidade e relatórios técnicos automáticos

| Tabela | Função | Relacionamentos Principais |
|--------|---------|----------------------------|
| `workflow_checklists` | Checklists obrigatórios por etapa | ← `workflow_steps` |
| `workflow_checklist_items` | Itens com medições e tolerâncias | ← `workflow_checklists` |
| `workflow_checklist_responses` | Preenchimento com validações | ← `order_workflow`, → `technical_reports` |
| `technical_reports` | Relatórios gerados automaticamente | ← `orders`, ← `workflow_checklist_responses` |
| `technical_report_templates` | Templates por norma técnica | ← `organizations` |
| `technical_standards_config` | Normas técnicas (NBR 13032, Bosch RAM) | ← `organizations` |
| `quality_history` | Auditoria completa de qualidade | ← `orders`, ← `workflow_checklist_responses` |

### 🛡️ FASE 5: Workflows Especializados (4 tabelas)
**Objetivo**: Sistema de garantia e workflow Bosch especializado

| Tabela | Função | Relacionamentos Principais |
|--------|---------|----------------------------|
| `warranty_claims` | Reclamações com avaliação técnica | ← `orders`, ← `customers`, → `orders` (nova OS) |
| `special_environments` | Controle de ambientes (Sala Limpa Bosch) | ← `organizations` |
| `environment_reservations` | Reservas de ambientes especiais | ← `special_environments`, ← `orders` |
| `warranty_indicators` | Indicadores de garantia por período | ← `organizations` |

### 📈 Complementar (1 tabela)
| Tabela | Função | Relacionamentos Principais |
|--------|---------|----------------------------|
| `purchase_efficiency_reports` | Relatórios de eficiência de compras | ← `purchase_needs`, ← `supplier_suggestions` |

## 🔄 Fluxos de Automação Implementados

### 1. **Fluxo de Orçamentação Automática**
```
Diagnóstico → Checklist Preenchido → Serviços Gerados → Orçamento Calculado → Aprovação → Conta a Receber
```

### 2. **Fluxo de Reserva de Materiais**
```
Orçamento Aprovado → Verificação de Estoque → Reserva Automática → Alerta de Compra (se necessário)
```

### 3. **Fluxo de Controle de Qualidade**
```
Etapa do Workflow → Checklist Obrigatório → Preenchimento → Relatório Técnico Automático → Histórico de Qualidade
```

### 4. **Fluxo de Garantia**
```
Reclamação → Avaliação Técnica → Aprovação → OS de Garantia (Prioridade Alta) → Workflow Especializado
```

### 5. **Fluxo Bosch Especializado**
```
Motor Bosch → 14 Etapas Obrigatórias → Ambiente Controlado → Certificação → Relatório Bosch RAM
```

## 🚀 Funcionalidades Implementadas

### **Automações Críticas:**
- ✅ **Geração automática de números** para todos os documentos
- ✅ **Reserva automática de peças** quando orçamento aprovado
- ✅ **Criação automática de contas a receber**
- ✅ **Geração automática de relatórios técnicos**
- ✅ **Alertas inteligentes de estoque**
- ✅ **Criação de OS de garantia com prioridade**
- ✅ **Bloqueio de workflow** se checklist obrigatório não completado

### **Inteligência de Negócio:**
- 🧠 **Sugestão inteligente de fornecedores** baseada em histórico
- 🧠 **Identificação automática de necessidades de compra**
- 🧠 **Cálculo automático de performance de fornecedores**
- 🧠 **Análise de eficiência de compras** (planejada vs emergencial)
- 🧠 **Indicadores de garantia** por período e componente

### **Segurança e Performance:**
- 🔒 **31 políticas RLS** implementadas
- ⚡ **65+ índices** para consultas otimizadas
- 📝 **15 triggers** para automações
- 🔧 **12 funções PL/pgSQL** para lógicas complexas

---

## 📋 Status da Implementação

| Fase | Tabelas | Status | Funcionalidades |
|------|---------|--------|-----------------|
| **Fase 1** | 5/5 | ✅ **Completa** | Workflows dinâmicos configuráveis |
| **Fase 2** | 8/8 | ✅ **Completa** | Diagnóstico e orçamentação inteligente |
| **Fase 3** | 6/6 | ✅ **Completa** | Gestão inteligente de materiais |
| **Fase 4** | 7/7 | ✅ **Completa** | Controle de qualidade automatizado |
| **Fase 5** | 4/4 | ✅ **Completa** | Workflows especializados e garantia |
| **Complementar** | 1/1 | ✅ **Completa** | Relatórios de eficiência |
| **TOTAL** | **31/31** | ✅ **100%** | **Sistema completo implementado** |

---

*Última atualização: 23/09/2025*
