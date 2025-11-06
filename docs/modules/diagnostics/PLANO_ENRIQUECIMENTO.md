# Plano de Enriquecimento do Módulo de Diagnósticos

**Data:** 2025-01-28  
**Versão:** 1.0  
**Status:** 📋 Planejamento

---

## 📊 Análise do Estado Atual

### ✅ O que já está implementado (Fase 1)

1. **Checklists Dinâmicos** ✅
   - Tabelas: `diagnostic_checklists`, `diagnostic_checklist_items`
   - Componente: `DiagnosticInterface.tsx`
   - Hook: `useDiagnosticChecklists.ts`
   - Configuração Admin: `DiagnosticChecklistsConfig.tsx`

2. **Tipos de Campo Básicos** ✅
   - `text`, `textarea`, `checkbox`, `select`, `boolean`
   - Upload de fotos básico
   - Validação de campos obrigatórios

3. **Listagem e Filtros** ✅
   - Página: `Diagnosticos.tsx`
   - Componente: `DiagnosticResponsesTable.tsx`
   - Filtros: `DiagnosticFilters.tsx`

4. **Sugestão de Serviços** ⚠️ (Parcial)
   - Lógica básica implementada
   - Falta integração completa com catálogo de serviços

5. **Validação Básica** ✅
   - Componente: `DiagnosticValidation.tsx`
   - Validação de campos obrigatórios

---

## 🚧 O que falta implementar (Gaps Identificados)

### 🔴 CRÍTICO - Funcionalidades Essenciais

#### 1. **Metrologia Dimensional Completa** ⚠️ CRÍTICO

**Problema:** O sistema não suporta medições dimensionais com validação de tolerâncias, que é fundamental para o negócio de retífica.

**O que falta:**
- Campo `measurement_with_tolerance` (medição com validação visual)
- Campo `table_measurement` (tabela de múltiplas medições - ex: cilindros 1-6)
- Validação automática contra tolerâncias (🟢 OK / 🟡 Atenção / 🔴 Fora)
- Cálculos automáticos (ovalização, conicidade para cilindros)
- Indicadores visuais de status de tolerância

**Impacto:** Alta - Sem isso, o sistema não atende ao core business de metrologia.

**Estimativa:** 13 pontos (2 sprints)

**Arquivos a criar:**
```
src/components/diagnostics/fields/
  ├── MeasurementWithToleranceField.tsx    (NEW)
  ├── TableMeasurementField.tsx          (NEW)
  └── ToleranceIndicator.tsx             (NEW)

src/utils/
  ├── validateTolerance.ts               (NEW)
  └── calculateDimensionalMetrics.ts     (NEW)
```

**Tabelas/Fields necessários:**
- Atualizar `diagnostic_checklist_items.item_type` para incluir novos tipos
- Adicionar `expected_values` com estrutura completa:
  ```json
  {
    "min": 228.0,
    "max": 229.5,
    "unit": "mm",
    "tolerance_warning_threshold": 0.1  // ±10% da faixa
  }
  ```

---

#### 2. **Identificação Completa do Motor** ⚠️ CRÍTICO

**Problema:** A etapa de identificação do motor não está completa conforme especificado no wireframe.

**O que falta:**
- Componente dedicado: `MotorIdentification.tsx`
- Campos completos:
  - Tipo de Ciclo (Diesel/Otto)
  - Situação (Motor Completo/Parcial/Componente Avulso)
  - Montagem (Montado/Desmontado/Parcialmente)
  - Número do Motor
  - Número de Série (para DNA)
  - Placa, KM, Modelo, Ano
  - Componentes Recebidos (lista checkável)
- Validação de campos obrigatórios
- Persistência em `diagnostic_checklist_responses.motor_identification` (JSONB)

**Impacto:** Alta - Essencial para rastreabilidade e DNA do motor.

**Estimativa:** 5 pontos (1 sprint)

**Arquivos a criar:**
```
src/components/diagnostics/
  └── MotorIdentification.tsx            (NEW)
```

---

#### 3. **Testes de Qualidade (Etapa 4B)** ⚠️ CRÍTICO

**Problema:** O wireframe especifica uma etapa completa de testes de qualidade que não existe.

