# US-DIAG-001: Criar Checklist Dinâmico por Componente

**ID:** US-DIAG-001  
**Epic:** Diagnósticos  
**Sprint:** 3  
**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** técnico  
**Quero** que o sistema carregue automaticamente um checklist específico para cada componente  
**Para** realizar diagnóstico padronizado e completo

---

## 🎯 Business Objective

Garantir que todos os componentes sejam inspecionados seguindo critérios consistentes e documentados, eliminando variações entre técnicos.

---

## 📐 Business Rules

### RN001: Checklists por Componente
**Mapeamento Padrão:**
- **Bloco:** 15 itens de inspeção
- **Cabeçote:** 12 itens de inspeção
- **Virabrequim:** 10 itens de inspeção
- **Biela:** 8 itens de inspeção
- **Pistão:** 8 itens de inspeção
- **Comando:** 7 itens de inspeção
- **Eixo:** 6 itens de inspeção

### RN002: Tipos de Campo Suportados
```typescript
type FieldType = 
  | 'text'          // Campo texto livre
  | 'textarea'      // Campo texto longo
  | 'number'        // Campo numérico
  | 'select'        // Dropdown com opções
  | 'radio'         // Seleção única (botões)
  | 'checkbox'      // Seleção múltipla
  | 'boolean'       // Sim/Não (toggle)
  | 'scale'         // Escala 1 a 5
  | 'photo';        // Upload de foto
```

### RN003: Estrutura de Checklist Item
```typescript
interface ChecklistItem {
  id: string;
  checklist_id: string;
  item_name: string;
  item_description?: string;
  item_type: FieldType;
  item_options?: Record<string, unknown>; // Para select, radio, checkbox
  is_required: boolean;
  display_order: number;
  help_text?: string;
  expected_values?: Record<string, unknown>;
  triggers_service?: {
    condition: string;
    service_codes: string[];
    priority: 'alta' | 'media' | 'baixa';
  };
}
```

### RN004: Exemplo de Checklist - Bloco
```json
[
  {
    "item_name": "Estado das camisas",
    "item_type": "select",
    "item_options": {
      "options": ["Bom", "Regular", "Ruim", "Crítico"]
    },
    "is_required": true,
    "triggers_service": {
      "condition": "response == 'Ruim' || response == 'Crítico'",
      "service_codes": ["BLC001"],
      "priority": "alta"
    }
  },
  {
    "item_name": "Possui trincas visíveis?",
    "item_type": "boolean",
    "is_required": true,
    "triggers_service": {
      "condition": "response == true",
      "service_codes": ["BLC002", "BLC003"],
      "priority": "alta"
    }
  },
  {
    "item_name": "Desgaste irregular?",
    "item_type": "boolean",
    "is_required": true
  },
  {
    "item_name": "Avaliação de usinagem necessária",
    "item_type": "scale",
    "item_options": {
      "min": 1,
      "max": 5,
      "labels": ["Nenhuma", "Leve", "Moderada", "Pesada", "Completa"]
    },
    "is_required": true,
    "triggers_service": {
      "condition": "response >= 3",
      "service_codes": ["BLC004"],
      "priority": "media"
    }
  },
  {
    "item_name": "Observações gerais",
    "item_type": "textarea",
    "is_required": false,
    "help_text": "Descreva quaisquer anomalias ou pontos de atenção"
  }
]
```

### RN005: Carregamento Dinâmico
- Ao selecionar componente, busca checklist ativo daquele tipo
- Se não existir checklist customizado, usa checklist padrão do sistema
- Campos são renderizados na ordem de `display_order`

---

## ✅ Acceptance Criteria

**AC1:** Checklist correto carrega ao selecionar componente  
**AC2:** Todos os tipos de campo renderizam corretamente  
**AC3:** Campos obrigatórios são marcados com *  
**AC4:** Help text aparece ao hover no ícone (?)  
**AC5:** Campos com trigger_service são destacados visualmente  
**AC6:** Validações impedem avançar com campos obrigatórios vazios

