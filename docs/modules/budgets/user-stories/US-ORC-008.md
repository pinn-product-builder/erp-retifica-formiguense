# US-ORC-008: Alertas de Orçamentos Pendentes

**ID:** US-ORC-008  
**Epic:** Orçamentos  
**Sprint:** 5  
**Prioridade:** Média  
**Estimativa:** 3 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente comercial  
**Quero** receber alertas sobre orçamentos pendentes de aprovação  
**Para** acompanhar proativamente e evitar perda de vendas por esquecimento

---

## 🎯 Business Objective

Criar sistema de alertas proativo para orçamentos que requerem atenção, reduzindo tempo de resposta e melhorando conversão.

---

## 📐 Business Rules

### RN050: Tipos de Alertas
```typescript
type AlertType =
  | 'pending_approval'        // Aguardando aprovação cliente
  | 'expiring_soon'           // Vence em 3 dias
  | 'expired'                 // Validade vencida
  | 'no_response'             // Sem resposta > 7 dias
  | 'partial_pending'         // Parcial aguarda decisão
  | 'needs_revision';         // Cliente pediu revisão

interface BudgetAlert {
  id: string;
  budget_id: string;
  alert_type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  created_at: Date;
  acknowledged: boolean;      // Usuário já viu?
  acknowledged_by?: string;
  acknowledged_at?: Date;
  expires_at?: Date;          // Alert expira quando?
}
```

### RN051: Critérios de Geração
**Alertas automáticos gerados quando:**

1. **Pending Approval (Severidade: Média)**
   - Status: `pending_customer`
   - Condição: Enviado há mais de 2 dias
   - Mensagem: "Orçamento X aguarda resposta há Y dias"

2. **Expiring Soon (Severidade: Alta)**
   - Condição: `valid_until` em 3 dias ou menos
   - Status: `pending_customer` ou `draft`
   - Mensagem: "Orçamento X vence em Y dias"

3. **Expired (Severidade: Crítica)**
   - Condição: `valid_until` < hoje
   - Status: não `approved` ou `rejected`
   - Mensagem: "Orçamento X venceu e precisa renovação"

4. **No Response (Severidade: Alta)**
   - Condição: Enviado há mais de 7 dias sem resposta
   - Status: `pending_customer`
   - Mensagem: "Sem resposta do cliente há Y dias"

5. **Partial Pending (Severidade: Média)**
   - Status: `partially_approved`
   - Condição: Aprovação parcial há mais de 2 dias
   - Mensagem: "Aprovação parcial aguarda ação"

### RN052: Dashboard de Alertas
**Localização:**
- Widget no Dashboard principal
- Badge de notificação no menu Orçamentos
- Centro de notificações global

**Informações exibidas:**
```typescript
interface AlertDashboard {
  critical_count: number;        // Alertas críticos
  high_count: number;            // Alertas altos
  total_pending: number;         // Total pendente
  oldest_alert_days: number;     // Alerta mais antigo
  alerts_by_type: Record<AlertType, number>;
  recent_alerts: BudgetAlert[];  // Últimos 5
}
```

### RN053: Ações Disponíveis
**Usuário pode:**
- ✅ Marcar alerta como "Visto"
- 📞 Ligar para cliente (se integrado)
- 📱 Enviar WhatsApp/Email lembrete
- 🔄 Renovar validade do orçamento
- ✏️ Revisar orçamento
- ❌ Arquivar orçamento

### RN054: Frequência de Verificação
**Job automático:**
```sql
-- Executa diariamente às 8h
-- Verifica todos os orçamentos e gera alertas necessários
-- Remove alertas expirados ou não mais aplicáveis
```

### RN055: Notificações
**Além dos alertas no sistema:**
- **Email diário (resumo):** Para gerentes com alertas críticos
- **Push notification:** Para alertas críticos em tempo real
- **Resumo semanal:** Relatório de orçamentos não concluídos

---

## ✅ Acceptance Criteria

