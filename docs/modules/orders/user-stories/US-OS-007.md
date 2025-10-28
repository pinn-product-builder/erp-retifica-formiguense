# US-OS-007: Gestão de Garantias da OS

**ID:** US-OS-007  
**Epic:** Gestão de Ordens de Serviço  
**Sprint:** 4  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** To Do  

---

## 📋 User Story

**Como** gerente ou consultor  
**Quero** visualizar e gerenciar as informações de garantia de uma OS  
**Para** controlar prazos e componentes cobertos

---

## 🎯 Business Objective

Automatizar o controle de garantias, reduzindo disputas com clientes e melhorando a gestão de reclamações pós-entrega.

---

## 📐 Business Rules

### RN001: Ativação Automática
- Garantia é ativada automaticamente quando OS entra em status `entregue`
- Data de início = data da entrega
- Data de término = data início + warranty_months

### RN002: Dados da Garantia
```typescript
interface OrderWarranty {
  id: string;
  order_id: string;
  warranty_months: number;
  start_date: string;
  end_date: string;
  covered_components: string[]; // ['bloco', 'cabecote', ...]
  warranty_terms: string;
  is_active: boolean;
  created_at: timestamp;
}
```

### RN003: Componentes Cobertos
- Por padrão: todos os componentes que passaram por remanufatura
- Podem ser editados manualmente antes da entrega
- Cada componente tem checkbox visual

### RN004: Condições da Garantia
- Texto padrão carregado de configurações da empresa
- Editável por gerentes
- Exibido no PDF da OS

### RN005: Alertas Automáticos
- 30 dias antes do vencimento: alerta no dashboard
- No vencimento: status muda para `is_active = false`
- Cliente recebe notificação 7 dias antes do fim

### RN006: Reclamações de Garantia
- Tabela `warranty_claims` para registrar acionamentos
- Workflow de aprovação interno
- Histórico vinculado à OS original

---

## ✅ Acceptance Criteria

**AC1:** Tab "Garantia" exibe dados da garantia se OS estiver entregue  
**AC2:** Badge colorido indica status (Ativa / Expirada / Não iniciada)  
**AC3:** Datas de início e fim calculadas automaticamente  
**AC4:** Componentes cobertos listados com checkboxes  
**AC5:** Condições da garantia exibidas  
**AC6:** Tabela de reclamações (se houver) visível  
**AC7:** Botão "Registrar Reclamação" visível se garantia ativa

---

## 🛠️ Definition of Done

- [ ] Componente `OrderWarrantyTab.tsx` criado
- [ ] Hook `useOrderWarranty.ts` implementado
- [ ] Trigger SQL para ativação automática
- [ ] Query para calcular dias restantes
- [ ] Componente `WarrantyClaim.tsx` criado
- [ ] RLS policies verificadas
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/orders/
  ├── OrderWarrantyTab.tsx        (NEW)
  └── WarrantyClaimModal.tsx      (NEW)

src/hooks/
  └── useOrderWarranty.ts         (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela de garantias
CREATE TABLE public.order_warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  warranty_months INTEGER NOT NULL DEFAULT 12,
  start_date DATE,
  end_date DATE,
  covered_components TEXT[] NOT NULL,
  warranty_terms TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  org_id UUID NOT NULL
);

-- Tabela de reclamações
CREATE TABLE public.warranty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id UUID NOT NULL REFERENCES public.order_warranties(id),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  claim_type TEXT NOT NULL CHECK (claim_type IN (
    'defeito_fabricacao', 'falha_prematura', 'vazamento', 'ruido', 'outro'
  )),
  affected_component TEXT,
  claim_description TEXT NOT NULL,
  registered_by UUID NOT NULL REFERENCES auth.users(id),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolution_status TEXT DEFAULT 'pendente' CHECK (resolution_status IN (
    'pendente', 'em_analise', 'aprovado', 'negado', 'resolvido'
  )),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  org_id UUID NOT NULL
);

