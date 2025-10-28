# US-EST-001: Cadastrar Peças no Catálogo

**ID:** US-EST-001  
**Epic:** Estoque  
**Sprint:** 5  
**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente de estoque  
**Quero** cadastrar peças com especificações técnicas completas  
**Para** manter catálogo organizado e facilitar controle de inventário

---

## 🎯 Business Objective

Criar catálogo centralizado de peças com informações técnicas, controle de estoque e rastreabilidade para gestão eficiente de inventário.

---

## ✅ Acceptance Criteria

**AC01:** Formulário de cadastro com campos obrigatórios e opcionais  
**AC02:** Código único auto-gerado ou manual  
**AC03:** Validação de duplicidade de código  
**AC04:** Categoria e subcategoria hierárquicas  
**AC05:** Especificações técnicas (dimensões, peso, material)  
**AC06:** Níveis de estoque (mínimo, máximo, ponto pedido)  
**AC07:** Upload de imagem da peça  
**AC08:** Lista com busca, filtros e ordenação  
**AC09:** Badge visual de status (ativo, inativo, baixo estoque)  
**AC10:** Exportar lista em Excel/PDF

---

## 📐 Business Rules

### RN-EST-001: Estrutura da Peça
```typescript
interface Part {
  id: string;
  org_id: string;
  
  // Identificação
  code: string;                    // Código único (ex: PEC-00001)
  name: string;                    // Nome da peça
  description?: string;            // Descrição detalhada
  alternative_codes?: string[];    // Códigos alternativos
  
  // Categorização
  category: PartCategory;
  subcategory?: string;
  manufacturer?: string;
  
  // Especificações Técnicas
  technical_specs?: {
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      unit: 'mm' | 'cm' | 'm';
    };
    weight?: {
      value: number;
      unit: 'g' | 'kg';
    };
    material?: string;
    color?: string;
    finish?: string;
  };
  
  // Medidas
  unit: 'un' | 'kg' | 'm' | 'l' | 'par';
  
  // Controle de Estoque
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  economic_order_quantity?: number;
  
  // Financeiro
  average_cost: number;            // Custo médio ponderado
  last_purchase_price?: number;
  sale_price?: number;
  
  // Localização
  storage_location?: string;
  warehouse_section?: string;
  shelf?: string;
  bin?: string;
  
  // Fornecedores
  primary_supplier_id?: string;
  alternative_suppliers?: string[];
  
  // Status
  active: boolean;
  discontinued: boolean;
  discontinued_reason?: string;
  
  // Imagem
  image_url?: string;
  
  // Metadata
  notes?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

type PartCategory = 
  | 'pecas_motor'
  | 'rolamentos'
  | 'retentores'
  | 'juntas'
  | 'parafusos'
  | 'ferramentas'
  | 'consumiveis'
  | 'outros';
```

### RN-EST-002: Código de Peça
```typescript
// Formato sugerido: {CATEGORIA}-{TIPO}-{SEQUENCIAL}
// Exemplo: MOT-BIE-00001 (Motor - Biela - 00001)

async function generatePartCode(
  category: string,
  orgId: string
): Promise<string> {
  const prefix = getCategoryPrefix(category);
  
  const { data } = await supabase
    .from('parts')
    .select('code')
    .eq('org_id', orgId)
    .like('code', `${prefix}-%`)
    .order('code', { ascending: false })
    .limit(1)
    .single();
  
  let sequence = 1;
  if (data) {
    const lastSeq = parseInt(data.code.split('-').pop() || '0');
    sequence = lastSeq + 1;
  }
  
  return `${prefix}-${String(sequence).padStart(5, '0')}`;
}

function getCategoryPrefix(category: string): string {
  const prefixes = {
    pecas_motor: 'MOT',
    rolamentos: 'ROL',
    retentores: 'RET',
    juntas: 'JUN',
    parafusos: 'PAR',
    ferramentas: 'FER',
    consumiveis: 'CON',
    outros: 'OUT',
  };
  return prefixes[category] || 'PEC';
}
```

### RN-EST-003: Validações
```typescript
const partValidations = {
  code: {
    unique: true,
    maxLength: 20,
    pattern: /^[A-Z]{3}-[0-9]{5}$/,
  },
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  current_stock: {
    min: 0,
    type: 'number',
  },
  minimum_stock: {
    required: true,
    min: 0,
  },
  reorder_point: {
    validation: (value, part) => value >= part.minimum_stock,
  },
  maximum_stock: {
    validation: (value, part) => value >= part.reorder_point,
  },
  average_cost: {
    required: true,
    min: 0,
  },
};
```

