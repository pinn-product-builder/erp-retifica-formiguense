# US-WKF-008: Indicadores de SLA e Atrasos

**ID:** US-WKF-008  
**Epic:** Workflow Kanban  
**Sprint:** 3  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente de produção  
**Quero** visualizar indicadores de SLA no Kanban  
**Para** identificar OSs em risco e tomar ações preventivas

---

## 🎯 Business Objective

Prevenir atrasos através de alertas visuais, melhorando cumprimento de prazos e satisfação do cliente.

---

## 📐 Business Rules

### RN001: Cálculo de SLA
**Fórmula:**
```typescript
const sla = {
  deadline: order.deadline,
  daysRemaining: Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)),
  daysElapsed: Math.ceil((now - order.created_at) / (1000 * 60 * 60 * 24)),
  isOverdue: now > deadline,
  daysOverdue: isOverdue ? Math.ceil((now - deadline) / (1000 * 60 * 60 * 24)) : 0,
  
  // Status baseado em % do prazo
  status: (() => {
    if (isOverdue) return 'critical';
    const progress = daysElapsed / (daysElapsed + daysRemaining);
    if (progress > 0.9) return 'warning';
    if (progress > 0.7) return 'attention';
    return 'ok';
  })()
};
```

### RN002: Indicadores Visuais
**Badges no Card:**
- 🟢 **OK:** >30% do prazo restante (verde)
- 🟡 **Atenção:** 10-30% do prazo restante (amarelo)
- 🟠 **Urgente:** <10% do prazo restante (laranja)
- 🔴 **Atrasado:** Prazo vencido (vermelho piscante)

**Formato do Badge:**
```
🟢 5 dias restantes
🟡 2 dias restantes
🟠 8 horas restantes
🔴 3 dias de atraso
```

### RN003: Filtro por SLA
- Apenas no prazo
- Apenas em risco (atenção + urgente)
- Apenas atrasadas
- Todas

### RN004: Alertas Automáticos
**Notificações enviadas:**
- 5 dias antes do prazo → Gerente
- 2 dias antes do prazo → Gerente + Técnico
- No dia do prazo → Gerente + Técnico + Consultor
- 1 dia de atraso → Gerente + Admin (escalação)

### RN005: Dashboard de SLA
**Métricas no topo do Kanban:**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Indicadores de SLA                                   │
├─────────────────────────────────────────────────────────┤
│ ✅ No Prazo: 32 (68%)                                   │
│ ⚠️ Em Risco: 12 (26%)                                   │
│ 🚨 Atrasadas: 3 (6%)                                    │
│                                                          │
│ Taxa de Cumprimento (mês): 87.5%                        │
│ Tempo Médio de Entrega: 12.3 dias                       │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Acceptance Criteria

**AC1:** Badge de SLA aparece em todos os cards  
**AC2:** Cores mudam dinamicamente conforme prazo se aproxima  
**AC3:** Badge pisca em OSs atrasadas  
**AC4:** Dashboard de métricas exibe totais corretos  
**AC5:** Filtro por status de SLA funciona  
**AC6:** Alertas são enviados automaticamente

---

## 🛠️ Definition of Done

- [ ] Função `calculateSLA()` implementada
- [ ] Componente `SLABadge.tsx` criado
- [ ] Dashboard de métricas no topo do Kanban
- [ ] Filtro por status de SLA
- [ ] Edge Function de alertas automáticos
- [ ] Cron job configurado no Supabase
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/workflow/
  ├── KanbanBoard.tsx          (UPDATE - dashboard SLA)
  ├── OrderCard.tsx            (UPDATE - badge SLA)
  └── SLABadge.tsx             (NEW)

src/hooks/
  └── useSLATracking.ts        (NEW)

supabase/functions/
  └── sla-alerts/              (NEW - Edge Function)
```

---

## 🗄️ Database Changes

```sql
-- View para cálculo de SLA
CREATE OR REPLACE VIEW v_order_sla_status AS
SELECT 
  o.id,
  o.order_number,
  o.deadline,
  o.created_at,
  ow.current_stage,
  
  -- Cálculos de tempo
  EXTRACT(DAY FROM (o.deadline - NOW())) AS days_remaining,
  EXTRACT(DAY FROM (NOW() - o.created_at)) AS days_elapsed,
  
  -- Status
  CASE 
    WHEN NOW() > o.deadline THEN 'overdue'
    WHEN (NOW() + INTERVAL '2 days') > o.deadline THEN 'urgent'
    WHEN (NOW() + INTERVAL '5 days') > o.deadline THEN 'warning'
    ELSE 'ok'
  END AS sla_status,
  
  -- Dias de atraso
  CASE 
    WHEN NOW() > o.deadline 
    THEN EXTRACT(DAY FROM (NOW() - o.deadline))
    ELSE 0
  END AS days_overdue,
  
  -- Progresso %
  ROUND(
    (EXTRACT(DAY FROM (NOW() - o.created_at))::NUMERIC / 
     EXTRACT(DAY FROM (o.deadline - o.created_at))::NUMERIC) * 100
  ) AS progress_percentage

FROM orders o
JOIN order_workflow ow ON ow.order_id = o.id
WHERE ow.current_stage != 'entregue';

