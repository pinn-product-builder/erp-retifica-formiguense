# Módulo de PCP - Planejamento e Controle da Produção

## 📋 Visão Geral

Sistema completo de planejamento e controle da produção, com gestão de cronogramas, recursos produtivos e alertas inteligentes.

## 🎯 Objetivo

Otimizar o uso de recursos produtivos, garantir cumprimento de prazos e fornecer visibilidade completa do processo produtivo.

## 📊 Funcionalidades Principais

### Cronogramas de Produção
- Vinculação com Ordem de Serviço
- Seleção de componente do motor
- Datas planejadas (início e fim)
- Horas estimadas
- Prioridade (1-5)
- Responsável pela execução
- Observações

### Status dos Cronogramas
- **Planejado** (`planned`): Criado, aguardando início
- **Em Progresso** (`in_progress`): Produção em andamento
- **Concluído** (`completed`): Finalizado
- **Atrasado** (`delayed`): Prazo vencido

### Gestão de Recursos
- Cadastro de recursos produtivos
- Tipo de recurso (máquina, ferramenta, célula)
- Capacidade diária em horas
- Acompanhamento de utilização

### Alertas de Produção
- Alertas de atraso
- Sobrecarga de capacidade
- Falta de recursos
- Níveis de severidade (info, warning, error, critical)

### KPIs
- Cronogramas ativos
- Capacidade total disponível
- Horas agendadas no dia
- Alertas ativos

## 🔗 Integração com Outros Módulos

- **Ordens de Serviço**: Vincula cronograma à OS
- **Componentes do Motor**: Define qual componente será trabalhado
- **Usuários**: Atribui responsáveis

## 🧪 Implementação Atual

**Componente Principal:** `src/pages/PCP.tsx`  
**Hooks:**
- `usePCP` - Gestão de cronogramas e recursos
- `useEngineComponents` - Lista de componentes

**Tabelas:**
- `production_schedules` - Cronogramas
- `production_resources` - Recursos
- `production_alerts` - Alertas

### Interface TypeScript
```typescript
interface ProductionSchedule {
  id: string;
  order_id: string;
  component: EngineComponent;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  estimated_hours: number;
  actual_hours?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  priority: number; // 1-5
  assigned_to?: string;
  notes?: string;
  org_id: string;
}

interface ProductionResource {
  id: string;
  resource_name: string;
  resource_type: string;
  daily_capacity_hours: number;
  is_available: boolean;
  org_id: string;
}

interface ProductionAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  related_schedule_id?: string;
  is_read: boolean;
  org_id: string;
}
```

### Métodos Disponíveis
- `createSchedule(data)` - Criar cronograma
- `updateSchedule(id, updates)` - Atualizar cronograma
- `deleteSchedule(id)` - Excluir cronograma
- `markAlertRead(id)` - Marcar alerta como lido

## 📋 Regras de Negócio

### RN-PCP-001: Mudança de Status Automática
- Ao iniciar cronograma: registra `actual_start_date`
- Ao concluir cronograma: registra `actual_end_date`

### RN-PCP-002: Cálculo de Carga
- Soma horas estimadas de todos cronogramas ativos no dia
- Compara com capacidade total disponível
- Gera alerta se exceder 100%

### RN-PCP-003: Detecção de Atraso
- Compara data atual com `planned_end_date`
- Se ultrapassar e status não for 'completed': marca como 'delayed'

## 📅 Última Atualização

**Data**: 28/10/2025  
**Status**: ✅ Em Produção