**AC52:** Widget de alertas aparece no dashboard  
**AC53:** Badge numérico mostra quantidade de alertas críticos  
**AC54:** Alertas são categorizados por severidade  
**AC55:** Job automático gera alertas diariamente  
**AC56:** Usuário pode marcar alerta como visto  
**AC57:** Click no alerta abre detalhes do orçamento  
**AC58:** Centro de notificações lista todos os alertas  
**AC59:** Alertas expirados são removidos automaticamente

---

## 🛠️ Definition of Done

- [ ] Tabela `budget_alerts` criada
- [ ] Job automático de geração de alertas implementado
- [ ] Componente `BudgetAlertsWidget.tsx` criado
- [ ] Componente `AlertCenter.tsx` implementado
- [ ] Hook `useBudgetAlerts.ts` criado
- [ ] Lógica de severidade implementada
- [ ] Ações de alerta funcionais
- [ ] Notificações por email configuradas
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/budgets/
  ├── BudgetAlertsWidget.tsx       (NEW)
  └── AlertCenter.tsx              (NEW)

src/components/dashboard/
  └── DashboardOverview.tsx        (UPDATE - adicionar widget)

src/hooks/
  └── useBudgetAlerts.ts           (NEW)

supabase/migrations/
  └── YYYYMMDDHHMMSS_budget_alerts.sql  (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela de alertas de orçamentos
CREATE TABLE budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES detailed_budgets(id) NOT NULL,
  alert_type TEXT NOT NULL CHECK (
    alert_type IN (
      'pending_approval', 'expiring_soon', 'expired',
      'no_response', 'partial_pending', 'needs_revision'
    )
  ),
  severity TEXT NOT NULL CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),
  message TEXT NOT NULL,
  
  -- Controle de visualização
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  
  -- Expiração do alerta
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Índice composto para busca rápida
  UNIQUE(budget_id, alert_type)
);

-- Índices
CREATE INDEX idx_budget_alerts_budget ON budget_alerts(budget_id);
CREATE INDEX idx_budget_alerts_severity ON budget_alerts(severity);
CREATE INDEX idx_budget_alerts_acknowledged ON budget_alerts(acknowledged);

-- RLS
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts of their org budgets"
  ON budget_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM detailed_budgets db
      JOIN orders o ON o.id = db.order_id
      WHERE db.id = budget_alerts.budget_id
      AND o.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can acknowledge alerts"
  ON budget_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM detailed_budgets db
      JOIN orders o ON o.id = db.order_id
      WHERE db.id = budget_alerts.budget_id
      AND o.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Função para gerar alertas automaticamente