-- Função para enviar alertas
CREATE OR REPLACE FUNCTION send_sla_alerts()
RETURNS void AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Alertas de 5 dias antes
  FOR v_order IN 
    SELECT * FROM v_order_sla_status 
    WHERE sla_status = 'warning'
      AND days_remaining = 5
  LOOP
    -- Insere notificação
    INSERT INTO notifications (user_id, type, title, message, metadata)
    SELECT 
      p.id,
      'sla_warning',
      'OS próxima do prazo',
      'OS #' || v_order.order_number || ' vence em 5 dias',
      jsonb_build_object('order_id', v_order.id, 'days_remaining', 5)
    FROM profiles p
    WHERE p.role IN ('gerente', 'admin');
  END LOOP;
  
  -- Alertas de atrasadas
  FOR v_order IN 
    SELECT * FROM v_order_sla_status 
    WHERE sla_status = 'overdue'
      AND days_overdue = 1
  LOOP
    INSERT INTO notifications (user_id, type, title, message, metadata)
    SELECT 
      p.id,
      'sla_overdue',
      '🚨 OS ATRASADA',
      'OS #' || v_order.order_number || ' está atrasada há 1 dia',
      jsonb_build_object('order_id', v_order.id, 'days_overdue', 1)
    FROM profiles p
    WHERE p.role IN ('gerente', 'admin');
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron job (executar diariamente às 8h)
-- Configurar via Supabase Dashboard ou pg_cron
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Workflow Kanban                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📊 Indicadores de SLA          [Filtrar por SLA ▼]   │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ ✅ No Prazo: 32 (68%)    ⚠️ Em Risco: 12 (26%)       │  │
│  │ 🚨 Atrasadas: 3 (6%)                                  │  │
│  │                                                        │  │
│  │ Taxa de Cumprimento: 87.5% | Tempo Médio: 12.3 dias  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────┬───────────┬───────────┬───────────┬─────────┐│
│  │ Nova OS   │ Ag.Col.   │Em Trans.  │Check-in   │Ag.Metro ││
│  │   (3)     │   (5)     │   (2)     │   (4)     │   (1)   ││
│  ├───────────┼───────────┼───────────┼───────────┼─────────┤│
│  │┌─────────┐│┌─────────┐│┌─────────┐│┌─────────┐│┌───────┐││
│  ││ #1234   │││ #1230   │││ #1228   │││ #1225   │││ #1220 │││
│  ││🔴 Alta  │││🟡 Méd.  │││🟢 Bx.   │││🔴 Alta  │││🟡 Méd.│││
│  ││         │││         │││         │││         │││       │││
│  ││ABC Mot. │││XYZ Ltd. │││Fast Co. │││Turbo SA │││Power  │││
│  ││OM 906   │││Scania   │││MWM      │││Cummins  │││Volvo  │││
│  ││         │││         │││         │││         │││       │││
│  ││👤 João  │││👤 Marcos│││👤 João  │││👤 Carlos│││👤 Marc│││
│  ││⚙️ 3/7   │││⚙️ 0/5   │││⚙️ 1/6   │││⚙️ 4/7   │││⚙️ 2/4 │││
│  ││         │││         │││         │││         │││       │││
│  ││🟢 5 dias│││🟡 2 dias│││🟢 8 dias│││🔴💥ATRASO│││🟠 1 dia│││
│  ││restantes│││restantes│││restantes│││3 DIAS   │││restant│││
│  │└─────────┘│└─────────┘│└─────────┘│└─────────┘│└───────┘││
│  │           │           │           │           │         ││
│  └───────────┴───────────┴───────────┴───────────┴─────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Badge de SLA Correto
```gherkin
Given que tenho uma OS com prazo em 3 dias
When visualizo o Kanban
Then card mostra badge 🟡 "2 dias restantes"
And badge está na cor amarela
```

### E2E Test 2: Badge de Atraso Piscante
```gherkin
Given que tenho uma OS atrasada há 5 dias
When visualizo o Kanban
Then card mostra badge 🔴 "5 dias de atraso"
And badge pisca em vermelho
```

### E2E Test 3: Dashboard de Métricas
```gherkin
Given que tenho 50 OSs ativas
And 35 estão no prazo
And 10 estão em risco
And 5 estão atrasadas
When visualizo o topo do Kanban
Then dashboard mostra:
  | Métrica          | Valor |
  | No Prazo         | 35    |
  | Em Risco         | 10    |
  | Atrasadas        | 5     |
  | Taxa Cumprimento | 70%   |
```

### E2E Test 4: Alerta Automático
```gherkin
Given que tenho uma OS que vence em 2 dias
When cron job executa às 8h
Then notificação é enviada ao gerente
And notificação é enviada ao técnico atribuído
And tipo da notificação é "sla_warning"
```

---

## 🚫 Negative Scope

**Não inclui:**
- SLA customizável por cliente
- Prorrogação automática de prazos
- Escalonamento multi-nível complexo
- Integração com calendário externo (Google Calendar)

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-WKF-001 (Visualizar Kanban)
- US-WKF-007 (Registrar Tempo)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
