# US-MET-009: Aba "Metrologia" em OrderDetails

**ID:** US-MET-009  
**Epic:** Metrologia  
**Sprint:** 2  
**Prioridade:** Média  
**Estimativa:** 3 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** usuário do sistema  
**Quero** acessar a análise metrológica diretamente do OrderDetails  
**Para** visualizar DNA do motor e iniciar/continuar processo de metrologia

---

## 🎯 Business Objective

Integrar módulo de Metrologia ao fluxo principal de visualização de OS, facilitando acesso e controle do processo de análise técnica.

---

## 📐 Business Rules

### RN001: Visibilidade da Aba
- Aba "Metrologia" aparece em todas as OSs
- Habilitada apenas após status da OS ser >= "em_analise"
- Badge exibe estágio atual da metrologia

### RN002: Estágios de Metrologia
1. **Não Iniciado** - Badge cinza "Pendente"
2. **Em Andamento** - Badge amarelo "Etapa X/5"
3. **Concluído** - Badge verde "Concluído"

### RN003: Conteúdo da Aba por Estágio

**Se não iniciado:**
- Mensagem: "Análise metrológica ainda não foi iniciada"
- Botão "Iniciar Metrologia" (redireciona para MetrologyWizard)

**Se em andamento:**
- Progress bar mostrando etapa atual (X/5)
- Descrição da etapa em progresso
- Botão "Continuar Metrologia" (retorna para etapa atual)
- Preview parcial dos dados já coletados

**Se concluído:**
- DNA completo do motor (tabs por componente)
- Link para download do relatório PDF
- Botão "Criar Orçamento" (se não criado)
- Histórico de revisões (se houver múltiplas análises)

### RN004: Permissões
- **Técnicos**: Podem iniciar e executar metrologia
- **Gerentes**: Podem visualizar e iniciar
- **Consultores**: Apenas visualização
- **Admins**: Acesso completo

---

## ✅ Acceptance Criteria

**AC1:** Aba "Metrologia" visível no OrderDetails  
**AC2:** Badge exibe estágio correto (Pendente/Em Andamento/Concluído)  
**AC3:** Botão "Iniciar Metrologia" funcional  
**AC4:** Botão "Continuar Metrologia" retorna para etapa correta  
**AC5:** DNA completo exibido após conclusão  
**AC6:** Download de PDF disponível após conclusão  
**AC7:** Botão "Criar Orçamento" integrado

---

## 🛠️ Definition of Done

- [x] OrderDetails.tsx atualizado com nova aba
- [x] Componente `MetrologyTab.tsx` criado
- [x] Hook `useMetrologyStatus.ts` implementado
- [x] Integração com MetrologyWizard (navegação)
- [x] Integração com MotorDNAView (visualização)
- [x] Botões de ação implementados
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/pages/
  └── OrderDetails.tsx              (UPDATE - adicionar aba)

src/components/metrologia/
  ├── MetrologyTab.tsx              (NEW)
  ├── MetrologyStatusBadge.tsx      (NEW)
  └── MetrologyProgress.tsx         (NEW)

src/hooks/
  └── useMetrologyStatus.ts         (NEW)
