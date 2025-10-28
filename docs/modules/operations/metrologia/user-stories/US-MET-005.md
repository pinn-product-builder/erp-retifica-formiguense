# US-MET-005: Etapa 4 - Medições Dimensionais

**ID:** US-MET-005  
**Epic:** Metrologia  
**Sprint:** 2  
**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** técnico metrológico  
**Quero** registrar medições dimensionais precisas de cada componente  
**Para** determinar se componentes estão dentro das tolerâncias especificadas

---

## 🎯 Business Objective

Coletar medições técnicas que determinarão se componentes podem ser reaproveitados, necessitam retífica ou devem ser substituídos.

---

## 📐 Business Rules

### RN001: Tipos de Medições por Componente

**Bloco:**
- Diâmetro das camisas (mm) - múltiplas posições
- Planicidade do bloco (mm)
- Altura do bloco (mm)
- Diâmetro dos mancais (mm)

**Cabeçote:**
- Planicidade da face (mm)
- Altura do cabeçote (mm)
- Diâmetro das guias de válvula (mm)
- Profundidade das válvulas (mm)

**Virabrequim:**
- Diâmetro dos munhões (mm)
- Diâmetro das bielas (mm)
- Ovalização (mm)
- Conicidade (mm)

**Biela:**
- Comprimento entre centros (mm)
- Diâmetro do pé da biela (mm)
- Diâmetro da cabeça da biela (mm)
- Paralelismo (mm)

**Pistão:**
- Diâmetro externo (mm)
- Folga no cilindro (mm)
- Altura do pistão (mm)

### RN002: Tolerâncias
- Cada medição tem valor nominal e tolerância (±X mm)
- Sistema indica se medição está:
  - ✅ **Dentro da tolerância** (verde)
  - ⚠️ **No limite** (amarelo)
  - ❌ **Fora da tolerância** (vermelho)

### RN003: Unidades de Medida
- Todas as medições em milímetros (mm)
- Precisão: até 3 casas decimais (0,001mm)
- Conversão automática de polegadas se necessário

### RN004: Campos Obrigatórios
- Pelo menos 3 medições por componente crítico
- Instrumento utilizado (paquímetro, micrômetro, relógio comparador)
- Técnico responsável pela medição

### RN005: Anexos
- Possibilidade de anexar fotos das medições
- Observações técnicas por medição

---

## ✅ Acceptance Criteria

**AC1:** Formulário de medições exibe campos específicos por componente  
**AC2:** Validação em tempo real de tolerâncias  
**AC3:** Indicadores visuais (cores) para status de medição  
**AC4:** Dropdown de instrumentos de medição  
**AC5:** Upload de fotos de medições  
**AC6:** Cálculos automáticos de ovalização e conicidade  
**AC7:** Progress bar atualiza ao salvar cada componente  
**AC8:** Botão "Finalizar Medições" leva para Etapa 5

---

## 🛠️ Definition of Done

- [x] Componente `MeasurementForm.tsx` criado
- [x] Hook `useMeasurements.ts` implementado
- [x] Validações de tolerância implementadas
- [x] Cálculos automáticos (ovalização, conicidade)
- [x] Integração com `motor_dna.measurements` (JSONB)
- [x] Indicadores visuais de status
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/metrologia/
  ├── MetrologyWizard.tsx         (UPDATE - Step 4)
  ├── MeasurementForm.tsx         (NEW)
  └── ToleranceIndicator.tsx      (NEW)

src/hooks/
  └── useMeasurements.ts          (NEW)

src/lib/
  └── measurements/
      ├── tolerances.ts           (NEW - tabela de tolerâncias)
      ├── calculations.ts         (NEW - cálculos automáticos)
      └── validation.ts           (NEW - validação de medições)
```

---

## 🗄️ Database Schema

```sql
-- Estrutura JSONB para measurements em motor_dna
-- Exemplo para Virabrequim:
{
  "instrument": "micrometro_externo",
  "technician_id": "uuid",
  "measured_at": "2025-01-27T14:30:00Z",
  "munhoes": [
    {
      "position": "munhao_1",
      "diameter": 67.995,
      "nominal": 68.000,
      "tolerance": 0.010,
      "status": "dentro_tolerancia",
      "photos": ["url1", "url2"],
      "notes": "Medição em 4 pontos"
    },
    {
      "position": "munhao_2",
      "diameter": 67.985,
      "nominal": 68.000,
      "tolerance": 0.010,
      "status": "dentro_tolerancia"
    }
  ],
  "bielas": [
    {
      "position": "biela_1",
      "diameter": 51.978,
      "nominal": 52.000,
      "tolerance": 0.015,
      "status": "fora_tolerancia",
      "notes": "Requer retífica"
    }
  ],
  "ovalizacao": 0.010,
  "conicidade": 0.005,
  "calculated_at": "2025-01-27T14:32:00Z"
}

