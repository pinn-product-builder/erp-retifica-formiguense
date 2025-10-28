# US-EST-001: Cadastrar Catálogo de Peças

**ID:** US-EST-001  
**Epic:** Estoque  
**Sprint:** 6  
**Prioridade:** Crítica  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente de estoque  
**Quero** cadastrar peças no catálogo com todas as especificações técnicas  
**Para** manter controle organizado do inventário de peças

---

## 🎯 Business Objective

Criar catálogo completo e bem estruturado de peças, permitindo identificação única, categorização e rastreamento eficiente.

---

## 📐 Business Rules

### RN-EST-001: Estrutura da Peça
```typescript
interface Part {
  id: string;
  org_id: string;
  
  // Identificação
  code: string;                    // Código único da peça
  name: string;                    // Nome/descrição
  description?: string;            // Descrição detalhada
  
  // Categorização
  category: PartCategory;          // Categoria principal
  component?: ComponentType;       // bloco, cabeçote, etc.
  subcategory?: string;           // Subcategoria
  
  // Especificações
  manufacturer?: string;           // Fabricante original
  oem_code?: string;              // Código OEM
  alternative_codes?: string[];   // Códigos alternativos
  
  // Medidas
  unit_of_measure: string;        // un, kg, m, l, etc.
  weight?: number;                // Peso unitário
  dimensions?: {                  // Dimensões (LxWxH)
    length: number;
    width: number;
    height: number;
  };
  
  // Estoque
  current_stock: number;          // Saldo atual
  minimum_stock: number;          // Estoque mínimo
  maximum_stock: number;          // Estoque máximo
  reorder_point: number;          // Ponto de pedido
  economic_order_quantity: number; // Lote econômico
  
  // Financeiro
  average_cost: number;           // Custo médio
  last_purchase_price?: number;   // Último preço de compra
  selling_price?: number;         // Preço de venda
  
  // Localização
  location: string;               // Localização física
  warehouse?: string;             // Almoxarifado
  shelf?: string;                 // Prateleira
  bin?: string;                   // Gaveta/bin
  
  // Fornecedores
  primary_supplier_id?: string;
  alternative_suppliers?: string[];
  
  // Status
  active: boolean;
  discontinued: boolean;
  
  // Metadados
  notes?: string;
  image_url?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
```

### RN-EST-002: Categorias de Peças
```typescript
type PartCategory =
  | 'motor_parts'        // Peças de motor
  | 'bearings'           // Bronzinas e buchas
  | 'gaskets'            // Juntas e retentores
  | 'bolts_nuts'         // Parafusos e porcas
  | 'tools'              // Ferramentas
  | 'consumables'        // Consumíveis
  | 'lubricants'         // Óleos e lubrificantes
  | 'chemicals'          // Produtos químicos
  | 'other';             // Outros

// Subcategorias por categoria principal
const subcategories = {
  motor_parts: ['Pistão', 'Anel', 'Válvula', 'Guia', 'Sede'],
  bearings: ['Bronzina de biela', 'Bronzina de mancal', 'Bucha'],
  gaskets: ['Junta de cabeçote', 'Retentor', 'Anel O-ring'],
  // ...
};
```

### RN-EST-003: Código da Peça
**Formato sugerido:** `{CATEGORIA}-{TIPO}-{SEQ}`

**Exemplos:**
- `MOT-PIST-0001` (Motor - Pistão - 001)
- `BRO-BIEL-0052` (Bronzina - Biela - 052)
- `JUN-CAB-0015` (Junta - Cabeçote - 015)

**Regras:**
- Código deve ser único na organização
- Aceita códigos customizados (não obriga formato)
- Suporta códigos OEM e alternativos
- Busca por qualquer código (principal ou alternativo)

### RN-EST-004: Validações
- **Código**: Obrigatório e único
- **Nome**: Mínimo 3 caracteres
- **Categoria**: Obrigatória
- **Unidade de medida**: Obrigatória
- **Estoque mínimo**: ≥ 0
- **Estoque máximo**: ≥ estoque mínimo
- **Custo médio**: ≥ 0

### RN-EST-005: Estoque Inicial
- Ao cadastrar peça, saldo inicia em zero
- Entrada inicial deve ser feita via movimentação
- Não permite entrada de saldo direto no cadastro

