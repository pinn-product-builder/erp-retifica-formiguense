# US-MET-008: Integração com Orçamentos (Pré-preenchimento)

**ID:** US-MET-008  
**Epic:** Metrologia  
**Sprint:** 3  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** consultor ou gerente  
**Quero** que orçamentos sejam pré-preenchidos automaticamente com base no laudo de metrologia  
**Para** acelerar criação de orçamentos e garantir precisão técnica

---

## 🎯 Business Objective

Automatizar criação de orçamentos detalhados, utilizando dados técnicos do DNA do motor para sugerir serviços e peças necessárias.

---

## 📐 Business Rules

### RN001: Gatilho de Integração
- Ao concluir Etapa 5 (gerar PDF de metrologia)
- Sistema cria automaticamente entrada em `diagnostic_responses` vinculada à OS
- Botão "Criar Orçamento" aparece no OrderDetails após conclusão

### RN002: Mapeamento de Recomendações para Serviços

**Da Metrologia para Orçamento:**

| Condição Identificada | Serviço Sugerido | Componente |
|----------------------|------------------|------------|
| `needs_grinding = true` (virabrequim) | Retífica de virabrequim | Virabrequim |
| `needs_grinding = true` (bloco) | Retífica de cilindros | Bloco |
| `has_cracks = true` | Solda especial + Teste não destrutivo | Qualquer |
| `general_condition = 'critico'` | Substituição completa | Qualquer |
| Medição fora de tolerância (biela) | Substituição de bielas | Biela |
| Medição fora de tolerância (pistão) | Substituição de pistões | Pistão |

### RN003: Estrutura de Pré-preenchimento

**Para cada componente com problema identificado:**
- Criar item de orçamento (`detailed_budgets`)
- Campo `component` = componente do motor_dna
- Campo `diagnostic_response_id` = ID da resposta gerada
- Campo `services` (JSONB) = array de serviços sugeridos:
  ```json
  [
    {
      "service_code": "SRV-001",
      "service_name": "Retífica de virabrequim",
      "labor_hours": 4.0,
      "labor_cost_per_hour": 80.00,
      "suggested": true,
      "origin": "metrology_analysis"
    }
  ]
  ```
- Campo `parts` (JSONB) = array de peças sugeridas (vazio inicialmente)
- Status inicial = "draft"

### RN004: Validações
- Orçamento não pode ser criado se metrologia não estiver completa
- Orçamento criado automaticamente deve ter flag `auto_generated = true`
- Consultor pode editar/remover itens sugeridos antes de enviar ao cliente

### RN005: Observações Técnicas
- Observações do parecer técnico são copiadas para campo `notes` do orçamento
- Fotos de metrologia são vinculadas ao orçamento (opcional)

---

## ✅ Acceptance Criteria

**AC1:** Botão "Criar Orçamento" aparece após conclusão de metrologia  
**AC2:** Click no botão pré-preenche orçamento com serviços sugeridos  
**AC3:** Cada componente crítico gera item de orçamento separado  
**AC4:** Serviços são mapeados corretamente conforme RN002  
**AC5:** Observações técnicas são copiadas para orçamento  
**AC6:** Orçamento criado tem status "draft" e pode ser editado  
**AC7:** Flag `auto_generated = true` é definida

---

## 🛠️ Definition of Done

- [x] Função `mapMetrologyToBudget()` implementada
- [x] Hook `useMetrologyIntegration.ts` criado
- [x] Botão "Criar Orçamento" adicionado ao OrderDetails
- [x] Integração com `detailed_budgets` (INSERT)
- [x] Mapeamento de condições para serviços implementado
- [x] Validações de integridade implementadas
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/orders/
  └── OrderDetails.tsx              (UPDATE - botão Criar Orçamento)

src/components/budgets/
  └── BudgetPreview.tsx             (UPDATE - exibir origem dos dados)

src/hooks/
  └── useMetrologyIntegration.ts    (NEW)

