# Guia de Migração - Configuração Dinâmica de Status de Workflow

## Visão Geral

Este documento descreve o processo de migração do sistema de status de workflow estático para o sistema dinâmico configurável.

## Pré-requisitos

### Versão Atual
- Sistema com status de workflow hardcoded
- Kanban board com cores fixas
- Sem sistema de auditoria de mudanças

### Versão Alvo
- Sistema com status configuráveis
- Kanban board dinâmico
- Sistema completo de auditoria

## Migração do Banco de Dados

### 1. Backup dos Dados Existentes

```sql
-- Backup da tabela status_config existente
CREATE TABLE status_config_backup AS 
SELECT * FROM status_config;

-- Backup dos workflows existentes
CREATE TABLE order_workflow_backup AS 
SELECT * FROM order_workflow;
```

### 2. Aplicar Migrações

#### Migração 1: Expandir status_config
```sql
-- Adicionar novos campos à tabela status_config
ALTER TABLE status_config 
ADD COLUMN IF NOT EXISTS visual_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notification_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sla_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS automation_rules JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_roles TEXT[] DEFAULT '{}';
```

#### Migração 2: Criar tabela de pré-requisitos
```sql
CREATE TABLE IF NOT EXISTS status_prerequisites (
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

#### Migração 3: Criar tabela de histórico
```sql
CREATE TABLE IF NOT EXISTS workflow_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_workflow_id UUID NOT NULL,
    from_status VARCHAR(100) NOT NULL,
    to_status VARCHAR(100) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Inserir Dados Padrão

#### Status de Workflow Padrão
```sql
INSERT INTO status_config (
    entity_type, status_key, status_label, badge_variant, color, icon, 
    display_order, estimated_hours, visual_config
) VALUES 
    ('workflow', 'entrada', 'Entrada', 'secondary', '#ef4444', 'Package', 1, 0.5, '{"bgColor": "#fef2f2", "textColor": "#dc2626"}'),
    ('workflow', 'metrologia', 'Metrologia', 'default', '#f97316', 'Ruler', 2, 2.0, '{"bgColor": "#fff7ed", "textColor": "#ea580c"}'),
    ('workflow', 'usinagem', 'Usinagem', 'default', '#eab308', 'Wrench', 3, 8.0, '{"bgColor": "#fefce8", "textColor": "#ca8a04"}'),
    ('workflow', 'montagem', 'Montagem', 'default', '#22c55e', 'Settings', 4, 4.0, '{"bgColor": "#f0fdf4", "textColor": "#16a34a"}'),
    ('workflow', 'pronto', 'Pronto', 'default', '#06b6d4', 'CheckCircle', 5, 1.0, '{"bgColor": "#ecfeff", "textColor": "#0891b2"}'),
    ('workflow', 'garantia', 'Garantia', 'outline', '#8b5cf6', 'Shield', 6, 0.0, '{"bgColor": "#faf5ff", "textColor": "#7c3aed"}'),
    ('workflow', 'entregue', 'Entregue', 'default', '#10b981', 'Truck', 7, 0.0, '{"bgColor": "#ecfdf5", "textColor": "#059669"}');
```

#### Pré-requisitos Padrão
```sql
INSERT INTO status_prerequisites (
    from_status_key, to_status_key, entity_type, transition_type
) VALUES 
    ('entrada', 'metrologia', 'workflow', 'manual'),
    ('metrologia', 'usinagem', 'workflow', 'manual'),
    ('usinagem', 'montagem', 'workflow', 'manual'),
    ('montagem', 'pronto', 'workflow', 'manual'),
    ('pronto', 'garantia', 'workflow', 'manual'),
    ('garantia', 'entregue', 'workflow', 'manual');
```

### 4. Configurar Políticas RLS