### RN-EST-006: Permissões
- **Admin/Gerente**: CRUD completo
- **Almoxarife**: CRUD (exceto custos)
- **Técnico**: Apenas visualização
- **Consultor**: Visualização + verificar disponibilidade

---

## ✅ Acceptance Criteria

**AC1:** Formulário de cadastro com todos os campos especificados  
**AC2:** Código é validado como único antes de salvar  
**AC3:** Categorias são exibidas em select com subcategorias  
**AC4:** Upload de imagem da peça é opcional  
**AC5:** Lista de peças mostra código, nome, categoria e estoque atual  
**AC6:** Busca funciona por código, nome ou código alternativo  
**AC7:** Filtros por categoria e status (ativo/inativo) funcionam

---

## 🛠️ Definition of Done

- [ ] Tabela `parts` criada com todos os campos
- [ ] Componente `PartForm.tsx` implementado
- [ ] Hook `useParts.ts` criado
- [ ] Validações Zod implementadas
- [ ] Upload de imagem configurado
- [ ] Listagem com busca e filtros funcional
- [ ] RLS policies criadas
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/stock/
  ├── PartForm.tsx                 (NEW)
  ├── PartList.tsx                 (NEW)
  └── PartFilters.tsx              (NEW)

src/pages/
  └── Estoque.tsx                  (NEW)

src/hooks/
  └── useParts.ts                  (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela principal de peças
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  
  -- Identificação
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Categorização
  category TEXT NOT NULL CHECK (category IN (
    'motor_parts', 'bearings', 'gaskets', 'bolts_nuts',
    'tools', 'consumables', 'lubricants', 'chemicals', 'other'
  )),
  component TEXT CHECK (component IN (
    'bloco', 'cabecote', 'virabrequim', 'biela',
    'pistao', 'comando', 'eixo'
  )),
  subcategory TEXT,
  
  -- Especificações
  manufacturer TEXT,
  oem_code TEXT,
  alternative_codes TEXT[],
  
  -- Medidas
  unit_of_measure TEXT NOT NULL DEFAULT 'un',
  weight NUMERIC(10,3),
  dimensions JSONB,  -- {length, width, height}
  
  -- Estoque
  current_stock NUMERIC(10,3) DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock NUMERIC(10,3) DEFAULT 0 CHECK (minimum_stock >= 0),
  maximum_stock NUMERIC(10,3) CHECK (maximum_stock >= minimum_stock),
  reorder_point NUMERIC(10,3) DEFAULT 0,
  economic_order_quantity NUMERIC(10,3),
  
  -- Financeiro
  average_cost NUMERIC(10,2) DEFAULT 0 CHECK (average_cost >= 0),
  last_purchase_price NUMERIC(10,2),
  selling_price NUMERIC(10,2),
  
  -- Localização
  location TEXT,
  warehouse TEXT,
  shelf TEXT,
  bin TEXT,
  
  -- Fornecedores
  primary_supplier_id UUID REFERENCES suppliers(id),
  alternative_suppliers UUID[],
  
  -- Status
  active BOOLEAN DEFAULT true,
  discontinued BOOLEAN DEFAULT false,
  
  -- Metadados
  notes TEXT,
  image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(org_id, code)
);

-- Índices para performance
CREATE INDEX idx_parts_org ON parts(org_id);
CREATE INDEX idx_parts_code ON parts(code);
CREATE INDEX idx_parts_category ON parts(category);
CREATE INDEX idx_parts_component ON parts(component);
CREATE INDEX idx_parts_active ON parts(active);
CREATE INDEX idx_parts_stock ON parts(current_stock);

-- Índice GIN para busca em arrays (códigos alternativos)
CREATE INDEX idx_parts_alternative_codes ON parts USING GIN(alternative_codes);

-- Índice para busca full-text
CREATE INDEX idx_parts_search ON parts USING GIN(
  to_tsvector('portuguese', name || ' ' || COALESCE(description, ''))
);

-- RLS Policies
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view parts of their org"
  ON parts FOR SELECT
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Managers can create parts"
  ON parts FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'gerente', 'almoxarife')
    )
  );

CREATE POLICY "Managers can update parts"
  ON parts FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'gerente', 'almoxarife')
    )
  );

