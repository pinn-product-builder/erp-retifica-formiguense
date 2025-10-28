# US-MET-004: Etapa 3 - Análise Visual (Motor DNA)

**ID:** US-MET-004  
**Epic:** Metrologia  
**Sprint:** 2  
**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** técnico metrológico  
**Quero** realizar análise visual de cada componente do motor  
**Para** identificar desgastes, trincas e danos antes das medições

---

## 🎯 Business Objective

Criar o "DNA" do motor através de inspeção visual detalhada, identificando problemas visíveis que influenciarão diagnóstico e orçamento.

---

## 📐 Business Rules

### RN001: Componentes Inspecionados
- Bloco
- Cabeçote(s)
- Virabrequim
- Biela(s)
- Pistão(ões)
- Comando(s)
- Eixo(s)

### RN002: Campos de Inspeção (por componente)
**Campos Obrigatórios:**
- Estado geral (dropdown: "Bom", "Regular", "Ruim", "Crítico")
- Possui trincas? (Sim/Não)
- Possui desgaste excessivo? (Sim/Não)
- Necessita retífica? (Sim/Não)

**Campos Opcionais:**
- Observações técnicas (textarea)
- Upload de fotos (múltiplas)
- Marcas de batida ou quebra
- Corrosão ou oxidação

### RN003: Indicadores Visuais
- Badge de status colorido por componente
- Ícones de alerta para trincas/desgaste
- Preview de fotos em miniatura

### RN004: Navegação
- Tabs para cada componente
- Botão "Avançar" move para próximo componente
- Progress bar mostra componentes inspecionados (X/Y)
- Botão "Salvar e Continuar" para próxima etapa

### RN005: Validações
- Pelo menos 1 componente deve ser inspecionado
- Campos obrigatórios devem estar preenchidos
- Upload de pelo menos 1 foto por componente é recomendado

---

## ✅ Acceptance Criteria

**AC1:** Tabs exibem todos os componentes presentes na OS  
**AC2:** Formulário de inspeção carrega para cada componente  
**AC3:** Upload de fotos funcional com preview  
**AC4:** Validações impedem avançar com dados incompletos  
**AC5:** Progress bar atualiza ao salvar cada componente  
**AC6:** Dados salvos persistem ao alternar tabs  
**AC7:** Botão "Salvar e Continuar" leva para Etapa 4

---

## 🛠️ Definition of Done

- [x] Componente `VisualInspectionForm.tsx` criado
- [x] Hook `useVisualInspection.ts` implementado
- [x] Integração com `motor_dna` (INSERT/UPDATE)
- [x] Upload de fotos para Supabase Storage
- [x] Validações com Zod schema
- [x] Progress tracking implementado
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/metrologia/
  ├── MetrologyWizard.tsx         (UPDATE - Step 3)
  ├── VisualInspectionForm.tsx    (NEW)
  └── ComponentTabs.tsx           (NEW)

src/hooks/
  └── useVisualInspection.ts      (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela motor_dna (já existe)
CREATE TABLE motor_dna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  component TEXT NOT NULL CHECK (component IN (
    'bloco', 'cabecote', 'virabrequim', 'biela', 
    'pistao', 'comando', 'eixo'
  )),
  
  -- Análise Visual (Etapa 3)
  general_condition TEXT CHECK (general_condition IN ('bom', 'regular', 'ruim', 'critico')),
  has_cracks BOOLEAN DEFAULT false,
  has_excessive_wear BOOLEAN DEFAULT false,
  needs_grinding BOOLEAN DEFAULT false,
  visual_observations TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  
  -- Medições (Etapa 4 - US-MET-005)
  measurements JSONB,
  
  -- Metadados
  inspected_by UUID REFERENCES profiles(id),
  inspected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE motor_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view motor_dna of their org"
  ON motor_dna FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = motor_dna.order_id
      AND o.org_id = auth.jwt() ->> 'org_id'
    )
  );

CREATE POLICY "Technicians can insert/update motor_dna"
  ON motor_dna FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('tecnico', 'gerente', 'admin')
    )
  );

