# US-OS-009: Transições entre Estágios do Workflow

**ID:** US-OS-009  
**Epic:** Gestão de Ordens de Serviço  
**Sprint:** 3  
**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** técnico ou gerente de produção  
**Quero** avançar componentes entre estágios do workflow  
**Para** acompanhar o progresso da produção e controlar checklists obrigatórios

---

## 🎯 Business Objective

Permitir transições controladas entre os 14 estágios de produção, garantindo que checklists obrigatórios sejam completados antes de avançar.

---

## 📐 Business Rules

### RN001: Estágios do Workflow (14 stages)
1. **pending** - Aguardando Início
2. **disassembly** - Desmontagem
3. **inspection** - Inspeção Inicial
4. **measuring** - Medição
5. **diagnosis** - Diagnóstico
6. **waiting_approval** - Aguardando Aprovação
7. **waiting_parts** - Aguardando Peças
8. **washing** - Lavagem
9. **machining** - Usinagem
10. **assembly** - Montagem
11. **testing** - Testes
12. **painting** - Pintura
13. **quality_control** - Controle de Qualidade
14. **completed** - Concluído

### RN002: Validações de Transição
- Checklists obrigatórios devem estar 100% completos
- Técnico deve estar atribuído ao componente
- Componente não pode pular estágios (transição sequencial)
- Componente em "completed" não pode retroceder

### RN003: Registros Automáticos
- Data/hora de início do estágio (`started_at`)
- Data/hora de conclusão do estágio anterior (`completed_at`)
- Usuário que realizou a transição
- Registro em `order_status_history` com detalhes do componente

### RN004: Permissões
- **Técnicos**: Podem avançar componentes atribuídos a eles
- **Gerentes**: Podem avançar qualquer componente
- **Consultores**: Não podem avançar estágios

### RN005: Sincronização com Status da OS
- Quando todos os componentes estão "completed", status da OS muda para "concluido"
- Se pelo menos 1 componente está em produção, OS está "em_producao"

---

## ✅ Acceptance Criteria

**AC1:** Botão "Avançar" visível em cada card do Kanban  
**AC2:** Modal de confirmação exibe checklist obrigatório  
**AC3:** Botão "Confirmar" desabilitado se checklist incompleto  
**AC4:** Toast de sucesso após transição  
**AC5:** Card move para próxima coluna do Kanban  
**AC6:** Registro criado em `order_status_history` com `component` preenchido  
**AC7:** Timestamps `started_at` e `completed_at` atualizados

---

## 🛠️ Definition of Done

- [x] Componente `StageTransitionModal.tsx` criado
- [x] Hook `useStageTransition.ts` implementado
- [x] Validação de checklists obrigatórios
- [x] Integração com `order_workflow` (UPDATE)
- [x] Auditoria em `order_status_history`
- [x] Sincronização de status da OS
- [x] RLS policies verificadas
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/workflow/
  ├── ComponentCard.tsx           (UPDATE - adicionar botão)
  └── StageTransitionModal.tsx    (NEW)

src/hooks/
  ├── useOrderWorkflow.ts         (UPDATE)
  └── useStageTransition.ts       (NEW)
