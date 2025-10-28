# US-WKF-007: Registrar Tempo de Trabalho

**ID:** US-WKF-007  
**Epic:** Workflow Kanban  
**Sprint:** 3  
**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** técnico  
**Quero** registrar tempo gasto em cada OS  
**Para** rastrear horas trabalhadas e calcular custos de mão de obra

---

## 🎯 Business Objective

Fornecer dados para precificação de serviços, análise de produtividade e gestão de custos operacionais.

---

## 📐 Business Rules

### RN001: Registro de Tempo
**Campos Obrigatórios:**
- OS relacionada
- Técnico (auto-preenchido)
- Data/hora início
- Data/hora fim
- Atividade realizada (dropdown)
- Componente trabalhado (dropdown)

**Campos Opcionais:**
- Observações
- Interrupções (tempo pausado)

### RN002: Tipos de Atividade
- Desmontagem
- Limpeza
- Metrologia
- Diagnóstico
- Retífica
- Montagem
- Testes
- Outros

### RN003: Formas de Registro
**Opção 1: Manual**
- Informar início e fim manualmente
- Útil para registros retroativos

**Opção 2: Timer**
- Botão "Iniciar Timer" no card
- Timer corre em background
- Botão "Pausar" / "Retomar"
- Botão "Finalizar" abre modal com observações

### RN004: Cálculos Automáticos
```typescript
// Duração total
const duration = endTime - startTime - totalPauses;

// Custo de mão de obra
const laborCost = (duration / 3600) * technician.hourly_rate;

// Tempo total por OS
const totalTimeOnOrder = sum(all_time_entries.duration);
```

### RN005: Validações
- Início não pode ser no futuro
- Fim deve ser após início
- Máximo 12h por entrada (prevenir erros)
- Não pode ter entradas sobrepostas do mesmo técnico

---

## ✅ Acceptance Criteria

**AC1:** Botão "Registrar Tempo" aparece no card  
**AC2:** Modal abre com formulário de registro  
**AC3:** Timer funciona corretamente (iniciar/pausar/finalizar)  
**AC4:** Validações impedem entradas inválidas  
**AC5:** Tempo total aparece no resumo da OS  
**AC6:** Histórico de tempos é exibido em OrderDetails

---

## 🛠️ Definition of Done

- [ ] Componente `TimeRegistrationModal.tsx` criado
- [ ] Hook `useTimeTracking.ts` implementado
- [ ] Timer em background com Web Workers
- [ ] Validações com Zod schema
- [ ] Integração com `employee_time_tracking`
- [ ] Exibição de histórico em OrderDetails
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/workflow/
  ├── OrderCard.tsx                (UPDATE - botão timer)
  └── TimeRegistrationModal.tsx    (NEW)

src/components/orders/
  └── OrderTimeHistory.tsx         (NEW)

src/hooks/
  └── useTimeTracking.ts           (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela employee_time_tracking (já existe)
CREATE TABLE employee_time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES profiles(id) NOT NULL,
  order_id UUID REFERENCES orders(id) NOT NULL,
  component TEXT CHECK (component IN (
    'bloco', 'cabecote', 'virabrequim', 'biela', 
    'pistao', 'comando', 'eixo', 'geral'
  )),
  activity_type TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  pauses JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  hourly_rate NUMERIC(10,2),
  labor_cost NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_times CHECK (end_time IS NULL OR end_time > start_time),
  CONSTRAINT max_duration CHECK (duration_minutes <= 720) -- máx 12h
);

-- Índices
CREATE INDEX idx_time_tracking_order ON employee_time_tracking(order_id);
CREATE INDEX idx_time_tracking_employee ON employee_time_tracking(employee_id);
CREATE INDEX idx_time_tracking_dates ON employee_time_tracking(start_time, end_time);

-- Trigger para calcular duração e custo
CREATE OR REPLACE FUNCTION calculate_time_entry_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_hourly_rate NUMERIC(10,2);
  v_pause_minutes INTEGER := 0;
BEGIN
  -- Busca taxa horária do técnico
  SELECT hourly_rate INTO v_hourly_rate
  FROM employees
  WHERE user_id = NEW.employee_id;
  
  -- Calcula tempo de pausas
  IF NEW.pauses IS NOT NULL THEN
    SELECT SUM((pause->>'duration_minutes')::INTEGER) INTO v_pause_minutes
    FROM jsonb_array_elements(NEW.pauses) AS pause;
  END IF;
  
  -- Calcula duração líquida
  IF NEW.end_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60 - COALESCE(v_pause_minutes, 0);
    NEW.hourly_rate := v_hourly_rate;
    NEW.labor_cost := (NEW.duration_minutes / 60.0) * v_hourly_rate;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_time_cost
  BEFORE INSERT OR UPDATE ON employee_time_tracking
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_entry_cost();

