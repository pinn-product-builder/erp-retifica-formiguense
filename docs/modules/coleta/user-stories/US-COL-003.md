# US-COL-003: Selecionar Consultor Responsável

**ID:** US-COL-003  
**Épico:** Coleta  
**Sprint:** 1  
**Prioridade:** 🔴 Alta  
**Estimativa:** 2 pontos  
**Status:** ✅ Done

---

## 📋 User Story

**Como** atendente da retífica  
**Quero** selecionar o consultor responsável pela venda  
**Para** garantir rastreamento de comissões e responsabilidade técnica

---

## 🎯 Objetivo de Negócio

Vincular consultor à OS desde o primeiro momento para permitir cálculo automático de comissões e clareza de responsabilidade.

---

## ✅ Critérios de Aceitação

**AC01:** Campo "Consultor Responsável" é exibido como select dropdown  
**AC02:** Dropdown lista apenas consultores ativos da organização  
**AC03:** Se cliente tem histórico, último consultor é auto-selecionado  
**AC04:** Atendente pode alterar consultor sugerido  
**AC05:** Consultor é campo obrigatório para finalizar coleta  
**AC06:** Ao selecionar consultor, sistema salva no campo `consultant_id` da OS  

---

## 📐 Regras de Negócio

### RN-COL-003-A: Auto-preenchimento
```typescript
const getLastConsultantForCustomer = async (
  customerId: string, 
  orgId: string
): Promise<string | null> => {
  const { data } = await supabase
    .from('orders')
    .select('consultant_id')
    .eq('customer_id', customerId)
    .eq('org_id', orgId)
    .not('consultant_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  return data?.consultant_id || null;
};
```

### RN-COL-003-B: Filtro de Consultores Ativos
```typescript
const getActiveConsultants = async (orgId: string) => {
  const { data } = await supabase
    .from('consultants')
    .select('id, name, commission_rate')
    .eq('org_id', orgId)
    .eq('active', true)
    .order('name');
    
  return data || [];
};
```

---

## 🗄️ Database Schema

**Tabela:** `consultants`

```sql
CREATE TABLE consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_consultants_org_active ON consultants(org_id, active);
```

**Vínculo em `orders`:**
```sql
ALTER TABLE orders
ADD COLUMN consultant_id UUID REFERENCES consultants(id);

CREATE INDEX idx_orders_consultant ON orders(consultant_id);
```

---

## 💻 Implementação

```typescript
// ConsultorSelect.tsx
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  customerId?: string;
  orgId: string;
}

export const ConsultorSelect = ({ value, onChange, customerId, orgId }: Props) => {
  // Buscar consultores ativos
  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants', orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('consultants')
        .select('id, name, commission_rate')
        .eq('org_id', orgId)
        .eq('active', true)
        .order('name');
      return data || [];
    },
  });
  
  // Auto-preencher com último consultor do cliente
  useEffect(() => {
    if (customerId && !value) {
      (async () => {
        const { data } = await supabase
          .from('orders')
          .select('consultant_id')
          .eq('customer_id', customerId)
          .not('consultant_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (data?.consultant_id) {
          onChange(data.consultant_id);
        }
      })();
    }
  }, [customerId]);
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Consultor Responsável *</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o consultor..." />
        </SelectTrigger>
        <SelectContent>
          {consultants.map((consultant) => (
            <SelectItem key={consultant.id} value={consultant.id}>
              {consultant.name} ({consultant.commission_rate}% comissão)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!value && (
        <p className="text-sm text-destructive">Campo obrigatório</p>
      )}
    </div>
  );
};
```

---

## 🧪 Cenários de Teste

```typescript
test('deve auto-preencher último consultor do cliente', async ({ page }) => {
  await page.goto('/coleta');
  
  // Selecionar cliente que tem histórico
  await page.fill('[data-testid="customer-search"]', 'João Silva');
  await page.click('[data-testid="customer-option-1"]');
  
  // Aguardar auto-preenchimento
  await page.waitForTimeout(1000);
  
  // Verificar consultor selecionado
  const selectedValue = await page.locator('[data-testid="consultant-select"]').textContent();
  expect(selectedValue).toContain('Carlos Consultor');
});

test('deve permitir alterar consultor sugerido', async ({ page }) => {
  await page.goto('/coleta');
  await page.fill('[data-testid="customer-search"]', 'João Silva');
  await page.click('[data-testid="customer-option-1"]');
  
  // Consultor auto-preenchido
  await page.waitForTimeout(1000);
  
  // Alterar manualmente
  await page.click('[data-testid="consultant-select"]');
  await page.click('text=Maria Consultora');
  
  // Verificar mudança
  const selectedValue = await page.locator('[data-testid="consultant-select"]').textContent();
  expect(selectedValue).toContain('Maria Consultora');
});
```

---

## 📋 Definition of Done

- [x] Componente `ConsultorSelect` criado
- [x] Auto-preenchimento baseado em histórico funcional
- [x] Apenas consultores ativos são listados
- [x] Campo obrigatório validado
- [x] Testes E2E passando
- [x] Documentação atualizada

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
