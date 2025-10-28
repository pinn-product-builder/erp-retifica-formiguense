# US-WKF-009: Gestão de Componentes Individuais

**ID:** US-WKF-009  
**Epic:** Workflow Kanban  
**Sprint:** 3  
**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente de produção  
**Quero** visualizar e gerenciar o progresso de cada componente individualmente  
**Para** acompanhar trabalhos paralelos dentro da mesma OS

---

## 🎯 Business Objective

Permitir gestão granular de componentes, facilitando trabalho paralelo por múltiplos técnicos e melhorando visibilidade de progresso.

---

## 📐 Business Rules

### RN001: Expansão de Componentes
**Comportamento:**
- Card no Kanban pode ser expandido (accordion)
- Ao expandir, mostra lista de componentes da OS
- Cada componente tem mini-card com status próprio

**Informações por Componente:**
- Tipo (Bloco, Cabeçote, etc.)
- Status (Aguardando, Em Progresso, Concluído)
- Técnico atribuído
- Tempo gasto
- Checklists pendentes

### RN002: Estados de Componente
```typescript
type ComponentStatus = 
  | 'pending'           // Aguardando início
  | 'in_metrology'      // Em metrologia
  | 'in_diagnosis'      // Em diagnóstico
  | 'in_production'     // Em produção
  | 'completed'         // Concluído
  | 'blocked';          // Bloqueado (aguardando peças)
```

### RN003: Ações por Componente
- Atribuir técnico específico
- Marcar como iniciado
- Marcar como concluído
- Bloquear (com motivo)
- Ver histórico detalhado

### RN004: Progresso da OS
**Cálculo:**
```typescript
const osProgress = {
  total: components.length,
  completed: components.filter(c => c.status === 'completed').length,
  inProgress: components.filter(c => c.status.includes('in_')).length,
  pending: components.filter(c => c.status === 'pending').length,
  blocked: components.filter(c => c.status === 'blocked').length,
  
  percentage: (completed / total) * 100
};
```

### RN005: View Compacta vs Expandida
**Compacta (padrão):**
- Barra de progresso: ⚙️ 3/7
- Badge de status geral

**Expandida (ao clicar):**
```
┌──────────────────────────────────────┐
│ ⚙️ Componentes (3/7 concluídos)      │
├──────────────────────────────────────┤
│ ✅ Bloco          👤 João    2.5h   │
│ ✅ Cabeçote       👤 Marcos  3.0h   │
│ ⏳ Virabrequim    👤 João    1.2h   │
│ 🔴 Biela          👤 -       0h     │
│ 🔴 Pistão         👤 -       0h     │
│ 🔴 Comando        👤 -       0h     │
│ 🔴 Eixo           👤 -       0h     │
└──────────────────────────────────────┘
```

---

## ✅ Acceptance Criteria

**AC1:** Card pode ser expandido/colapsado  
**AC2:** Lista de componentes aparece ao expandir  
**AC3:** Cada componente mostra status e técnico  
**AC4:** Posso atribuir técnico a componente específico  
**AC5:** Barra de progresso atualiza ao marcar concluído  
**AC6:** Componentes bloqueados ficam destacados em vermelho

---

## 🛠️ Definition of Done

- [ ] Componente `ComponentAccordion.tsx` criado
- [ ] Componente `ComponentMiniCard.tsx` criado
- [ ] Hook `useComponentProgress.ts` implementado
- [ ] Ações de atribuir/marcar status funcionais
- [ ] Integração com `order_workflow` e `motor_dna`
- [ ] Animações suaves de expansão/colapso
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/workflow/
  ├── OrderCard.tsx              (UPDATE - accordion)
  ├── ComponentAccordion.tsx     (NEW)
  └── ComponentMiniCard.tsx      (NEW)

src/hooks/
  └── useComponentProgress.ts    (NEW)
```

---

## 🗄️ Database Changes

```sql
-- Adicionar campo component_status à tabela motor_dna
ALTER TABLE motor_dna
ADD COLUMN IF NOT EXISTS status TEXT 
  CHECK (status IN ('pending', 'in_metrology', 'in_diagnosis', 'in_production', 'completed', 'blocked'))
  DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS assigned_technician UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- View para progresso de componentes
CREATE OR REPLACE VIEW v_component_progress AS
SELECT 
  o.id AS order_id,
  o.order_number,
  ow.current_stage,
  
  -- Contadores
  COUNT(md.id) AS total_components,
  COUNT(md.id) FILTER (WHERE md.status = 'completed') AS completed_components,
  COUNT(md.id) FILTER (WHERE md.status LIKE 'in_%') AS in_progress_components,
  COUNT(md.id) FILTER (WHERE md.status = 'pending') AS pending_components,
  COUNT(md.id) FILTER (WHERE md.status = 'blocked') AS blocked_components,
  
  -- Percentual
  ROUND(
    (COUNT(md.id) FILTER (WHERE md.status = 'completed')::NUMERIC / 
     COUNT(md.id)::NUMERIC) * 100
  ) AS progress_percentage,
  
  -- Array de componentes com detalhes
  jsonb_agg(
    jsonb_build_object(
      'id', md.id,
      'component', md.component,
      'status', md.status,
      'technician_name', p.full_name,
      'technician_avatar', p.avatar_url,
      'time_spent', COALESCE(time_summary.total_hours, 0),
      'blocked_reason', md.blocked_reason
    ) ORDER BY md.component
  ) AS components_detail

