# US-DIAG-004: Sistema de Sugestão Automática de Serviços

**ID:** US-DIAG-004  
**Epic:** Diagnósticos  
**Sprint:** 3  
**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** técnico  
**Quero** que o sistema sugira automaticamente serviços necessários baseado nas respostas do diagnóstico  
**Para** agilizar a criação de orçamentos precisos

---

## 🎯 Business Objective

Reduzir tempo de criação de orçamentos e minimizar erros humanos ao listar serviços necessários, aumentando assertividade e velocidade de resposta ao cliente.

---

## 📐 Business Rules

### RN001: Catálogo de Serviços
**Estrutura:**
```typescript
interface ServiceCatalogItem {
  id: string;
  service_code: string; // Ex: "BLC001", "VRB002"
  service_name: string; // Ex: "Retífica de camisa"
  service_category: 'desmontagem' | 'limpeza' | 'retifica' | 'substituicao' | 'montagem' | 'teste';
  component: ComponentType[];
  base_price: number;
  unit: 'unidade' | 'hora' | 'cm' | 'mm';
  estimated_time_hours: number;
  requires_parts: boolean;
  description: string;
  technical_notes?: string;
  is_active: boolean;
}
```

### RN002: Regras de Sugestão
**Gatilhos no Checklist Item:**
```json
{
  "triggers_service": {
    "condition": "response == 'Ruim' || response == 'Crítico'",
    "service_codes": ["BLC001", "BLC002"],
    "priority": "alta",
    "auto_add_to_budget": false,
    "explanation": "Desgaste severo requer retífica ou substituição"
  }
}
```

**Condições Suportadas:**
```typescript
const conditions = {
  // Comparações simples
  "response == 'valor'",
  "response != 'valor'",
  "response > 5",
  "response < 3",
  "response >= 4",
  "response <= 2",
  
  // Operadores lógicos
  "response == 'Ruim' || response == 'Crítico'",
  "response >= 3 && response < 5",
  
  // Arrays
  "response.includes('Trinca')",
  "response.length > 0",
  
  // Boolean
  "response == true",
  "response == false"
};
```

### RN003: Avaliação de Condições
**Trigger em database (já implementado em US-DIAG-002):**
```sql
CREATE OR REPLACE FUNCTION evaluate_service_suggestions()
RETURNS TRIGGER AS $$
DECLARE
  v_checklist_item RECORD;
  v_condition TEXT;
  v_result BOOLEAN;
  v_service_codes JSONB;
BEGIN
  SELECT * INTO v_checklist_item
  FROM diagnostic_checklist_items
  WHERE id = NEW.checklist_item_id;
  
  IF v_checklist_item.triggers_service IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_condition := v_checklist_item.triggers_service->>'condition';
  v_service_codes := v_checklist_item.triggers_service->'service_codes';
  
  -- Avaliar condição (simplificado)
  -- Em produção, usar parser mais robusto
  EXECUTE 'SELECT ' || 
    replace(v_condition, 'response', quote_literal(NEW.response_value::text)) 
  INTO v_result;
  
  IF v_result THEN
    NEW.suggested_services := v_service_codes;
  ELSE
    NEW.suggested_services := '[]'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### RN004: Consolidação de Sugestões
**Ao completar diagnóstico de um componente:**
```typescript
const consolidateSuggestions = (responseItems: ResponseItem[]) => {
  const allSuggestions = responseItems
    .flatMap(item => item.suggested_services)
    .filter(code => code !== null);
  
  // Remove duplicatas
  const uniqueServices = [...new Set(allSuggestions)];
  
  // Busca detalhes do catálogo
  const services = await supabase
    .from('service_catalog')
    .select('*')
    .in('service_code', uniqueServices);
  
  // Agrupa por prioridade
  return {
    high: services.filter(s => s.priority === 'alta'),
    medium: services.filter(s => s.priority === 'media'),
    low: services.filter(s => s.priority === 'baixa')
  };
};
```

### RN005: UI de Sugestões
**Exibição:**
```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ SERVIÇOS SUGERIDOS PARA BLOCO                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🔴 Alta Prioridade (3):                                 │
│ [✅] BLC001 - Retífica de camisa        R$ 850,00       │
│       Motivo: Estado das camisas = Ruim                 │
│                                                          │
│ [✅] BLC002 - Soldagem de trinca        R$ 320,00       │
│       Motivo: Possui trincas visíveis = Sim             │
│                                                          │
│ [  ] BLC004 - Usinagem do bloco         R$ 1.200,00    │
│       Motivo: Avaliação de usinagem = 3 (Moderada)     │
│                                                          │
│ 🟡 Média Prioridade (1):                                │
│ [✅] BLC010 - Limpeza profunda          R$ 180,00       │
│                                                          │
│ Total Selecionado: R$ 2.550,00                          │
│                                                          │
│ [Adicionar Todos]  [Adicionar Selecionados ao Orçamento]│
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Acceptance Criteria

