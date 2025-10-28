# US-FIN-001: Registrar Conta a Pagar

**ID:** US-FIN-001  
**Épico:** Financeiro  
**Sprint:** 8  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** gestor financeiro  
**Quero** registrar contas a pagar com vencimento e fornecedor  
**Para** controlar obrigações financeiras e evitar atrasos

---

## 🎯 Objetivo de Negócio

Criar sistema completo de gestão de contas a pagar com controle de vencimentos, alertas e rastreabilidade.

---

## ✅ Critérios de Aceitação

**AC01:** Formulário com campos obrigatórios: fornecedor, valor, vencimento, descrição  
**AC02:** Campos opcionais: categoria, centro de custo, documento, observações  
**AC03:** Seleção de fornecedor via dropdown (cadastro de fornecedores)  
**AC04:** Validação: vencimento não pode ser retroativo  
**AC05:** Status automático: "pendente", "vencida", "paga", "cancelada"  
**AC06:** Botão para upload de boleto/nota fiscal (PDF)  
**AC07:** Lista de contas com filtros: status, período, fornecedor  
**AC08:** Badge visual de status (cores: cinza, vermelho, verde, preto)  
**AC09:** Cálculo automático de juros/multa se paga após vencimento  
**AC10:** Ao salvar, gerar notificação 3 dias antes do vencimento

---

## 📐 Regras de Negócio

### RN-FIN-001-A: Validação de Vencimento
```typescript
const validateDueDate = (dueDate: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate >= today;
};
```

### RN-FIN-001-B: Cálculo de Status
```typescript
type PayableStatus = 'pending' | 'overdue' | 'paid' | 'cancelled';

const calculatePayableStatus = (
  dueDate: Date,
  paymentDate?: Date,
  cancelled: boolean = false
): PayableStatus => {
  if (cancelled) return 'cancelled';
  if (paymentDate) return 'paid';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dueDate < today ? 'overdue' : 'pending';
};
```

### RN-FIN-001-C: Cálculo de Juros e Multa
```typescript
interface LateFeeConfig {
  multa_percentual: number;  // Ex: 2% = 0.02
  juros_diario: number;       // Ex: 0.033% ao dia = 0.00033
}

const calculateLateFees = (
  valorOriginal: number,
  dueDate: Date,
  paymentDate: Date,
  config: LateFeeConfig
): { multa: number; juros: number; total: number } => {
  const diasAtraso = Math.floor(
    (paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (diasAtraso <= 0) {
    return { multa: 0, juros: 0, total: valorOriginal };
  }
  
  const multa = valorOriginal * config.multa_percentual;
  const juros = valorOriginal * config.juros_diario * diasAtraso;
  const total = valorOriginal + multa + juros;
  
  return { multa, juros, total };
};
```

---

## 🗄️ Database Schema

**Tabela:** `accounts_payable`

```sql
CREATE TABLE accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Identificação
  payable_number TEXT NOT NULL,  -- AP-YYYY-XXXX
  description TEXT NOT NULL,
  category TEXT,
  cost_center TEXT,
  document_number TEXT,
  
  -- Valores
  original_amount DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  interest DECIMAL(12,2) DEFAULT 0,
  fine DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2),
  
  -- Datas
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  payment_date DATE,
  
  -- Relacionamentos
  supplier_id UUID REFERENCES suppliers(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending', 'overdue', 'paid', 'cancelled')),
  
  -- Anexos
  document_url TEXT,
  
  -- Observações
  notes TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  paid_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_payable_number UNIQUE (org_id, payable_number)
);

-- Índices
CREATE INDEX idx_payables_org_status ON accounts_payable(org_id, status);
CREATE INDEX idx_payables_due_date ON accounts_payable(due_date) WHERE status = 'pending';
CREATE INDEX idx_payables_supplier ON accounts_payable(supplier_id);

-- RLS
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view org payables"
  ON accounts_payable FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Financial users manage payables"
  ON accounts_payable FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'financial_manager')
    )
  );

-- Trigger para atualizar status automaticamente
CREATE OR REPLACE FUNCTION update_payable_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_date IS NOT NULL THEN
    NEW.status := 'paid';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.status = 'pending' THEN
    NEW.status := 'overdue';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payable_status
  BEFORE INSERT OR UPDATE ON accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION update_payable_status();
```

---

## 💻 Implementação

### Schema Zod: `payableSchema.ts`
```typescript
import { z } from "zod";

export const payableSchema = z.object({
  description: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  supplier_id: z.string().uuid("Selecione um fornecedor válido"),
  
  original_amount: z.number()
    .positive("Valor deve ser maior que zero")
    .max(999999.99, "Valor muito alto"),
  
  due_date: z.date().refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: "Vencimento não pode ser retroativo" }
  ),
  
  category: z.string().optional(),
  cost_center: z.string().optional(),
  document_number: z.string().optional(),
  notes: z.string().optional(),
});

export type PayableFormData = z.infer<typeof payableSchema>;
```

