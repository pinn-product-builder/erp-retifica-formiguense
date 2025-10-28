# US-MET-006: Etapa 5 - Parecer Técnico e Geração de PDF

**ID:** US-MET-006  
**Epic:** Metrologia  
**Sprint:** 3  
**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** técnico metrológico  
**Quero** gerar um relatório técnico completo da análise metrológica  
**Para** documentar conclusões e enviar ao cliente ou gerente

---

## 🎯 Business Objective

Consolidar todas as informações das etapas anteriores em um documento técnico profissional, servindo como base para orçamento e registro histórico.

---

## 📐 Business Rules

### RN001: Estrutura do Relatório PDF

**Página 1 - Capa:**
- Logo da empresa
- Título: "RELATÓRIO TÉCNICO DE METROLOGIA"
- Número da OS
- Cliente
- Marca/Modelo do motor
- Data de emissão
- Técnico responsável

**Página 2 - Sumário Executivo:**
- Resumo geral do estado do motor
- Componentes analisados (lista)
- Conclusão geral (apto/necessita reparos/substituição)
- Custo estimado (se disponível)

**Páginas 3-N - Análise por Componente:**
Para cada componente:
- Nome do componente
- Estado geral (Bom/Regular/Ruim/Crítico)
- Inspeção visual (trincas, desgaste, etc.)
- Tabela de medições dimensionais
- Status de tolerâncias
- Fotos (até 4 por página)
- Recomendações técnicas

**Última Página - Conclusão e Assinaturas:**
- Parecer técnico final
- Recomendações gerais
- Data de validade do laudo
- Assinatura do técnico responsável
- Assinatura do gerente (se aplicável)

### RN002: Campos do Parecer Final
**Obrigatórios:**
- Conclusão geral (textarea)
- Recomendação técnica (dropdown):
  - "Aprovar motor sem restrições"
  - "Aprovar com ressalvas (especificar)"
  - "Recomendar reparos (listar)"
  - "Recomendar substituição completa"
- Data de validade do laudo (prazo de 30 dias)

**Opcionais:**
- Observações adicionais
- Restrições de uso
- Condições de garantia

### RN003: Geração do PDF
- Formato A4 (210mm x 297mm)
- Margens: 25mm
- Fonte: Arial ou similar
- Compressão de imagens para otimizar tamanho
- Marca d'água: "CONFIDENCIAL - USO INTERNO"
- Numeração de páginas

### RN004: Armazenamento
- PDF salvo em Supabase Storage
- Path: `metrologia_reports/{org_id}/{order_id}/relatorio_{timestamp}.pdf`
- URL pública gerada com expiração de 7 dias
- Registro em tabela `metrology_reports`

### RN005: Integração
- Após gerar PDF, criar entrada em `diagnostic_responses` (se ainda não existir)
- Atualizar `metrology_stage` para "completed"
- Notificar gerente via sistema de alertas
- Disponibilizar botão de download no OrderDetails

---

## ✅ Acceptance Criteria

**AC1:** Formulário de parecer final exibe resumo de todas as etapas  
**AC2:** Validações impedem gerar PDF com parecer incompleto  
**AC3:** Geração de PDF ocorre em Edge Function (server-side)  
**AC4:** PDF gerado contém todas as seções especificadas  
**AC5:** Fotos são incluídas e comprimidas corretamente  
**AC6:** URL de download é disponibilizada após geração  
**AC7:** Toast de sucesso com botão "Baixar Relatório"  
**AC8:** Registro criado em `metrology_reports` com metadata

---

## 🛠️ Definition of Done

- [x] Componente `TechnicalOpinionForm.tsx` criado
- [x] Edge Function `generate-metrology-pdf` implementada
- [x] Template HTML para PDF criado
- [x] Integração com Puppeteer/jsPDF
- [x] Upload de PDF para Supabase Storage
- [x] Hook `useMetrologyReport.ts` implementado
- [x] Compressão de imagens implementada
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/metrologia/
  ├── MetrologyWizard.tsx           (UPDATE - Step 5)
  ├── TechnicalOpinionForm.tsx      (NEW)
  └── ReportPreview.tsx             (NEW)

src/hooks/
  └── useMetrologyReport.ts         (NEW)