---

## 🛠️ Definition of Done

- [x] Tabelas `diagnostic_checklists` e `diagnostic_checklist_items` criadas
- [x] Componente `ChecklistForm.tsx` implementado
- [x] Componente `FieldRenderer.tsx` para renderizar tipos
- [x] Hook `useDiagnosticChecklists.ts` criado
- [x] Validações com Zod schema
- [x] Checklists padrão seedados no banco
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/diagnostics/
  ├── DiagnosticWizard.tsx         (UPDATE - integra checklist)
  ├── ChecklistForm.tsx            (NEW)
  └── FieldRenderer.tsx            (NEW)

src/hooks/
  └── useDiagnosticChecklists.ts   (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela de checklists (templates)
CREATE TABLE diagnostic_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_name TEXT NOT NULL,
  component TEXT NOT NULL CHECK (component IN (
    'bloco', 'cabecote', 'virabrequim', 'biela', 
    'pistao', 'comando', 'eixo'
  )),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id),
  org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(org_id, component, checklist_name)
);

-- Tabela de itens do checklist
CREATE TABLE diagnostic_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID REFERENCES diagnostic_checklists(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN (
    'text', 'textarea', 'number', 'select', 'radio', 
    'checkbox', 'boolean', 'scale', 'photo'
  )),
  item_options JSONB DEFAULT '{}'::jsonb,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  help_text TEXT,
  expected_values JSONB,
  triggers_service JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_diagnostic_checklists_component ON diagnostic_checklists(component);
CREATE INDEX idx_diagnostic_checklists_org ON diagnostic_checklists(org_id);
CREATE INDEX idx_checklist_items_checklist ON diagnostic_checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_order ON diagnostic_checklist_items(display_order);

-- RLS Policies
ALTER TABLE diagnostic_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_checklist_items ENABLE ROW LEVEL SECURITY;

-- Checklists públicos (padrão do sistema) são visíveis por todos
CREATE POLICY "Public checklists are viewable by everyone"
  ON diagnostic_checklists FOR SELECT
  USING (is_default = true OR org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Apenas admins podem criar/editar checklists customizados
CREATE POLICY "Admins can manage org checklists"
  ON diagnostic_checklists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND org_id = diagnostic_checklists.org_id
      AND role IN ('admin', 'gerente')
    )
  );

-- Items seguem permissões do checklist pai
CREATE POLICY "Checklist items follow parent permissions"
  ON diagnostic_checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_checklists dc
      WHERE dc.id = diagnostic_checklist_items.checklist_id
      AND (dc.is_default = true OR dc.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))
    )
  );

CREATE POLICY "Admins can manage checklist items"
  ON diagnostic_checklist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_checklists dc
      JOIN profiles p ON p.org_id = dc.org_id
      WHERE dc.id = diagnostic_checklist_items.checklist_id
      AND p.id = auth.uid()
      AND p.role IN ('admin', 'gerente')
    )
  );