**AC1:** Sugestões são geradas automaticamente ao responder campo  
**AC2:** Sugestões aparecem agrupadas por prioridade  
**AC3:** Cada sugestão mostra motivo (qual campo disparou)  
**AC4:** Posso selecionar/desselecionar serviços sugeridos  
**AC5:** Botão "Adicionar ao Orçamento" envia serviços selecionados  
**AC6:** Serviços duplicados são removidos automaticamente

---

## 🛠️ Definition of Done

- [x] Tabela `service_catalog` criada
- [x] Trigger `evaluate_service_suggestions` funcionando
- [x] Componente `ServiceSuggestions.tsx` criado
- [x] Hook `useServiceSuggestions.ts` implementado
- [x] Consolidação de sugestões por componente
- [x] Catálogo de serviços seedado no banco
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/diagnostics/
  ├── ChecklistForm.tsx            (UPDATE - exibe sugestões)
  └── ServiceSuggestions.tsx       (NEW)

src/hooks/
  └── useServiceSuggestions.ts     (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Catálogo de serviços
CREATE TABLE service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  service_category TEXT CHECK (service_category IN (
    'desmontagem', 'limpeza', 'retifica', 'substituicao', 'montagem', 'teste', 'outros'
  )),
  component TEXT[], -- Array de componentes aplicáveis
  base_price NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT 'unidade',
  estimated_time_hours NUMERIC(5,2),
  requires_parts BOOLEAN DEFAULT false,
  description TEXT NOT NULL,
  technical_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  org_id UUID REFERENCES organizations(id), -- NULL = serviço padrão do sistema
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_service_catalog_code ON service_catalog(service_code);
CREATE INDEX idx_service_catalog_category ON service_catalog(service_category);
CREATE INDEX idx_service_catalog_component ON service_catalog USING GIN(component);
CREATE INDEX idx_service_catalog_org ON service_catalog(org_id);

-- RLS Policies
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public services are viewable by everyone"
  ON service_catalog FOR SELECT
  USING (org_id IS NULL OR org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage org services"
  ON service_catalog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (org_id = service_catalog.org_id OR service_catalog.org_id IS NULL)
      AND role IN ('admin', 'gerente')
    )
  );

-- Função para buscar serviços de um array de códigos
CREATE OR REPLACE FUNCTION get_services_by_codes(p_service_codes TEXT[])
RETURNS TABLE (
  service service_catalog
) AS $$
BEGIN
  RETURN QUERY
  SELECT sc.*
  FROM service_catalog sc
  WHERE sc.service_code = ANY(p_service_codes)
    AND sc.is_active = true
  ORDER BY 
    CASE sc.service_category
      WHEN 'desmontagem' THEN 1
      WHEN 'limpeza' THEN 2
      WHEN 'retifica' THEN 3
      WHEN 'substituicao' THEN 4
      WHEN 'montagem' THEN 5
      WHEN 'teste' THEN 6
      ELSE 7
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para sugestões consolidadas por componente
CREATE OR REPLACE VIEW v_diagnostic_suggestions AS
SELECT 
  dr.id AS response_id,
  dr.order_id,
  dr.component,
  jsonb_agg(DISTINCT dri.suggested_services) FILTER (WHERE dri.suggested_services != '[]'::jsonb) AS all_suggested_codes,
  COUNT(DISTINCT dri.id) FILTER (WHERE dri.suggested_services != '[]'::jsonb) AS suggestions_count
FROM diagnostic_responses dr
JOIN diagnostic_response_items dri ON dri.response_id = dr.id
GROUP BY dr.id, dr.order_id, dr.component;

-- Seed de serviços padrão
INSERT INTO service_catalog (service_code, service_name, service_category, component, base_price, estimated_time_hours, description) VALUES
-- Bloco
('BLC001', 'Retífica de camisa', 'retifica', '{bloco}', 850.00, 4.0, 'Retífica completa das camisas do bloco'),
('BLC002', 'Soldagem de trinca', 'retifica', '{bloco}', 320.00, 2.5, 'Soldagem especial de trincas no bloco'),
('BLC003', 'Substituição de camisa', 'substituicao', '{bloco}', 1200.00, 6.0, 'Substituição completa de camisa danificada'),
('BLC004', 'Usinagem do bloco', 'retifica', '{bloco}', 1200.00, 5.0, 'Usinagem de superfícies do bloco'),
('BLC010', 'Limpeza profunda', 'limpeza', '{bloco}', 180.00, 1.5, 'Limpeza química profunda do bloco'),

-- Cabeçote
('CAB001', 'Retífica de válvulas', 'retifica', '{cabecote}', 450.00, 3.0, 'Retífica completa do conjunto de válvulas'),
('CAB002', 'Planificação do cabeçote', 'retifica', '{cabecote}', 380.00, 2.0, 'Planificação da superfície do cabeçote'),
('CAB003', 'Substituição de sede de válvula', 'substituicao', '{cabecote}', 280.00, 2.5, 'Substituição de sede de válvula danificada'),