CREATE OR REPLACE FUNCTION generate_budget_alerts()
RETURNS void AS $$
DECLARE
  v_budget RECORD;
  v_days_since_sent INTEGER;
  v_days_until_expiry INTEGER;
  v_alert_type TEXT;
  v_severity TEXT;
  v_message TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Limpar alertas antigos/irrelevantes
  DELETE FROM budget_alerts
  WHERE expires_at < NOW()
  OR budget_id IN (
    SELECT id FROM detailed_budgets
    WHERE status IN ('approved', 'rejected')
  );
  
  -- Iterar sobre orçamentos que precisam alerta
  FOR v_budget IN
    SELECT 
      db.id,
      db.budget_number,
      db.status,
      db.valid_until,
      db.created_at,
      db.updated_at,
      o.org_id,
      c.name AS customer_name,
      (SELECT sent_at FROM budget_send_logs 
       WHERE budget_id = db.id 
       ORDER BY sent_at DESC LIMIT 1) AS last_sent
    FROM detailed_budgets db
    JOIN orders o ON o.id = db.order_id
    JOIN customers c ON c.id = o.customer_id
    WHERE db.status NOT IN ('approved', 'rejected')
  LOOP
    -- Calcular dias desde envio
    IF v_budget.last_sent IS NOT NULL THEN
      v_days_since_sent := EXTRACT(DAY FROM NOW() - v_budget.last_sent);
    ELSE
      v_days_since_sent := NULL;
    END IF;
    
    -- Calcular dias até expiração
    v_days_until_expiry := EXTRACT(DAY FROM v_budget.valid_until - CURRENT_DATE);
    
    -- Determinar tipo de alerta
    
    -- ALERTA 1: Orçamento vencido
    IF v_days_until_expiry < 0 AND v_budget.status != 'draft' THEN
      v_alert_type := 'expired';
      v_severity := 'critical';
      v_message := 'Orçamento ' || v_budget.budget_number || 
                   ' venceu há ' || ABS(v_days_until_expiry) || ' dias e precisa renovação';
      v_expires_at := NULL;  -- Não expira até ser resolvido
      
      INSERT INTO budget_alerts (
        budget_id, alert_type, severity, message, expires_at
      ) VALUES (
        v_budget.id, v_alert_type, v_severity, v_message, v_expires_at
      )
      ON CONFLICT (budget_id, alert_type) 
      DO UPDATE SET 
        message = EXCLUDED.message,
        created_at = NOW();
    
    -- ALERTA 2: Vencendo em breve
    ELSIF v_days_until_expiry <= 3 AND v_days_until_expiry >= 0 THEN
      v_alert_type := 'expiring_soon';
      v_severity := 'high';
      v_message := 'Orçamento ' || v_budget.budget_number || 
                   ' vence em ' || v_days_until_expiry || ' dias';
      v_expires_at := v_budget.valid_until;
      
      INSERT INTO budget_alerts (
        budget_id, alert_type, severity, message, expires_at
      ) VALUES (
        v_budget.id, v_alert_type, v_severity, v_message, v_expires_at
      )
      ON CONFLICT (budget_id, alert_type) 
      DO UPDATE SET 
        message = EXCLUDED.message,
        created_at = NOW();
    
    -- ALERTA 3: Sem resposta há muito tempo
    ELSIF v_days_since_sent >= 7 AND v_budget.status = 'pending_customer' THEN
      v_alert_type := 'no_response';
      v_severity := 'high';
      v_message := 'Orçamento ' || v_budget.budget_number || 
                   ' enviado para ' || v_budget.customer_name ||
                   ' há ' || v_days_since_sent || ' dias sem resposta';
      v_expires_at := v_budget.valid_until;
      
      INSERT INTO budget_alerts (
        budget_id, alert_type, severity, message, expires_at
      ) VALUES (
        v_budget.id, v_alert_type, v_severity, v_message, v_expires_at
      )
      ON CONFLICT (budget_id, alert_type) 
      DO UPDATE SET 
        message = EXCLUDED.message,
        created_at = NOW();
    
    -- ALERTA 4: Pendente há 2+ dias
    ELSIF v_days_since_sent >= 2 AND v_budget.status = 'pending_customer' THEN
      v_alert_type := 'pending_approval';
      v_severity := 'medium';
      v_message := 'Orçamento ' || v_budget.budget_number || 
                   ' aguarda resposta há ' || v_days_since_sent || ' dias';
      v_expires_at := v_budget.valid_until;
      
      INSERT INTO budget_alerts (
        budget_id, alert_type, severity, message, expires_at
      ) VALUES (
        v_budget.id, v_alert_type, v_severity, v_message, v_expires_at
      )
      ON CONFLICT (budget_id, alert_type) 
      DO UPDATE SET 
        message = EXCLUDED.message;
    
    -- ALERTA 5: Aprovação parcial pendente
    ELSIF v_budget.status = 'partially_approved' THEN
      v_alert_type := 'partial_pending';
      v_severity := 'medium';
      v_message := 'Orçamento ' || v_budget.budget_number || 
                   ' com aprovação parcial aguarda ação';
      v_expires_at := v_budget.valid_until;
      
      INSERT INTO budget_alerts (
        budget_id, alert_type, severity, message, expires_at
      ) VALUES (
        v_budget.id, v_alert_type, v_severity, v_message, v_expires_at
      )
      ON CONFLICT (budget_id, alert_type) 
      DO UPDATE SET 
        message = EXCLUDED.message;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Alertas de orçamentos atualizados com sucesso';