-- Função para calcular progresso da inspeção
CREATE OR REPLACE FUNCTION get_inspection_progress(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_required_components TEXT[];
  v_inspected_count INTEGER;
  v_total_count INTEGER;
BEGIN
  -- Busca componentes requeridos da OS
  SELECT required_components INTO v_required_components
  FROM engines e
  JOIN orders o ON o.engine_id = e.id
  WHERE o.id = p_order_id;

  v_total_count := array_length(v_required_components, 1);

  -- Conta componentes já inspecionados
  SELECT COUNT(*) INTO v_inspected_count
  FROM motor_dna
  WHERE order_id = p_order_id
  AND general_condition IS NOT NULL;

  RETURN json_build_object(
    'inspected', v_inspected_count,
    'total', v_total_count,
    'percentage', ROUND((v_inspected_count::DECIMAL / v_total_count) * 100)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Metrologia - Etapa 3/5: Análise Visual                   [X]  │
├─────────────────────────────────────────────────────────────────┤
│  OS #1234 - Mercedes-Benz OM 906                                │
│                                                                   │
│  Progresso: ████████░░░░ 3/7 componentes inspecionados (43%)    │
│                                                                   │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                   │
│  │Bloco│Cabec│Vira │Biela│Pistã│Coman│Eixo │                   │
│  │  ✅ │  ✅ │  ✅ │  ⏳ │  ⏳ │  ⏳ │  ⏳ │                   │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                   │
│                                                                   │
│  ┌─ Inspeção: Biela ─────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  Estado Geral: *                                            │ │
│  │  [Dropdown: Selecione ▼]                                   │ │
│  │  Opções: Bom | Regular | Ruim | Crítico                    │ │
│  │                                                             │ │
│  │  Inspeção de Danos: *                                       │ │
│  │  [✅] Possui trincas                                        │ │
│  │  [✅] Possui desgaste excessivo                             │ │
│  │  [✅] Necessita retífica                                    │ │
│  │                                                             │ │
│  │  Observações Técnicas:                                      │ │
│  │  [TextArea: Trinca visível no pé da biela...             ] │ │
│  │  [                                                         ] │ │
│  │                                                             │ │
│  │  Fotos do Componente:                                       │ │
│  │  [📷 Upload] (Arraste ou clique para adicionar)           │ │
│  │                                                             │ │
│  │  Preview:                                                   │ │
│  │  [🖼️ IMG_001.jpg]  [🖼️ IMG_002.jpg]  [🖼️ IMG_003.jpg]    │ │
│  │                                                             │ │
│  │                       [← Anterior]  [Salvar e Avançar →]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│                       [Salvar Rascunho]  [Continuar Etapa 4 →]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Inspeção Completa de Componente
```gherkin
Given que estou na Etapa 3 de metrologia
And estou na tab "Bloco"
When preencho estado geral como "Regular"
And marco "Possui desgaste excessivo"
And adiciono observação "Desgaste na camisa 1"
And faço upload de 2 fotos
And clico em "Salvar e Avançar"
Then dados são salvos em motor_dna
And progress bar atualiza para 1/7 (14%)
And tab "Cabeçote" é ativada
```

### E2E Test 2: Validação de Campos Obrigatórios
```gherkin
Given que estou inspecionando "Virabrequim"
When clico em "Salvar e Avançar" sem preencher "Estado Geral"
Then vejo mensagem de erro "Campo obrigatório"
And não avanço para próximo componente
```

### E2E Test 3: Persistência ao Trocar Tabs
```gherkin
Given que preenchi inspeção do "Cabeçote"
And cliquei em "Salvar"
When volto para tab "Bloco"
And retorno para tab "Cabeçote"
Then dados salvos anteriormente ainda estão visíveis
And fotos carregadas são exibidas
```

### E2E Test 4: Finalizar Etapa 3
```gherkin
Given que inspecionei todos os 7 componentes
And progress bar está em 7/7 (100%)
When clico em "Continuar Etapa 4"
Then sou redirecionado para Etapa 4 (Medições)
And dados da Etapa 3 estão salvos
```

---

## 🚫 Negative Scope

**Não inclui:**
- Medições dimensionais (ver US-MET-005)
- Geração de relatório PDF (ver US-MET-006)
- Integração com diagnóstico (ver US-MET-008)
- Machine learning para detecção de defeitos

---

## 🔗 Dependencies

**Blocks:**
- US-MET-005 (Medições Dimensionais)
- US-MET-006 (Parecer Técnico)

**Blocked by:**
- US-MET-003 (Etapa 2 - Componentes Recebidos)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
