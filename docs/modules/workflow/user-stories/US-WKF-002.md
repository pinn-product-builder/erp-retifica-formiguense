# US-WKF-002: Arrastar e Soltar Cards entre Stages

**ID:** US-WKF-002  
**Epic:** Workflow Kanban  
**Sprint:** 2  
**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** gerente de produção  
**Quero** arrastar cards entre colunas  
**Para** mover OSs de um stage para outro rapidamente

---

## 🎯 Business Objective

Agilizar transições de workflow através de interface intuitiva, reduzindo cliques e aumentando produtividade.

---

## 📐 Business Rules

### RN001: Biblioteca DnD
- Utilizar `@hello-pangea/dnd`
- Drag handles habilitados
- Animações suaves de transição
- Feedback visual durante drag

### RN002: Validações de Transição
**Regras de negócio:**
- Não pode pular stages obrigatórios
- Não pode voltar mais de 1 stage
- Validar checklists antes de avançar
- Exigir componentes recebidos antes de "Em Metrologia"

**Gatilhos de Validação:**
```typescript
const transitions = {
  'aguardando_metrologia': {
    requires: ['componentes_recebidos'],
    message: 'Marque todos os componentes recebidos antes de iniciar metrologia'
  },
  'em_diagnostico': {
    requires: ['metrologia_completa'],
    message: 'Complete a metrologia antes do diagnóstico'
  },
  'orcamento_aprovacao': {
    requires: ['diagnostico_finalizado'],
    message: 'Finalize o diagnóstico antes de criar orçamento'
  },
  'em_producao': {
    requires: ['orcamento_aprovado'],
    message: 'Orçamento precisa estar aprovado'
  }
}
```

### RN003: Feedback ao Usuário
- Toast de sucesso ao mover card
- Toast de erro se validação falhar
- Loading state durante update
- Card retorna à posição original se falhar

### RN004: Registro de Histórico
- Criar entrada em `workflow_history`
- Registrar: quem moveu, quando, de onde, para onde
- Opcional: campo de observação

---

## ✅ Acceptance Criteria

**AC1:** Card pode ser arrastado dentro da mesma coluna  
**AC2:** Card pode ser solto em coluna adjacente permitida  
**AC3:** Validações bloqueiam drops inválidos  
**AC4:** Toast aparece ao mover com sucesso  
**AC5:** Card retorna se transição falhar  
**AC6:** Histórico é registrado automaticamente

---

## 🛠️ Definition of Done

- [x] @hello-pangea/dnd integrado
- [x] Drag & drop funcional
- [x] Validações de transição implementadas
- [x] Histórico automático criado
- [x] Toasts de feedback configurados
- [x] Testes E2E para cenários críticos

---

## 📁 Affected Components

```
src/components/workflow/
  ├── KanbanBoard.tsx          (UPDATE - DnD Context)
  ├── KanbanColumn.tsx         (UPDATE - Droppable)
  └── OrderCard.tsx            (UPDATE - Draggable)

src/hooks/
  └── useOrderWorkflow.ts      (UPDATE - moveOrder function)
```

---

## 🗄️ Database Changes

```sql
-- Tabela order_workflow já existe
-- Apenas utiliza função update

-- Tabela workflow_history (já existe)
CREATE TABLE workflow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Trigger automático ao mover card (já existe)
CREATE OR REPLACE FUNCTION log_workflow_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
    INSERT INTO workflow_history (
      order_id, from_stage, to_stage, changed_by
    ) VALUES (
      NEW.order_id, OLD.current_stage, NEW.current_stage, auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_workflow_change
  AFTER UPDATE ON order_workflow
  FOR EACH ROW
  EXECUTE FUNCTION log_workflow_transition();
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Cenário: Arraste de Card                                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐       ┌─────────────┐       ┌────────────┐│
│  │ Ag. Metro   │       │ Em Metro    │       │ Ag. Diag.  ││
│  │    (2)      │       │    (3)      │       │    (1)     ││
│  ├─────────────┤       ├─────────────┤       ├────────────┤│
│  │             │       │             │       │            ││
│  │ ┌─────────┐ │       │ ┌─────────┐ │       │            ││
│  │ │ #1234   │ │  ───▶ │ │ GHOST   │ │       │            ││
│  │ │🔴 Alta  │ │       │ │         │ │       │            ││
│  │ │         │ │       │ └─────────┘ │       │            ││
│  │ │ ABC Mot │ │       │             │       │            ││
│  │ └─────────┘ │       │ ┌─────────┐ │       │            ││
│  │             │       │ │ #1230   │ │       │            ││
│  │ ┌─────────┐ │       │ │🟡 Méd.  │ │       │            ││
│  │ │ #1235   │ │       │ └─────────┘ │       │            ││
│  │ │🟡 Méd.  │ │       │             │       │            ││
│  │ └─────────┘ │       │             │       │            ││
│  │             │       │             │       │            ││
│  └─────────────┘       └─────────────┘       └────────────┘│
│                                                               │
│  [CURSOR COM CARD #1234 SENDO ARRASTADO]                     │
│                                                               │
│  ✅ Sucesso: "OS #1234 movida para Em Metrologia"            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Drag & Drop Válido
```gherkin
Given que tenho uma OS em "Aguardando Metrologia"
And todos os componentes estão marcados como recebidos
When arrasto o card para "Em Metrologia"
Then card é movido com sucesso
And toast de sucesso aparece
And histórico é registrado
```

### E2E Test 2: Validação de Checklist
```gherkin
Given que tenho uma OS em "Aguardando Metrologia"
And componentes NÃO estão marcados como recebidos
When tento arrastar para "Em Metrologia"
Then card retorna à posição original
And toast de erro aparece: "Marque todos os componentes recebidos"
And estado do banco não muda
```

### E2E Test 3: Pular Stages Bloqueado
```gherkin
Given que tenho uma OS em "Em Metrologia"
When tento arrastar diretamente para "Em Produção"
Then card não pode ser solto
And cursor mostra ícone de "não permitido"
```

---

## 🚫 Negative Scope

**Não inclui:**
- Drag de múltiplos cards simultaneamente
- Undo de transições
- Aprovações multi-nível para transições
- Regras customizáveis por cliente

---

## 🔗 Dependencies

**Blocks:**
- US-WKF-005 (Validação de Checklists)

**Blocked by:**
- US-WKF-001 (Visualizar Kanban)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