-- Função para validar sobreposição de entradas
CREATE OR REPLACE FUNCTION check_time_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM employee_time_tracking
    WHERE employee_id = NEW.employee_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (NEW.start_time BETWEEN start_time AND end_time)
        OR (NEW.end_time BETWEEN start_time AND end_time)
        OR (start_time BETWEEN NEW.start_time AND NEW.end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Técnico já possui registro de tempo neste período';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_overlap
  BEFORE INSERT OR UPDATE ON employee_time_tracking
  FOR EACH ROW
  EXECUTE FUNCTION check_time_overlap();

-- RLS Policies
ALTER TABLE employee_time_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view time entries of their org"
  ON employee_time_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.org_id = (SELECT org_id FROM profiles WHERE id = employee_time_tracking.employee_id)
    )
  );

CREATE POLICY "Technicians can create their own time entries"
  ON employee_time_tracking FOR INSERT
  WITH CHECK (
    employee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('gerente', 'admin')
    )
  );

CREATE POLICY "Technicians can update their own time entries"
  ON employee_time_tracking FOR UPDATE
  USING (
    employee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('gerente', 'admin')
    )
  );
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Registrar Tempo - OS #1234                            [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Técnico: 👤 João Silva (auto-preenchido)                   │
│                                                               │
│  Componente: *                                                │
│  [▼ Selecione                              ]                 │
│  Opções: Bloco | Cabeçote | Virabrequim | Biela | ...       │
│                                                               │
│  Atividade: *                                                 │
│  [▼ Selecione                              ]                 │
│  Opções: Desmontagem | Limpeza | Metrologia | ...           │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ MODO DE REGISTRO:                                       ││
│  │                                                          ││
│  │ ( ) Manual                                               ││
│  │     Início: [📅 27/01/2025] [⏰ 08:00]                  ││
│  │     Fim:    [📅 27/01/2025] [⏰ 12:30]                  ││
│  │     Duração: 4h 30min (calculado automaticamente)       ││
│  │                                                          ││
│  │ (•) Timer                                                ││
│  │     ⏱️ 02:15:34 (em execução)                           ││
│  │     Iniciado às 10:00                                    ││
│  │                                                          ││
│  │     [⏸️ Pausar]  [⏹️ Finalizar e Salvar]                ││
│  │                                                          ││
│  │     Pausas:                                              ││
│  │     • 10:45 - 11:00 (15min) - Café                      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Observações:                                                 │
│  [TextArea: Realizada desmontagem completa do bloco...     ] │
│  [                                                          ] │
│                                                               │
│                                                               │
│                      [Cancelar]  [Salvar Registro]           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Registro Manual de Tempo
```gherkin
Given que cliquei em "Registrar Tempo" no card
When seleciono componente "Bloco"
And seleciono atividade "Metrologia"
And informo início "08:00" e fim "12:00"
And clico em "Salvar Registro"
Then entrada de tempo é criada
And duração calculada é 4h 00min
And custo é calculado automaticamente
```

### E2E Test 2: Timer em Execução
```gherkin
Given que iniciei um timer às 10:00
When timer roda por 2 horas
And clico em "Finalizar e Salvar"
Then entrada é criada com duração de 2h
And hora de início = 10:00
And hora de fim = 12:00 (momento atual)
```

### E2E Test 3: Pausar Timer
```gherkin
Given que timer está em execução
When clico em "Pausar" às 10:45
And clico em "Retomar" às 11:00
And finalizo timer às 12:00
Then duração é 2h 00min (não conta pausa de 15min)
And pausa é registrada no histórico
```

### E2E Test 4: Validação de Sobreposição
```gherkin
Given que tenho entrada de 08:00 às 12:00 de hoje
When tento criar nova entrada de 10:00 às 14:00
Then erro de validação aparece
And mensagem: "Técnico já possui registro neste período"
```

---

## 🚫 Negative Scope

**Não inclui:**
- Sincronização com relógio de ponto físico
- Aprovação de horas por gerente
- Exportação de horas para folha de pagamento
- Timer mobile nativo (apenas web)

---

## 🔗 Dependencies

**Blocks:**
- US-WKF-008 (Indicadores de SLA)

**Blocked by:**
- US-WKF-006 (Atribuir Técnico)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