FROM orders o
JOIN order_workflow ow ON ow.order_id = o.id
LEFT JOIN motor_dna md ON md.order_id = o.id
LEFT JOIN profiles p ON p.id = md.assigned_technician
LEFT JOIN LATERAL (
  SELECT SUM(duration_minutes / 60.0) AS total_hours
  FROM employee_time_tracking
  WHERE order_id = o.id
    AND component = md.component
) time_summary ON true

GROUP BY o.id, o.order_number, ow.current_stage;

-- Função para marcar componente como concluído
CREATE OR REPLACE FUNCTION complete_component(
  p_component_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE motor_dna
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = p_component_id;
  
  -- Registra no histórico
  INSERT INTO workflow_history (
    order_id,
    from_stage,
    to_stage,
    changed_by,
    notes
  )
  SELECT 
    order_id,
    'in_progress',
    'completed',
    auth.uid(),
    'Componente ' || component || ' concluído'
  FROM motor_dna
  WHERE id = p_component_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Workflow Kanban - View Expandida de Card                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐                                        │
│  │ Em Metrologia    │                                        │
│  │      (3)         │                                        │
│  ├──────────────────┤                                        │
│  │                  │                                        │
│  │ ┌──────────────┐ │                                        │
│  │ │ #1234 [▼]    │ │ ◀─── Click para expandir/colapsar     │
│  │ │🔴 Alta       │ │                                        │
│  │ │              │ │                                        │
│  │ │ABC Motors    │ │                                        │
│  │ │Mercedes OM906│ │                                        │
│  │ │              │ │                                        │
│  │ │👤 João Silva │ │                                        │
│  │ │⚙️ 3/7 (43%)  │ │                                        │
│  │ │              │ │                                        │
│  │ │┌────────────────────────────────────────────┐│         │
│  │ ││ ⚙️ COMPONENTES (3/7 concluídos - 43%)     ││         │
│  │ │├────────────────────────────────────────────┤│         │
│  │ ││                                            ││         │
│  │ ││ ✅ Bloco                                   ││         │
│  │ ││    👤 João Silva    ⏱️ 2.5h    [Ações ▼] ││         │
│  │ ││                                            ││         │
│  │ ││ ✅ Cabeçote                                ││         │
│  │ ││    👤 Marcos Pereira  ⏱️ 3.0h  [Ações ▼] ││         │
│  │ ││                                            ││         │
│  │ ││ ✅ Virabrequim                             ││         │
│  │ ││    👤 João Silva    ⏱️ 1.2h    [Ações ▼] ││         │
│  │ ││                                            ││         │
│  │ ││ ⏳ Biela (Em andamento)                    ││         │
│  │ ││    👤 Carlos Santos  ⏱️ 0.8h   [Ações ▼] ││         │
│  │ ││                                            ││         │
│  │ ││ 🔴 Pistão (Aguardando)                     ││         │
│  │ ││    👤 [Atribuir Técnico ▼]                ││         │
│  │ ││                                            ││         │
│  │ ││ 🚫 Comando (BLOQUEADO)                     ││         │
│  │ ││    Motivo: Aguardando chegada de peças    ││         │
│  │ ││    [Desbloquear]                           ││         │
│  │ ││                                            ││         │
│  │ ││ 🔴 Eixo (Aguardando)                       ││         │
│  │ ││    👤 [Atribuir Técnico ▼]                ││         │
│  │ │└────────────────────────────────────────────┘│         │
│  │ │              │                                        │
│  │ │🟡 2 dias     │                                        │
│  │ │restantes     │                                        │
│  │ └──────────────┘                                        │
│  │                  │                                        │
│  └──────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Expandir/Colapsar Card
```gherkin
Given que estou visualizando o Kanban
When clico no ícone [▼] do card #1234
Then card expande e mostra lista de componentes
And ícone muda para [▲]
When clico novamente no ícone
Then card colapsa para view compacta
```

### E2E Test 2: Atribuir Técnico a Componente
```gherkin
Given que card está expandido
And componente "Pistão" está sem técnico
When clico em "Atribuir Técnico"
And seleciono "Carlos Santos"
Then técnico é atribuído ao componente
And avatar de Carlos aparece no mini-card
And técnico recebe notificação
```

### E2E Test 3: Marcar Componente como Concluído
```gherkin
Given que componente "Biela" está em progresso
When clico em "Ações" do componente
And seleciono "Marcar como Concluído"
Then status muda para "✅ Concluído"
And barra de progresso atualiza (4/7)
And entrada no histórico é criada
```

### E2E Test 4: Bloquear Componente
```gherkin
Given que componente "Comando" está em andamento
When clico em "Ações"
And seleciono "Bloquear"
And informo motivo "Aguardando chegada de peças"
Then status muda para "🚫 BLOQUEADO"
And motivo é exibido
And barra de progresso NÃO conta componente bloqueado
```

---

## 🚫 Negative Scope

**Não inclui:**
- Sub-etapas dentro de componentes (ex: desmontagem, limpeza, retífica)
- Dependências entre componentes
- Previsão de conclusão por componente
- Kanban separado por componente

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-WKF-001 (Visualizar Kanban)
- US-MET-003 (Componentes Recebidos)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
