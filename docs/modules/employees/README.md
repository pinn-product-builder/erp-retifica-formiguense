# Módulo de Gestão de Funcionários

## 📋 Visão Geral

Sistema completo de gestão de recursos humanos, incluindo controle de ponto, cálculo de comissões, escalas e folha de pagamento.

## 🎯 Objetivo

Centralizar informações de funcionários, automatizar controle de ponto e horas, calcular comissões e gerenciar escalas de trabalho.

## 📊 Funcionalidades Principais

### Cadastro de Funcionários
- Dados pessoais (nome, CPF, telefone, email)
- Cargo e departamento
- Data de admissão
- Matrícula automática
- Salário base
- Valor hora
- Taxa de comissão
- Endereço completo
- Status ativo/inativo

### Controle de Ponto
- Registro de entrada e saída
- Cálculo automático de horas trabalhadas
- Tempo de intervalo configurável
- Status do dia (presente, ausente, férias, atestado)
- Horas extras automáticas (> 8h)
- Observações por registro

### Sistema de Comissões
- Taxa de comissão por funcionário
- Cálculo baseado em vendas/serviços
- Período mensal
- Histórico de comissões
- Relatórios por funcionário

### Gestão de Escalas
- Planejamento de turnos
- Visualização mensal
- Férias e folgas
- Conflitos de horário

### KPIs
- Funcionários ativos
- Presentes no dia
- Folha de pagamento total
- Comissões do mês

## 🔗 Integração com Outros Módulos

- **Ordens de Serviço**: Técnicos responsáveis
- **Financeiro**: Folha de pagamento e comissões
- **PCP**: Alocação de recursos humanos

## 🧪 Implementação Atual

**Componente Principal:** `src/pages/GestaoFuncionarios.tsx`  
**Hook:** `src/hooks/useEmployees.ts`

**Tabelas:**
- `employees` - Funcionários
- `time_tracking` - Controle de ponto
- `employee_commissions` - Comissões
- `work_schedules` - Escalas

### Interfaces Principais
```typescript
interface Employee {
  id: string;
  employee_number: string; // Matrícula
  full_name: string;
  cpf: string;
  phone?: string;
  email?: string;
  position: string; // Cargo
  department: string;
  hire_date: string;
  termination_date?: string;
  salary?: number;
  hourly_rate?: number; // Valor por hora
  commission_rate: number; // Taxa de comissão (0-1)
  address?: string;
  is_active: boolean;
  org_id: string;
  created_at: string;
}

interface TimeEntry {
  id: string;
  employee_id: string;
  date: string;
  clock_in?: string; // HH:MM
  clock_out?: string; // HH:MM
  break_duration: number; // minutos
  total_hours?: number;
  overtime_hours: number;
  status: 'present' | 'absent' | 'vacation' | 'sick' | 'late';
  notes?: string;
  org_id: string;
}

interface Commission {
  id: string;
  employee_id: string;
  period_month: number; // 1-12
  period_year: number;
  sales_amount: number;
  commission_rate: number;
  gross_commission: number;
  deductions: number;
  final_commission: number;
  org_id: string;
  created_at: string;
}
```

### Métodos Disponíveis
- `createEmployee(data)` - Cadastrar funcionário
- `updateEmployee(id, updates)` - Atualizar funcionário
- `recordTimeEntry(data)` - Registrar ponto
- `calculateCommissions(month, year)` - Calcular comissões do período
- `getEmployeeSchedule(employeeId, startDate, endDate)` - Ver escala

## 📋 Regras de Negócio

### RN-FUNC-001: Cálculo de Horas
```
total_hours = (clock_out - clock_in) - (break_duration / 60)
overtime_hours = total_hours > 8 ? (total_hours - 8) : 0
```

### RN-FUNC-002: Cálculo de Comissões
```
gross_commission = sales_amount * commission_rate
final_commission = gross_commission - deductions
```

### RN-FUNC-003: Matrícula
- Gerada automaticamente no formato: `FUNC-{YYYY}-{NNNN}`
- Ex: `FUNC-2025-0001`

## 📅 Última Atualização

**Data**: 28/10/2025  
**Status**: ✅ Em Produção
