# US-DIAG-002: Responder Diagnóstico (Múltiplos Tipos de Campo)

**ID:** US-DIAG-002  
**Epic:** Diagnósticos  
**Sprint:** 3  
**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** técnico  
**Quero** preencher checklists de diagnóstico com diferentes tipos de resposta  
**Para** documentar todas as condições encontradas no componente

---

## 🎯 Business Objective

Capturar dados estruturados e consistentes que possam alimentar geração automática de orçamentos e relatórios.

---

## 📐 Business Rules

### RN001: Persistência de Respostas
**Salvar:**
- Automático a cada 30 segundos (draft)
- Manual ao clicar "Salvar Rascunho"
- Ao avançar para próximo componente
- Ao finalizar diagnóstico completo

**Estrutura de Resposta:**
```typescript
interface DiagnosticResponse {
  id: string;
  order_id: string;
  component: ComponentType;
  checklist_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  diagnosed_by: string;
  diagnosed_at: Date;
  response_items: DiagnosticResponseItem[];
}

interface DiagnosticResponseItem {
  id: string;
  response_id: string;
  checklist_item_id: string;
  response_value: unknown; // Tipo varia conforme campo
  photos: string[]; // URLs de fotos
  notes: string;
  suggested_services: string[]; // Auto-gerado por trigger
}
```

### RN002: Validação por Tipo de Campo
```typescript
const validations = {
  text: (value: string) => value.length > 0 && value.length <= 500,
  textarea: (value: string) => value.length <= 2000,
  number: (value: number) => !isNaN(value) && value >= 0,
  select: (value: string, options: string[]) => options.includes(value),
  radio: (value: string, options: string[]) => options.includes(value),
  checkbox: (value: string[], options: string[]) => 
    value.every(v => options.includes(v)),
  boolean: (value: boolean) => typeof value === 'boolean',
  scale: (value: number, min: number, max: number) => 
    value >= min && value <= max,
  photo: (value: string[]) => value.length > 0
};
```

### RN003: Progresso do Diagnóstico
**Cálculo:**
```typescript
const progress = {
  total: checklist_items.length,
  answered: response_items.filter(r => r.response_value !== null).length,
  required_answered: response_items
    .filter(r => r.checklist_item.is_required)
    .filter(r => r.response_value !== null).length,
  required_total: checklist_items.filter(i => i.is_required).length,
  
  percentage: (answered / total) * 100,
  is_complete: required_answered === required_total
};
```

### RN004: Estados de Preenchimento
- **pending:** Nenhum campo preenchido
- **in_progress:** Alguns campos preenchidos (< 100% obrigatórios)
- **completed:** Todos campos obrigatórios preenchidos
- **approved:** Técnico/gerente aprovou o diagnóstico

### RN005: Componente FieldRenderer
```typescript
const FieldRenderer = ({ item, value, onChange }: FieldRendererProps) => {
  switch (item.item_type) {
    case 'text':
      return <Input value={value} onChange={onChange} maxLength={500} />;
    
    case 'textarea':
      return <Textarea value={value} onChange={onChange} maxLength={2000} />;
    
    case 'number':
      return <Input type="number" value={value} onChange={onChange} min={0} />;
    
    case 'select':
      return (
        <Select value={value} onValueChange={onChange}>
          {item.item_options.options.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </Select>
      );
    
    case 'radio':
      return (
        <RadioGroup value={value} onValueChange={onChange}>
          {item.item_options.options.map(opt => (
            <RadioGroupItem key={opt} value={opt} label={opt} />
          ))}
        </RadioGroup>
      );
    
    case 'checkbox':
      return (
        <CheckboxGroup value={value} onChange={onChange}>
          {item.item_options.options.map(opt => (
            <Checkbox key={opt} value={opt} label={opt} />
          ))}
        </CheckboxGroup>
      );
    
    case 'boolean':
      return <Switch checked={value} onCheckedChange={onChange} />;
    
    case 'scale':
      return (
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={item.item_options.min}
          max={item.item_options.max}
          step={1}
        />
      );
    
    case 'photo':
      return <PhotoUpload value={value} onChange={onChange} />;
    
    default:
      return null;
  }
};
```

---

## ✅ Acceptance Criteria

**AC1:** Todos os tipos de campo renderizam corretamente  
**AC2:** Respostas salvam automaticamente a cada 30s  
**AC3:** Progresso atualiza ao preencher campos  
**AC4:** Validações impedem valores inválidos  
**AC5:** Rascunhos persistem ao sair e voltar  
**AC6:** Status muda para "completed" ao preencher obrigatórios

---

## 🛠️ Definition of Done

