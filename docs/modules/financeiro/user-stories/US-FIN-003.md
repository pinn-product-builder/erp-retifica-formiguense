# US-FIN-003: Fluxo de Caixa Diário

**ID:** US-FIN-003  
**Épico:** Financeiro  
**Sprint:** 9  
**Prioridade:** 🟡 Média  
**Estimativa:** 5 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** gestor financeiro  
**Quero** visualizar entradas e saídas do dia  
**Para** controlar saldo disponível e tomar decisões

---

## 🎯 Objetivo de Negócio

Dashboard de fluxo de caixa em tempo real com saldo consolidado e projeções.

---

## ✅ Critérios de Aceitação

**AC01:** Card com saldo inicial do dia  
**AC02:** Lista de entradas (recebimentos)  
**AC03:** Lista de saídas (pagamentos)  
**AC04:** Saldo final calculado automaticamente  
**AC05:** Filtro por período (hoje, semana, mês)  
**AC06:** Gráfico de evolução do saldo  
**AC07:** Projeção de saldo futuro (7, 15, 30 dias)  
**AC08:** Exportar relatório PDF

---

## 📐 Regras de Negócio

### RN-FIN-003-A: Cálculo de Fluxo
```typescript
interface CashFlowSummary {
  opening_balance: number;
  total_inflows: number;
  total_outflows: number;
  closing_balance: number;
  projected_balance_7d: number;
  projected_balance_15d: number;
  projected_balance_30d: number;
}

const calculateCashFlow = async (
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<CashFlowSummary> => {
  // Buscar saldo inicial
  const openingBalance = await getOpeningBalance(orgId, startDate);
  
  // Buscar entradas (contas recebidas)
  const { data: inflows } = await supabase
    .from('accounts_receivable')
    .select('received_amount')
    .eq('org_id', orgId)
    .eq('status', 'received')
    .gte('payment_date', startDate.toISOString())
    .lte('payment_date', endDate.toISOString());
  
  const totalInflows = inflows?.reduce((sum, item) => sum + item.received_amount, 0) || 0;
  
  // Buscar saídas (contas pagas)
  const { data: outflows } = await supabase
    .from('accounts_payable')
    .select('paid_amount')
    .eq('org_id', orgId)
    .eq('status', 'paid')
    .gte('payment_date', startDate.toISOString())
    .lte('payment_date', endDate.toISOString());
  
  const totalOutflows = outflows?.reduce((sum, item) => sum + item.paid_amount, 0) || 0;
  
  const closingBalance = openingBalance + totalInflows - totalOutflows;
  
  // Projeções
  const projected7d = await projectBalance(orgId, 7);
  const projected15d = await projectBalance(orgId, 15);
  const projected30d = await projectBalance(orgId, 30);
  
  return {
    opening_balance: openingBalance,
    total_inflows: totalInflows,
    total_outflows: totalOutflows,
    closing_balance: closingBalance,
    projected_balance_7d: projected7d,
    projected_balance_15d: projected15d,
    projected_balance_30d: projected30d,
  };
};
```

### RN-FIN-003-B: Projeção de Saldo
```typescript
const projectBalance = async (
  orgId: string,
  days: number
): Promise<number> => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);
  
  const currentBalance = await getCurrentBalance(orgId);
  
  // Recebimentos programados
  const { data: expectedInflows } = await supabase
    .from('accounts_receivable')
    .select('original_amount')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .gte('due_date', today.toISOString())
    .lte('due_date', futureDate.toISOString());
  
  const totalExpectedInflows = expectedInflows?.reduce(
    (sum, item) => sum + item.original_amount, 0
  ) || 0;
  
  // Pagamentos programados
  const { data: expectedOutflows } = await supabase
    .from('accounts_payable')
    .select('original_amount')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .gte('due_date', today.toISOString())
    .lte('due_date', futureDate.toISOString());
  
  const totalExpectedOutflows = expectedOutflows?.reduce(
    (sum, item) => sum + item.original_amount, 0
  ) || 0;
  
  return currentBalance + totalExpectedInflows - totalExpectedOutflows;
};
```

---

## 🗄️ Database Schema

**View:** `v_cash_flow_daily`

```sql
CREATE OR REPLACE VIEW v_cash_flow_daily AS
SELECT
  org_id,
  DATE(payment_date) as transaction_date,
  'inflow' as transaction_type,
  SUM(received_amount) as amount
FROM accounts_receivable
WHERE status = 'received'
GROUP BY org_id, DATE(payment_date)

UNION ALL

SELECT
  org_id,
  DATE(payment_date) as transaction_date,
  'outflow' as transaction_type,
  SUM(paid_amount) as amount
FROM accounts_payable
WHERE status = 'paid'
GROUP BY org_id, DATE(payment_date)

ORDER BY transaction_date DESC;
```

---

## 💻 Implementação

### Hook: `useCashFlow.ts`
```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export const useCashFlow = (startDate: Date, endDate: Date) => {
  const { currentOrg } = useOrganization();
  
  const { data: cashFlow, isLoading } = useQuery({
    queryKey: ['cashFlow', currentOrg?.id, startDate, endDate],
    queryFn: async () => {
      if (!currentOrg?.id) return null;
      
      // Buscar entradas
      const { data: inflows } = await supabase
        .from('accounts_receivable')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('status', 'received')
        .gte('payment_date', startDate.toISOString().split('T')[0])
        .lte('payment_date', endDate.toISOString().split('T')[0]);
      
      // Buscar saídas
      const { data: outflows } = await supabase
        .from('accounts_payable')
        .select('*')
        .eq('org_id', currentOrg.id)
        .eq('status', 'paid')
        .gte('payment_date', startDate.toISOString().split('T')[0])
        .lte('payment_date', endDate.toISOString().split('T')[0]);
      
      const totalInflows = inflows?.reduce((sum, item) => sum + item.received_amount, 0) || 0;
      const totalOutflows = outflows?.reduce((sum, item) => sum + item.paid_amount, 0) || 0;
      
      return {
        inflows: inflows || [],
        outflows: outflows || [],
        total_inflows: totalInflows,
        total_outflows: totalOutflows,
        balance: totalInflows - totalOutflows,
      };
    },
    enabled: !!currentOrg?.id,
  });
  
  return { cashFlow, isLoading };
};
```

### Componente: `CashFlowDashboard.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCashFlow } from "@/hooks/useCashFlow";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export const CashFlowDashboard = () => {
  const today = new Date();
  const { cashFlow, isLoading } = useCashFlow(today, today);
  
  if (isLoading) return <div>Carregando...</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Entradas</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(cashFlow?.total_inflows || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {cashFlow?.inflows.length || 0} transações
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Saídas</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(cashFlow?.total_outflows || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {cashFlow?.outflows.length || 0} transações
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Saldo do Dia</CardTitle>
          <DollarSign className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            (cashFlow?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(cashFlow?.balance || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Resultado líquido
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 🧪 Cenários de Teste

```gherkin
Feature: Fluxo de Caixa Diário

Scenario: Visualizar saldo do dia
  Given existem 3 recebimentos de R$ 1000 cada
  And existem 2 pagamentos de R$ 500 cada
  When acesso o dashboard de fluxo de caixa
  Then vejo total de entradas: R$ 3.000,00
  And vejo total de saídas: R$ 1.000,00
  And vejo saldo do dia: R$ 2.000,00
```

---

## 📋 Definition of Done

- [x] View `v_cash_flow_daily` criada
- [x] Hook `useCashFlow` implementado
- [x] Dashboard com cards de resumo
- [x] Projeções de saldo futuro
- [x] Testes E2E passando

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
