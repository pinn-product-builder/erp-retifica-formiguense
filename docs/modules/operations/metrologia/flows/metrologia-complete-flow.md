# Fluxo Completo: Metrologia (5 Etapas)

## 📊 Visão Geral

Este documento descreve o fluxo completo do processo de metrologia, desde a iniciação no Workflow Kanban até a geração do parecer técnico e transição para orçamento.

## 🎯 Objetivo

Fornecer uma visão end-to-end do processo de inspeção metrológica para facilitar o desenvolvimento e testes.

---

## 📍 Diagrama de Fluxo Principal

```mermaid
graph TB
    Start[🎬 OS no Stage 8: Metrologia] --> Check{Inspeção<br/>existe?}
    Check -->|Não| Create[Criar nova inspeção<br/>Status: em_andamento]
    Check -->|Sim| Continue[Continuar inspeção<br/>na etapa atual]
    
    Create --> Step1[📝 Etapa 1: Identificação do Motor<br/>Preencher dados + fotos]
    Continue --> Step1
    
    Step1 --> Valid1{Todos campos<br/>obrigatórios?}
    Valid1 -->|Não| Error1[❌ Mostrar erros<br/>Impedir avanço]
    Valid1 -->|Sim| Step2[📦 Etapa 2: Componentes Recebidos<br/>Selecionar checkboxes]
    
    Step2 --> Valid2{Pelo menos<br/>1 componente?}
    Valid2 -->|Não| Error2[❌ Selecione ao menos 1]
    Valid2 -->|Sim| Step3[🔍 Etapa 3: Análise Visual<br/>Checklist + fotos por componente]
    
    Step3 --> Valid3{Todos componentes<br/>analisados?}
    Valid3 -->|Não| Error3[❌ Complete todos]
    Valid3 -->|Sim| Step4[📏 Etapa 4: Medições Dimensionais<br/>Tabela de medições + tolerâncias]
    
    Step4 --> Valid4{Medições<br/>registradas?}
    Valid4 -->|Não| Error4[❌ Registre medições]
    Valid4 -->|Sim| Step5[📄 Etapa 5: Parecer Técnico<br/>Diagnóstico + PDF]
    
    Step5 --> Generate[🔄 Gerar PDF automaticamente]
    Generate --> PDF[✅ PDF Gerado<br/>Status: concluido]
    
    PDF --> Choice{O que fazer?}
    Choice -->|Baixar PDF| Download[📥 Download]
    Choice -->|Avançar| Budget[💰 Criar Orçamento<br/>Stage 9: Budgeting]
    Choice -->|Ver DNA| DNA[🧬 Visualizar DNA do Motor]
    
    Error1 --> Step1
    Error2 --> Step2
    Error3 --> Step3
    Error4 --> Step4
    
    style Start fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style Step1 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style Step2 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style Step3 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style Step4 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style Step5 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style PDF fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style Budget fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
```

---

## 🔄 Fluxo Detalhado por Etapa

### **Etapa 1: Identificação do Motor**

```mermaid
sequenceDiagram
    actor M as Metrologista
    participant UI as UI Form
    participant Hook as useMetrology
    participant DB as Supabase
    participant Storage as Storage
    
    M->>UI: Preenche campos obrigatórios
    M->>UI: Digita número do motor
    UI->>Hook: checkMotorHistory(serialNumber)
    Hook->>DB: SELECT inspections WHERE motor_serial
    DB-->>Hook: [2 inspeções anteriores]
    Hook-->>UI: Exibir alerta "Motor com histórico"
    
    M->>UI: Upload 3 fotos
    UI->>Storage: Upload fotos
    Storage-->>UI: [URLs das fotos]
    
    M->>UI: Clica "Próxima Etapa"
    UI->>UI: Validar campos obrigatórios
    UI->>Hook: saveStepData(inspection_id, motor_identification)
    Hook->>DB: UPDATE metrology_inspections SET motor_identification
    Hook->>DB: UPDATE current_step = 2
    DB-->>Hook: Success
    Hook-->>UI: Redirecionar para Step 2
```

**Dados Salvos:**
```json
{
  "motor_identification": {
    "motor_type": "Diesel Completo",
    "vehicle_brand": "Volkswagen",
    "vehicle_model": "Gol 1.0",
    "vehicle_year": 2018,
    "engine_serial_number": "ABC123456",
    "mileage": 95000,
    "entry_date": "2025-10-28",
    "entry_time": "14:30",
    "motor_photos": ["url1", "url2", "url3"]
  }
}
```

---

### **Etapa 2: Componentes Recebidos**