- [x] Tabela `diagnostic_responses` criada
- [x] Tabela `diagnostic_response_items` criada
- [x] Componente `FieldRenderer.tsx` implementado
- [x] Hook `useDiagnosticResponses.ts` criado
- [x] Auto-save implementado (30s)
- [x] Validações com Zod por tipo
- [x] Barra de progresso funcional
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/diagnostics/
  ├── ChecklistForm.tsx            (UPDATE - integra respostas)
  ├── FieldRenderer.tsx            (ALREADY EXISTS)
  └── ProgressBar.tsx              (NEW)

src/hooks/
  └── useDiagnosticResponses.ts    (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela de respostas consolidadas
CREATE TABLE diagnostic_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  component TEXT NOT NULL CHECK (component IN (
    'bloco', 'cabecote', 'virabrequim', 'biela', 
    'pistao', 'comando', 'eixo'
  )),
  checklist_id UUID REFERENCES diagnostic_checklists(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'approved'
  )),
  diagnosed_by UUID REFERENCES profiles(id),
  diagnosed_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(order_id, component)
);

-- Tabela de respostas individuais
CREATE TABLE diagnostic_response_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES diagnostic_responses(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES diagnostic_checklist_items(id),
  response_value JSONB, -- Flexível para suportar qualquer tipo
  photos TEXT[], -- Array de URLs
  notes TEXT,
  suggested_services JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_diagnostic_responses_order ON diagnostic_responses(order_id);
CREATE INDEX idx_diagnostic_responses_status ON diagnostic_responses(status);
CREATE INDEX idx_response_items_response ON diagnostic_response_items(response_id);

-- RLS Policies
ALTER TABLE diagnostic_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_response_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view diagnostic responses of their org"
  ON diagnostic_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = diagnostic_responses.order_id
      AND o.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Technicians can create/update diagnostic responses"
  ON diagnostic_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN orders o ON o.org_id = p.org_id
      WHERE p.id = auth.uid()
      AND o.id = diagnostic_responses.order_id
      AND p.role IN ('tecnico', 'gerente', 'admin')
    )
  );

CREATE POLICY "Response items follow parent permissions"
  ON diagnostic_response_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_responses dr
      JOIN orders o ON o.id = dr.order_id
      WHERE dr.id = diagnostic_response_items.response_id
      AND o.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Technicians can manage response items"
  ON diagnostic_response_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_responses dr
      JOIN orders o ON o.id = dr.order_id
      JOIN profiles p ON p.org_id = o.org_id
      WHERE dr.id = diagnostic_response_items.response_id
      AND p.id = auth.uid()
      AND p.role IN ('tecnico', 'gerente', 'admin')
    )
  );

-- Trigger para avaliar serviços sugeridos
CREATE OR REPLACE FUNCTION evaluate_service_suggestions()
RETURNS TRIGGER AS $$
DECLARE
  v_checklist_item RECORD;
  v_condition TEXT;
  v_result BOOLEAN;
BEGIN
  -- Busca configuração do item
  SELECT * INTO v_checklist_item
  FROM diagnostic_checklist_items
  WHERE id = NEW.checklist_item_id;
  
  -- Se não tem trigger, retorna
  IF v_checklist_item.triggers_service IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Avalia condição
  v_condition := v_checklist_item.triggers_service->>'condition';
  
  -- Substitui "response" pelo valor real
  v_condition := replace(v_condition, 'response', quote_literal(NEW.response_value::text));
  
  -- Executa condição (simplificado - em produção usar função mais robusta)
  EXECUTE 'SELECT ' || v_condition INTO v_result;
  
  -- Se condição satisfeita, adiciona serviços sugeridos
  IF v_result THEN
    NEW.suggested_services := v_checklist_item.triggers_service->'service_codes';
  ELSE
    NEW.suggested_services := '[]'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_evaluate_suggestions
  BEFORE INSERT OR UPDATE ON diagnostic_response_items
  FOR EACH ROW
  EXECUTE FUNCTION evaluate_service_suggestions();

-- Trigger para atualizar status da resposta
CREATE OR REPLACE FUNCTION update_diagnostic_response_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_required INTEGER;
  v_answered_required INTEGER;
BEGIN
  -- Conta itens obrigatórios
  SELECT COUNT(*) INTO v_total_required
  FROM diagnostic_checklist_items dci
  WHERE dci.checklist_id = (
    SELECT checklist_id FROM diagnostic_responses WHERE id = NEW.response_id
  )
  AND dci.is_required = true;
  
  -- Conta itens obrigatórios respondidos
  SELECT COUNT(*) INTO v_answered_required
  FROM diagnostic_response_items dri
  JOIN diagnostic_checklist_items dci ON dci.id = dri.checklist_item_id
  WHERE dri.response_id = NEW.response_id
  AND dci.is_required = true
  AND dri.response_value IS NOT NULL;
  
  -- Atualiza status
  UPDATE diagnostic_responses
  SET 
    status = CASE 
      WHEN v_answered_required = v_total_required THEN 'completed'
      WHEN v_answered_required > 0 THEN 'in_progress'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = NEW.response_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_response_status
  AFTER INSERT OR UPDATE ON diagnostic_response_items
  FOR EACH ROW
  EXECUTE FUNCTION update_diagnostic_response_status();

