# US-WKF-005: Validação de Checklists Obrigatórios

**ID:** US-WKF-005  
**Epic:** Workflow Kanban  
**Sprint:** 2  
**Prioridade:** Crítica  
**Estimativa:** 5 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** sistema  
**Quero** validar preenchimento de checklists obrigatórios  
**Para** garantir que nenhuma etapa seja pulada sem documentação adequada

---

## 🎯 Business Objective

Assegurar rastreabilidade e qualidade do processo, evitando que OSs avancem sem validações técnicas necessárias.

---

## 📐 Business Rules

### RN001: Checklists por Stage
**Mapeamento de Checklists Obrigatórios:**

| Stage | Checklist Requerido | Bloqueio |
|-------|---------------------|----------|
| Em Metrologia | Componentes Recebidos | Não pode iniciar sem marcar todos os componentes |
| Aguardando Diagnóstico | Metrologia Completa (todas as medições) | Não pode avançar sem medições |
| Aguardando Orçamento | Diagnóstico Finalizado | Não pode criar orçamento sem diagnóstico |
| Em Produção | Orçamento Aprovado (cliente + gerente) | Não pode iniciar produção sem aprovação |

### RN002: Lógica de Validação
```typescript
const checklistValidations = {
  'em_metrologia': async (orderId: string) => {
    // Verifica se todos os componentes foram marcados como recebidos
    const { data } = await supabase
      .from('order_workflow')
      .select('components_received')
      .eq('order_id', orderId)
      .single();
    
    return data?.components_received?.every(c => c.received === true);
  },
  
  'aguardando_diagnostico': async (orderId: string) => {
    // Verifica se todas as medições foram realizadas
    const { count } = await supabase
      .from('motor_dna')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .not('measurements', 'is', null);
    
    const { data: workflow } = await supabase
      .from('order_workflow')
      .select('components_received')
      .eq('order_id', orderId)
      .single();
    
    return count === workflow?.components_received?.length;
  },
  
  'aguardando_orcamento': async (orderId: string) => {
    // Verifica se diagnóstico está finalizado
    const { data } = await supabase
      .from('diagnostic_responses')
      .select('status')
      .eq('order_id', orderId);
    
    return data?.every(d => d.status === 'completed');
  },
  
  'em_producao': async (orderId: string) => {
    // Verifica aprovações do orçamento
    const { data } = await supabase
      .from('budget_approvals')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'approved');
    
    // Requer aprovação do cliente E do gerente
    const hasCustomerApproval = data?.some(a => a.approval_type === 'customer');
    const hasManagerApproval = data?.some(a => a.approval_type === 'manager');
    
    return hasCustomerApproval && hasManagerApproval;
  }
};
```

### RN003: Mensagens de Erro
**Mensagens Customizadas:**
- "⚠️ Marque todos os componentes como recebidos antes de iniciar metrologia"
- "⚠️ Complete as medições de todos os componentes antes de criar diagnóstico"
- "⚠️ Finalize o diagnóstico de todos os componentes antes de gerar orçamento"
- "⚠️ Orçamento precisa estar aprovado pelo cliente e gerente antes de iniciar produção"

### RN004: Indicadores Visuais
- Badge vermelho no card: "⚠️ Checklist pendente"
- Coluna de destino fica destacada em vermelho ao tentar drop inválido
- Tooltip no card mostra o que está pendente

---

## ✅ Acceptance Criteria

**AC1:** Drag bloqueado se checklist não está completo  
**AC2:** Mensagem de erro específica aparece no toast  
**AC3:** Badge de alerta aparece nos cards pendentes  
**AC4:** Validação roda antes de salvar transição  
**AC5:** Card retorna à posição original se falhar  
**AC6:** View `v_workflows_with_pending_checklists` atualiza

---

## 🛠️ Definition of Done

- [x] Função de validação `validateStageTransition()` criada
- [x] Integração com drag & drop
- [x] Mensagens de erro implementadas
- [x] Badges de alerta no card
- [x] View de banco atualizada
- [x] Testes E2E para todos os cenários

---

## 📁 Affected Components

```
src/components/workflow/
  ├── OrderCard.tsx            (UPDATE - exibir badges)
  └── KanbanBoard.tsx          (UPDATE - validar no onDragEnd)

src/hooks/
  └── useOrderWorkflow.ts      (UPDATE - validateStageTransition)
```

---

## 🗄️ Database Changes

