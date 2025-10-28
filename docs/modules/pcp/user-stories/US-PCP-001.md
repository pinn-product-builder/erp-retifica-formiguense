# US-PCP-001: Criar Ordem de Serviço

**ID:** US-PCP-001  
**Épico:** PCP  
**Sprint:** 12  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** gerente de produção  
**Quero** criar ordem de serviço a partir de orçamento aprovado  
**Para** iniciar o processo produtivo com todas as informações técnicas

---

## 🎯 Objetivo de Negócio

Automatizar criação de ordens de serviço com validação de recursos e documentação técnica completa.

---

## ✅ Critérios de Aceitação

**AC01:** Botão "Gerar OS" aparece em orçamento aprovado  
**AC02:** Sistema verifica disponibilidade de peças no estoque  
**AC03:** Se faltar peças, gera alerta e requisição de compra  
**AC04:** OS criada com: número sequencial, componente, operações, prazo  
**AC05:** Anexa documentação: checklist de diagnóstico, fotos, desenhos técnicos  
**AC06:** Status inicial: "Aguardando Programação"  
**AC07:** Notifica equipe de produção  
**AC08:** Link bidirecional: orçamento ↔ OS

---

## 📐 Regras de Negócio

### RN-PCP-001-A: Geração Automática de Operações

