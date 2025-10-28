# US-COM-001: Cadastrar Fornecedores

**ID:** US-COM-001  
**Epic:** Compras  
**Sprint:** 7  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** comprador  
**Quero** cadastrar fornecedores com dados completos  
**Para** manter base organizada e facilitar cotações

---

## 🎯 Business Objective

Criar cadastro centralizado de fornecedores com informações comerciais, fiscais e de performance para otimizar processo de compras.

---

## ✅ Acceptance Criteria

**AC01:** Formulário de cadastro com abas (Dados Gerais, Endereço, Comercial, Produtos)  
**AC02:** Validação de CNPJ com verificação de duplicidade  
**AC03:** Campo de categorias de produtos fornecidos (multi-seleção)  
**AC04:** Configuração de condições comerciais (prazo pagamento, limite crédito)  
**AC05:** Lista de fornecedores com filtros por categoria e status  
**AC06:** Badge de avaliação do fornecedor (rating visual)  
**AC07:** Botão de ativar/inativar fornecedor  
**AC08:** Histórico de compras ao visualizar fornecedor

---

## 📐 Business Rules

### RN-COM-001: Validação CNPJ
```typescript
function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validação dígito verificador 1
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cnpj[12]) !== digit1) return false;
  
  // Validação dígito verificador 2
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return parseInt(cnpj[13]) === digit2;
}
```

### RN-COM-002: Duplicidade
```typescript
async function checkDuplicateSupplier(
  cnpj: string, 
  orgId: string,
  excludeId?: string
): Promise<boolean> {
  const { data } = await supabase
    .from('suppliers')
    .select('id')
    .eq('org_id', orgId)
    .eq('document', cnpj)
    .neq('id', excludeId || '')
    .single();
    
  return !!data;
}
```

### RN-COM-003: Categorias Padrão
```typescript
const SUPPLIER_CATEGORIES = [
  { value: 'pecas_motor', label: 'Peças de Motor' },
  { value: 'rolamentos', label: 'Rolamentos' },
  { value: 'retentores', label: 'Retentores' },
  { value: 'juntas', label: 'Juntas e Vedações' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'consumiveis', label: 'Consumíveis' },
  { value: 'embalagens', label: 'Embalagens' },
  { value: 'servicos', label: 'Serviços' },
] as const;
```

### RN-COM-004: Rating
```typescript
interface SupplierRating {
  delivery: number;      // 0-100 (pontualidade)
  quality: number;       // 0-100 (qualidade)
  price: number;         // 0-100 (competitividade)
  service: number;       // 0-100 (atendimento)
  overall: number;       // Média ponderada
}

// Cálculo do rating geral
function calculateOverallRating(rating: SupplierRating): number {
  return (
    rating.delivery * 0.35 +
    rating.quality * 0.35 +
    rating.price * 0.20 +
    rating.service * 0.10
  );
}
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  
  -- Identificação
  code TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  document TEXT NOT NULL,
  state_registration TEXT,
  municipal_registration TEXT,
  
  -- Contato
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,
  contact_person TEXT,
  
  -- Endereço
  address JSONB NOT NULL,
  
  -- Comercial
  payment_terms TEXT[] DEFAULT ARRAY['30'],
  payment_methods TEXT[] DEFAULT ARRAY['boleto'],
  credit_limit NUMERIC(12,2),
  discount_percentage NUMERIC(5,2),
  
  -- Categorias
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Performance
  delivery_performance NUMERIC(5,2),
  quality_rating NUMERIC(5,2),
  price_rating NUMERIC(5,2),
  service_rating NUMERIC(5,2),
  overall_rating NUMERIC(5,2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  blocked_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(org_id, document),
  UNIQUE(org_id, code)
);

-- Índices
CREATE INDEX idx_suppliers_org ON suppliers(org_id);
CREATE INDEX idx_suppliers_active ON suppliers(is_active) WHERE is_active = true;
CREATE INDEX idx_suppliers_categories ON suppliers USING GIN(categories);

-- RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suppliers from their organization"
  ON suppliers FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert suppliers in their organization"
  ON suppliers FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update suppliers in their organization"
  ON suppliers FOR UPDATE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Trigger para código automático
CREATE OR REPLACE FUNCTION generate_supplier_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'FOR-' || LPAD(
      (SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
       FROM suppliers 
       WHERE org_id = NEW.org_id
       AND code ~ '^FOR-[0-9]+$')::TEXT,
      5, '0'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_supplier_code
  BEFORE INSERT ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION generate_supplier_code();

-- Trigger para updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 🎨 Implementation

### Schema de Validação (Zod)

```typescript
// src/schemas/supplierSchema.ts
import { z } from 'zod';
import { validateCNPJ } from '@/lib/validations';

const addressSchema = z.object({
  street: z.string().min(3, 'Endereço deve ter pelo menos 3 caracteres'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'UF deve ter 2 caracteres'),
  postal_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
});