CREATE POLICY "Admins can delete parts"
  ON parts FOR DELETE
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER trg_update_parts_timestamp
  BEFORE UPDATE ON parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View para peças com estoque baixo
CREATE OR REPLACE VIEW parts_low_stock AS
SELECT 
  p.*,
  (p.minimum_stock - p.current_stock) AS quantity_needed,
  CASE 
    WHEN p.current_stock = 0 THEN 'out_of_stock'
    WHEN p.current_stock <= p.reorder_point THEN 'critical'
    WHEN p.current_stock <= p.minimum_stock THEN 'low'
    ELSE 'ok'
  END AS stock_status
FROM parts p
WHERE p.active = true
AND p.current_stock <= p.minimum_stock
ORDER BY (p.minimum_stock - p.current_stock) DESC;

-- Permissões na view
GRANT SELECT ON parts_low_stock TO authenticated;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  📦 Estoque - Catálogo de Peças              [+ Nova Peça]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Buscar: [🔍 Código, nome ou descrição_________________]     │
│                                                               │
│  Filtros:                                                     │
│  Categoria: [Todas ▼]  Componente: [Todos ▼]  Status: [✓]   │
│  Estoque: [ ] Apenas com estoque baixo                       │
│                                              [📥 Exportar]   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Código    │ Nome              │ Categoria │ Estoque     ││
│  ├───────────┼───────────────────┼───────────┼─────────────┤│
│  │ MOT-PIST  │ Pistão 86mm      │ Peças     │ 15 un       ││
│  │ -0001     │ Mercedes OM 906   │ Motor     │ ⚠️ Baixo   ││
│  │           │ [✏️ Editar] [👁️ Ver]                       ││
│  ├───────────┼───────────────────┼───────────┼─────────────┤│
│  │ BRO-BIEL  │ Bronzina biela   │ Bronzinas │ 8 un        ││
│  │ -0052     │ 0.50mm STD        │           │ 🔴 Crítico ││
│  │           │ [✏️ Editar] [👁️ Ver]                       ││
│  ├───────────┼───────────────────┼───────────┼─────────────┤│
│  │ JUN-CAB   │ Junta cabeçote   │ Juntas    │ 25 un       ││
│  │ -0015     │ OM 906            │           │ ✅ Ok       ││
│  │           │ [✏️ Editar] [👁️ Ver]                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Mostrando 3 de 127 peças       [< 1 2 3 4 5 >]             │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Cadastrar Nova Peça                                    [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  IDENTIFICAÇÃO                                                │
│  ──────────────────────────────────────────────────────────  │
│  Código da Peça: *                                           │
│  [MOT-PIST-0001__________________]                           │
│  ℹ️ Código único da peça no sistema                         │
│                                                               │
│  Nome da Peça: *                                             │
│  [Pistão 86mm Mercedes OM 906____]                           │
│                                                               │
│  Descrição (opcional):                                       │
│  [Pistão completo com pino e travas, medida STD 86mm       ]│
│  [para motores Mercedes OM 906                              ]│
│                                                               │
│  CATEGORIZAÇÃO                                                │
│  ──────────────────────────────────────────────────────────  │
│  Categoria: *                    Subcategoria:               │
│  [Peças de Motor ▼]              [Pistão ▼]                  │
│                                                               │
│  Componente Relacionado:                                     │
│  [Bloco ▼]                                                    │
│                                                               │
│  ESPECIFICAÇÕES                                               │
│  ──────────────────────────────────────────────────────────  │
│  Fabricante:                     Código OEM:                 │
│  [Mahle______________]           [22855900________]          │
│                                                               │
│  Códigos Alternativos (separados por vírgula):              │
│  [A4570310101, 906-030-03-17_____]                           │
│                                                               │
│  Unidade de Medida: *                                        │
│  (•) Unidade (un)  [ ] Quilograma (kg)  [ ] Metro (m)       │
│  [ ] Litro (l)     [ ] Outro: [________]                     │
│                                                               │
│  CONTROLE DE ESTOQUE                                          │
│  ──────────────────────────────────────────────────────────  │
│  Estoque Mínimo: *      Estoque Máximo:    Ponto de Pedido: │
│  [10__] un              [50__] un          [15__] un         │
│                                                               │
│  Lote Econômico de Compra:                                   │
│  [20__] un                                                    │
│  ℹ️ Quantidade ideal para cada pedido de compra              │
│                                                               │
│  FINANCEIRO                                                   │
│  ──────────────────────────────────────────────────────────  │
│  Custo Médio:           Preço de Venda (sugerido):          │
│  [R$ 0,00_]             [R$ 0,00_________]                   │
│  (Será calculado automaticamente com as compras)             │
│                                                               │
│  LOCALIZAÇÃO FÍSICA                                           │
│  ──────────────────────────────────────────────────────────  │
│  Almoxarifado:          Prateleira:        Gaveta/Bin:       │
│  [Principal ▼]          [A3__]             [15__]            │
│                                                               │
│  Localização Completa:                                       │
│  [Principal - A3 - 15____]                                    │
│                                                               │
│  FORNECEDORES                                                 │
│  ──────────────────────────────────────────────────────────  │
│  Fornecedor Principal:                                       │
│  [Auto Peças ABC Ltda ▼]         [+ Novo Fornecedor]        │
│                                                               │
│  Fornecedores Alternativos:                                  │
│  [☑ Retífica XYZ]  [☑ Diesel Parts]  [ ] Motor Service      │
│                                                               │
│  IMAGEM DA PEÇA (opcional)                                    │
│  ──────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  📷 Arraste uma imagem ou clique para selecionar        ││
│  │                                                          ││
│  │  Formatos: JPG, PNG | Tamanho máximo: 2 MB              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Observações (opcional):                                     │
│  [____________________________________________________________]│
│  [Verificar compatibilidade com outros modelos OM 924/926   ]│
│                                                               │
│  Status:                                                      │
│  [✓] Ativo      [ ] Descontinuado                            │
│                                                               │
│                            [Cancelar]  [💾 Salvar Peça]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Cadastrar Peça Completa
```gherkin
Given que estou na tela de cadastro de peças
When preencho todos os campos obrigatórios
And seleciono categoria "Peças de Motor"
And defino estoque mínimo "10" e máximo "50"
And clico em "Salvar Peça"
Then peça é criada com sucesso
And código é único no sistema
And saldo inicial é zero
And aparece na listagem
```

### E2E Test 2: Validação de Código Duplicado
```gherkin
Given que já existe peça com código "MOT-PIST-0001"
When tento cadastrar nova peça com mesmo código
And clico em "Salvar"
Then erro de validação aparece
And mensagem: "Código já existe no sistema"
And peça não é salva
```

### E2E Test 3: Buscar Peça por Código Alternativo
```gherkin
Given que peça "MOT-PIST-0001" tem código alternativo "A4570310101"
When busco por "A4570310101"
Then peça "MOT-PIST-0001" aparece nos resultados
```

### E2E Test 4: Filtrar por Estoque Baixo
```gherkin
Given que tenho peças com estoque acima e abaixo do mínimo
When marco filtro "Apenas com estoque baixo"
And aplico filtros
Then apenas peças com current_stock <= minimum_stock aparecem
And badge de alerta é exibido
```

### E2E Test 5: Upload de Imagem
```gherkin
Given que estou cadastrando peça
When faço upload de imagem válida (JPG, 1.5MB)
Then imagem é enviada para Supabase Storage
And URL é salva no campo image_url
And thumbnail aparece no formulário
```

### E2E Test 6: Validação de Estoque Máximo
```gherkin
Given que defino estoque mínimo "20"
When tento definir estoque máximo "10"
And tento salvar
Then erro de validação aparece
And mensagem: "Estoque máximo deve ser maior que o mínimo"
```

### E2E Test 7: Editar Peça Existente
```gherkin
Given que tenho peça cadastrada
When clico em "Editar"
And altero nome e categoria
And salvo alterações
Then peça é atualizada
And updated_at é atualizado
And histórico registra alteração
```

---

## 🚫 Negative Scope

**Não inclui:**
- Gestão de lotes (FIFO/FEFO)
- Controle de validade
- Rastreamento por número de série
- Importação em massa de peças (CSV)
- Integração com catálogos externos

---

## 🔗 Dependencies

**Blocks:**
- US-EST-002 (Controlar Saldo)
- US-EST-003 (Movimentações)
- Todas as outras US de estoque

**Blocked by:**
- Nenhuma

**Related:**
- US-COMP-001 (Cadastrar Fornecedores)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