-- Função para validar tolerâncias
CREATE OR REPLACE FUNCTION validate_measurement_tolerance(
  p_measured_value DECIMAL,
  p_nominal_value DECIMAL,
  p_tolerance DECIMAL
) RETURNS TEXT AS $$
BEGIN
  IF ABS(p_measured_value - p_nominal_value) <= p_tolerance THEN
    RETURN 'dentro_tolerancia';
  ELSIF ABS(p_measured_value - p_nominal_value) <= (p_tolerance * 1.1) THEN
    RETURN 'no_limite';
  ELSE
    RETURN 'fora_tolerancia';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View para medições fora de tolerância
CREATE OR REPLACE VIEW v_out_of_tolerance_measurements AS
SELECT 
  md.id,
  md.order_id,
  o.order_number,
  md.component,
  md.measurements,
  md.inspected_by,
  p.full_name as technician_name,
  md.inspected_at
FROM motor_dna md
JOIN orders o ON o.id = md.order_id
JOIN profiles p ON p.id = md.inspected_by
WHERE md.measurements IS NOT NULL
AND md.measurements::text LIKE '%"status":"fora_tolerancia"%'
ORDER BY md.inspected_at DESC;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Metrologia - Etapa 4/5: Medições Dimensionais            [X]  │
├─────────────────────────────────────────────────────────────────┤
│  OS #1234 - Mercedes-Benz OM 906                                │
│                                                                   │
│  Componente: Virabrequim                                         │
│  Instrumento: [Dropdown: Micrômetro Externo ▼]                 │
│                                                                   │
│  ┌─ Medições dos Munhões ──────────────────────────────────────┐│
│  │                                                              ││
│  │  Munhão 1:                                                   ││
│  │  Diâmetro medido: [67.995] mm                               ││
│  │  Nominal: 68.000 mm | Tolerância: ±0.010 mm                 ││
│  │  Status: ✅ Dentro da tolerância (-0.005mm)                 ││
│  │                                                              ││
│  │  Munhão 2:                                                   ││
│  │  Diâmetro medido: [67.985] mm                               ││
│  │  Nominal: 68.000 mm | Tolerância: ±0.010 mm                 ││
│  │  Status: ✅ Dentro da tolerância (-0.015mm)                 ││
│  │                                                              ││
│  │  [+ Adicionar Munhão]                                        ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─ Medições das Bielas ────────────────────────────────────────┐│
│  │                                                              ││
│  │  Biela 1:                                                    ││
│  │  Diâmetro medido: [51.978] mm                               ││
│  │  Nominal: 52.000 mm | Tolerância: ±0.015 mm                 ││
│  │  Status: ❌ Fora da tolerância (-0.022mm)                   ││
│  │  Ação recomendada: Retífica de virabrequim necessária       ││
│  │                                                              ││
│  │  [+ Adicionar Biela]                                         ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─ Cálculos Automáticos ───────────────────────────────────────┐│
│  │  Ovalização:  0.010 mm   ⚠️ No limite (máx: 0.012mm)        ││
│  │  Conicidade:  0.005 mm   ✅ Aceitável (máx: 0.008mm)        ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Observações Gerais:                                              │
│  [TextArea: Virabrequim requer retífica nos pinos de biela...  ]│
│                                                                   │
│  Fotos das Medições:                                              │
│  [📷 Upload] [🖼️ medida_munhao.jpg] [🖼️ medicao_biela.jpg]    │
│                                                                   │
│                       [← Voltar]  [Salvar e Continuar Etapa 5 →]│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Medição Dentro da Tolerância
```gherkin
Given que estou na Etapa 4 medindo "Virabrequim"
When preencho diâmetro do munhão 1 como "67.995"
And nominal é "68.000" com tolerância "±0.010"
Then sistema calcula diferença como "-0.005mm"
And exibe indicador verde "✅ Dentro da tolerância"
And permite salvar medição
```

### E2E Test 2: Medição Fora da Tolerância
```gherkin
Given que estou medindo diâmetro de biela
When preencho valor "51.978"
And nominal é "52.000" com tolerância "±0.015"
Then sistema identifica diferença de "-0.022mm"
And exibe indicador vermelho "❌ Fora da tolerância"
And mostra alerta "Ação recomendada: Retífica necessária"
```

### E2E Test 3: Cálculo Automático de Ovalização
```gherkin
Given que preenchi 4 medições de diâmetro em posições diferentes
And valores são: 67.995, 68.000, 68.005, 67.990
When sistema calcula ovalização
Then resultado é "0.015mm" (máx - mín)
And exibe status baseado na tolerância permitida
```

### E2E Test 4: Validação de Campos Obrigatórios
```gherkin
Given que não selecionei instrumento de medição
When tento salvar medições
Then vejo erro "Selecione o instrumento utilizado"
And dados não são salvos
```

---

## 🚫 Negative Scope

**Não inclui:**
- Integração com instrumentos digitais (Bluetooth/USB)
- Cálculo de vida útil restante do componente
- Sugestão automática de serviços (ver US-MET-008)
- Comparação com medições anteriores (histórico)

---

## 🔗 Dependencies

**Blocks:**
- US-MET-006 (Parecer Técnico)
- US-MET-008 (Integração com Orçamentos)

**Blocked by:**
- US-MET-004 (Análise Visual)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