supabase/functions/
  ├── generate-metrology-pdf/
  │   ├── index.ts                  (NEW)
  │   ├── template.html             (NEW)
  │   └── styles.css                (NEW)
  └── _shared/
      └── pdf-generator.ts          (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela para registrar relatórios gerados
CREATE TABLE metrology_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Dados do relatório
  report_number TEXT UNIQUE NOT NULL, -- REL-MET-YYYY-NNNN
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  
  -- Parecer técnico
  general_conclusion TEXT NOT NULL,
  recommendation TEXT NOT NULL CHECK (recommendation IN (
    'aprovar_sem_restricoes',
    'aprovar_com_ressalvas',
    'recomendar_reparos',
    'recomendar_substituicao'
  )),
  technical_opinion TEXT,
  validity_date DATE NOT NULL,
  
  -- Metadados
  components_analyzed JSONB NOT NULL, -- ["bloco", "cabecote", ...]
  total_measurements INTEGER,
  out_of_tolerance_count INTEGER,
  
  -- Auditoria
  generated_by UUID REFERENCES profiles(id),
  generated_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_metrology_reports_order_id ON metrology_reports(order_id);
CREATE INDEX idx_metrology_reports_org_id ON metrology_reports(org_id);
CREATE INDEX idx_metrology_reports_generated_at ON metrology_reports(generated_at);

-- RLS Policies
ALTER TABLE metrology_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports of their org"
  ON metrology_reports FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Technicians can create reports"
  ON metrology_reports FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tecnico', 'gerente', 'admin')
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_metrology_reports_updated_at
  BEFORE UPDATE ON metrology_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número do relatório
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(report_number FROM 13 FOR 4) AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM metrology_reports
  WHERE report_number LIKE 'REL-MET-' || v_year || '-%';
  
  RETURN 'REL-MET-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Metrologia - Etapa 5/5: Parecer Técnico e Geração de PDF [X]  │
├─────────────────────────────────────────────────────────────────┤
│  OS #1234 - Mercedes-Benz OM 906                                │
│                                                                   │
│  ┌─ Resumo da Análise ───────────────────────────────────────┐  │
│  │                                                            │  │
│  │  ✅ Etapa 1: OS Criada                                     │  │
│  │  ✅ Etapa 2: 7 componentes recebidos                       │  │
│  │  ✅ Etapa 3: Análise visual completa (45 fotos)            │  │
│  │  ✅ Etapa 4: 28 medições realizadas                        │  │
│  │                                                            │  │
│  │  ⚠️ Componentes fora de tolerância: 2 (Virabrequim, Biela)│  │
│  │  ✅ Componentes aprovados: 5                               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ Parecer Técnico Final ──────────────────────────────────┐   │
│  │                                                           │   │
│  │  Conclusão Geral: *                                       │   │
│  │  [TextArea: Motor apresenta desgaste moderado...        ]│   │
│  │  [                                                       ]│   │
│  │                                                           │   │
│  │  Recomendação Técnica: *                                  │   │
│  │  [Dropdown: Recomendar reparos (listar) ▼]              │   │
│  │                                                           │   │
│  │  Reparos Necessários:                                     │   │
│  │  [✅] Retífica de virabrequim                            │   │
│  │  [✅] Substituição de bielas                             │   │
│  │  [  ] Retífica de cilindros                             │   │
│  │  [  ] Substituição de pistões                           │   │
│  │                                                           │   │
│  │  Observações Adicionais:                                  │   │
│  │  [TextArea: Recomendar troca de bronzinas...           ]│   │
│  │                                                           │   │
│  │  Data de Validade do Laudo: *                             │   │
│  │  [Date: 26/02/2025 📅] (30 dias a partir de hoje)       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ Assinaturas ─────────────────────────────────────────────┐  │
│  │  Técnico Responsável: João Silva (Automático)            │  │
│  │  Gerente Aprovador: [Dropdown: Selecione ▼] (Opcional)  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│                    [← Voltar Etapa 4]  [Gerar Relatório PDF 📄]│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ✅ Relatório gerado com sucesso!                                │
│                                                                   │
│  Número do Relatório: REL-MET-2025-0042                         │
│  Tamanho: 2.4 MB                                                 │
│                                                                   │
│  [📥 Baixar Relatório]  [✉️ Enviar por E-mail]  [🔗 Copiar Link]│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Geração de PDF Completo
```gherkin
Given que completei todas as 4 etapas anteriores
And estou na Etapa 5
When preencho parecer técnico final
And seleciono recomendação "Recomendar reparos"
And marco reparos necessários
And clico em "Gerar Relatório PDF"
Then Edge Function é chamada
And PDF é gerado e salvo em Storage
And vejo toast "Relatório gerado com sucesso"
And botão "Baixar Relatório" aparece
And registro é criado em metrology_reports
```

### E2E Test 2: Validação de Campos Obrigatórios
```gherkin
Given que estou no formulário de parecer final
When clico em "Gerar Relatório PDF" sem preencher conclusão
Then vejo erro "Campo obrigatório"
And PDF não é gerado
```

### E2E Test 3: PDF Contém Todas as Seções
```gherkin
Given que gerei um relatório PDF
When faço download e abro o arquivo
Then vejo capa com logo e dados da OS
And vejo sumário executivo
And vejo análise detalhada de cada componente
And vejo tabelas de medições
And vejo fotos anexadas
And vejo assinaturas ao final
And todas as páginas estão numeradas
```

### E2E Test 4: Download de PDF
```gherkin
Given que relatório foi gerado
When clico em "Baixar Relatório"
Then arquivo PDF é baixado
And nome do arquivo é "REL-MET-2025-0042.pdf"
And arquivo abre corretamente
```

---

## 🚫 Negative Scope

**Não inclui:**
- Edição de PDF após geração
- Envio automático de e-mail com relatório
- Assinatura digital certificada (ICP-Brasil)
- Versionamento de relatórios
- Comparação com laudos anteriores

---

## 🔗 Dependencies

**Blocks:**
- US-MET-008 (Integração com Orçamentos - usa dados do relatório)

**Blocked by:**
- US-MET-005 (Medições Dimensionais)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