```typescript
interface ProductionOperationTemplate {
  component: ComponentType;
  operations: {
    code: string;
    name: string;
    work_center: string;
    setup_time_minutes: number;
    operation_time_minutes: number;
    sequence: number;
  }[];
}

const OPERATION_TEMPLATES: ProductionOperationTemplate[] = [
  {
    component: 'bloco',
    operations: [
      {
        code: 'BL-01',
        name: 'Limpeza e Inspeção Visual',
        work_center: 'LAVAGEM',
        setup_time_minutes: 10,
        operation_time_minutes: 30,
        sequence: 1,
      },
      {
        code: 'BL-02',
        name: 'Brunimento dos Cilindros',
        work_center: 'BRUNIDOR',
        setup_time_minutes: 15,
        operation_time_minutes: 60,
        sequence: 2,
      },
      {
        code: 'BL-03',
        name: 'Retífica do Plano',
        work_center: 'RETIFICA_PLANA',
        setup_time_minutes: 20,
        operation_time_minutes: 45,
        sequence: 3,
      },
      {
        code: 'BL-04',
        name: 'Teste de Estanqueidade',
        work_center: 'QUALIDADE',
        setup_time_minutes: 5,
        operation_time_minutes: 20,
        sequence: 4,
      },
    ],
  },
  {
    component: 'virabrequim',
    operations: [
      {
        code: 'VK-01',
        name: 'Limpeza e Magnaflux',
        work_center: 'LAVAGEM',
        setup_time_minutes: 10,
        operation_time_minutes: 40,
        sequence: 1,
      },
      {
        code: 'VK-02',
        name: 'Retífica dos Munhões',
        work_center: 'RETIFICA_CILINDRICA',
        setup_time_minutes: 25,
        operation_time_minutes: 90,
        sequence: 2,
      },
      {
        code: 'VK-03',
        name: 'Polimento',
        work_center: 'POLIMENTO',
        setup_time_minutes: 10,
        operation_time_minutes: 30,
        sequence: 3,
      },
      {
        code: 'VK-04',
        name: 'Balanceamento Dinâmico',
        work_center: 'BALANCEAMENTO',
        setup_time_minutes: 15,
        operation_time_minutes: 25,
        sequence: 4,
      },
    ],
  },
  {
    component: 'cabecote',
    operations: [
      {
        code: 'CB-01',
        name: 'Desmontagem e Limpeza',
        work_center: 'MONTAGEM',
        setup_time_minutes: 5,
        operation_time_minutes: 45,
        sequence: 1,
      },
      {
        code: 'CB-02',
        name: 'Teste de Trincas',
        work_center: 'QUALIDADE',
        setup_time_minutes: 10,
        operation_time_minutes: 30,
        sequence: 2,
      },
      {
        code: 'CB-03',
        name: 'Retífica do Plano',
        work_center: 'RETIFICA_PLANA',
        setup_time_minutes: 20,
        operation_time_minutes: 40,
        sequence: 3,
      },
      {
        code: 'CB-04',
        name: 'Usinagem de Sedes de Válvula',
        work_center: 'USINAGEM',
        setup_time_minutes: 15,
        operation_time_minutes: 60,
        sequence: 4,
      },
      {
        code: 'CB-05',
        name: 'Montagem e Teste de Estanqueidade',
        work_center: 'MONTAGEM',
        setup_time_minutes: 10,
        operation_time_minutes: 50,
        sequence: 5,
      },
    ],
  },
];

const generateProductionOrder = async (
  budgetId: string,
  component: ComponentType,
  orgId: string
): Promise<ProductionOrder> => {
  // Buscar template de operações
  const template = OPERATION_TEMPLATES.find((t) => t.component === component);
  
  if (!template) {
    throw new Error(`Template não encontrado para componente: ${component}`);
  }
  
  // Gerar número da OS
  const { data: lastOS } = await supabase
    .from('production_orders')
    .select('order_number')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const year = new Date().getFullYear();
  const lastNumber = lastOS?.order_number 
    ? parseInt(lastOS.order_number.split('-')[2]) 
    : 0;
  const orderNumber = `OS-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
  
  // Calcular datas
  const totalTimeMinutes = template.operations.reduce(
    (sum, op) => sum + op.setup_time_minutes + op.operation_time_minutes,
    0
  );
  
  const workingHoursPerDay = 8 * 60; // 8 horas em minutos
  const daysRequired = Math.ceil(totalTimeMinutes / workingHoursPerDay);
  
  const plannedStart = new Date();
  const plannedEnd = new Date();
  plannedEnd.setDate(plannedEnd.getDate() + daysRequired);
  
  // Criar OS
  const { data: productionOrder, error: osError } = await supabase
    .from('production_orders')
    .insert({
      org_id: orgId,
      order_number: orderNumber,
      budget_id: budgetId,
      component,
      status: 'pending',
      priority: 50, // Prioridade média por padrão
      planned_start: plannedStart.toISOString(),
      planned_end: plannedEnd.toISOString(),
    })
    .select()
    .single();
  
  if (osError) throw osError;
  
  // Criar operações
  const operations = template.operations.map((op) => ({
    production_order_id: productionOrder.id,
    operation_code: op.code,
    operation_name: op.name,
    work_center_id: op.work_center, // Precisa resolver para ID real
    sequence: op.sequence,
    setup_time_minutes: op.setup_time_minutes,
    operation_time_minutes: op.operation_time_minutes,
    status: 'pending',
  }));
  
  const { error: opsError } = await supabase
    .from('production_operations')
    .insert(operations);
  
  if (opsError) throw opsError;
  
  return productionOrder;
};
```

### RN-PCP-001-B: Validação de Disponibilidade de Materiais

```typescript
interface MaterialRequirement {
  part_id: string;
  quantity_required: number;
  quantity_available: number;
  is_available: boolean;
}

const checkMaterialAvailability = async (
  budgetId: string,
  orgId: string
): Promise<{
  all_available: boolean;
  requirements: MaterialRequirement[];
  missing_parts: string[];
}> => {
  // Buscar peças do orçamento
  const { data: budget } = await supabase
    .from('budgets')
    .select('parts')
    .eq('id', budgetId)
    .single();
  
  if (!budget || !budget.parts) {
    return { all_available: true, requirements: [], missing_parts: [] };
  }
  
  const parts = budget.parts as any[];
  const requirements: MaterialRequirement[] = [];
  const missing_parts: string[] = [];
  
  for (const part of parts) {
    // Buscar estoque disponível
    const { data: stock } = await supabase
      .from('v_parts_stock')
      .select('available_quantity')
      .eq('org_id', orgId)
      .eq('part_id', part.part_id)
      .single();
    
    const availableQty = stock?.available_quantity || 0;
    const requiredQty = part.quantity;
    const isAvailable = availableQty >= requiredQty;
    
    requirements.push({
      part_id: part.part_id,
      quantity_required: requiredQty,
      quantity_available: availableQty,
      is_available: isAvailable,
    });
    
    if (!isAvailable) {
      missing_parts.push(part.part_id);
    }
  }
  
  return {
    all_available: missing_parts.length === 0,
    requirements,
    missing_parts,
  };
};

