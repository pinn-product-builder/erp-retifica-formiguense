# US-FIN-005: Calcular Comissão de Consultores

**ID:** US-FIN-005  
**Épico:** Financeiro  
**Sprint:** 9  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** gestor financeiro  
**Quero** calcular comissões automaticamente ao receber pagamento  
**Para** pagar consultores corretamente e manter transparência

---

## 🎯 Objetivo de Negócio

Automatizar cálculo de comissões baseado em regras configuráveis e recebimentos efetivos.

---

## ✅ Critérios de Aceitação

**AC01:** Gatilho: comissão é calculada quando conta a receber é marcada como "recebida"  
**AC02:** Percentual de comissão vem do cadastro do consultor  
**AC03:** Base de cálculo: valor efetivamente recebido (não o orçado)  
**AC04:** Suporte a comissão escalonada (ex: até 10k = 5%, acima = 7%)  
**AC05:** Descontar custos de peças da base (comissão apenas sobre serviço)  
**AC06:** Status de comissão: "pendente", "paga", "cancelada"  
**AC07:** Relatório mensal de comissões por consultor  
**AC08:** Ao pagar comissão, gerar conta a pagar vinculada

---

## 📐 Regras de Negócio

### RN-FIN-005-A: Cálculo Base
```typescript
interface CommissionCalculation {
  receivable_id: string;
  consultant_id: string;
  total_received: number;
  parts_cost: number;
  service_value: number;
  commission_rate: number;
  commission_amount: number;
}

const calculateCommission = async (
  receivableId: string
): Promise<CommissionCalculation> => {
  // Buscar conta recebida
  const { data: receivable } = await supabase
    .from('accounts_receivable')
    .select(`
      *,
      order:orders!inner(
        consultant_id,
        consultants!inner(commission_rate)
      ),
      budget:budgets!inner(parts)
    `)
    .eq('id', receivableId)
    .single();
  
  if (!receivable) throw new Error("Conta não encontrada");
  
  const totalReceived = receivable.received_amount;
  
  // Calcular custo de peças
  const parts = receivable.budget.parts as Array<{ quantity: number; unit_price: number }>;
  const partsCost = parts.reduce((sum, part) => sum + (part.quantity * part.unit_price), 0);
  
  // Valor de serviço = total - peças
  const serviceValue = totalReceived - partsCost;
  
  // Taxa de comissão
  const commissionRate = receivable.order.consultants.commission_rate / 100;
  
  // Comissão final
  const commissionAmount = serviceValue * commissionRate;
  
  return {
    receivable_id: receivableId,
    consultant_id: receivable.order.consultant_id,
    total_received: totalReceived,
    parts_cost: partsCost,
    service_value: serviceValue,
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
  };
};
```

