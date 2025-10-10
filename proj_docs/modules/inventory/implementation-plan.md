# 📦 Plano de Implementação - Módulo de Inventário

## 📋 Visão Geral

**Status Atual:** 30% Completo  
**Prioridade:** Alta  
**Prazo Estimado:** 3-4 semanas  
**Complexidade:** Média-Alta

### ✅ Já Implementado
- Tabela `parts_inventory` com multi-tenancy
- Sistema de reservas automáticas (`parts_reservations`)
- Alertas de estoque baixo
- Necessidades de compra automáticas
- CRUD básico de peças
- Página de Estoque com interface funcional
- Hook `usePartsInventory` com filtros

### 🎯 Objetivo
Implementar funcionalidades pendentes de movimentação e controle de inventário, mantendo:
- Clean Architecture
- Multi-tenancy (isolamento por `org_id`)
- Auditoria completa (quem/quando/o quê)
- Validações frontend + backend
- Responsividade mobile/tablet/desktop

---

## 🗂️ FASE 1: Movimentação de Estoque (1 semana)

### 📊 1.1 Estrutura de Dados

#### Nova Tabela: `inventory_movements`
```sql
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  part_id UUID NOT NULL REFERENCES parts_inventory(id),
  movement_type TEXT NOT NULL, -- 'entrada', 'saida', 'ajuste', 'transferencia', 'reserva', 'baixa'
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  order_id UUID REFERENCES orders(id),
  budget_id UUID REFERENCES detailed_budgets(id),
  reason TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadados adicionais
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_movement_type CHECK (
    movement_type IN ('entrada', 'saida', 'ajuste', 'transferencia', 'reserva', 'baixa')
  ),
  CONSTRAINT valid_quantity CHECK (quantity != 0)
);

-- Índices para performance
CREATE INDEX idx_inventory_movements_org_id ON inventory_movements(org_id);
CREATE INDEX idx_inventory_movements_part_id ON inventory_movements(part_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at DESC);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);

-- RLS Policies
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view movements from their org"
  ON inventory_movements FOR SELECT
  USING (org_id IN (
    SELECT organization_id FROM organization_users 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can create movements in their org"
  ON inventory_movements FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
    AND created_by = auth.uid()
  );
```

#### Nova Tabela: `inventory_locations` (opcional - para multi-localidade)
```sql
CREATE TABLE inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_location_code_per_org UNIQUE (org_id, code)
);
```

### 🔧 1.2 Backend - Triggers e Functions

#### Trigger: Atualizar quantidade automaticamente
```sql
CREATE OR REPLACE FUNCTION update_inventory_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar quantidade na tabela parts_inventory
  UPDATE parts_inventory
  SET 
    quantity = NEW.new_quantity,
    updated_at = NOW()
  WHERE id = NEW.part_id;
  
  -- Criar alerta se estoque ficar baixo
  IF NEW.new_quantity <= (
    SELECT low_stock_threshold FROM parts_inventory WHERE id = NEW.part_id
  ) THEN
    INSERT INTO alerts (
      org_id,
      alert_type,
      title,
      message,
      severity,
      reference_id,
      reference_type
    ) VALUES (
      NEW.org_id,
      'low_stock',
      'Estoque Baixo',
      'A peça ' || (SELECT part_name FROM parts_inventory WHERE id = NEW.part_id) || ' está com estoque baixo.',
      'warning',
      NEW.part_id::TEXT,
      'parts_inventory'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_on_movement
  AFTER INSERT ON inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_movement();
```

### 💻 1.3 Frontend - Hook `useInventoryMovements`

**Arquivo:** `src/hooks/useInventoryMovements.ts`

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export type MovementType = 'entrada' | 'saida' | 'ajuste' | 'transferencia' | 'reserva' | 'baixa';

export interface InventoryMovement {
  id: string;
  org_id: string;
  part_id: string;
  movement_type: MovementType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  unit_cost?: number;
  order_id?: string;
  budget_id?: string;
  reason: string;
  notes?: string;
  created_by: string;
  created_at: string;
  metadata?: Record<string, any>;
  
  // Relacionamentos
  part?: {
    part_name: string;
    part_code: string;
  };
  created_by_user?: {
    name: string;
  };
}

