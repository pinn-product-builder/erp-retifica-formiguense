# Módulo PCP (Planejamento e Controle de Produção)

## 📋 Visão Geral

O módulo PCP (Planejamento e Controle de Produção) é responsável por planejar, programar e controlar todas as atividades de retífica de motores, desde o planejamento de capacidade até a gestão de eficiência produtiva.

## 🎯 Objetivos

- **Planejamento de Capacidade**: Calcular capacidade disponível e planejar operações
- **Sequenciamento**: Otimizar ordem de serviços baseado em prioridade e recursos
- **Acompanhamento**: Monitorar progresso em tempo real
- **Análise de Eficiência**: KPIs de OEE, lead time e gargalos

## ⚙️ Funcionalidades Principais

### 1. Planejamento de Capacidade
- Cálculo de capacidade por centro de trabalho
- Análise de carga x capacidade
- Identificação de sobrecarga/ociosidade
- Simulação de cenários

### 2. Ordem de Serviço
- Criação automática a partir de orçamento aprovado
- Documentação técnica anexada
- Tracking de status em tempo real
- Gestão de pendências

### 3. Sequenciamento de Produção
- Algoritmo de priorização (prazo, complexidade, recursos)
- Visualização em Gantt
- Drag-and-drop para ajustes manuais
- Replanejamento automático

### 4. Apontamento de Produção
- Registro de início/fim de operações
- Paradas programadas e não programadas
- Coleta de quantidade produzida
- Validação de qualidade in-line

### 5. Análise de Performance
- OEE (Overall Equipment Effectiveness)
- Lead time médio
- Taxa de retrabalho
- Eficiência por operador/centro

### 6. Gestão de Gargalos
- Identificação automática de bottlenecks
- Alertas de atrasos
- Sugestões de ações corretivas
- Histórico de resoluções

## 🔗 Integrações

### Entrada de Dados
- **Orçamentos**: Aprovação gera ordem de serviço
- **Estoque**: Verificação de disponibilidade de peças
- **Funcionários**: Alocação de mão de obra
- **Equipamentos**: Disponibilidade de máquinas

### Saída de Dados
- **Financeiro**: Lançamento de custos de produção
- **Relatórios**: Dashboards gerenciais
- **Qualidade**: Dados de conformidade

## 💻 Implementação

### Componente Principal
- `src/pages/PCP.tsx`

### Hooks Principais
- `useProductionOrders.ts` - Gestão de ordens de serviço
- `useProductionScheduling.ts` - Sequenciamento
- `useProductionPointing.ts` - Apontamentos
- `useCapacityPlanning.ts` - Planejamento de capacidade
- `useOEE.ts` - Cálculo de OEE
- `useBottleneckAnalysis.ts` - Análise de gargalos

### Páginas Relacionadas
- `src/pages/ProductionOrders.tsx` - Lista de ordens
- `src/pages/ProductionSchedule.tsx` - Gantt de sequenciamento
- `src/pages/ProductionPointing.tsx` - Terminal de apontamento
- `src/pages/ProductionAnalytics.tsx` - Dashboards

### Componentes de Formulário
- `ProductionOrderForm.tsx`
- `SchedulingBoard.tsx`
- `PointingTerminal.tsx`
- `CapacityChart.tsx`

## 🗄️ Tabelas do Banco de Dados

### Principais
- `production_orders` - Ordens de serviço
- `production_operations` - Operações dentro da OS
- `production_pointings` - Apontamentos de produção
- `work_centers` - Centros de trabalho
- `production_schedules` - Programação
- `production_stoppages` - Paradas de produção

### Views
- `v_production_capacity` - Capacidade consolidada
- `v_production_efficiency` - Eficiência por período
- `v_bottleneck_analysis` - Análise de gargalos

## 📐 Interfaces Principais

```typescript
interface ProductionOrder {
  id: string;
  org_id: string;
  order_number: string;
  budget_id: string;
  order_id: string;
  component: ComponentType;
  operations: ProductionOperation[];
  status: 'pending' | 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  priority: number;
  planned_start: Date;
  planned_end: Date;
  actual_start?: Date;
  actual_end?: Date;
  assigned_to?: string;
}

interface ProductionOperation {
  id: string;
  production_order_id: string;
  operation_code: string;
  operation_name: string;
  work_center_id: string;
  sequence: number;
  setup_time_minutes: number;
  operation_time_minutes: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  started_at?: Date;
  completed_at?: Date;
}

interface ProductionPointing {
  id: string;
  operation_id: string;
  employee_id: string;
  start_time: Date;
  end_time?: Date;
  quantity_produced: number;
  quantity_rejected: number;
  stoppage_minutes: number;
  notes?: string;
}

interface WorkCenter {
  id: string;
  code: string;
  name: string;
  capacity_hours_day: number;
  efficiency_factor: number;
  active: boolean;
}

interface OEEMetrics {
  availability: number; // % tempo disponível vs tempo planejado
  performance: number; // % velocidade real vs ideal
  quality: number; // % peças boas vs total
  oee: number; // availability * performance * quality
}
```