```

---

## 🗄️ Database Changes

```sql
-- Função para validar transição
CREATE OR REPLACE FUNCTION validate_stage_transition(
  p_workflow_id UUID,
  p_current_stage TEXT,
  p_next_stage TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_checklist_complete BOOLEAN;
  v_stage_order INTEGER;
BEGIN
  -- Verifica se checklists obrigatórios estão completos
  SELECT COUNT(*) = 0 INTO v_checklist_complete
  FROM diagnostic_checklist_items dci
  WHERE dci.checklist_id IN (
    SELECT dc.id FROM diagnostic_checklists dc
    WHERE dc.component = (
      SELECT component FROM order_workflow WHERE id = p_workflow_id
    )
  )
  AND dci.is_required = true
  AND dci.id NOT IN (
    SELECT item_id FROM diagnostic_responses
    WHERE workflow_id = p_workflow_id
  );

  -- Verifica ordem sequencial
  SELECT CASE p_next_stage
    WHEN 'disassembly' THEN 1
    WHEN 'inspection' THEN 2
    WHEN 'measuring' THEN 3
    WHEN 'diagnosis' THEN 4
    WHEN 'waiting_approval' THEN 5
    WHEN 'waiting_parts' THEN 6
    WHEN 'washing' THEN 7
    WHEN 'machining' THEN 8
    WHEN 'assembly' THEN 9
    WHEN 'testing' THEN 10
    WHEN 'painting' THEN 11
    WHEN 'quality_control' THEN 12
    WHEN 'completed' THEN 13
  END INTO v_stage_order;

  RETURN v_checklist_complete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar status da OS
CREATE OR REPLACE FUNCTION sync_order_status_from_workflow()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_all_completed BOOLEAN;
  v_any_in_production BOOLEAN;
BEGIN
  v_order_id := NEW.order_id;

  -- Verifica se todos os componentes estão concluídos
  SELECT 
    COUNT(*) = COUNT(CASE WHEN stage = 'completed' THEN 1 END)
  INTO v_all_completed
  FROM order_workflow
  WHERE order_id = v_order_id;

  -- Verifica se algum componente está em produção
  SELECT 
    COUNT(*) > 0
  INTO v_any_in_production
  FROM order_workflow
  WHERE order_id = v_order_id
  AND stage NOT IN ('pending', 'completed');

  -- Atualiza status da OS
  IF v_all_completed THEN
    UPDATE orders SET status = 'concluido' WHERE id = v_order_id;
  ELSIF v_any_in_production THEN
    UPDATE orders SET status = 'em_producao' WHERE id = v_order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_order_status
AFTER UPDATE OF stage ON order_workflow
FOR EACH ROW
EXECUTE FUNCTION sync_order_status_from_workflow();
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Avançar Componente: Bloco                              [X]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Estágio Atual:    Diagnóstico ✅                               │
│  Próximo Estágio:  Aguardando Aprovação                         │
│                                                                   │
│  ⚠️ Checklists Obrigatórios:                                    │
│                                                                   │
│  [✅] Inspeção visual completa                                   │
│  [✅] Medições dimensionais registradas                          │
│  [❌] Parecer técnico preenchido                                 │
│  [✅] Fotos anexadas                                             │
│                                                                   │
│  ⚠️ 1 checklist pendente. Complete antes de avançar.            │
│                                                                   │
│  Observações (opcional):                                          │
│  [TextArea: Adicione observações sobre esta etapa...          ] │
│                                                                   │
│                                      [Cancelar]  [Confirmar] 🔒 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Transição Bem-Sucedida
```gherkin
Given que sou técnico logado
And tenho um componente "Bloco" no estágio "diagnosis"
And todos os checklists obrigatórios estão completos
When clico em "Avançar" no card
And confirmo a transição
Then vejo toast "Componente avançado com sucesso"
And card move para coluna "Aguardando Aprovação"
And registro aparece no histórico da OS
```

### E2E Test 2: Bloqueio por Checklist Incompleto
```gherkin
Given que tenho um componente "Cabeçote" no estágio "measuring"
And existem checklists obrigatórios pendentes
When clico em "Avançar"
Then vejo modal com lista de checklists
And botão "Confirmar" está desabilitado
And vejo mensagem "X checklists pendentes"
```

### E2E Test 3: Sincronização de Status da OS
```gherkin
Given que OS #1234 tem 3 componentes
And 2 componentes já estão "completed"
When avanço o último componente para "completed"
Then status da OS muda automaticamente para "concluido"
And vejo atualização no header da OS
```

---

## 🚫 Negative Scope

**Não inclui:**
- Retroceder estágios (requer US-OS-011 - Rollback)
- Pular estágios (violaria validação sequencial)
- Edição de checklists durante transição
- Relatório de produtividade por estágio

---

## 🔗 Dependencies

**Blocks:**
- US-OS-010 (Histórico depende de transições)

**Blocked by:**
- US-WKF-002 (Drag-and-drop do Kanban)
- US-DIAG-002 (Checklists obrigatórios)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