**O que falta:**
- Componente: `QualityTests.tsx`
- Testes suportados:
  - **Teste de Trinca** (Líquido Penetrante, Magnético, Ultrassom)
    - Resultado (Aprovado/Reprovado)
    - Localização das trincas
    - Fotos obrigatórias se reprovado
    - Ação recomendada (Recuperar/Substituir/Descartar)
  - **Teste Hidrostático** (Bloco)
    - Pressão aplicada
    - Duração
    - Resultado (Aprovado/Vazamento)
    - Fotos do resultado
  - **Balanceamento** (Virabrequim)
    - Desbalanceamento inicial/final
    - Upload de laudo PDF
    - Validação contra norma (ISO 1940)

**Impacto:** Alta - Essencial para garantir qualidade e compliance.

**Estimativa:** 8 pontos (1.5 sprints)

**Arquivos a criar:**
```
src/components/diagnostics/
  └── QualityTests.tsx                   (NEW)

src/components/diagnostics/tests/
  ├── CrackTestForm.tsx                  (NEW)
  ├── HydrostaticTestForm.tsx            (NEW)
  └── BalancingTestForm.tsx             (NEW)
```

**Tabelas necessárias:**
- Adicionar campo `quality_tests` JSONB em `diagnostic_checklist_responses`
- Ou criar tabela separada `diagnostic_quality_tests` com relacionamento

---

#### 4. **Checklist de Montagem Final (Etapa 5)** ⚠️ CRÍTICO

**Problema:** Etapa opcional de verificação de montagem não implementada.

**O que falta:**
- Componente: `AssemblyChecklist.tsx`
- Checklist completo de 30+ itens:
  - Bloco e Mancais (torques, folgas)
  - Virabrequim (instalação, giro)
  - Bielas e Pistões (torques, verificação)
  - Cabeçote (junta, parafusos, torque em etapas)
  - Comando de Válvulas (sincronismo, folgas)
  - Sistemas Auxiliares (bomba óleo/água, cárter)
  - Testes Funcionais (giro manual, compressão, pressão óleo)
- Status geral (Aprovado/Requer Ajustes/Requer Desmontagem)
- Foto obrigatória do motor montado
- Campos numéricos para torques e medidas

**Impacto:** Alta - Garante qualidade da montagem final.

**Estimativa:** 8 pontos (1.5 sprints)

**Arquivos a criar:**
```
src/components/diagnostics/
  └── AssemblyChecklist.tsx             (NEW)
```

---

#### 5. **Geração de Parecer Técnico PDF** ⚠️ CRÍTICO

**Problema:** O sistema não gera o parecer técnico completo em PDF conforme especificado.

**O que falta:**
- Componente: `TechnicalReportPDF.tsx`
- Geração de PDF com:
  - Resumo executivo (dados do motor, técnico, data)
  - Status geral (🟢 OK / 🟡 Atenção / 🔴 Crítico)
  - Lista de não conformidades críticas
  - Lista de itens de atenção
  - Serviços recomendados (com valores)
  - Peças necessárias (estimativa)
  - Resumo financeiro
  - Observações finais do técnico
  - Assinatura digital (nome, CREA/CRM se aplicável)
  - QR Code para consulta online (DNA do motor)
- Upload para Supabase Storage
- URL persistida em `diagnostic_checklist_responses.technical_report_pdf_url`

**Impacto:** Alta - Documento essencial para cliente e compliance.

**Estimativa:** 13 pontos (2 sprints)

**Arquivos a criar:**
```
src/components/diagnostics/
  └── TechnicalReportPDF.tsx            (NEW)

src/utils/
  ├── generateTechnicalReportPDF.ts     (NEW)
  └── pdfTemplates.ts                  (NEW)
```

**Dependências:**
- Biblioteca: `jspdf` + `jspdf-autotable` ou `react-pdf`
- Integração com Supabase Storage

---

#### 6. **Motor DNA (Histórico Completo)** ⚠️ CRÍTICO

**Problema:** O sistema não possui funcionalidade completa de Motor DNA conforme especificado.