export interface CreateMovementData {
  part_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number;
  order_id?: string;
  budget_id?: string;
  reason: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export function useInventoryMovements() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  // Buscar movimentações com filtros
  const fetchMovements = useCallback(async (filters?: {
    part_id?: string;
    movement_type?: MovementType;
    start_date?: string;
    end_date?: string;
    order_id?: string;
  }) => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);

      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          part:parts_inventory(part_name, part_code),
          created_by_user:user_basic_info(name)
        `)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (filters?.part_id) {
        query = query.eq('part_id', filters.part_id);
      }

      if (filters?.movement_type) {
        query = query.eq('movement_type', filters.movement_type);
      }

      if (filters?.start_date && filters?.end_date) {
        query = query.gte('created_at', filters.start_date)
                     .lte('created_at', filters.end_date);
      }

      if (filters?.order_id) {
        query = query.eq('order_id', filters.order_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMovements((data || []) as InventoryMovement[]);
      return data as InventoryMovement[];
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as movimentações',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  // Criar movimentação
  const createMovement = useCallback(async (movementData: CreateMovementData) => {
    if (!currentOrganization?.id) {
      toast({
        title: 'Erro',
        description: 'Organização não encontrada',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setLoading(true);

      // 1. Buscar quantidade atual da peça
      const { data: part, error: partError } = await supabase
        .from('parts_inventory')
        .select('quantity, part_name')
        .eq('id', movementData.part_id)
        .eq('org_id', currentOrganization.id)
        .single();

      if (partError) throw partError;

      // 2. Calcular nova quantidade
      let newQuantity = part.quantity;
      const quantityChange = movementData.quantity;

      switch (movementData.movement_type) {
        case 'entrada':
        case 'ajuste':
          newQuantity += quantityChange;
          break;
        case 'saida':
        case 'baixa':
          newQuantity -= quantityChange;
          break;
        case 'transferencia':
          // Implementar lógica de transferência entre locais
          newQuantity -= quantityChange;
          break;
      }

      // 3. Validar estoque negativo
      if (newQuantity < 0) {
        toast({
          title: 'Erro',
          description: `Estoque insuficiente. Disponível: ${part.quantity}`,
          variant: 'destructive',
        });
        return null;
      }

      // 4. Criar movimentação
      const { data: userData } = await supabase.auth.getUser();

      const { data: movement, error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          org_id: currentOrganization.id,
          part_id: movementData.part_id,
          movement_type: movementData.movement_type,
          quantity: movementData.quantity,
          previous_quantity: part.quantity,
          new_quantity: newQuantity,
          unit_cost: movementData.unit_cost,
          order_id: movementData.order_id,
          budget_id: movementData.budget_id,
          reason: movementData.reason,
          notes: movementData.notes,
          metadata: movementData.metadata,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (movementError) throw movementError;

      toast({
        title: 'Sucesso',
        description: `Movimentação de ${part.part_name} registrada com sucesso`,
      });

      // Recarregar lista
      fetchMovements();

      return movement as InventoryMovement;
    } catch (error) {
      console.error('Error creating movement:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a movimentação',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast, fetchMovements]);

  // Entrada manual de peças
  const registerEntry = useCallback(async (
    partId: string,
    quantity: number,
    unitCost: number,
    reason: string,
    notes?: string
  ) => {
    return createMovement({
      part_id: partId,
      movement_type: 'entrada',
      quantity,
      unit_cost: unitCost,
      reason,
      notes,
    });
  }, [createMovement]);

  // Saída manual (baixa)
  const registerExit = useCallback(async (
    partId: string,
    quantity: number,
    orderId: string | undefined,
    reason: string,
    notes?: string
  ) => {
    return createMovement({
      part_id: partId,
      movement_type: 'saida',
      quantity,
      order_id: orderId,
      reason,
      notes,
    });
  }, [createMovement]);

  // Ajuste de inventário
  const registerAdjustment = useCallback(async (
    partId: string,
    quantityDifference: number,
    reason: string,
    notes?: string
  ) => {
    return createMovement({
      part_id: partId,
      movement_type: 'ajuste',
      quantity: Math.abs(quantityDifference),
      reason,
      notes,
      metadata: { adjustment_type: quantityDifference > 0 ? 'increase' : 'decrease' },
    });
  }, [createMovement]);

  return {
    movements,
    loading,
    fetchMovements,
    createMovement,
    registerEntry,
    registerExit,
    registerAdjustment,
  };
}
```

### 🎨 1.4 Frontend - Componentes

#### `src/components/inventory/MovementForm.tsx`
- Formulário responsivo para registrar movimentações
- Seleção de peça (autocomplete)
- Tipo de movimentação (entrada/saída/ajuste)
- Quantidade com validação
- Motivo obrigatório
- Observações opcionais

#### `src/components/inventory/MovementHistory.tsx`
- Tabela de histórico de movimentações
- Filtros: data, tipo, peça
- Badges coloridos por tipo
- Exibir usuário que realizou
- Detalhes expandíveis

#### `src/components/inventory/MovementModal.tsx`
- Modal para criar movimentação rápida
- Integrado com a página de Estoque

---

## 📊 FASE 2: Inventário e Contagem Física (1 semana)

### 📋 2.1 Estrutura de Dados

#### Nova Tabela: `inventory_counts`
```sql
CREATE TABLE inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  count_number TEXT NOT NULL, -- Formato: INV-2025-0001
  count_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, in_progress, completed, cancelled
  counted_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT unique_count_number_per_org UNIQUE (org_id, count_number),
  CONSTRAINT valid_count_status CHECK (
    status IN ('draft', 'in_progress', 'completed', 'cancelled')
  )
);

CREATE TABLE inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts_inventory(id),
  expected_quantity INTEGER NOT NULL, -- Quantidade no sistema
  counted_quantity INTEGER, -- Quantidade contada fisicamente
  difference INTEGER GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
  unit_cost DECIMAL(10,2),
  notes TEXT,
  counted_by UUID REFERENCES auth.users(id),
  counted_at TIMESTAMPTZ,
  
  CONSTRAINT unique_part_per_count UNIQUE (count_id, part_id)
);

-- Índices
CREATE INDEX idx_inventory_counts_org_id ON inventory_counts(org_id);
CREATE INDEX idx_inventory_counts_status ON inventory_counts(status);
CREATE INDEX idx_inventory_count_items_count_id ON inventory_count_items(count_id);

-- RLS Policies (omitidas para brevidade - seguir padrão multi-tenant)
```

### 🔧 2.2 Lógica de Negócio

#### Function: Gerar número do inventário
```sql
CREATE OR REPLACE FUNCTION generate_inventory_count_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_count_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(count_number FROM 'INV-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM inventory_counts
  WHERE org_id = p_org_id
    AND count_number LIKE 'INV-' || v_year || '-%';
  
  v_count_number := 'INV-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_count_number;
END;
$$ LANGUAGE plpgsql;
```

#### Function: Processar ajustes após contagem
```sql
CREATE OR REPLACE FUNCTION process_inventory_count_adjustments(p_count_id UUID)
RETURNS VOID AS $$
DECLARE
  v_org_id UUID;
  v_item RECORD;
BEGIN
  -- Buscar org_id da contagem
  SELECT org_id INTO v_org_id
  FROM inventory_counts
  WHERE id = p_count_id;
  
  -- Para cada item com diferença
  FOR v_item IN 
    SELECT * FROM inventory_count_items
    WHERE count_id = p_count_id
      AND counted_quantity IS NOT NULL
      AND difference != 0
  LOOP
    -- Criar movimentação de ajuste
    INSERT INTO inventory_movements (
      org_id,
      part_id,
      movement_type,
      quantity,
      previous_quantity,
      new_quantity,
      reason,
      notes,
      created_by,
      metadata
    ) VALUES (
      v_org_id,
      v_item.part_id,
      'ajuste',
      ABS(v_item.difference),
      v_item.expected_quantity,
      v_item.counted_quantity,
      'Ajuste de inventário #' || (SELECT count_number FROM inventory_counts WHERE id = p_count_id),
      v_item.notes,
      (SELECT counted_by FROM inventory_counts WHERE id = p_count_id),
      jsonb_build_object(
        'count_id', p_count_id,
        'adjustment_type', CASE WHEN v_item.difference > 0 THEN 'increase' ELSE 'decrease' END
      )
    );
  END LOOP;
  
  -- Atualizar status da contagem
  UPDATE inventory_counts
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = p_count_id;
END;
$$ LANGUAGE plpgsql;
```

### 💻 2.3 Frontend - Hook `useInventoryCounts`

**Arquivo:** `src/hooks/useInventoryCounts.ts`
- `fetchCounts()` - Listar contagens
- `createCount()` - Criar nova contagem
- `addItemsToCount()` - Adicionar peças para contar
- `updateCountedQuantity()` - Registrar quantidade contada
- `completeCount()` - Finalizar e processar ajustes
- `generateDivergenceReport()` - Relatório de divergências

### 🎨 2.4 Frontend - Componentes

#### `src/pages/Inventario.tsx`
- Nova página para contagens de inventário
- Listar contagens (rascunho, em andamento, concluídas)
- Iniciar nova contagem
- Status visual (badges)

#### `src/components/inventory/CountForm.tsx`
- Criar nova contagem
- Data da contagem
- Responsável
- Seleção de peças a contar (todas ou filtradas)

#### `src/components/inventory/CountInterface.tsx`
- Interface para realizar a contagem
- Lista de peças com:
  - Quantidade esperada (sistema)
  - Input para quantidade contada
  - Diferença calculada automaticamente
  - Cor de alerta se houver divergência
- Botão para finalizar contagem

#### `src/components/inventory/DivergenceReport.tsx`
- Relatório de divergências
- Comparação esperado vs contado
- Valor das divergências
- Botão para aprovar ajustes automáticos

---

## 🔄 FASE 3: Integração e Melhorias (1 semana)

### 3.1 Integrações

#### Com Módulo de Orçamentos
- Ao aprovar orçamento: registrar reserva como movimentação
- Ao rejeitar orçamento: liberar reservas

#### Com Módulo de Compras (futuro)
- Ao receber pedido: criar movimentação de entrada automática

#### Com Workflow
- Ao aplicar peça em OS: registrar movimentação de baixa
- Vincular peças a componentes específicos

### 3.2 Dashboard de Estoque

**Novo componente:** `src/components/inventory/InventoryDashboard.tsx`

#### KPIs
- Valor total em estoque
- Itens com estoque baixo
- Movimentações do mês
- Itens sem movimentação (parados)
- Taxa de giro de estoque

#### Gráficos
- Movimentações por tipo (entrada/saída)
- Evolução do estoque (últimos 30 dias)
- Peças mais movimentadas
- Valor por categoria de componente

### 3.3 Relatórios

#### Relatório de Movimentações
- Filtros avançados
- Exportar para Excel/PDF
- Totalização por período

#### Relatório de Posição de Estoque
- Snapshot do estoque em data específica
- Valor por custo médio
- Agrupamento por componente

#### Relatório de Divergências de Inventário
- Histórico de contagens
- Análise de acuracidade
- Valor de ajustes

---

## 🧪 FASE 4: Testes e Documentação (3-4 dias)

### 4.1 Testes

#### Testes Unitários
- Hooks: `useInventoryMovements`, `useInventoryCounts`
- Validações de quantidade
- Cálculos de diferenças

#### Testes de Integração
- Fluxo completo: entrada → saída → ajuste
- Fluxo de contagem física
- Integração com reservas de orçamento

#### Testes E2E
- Registrar movimentação pela UI
- Realizar contagem física completa
- Gerar e aprovar ajustes

### 4.2 Documentação

Criar em `proj_docs/modules/inventory/`:
- `README.md` - Visão geral do módulo
- `technical-specs/` - Especificações técnicas
  - `database-schema.md` - Schema completo
  - `api-hooks.md` - Documentação dos hooks
  - `business-rules.md` - Regras de negócio
- `user-flows/` - Fluxos de usuário
  - `inventory-movement-flow.md`
  - `physical-count-flow.md`
- `user-guides/` - Guias do usuário
  - `how-to-register-movements.md`
  - `how-to-perform-physical-count.md`

---

## 📅 Cronograma Resumido

| Fase | Duração | Entregas |
|------|---------|----------|
| **Fase 1: Movimentações** | 1 semana | Tabelas, Hook, Componentes de movimentação |
| **Fase 2: Inventário** | 1 semana | Contagem física, Ajustes automáticos |
| **Fase 3: Integração** | 1 semana | Dashboard, Relatórios, Integrações |
| **Fase 4: Testes** | 3-4 dias | Testes completos, Documentação |
| **TOTAL** | **3-4 semanas** | Módulo completo e documentado |

---

## ✅ Checklist de Qualidade

Antes de considerar cada fase completa:

### Arquitetura
- [ ] Clean Architecture respeitada (pages → features → components → services)
- [ ] Componentização adequada
- [ ] Reutilização de componentes existentes
- [ ] Lógica de negócio fora das páginas

### Multi-tenancy
- [ ] Todas as queries filtram por `org_id`
- [ ] RLS policies implementadas
- [ ] Validação de organização antes de operações

### Validações
- [ ] Frontend: campos obrigatórios, formatos, limites
- [ ] Backend: constraints, triggers, functions
- [ ] Mensagens de erro claras

### Responsividade
- [ ] Mobile (< 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (> 1024px)

### Testes
- [ ] Testes unitários dos hooks
- [ ] Testes de integração dos fluxos
- [ ] Testes E2E das funcionalidades críticas

### Documentação
- [ ] Código comentado adequadamente
- [ ] README atualizado
- [ ] Documentação técnica completa
- [ ] Guias de usuário criados

---

## 🚀 Próximos Passos

1. **Revisar e aprovar este plano**
2. **Criar branch:** `feature/inventory-movements`
3. **Iniciar Fase 1:** Implementar estrutura de movimentações
4. **Revisar após cada fase** antes de avançar
5. **Deploy incremental** após cada fase completar testes

---

## 📞 Contato e Dúvidas

Para dúvidas sobre este plano de implementação:
- Consultar arquitetura existente em `proj_docs/architecture/`
- Verificar padrões em módulos já implementados (budgets, operations)
- Seguir convenções do projeto (TypeScript, naming, etc.)