### RN-EST-004: Permissões
```typescript
const partPermissions = {
  create: ['admin', 'manager', 'warehouse'],
  read: ['all'],
  update: ['admin', 'manager', 'warehouse'],
  delete: ['admin'],
  inactive: ['admin', 'manager'],
};
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  
  -- Identificação
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  alternative_codes TEXT[],
  
  -- Categorização
  category TEXT NOT NULL,
  subcategory TEXT,
  manufacturer TEXT,
  
  -- Especificações
  technical_specs JSONB DEFAULT '{}'::jsonb,
  
  -- Medidas
  unit TEXT NOT NULL DEFAULT 'un',
  
  -- Controle de Estoque
  current_stock NUMERIC(10,3) NOT NULL DEFAULT 0,
  minimum_stock NUMERIC(10,3) NOT NULL DEFAULT 0,
  maximum_stock NUMERIC(10,3) DEFAULT 0,
  reorder_point NUMERIC(10,3) DEFAULT 0,
  economic_order_quantity NUMERIC(10,3),
  
  -- Financeiro
  average_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_purchase_price NUMERIC(10,2),
  sale_price NUMERIC(10,2),
  
  -- Localização
  storage_location TEXT,
  warehouse_section TEXT,
  shelf TEXT,
  bin TEXT,
  
  -- Fornecedores
  primary_supplier_id UUID REFERENCES suppliers(id),
  alternative_suppliers UUID[],
  
  -- Status
  active BOOLEAN NOT NULL DEFAULT true,
  discontinued BOOLEAN DEFAULT false,
  discontinued_reason TEXT,
  
  -- Imagem
  image_url TEXT,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(org_id, code),
  CHECK (current_stock >= 0),
  CHECK (minimum_stock >= 0),
  CHECK (maximum_stock >= reorder_point),
  CHECK (reorder_point >= minimum_stock)
);

-- Índices
CREATE INDEX idx_parts_org ON parts(org_id);
CREATE INDEX idx_parts_code ON parts(code);
CREATE INDEX idx_parts_category ON parts(category);
CREATE INDEX idx_parts_active ON parts(active) WHERE active = true;
CREATE INDEX idx_parts_low_stock ON parts(current_stock, minimum_stock) 
  WHERE current_stock <= minimum_stock;
CREATE INDEX idx_parts_alternative_codes ON parts USING GIN(alternative_codes);

-- Full-text search
CREATE INDEX idx_parts_search ON parts USING GIN(
  to_tsvector('portuguese', coalesce(code, '') || ' ' || 
                            coalesce(name, '') || ' ' || 
                            coalesce(description, ''))
);

-- RLS
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view parts from their organization"
  ON parts FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert parts in their organization"
  ON parts FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update parts in their organization"
  ON parts FOR UPDATE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can delete parts"
  ON parts FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  ));

-- Trigger para código automático
CREATE OR REPLACE FUNCTION generate_part_code()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  last_seq INTEGER;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    -- Gera prefix baseado na categoria
    prefix := CASE NEW.category
      WHEN 'pecas_motor' THEN 'MOT'
      WHEN 'rolamentos' THEN 'ROL'
      WHEN 'retentores' THEN 'RET'
      WHEN 'juntas' THEN 'JUN'
      WHEN 'parafusos' THEN 'PAR'
      WHEN 'ferramentas' THEN 'FER'
      WHEN 'consumiveis' THEN 'CON'
      ELSE 'PEC'
    END;
    
    -- Busca último sequencial
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(code FROM '\d+$') AS INTEGER)), 
      0
    ) INTO last_seq
    FROM parts
    WHERE org_id = NEW.org_id
    AND code LIKE prefix || '-%';
    
    NEW.code := prefix || '-' || LPAD((last_seq + 1)::TEXT, 5, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_part_code
  BEFORE INSERT ON parts
  FOR EACH ROW
  EXECUTE FUNCTION generate_part_code();

-- Trigger para updated_at
CREATE TRIGGER update_parts_updated_at
  BEFORE UPDATE ON parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View de peças com baixo estoque
CREATE VIEW parts_low_stock AS
SELECT 
  p.*,
  s.trade_name AS supplier_name,
  CASE 
    WHEN p.current_stock = 0 THEN 'critical'
    WHEN p.current_stock <= p.reorder_point THEN 'urgent'
    WHEN p.current_stock <= p.minimum_stock THEN 'low'
    ELSE 'normal'
  END AS stock_status
FROM parts p
LEFT JOIN suppliers s ON s.id = p.primary_supplier_id
WHERE p.active = true
AND p.current_stock <= p.minimum_stock
ORDER BY p.current_stock ASC;

GRANT SELECT ON parts_low_stock TO authenticated;
```

---

## 🎨 Implementation

