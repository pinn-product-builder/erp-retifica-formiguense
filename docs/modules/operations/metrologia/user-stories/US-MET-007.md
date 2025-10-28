# US-MET-007: Visualização do DNA do Motor

**ID:** US-MET-007  
**Epic:** Metrologia  
**Sprint:** 3  
**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** usuário do sistema (gerente, consultor, técnico)  
**Quero** visualizar o DNA completo de um motor de forma organizada  
**Para** consultar histórico de análises e tomar decisões informadas

---

## 🎯 Business Objective

Disponibilizar interface de consulta do "DNA" do motor, permitindo acesso rápido ao histórico de inspeções, medições e laudos de cada componente.

---

## 📐 Business Rules

### RN001: Estrutura de Visualização

**Tabs por Componente:**
- Bloco
- Cabeçote(s)
- Virabrequim
- Biela(s)
- Pistão(ões)
- Comando(s)
- Eixo(s)

**Cada tab exibe:**
- Estado geral (badge colorido)
- Análise visual (trincas, desgaste, necessita retífica)
- Galeria de fotos (lightbox)
- Tabela de medições dimensionais com status de tolerância
- Observações técnicas
- Histórico de modificações (se houver múltiplas análises)

### RN002: Indicadores Visuais
- **Badge de Estado:**
  - 🟢 Bom (verde)
  - 🟡 Regular (amarelo)
  - 🟠 Ruim (laranja)
  - 🔴 Crítico (vermelho)

- **Status de Medições:**
  - ✅ Dentro da tolerância
  - ⚠️ No limite
  - ❌ Fora da tolerância

### RN003: Filtros e Busca
- Filtrar por estado geral
- Filtrar por status de tolerância
- Busca por tipo de medição
- Filtro por data de inspeção

### RN004: Exportação
- Botão "Exportar DNA Completo" (PDF)
- Exportação de componente individual (PDF)

### RN005: Acesso
- Disponível na aba "Metrologia" do OrderDetails
- Acessível após conclusão da Etapa 2 (componentes recebidos)
- Histórico de análises acessível para motores com múltiplas revisões

---

## ✅ Acceptance Criteria

**AC1:** Aba "Metrologia" visível no OrderDetails após Etapa 2  
**AC2:** Tabs exibem apenas componentes presentes na OS  
**AC3:** Badges de estado renderizados com cores corretas  
**AC4:** Galeria de fotos funcional com lightbox  
**AC5:** Tabela de medições exibe status de tolerância  
**AC6:** Observações técnicas são exibidas por seção  
**AC7:** Botão "Exportar DNA" gera PDF consolidado

---

## 🛠️ Definition of Done

- [x] Componente `MotorDNAView.tsx` criado
- [x] Hook `useMotorDNA.ts` implementado
- [x] Tabs dinâmicas por componente
- [x] Galeria de fotos com lightbox
- [x] Tabela de medições responsiva
- [x] Exportação de PDF implementada
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/metrologia/
  ├── MotorDNAView.tsx              (NEW)
  ├── ComponentDNACard.tsx          (NEW)
  ├── MeasurementTable.tsx          (NEW)
  └── PhotoGallery.tsx              (NEW)

src/hooks/
  └── useMotorDNA.ts                (NEW)

src/pages/
  └── OrderDetails.tsx              (UPDATE - adicionar aba Metrologia)