```

---

## 🗄️ Database Query

```typescript
// Hook useMetrologyStatus.ts
const { data: status, isLoading } = useQuery({
  queryKey: ['metrology-status', orderId],
  queryFn: async () => {
    // Verifica estágio atual
    const { data: order } = await supabase
      .from('orders')
      .select('metrology_stage')
      .eq('id', orderId)
      .single();

    // Conta componentes analisados
    const { count: analyzedCount } = await supabase
      .from('motor_dna')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .not('general_condition', 'is', null);

    // Busca relatório (se houver)
    const { data: report } = await supabase
      .from('metrology_reports')
      .select('*')
      .eq('order_id', orderId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      stage: order?.metrology_stage || 'not_started',
      analyzedComponents: analyzedCount || 0,
      reportUrl: report?.file_url || null,
      completedAt: report?.generated_at || null
    };
  }
});
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  OS #1234 - Mercedes-Benz OM 906                    [← Voltar] │
├─────────────────────────────────────────────────────────────────┤
│  [Detalhes] [Timeline] [Fotos] [Materiais] [Garantia] [Metrologia 🔬]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🔬 Análise Metrológica                                          │
│                                                                   │
│  Status: [Badge Amarelo: Em Andamento - Etapa 3/5]              │
│                                                                   │
│  Progresso: ████████████░░░░░░░░░░ 60%                          │
│                                                                   │
│  ┌─ Etapas Concluídas ──────────────────────────────────────────┐│
│  │  ✅ Etapa 1: OS Criada (27/01 10:30)                        ││
│  │  ✅ Etapa 2: Componentes Recebidos (27/01 11:15)            ││
│  │  🔄 Etapa 3: Análise Visual (Em andamento)                   ││
│  │  ⏳ Etapa 4: Medições Dimensionais                           ││
│  │  ⏳ Etapa 5: Parecer Técnico e PDF                           ││
│  └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─ Dados Parciais Coletados ────────────────────────────────────┐│
│  │  Componentes Analisados: 3/7                                 ││
│  │  • ✅ Bloco (Bom)                                            ││
│  │  • ✅ Cabeçote (Regular)                                     ││
│  │  • ✅ Virabrequim (Crítico)                                  ││
│  │                                                               ││
│  │  Fotos Anexadas: 18                                          ││
│  │  Medições Realizadas: 0 (Próxima etapa)                     ││
│  └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│                                    [🚀 Continuar Metrologia]     │
└─────────────────────────────────────────────────────────────────┘

Após conclusão:

┌─────────────────────────────────────────────────────────────────┐
│  🔬 Análise Metrológica                                          │
│                                                                   │
│  Status: [Badge Verde: ✅ Concluído]                             │
│                                                                   │
│  📄 Relatório: REL-MET-2025-0042                                 │
│  Gerado em: 27/01/2025 às 16:20                                 │
│  Técnico: João Silva                                             │
│                                                                   │
│  [📥 Baixar Relatório PDF]                                       │
│                                                                   │
│  ┌─ DNA do Motor ────────────────────────────────────────────────┐│
│  │  [Bloco 🟢] [Cabeçote 🟡] [Virabrequim 🔴] [Biela 🟠] ...   ││
│  │                                                               ││
│  │  (Ver componente US-MET-007 - Visualização do DNA)           ││
│  └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│                                    [💰 Criar Orçamento]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Visualizar Aba com Metrologia Não Iniciada
```gherkin
Given que OS #1234 está em status "coletado"
And metrologia não foi iniciada
When acesso OrderDetails e clico na aba "Metrologia"
Then vejo badge "Pendente"
And vejo mensagem "Análise metrológica ainda não foi iniciada"
And vejo botão "Iniciar Metrologia"
```

### E2E Test 2: Iniciar Metrologia
```gherkin
Given que estou na aba "Metrologia" não iniciada
When clico em "Iniciar Metrologia"
Then sou redirecionado para /metrologia/wizard/{orderId}
And wizard inicia na Etapa 1
```

### E2E Test 3: Visualizar Metrologia Em Andamento
```gherkin
Given que metrologia está na Etapa 3/5
When acesso aba "Metrologia"
Then vejo badge "Em Andamento - Etapa 3/5"
And vejo progress bar 60%
And vejo lista de etapas com status
And vejo botão "Continuar Metrologia"
```

### E2E Test 4: Continuar Metrologia
```gherkin
Given que metrologia está na Etapa 3
When clico em "Continuar Metrologia"
Then sou redirecionado para wizard na Etapa 3
And dados anteriores estão preservados
```

### E2E Test 5: Visualizar Metrologia Concluída
```gherkin
Given que metrologia está concluída
When acesso aba "Metrologia"
Then vejo badge "Concluído" verde
And vejo número do relatório
And vejo botão "Baixar Relatório PDF"
And vejo DNA completo com tabs de componentes
And vejo botão "Criar Orçamento"
```

---

## 🚫 Negative Scope

**Não inclui:**
- Edição de dados de metrologia via aba (apenas visualização)
- Reiniciar metrologia do zero (requer US-MET-011)
- Múltiplas análises simultâneas do mesmo motor
- Comparação de múltiplos laudos

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-OS-004 (OrderDetails existente)
- US-MET-001 (MetrologyWizard)
- US-MET-007 (Visualização do DNA)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