```sql
-- View v_workflows_with_pending_checklists (UPDATE)
CREATE OR REPLACE VIEW v_workflows_with_pending_checklists AS
SELECT 
  ow.*,
  o.order_number,
  o.priority,
  o.deadline,
  c.name AS customer_name,
  e.brand || ' ' || e.model AS engine_info,
  p.full_name AS assigned_technician,
  
  -- Contadores de pendências
  COUNT(DISTINCT md.id) FILTER (
    WHERE md.general_condition IS NULL
  ) AS components_without_inspection,
  
  COUNT(DISTINCT md.id) FILTER (
    WHERE md.measurements IS NULL
  ) AS components_without_measurements,
  
  COUNT(DISTINCT dr.id) FILTER (
    WHERE dr.status = 'pending'
  ) AS pending_diagnostics,
  
  COUNT(DISTINCT ba.id) FILTER (
    WHERE ba.status = 'pending'
  ) AS pending_budget_approvals,
  
  -- Flags de bloqueio
  CASE 
    WHEN ow.current_stage = 'em_metrologia' 
      AND EXISTS (
        SELECT 1 FROM order_workflow ow2 
        WHERE ow2.order_id = ow.order_id 
        AND NOT (ow2.components_received @> '[{"received": true}]')
      )
    THEN true
    ELSE false
  END AS blocked_by_components,
  
  CASE 
    WHEN ow.current_stage = 'aguardando_diagnostico'
      AND COUNT(DISTINCT md.id) FILTER (WHERE md.measurements IS NULL) > 0
    THEN true
    ELSE false
  END AS blocked_by_measurements
  
FROM order_workflow ow
JOIN orders o ON o.id = ow.order_id
JOIN customers c ON c.id = o.customer_id
JOIN engines e ON e.id = o.engine_id
LEFT JOIN profiles p ON p.id = ow.assigned_to
LEFT JOIN motor_dna md ON md.order_id = o.id
LEFT JOIN diagnostic_responses dr ON dr.order_id = o.id
LEFT JOIN budget_approvals ba ON ba.order_id = o.id
GROUP BY ow.id, o.id, c.id, e.id, p.id;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Cenário: Tentativa de Mover Card sem Checklist Completo    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐       ┌───────────────┐                  │
│  │ Ag. Metro     │       │ Em Metro      │                  │
│  │    (2)        │       │    (3)        │                  │
│  ├───────────────┤       ├───────────────┤                  │
│  │               │       │               │                  │
│  │ ┌───────────┐ │       │               │                  │
│  │ │ #1234     │ │  ✗──▶ │ 🚫 BLOQUEADO │                  │
│  │ │🔴 Alta    │ │       │               │                  │
│  │ │⚠️ Pending │ │       │               │                  │
│  │ │ABC Motors │ │       │               │                  │
│  │ │OM 906     │ │       │               │                  │
│  │ │           │ │       │               │                  │
│  │ │👤 João    │ │       │               │                  │
│  │ │⚙️ 0/7     │ │       │               │                  │
│  │ └───────────┘ │       │               │                  │
│  │               │       │               │                  │
│  └───────────────┘       └───────────────┘                  │
│                                                               │
│  ❌ Erro: "Marque todos os componentes como recebidos       │
│           antes de iniciar metrologia"                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Bloqueio por Componentes Não Recebidos
```gherkin
Given que tenho uma OS em "Aguardando Metrologia"
And componentes NÃO foram marcados como recebidos
When tento arrastar para "Em Metrologia"
Then drag é bloqueado
And toast de erro aparece
And card permanece na coluna original
```

### E2E Test 2: Bloqueio por Medições Incompletas
```gherkin
Given que tenho uma OS em "Em Metrologia"
And apenas 3 de 7 componentes foram medidos
When tento arrastar para "Aguardando Diagnóstico"
Then drag é bloqueado
And mensagem mostra "4 componentes sem medições"
```

### E2E Test 3: Sucesso Após Completar Checklist
```gherkin
Given que tenho uma OS bloqueada por checklist
When completo todas as validações pendentes
And retorno ao Kanban
Then badge de alerta some do card
And posso arrastar para próximo stage
```

### E2E Test 4: Badge de Alerta Visível
```gherkin
Given que tenho OSs com checklists pendentes
When visualizo o Kanban
Then cards bloqueados mostram badge "⚠️ Checklist pendente"
And tooltip explica o que está pendente ao hover
```

---

## 🚫 Negative Scope

**Não inclui:**
- Bypass manual de validações (mesmo para admin)
- Checklists opcionais configuráveis
- Alertas por e-mail de pendências
- Dashboard de OSs bloqueadas

---

## 🔗 Dependencies

**Blocks:**
- US-WKF-006 (Atribuir Técnico)

**Blocked by:**
- US-WKF-002 (Drag & Drop)
- US-MET-003 (Componentes Recebidos)
- US-MET-005 (Medições Dimensionais)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