**O que falta:**
- Componente: `MotorDNA.tsx` (modal completo)
- Funcionalidades:
  - Busca por número de série
  - Timeline de todas as inspeções
  - Gráficos de evolução dimensional (Recharts)
    - Altura do Bloco ao longo do tempo
    - Diâmetro médio dos cilindros
    - Planicidade do Cabeçote
    - etc.
  - Tabela de histórico de serviços
  - Download de todos os PDFs em ZIP
  - Comparação lado-a-lado de inspeções
- Integração com `diagnostic_checklist_responses.motor_identification->>'serial_number'`

**Impacto:** Alta - Diferencial competitivo e rastreabilidade completa.

**Estimativa:** 13 pontos (2 sprints)

**Arquivos a criar:**
```
src/components/diagnostics/
  └── MotorDNA.tsx                      (NEW)

src/hooks/
  └── useMotorDNA.ts                    (NEW)

src/utils/
  └── motorDNAAnalysis.ts               (NEW)
```

**Dependências:**
- Biblioteca: `recharts` para gráficos
- Função SQL para buscar histórico por serial_number

---

### 🟡 ALTA PRIORIDADE - Melhorias Importantes

#### 7. **Wizard Multi-Step Completo** 🟡

**Problema:** O wizard atual não segue o fluxo de 7 etapas especificado no wireframe.

**O que falta:**
- Reestruturação do `DiagnosticInterface.tsx` em steps:
  1. Identificação do Motor
  2. Seleção de Componentes
  3. Análise Visual (para cada componente)
  4. Medições Dimensionais (para cada componente)
  4B. Testes de Qualidade (condicional)
  5. Checklist de Montagem (condicional)
  6. Parecer Técnico
  7. Integração com Orçamento
- Navegação entre steps (Anterior/Próximo)
- Progress bar visual
- Salvamento automático por step
- Validação por step antes de avançar

**Impacto:** Média - Melhora UX e fluxo de trabalho.

**Estimativa:** 8 pontos (1.5 sprints)

---

#### 8. **Análise Visual Detalhada (Etapa 3)** 🟡

**Problema:** A análise visual não está estruturada como especificado no wireframe.

**O que falta:**
- Componente: `VisualAnalysis.tsx`
- Checklist de problemas visuais:
  - Possui trincas visíveis? (com localização obrigatória)
  - Oxidação/Corrosão (Leve/Moderada/Severa)
  - Desgastes anormais
  - Quebras/Danos estruturais
- Estado geral (Bom/Regular/Ruim/Péssimo)
- Observações técnicas (textarea)
- Upload de fotos gerais (mínimo 1 por componente se problemas detectados)
- Tabs por componente

**Impacto:** Média - Padroniza inspeção visual.

**Estimativa:** 5 pontos (1 sprint)

---

#### 9. **Integração Robusta com Orçamentos** 🟡

**Problema:** A integração atual é básica e não aproveita todos os dados do diagnóstico.

**O que falta:**
- Melhorar `BudgetFromDiagnostic.tsx`:
  - Consolidação inteligente de serviços (remover duplicatas)
  - Cálculo automático de peças baseado em serviços
  - Aplicação de descontos padrão
  - Inclusão de observações técnicas do diagnóstico
  - Anexo automático do parecer técnico PDF
  - Destaque de medições críticas
- Validação de peças disponíveis em estoque
- Alertas de necessidade de compra

**Impacto:** Média - Agiliza criação de orçamentos.

**Estimativa:** 5 pontos (1 sprint)

---

#### 10. **Comparação de Diagnósticos** 🟡

**Problema:** Não é possível comparar diagnósticos anteriores do mesmo componente.

**O que falta:**
- Componente: `DiagnosticComparison.tsx`
- Visualização lado-a-lado:
  - Diagnóstico atual vs. anterior
  - Highlight de diferenças (piora/melhora)
  - Indicadores de tendência (⬇️ Piorando / ⬆️ Melhorando / ➡️ Estável)
- Filtro por período
- Análise de recorrência de problemas

**Impacto:** Média - Ajuda na análise de histórico.

**Estimativa:** 5 pontos (1 sprint)

---

### 🟢 MÉDIA PRIORIDADE - Melhorias e Otimizações