-- Trigger para updated_at
CREATE TRIGGER trg_update_diagnostic_responses_timestamp
  BEFORE UPDATE ON diagnostic_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_diagnostic_checklists_updated_at();

CREATE TRIGGER trg_update_response_items_timestamp
  BEFORE UPDATE ON diagnostic_response_items
  FOR EACH ROW
  EXECUTE FUNCTION update_diagnostic_checklists_updated_at();
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Diagnóstico - Bloco - OS #1234                        [X]  │
├─────────────────────────────────────────────────────────────┤
│  Progresso: ████████████░░░░ 12/15 campos (80%)             │
│  Status: Em Progresso | Auto-salvando...                    │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ RESPOSTAS DO DIAGNÓSTICO                                ││
│  ├─────────────────────────────────────────────────────────┤│
│  │                                                          ││
│  │ ✅ 1. Estado das camisas: Ruim                          ││
│  │    ⚠️ Serviços sugeridos: Retífica de camisa (BLC001)  ││
│  │                                                          ││
│  │ ✅ 2. Possui trincas visíveis? Não                      ││
│  │                                                          ││
│  │ ✅ 3. Desgaste irregular? Sim                           ││
│  │                                                          ││
│  │ ⏳ 4. Avaliação de usinagem necessária: *               ││
│  │    ◯──◯──●──◯──◯                                        ││
│  │    1   2   3   4   5                                    ││
│  │    [Valor selecionado: 3 - Moderada]                   ││
│  │    ⚠️ Sugerirá: Usinagem do bloco (BLC004)             ││
│  │                                                          ││
│  │ ✅ 5. Medição de diâmetro interno: 95.2 mm             ││
│  │                                                          ││
│  │ ⏳ 6. Fotos das camisas:                                ││
│  │    [📷 Upload Fotos]                                   ││
│  │    [🖼️ camisa1.jpg]  [X]                               ││
│  │    [🖼️ camisa2.jpg]  [X]                               ││
│  │    [+ Adicionar Mais Fotos]                            ││
│  │                                                          ││
│  │ ✅ 7. Observações gerais:                               ││
│  │    Camisa 1 apresenta desgaste acentuado na parte      ││
│  │    superior. Recomenda-se substituição ou retífica.    ││
│  │                                                          ││
│  │ ... (8 campos restantes)                                ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ✅ = Respondido | ⏳ = Pendente | ⚠️ = Requer atenção      │
│                                                               │
│  Último salvamento: há 5 segundos                            │
│                                                               │
│         [Salvar Rascunho]  [← Voltar]  [Continuar →]       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Preencher Todos os Tipos de Campo
```gherkin
Given que estou preenchendo diagnóstico de Bloco
When preencho campo texto com "Desgaste visível"
And preencho campo select com "Ruim"
And marco campo boolean como true
And ajusto slider para valor 3
And faço upload de 2 fotos
Then todas as respostas são salvas
And barra de progresso atualiza
```

### E2E Test 2: Auto-Save Funcional
```gherkin
Given que preenchi 3 campos
When aguardo 30 segundos
Then mensagem "Auto-salvando..." aparece
And respostas são persistidas no banco
And posso sair e voltar sem perder dados
```

### E2E Test 3: Validação de Campo Obrigatório
```gherkin
Given que campo "Estado das camisas" é obrigatório
When tento avançar sem preencher
Then erro de validação aparece
And campo fica destacado em vermelho
And não posso avançar
```

### E2E Test 4: Status Muda ao Completar
```gherkin
Given que estou com 14/15 campos preenchidos
And status é "in_progress"
When preencho o último campo obrigatório
Then status muda para "completed"
And botão "Aprovar Diagnóstico" fica habilitado
```

---

## 🚫 Negative Scope

**Não inclui:**
- Respostas colaborativas (múltiplos técnicos)
- Versionamento de respostas
- Desfazer/refazer respostas
- Comparação com diagnósticos anteriores

---

## 🔗 Dependencies

**Blocks:**
- US-DIAG-003 (Upload de Fotos)
- US-DIAG-004 (Sugestão de Serviços)
- US-DIAG-005 (Aprovar Diagnóstico)

**Blocked by:**
- US-DIAG-001 (Criar Checklist)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