```mermaid
sequenceDiagram
    actor M as Metrologista
    participant UI as UI Grid
    participant Hook as useMetrology
    participant DB as Supabase
    
    M->>UI: Marca checkboxes dos componentes
    Note over UI: ☑️ Bloco<br/>☑️ Virabrequim<br/>☑️ Bielas<br/>☑️ Cabeçote<br/>☐ Comando
    
    M->>UI: Clica "Próxima Etapa"
    UI->>Hook: saveComponents([bloco, eixo, biela, cabecote])
    Hook->>DB: UPDATE metrology_inspections SET components_received
    Hook->>DB: UPDATE current_step = 3
    DB-->>Hook: Success
    Hook-->>UI: Redirecionar para Step 3
```

**Dados Salvos:**
```json
{
  "components_received": [
    { "component": "bloco", "code": "BL-001", "received": true },
    { "component": "eixo", "code": "VR-002", "received": true },
    { "component": "biela", "code": "BI-003", "received": true },
    { "component": "cabecote", "code": "CB-001", "received": true },
    { "component": "comando", "code": "CM-001", "received": false }
  ]
}
```

---

### **Etapa 3: Análise Visual**

```mermaid
sequenceDiagram
    actor M as Metrologista
    participant UI as UI Split View
    participant Hook as useMetrology
    participant DB as Supabase
    participant Storage as Storage
    
    loop Para cada componente recebido
        M->>UI: Seleciona componente (ex: Bloco)
        UI->>UI: Exibe checklist visual
        M->>UI: Marca ☑️ Trincas, ☑️ Desgaste
        M->>UI: Adiciona observações
        M->>UI: Upload 4 fotos do componente
        UI->>Storage: Upload fotos
        Storage-->>UI: [URLs]
        
        M->>UI: Clica "Salvar Componente"
        UI->>Hook: saveVisualAnalysis(component, data)
        Hook->>DB: INSERT INTO motor_dna
        DB-->>Hook: Success
    end
    
    M->>UI: Clica "Próxima Etapa"
    UI->>Hook: validateAllComponentsAnalyzed()
    Hook->>DB: UPDATE metrology_inspections SET visual_analysis_completed = true
    Hook->>DB: UPDATE current_step = 4
    DB-->>Hook: Success
    Hook-->>UI: Redirecionar para Step 4
```

**Dados Salvos (motor_dna):**
```json
{
  "component": "bloco",
  "component_code": "BL-001",
  "visual_analysis": {
    "has_cracks": true,
    "has_excessive_wear": true,
    "has_corrosion": false,
    "has_deformation": false,
    "notes": "Trinca de 5cm na lateral direita, próximo ao cilindro 2"
  },
  "photos": ["url1", "url2", "url3", "url4"]
}
```

---

### **Etapa 4: Medições Dimensionais**

```mermaid
sequenceDiagram
    actor M as Metrologista
    participant UI as UI Table + Sidebar
    participant Hook as useMetrology
    participant DB as Supabase
    
    M->>UI: Seleciona componente (ex: Bloco)
    UI->>Hook: loadMeasurementPoints(component)
    Hook->>DB: SELECT FROM measurement_templates
    DB-->>Hook: [Lista de pontos de medição]
    Hook-->>UI: Exibir tabela com pontos
    
    loop Para cada ponto de medição
        M->>UI: Digita valor medido (ex: 86.25mm)
        UI->>UI: Calcular status de tolerância
        Note over UI: 86.25 > 86.10 (max)<br/>Status: 🔴 Fora de tolerância
        
        M->>UI: Clica "Salvar Medição"
        UI->>Hook: saveMeasurement(data)
        Hook->>DB: INSERT INTO dimensional_measurements
        DB-->>Hook: Success
    end
    
    M->>UI: Clica "Próxima Etapa"
    UI->>Hook: validateMeasurements()
    Hook->>DB: UPDATE metrology_inspections SET measurements_completed = true
    Hook->>DB: UPDATE current_step = 5
    DB-->>Hook: Success
    Hook-->>UI: Redirecionar para Step 5
```

**Dados Salvos (dimensional_measurements):**
```json
{
  "component": "bloco",
  "measurement_point": "Cilindro 1",
  "nominal_value": 86.00,
  "min_tolerance": 85.90,
  "max_tolerance": 86.10,
  "measured_value": 86.25,
  "tolerance_status": "out_of_tolerance",
  "unit": "mm",
  "measurement_method": "Micrômetro externo",
  "notes": "Desgaste acentuado na parte superior"
}
```

---

### **Etapa 5: Parecer Técnico**