-- Virabrequim
('VRB001', 'Retífica do virabrequim', 'retifica', '{virabrequim}', 950.00, 4.0, 'Retífica completa do virabrequim'),
('VRB002', 'Polimento de munhões', 'retifica', '{virabrequim}', 420.00, 2.0, 'Polimento de munhões do virabrequim'),
('VRB003', 'Soldagem e retífica', 'retifica', '{virabrequim}', 1500.00, 6.0, 'Soldagem de desgaste e posterior retífica'),

-- Biela
('BIE001', 'Retífica de biela', 'retifica', '{biela}', 180.00, 1.5, 'Retífica de olhal de biela'),
('BIE002', 'Substituição de bucha', 'substituicao', '{biela}', 95.00, 1.0, 'Substituição de bucha de pé de biela'),

-- Pistão
('PIS001', 'Substituição de pistão', 'substituicao', '{pistao}', 350.00, 2.0, 'Substituição de pistão danificado'),
('PIS002', 'Substituição de anéis', 'substituicao', '{pistao}', 120.00, 1.0, 'Substituição de anéis de segmento')

ON CONFLICT (service_code) DO NOTHING;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Diagnóstico - Bloco (Completado)                      [X]  │
├─────────────────────────────────────────────────────────────┤
│  ✅ Todos os campos obrigatórios preenchidos                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⚙️ SERVIÇOS SUGERIDOS AUTOMATICAMENTE                  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │                                                          ││
│  │ Baseado nas suas respostas, estes serviços foram        ││
│  │ identificados como necessários:                         ││
│  │                                                          ││
│  │ 🔴 ALTA PRIORIDADE (3 serviços):                        ││
│  │ ┌────────────────────────────────────────────────────┐ ││
│  │ │ [✅] BLC001 - Retífica de camisa        R$ 850,00  │ ││
│  │ │      ⚠️ Campo "Estado das camisas" = Ruim          │ ││
│  │ │      Tempo estimado: 4h                             │ ││
│  │ └────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │ ┌────────────────────────────────────────────────────┐ ││
│  │ │ [✅] BLC002 - Soldagem de trinca        R$ 320,00  │ ││
│  │ │      ⚠️ Campo "Possui trincas visíveis" = Sim      │ ││
│  │ │      Tempo estimado: 2.5h                           │ ││
│  │ └────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │ ┌────────────────────────────────────────────────────┐ ││
│  │ │ [  ] BLC004 - Usinagem do bloco         R$ 1.200  │ ││
│  │ │      ⚠️ Campo "Avaliação de usinagem" = 3          │ ││
│  │ │      Tempo estimado: 5h                             │ ││
│  │ │      ℹ️ Opcional - considere conforme orçamento    │ ││
│  │ └────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │ 🟡 MÉDIA PRIORIDADE (1 serviço):                        ││
│  │ ┌────────────────────────────────────────────────────┐ ││
│  │ │ [✅] BLC010 - Limpeza profunda          R$ 180,00  │ ││
│  │ │      Campo "Necessita limpeza química" = Sim       │ ││
│  │ │      Tempo estimado: 1.5h                           │ ││
│  │ └────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │ ─────────────────────────────────────────────────────── ││
│  │ Total Selecionado: R$ 2.550,00 (3 serviços)            ││
│  │ Tempo Total Estimado: 9.5 horas                         ││
│  │                                                          ││
│  │          [Marcar Todos]  [Desmarcar Todos]              ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│     [← Voltar]  [Salvar Rascunho]  [Finalizar Componente →]│
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Geração Automática de Sugestões
```gherkin
Given que estou preenchendo diagnóstico de Bloco
When respondo "Estado das camisas" = "Ruim"
Then serviço "BLC001 - Retífica de camisa" aparece nas sugestões
And está marcado com prioridade "Alta"
And mostra motivo: "Estado das camisas = Ruim"
```

### E2E Test 2: Consolidação de Múltiplas Sugestões
```gherkin
Given que respondi 5 campos do checklist
And 3 campos dispararam triggers de serviços
And 2 triggers sugeriram o mesmo serviço "BLC010"
When visualizo lista de sugestões
Then serviço "BLC010" aparece apenas 1 vez
And mostra 2 motivos diferentes
```

### E2E Test 3: Selecionar Serviços
```gherkin
Given que tenho 4 serviços sugeridos
When marco checkbox de 3 serviços
Then total calculado atualiza
And botão "Adicionar ao Orçamento" mostra "3 serviços"
```

### E2E Test 4: Adicionar ao Orçamento
```gherkin
Given que selecionei 3 serviços
When clico em "Adicionar ao Orçamento"
Then serviços são pré-preenchidos no orçamento
And preços base são copiados
And tempo estimado é somado
And avanço para etapa de orçamento
```

---

## 🚫 Negative Scope

**Não inclui:**
- Machine learning para sugestões mais inteligentes
- Sugestões baseadas em histórico de OSs similares
- Aprovação de sugestões antes de adicionar
- Edição de preços dos serviços sugeridos

---

## 🔗 Dependencies

**Blocks:**
- US-DIAG-005 (Aprovar e Gerar Orçamento)

**Blocked by:**
- US-DIAG-001 (Criar Checklist)
- US-DIAG-002 (Responder Diagnóstico)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