```

---

## 🗄️ Database Query

```typescript
// Hook useMotorDNA.ts
const { data: motorDNA, isLoading } = useQuery({
  queryKey: ['motor-dna', orderId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('motor_dna')
      .select(`
        id,
        component,
        general_condition,
        has_cracks,
        has_excessive_wear,
        needs_grinding,
        visual_observations,
        photos,
        measurements,
        inspected_by,
        inspected_at,
        profiles!motor_dna_inspected_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('order_id', orderId)
      .order('component');

    if (error) throw error;
    return data;
  }
});
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  OS #1234 - Mercedes-Benz OM 906                    [← Voltar] │
├─────────────────────────────────────────────────────────────────┤
│  [Detalhes] [Timeline] [Fotos] [Materiais] [Garantia] [Metrologia]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🧬 DNA do Motor - Análise Metrológica                           │
│                                                                   │
│  ┌───┬───┬───┬───┬───┬───┬───┐                                  │
│  │Blo│Cab│Vir│Bie│Pis│Com│Eix│                                  │
│  │co │ec │abr│la │tão│and│o  │                                  │
│  │🟢 │🟡 │🔴 │🟠 │🟢 │🟢 │🟢 │                                  │
│  └───┴───┴───┴───┴───┴───┴───┘                                  │
│                                                                   │
│  ┌─ Virabrequim (CRÍTICO 🔴) ──────────────────────────────────┐│
│  │                                                              ││
│  │  Análise Visual:                                             ││
│  │  • Possui trincas: ❌ Não                                    ││
│  │  • Desgaste excessivo: ✅ Sim                                ││
│  │  • Necessita retífica: ✅ Sim                                ││
│  │                                                              ││
│  │  Observações: "Desgaste severo nos pinos de biela.          ││
│  │                Requer retífica urgente."                     ││
│  │                                                              ││
│  │  Fotos (8):                                                  ││
│  │  [🖼️] [🖼️] [🖼️] [🖼️] [🖼️] [🖼️] [🖼️] [🖼️]               ││
│  │                                                              ││
│  │  ┌─ Medições Dimensionais ──────────────────────────────┐  ││
│  │  │  Medição        Medido  Nominal  Tol.   Status       │  ││
│  │  │  ──────────────────────────────────────────────────  │  ││
│  │  │  Munhão 1       67.995  68.000  ±0.010  ✅ OK        │  ││
│  │  │  Munhão 2       67.985  68.000  ±0.010  ✅ OK        │  ││
│  │  │  Biela 1        51.978  52.000  ±0.015  ❌ FORA TOL  │  ││
│  │  │  Biela 2        51.980  52.000  ±0.015  ❌ FORA TOL  │  ││
│  │  │  Ovalização     0.010   -       <0.012  ⚠️ LIMITE    │  ││
│  │  │  Conicidade     0.005   -       <0.008  ✅ OK        │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  │                                                              ││
│  │  Instrumento: Micrômetro Externo                             ││
│  │  Técnico: João Silva | Data: 27/01/2025 14:30               ││
│  │                                                              ││
│  │                         [📥 Exportar Componente PDF]        ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│                                      [📄 Exportar DNA Completo] │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Visualizar DNA de Componente
```gherkin
Given que OS #1234 tem metrologia completa
And estou na aba "Metrologia" do OrderDetails
When clico na tab "Virabrequim"
Then vejo estado geral "Crítico" com badge vermelho
And vejo análise visual com checkboxes marcados
And vejo galeria com 8 fotos
And vejo tabela de medições com status de tolerância
And vejo nome do técnico e data de inspeção
```

### E2E Test 2: Galeria de Fotos com Lightbox
```gherkin
Given que estou visualizando DNA do "Bloco"
And bloco tem 5 fotos anexadas
When clico em uma miniatura de foto
Then lightbox abre exibindo foto em tamanho grande
And posso navegar entre fotos usando setas
And posso fechar lightbox com botão "X" ou ESC
```

### E2E Test 3: Filtrar Componentes por Estado
```gherkin
Given que estou na aba "Metrologia"
When aplico filtro "Estado: Crítico"
Then vejo apenas tabs de componentes com estado crítico
And outros componentes são ocultados/desabilitados
```

### E2E Test 4: Exportar DNA Completo
```gherkin
Given que todos os componentes têm DNA preenchido
When clico em "Exportar DNA Completo"
Then Edge Function gera PDF consolidado
And PDF contém análise de todos os 7 componentes
And PDF é baixado automaticamente
```

---

## 🚫 Negative Scope

**Não inclui:**
- Edição de dados de metrologia (via OrderDetails)
- Comparação de DNAs entre múltiplas OSs
- Análise preditiva de vida útil
- Integração com sistema de BI/Analytics

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-MET-003 (Componentes Recebidos)
- US-MET-004 (Análise Visual)
- US-MET-005 (Medições Dimensionais)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