src/lib/
  └── mappers/
      └── metrologyToBudget.ts      (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Adicionar campo auto_generated em detailed_budgets
ALTER TABLE detailed_budgets 
ADD COLUMN auto_generated BOOLEAN DEFAULT false;

-- View para orçamentos com origem em metrologia
CREATE OR REPLACE VIEW v_metrology_budgets AS
SELECT 
  db.*,
  mr.report_number as metrology_report,
  mr.general_conclusion,
  mr.recommendation,
  o.order_number,
  c.name as customer_name
FROM detailed_budgets db
JOIN orders o ON o.id = db.order_id
JOIN customers c ON c.id = o.customer_id
LEFT JOIN metrology_reports mr ON mr.order_id = db.order_id
WHERE db.auto_generated = true
ORDER BY db.created_at DESC;

-- Função para mapear metrologia para orçamento
CREATE OR REPLACE FUNCTION create_budget_from_metrology(
  p_order_id UUID
) RETURNS UUID AS $$
DECLARE
  v_budget_id UUID;
  v_component RECORD;
  v_report RECORD;
BEGIN
  -- Busca relatório de metrologia
  SELECT * INTO v_report
  FROM metrology_reports
  WHERE order_id = p_order_id
  ORDER BY generated_at DESC
  LIMIT 1;

  IF v_report IS NULL THEN
    RAISE EXCEPTION 'Metrologia não encontrada para esta OS';
  END IF;

  -- Cria orçamentos para cada componente com problemas
  FOR v_component IN (
    SELECT *
    FROM motor_dna
    WHERE order_id = p_order_id
    AND (
      general_condition IN ('ruim', 'critico')
      OR needs_grinding = true
      OR has_cracks = true
      OR measurements::text LIKE '%"status":"fora_tolerancia"%'
    )
  ) LOOP
    -- Insere item de orçamento
    INSERT INTO detailed_budgets (
      order_id,
      component,
      diagnostic_response_id,
      services,
      status,
      auto_generated,
      notes
    ) VALUES (
      p_order_id,
      v_component.component,
      NULL, -- Será preenchido após criar diagnostic_response
      jsonb_build_array(
        CASE
          WHEN v_component.needs_grinding THEN
            jsonb_build_object(
              'service_name', 'Retífica de ' || v_component.component,
              'labor_hours', 4.0,
              'labor_cost_per_hour', 80.00,
              'suggested', true,
              'origin', 'metrology_analysis'
            )
          WHEN v_component.general_condition = 'critico' THEN
            jsonb_build_object(
              'service_name', 'Substituição de ' || v_component.component,
              'labor_hours', 6.0,
              'labor_cost_per_hour', 80.00,
              'suggested', true,
              'origin', 'metrology_analysis'
            )
          ELSE NULL
        END
      ),
      'draft',
      true,
      v_component.visual_observations
    ) RETURNING id INTO v_budget_id;
  END LOOP;

  RETURN v_budget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  OS #1234 - Mercedes-Benz OM 906                    [← Voltar] │
├─────────────────────────────────────────────────────────────────┤
│  [Detalhes] [Timeline] [Fotos] [Materiais] [Garantia] [Metrologia]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ✅ Metrologia Concluída                                         │
│                                                                   │
│  📄 Relatório Técnico: REL-MET-2025-0042                         │
│  Gerado em: 27/01/2025 às 15:45                                 │
│  Técnico: João Silva                                             │
│                                                                   │
│  Recomendação: Recomendar reparos (listar)                       │
│                                                                   │
│  ┌─ Componentes com Problemas Identificados ──────────────────┐ │
│  │                                                             │ │
│  │  🔴 Virabrequim - CRÍTICO                                   │ │
│  │     • Medições fora de tolerância (biela 1, biela 2)        │ │
│  │     • Serviço sugerido: Retífica de virabrequim             │ │
│  │                                                             │ │
│  │  🟠 Biela - RUIM                                            │ │
│  │     • Desgaste excessivo identificado                       │ │
│  │     • Serviço sugerido: Substituição de bielas              │ │
│  │                                                             │ │
│  │  🟡 Bloco - REGULAR                                         │ │
│  │     • Desgaste moderado nas camisas                         │ │
│  │     • Serviço sugerido: Retífica de cilindros               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│                            [📥 Baixar Relatório PDF]             │
│                            [💰 Criar Orçamento Automático]       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

Após clicar em "Criar Orçamento Automático":

┌─────────────────────────────────────────────────────────────────┐
│  ✅ Orçamento criado com sucesso!                                │
│                                                                   │
│  3 itens adicionados automaticamente com base na análise técnica.│
│                                                                   │
│  [👁️ Visualizar Orçamento]  [✏️ Editar Orçamento]              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Criar Orçamento Automático
```gherkin
Given que metrologia está completa
And relatório PDF foi gerado
And identificados 3 componentes com problemas
When clico em "Criar Orçamento Automático"
Then sistema cria 3 itens em detailed_budgets
And cada item tem serviço sugerido correto
And campo auto_generated = true
And status = "draft"
And vejo toast "Orçamento criado com sucesso"
And botão "Visualizar Orçamento" aparece
```

### E2E Test 2: Mapeamento de Retífica
```gherkin
Given que virabrequim tem needs_grinding = true
When crio orçamento automático
Then item de orçamento inclui serviço "Retífica de virabrequim"
And labor_hours = 4.0
And labor_cost_per_hour = 80.00
And campo origin = "metrology_analysis"
```

### E2E Test 3: Mapeamento de Substituição
```gherkin
Given que biela tem general_condition = "critico"
When crio orçamento automático
Then item de orçamento inclui serviço "Substituição de bielas"
And labor_hours = 6.0
And suggested = true
```

### E2E Test 4: Observações Copiadas
```gherkin
Given que parecer técnico tem observações "Motor requer atenção especial"
When crio orçamento automático
Then campo notes do orçamento contém "Motor requer atenção especial"
And observações são editáveis
```

### E2E Test 5: Validação de Metrologia Incompleta
```gherkin
Given que metrologia não foi concluída
When tento criar orçamento automático
Then vejo erro "Complete a análise metrológica primeiro"
And orçamento não é criado
```

---

## 🚫 Negative Scope

**Não inclui:**
- Cálculo automático de preços de peças
- Integração com catálogo de fornecedores
- Sugestão de descontos baseada em volume
- Criação de múltiplas opções de orçamento

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-MET-006 (Parecer Técnico e PDF)
- US-ORC-004 (Orçamentos Detalhados - já existe)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