#### 11. **Versionamento de Checklists** 🟢

**Problema:** Não é possível versionar checklists, dificultando evolução e auditoria.

**O que falta:**
- Campo `version` em `diagnostic_checklists` (já existe, mas não utilizado)
- Histórico de versões com changelog
- Interface para criar nova versão
- Opção de migrar diagnósticos antigos para nova versão
- Comparação de versões (o que mudou)

**Impacto:** Baixa - Importante para compliance e evolução.

**Estimativa:** 8 pontos (1.5 sprints)

---

#### 12. **Templates por Marca de Motor** 🟢

**Problema:** Checklists genéricos não atendem especificidades de cada marca.

**O que falta:**
- Relacionamento `diagnostic_checklists.engine_type_id` (já existe)
- Templates pré-configurados:
  - Scania (diesel, aplicações pesadas)
  - Mercedes-Benz (OM501, OM502, etc.)
  - Volvo (D13, D16, etc.)
  - Cummins (ISX, ISB, etc.)
- Seleção automática de template baseado em `engine_type_id` da OS
- Tolerâncias específicas por marca/modelo

**Impacto:** Baixa - Melhora precisão e padronização.

**Estimativa:** 8 pontos (1.5 sprints)

---

#### 13. **Dashboard de KPIs de Diagnóstico** 🟢

**Problema:** Não há visão consolidada de métricas de diagnóstico.

**O que falta:**
- Componente: `DiagnosticsDashboard.tsx`
- KPIs:
  - Tempo médio de análise completa
  - Taxa de completude de documentação
  - Taxa de retrabalho por erro de medição
  - Tempo de transição para orçamento
  - Componentes mais diagnosticados
  - Técnicos mais produtivos
  - Gráficos de tendência
- Filtros por período, técnico, componente

**Impacto:** Baixa - Ajuda gestão e otimização.

**Estimativa:** 5 pontos (1 sprint)

---

### 🔵 BAIXA PRIORIDADE - Funcionalidades Futuras (Fase 2/3)

#### 14. **Integração com Instrumentos Digitais** 🔵

- Bluetooth para medidores digitais
- Importação automática de medições
- Redução de erro humano

**Estimativa:** 13 pontos (2 sprints)

---

#### 15. **OCR para Números de Série** 🔵

- Leitura automática de placas de motor
- Redução de digitação
- Validação automática

**Estimativa:** 8 pontos (1.5 sprints)

---

#### 16. **Machine Learning para Previsão de Falhas** 🔵

- Análise de padrões históricos
- Alertas preditivos
- Recomendações inteligentes

**Estimativa:** 21 pontos (4 sprints)

---

## 📋 Plano de Implementação Prioritizado

### Sprint 1 (2 semanas) - CRÍTICO
**Objetivo:** Implementar funcionalidades essenciais de metrologia

1. ✅ **Metrologia Dimensional - Parte 1** (8 pts)
   - Campo `measurement_with_tolerance`
   - Validação de tolerâncias
   - Indicadores visuais

2. ✅ **Identificação Completa do Motor** (5 pts)
   - Componente `MotorIdentification.tsx`
   - Campos completos
   - Persistência

**Total:** 13 pontos

---

### Sprint 2 (2 semanas) - CRÍTICO
**Objetivo:** Completar metrologia e iniciar testes de qualidade

3. ✅ **Metrologia Dimensional - Parte 2** (5 pts)
   - Campo `table_measurement`
   - Cálculos automáticos (ovalização, conicidade)
   - Validação para tabelas

4. ✅ **Testes de Qualidade** (8 pts)
   - Componente `QualityTests.tsx`
   - Teste de Trinca
   - Teste Hidrostático
   - Balanceamento

**Total:** 13 pontos

---

### Sprint 3 (2 semanas) - CRÍTICO
**Objetivo:** Parecer técnico e montagem

5. ✅ **Geração de Parecer Técnico PDF** (13 pts)
   - Componente `TechnicalReportPDF.tsx`
   - Geração completa de PDF
   - Upload para Storage
   - QR Code

**Total:** 13 pontos

---

### Sprint 4 (2 semanas) - CRÍTICO
**Objetivo:** Motor DNA e checklist de montagem