```mermaid
sequenceDiagram
    actor M as Metrologista
    participant UI as UI Form + Preview
    participant Hook as useMetrology
    participant EdgeFunc as Edge Function
    participant DB as Supabase
    participant Storage as Storage
    
    UI->>Hook: generateAutoDiagnosis(inspection_id)
    Hook->>DB: SELECT motor_dna, dimensional_measurements
    DB-->>Hook: [Dados das etapas 3 e 4]
    Hook->>Hook: Analisar problemas detectados
    Hook-->>UI: Preencher textareas automaticamente
    
    M->>UI: Revisa e edita diagnóstico
    M->>UI: Adiciona recomendações
    M->>UI: Clica "Gerar PDF"
    
    UI->>Hook: generatePDF(inspection_id, report_data)
    Hook->>EdgeFunc: POST /generate-metrology-pdf
    EdgeFunc->>DB: SELECT inspection data completo
    EdgeFunc->>EdgeFunc: Montar template do PDF
    EdgeFunc->>Storage: Upload PDF
    Storage-->>EdgeFunc: PDF URL
    EdgeFunc->>DB: INSERT INTO technical_reports
    EdgeFunc-->>Hook: {pdf_url, report_id}
    
    Hook->>DB: UPDATE metrology_inspections SET inspection_status = 'concluido'
    Hook->>DB: UPDATE orders SET metrology_status = 'completed'
    Hook-->>UI: Exibir preview do PDF
    
    M->>UI: Visualiza PDF
    M->>UI: Clica "Avançar para Orçamento"
    UI->>Hook: transitionToBudget(inspection_id)
    Hook->>DB: CREATE budget with pre-filled services
    Hook->>DB: UPDATE orders SET current_stage = 'budgeting'
    DB-->>Hook: budget_id
    Hook-->>UI: Redirecionar para /orcamentos/novo?id={budget_id}
```

**Dados Salvos (technical_reports):**
```json
{
  "diagnosis": "Análise dimensional identificou 3 medições fora de tolerância no bloco do motor (cilindros 1, 2 e 4). Análise visual detectou micro-trincas no cabeçote.",
  "probable_causes": "Desgaste natural por quilometragem elevada; Falta de manutenção preventiva; Superaquecimento",
  "recommendations": "Realizar retífica completa dos cilindros; Solda especial nas trincas; Teste de estanqueidade",
  "suggested_services": [
    { "code": "SRV-001", "name": "Retífica de Cilindros", "priority": "high" },
    { "code": "SRV-015", "name": "Solda Especial", "priority": "high" },
    { "code": "SRV-016", "name": "Teste de Estanqueidade", "priority": "high" }
  ],
  "pdf_url": "https://.../metrology-reports/org-123/MET-2025-0001.pdf",
  "pdf_pages": 4,
  "pdf_size_kb": 1250
}
```

---

## 🔐 Permissões por Etapa

| Etapa | Metrologista | Gerente | Admin | Consultor |
|-------|--------------|---------|-------|-----------|
| 1-5 (Edição) | ✅ | ✅ | ✅ | ❌ |
| Visualização | ✅ | ✅ | ✅ | ⚠️ (apenas resumo) |
| Gerar PDF | ✅ | ✅ | ✅ | ❌ |
| Transição p/ Orçamento | ✅ | ✅ | ✅ | ❌ |

---

## ⚡ Estados da Inspeção

```mermaid
stateDiagram-v2
    [*] --> em_andamento: Iniciar Metrologia
    em_andamento --> em_andamento: Salvar Rascunho (Etapas 1-4)
    em_andamento --> concluido: Gerar PDF (Etapa 5)
    concluido --> approved: Transição para Orçamento
    approved --> [*]
    
    note right of em_andamento
        current_step: 1-5
        Permite edição
    end note
    
    note right of concluido
        PDF gerado
        Pronto para orçamento
    end note
    
    note right of approved
        Orçamento criado
        OS avançou para Stage 9
    end note
```

---

## 📊 Métricas Coletadas

Durante todo o fluxo, o sistema coleta:

| Métrica | Quando | Uso |
|---------|--------|-----|
| Tempo total de análise | `created_at` → `inspected_at` | KPI Dashboard |
| Tempo por etapa | `step_started_at` → `step_completed_at` | Identificar gargalos |
| Componentes com problemas | Etapa 3 + 4 | Ranking de componentes |
| Taxa de retrabalho | `regenerated_count > 0` | KPI Dashboard |
| Completude de documentação | Campos obrigatórios preenchidos | KPI Dashboard |

---

## 🎯 Objetivos de Performance

| Métrica | Baseline Atual | Meta |
|---------|----------------|------|
| **Tempo médio total** | 32 horas | ≤ 24 horas |
| **Tempo Etapa 1** | 2 horas | ≤ 1 hora |
| **Tempo Etapa 3** | 8 horas | ≤ 6 horas |
| **Tempo Etapa 4** | 12 horas | ≤ 8 horas |
| **Taxa de completude** | 65% | 100% |
| **Taxa de retrabalho** | 8% | ≤ 2% |

---

**Última Atualização**: 28/10/2025  
**Autor**: Equipe de Desenvolvimento ERP Retífica