-- Função para buscar checklist ativo de um componente
CREATE OR REPLACE FUNCTION get_active_checklist(
  p_component TEXT,
  p_org_id UUID
) RETURNS TABLE (
  checklist diagnostic_checklists,
  items jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc,
    jsonb_agg(
      jsonb_build_object(
        'id', dci.id,
        'item_name', dci.item_name,
        'item_description', dci.item_description,
        'item_type', dci.item_type,
        'item_options', dci.item_options,
        'is_required', dci.is_required,
        'help_text', dci.help_text,
        'triggers_service', dci.triggers_service
      ) ORDER BY dci.display_order
    ) AS items
  FROM diagnostic_checklists dc
  JOIN diagnostic_checklist_items dci ON dci.checklist_id = dc.id
  WHERE dc.component = p_component
    AND dc.is_active = true
    AND (dc.org_id = p_org_id OR dc.is_default = true)
  GROUP BY dc.id
  ORDER BY dc.is_default ASC, dc.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_diagnostic_checklists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_diagnostic_checklists_timestamp
  BEFORE UPDATE ON diagnostic_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_diagnostic_checklists_updated_at();

CREATE TRIGGER trg_update_checklist_items_timestamp
  BEFORE UPDATE ON diagnostic_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_diagnostic_checklists_updated_at();
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Diagnóstico - OS #1234                                [X]  │
├─────────────────────────────────────────────────────────────┤
│  Componente: Bloco                            [Step 2/5]    │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ CHECKLIST: Inspeção de Bloco (15 itens)               ││
│  ├─────────────────────────────────────────────────────────┤│
│  │                                                          ││
│  │ 1. Estado das camisas: * (?)                            ││
│  │    [▼ Selecione                          ]              ││
│  │    Opções: Bom | Regular | Ruim | Crítico               ││
│  │    ⚠️ Trigger: Valores "Ruim" ou "Crítico" sugerem     ││
│  │       serviço de retífica de camisa                     ││
│  │                                                          ││
│  │ 2. Possui trincas visíveis? * (?)                       ││
│  │    ( ) Sim  (•) Não                                     ││
│  │    ⚠️ Trigger: "Sim" sugere soldagem ou substituição   ││
│  │                                                          ││
│  │ 3. Desgaste irregular? *                                ││
│  │    [✅] Sim  [  ] Não                                   ││
│  │                                                          ││
│  │ 4. Avaliação de usinagem necessária: * (?)              ││
│  │    ◯──◯──●──◯──◯                                        ││
│  │    1   2   3   4   5                                    ││
│  │    Nenhuma → Completa                                   ││
│  │    ⚠️ Trigger: Valor ≥3 sugere usinagem                ││
│  │                                                          ││
│  │ 5. Medição de diâmetro interno (mm): *                  ││
│  │    [________] mm                                        ││
│  │                                                          ││
│  │ 6. Fotos das camisas: (?)                               ││
│  │    [📷 Upload] (Arraste ou clique)                     ││
│  │    [🖼️ IMG_001.jpg]  [🖼️ IMG_002.jpg]                  ││
│  │                                                          ││
│  │ 7. Observações gerais: (?)                              ││
│  │    [TextArea: Camisa 1 apresenta desgaste...         ] ││
│  │    [                                                   ] ││
│  │                                                          ││
│  │ ... (8 itens restantes)                                 ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Progresso: ████████░░░░░░░░ 7/15 campos preenchidos (47%)  │
│                                                               │
│                   [← Voltar]  [Salvar e Continuar →]        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Carregar Checklist Padrão
```gherkin
Given que estou na etapa de Diagnóstico
When seleciono componente "Bloco"
Then checklist de 15 itens carrega
And campos estão ordenados corretamente
And campos obrigatórios têm marcador *
```

### E2E Test 2: Renderização de Tipos de Campo
```gherkin
Given que checklist carregou
When visualizo os campos
Then campo tipo "select" renderiza dropdown
And campo tipo "boolean" renderiza toggle
And campo tipo "scale" renderiza slider
And campo tipo "textarea" renderiza área de texto
```

### E2E Test 3: Validação de Campos Obrigatórios
```gherkin
Given que estou preenchendo checklist
When tento avançar sem preencher campo obrigatório
Then erro de validação aparece
And campo inválido fica destacado em vermelho
And não avanço para próxima etapa
```

### E2E Test 4: Help Text ao Hover
```gherkin
Given que campo possui help_text
When passo mouse sobre ícone (?)
Then tooltip aparece com texto de ajuda
And tooltip desaparece ao sair do hover
```

---

## 🚫 Negative Scope

**Não inclui:**
- Criação de checklist via UI (ver US-DIAG-007)
- Versionamento de checklists
- Checklist condicional (campos que aparecem baseado em respostas)
- Exportação de checklist em PDF

---

## 🔗 Dependencies

**Blocks:**
- US-DIAG-002 (Responder Diagnóstico)
- US-DIAG-004 (Sugestão de Serviços)

**Blocked by:**
- US-MET-006 (Metrologia Concluída)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
