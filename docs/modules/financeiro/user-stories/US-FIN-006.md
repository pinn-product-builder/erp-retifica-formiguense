# US-FIN-006: Centro de Custos

**ID:** US-FIN-006  
**Épico:** Financeiro  
**Sprint:** 10  
**Prioridade:** 🟢 Baixa  
**Estimativa:** 3 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** controller  
**Quero** classificar despesas por centro de custo  
**Para** analisar rentabilidade por setor/projeto

---

## 🎯 Objetivo de Negócio

Estruturar análise gerencial com separação de custos por área de negócio.

---

## ✅ Critérios de Aceitação

**AC01:** Cadastro de centros de custo (nome, código, ativo/inativo)  
**AC02:** Hierarquia: centro pai → centro filho  
**AC03:** Ao criar conta a pagar, selecionar centro de custo  
**AC04:** Ao criar conta a receber, selecionar centro de receita  
**AC05:** Relatório de DRE por centro de custo  
**AC06:** Dashboard de comparação entre centros  
**AC07:** Exportar análise gerencial

---

## 📐 Regras de Negócio

### RN-FIN-006-A: Estrutura Hierárquica
```typescript
interface CostCenter {
  id: string;
  code: string;
  name: string;
  parent_id?: string;
  active: boolean;
  children?: CostCenter[];
}

const getCostCenterHierarchy = async (orgId: string): Promise<CostCenter[]> => {
  const { data } = await supabase
    .from('cost_centers')
    .select('*')
    .eq('org_id', orgId)
    .eq('active', true)
    .is('parent_id', null)
    .order('code');
  
  const rootCenters = data || [];
  
  // Recursivamente buscar filhos
  for (const center of rootCenters) {
    center.children = await getChildren(center.id);
  }
  
  return rootCenters;
};

const getChildren = async (parentId: string): Promise<CostCenter[]> => {
  const { data } = await supabase
    .from('cost_centers')
    .select('*')
    .eq('parent_id', parentId)
    .eq('active', true)
    .order('code');
  
  const children = data || [];
  
  for (const child of children) {
    child.children = await getChildren(child.id);
  }
  
  return children;
};
```

### RN-FIN-006-B: DRE por Centro
```typescript
interface IncomeStatement {
  cost_center_id: string;
  revenue: number;
  expenses: number;
  net_income: number;
  margin_percentage: number;
}

const generateIncomeStatement = async (
  orgId: string,
  costCenterId: string,
  startDate: Date,
  endDate: Date
): Promise<IncomeStatement> => {
  // Receitas
  const { data: revenues } = await supabase
    .from('accounts_receivable')
    .select('received_amount')
    .eq('org_id', orgId)
    .eq('cost_center_id', costCenterId)
    .eq('status', 'received')
    .gte('payment_date', startDate.toISOString())
    .lte('payment_date', endDate.toISOString());
  
  const totalRevenue = revenues?.reduce((sum, r) => sum + r.received_amount, 0) || 0;
  
  // Despesas
  const { data: expenses } = await supabase
    .from('accounts_payable')
    .select('paid_amount')
    .eq('org_id', orgId)
    .eq('cost_center_id', costCenterId)
    .eq('status', 'paid')
    .gte('payment_date', startDate.toISOString())
    .lte('payment_date', endDate.toISOString());
  
  const totalExpenses = expenses?.reduce((sum, e) => sum + e.paid_amount, 0) || 0;
  
  const netIncome = totalRevenue - totalExpenses;
  const marginPercentage = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
  
  return {
    cost_center_id: costCenterId,
    revenue: totalRevenue,
    expenses: totalExpenses,
    net_income: netIncome,
    margin_percentage: marginPercentage,
  };
};
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Hierarquia
  parent_id UUID REFERENCES cost_centers(id),
  level INTEGER DEFAULT 1,
  path TEXT,  -- Ex: 1.2.3 (para queries hierárquicas)
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_cost_center_code UNIQUE (org_id, code)
);

-- Índices
CREATE INDEX idx_cost_centers_org ON cost_centers(org_id);
CREATE INDEX idx_cost_centers_parent ON cost_centers(parent_id);
CREATE INDEX idx_cost_centers_path ON cost_centers(path);

-- RLS
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view org cost centers"
  ON cost_centers FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage cost centers"
  ON cost_centers FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'financial_manager')
    )
  );

-- Adicionar referências em accounts_payable e accounts_receivable
ALTER TABLE accounts_payable
ADD COLUMN cost_center_id UUID REFERENCES cost_centers(id);

ALTER TABLE accounts_receivable
ADD COLUMN cost_center_id UUID REFERENCES cost_centers(id);

-- Trigger para atualizar path hierárquico
CREATE OR REPLACE FUNCTION update_cost_center_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
  parent_level INTEGER;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.level := 1;
    NEW.path := NEW.code;
  ELSE
    SELECT path, level INTO parent_path, parent_level
    FROM cost_centers
    WHERE id = NEW.parent_id;
    
    NEW.level := parent_level + 1;
    NEW.path := parent_path || '.' || NEW.code;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cost_center_path
  BEFORE INSERT OR UPDATE ON cost_centers
  FOR EACH ROW
  EXECUTE FUNCTION update_cost_center_path();
```

---

## 💻 Implementação

### Hook: `useCostCenters.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export const useCostCenters = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  
  // Listar centros de custo
  const { data: costCenters = [], isLoading } = useQuery({
    queryKey: ['costCenters', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('path');
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });
  
  // Criar centro de custo
  const createCostCenter = useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      description?: string;
      parent_id?: string;
    }) => {
      if (!currentOrg?.id) throw new Error("Organização não selecionada");
      
      const { error } = await supabase
        .from('cost_centers')
        .insert({
          ...data,
          org_id: currentOrg.id,
          active: true,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
      toast.success("Centro de custo criado");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  return {
    costCenters,
    isLoading,
    createCostCenter: createCostCenter.mutate,
    isCreating: createCostCenter.isPending,
  };
};
```

---

## 🧪 Cenários de Teste

```gherkin
Feature: Centro de Custos

Scenario: Criar hierarquia de centros
  Given estou autenticado como admin
  When crio centro "1.0 - Operações"
  And crio centro filho "1.1 - Retífica"
  And crio centro filho "1.2 - Vendas"
  Then hierarquia é criada corretamente
  And paths são: "1.0", "1.0.1.1", "1.0.1.2"
```

---

## 📋 Definition of Done

- [x] Tabela `cost_centers` criada
- [x] Suporte a hierarquia
- [x] Hook `useCostCenters` implementado
- [x] Relatório DRE por centro
- [x] Testes passando

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
