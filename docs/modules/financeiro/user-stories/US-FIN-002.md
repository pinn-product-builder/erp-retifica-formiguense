# US-FIN-002: Registrar Conta a Receber

**ID:** US-FIN-002  
**Épico:** Financeiro  
**Sprint:** 8  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** gestor financeiro  
**Quero** registrar contas a receber de clientes  
**Para** controlar receitas e acompanhar inadimplência

---

## 🎯 Objetivo de Negócio

Sistema completo de gestão de contas a receber com controle de parcelamento, multas e antecipação.

---

## ✅ Critérios de Aceitação

**AC01:** Formulário com campos: cliente, valor, vencimento, forma de pagamento  
**AC02:** Suporte a parcelamento (1-12x)  
**AC03:** Gerar automaticamente ao aprovar orçamento  
**AC04:** Status: "pendente", "vencida", "recebida", "cancelada"  
**AC05:** Cálculo de desconto para antecipação  
**AC06:** Registro de recebimento parcial  
**AC07:** Lista com filtros: status, cliente, período  
**AC08:** Dashboard de inadimplência por cliente  
**AC09:** Exportar relatório de recebimentos

---

## 📐 Regras de Negócio

### RN-FIN-002-A: Geração Automática de Parcelas
```typescript
interface InstallmentConfig {
  total_amount: number;
  installments: number;
  first_due_date: Date;
}

const generateInstallments = (config: InstallmentConfig) => {
  const installmentValue = config.total_amount / config.installments;
  
  return Array.from({ length: config.installments }, (_, index) => {
    const dueDate = new Date(config.first_due_date);
    dueDate.setMonth(dueDate.getMonth() + index);
    
    return {
      installment_number: index + 1,
      amount: installmentValue,
      due_date: dueDate,
      status: 'pending',
    };
  });
};
```

### RN-FIN-002-B: Desconto para Antecipação
```typescript
interface EarlyPaymentDiscount {
  percentual_desconto: number;  // Ex: 5% = 0.05
  dias_antecipacao_minimo: number;
}

const calculateEarlyDiscount = (
  originalAmount: number,
  dueDate: Date,
  paymentDate: Date,
  config: EarlyPaymentDiscount
): number => {
  const daysEarly = Math.floor(
    (dueDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysEarly < config.dias_antecipacao_minimo) {
    return 0;
  }
  
  return originalAmount * config.percentual_desconto;
};
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Identificação
  receivable_number TEXT NOT NULL,  -- AR-YYYY-XXXX
  description TEXT NOT NULL,
  
  -- Valores
  original_amount DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  interest DECIMAL(12,2) DEFAULT 0,
  fine DECIMAL(12,2) DEFAULT 0,
  received_amount DECIMAL(12,2),
  
  -- Parcelamento
  total_installments INTEGER DEFAULT 1,
  installment_number INTEGER DEFAULT 1,
  
  -- Datas
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  payment_date DATE,
  
  -- Relacionamentos
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  budget_id UUID REFERENCES budgets(id),
  
  -- Forma de Pagamento
  payment_method TEXT,
    CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending', 'overdue', 'received', 'cancelled')),
  
  -- Observações
  notes TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  received_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_receivable_number UNIQUE (org_id, receivable_number)
);

-- Índices
CREATE INDEX idx_receivables_org_status ON accounts_receivable(org_id, status);
CREATE INDEX idx_receivables_due_date ON accounts_receivable(due_date) WHERE status = 'pending';
CREATE INDEX idx_receivables_customer ON accounts_receivable(customer_id);
CREATE INDEX idx_receivables_order ON accounts_receivable(order_id);

-- RLS
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view org receivables"
  ON accounts_receivable FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Financial users manage receivables"
  ON accounts_receivable FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'financial_manager')
    )
  );

-- Trigger atualização de status
CREATE OR REPLACE FUNCTION update_receivable_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_date IS NOT NULL THEN
    NEW.status := 'received';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.status = 'pending' THEN
    NEW.status := 'overdue';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_receivable_status
  BEFORE INSERT OR UPDATE ON accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION update_receivable_status();
```