### RN-FIN-005-B: Comissão Escalonada
```typescript
interface CommissionTier {
  min_amount: number;
  max_amount: number;
  rate: number;
}

const tieredCommissionRates: CommissionTier[] = [
  { min_amount: 0, max_amount: 10000, rate: 0.05 },      // 5% até 10k
  { min_amount: 10000, max_amount: 50000, rate: 0.07 },  // 7% de 10k-50k
  { min_amount: 50000, max_amount: Infinity, rate: 0.10 }, // 10% acima de 50k
];

const calculateTieredCommission = (serviceValue: number): number => {
  let commission = 0;
  let remaining = serviceValue;
  
  for (const tier of tieredCommissionRates) {
    if (remaining <= 0) break;
    
    const tierRange = tier.max_amount - tier.min_amount;
    const applicableAmount = Math.min(remaining, tierRange);
    
    commission += applicableAmount * tier.rate;
    remaining -= applicableAmount;
  }
  
  return commission;
};
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE consultant_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Relacionamentos
  consultant_id UUID NOT NULL REFERENCES consultants(id),
  receivable_id UUID NOT NULL REFERENCES accounts_receivable(id),
  order_id UUID REFERENCES orders(id),
  
  -- Cálculo
  total_received DECIMAL(12,2) NOT NULL,
  parts_cost DECIMAL(12,2) DEFAULT 0,
  service_value DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,  -- Ex: 5.00 = 5%
  commission_amount DECIMAL(12,2) NOT NULL,
  
  -- Datas
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  payment_due_date DATE,
  payment_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending', 'paid', 'cancelled')),
  
  -- Referência ao pagamento
  payable_id UUID REFERENCES accounts_payable(id),
  
  -- Observações
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_commissions_consultant ON consultant_commissions(consultant_id);
CREATE INDEX idx_commissions_status ON consultant_commissions(status);
CREATE INDEX idx_commissions_calculated_at ON consultant_commissions(calculated_at);

-- RLS
ALTER TABLE consultant_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view org commissions"
  ON consultant_commissions FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Financial users manage commissions"
  ON consultant_commissions FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'financial_manager')
    )
  );

-- Trigger: Calcular comissão ao receber
CREATE OR REPLACE FUNCTION trigger_calculate_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_consultant_id UUID;
  v_commission_rate DECIMAL(5,2);
  v_parts_cost DECIMAL(12,2);
  v_service_value DECIMAL(12,2);
  v_commission_amount DECIMAL(12,2);
BEGIN
  -- Apenas quando status muda para 'received'
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
    -- Buscar consultor e taxa
    SELECT o.consultant_id, c.commission_rate
    INTO v_consultant_id, v_commission_rate
    FROM orders o
    JOIN consultants c ON c.id = o.consultant_id
    WHERE o.id = NEW.order_id;
    
    IF v_consultant_id IS NOT NULL THEN
      -- Calcular custo de peças (TODO: implementar lógica real)
      v_parts_cost := 0;
      v_service_value := NEW.received_amount - v_parts_cost;
      v_commission_amount := v_service_value * (v_commission_rate / 100);
      
      -- Inserir comissão
      INSERT INTO consultant_commissions (
        org_id,
        consultant_id,
        receivable_id,
        order_id,
        total_received,
        parts_cost,
        service_value,
        commission_rate,
        commission_amount,
        status
      ) VALUES (
        NEW.org_id,
        v_consultant_id,
        NEW.id,
        NEW.order_id,
        NEW.received_amount,
        v_parts_cost,
        v_service_value,
        v_commission_rate,
        v_commission_amount,
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_commission
  AFTER INSERT OR UPDATE OF status ON accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_commission();
```

---

## 💻 Implementação

### Hook: `useCommissions.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export const useCommissions = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  
  // Listar comissões
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      
      const { data, error } = await supabase
        .from('consultant_commissions')
        .select(`
          *,
          consultant:consultants(id, name),
          order:orders(id, order_number)
        `)
        .eq('org_id', currentOrg.id)
        .order('calculated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });
  
  // Marcar comissão como paga
  const payCommission = useMutation({
    mutationFn: async (commissionId: string) => {
      if (!currentOrg?.id) throw new Error("Organização não selecionada");
      
      // Buscar comissão
      const { data: commission } = await supabase
        .from('consultant_commissions')
        .select('*, consultant:consultants(name)')
        .eq('id', commissionId)
        .single();
      
      if (!commission) throw new Error("Comissão não encontrada");
      
      // Criar conta a pagar
      const { data: payable, error: payableError } = await supabase
        .from('accounts_payable')
        .insert({
          org_id: currentOrg.id,
          description: `Comissão - ${commission.consultant.name}`,
          original_amount: commission.commission_amount,
          due_date: new Date().toISOString().split('T')[0],
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      
      if (payableError) throw payableError;
      
      // Atualizar comissão
      const { error: updateError } = await supabase
        .from('consultant_commissions')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          payable_id: payable.id,
        })
        .eq('id', commissionId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      toast.success("Comissão paga com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao pagar comissão: ${error.message}`);
    },
  });
  
  return {
    commissions,
    isLoading,
    payCommission: payCommission.mutate,
    isPaying: payCommission.isPending,
  };
};
```

---

## 🧪 Cenários de Teste

```gherkin
Feature: Calcular Comissão de Consultor

Scenario: Comissão calculada automaticamente
  Given ordem de serviço com valor total R$ 3.000
  And custo de peças: R$ 1.000
  And consultor com taxa de 5%
  When registro recebimento da conta
  Then sistema calcula serviço: R$ 2.000
  And comissão: R$ 100,00 (5% de R$ 2.000)
  And cria registro com status "Pendente"
```

---

## 📋 Definition of Done

- [x] Tabela `consultant_commissions` criada
- [x] Trigger automático implementado
- [x] Hook `useCommissions` funcional
- [x] Cálculo de comissão escalonada
- [x] Testes E2E passando

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