const generatePurchaseRequisition = async (
  missingParts: string[],
  orgId: string,
  productionOrderId: string
): Promise<void> => {
  // Criar requisição de compra automática
  for (const partId of missingParts) {
    const { data: part } = await supabase
      .from('parts')
      .select('*')
      .eq('id', partId)
      .single();
    
    if (!part) continue;
    
    await supabase.from('purchase_requisitions').insert({
      org_id: orgId,
      part_id: partId,
      quantity: part.minimum_quantity || 1,
      reason: 'production_order',
      reference_id: productionOrderId,
      urgency: 'high',
      status: 'pending',
    });
  }
};
```

---

## 🗄️ Database Schema

```sql
-- Tabela principal de ordens de serviço
CREATE TABLE production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Identificação
  order_number TEXT NOT NULL,
  budget_id UUID REFERENCES budgets(id),
  order_id UUID REFERENCES orders(id),
  
  -- Componente
  component TEXT NOT NULL,
    CHECK (component IN ('biela', 'bloco', 'cabecote', 'comando', 'eixo', 'pistao', 'virabrequim')),
  
  -- Planejamento
  priority INTEGER DEFAULT 50, -- 0-100
  planned_start TIMESTAMP WITH TIME ZONE NOT NULL,
  planned_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Execução
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  
  -- Atribuição
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled')),
  
  -- Observações
  notes TEXT,
  cancellation_reason TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_production_order_number UNIQUE (org_id, order_number)
);

-- Tabela de operações dentro da OS
CREATE TABLE production_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  
  -- Identificação
  operation_code TEXT NOT NULL,
  operation_name TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  
  -- Centro de Trabalho
  work_center_id UUID REFERENCES work_centers(id),
  
  -- Tempos
  setup_time_minutes INTEGER NOT NULL DEFAULT 0,
  operation_time_minutes INTEGER NOT NULL,
  
  -- Execução
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Observações
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de centros de trabalho
CREATE TABLE work_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Capacidade
  capacity_hours_day DECIMAL(5,2) DEFAULT 8.0,
  efficiency_factor DECIMAL(3,2) DEFAULT 1.0, -- 0.80 = 80% eficiência
  
  -- Custos
  hourly_cost DECIMAL(10,2),
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_work_center_code UNIQUE (org_id, code)
);

-- Índices
CREATE INDEX idx_production_orders_org_status ON production_orders(org_id, status);
CREATE INDEX idx_production_orders_budget ON production_orders(budget_id);
CREATE INDEX idx_production_orders_assigned ON production_orders(assigned_to);
CREATE INDEX idx_production_orders_dates ON production_orders(planned_start, planned_end);
CREATE INDEX idx_production_operations_order ON production_operations(production_order_id);
CREATE INDEX idx_production_operations_work_center ON production_operations(work_center_id);

-- RLS
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view org production orders"
  ON production_orders FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Production managers manage orders"
  ON production_orders FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'production_manager')
    )
  );