-- Trigger: Ativar garantia quando OS for entregue
CREATE OR REPLACE FUNCTION activate_order_warranty()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'entregue' AND OLD.status != 'entregue' THEN
    UPDATE public.order_warranties
    SET 
      is_active = true,
      start_date = CURRENT_DATE,
      end_date = CURRENT_DATE + (warranty_months || ' months')::INTERVAL
    WHERE order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activate_warranty
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION activate_order_warranty();

-- View: Garantias próximas do vencimento
CREATE VIEW v_warranties_expiring_soon AS
SELECT 
  ow.*,
  o.order_number,
  c.name AS customer_name,
  (ow.end_date - CURRENT_DATE) AS days_remaining
FROM public.order_warranties ow
JOIN public.orders o ON ow.order_id = o.id
JOIN public.customers c ON o.customer_id = c.id
WHERE 
  ow.is_active = true AND
  ow.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';

-- RLS
ALTER TABLE public.order_warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org warranties"
ON public.order_warranties FOR SELECT
USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Users can view org claims"
ON public.warranty_claims FOR SELECT
USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Users can insert org claims"
ON public.warranty_claims FOR INSERT
WITH CHECK (
  org_id = (auth.jwt() ->> 'org_id')::uuid AND
  registered_by = auth.uid()
);
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Garantia                              [✓ Ativa - 327 dias]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📅 Período de Cobertura                                          │
│  ├─ Data de Início:      15/01/2025                              │
│  ├─ Data de Término:     15/01/2026                              │
│  └─ Tempo de Garantia:   12 meses                                │
│                                                                   │
│  🛠️ Componentes Cobertos                                         │
│  [✓] Bloco do Motor                                              │
│  [✓] Cabeçote                                                    │
│  [✓] Virabrequim                                                 │
│  [✓] Pistões                                                     │
│  [✓] Bielas                                                      │
│  [✓] Comando de Válvulas                                         │
│  [ ] Eixo Balanceador (não remanufaturado)                       │
│                                                                   │
│  📋 Condições da Garantia                                         │
│  A garantia cobre defeitos de fabricação e falhas prematuras dos │
│  componentes remanufaturados. Não cobre danos causados por:      │
│  • Mau uso ou negligência                                        │
│  • Acidentes ou impactos                                         │
│  • Uso de peças não originais                                    │
│  • Manutenções realizadas fora da rede autorizada                │
│                                                                   │
│  🎫 Reclamações de Garantia (1)                                   │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ #CLAIM-001 - Vazamento de óleo no bloco                │      │
│  │ Registrado em: 10/03/2025                               │      │
│  │ Status: [🔍 Em Análise]                                 │      │
│  │ [Ver Detalhes]                                          │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
│                               [➕ Registrar Nova Reclamação]      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

Estado: Garantia Não Iniciada
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                      ⏳                                           │
│            Garantia ainda não foi ativada                         │
│       A garantia será ativada automaticamente após a entrega     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Ativação Automática
```gherkin
Given que uma OS está em status "finalizada"
When um gerente altera status para "entregue"
Then registro em order_warranties é criado automaticamente
And start_date = data atual
And end_date = data atual + 12 meses
And is_active = true
```

### E2E Test 2: Visualização na Tab
```gherkin
Given que estou visualizando uma OS entregue
When clico na tab "Garantia"
Then vejo badge "Ativa - X dias"
And datas de início/fim são exibidas
And componentes cobertos listados
And condições da garantia visíveis
```

### E2E Test 3: Registrar Reclamação
```gherkin
Given que estou na tab "Garantia" de OS com garantia ativa
When clico em "Registrar Nova Reclamação"
And preencho tipo "Vazamento"
And componente "Bloco"
And descrição "Vazamento de óleo na junta"
And clico em "Registrar"
Then reclamação aparece na lista
And status inicial é "Pendente"
```

---

## 🚫 Negative Scope

**Não inclui:**
- Workflow de aprovação de reclamações (US futura)
- Notificações automáticas ao cliente
- Integração com sistema de garantia estendida
- Custo de garantia / reserva financeira

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-OS-001 (Criar OS)
- US-OS-004 (Visualizar detalhes)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
