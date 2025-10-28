# US-WKF-006: Atribuir Técnico Responsável

**ID:** US-WKF-006  
**Epic:** Workflow Kanban  
**Sprint:** 2  
**Prioridade:** Alta  
**Estimativa:** 3 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** gerente de produção  
**Quero** atribuir um técnico responsável a cada OS  
**Para** definir claramente quem está trabalhando em cada trabalho

---

## 🎯 Business Objective

Melhorar accountability e distribuição de carga de trabalho, facilitando gestão de equipe e rastreabilidade.

---

## 📐 Business Rules

### RN001: Onde Atribuir
**Pontos de atribuição:**
- Dropdown no próprio card do Kanban
- Modal de detalhes do card
- Página OrderDetails (seção header)
- Automaticamente ao mover para certos stages

### RN002: Lista de Técnicos
- Apenas usuários com role `tecnico` aparecem
- Ordenados alfabeticamente
- Avatar e nome completo exibidos
- Opção "Sem atribuição" disponível

### RN003: Regras de Atribuição
- Gerente pode atribuir qualquer técnico
- Técnico pode auto-atribuir
- Admin pode atribuir qualquer técnico
- Consultor não pode atribuir técnicos

### RN004: Atribuição Automática
**Gatilhos de auto-atribuição:**
- Ao mover para "Em Metrologia" → sugere técnico metrológico
- Ao mover para "Em Diagnóstico" → mantém técnico atual ou sugere
- Ao mover para "Em Produção" → técnico que fez diagnóstico (padrão)

### RN005: Notificações
- Técnico recebe notificação ao ser atribuído
- E-mail opcional (configurável)
- Badge de "nova atribuição" no card

---

## ✅ Acceptance Criteria

**AC1:** Dropdown de técnicos aparece no card do Kanban  
**AC2:** Apenas técnicos ativos são listados  
**AC3:** Atribuição salva imediatamente ao selecionar  
**AC4:** Avatar do técnico aparece no card  
**AC5:** Gerente e Admin podem atribuir qualquer técnico  
**AC6:** Técnico recebe notificação de atribuição

---

## 🛠️ Definition of Done

- [x] Dropdown de técnicos no OrderCard
- [x] Hook `useTechnicians.ts` criado
- [x] Update de `assigned_to` em `order_workflow`
- [x] Notificação implementada
- [x] Permissões validadas
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/workflow/
  ├── OrderCard.tsx            (UPDATE - dropdown técnicos)
  └── TechnicianSelector.tsx   (NEW)

src/hooks/
  ├── useTechnicians.ts        (NEW)
  └── useOrderWorkflow.ts      (UPDATE - assignTechnician)
```

---

## 🗄️ Database Changes

```sql
-- Tabela order_workflow já possui campo assigned_to
-- Apenas adicionar função helper

-- Função para buscar técnicos disponíveis
CREATE OR REPLACE FUNCTION get_available_technicians(p_org_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  current_workload INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    COUNT(ow.id)::INTEGER AS current_workload
  FROM profiles p
  LEFT JOIN order_workflow ow ON ow.assigned_to = p.id
    AND ow.current_stage IN ('em_metrologia', 'em_diagnostico', 'em_producao')
  WHERE p.org_id = p_org_id
    AND p.role = 'tecnico'
    AND p.status = 'active'
  GROUP BY p.id, p.full_name, p.email, p.avatar_url
  ORDER BY current_workload ASC, p.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar técnico ao ser atribuído
CREATE OR REPLACE FUNCTION notify_technician_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.assigned_to,
      'assignment',
      'Nova OS atribuída',
      'Você foi atribuído à OS #' || (SELECT order_number FROM orders WHERE id = NEW.order_id),
      jsonb_build_object('order_id', NEW.order_id, 'stage', NEW.current_stage)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_assignment
  AFTER UPDATE ON order_workflow
  FOR EACH ROW
  EXECUTE FUNCTION notify_technician_assignment();
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Kanban Board                                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────┐       ┌───────────┐       ┌───────────┐     │
│  │ Em Metro  │       │ Em Diag.  │       │ Em Prod.  │     │
│  │    (3)    │       │    (2)    │       │    (4)    │     │
│  ├───────────┤       ├───────────┤       ├───────────┤     │
│  │           │       │           │       │           │     │
│  │┌─────────┐│       │┌─────────┐│       │┌─────────┐│     │
│  ││ #1234   ││       ││ #1230   ││       ││ #1225   ││     │
│  ││🔴 Alta  ││       ││🟡 Méd.  ││       ││🔴 Alta  ││     │
│  ││         ││       ││         ││       ││         ││     │
│  ││ABC Mot. ││       ││XYZ Ltd. ││       ││Turbo SA ││     │
│  ││OM 906   ││       ││Scania   ││       ││Cummins  ││     │
│  ││         ││       ││         ││       ││         ││     │
│  ││ Técnico:││       ││ Técnico:││       ││ Técnico:││     │
│  ││[▼ Sele..│◀───────││👤 Marcos││       ││👤 João  ││     │
│  ││  cionar]││   │   ││         ││       ││         ││     │
│  ││         ││   │   ││⚙️ 3/5   ││       ││⚙️ 7/7   ││     │
│  ││⚙️ 2/7   ││   │   │└─────────┘│       │└─────────┘│     │
│  │└─────────┘│   │   │           │       │           │     │
│  │           │   │   │           │       │           │     │
│  └───────────┘   │   └───────────┘       └───────────┘     │
│                  │                                           │
│                  └────────────────────────────────────────   │
│                       ┌───────────────────────────────────┐ │
│                       │ Selecionar Técnico:              │ │
│                       ├───────────────────────────────────┤ │
│                       │ ( ) Sem atribuição               │ │
│                       │ (•) 👤 João Silva      (12 OSs)  │ │
│                       │ ( ) 👤 Marcos Pereira  (8 OSs)   │ │
│                       │ ( ) 👤 Carlos Santos   (15 OSs)  │ │
│                       │                                   │ │
│                       │         [Confirmar]  [Cancelar]  │ │
│                       └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Atribuir Técnico via Dropdown
```gherkin
Given que sou gerente
And estou visualizando o Kanban
When clico no dropdown "Técnico" de um card
And seleciono "João Silva"
Then técnico é atribuído imediatamente
And avatar de João aparece no card
And João recebe notificação
```

### E2E Test 2: Auto-atribuição de Técnico
```gherkin
Given que sou técnico "Marcos"
And vejo uma OS sem atribuição
When clico no dropdown de técnicos
And seleciono meu próprio nome
Then consigo me auto-atribuir
And avatar aparece no card
```

### E2E Test 3: Ordenação por Carga de Trabalho
```gherkin
Given que abro o dropdown de técnicos
When visualizo a lista
Then técnicos estão ordenados por menor carga de trabalho
And quantidade de OSs ativas é exibida ao lado do nome
```

### E2E Test 4: Permissão Negada para Consultor
```gherkin
Given que sou consultor
When visualizo o Kanban
Then dropdown de técnicos está desabilitado
And não consigo atribuir técnicos
```

---

## 🚫 Negative Scope

**Não inclui:**
- Atribuição de múltiplos técnicos por OS
- Atribuição automática baseada em skills
- Balanceamento automático de carga
- Histórico de reatribuições

---

## 🔗 Dependencies

**Blocks:**
- US-WKF-007 (Registrar Tempo)

**Blocked by:**
- US-WKF-001 (Visualizar Kanban)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