### Schema de Validação (Zod)

```typescript
// src/schemas/partSchema.ts
import { z } from 'zod';

export const partSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  alternative_codes: z.array(z.string()).optional(),
  
  category: z.enum([
    'pecas_motor',
    'rolamentos',
    'retentores',
    'juntas',
    'parafusos',
    'ferramentas',
    'consumiveis',
    'outros',
  ]),
  subcategory: z.string().optional(),
  manufacturer: z.string().optional(),
  
  technical_specs: z.object({
    dimensions: z.object({
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      unit: z.enum(['mm', 'cm', 'm']).optional(),
    }).optional(),
    weight: z.object({
      value: z.number().optional(),
      unit: z.enum(['g', 'kg']).optional(),
    }).optional(),
    material: z.string().optional(),
    color: z.string().optional(),
    finish: z.string().optional(),
  }).optional(),
  
  unit: z.enum(['un', 'kg', 'm', 'l', 'par']).default('un'),
  
  minimum_stock: z.number().min(0, 'Estoque mínimo não pode ser negativo'),
  maximum_stock: z.number().min(0).optional(),
  reorder_point: z.number().min(0).optional(),
  economic_order_quantity: z.number().min(0).optional(),
  
  average_cost: z.number().min(0, 'Custo não pode ser negativo'),
  last_purchase_price: z.number().min(0).optional(),
  sale_price: z.number().min(0).optional(),
  
  storage_location: z.string().optional(),
  warehouse_section: z.string().optional(),
  shelf: z.string().optional(),
  bin: z.string().optional(),
  
  primary_supplier_id: z.string().uuid().optional(),
  alternative_suppliers: z.array(z.string().uuid()).optional(),
  
  active: z.boolean().default(true),
  
  image_url: z.string().url().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => !data.reorder_point || data.reorder_point >= data.minimum_stock,
  {
    message: 'Ponto de pedido deve ser maior ou igual ao estoque mínimo',
    path: ['reorder_point'],
  }
).refine(
  (data) => !data.maximum_stock || !data.reorder_point || data.maximum_stock >= data.reorder_point,
  {
    message: 'Estoque máximo deve ser maior ou igual ao ponto de pedido',
    path: ['maximum_stock'],
  }
);

export type PartFormData = z.infer<typeof partSchema>;
```

---

## 🖼️ Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ Catálogo de Peças                        [+ Nova Peça]  [≡] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ [Buscar peça...]                          [Filtros ▼]       │
│ [Categoria ▼] [Status ▼] [Estoque ▼]                       │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📦 MOT-00001 - Biela Completa           🟢 Ativo      │   │
│ │    Rolamentos / Motor                                  │   │
│ │    Estoque: 15 un | Mínimo: 5 | Custo: R$ 85,00      │   │
│ │    📍 Armazém A - Seção 2 - Prateleira B3             │   │
│ │    [Ver] [Editar] [Movimentar]                         │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📦 ROL-00045 - Rolamento 6204           🔴 Baixo      │   │
│ │    Rolamentos                                          │   │
│ │    Estoque: 2 un | Mínimo: 10 | Custo: R$ 15,90      │   │
│ │    📍 Armazém A - Seção 1 - Prateleira A2             │   │
│ │    [Ver] [Editar] [Comprar]                            │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### Cenário 1: Cadastro Bem-Sucedido
```gherkin
Given usuário está na página de catálogo
When clicar em "Nova Peça"
And preencher campos obrigatórios
And código não existir
Then peça deve ser cadastrada
And código auto-gerado se não informado
And aparecer na lista
```

### Cenário 2: Código Duplicado
```gherkin
Given já existe peça com código "MOT-00001"
When tentar cadastrar nova peça
And usar mesmo código
Then deve exibir erro "Código já existe"
And não permitir salvar
```

### Cenário 3: Busca por Código Alternativo
```gherkin
Given peça tem código "MOT-00001"
And código alternativo "BIE-OLD-123"
When buscar por "BIE-OLD-123"
Then deve encontrar a peça MOT-00001
```

---

## ✓ Definition of Done

- [x] Tabela `parts` criada no banco
- [x] RLS policies implementadas
- [x] Triggers (código auto, updated_at)
- [x] View `parts_low_stock`
- [x] Schema Zod `partSchema.ts`
- [ ] Hook `useParts.ts` com CRUD
- [ ] Componente `PartForm.tsx`
- [ ] Componente `PartList.tsx`
- [ ] Componente `PartCard.tsx`
- [ ] Busca full-text implementada
- [ ] Filtros por categoria/status
- [ ] Upload de imagem
- [ ] Testes E2E com Playwright
- [ ] Documentação de API

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