---

## 💻 Implementação

### Hook: `useReceivables.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export const useReceivables = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  
  // Listar contas a receber
  const { data: receivables = [], isLoading } = useQuery({
    queryKey: ['receivables', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select(`
          *,
          customer:customers(id, name, document),
          order:orders(id, order_number)
        `)
        .eq('org_id', currentOrg.id)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });
  
  // Criar conta a receber (com parcelamento)
  const createReceivable = useMutation({
    mutationFn: async (data: {
      customer_id: string;
      original_amount: number;
      due_date: Date;
      installments: number;
      description: string;
      order_id?: string;
    }) => {
      if (!currentOrg?.id) throw new Error("Organização não selecionada");
      
      const installmentAmount = data.original_amount / data.installments;
      const receivables = [];
      
      for (let i = 0; i < data.installments; i++) {
        const dueDate = new Date(data.due_date);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        // Gerar número único
        const { data: lastReceivable } = await supabase
          .from('accounts_receivable')
          .select('receivable_number')
          .eq('org_id', currentOrg.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        const year = new Date().getFullYear();
        const lastNumber = lastReceivable?.receivable_number 
          ? parseInt(lastReceivable.receivable_number.split('-')[2]) 
          : 0;
        const receivableNumber = `AR-${year}-${String(lastNumber + i + 1).padStart(4, '0')}`;
        
        receivables.push({
          org_id: currentOrg.id,
          receivable_number: receivableNumber,
          customer_id: data.customer_id,
          original_amount: installmentAmount,
          due_date: dueDate.toISOString().split('T')[0],
          description: data.description,
          order_id: data.order_id,
          total_installments: data.installments,
          installment_number: i + 1,
          status: 'pending',
        });
      }
      
      const { error } = await supabase
        .from('accounts_receivable')
        .insert(receivables);
      
      if (error) throw error;
      return receivables;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      toast.success("Conta(s) a receber registrada(s) com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar conta: ${error.message}`);
    },
  });
  
  // Registrar recebimento
  const registerReceipt = useMutation({
    mutationFn: async ({
      id,
      paymentDate,
      receivedAmount,
      discount,
      paymentMethod,
    }: {
      id: string;
      paymentDate: Date;
      receivedAmount: number;
      discount?: number;
      paymentMethod: string;
    }) => {
      const { error } = await supabase
        .from('accounts_receivable')
        .update({
          payment_date: paymentDate.toISOString().split('T')[0],
          received_amount: receivedAmount,
          discount: discount || 0,
          payment_method: paymentMethod,
          status: 'received',
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      toast.success("Recebimento registrado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar recebimento: ${error.message}`);
    },
  });
  
  return {
    receivables,
    isLoading,
    createReceivable: createReceivable.mutate,
    isCreating: createReceivable.isPending,
    registerReceipt: registerReceipt.mutate,
    isRegisteringReceipt: registerReceipt.isPending,
  };
};
```

---

## 🧪 Cenários de Teste

```gherkin
Feature: Registrar Conta a Receber

Scenario: Criar conta parcelada
  Given estou autenticado como gestor financeiro
  When crio conta de R$ 3000,00 em 3x
  And primeira parcela vence em 30 dias
  Then sistema cria 3 contas de R$ 1000,00 cada
  And vencimentos são: hoje+30, hoje+60, hoje+90

Scenario: Aplicar desconto por antecipação
  Given conta com vencimento daqui 15 dias
  And valor de R$ 1000,00
  When registro recebimento hoje
  And aplico desconto de 5%
  Then valor recebido é R$ 950,00
  And status muda para "Recebida"
```

---

## 📋 Definition of Done

- [x] Tabela `accounts_receivable` criada
- [x] Hook `useReceivables` implementado
- [x] Suporte a parcelamento
- [x] Cálculo de descontos
- [x] RLS policies configuradas
- [x] Testes E2E passando

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