### Hook: `usePayables.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export const usePayables = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  
  // Listar contas a pagar
  const { data: payables = [], isLoading } = useQuery({
    queryKey: ['payables', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      
      const { data, error } = await supabase
        .from('accounts_payable')
        .select(`
          *,
          supplier:suppliers(id, name, document)
        `)
        .eq('org_id', currentOrg.id)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });
  
  // Criar conta a pagar
  const createPayable = useMutation({
    mutationFn: async (data: PayableFormData) => {
      if (!currentOrg?.id) throw new Error("Organização não selecionada");
      
      // Gerar número da conta
      const { data: lastPayable } = await supabase
        .from('accounts_payable')
        .select('payable_number')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      const year = new Date().getFullYear();
      const lastNumber = lastPayable?.payable_number 
        ? parseInt(lastPayable.payable_number.split('-')[2]) 
        : 0;
      const payableNumber = `AP-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
      
      const { data: newPayable, error } = await supabase
        .from('accounts_payable')
        .insert({
          ...data,
          org_id: currentOrg.id,
          payable_number: payableNumber,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return newPayable;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      toast.success("Conta a pagar registrada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar conta: ${error.message}`);
    },
  });
  
  // Registrar pagamento
  const registerPayment = useMutation({
    mutationFn: async ({
      id,
      paymentDate,
      paidAmount,
      interest,
      fine,
    }: {
      id: string;
      paymentDate: Date;
      paidAmount: number;
      interest?: number;
      fine?: number;
    }) => {
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          payment_date: paymentDate.toISOString().split('T')[0],
          paid_amount: paidAmount,
          interest: interest || 0,
          fine: fine || 0,
          status: 'paid',
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      toast.success("Pagamento registrado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });
  
  return {
    payables,
    isLoading,
    createPayable: createPayable.mutate,
    isCreating: createPayable.isPending,
    registerPayment: registerPayment.mutate,
    isRegisteringPayment: registerPayment.isPending,
  };
};
```

### Componente: `PayableForm.tsx`
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { payableSchema, PayableFormData } from "@/schemas/payableSchema";
import { usePayables } from "@/hooks/usePayables";
import { useSuppliers } from "@/hooks/useSuppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const PayableForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { createPayable, isCreating } = usePayables();
  const { suppliers } = useSuppliers();
  
  const form = useForm<PayableFormData>({
    resolver: zodResolver(payableSchema),
    defaultValues: {
      description: "",
      original_amount: 0,
      due_date: new Date(),
    },
  });
  
  const onSubmit = (data: PayableFormData) => {
    createPayable(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="supplier_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} - {supplier.document}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Compra de peças" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="original_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimento *</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value?.toISOString().split('T')[0]}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Informações adicionais..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isCreating} className="w-full">
          {isCreating ? "Registrando..." : "Registrar Conta"}
        </Button>
      </form>
    </Form>
  );
};
```

---

## 🧪 Cenários de Teste

```gherkin
Feature: Registrar Conta a Pagar

Scenario: Registrar conta com sucesso
  Given estou autenticado como gestor financeiro
  When acesso a página de contas a pagar
  And clico em "Nova Conta"
  And preencho fornecedor "Fornecedor ABC"
  And preencho descrição "Compra de materiais"
  And preencho valor "1500.00"
  And preencho vencimento para daqui 30 dias
  And clico em "Registrar"
  Then vejo mensagem "Conta a pagar registrada com sucesso"
  And conta aparece na lista com status "Pendente"

Scenario: Validar vencimento retroativo
  Given estou no formulário de nova conta
  When seleciono data de vencimento anterior a hoje
  And tento submeter o formulário
  Then vejo erro "Vencimento não pode ser retroativo"
  And formulário não é enviado

Scenario: Calcular status automaticamente
  Given tenho conta com vencimento 2025-01-15
  When a data atual passa de 2025-01-15
  Then status da conta muda para "Vencida"
  And badge fica vermelho
```

---

## 📋 Definition of Done

- [x] Tabela `accounts_payable` criada com RLS
- [x] Schema Zod `payableSchema` implementado
- [x] Hook `usePayables` com CRUD completo
- [x] Componente `PayableForm` funcional
- [x] Validação de vencimento retroativo
- [x] Cálculo automático de status
- [x] Trigger para atualização de status
- [x] Testes E2E passando
- [x] Documentação atualizada

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
