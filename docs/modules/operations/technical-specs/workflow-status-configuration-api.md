# API de Configuração de Status de Workflow - Especificação Técnica

## Visão Geral

Este documento descreve a implementação técnica do sistema de configuração dinâmica de status de workflow, incluindo APIs, hooks, componentes e integrações. O sistema foi atualizado com CRUD completo, validações robustas e interface responsiva.

## Melhorias Implementadas (v2.0)

### ✅ CRUD Completo
- **Criação** de status e pré-requisitos com validação
- **Edição** de configurações existentes
- **Exclusão** com confirmação
- **Visualização** com interface responsiva

### ✅ Validações Robustas
- **Campos obrigatórios** com feedback visual
- **Validação de transições** (origem ≠ destino)
- **Toasts de confirmação/erro** para todas as operações
- **Logs de debug** para troubleshooting

### ✅ Interface Responsiva
- **Mobile-first** design
- **Adaptação** para tablet e desktop
- **Seletores de cor** integrados
- **Preview em tempo real** das configurações

### ✅ Segurança e Permissões
- **Políticas RLS** atualizadas para super admins
- **Validação de permissões** no frontend e backend
- **Auditoria** de mudanças de status

## Arquitetura

### Componentes Principais

```
src/
├── hooks/
│   ├── useWorkflowStatusConfig.ts     # Hook principal de gerenciamento
│   └── useWorkflowHistory.ts          # Hook de histórico/auditoria
├── components/
│   ├── admin/
│   │   └── WorkflowStatusConfigAdmin.tsx  # Interface administrativa
│   └── workflow/
│       ├── KanbanBoard.tsx            # Board atualizado
│       └── KanbanColumn.tsx           # Coluna atualizada
└── pages/
    └── Configuracoes.tsx              # Página de configurações
```

### Banco de Dados

#### Tabela: `status_config`
```sql
CREATE TABLE status_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    entity_type VARCHAR(50) NOT NULL,
    status_key VARCHAR(100) NOT NULL,
    status_label VARCHAR(200) NOT NULL,
    badge_variant VARCHAR(50) DEFAULT 'default',
    color VARCHAR(7),
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    estimated_hours DECIMAL(5,2) DEFAULT 0,
    visual_config JSONB DEFAULT '{}',
    notification_config JSONB DEFAULT '{}',
    sla_config JSONB DEFAULT '{}',
    automation_rules JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: `status_prerequisites`
```sql
CREATE TABLE status_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_status_key VARCHAR(100) NOT NULL,
    to_status_key VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    component VARCHAR(100),
    transition_type VARCHAR(50) DEFAULT 'manual',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: `workflow_status_history`
```sql
CREATE TABLE workflow_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_workflow_id UUID NOT NULL,
    from_status VARCHAR(100) NOT NULL,
    to_status VARCHAR(100) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## APIs e Hooks

### useWorkflowStatusConfig

Hook principal para gerenciamento de status de workflow.

#### Interface
```typescript
interface WorkflowStatusConfig {
  id: string;
  org_id?: string;
  entity_type: string;
  status_key: string;
  status_label: string;
  badge_variant: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  display_order: number;
  estimated_hours: number;
  visual_config?: {
    bgColor: string;
    textColor: string;
  };
  notification_config?: any;
  sla_config?: any;
  automation_rules?: any[];
}
```

#### Métodos
```typescript
const {
  workflowStatuses,        // Lista de status configurados
  prerequisites,          // Lista de pré-requisitos
  loading,                // Estado de carregamento
  fetchWorkflowStatuses,  // Buscar status
  fetchPrerequisites,     // Buscar pré-requisitos
  createStatusConfig,     // Criar novo status
  updateStatusConfig,     // Atualizar status
  deleteStatusConfig,     // Excluir status
  getNextAllowedStatuses, // Obter próximos status permitidos
  getStatusConfig,        // Obter configuração por chave
  getStatusColors         // Obter cores dos status
} = useWorkflowStatusConfig();
```

### useWorkflowHistory

Hook para gerenciamento de histórico de mudanças.

#### Interface
```typescript
interface WorkflowHistoryEntry {
  id: string;
  order_workflow_id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  change_reason?: string;
  created_at: string;
  user_email?: string;
}
```

#### Métodos
```typescript
const {
  history,              // Lista de entradas de histórico
  loading,              // Estado de carregamento
  fetchHistory,         // Buscar histórico
  getStatusDuration,    // Calcular duração do status
  getHistorySummary     // Obter resumo do histórico
} = useWorkflowHistory(workflowId);
```

## Componentes

### WorkflowStatusConfigAdmin

Componente principal da interface administrativa.

#### Props
```typescript
// Não recebe props - usa hooks internos
```

#### Funcionalidades
- **CRUD completo** de status de workflow
- **Interface responsiva** (mobile-first)
- **Preview em tempo real** de configurações
- **Validação** de formulários
- **Gerenciamento** de pré-requisitos
- **Configuração** de SLA e auditoria

#### Estados
```typescript
const [editingStatus, setEditingStatus] = useState<WorkflowStatusConfig | null>(null);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [isCreating, setIsCreating] = useState(false);
const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
```

### KanbanBoard (Atualizado)

Board Kanban integrado com configurações dinâmicas.

#### Mudanças Implementadas
- **Status dinâmicos** baseados em `status_config`
- **Cores personalizadas** aplicadas automaticamente
- **Validação** de transições baseada em pré-requisitos
- **Ordem** respeitando `display_order`

#### Integração
```typescript
const { workflowStatuses, getStatusColors, getNextAllowedStatuses } = useWorkflowStatusConfig();