export const supplierSchema = z.object({
  // Identificação
  code: z.string().optional(),
  trade_name: z.string().min(3, 'Nome fantasia é obrigatório'),
  legal_name: z.string().min(3, 'Razão social é obrigatória'),
  document: z.string()
    .regex(/^\d{14}$/, 'CNPJ deve conter 14 dígitos')
    .refine(validateCNPJ, 'CNPJ inválido'),
  state_registration: z.string().optional(),
  municipal_registration: z.string().optional(),
  
  // Contato
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  contact_person: z.string().optional(),
  
  // Endereço
  address: addressSchema,
  
  // Comercial
  payment_terms: z.array(z.string()).min(1, 'Selecione ao menos um prazo'),
  payment_methods: z.array(z.string()).min(1, 'Selecione ao menos um método'),
  credit_limit: z.number().min(0).optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  
  // Categorias
  categories: z.array(z.string()).min(1, 'Selecione ao menos uma categoria'),
  
  // Status
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
```

### Componente de Formulário

```typescript
// src/components/suppliers/SupplierForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supplierSchema, type SupplierFormData } from '@/schemas/supplierSchema';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface SupplierFormProps {
  supplier?: SupplierFormData;
  onSuccess?: () => void;
}

export function SupplierForm({ supplier, onSuccess }: SupplierFormProps) {
  const { createSupplier, updateSupplier } = useSuppliers();
  const isEdit = !!supplier;
  
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier || {
      is_active: true,
      payment_terms: ['30'],
      payment_methods: ['boleto'],
      categories: [],
    },
  });
  
  const onSubmit = async (data: SupplierFormData) => {
    if (isEdit) {
      await updateSupplier({ id: supplier.id, ...data });
    } else {
      await createSupplier(data);
    }
    onSuccess?.();
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Dados Gerais</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="commercial">Comercial</TabsTrigger>
          <TabsTrigger value="categories">Produtos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Input
            label="Nome Fantasia"
            {...form.register('trade_name')}
            error={form.formState.errors.trade_name?.message}
          />
          <Input
            label="Razão Social"
            {...form.register('legal_name')}
            error={form.formState.errors.legal_name?.message}
          />
          <Input
            label="CNPJ"
            {...form.register('document')}
            mask="99.999.999/9999-99"
            error={form.formState.errors.document?.message}
          />
          <Input
            label="Email"
            type="email"
            {...form.register('email')}
            error={form.formState.errors.email?.message}
          />
          <Input
            label="Telefone"
            {...form.register('phone')}
            mask="(99) 99999-9999"
            error={form.formState.errors.phone?.message}
          />
        </TabsContent>
        
        <TabsContent value="address" className="space-y-4">
          {/* Campos de endereço */}
        </TabsContent>
        
        <TabsContent value="commercial" className="space-y-4">
          {/* Condições comerciais */}
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          {/* Seleção de categorias */}
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit">
          {isEdit ? 'Atualizar' : 'Cadastrar'} Fornecedor
        </Button>
      </div>
    </form>
  );
}
```

---

## 🖼️ Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ Fornecedores                                  [+ Novo]  [≡] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ [Buscar fornecedor...]                    [Filtros ▼]       │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ⭐⭐⭐⭐⭐ Rolamentos Sul Ltda       FOR-00001 🟢      │   │
│ │ rolamentos@example.com | (11) 98765-4321              │   │
│ │ 🏷️ Rolamentos, Retentores                             │   │
│ │ 📊 Entrega: 95% | Qualidade: 98% | Preço: 85%        │   │
│ │ [Ver Detalhes] [Editar] [Nova Cotação]                │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ⭐⭐⭐⭐ Peças Motor Express          FOR-00002 🟢      │   │
│ │ contato@pecasmotor.com | (11) 3456-7890               │   │
│ │ 🏷️ Peças Motor, Juntas                                │   │
│ │ 📊 Entrega: 88% | Qualidade: 92% | Preço: 90%        │   │
│ │ [Ver Detalhes] [Editar] [Nova Cotação]                │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ⭐⭐⭐ Ferramentas ABC                FOR-00003 🔴      │   │
│ │ vendas@ferrabc.com | (11) 2345-6789                   │   │
│ │ 🏷️ Ferramentas, Consumíveis                           │   │
│ │ 📊 Entrega: 65% | Qualidade: 70% | Preço: 95%        │   │
│ │ [Ver Detalhes] [Editar] [Reativar]                    │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### Cenário 1: Cadastro Bem-Sucedido
```gherkin
Given usuário está na página de fornecedores
When clicar em "Novo Fornecedor"
And preencher todos os campos obrigatórios
And CNPJ for válido e não duplicado
And selecionar ao menos uma categoria
Then fornecedor deve ser cadastrado
And mensagem de sucesso deve aparecer
And fornecedor deve aparecer na lista
```

### Cenário 2: CNPJ Inválido
```gherkin
Given usuário está no formulário de fornecedor
When preencher CNPJ "12.345.678/9012-34"
And tentar salvar
Then deve exibir erro "CNPJ inválido"
And não deve permitir submit
```

### Cenário 3: CNPJ Duplicado
```gherkin
Given já existe fornecedor com CNPJ "11.222.333/0001-81"
When tentar cadastrar novo fornecedor
And usar mesmo CNPJ
Then deve exibir erro "CNPJ já cadastrado"
And sugerir editar fornecedor existente
```

---

## ✓ Definition of Done

- [ ] Tabela `suppliers` criada no banco
- [ ] RLS policies implementadas
- [ ] Trigger para código automático
- [ ] Schema Zod `supplierSchema.ts`
- [ ] Hook `useSuppliers.ts` com CRUD
- [ ] Componente `SupplierForm.tsx`
- [ ] Componente `SupplierList.tsx`
- [ ] Componente `SupplierCard.tsx`
- [ ] Validação de CNPJ implementada
- [ ] Check de duplicidade implementado
- [ ] Filtros por categoria e status
- [ ] Testes E2E com Playwright
- [ ] Documentação de API atualizada

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