END;
$$ LANGUAGE plpgsql;

-- Função para marcar alerta como visto
CREATE OR REPLACE FUNCTION acknowledge_budget_alert(
  p_alert_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE budget_alerts
  SET 
    acknowledged = true,
    acknowledged_by = auth.uid(),
    acknowledged_at = NOW()
  WHERE id = p_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para dashboard de alertas
CREATE OR REPLACE VIEW budget_alerts_dashboard AS
SELECT 
  o.org_id,
  COUNT(*) AS total_alerts,
  COUNT(*) FILTER (WHERE ba.severity = 'critical') AS critical_count,
  COUNT(*) FILTER (WHERE ba.severity = 'high') AS high_count,
  COUNT(*) FILTER (WHERE ba.severity = 'medium') AS medium_count,
  COUNT(*) FILTER (WHERE ba.severity = 'low') AS low_count,
  COUNT(*) FILTER (WHERE ba.acknowledged = false) AS unacknowledged_count,
  MAX(EXTRACT(DAY FROM NOW() - ba.created_at)) AS oldest_alert_days
FROM budget_alerts ba
JOIN detailed_budgets db ON db.id = ba.budget_id
JOIN orders o ON o.id = db.order_id
WHERE ba.acknowledged = false
GROUP BY o.org_id;

-- Permissões
GRANT SELECT ON budget_alerts_dashboard TO authenticated;

-- Agendar execução diária (via pg_cron se disponível)
-- SELECT cron.schedule(
--   'generate-budget-alerts',
--   '0 8 * * *',  -- Todo dia às 8h
--   $$ SELECT generate_budget_alerts(); $$
-- );
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Dashboard                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─ ALERTAS DE ORÇAMENTOS ────────────────────────────────┐  │
│  │                                                [🔔 5]   │  │
│  │  ⚠️ ALERTAS CRÍTICOS (2)                                │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │ 🔴 Orçamento ORC-2025-0012-BLOCO venceu há 5 dias │  │  │
│  │  │    Cliente: XYZ Motors | Valor: R$ 2.850         │  │  │
│  │  │    [Renovar Validade] [Abrir Orçamento]          │  │  │
│  │  ├───────────────────────────────────────────────────┤  │  │
│  │  │ 🔴 Orçamento ORC-2025-0008-CABECOTE venceu       │  │  │
│  │  │    Cliente: ABC Ltda | Valor: R$ 1.120           │  │  │
│  │  │    [Renovar Validade] [Abrir Orçamento]          │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  ⚠️ ALERTAS IMPORTANTES (3)                              │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │ 🟠 Sem resposta há 9 dias - ORC-2025-0015        │  │  │
│  │  │    [Enviar Lembrete] [✓ Marcar como Visto]       │  │  │
│  │  ├───────────────────────────────────────────────────┤  │  │
│  │  │ 🟠 Vence em 2 dias - ORC-2025-0018               │  │  │
│  │  │    [Revisar] [✓ Marcar como Visto]               │  │  │
│  │  ├───────────────────────────────────────────────────┤  │  │
│  │  │ 🟠 Aprovação parcial pendente - ORC-2025-0010    │  │  │
│  │  │    [Abrir] [✓ Marcar como Visto]                 │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  [Ver Todos os Alertas (8) →]                           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔔 Centro de Notificações - Orçamentos                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Filtros: [Todos ▼] [Críticos] [Importantes] [Não Vistos]   │
│                                            [✓ Marcar Todos]  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🔴 CRÍTICO | há 5 dias                                  │ │
│  │ Orçamento ORC-2025-0012-BLOCO venceu há 5 dias         │ │
│  │ Cliente: XYZ Motors | Valor: R$ 2.850                   │ │
│  │ Ações: [Renovar] [Revisar] [Arquivar] [✓ Visto]        │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ 🟠 ALTO | há 2 dias                                     │ │
│  │ Sem resposta há 9 dias - ORC-2025-0015-BIELA           │ │
│  │ Cliente: ABC Ltda | Enviado: 18/01/2025                │ │
│  │ Ações: [WhatsApp] [Email] [Ligar] [✓ Visto]            │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ 🟠 ALTO | há 1 dia                                      │ │
│  │ Vence em 2 dias - ORC-2025-0018-VIRABREQUIM            │ │
│  │ Cliente: Motor Service | Valor: R$ 1.450                │ │
│  │ Ações: [Renovar] [Revisar] [Enviar Lembrete] [✓ Visto] │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ 🟡 MÉDIO | há 3 horas                                   │ │
│  │ Aprovação parcial pendente - ORC-2025-0010-PISTAO      │ │
│  │ Cliente: Auto Parts | Itens: 2 de 5 aprovados           │ │
│  │ Ações: [Ver Detalhes] [Criar Novo Orçamento] [✓ Visto] │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ 🟡 MÉDIO | há 2 dias                                    │ │
│  │ Pendente aprovação há 3 dias - ORC-2025-0020            │ │
│  │ Cliente: Diesel Tech | Valor: R$ 890                    │ │
│  │ Ações: [Enviar Lembrete] [✓ Visto]                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Mostrando 5 de 8 alertas  [Carregar mais]                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Gerar Alertas Automaticamente
```gherkin
Given que existem orçamentos com condições de alerta
When job "generate_budget_alerts()" é executado
Then alertas são criados para:
  - Orçamentos vencidos (crítico)
  - Vencendo em 3 dias (alto)
  - Sem resposta há 7+ dias (alto)
  - Pendentes há 2+ dias (médio)
And alertas antigos/irrelevantes são removidos
```

### E2E Test 2: Visualizar Widget no Dashboard
```gherkin
Given que tenho 5 alertas não vistos
When acesso Dashboard
Then widget "Alertas de Orçamentos" aparece
And mostra badge com número "5"
And lista 2 alertas críticos no topo
And lista 3 alertas importantes
And botão "Ver Todos" está disponível
```

### E2E Test 3: Marcar Alerta como Visto
```gherkin
Given que visualizo alerta de orçamento vencido
When clico em "✓ Marcar como Visto"
Then alerta é marcado como "acknowledged"
And badge de notificações diminui -1
And alerta permanece visível mas com indicador "visto"
```

### E2E Test 4: Ação Rápida - Renovar Validade
```gherkin
Given que tenho alerta "Orçamento vencido"
When clico em "Renovar Validade"
Then modal abre com:
  - Nova data de validade pré-preenchida (+30 dias)
  - Opção de notificar cliente
When confirmo renovação
Then valid_until é atualizado
And alerta "expired" é removido
And cliente recebe notificação (se marcado)
```

### E2E Test 5: Centro de Notificações
```gherkin
Given que tenho 8 alertas de vários tipos
When clico no ícone de notificações
Then modal "Centro de Notificações" abre
And alertas são listados por severidade
And filtros permitem segmentar por tipo/severidade
And ações rápidas estão disponíveis para cada alerta
```

### E2E Test 6: Email Diário de Resumo
```gherkin
Given que tenho alertas críticos não resolvidos
When job diário de email executa
Then gerente recebe email com:
  - Assunto: "Alertas Críticos de Orçamentos"
  - Lista de alertas críticos
  - Link direto para cada orçamento
  - Resumo de alertas por severidade
```

### E2E Test 7: Remover Alertas Resolvidos
```gherkin
Given que tenho alerta "Orçamento vencido"
When aprovo o orçamento
Then status muda para "approved"
And job de limpeza remove alerta automaticamente
And alerta não aparece mais no dashboard
```

---

## 🚫 Negative Scope

**Não inclui:**
- Alertas personalizáveis por usuário
- Notificações push mobile
- Integração com Slack/Teams
- Alertas de orçamento em andamento (apenas pendentes)
- Snooze de alertas (adiar)

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-ORC-001 a US-ORC-006 (funcionalidades base)

**Related:**
- US-NOT-001 (Sistema de Notificações Globais)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