const statusOrder = workflowStatuses
  .filter(status => status.is_active)
  .sort((a, b) => a.display_order - b.display_order)
  .map(status => status.status_key);

const statusColors = getStatusColors();
```

## Queries SQL

### Buscar Status de Workflow
```sql
SELECT * FROM status_config 
WHERE entity_type = 'workflow' 
AND (org_id IS NULL OR org_id = $1)
ORDER BY display_order, status_key;
```

### Criar Novo Status
```sql
INSERT INTO status_config (
  entity_type, status_key, status_label, badge_variant, 
  color, icon, display_order, estimated_hours, 
  visual_config, org_id
) VALUES (
  'workflow', $1, $2, $3, $4, $5, $6, $7, $8, $9
);
```

### Atualizar Status
```sql
UPDATE status_config 
SET 
  status_label = $1,
  badge_variant = $2,
  color = $3,
  icon = $4,
  display_order = $5,
  estimated_hours = $6,
  visual_config = $7,
  is_active = $8,
  updated_at = NOW()
WHERE id = $9;
```

### Excluir Status
```sql
DELETE FROM status_config WHERE id = $1;
```

### Registrar Mudança de Status
```sql
INSERT INTO workflow_status_history (
  order_workflow_id, from_status, to_status, 
  changed_by, change_reason
) VALUES ($1, $2, $3, $4, $5);
```

## Validações

### Validação de Status
- **Chave única**: `status_key` deve ser única por organização
- **Campos obrigatórios**: `status_key`, `status_label`
- **Formato de cor**: Hexadecimal válido (#RRGGBB)
- **Tempo estimado**: Número positivo

### Validação de Transições
- **Pré-requisitos**: Verificar se transição é permitida
- **Status ativo**: Apenas status ativos podem ser usados
- **Componente**: Validar se transição é válida para o componente

## Performance

### Otimizações Implementadas
- **Cache local** de status no hook
- **Lazy loading** de pré-requisitos
- **Debounce** em atualizações de formulário
- **Memoização** de cores e configurações

### Índices Recomendados
```sql
CREATE INDEX idx_status_config_entity_org ON status_config(entity_type, org_id);
CREATE INDEX idx_status_config_active ON status_config(is_active) WHERE is_active = true;
CREATE INDEX idx_status_prerequisites_from ON status_prerequisites(from_status_key);
CREATE INDEX idx_workflow_history_workflow ON workflow_status_history(order_workflow_id);
```

## Segurança

### Controle de Acesso
- **RLS (Row Level Security)** habilitado
- **Validação** de organização em todas as operações
- **Auditoria** completa de mudanças
- **Permissões** baseadas em roles

### Políticas RLS
```sql
-- status_config
CREATE POLICY "Users can view status config for their org" ON status_config
  FOR SELECT USING (
    org_id IS NULL OR 
    org_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid())
  );

-- workflow_status_history
CREATE POLICY "Users can view workflow history for their org" ON workflow_status_history
  FOR SELECT USING (
    order_workflow_id IN (
      SELECT id FROM order_workflow 
      WHERE order_id IN (
        SELECT id FROM orders 
        WHERE org_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid())
      )
    )
  );
```

## Testes

### Testes Unitários
- **Hook useWorkflowStatusConfig**: Validação de CRUD
- **Hook useWorkflowHistory**: Validação de histórico
- **Componente WorkflowStatusConfigAdmin**: Validação de interface

### Testes de Integração
- **Fluxo completo** de criação de status
- **Integração** com Kanban board
- **Validação** de transições
- **Auditoria** de mudanças

## Monitoramento

### Métricas Importantes
- **Tempo de resposta** das queries
- **Uso de memória** dos hooks
- **Frequência** de mudanças de status
- **Erros** de validação

### Logs
- **Criação/edição** de status
- **Mudanças** de workflow
- **Erros** de validação
- **Acessos** à interface administrativa

## Roadmap

### Próximas Funcionalidades
- **Templates** de configuração
- **Importação/exportação** de configurações
- **Relatórios** de performance de status
- **Automação** de transições
- **Integração** com sistemas externos

### Melhorias Planejadas
- **Cache** mais robusto
- **Validação** em tempo real
- **Interface** mais intuitiva
- **Performance** otimizada

---

**Versão**: 1.0  
**Última atualização**: Setembro 2024  
**Autor**: Sistema ERP Retífica Formiguense