CREATE POLICY "Users view org operations"
  ON production_operations FOR SELECT
  USING (
    production_order_id IN (
      SELECT id FROM production_orders 
      WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Production managers manage operations"
  ON production_operations FOR ALL
  USING (
    production_order_id IN (
      SELECT id FROM production_orders 
      WHERE org_id IN (
        SELECT org_id FROM user_organizations 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'production_manager')
      )
    )
  );

CREATE POLICY "Users view org work centers"
  ON work_centers FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage work centers"
  ON work_centers FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_production_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_production_order_updated_at
  BEFORE UPDATE ON production_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_production_order_updated_at();

CREATE TRIGGER trigger_update_production_operation_updated_at
  BEFORE UPDATE ON production_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_production_order_updated_at();
```

---

## 💻 Implementação

### Hook: `useProductionOrders.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export const useProductionOrders = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  
  // Listar ordens de produção
  const { data: productionOrders = [], isLoading } = useQuery({
    queryKey: ['productionOrders', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      
      const { data, error } = await supabase
        .from('production_orders')
        .select(`
          *,
          budget:budgets(id, budget_number, component),
          assigned_user:auth.users(id, email),
          operations:production_operations(*)
        `)
        .eq('org_id', currentOrg.id)
        .order('priority', { ascending: false })
        .order('planned_start', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });
  
  // Criar ordem de produção
  const createProductionOrder = useMutation({
    mutationFn: async (budgetId: string) => {
      if (!currentOrg?.id) throw new Error("Organização não selecionada");
      
      // Buscar dados do orçamento
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budgetId)
        .single();
      
      if (budgetError) throw budgetError;
      if (!budget) throw new Error("Orçamento não encontrado");
      
      // Verificar disponibilidade de materiais
      const materialCheck = await checkMaterialAvailability(budgetId, currentOrg.id);
      
      if (!materialCheck.all_available) {
        toast.warning(
          `Faltam ${materialCheck.missing_parts.length} peça(s) no estoque. Requisição de compra será gerada.`
        );
      }
      
      // Gerar OS
      const productionOrder = await generateProductionOrder(
        budgetId,
        budget.component,
        currentOrg.id
      );
      
      // Gerar requisição de compra se necessário
      if (!materialCheck.all_available) {
        await generatePurchaseRequisition(
          materialCheck.missing_parts,
          currentOrg.id,
          productionOrder.id
        );
      }
      
      return productionOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      toast.success("Ordem de serviço criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar OS: ${error.message}`);
    },
  });
  
  // Atualizar status da OS
  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string;
      notes?: string;
    }) => {
      const updates: any = { status };
      
      if (status === 'in_progress' && !productionOrders.find(o => o.id === id)?.actual_start) {
        updates.actual_start = new Date().toISOString();
      }
      
      if (status === 'completed') {
        updates.actual_end = new Date().toISOString();
      }
      
      if (notes) {
        updates.notes = notes;
      }
      
      const { error } = await supabase
        .from('production_orders')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      toast.success("Status atualizado");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  // Atribuir operador
  const assignOperator = useMutation({
    mutationFn: async ({
      id,
      userId,
    }: {
      id: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from('production_orders')
        .update({
          assigned_to: userId,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      toast.success("Operador atribuído");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  return {
    productionOrders,
    isLoading,
    createProductionOrder: createProductionOrder.mutate,
    isCreating: createProductionOrder.isPending,
    updateStatus: updateStatus.mutate,
    isUpdatingStatus: updateStatus.isPending,
    assignOperator: assignOperator.mutate,
    isAssigning: assignOperator.isPending,
  };
};
```

---

## 🧪 Cenários de Teste

```gherkin
Feature: Criar Ordem de Serviço

Scenario: Criar OS a partir de orçamento aprovado
  Given orçamento ORC-2025-001 está aprovado
  And componente é "bloco"
  When clico em "Gerar OS"
  Then OS-2025-001 é criada
  And 4 operações são geradas (limpeza, brunimento, retífica, teste)
  And status é "Aguardando Programação"
  And prazo calculado é 2 dias úteis

Scenario: Alertar falta de peças e gerar requisição
  Given orçamento com 3 peças necessárias
  And apenas 1 peça disponível em estoque
  When crio OS
  Then sistema exibe alerta "Faltam 2 peças"
  And gera 2 requisições de compra automaticamente
  And marca como "urgência alta"
  And OS é criada mesmo assim
```

---

## 📋 Definition of Done

- [x] Tabelas criadas
- [x] Hook implementado
- [x] Geração automática de operações
- [x] Validação de materiais
- [x] Geração de requisições de compra
- [x] RLS configurado
- [x] Testes passando

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