## 📊 Métodos Disponíveis

### Production Orders
- `listProductionOrders()` - Lista todas as ordens
- `createProductionOrder()` - Cria nova ordem
- `updateProductionOrderStatus()` - Atualiza status
- `assignProductionOrder()` - Atribui operador
- `calculateOrderProgress()` - Calcula % conclusão

### Scheduling
- `generateSchedule()` - Gera programação otimizada
- `rescheduleOrder()` - Reprograma ordem específica
- `getAvailableSlots()` - Busca slots disponíveis
- `checkResourceConflicts()` - Verifica conflitos

### Pointing
- `startOperation()` - Inicia apontamento
- `pauseOperation()` - Pausa operação
- `completeOperation()` - Finaliza operação
- `registerStoppage()` - Registra parada

### Analytics
- `calculateOEE()` - Calcula OEE
- `getBottlenecks()` - Identifica gargalos
- `getProductionEfficiency()` - Eficiência por período
- `getLeadTimeAnalysis()` - Análise de lead time

## 📏 Regras de Negócio

### Criação de Ordem de Serviço
1. Ordem só é criada após aprovação de orçamento
2. Verificar disponibilidade de peças no estoque
3. Se faltar peças, gerar requisição de compra
4. Calcular tempo total baseado nas operações

### Sequenciamento
1. **Prioridade Base**:
   - Prazo de entrega (mais próximo = maior prioridade)
   - Complexidade (menor = maior prioridade para balancear)
   - Cliente VIP
2. **Restrições**:
   - Disponibilidade de recursos
   - Setup time entre operações diferentes
   - Turnos de trabalho

### Apontamento
1. Operador deve logar no terminal
2. Não pode apontar em mais de uma operação simultaneamente
3. Paradas > 5 minutos devem ser justificadas
4. Quantidade rejeitada requer motivo

### OEE
```
OEE = Disponibilidade × Performance × Qualidade

Disponibilidade = (Tempo Disponível - Paradas) / Tempo Disponível
Performance = (Quantidade Produzida × Tempo Padrão) / Tempo de Produção
Qualidade = Quantidade Aprovada / Quantidade Produzida
```

## 🎨 Wireframes

### Gantt de Sequenciamento
```
┌─────────────────────────────────────────────────────────┐
│ Sequenciamento de Produção          [Hoje] [Semana]    │
├─────────────────────────────────────────────────────────┤
│ Centro de Trabalho 1 ▼                                  │
│ ┌────────┐  ┌──────────┐        ┌────┐                │
│ │ OS-001 │  │ OS-003   │        │OS-5│                │
│ └────────┘  └──────────┘        └────┘                │
│                                                          │
│ Centro de Trabalho 2 ▼                                  │
│    ┌──────────┐  ┌────────┐                           │
│    │ OS-002   │  │ OS-004 │                           │
│    └──────────┘  └────────┘                           │
├─────────────────────────────────────────────────────────┤
│ ⚠️ Gargalo detectado: CT1 com 120% capacidade          │
└─────────────────────────────────────────────────────────┘
```

## 🧪 Cenários de Teste

```gherkin
Feature: PCP - Planejamento e Controle de Produção

Scenario: Criar ordem de serviço automaticamente
  Given orçamento ORC-2025-001 foi aprovado
  When sistema cria ordem de serviço
  Then OS-2025-001 é criada
  And todas as operações são listadas
  And status é "Pendente"

Scenario: Sequenciar produção otimizando recursos
  Given 5 ordens pendentes
  When executo sequenciamento automático
  Then ordens são organizadas por prioridade
  And não há conflito de recursos
  And balanceamento de carga é respeitado

Scenario: Calcular OEE do centro de trabalho
  Given centro trabalhou 8 horas
  And teve 1 hora de parada
  And produziu 45 peças (padrão: 50/dia)
  And rejeitou 3 peças
  Then Disponibilidade = 87.5%
  And Performance = 90%
  And Qualidade = 93.3%
  And OEE = 73.5%
```

## 📋 Definition of Done

- [x] Todas as tabelas criadas
- [x] Hooks implementados
- [x] RLS policies configuradas
- [x] Views de analytics criadas
- [x] Algoritmo de sequenciamento
- [x] Cálculo de OEE
- [x] Terminal de apontamento
- [x] Gantt interativo
- [x] Testes E2E passando

---

**Última atualização:** 2025-01-28  
**Status:** Produção  
**Versão:** 1.0