```sql
-- Habilitar RLS
ALTER TABLE status_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas para status_config
CREATE POLICY "Users can view status config for their org" ON status_config
  FOR SELECT USING (
    org_id IS NULL OR 
    org_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage status config" ON status_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      JOIN user_basic_info ubi ON ou.user_id = ubi.user_id
      WHERE ou.user_id = auth.uid() 
      AND ubi.role IN ('admin', 'owner', 'super_admin')
    )
  );

-- Políticas para status_prerequisites
CREATE POLICY "Users can view prerequisites" ON status_prerequisites
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage prerequisites" ON status_prerequisites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      JOIN user_basic_info ubi ON ou.user_id = ubi.user_id
      WHERE ou.user_id = auth.uid() 
      AND ubi.role IN ('admin', 'owner', 'super_admin')
    )
  );

-- Políticas para workflow_status_history
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

## Migração do Código

### 1. Atualizar Hooks

#### Criar useWorkflowStatusConfig
```typescript
// src/hooks/useWorkflowStatusConfig.ts
// [Código já implementado]
```

#### Criar useWorkflowHistory
```typescript
// src/hooks/useWorkflowHistory.ts
// [Código já implementado]
```

### 2. Atualizar Componentes

#### Atualizar KanbanBoard
```typescript
// src/components/workflow/KanbanBoard.tsx
// [Código já implementado]
```

#### Atualizar KanbanColumn
```typescript
// src/components/workflow/KanbanColumn.tsx
// [Código já implementado]
```

### 3. Criar Interface Administrativa

#### WorkflowStatusConfigAdmin
```typescript
// src/components/admin/WorkflowStatusConfigAdmin.tsx
// [Código já implementado]
```

### 4. Atualizar Páginas

#### Configuracoes.tsx
```typescript
// src/pages/Configuracoes.tsx
// [Código já implementado]
```

## Validação da Migração

### 1. Testes de Funcionalidade

#### Teste 1: Acesso Administrativo
```bash
# 1. Fazer login como admin
# 2. Navegar para /configuracoes
# 3. Verificar se a aba "Status Workflow" está visível
# 4. Verificar se os status padrão estão carregados
```

#### Teste 2: CRUD de Status
```bash
# 1. Criar novo status
# 2. Editar status existente
# 3. Excluir status (se não estiver em uso)
# 4. Verificar se mudanças refletem no Kanban
```

#### Teste 3: Kanban Board
```bash
# 1. Acessar Kanban board
# 2. Verificar se cores estão aplicadas
# 3. Verificar se ordem está correta
# 4. Testar drag & drop entre status
```

#### Teste 4: Auditoria
```bash
# 1. Mover item entre status
# 2. Verificar se mudança foi registrada
# 3. Verificar histórico na interface
```

### 2. Testes de Performance

#### Query Performance
```sql
-- Verificar performance das queries
EXPLAIN ANALYZE 
SELECT * FROM status_config 
WHERE entity_type = 'workflow' 
AND (org_id IS NULL OR org_id = 'org-id')
ORDER BY display_order, status_key;
```

#### Memory Usage
```bash
# Monitorar uso de memória dos hooks
# Verificar se não há vazamentos
# Testar com grande volume de dados
```

### 3. Testes de Segurança

#### Controle de Acesso
```bash
# 1. Testar com usuário não-admin
# 2. Verificar se não tem acesso à configuração
# 3. Testar com usuário de outra organização
# 4. Verificar isolamento de dados
```

## Rollback

### Em Caso de Problemas

#### 1. Restaurar Banco de Dados
```sql
-- Restaurar tabela status_config
DROP TABLE status_config;
ALTER TABLE status_config_backup RENAME TO status_config;

-- Restaurar workflows
DROP TABLE order_workflow;
ALTER TABLE order_workflow_backup RENAME TO order_workflow;
```

#### 2. Reverter Código
```bash
# Reverter para commit anterior
git revert <commit-hash>

# Ou restaurar arquivos específicos
git checkout HEAD~1 -- src/hooks/useWorkflowStatusConfig.ts
git checkout HEAD~1 -- src/components/admin/WorkflowStatusConfigAdmin.tsx
```

#### 3. Limpar Dados
```sql
-- Remover tabelas criadas
DROP TABLE IF EXISTS status_prerequisites;
DROP TABLE IF EXISTS workflow_status_history;
```

## Pós-Migração

### 1. Monitoramento

#### Métricas a Acompanhar
- **Performance** das queries
- **Uso de memória** dos hooks
- **Erros** de validação
- **Tempo de resposta** da interface

#### Logs Importantes
- **Criação/edição** de status
- **Mudanças** de workflow
- **Erros** de permissão
- **Falhas** de validação

### 2. Treinamento

#### Administradores
- **Como usar** a interface de configuração
- **Boas práticas** de nomenclatura
- **Configuração** de cores e ícones
- **Gerenciamento** de pré-requisitos

#### Usuários Finais
- **Novas funcionalidades** do Kanban
- **Sistema de auditoria**
- **Validação** de transições

### 3. Documentação

#### Atualizar Documentação
- **Guia do usuário** atualizado
- **API documentation** completa
- **Troubleshooting** guide
- **FAQ** comuns

## Checklist de Migração

### Pré-Migração
- [ ] Backup completo do banco de dados
- [ ] Backup do código atual
- [ ] Testes em ambiente de desenvolvimento
- [ ] Validação de permissões
- [ ] Comunicação com usuários

### Durante a Migração
- [ ] Aplicar migrações do banco
- [ ] Deploy do código atualizado
- [ ] Configurar políticas RLS
- [ ] Inserir dados padrão
- [ ] Testes de funcionalidade

### Pós-Migração
- [ ] Validação completa do sistema
- [ ] Testes de performance
- [ ] Treinamento dos usuários
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

## Suporte

### Em Caso de Problemas
1. **Verificar logs** do sistema
2. **Consultar** esta documentação
3. **Testar** em ambiente de desenvolvimento
4. **Contatar** equipe de desenvolvimento
5. **Considerar rollback** se necessário

---

**Versão**: 1.0  
**Última atualização**: Setembro 2024  
**Autor**: Sistema ERP Retífica Formiguense