6. ✅ **Motor DNA Completo** (13 pts)
   - Componente `MotorDNA.tsx`
   - Timeline de inspeções
   - Gráficos de evolução
   - Download ZIP

7. ✅ **Checklist de Montagem** (8 pts)
   - Componente `AssemblyChecklist.tsx`
   - 30+ itens de verificação
   - Validações

**Total:** 21 pontos

---

### Sprint 5 (2 semanas) - ALTA PRIORIDADE
**Objetivo:** Melhorar wizard e análise visual

8. ✅ **Wizard Multi-Step Completo** (8 pts)
   - Reestruturação em 7 etapas
   - Navegação entre steps
   - Progress bar

9. ✅ **Análise Visual Detalhada** (5 pts)
   - Componente `VisualAnalysis.tsx`
   - Checklist de problemas
   - Upload de fotos

**Total:** 13 pontos

---

### Sprint 6 (2 semanas) - ALTA PRIORIDADE
**Objetivo:** Integrações e comparações

10. ✅ **Integração Robusta com Orçamentos** (5 pts)
    - Melhorias em `BudgetFromDiagnostic.tsx`
    - Consolidação inteligente

11. ✅ **Comparação de Diagnósticos** (5 pts)
    - Componente `DiagnosticComparison.tsx`
    - Visualização lado-a-lado

**Total:** 10 pontos

---

### Sprint 7+ (Futuro) - MÉDIA/BAIXA PRIORIDADE
- Versionamento de Checklists
- Templates por Marca
- Dashboard de KPIs
- Funcionalidades Fase 2/3

---

## 📊 Resumo de Esforço

| Prioridade | Funcionalidades | Pontos | Sprints |
|------------|----------------|--------|---------|
| 🔴 CRÍTICO | 6 | 75 | 4 sprints (8 semanas) |
| 🟡 ALTA | 4 | 23 | 2 sprints (4 semanas) |
| 🟢 MÉDIA | 3 | 21 | 2 sprints (4 semanas) |
| 🔵 BAIXA | 3 | 42 | 4 sprints (8 semanas) |
| **TOTAL** | **16** | **161** | **12 sprints (24 semanas)** |

---

## 🎯 Métricas de Sucesso

### KPIs a Acompanhar

1. **Tempo médio de análise completa**
   - Meta: Reduzir de 26h para ≤20h

2. **Taxa de completude de documentação**
   - Meta: Manter 98% ou aumentar para 100%

3. **Taxa de retrabalho por erro de medição**
   - Meta: Reduzir de 3% para ≤1%

4. **Tempo de transição para orçamento**
   - Meta: Manter 12min ou reduzir para ≤10min

5. **Satisfação do técnico/metrologista**
   - Meta: Manter ≥4.5/5 ou aumentar para ≥4.8/5

---

## 🔗 Dependências Técnicas

### Bibliotecas Necessárias

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.5.31",
    "recharts": "^2.10.3",
    "file-saver": "^2.0.5",
    "jszip": "^3.10.1"
  }
}
```

### Migrações SQL Necessárias

1. Atualizar `diagnostic_checklist_items.item_type` enum
2. Adicionar campo `quality_tests` JSONB em `diagnostic_checklist_responses`
3. Adicionar campo `assembly_checklist` JSONB em `diagnostic_checklist_responses`
4. Criar função `get_motor_dna(serial_number, org_id)`
5. Criar índices para busca por serial_number

---

## 📝 Próximos Passos

1. ✅ **Aprovação do Plano** - Revisar e aprovar este documento
2. ✅ **Priorização Final** - Definir ordem exata de implementação
3. ✅ **Criação de Issues** - Criar issues no GitHub/GitLab para cada funcionalidade
4. ✅ **Design Detalhado** - Wireframes/protótipos para funcionalidades críticas
5. ✅ **Setup Técnico** - Instalar dependências e preparar ambiente
6. ✅ **Início Sprint 1** - Começar implementação das funcionalidades críticas

---

**Última atualização:** 2025-01-28  
**Responsável:** Equipe de Desenvolvimento ERP Retífica  
**Status:** 📋 Aguardando Aprovação

