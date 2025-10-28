# US-DIAG-007: Configurar Checklists (Admin)

**ID:** US-DIAG-007  
**Epic:** Diagnósticos  
**Sprint:** 4  
**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** administrador  
**Quero** criar e editar checklists customizados por componente  
**Para** adaptar o processo de diagnóstico às necessidades da minha empresa

---

## 🎯 Business Objective

Permitir personalização dos checklists de diagnóstico, adaptando-os a diferentes marcas de motores, processos internos e níveis de detalhamento.

---

## 📐 Business Rules

### RN001: Acesso à Configuração
**Quem pode:**
- Admin
- Gerente

**Onde:**
- Menu "Configurações" → "Diagnósticos" → "Checklists"
- Ou: `/settings/diagnostics/checklists`

### RN002: CRUD de Checklists
**Criar Novo Checklist:**
```typescript
interface ChecklistForm {
  checklist_name: string; // Ex: "Inspeção Bloco Mercedes"
  component: ComponentType;
  description?: string;
  is_active: boolean;
  items: ChecklistItemForm[];
}

interface ChecklistItemForm {
  item_name: string;
  item_description?: string;
  item_type: FieldType;
  item_options?: Record<string, unknown>;
  is_required: boolean;
  display_order: number;
  help_text?: string;
  triggers_service?: TriggerConfig;
}
```

### RN003: Construtor de Triggers
**Interface visual para criar regras:**
```
┌─────────────────────────────────────────────────────────┐
│ Configurar Trigger de Serviço                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Quando resposta:                                         │
│ [▼ é igual a] [Ruim                    ▼]              │
│                                                          │
│ [+ Adicionar Condição]                                  │
│                                                          │
│ Sugerir serviços:                                        │
│ [🔍 Buscar serviço...]                                  │
│   [x] BLC001 - Retífica de camisa                       │
│   [x] BLC002 - Soldagem de trinca                       │
│                                                          │
│ Prioridade:                                              │
│ ( ) Baixa  (•) Média  ( ) Alta                         │
│                                                          │
│ Explicação (opcional):                                   │
│ [Desgaste severo requer retífica ou substituição     ]  │
│                                                          │
│          [Cancelar]  [Salvar Trigger]                   │
└─────────────────────────────────────────────────────────┘
```

**Operadores Suportados:**
- `é igual a`
- `é diferente de`
- `é maior que`
- `é menor que`
- `é maior ou igual a`
- `é menor ou igual a`
- `contém` (para arrays)
- `está vazio`
- `não está vazio`

### RN004: Reordenação de Itens
**Drag & Drop:**
- Arrastar itens para reordenar
- `display_order` atualiza automaticamente
- Preview em tempo real

### RN005: Preview do Checklist
**Antes de salvar:**
- Botão "Pré-visualizar"
- Abre modal com renderização real do checklist
- Permite testar preenchimento

### RN006: Versionamento (Futuro)
**Regra básica (Backlog):**
- Checklists aprovados não podem ser editados diretamente
- Criar nova versão ao editar
- Manter histórico de versões

### RN007: Checklist Padrão vs Customizado
**Padrão do Sistema:**
- `org_id` = NULL
- `is_default` = true
- Read-only para todos
- Pode ser clonado para customização

**Customizado:**
- `org_id` = org da empresa
- `is_default` = false
- Editável por admin/gerente da org
- Sobrescreve padrão se ativo

---

## ✅ Acceptance Criteria

**AC1:** Admin pode criar novo checklist via formulário  
**AC2:** Campos de diferentes tipos podem ser adicionados  
**AC3:** Triggers de serviço podem ser configurados visualmente  
**AC4:** Itens podem ser reordenados com drag & drop  
**AC5:** Preview mostra checklist renderizado  
**AC6:** Checklist salvo aparece na lista de checklists ativos  
**AC7:** Checklist customizado sobrescreve padrão ao ativar

---

## 🛠️ Definition of Done

- [ ] Página `/settings/diagnostics/checklists` criada
- [ ] Componente `ChecklistConfigurator.tsx` implementado
- [ ] Componente `ChecklistItemForm.tsx` criado
- [ ] Componente `TriggerBuilder.tsx` criado
- [ ] Drag & drop com `@hello-pangea/dnd`
- [ ] Preview modal funcional
- [ ] CRUD completo de checklists
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/pages/
  └── settings/
      └── diagnostics/
          └── checklists/
              ├── index.tsx            (NEW - lista)
              └── [id]/
                  └── edit.tsx         (NEW - editor)

src/components/admin/
  ├── ChecklistConfigurator.tsx    (NEW)
  ├── ChecklistItemForm.tsx        (NEW)
  ├── TriggerBuilder.tsx           (NEW)
  └── ChecklistPreview.tsx         (NEW)

src/hooks/
  └── useDiagnosticChecklists.ts   (UPDATE - CRUD functions)
```

---

## 🗄️ Database Changes

```sql
-- Nenhuma alteração necessária
-- Tabelas já criadas em US-DIAG-001

-- Função helper para clonar checklist padrão
CREATE OR REPLACE FUNCTION clone_default_checklist(
  p_checklist_id UUID,
  p_org_id UUID,
  p_new_name TEXT
) RETURNS UUID AS $$
DECLARE
  v_new_checklist_id UUID;
  v_item RECORD;
BEGIN
  -- Clona checklist
  INSERT INTO diagnostic_checklists (
    checklist_name,
    component,
    description,
    is_active,
    is_default,
    org_id,
    created_by
  )
  SELECT 
    p_new_name,
    component,
    description || ' (Customizado)',
    false, -- Inicia desativado
    false,
    p_org_id,
    auth.uid()
  FROM diagnostic_checklists
  WHERE id = p_checklist_id
  RETURNING id INTO v_new_checklist_id;
  
  -- Clona itens
  FOR v_item IN 
    SELECT * FROM diagnostic_checklist_items
    WHERE checklist_id = p_checklist_id
  LOOP
    INSERT INTO diagnostic_checklist_items (
      checklist_id,
      item_name,
      item_description,
      item_type,
      item_options,
      is_required,
      display_order,
      help_text,
      expected_values,
      triggers_service
    ) VALUES (
      v_new_checklist_id,
      v_item.item_name,
      v_item.item_description,
      v_item.item_type,
      v_item.item_options,
      v_item.is_required,
      v_item.display_order,
      v_item.help_text,
      v_item.expected_values,
      v_item.triggers_service
    );
  END LOOP;
  
  RETURN v_new_checklist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Configurações > Diagnósticos > Checklists            [+ Novo]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  CHECKLISTS CUSTOMIZADOS DA SUA EMPRESA                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ✅ Inspeção Bloco Mercedes                              ││
│  │    Componente: Bloco | 18 itens | Ativo                 ││
│  │    Criado por: João Silva em 15/01/2025                 ││
│  │    [Editar] [Duplicar] [Desativar] [Preview]            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⏸️ Inspeção Cabeçote Scania                             ││
│  │    Componente: Cabeçote | 14 itens | Inativo            ││
│  │    [Editar] [Duplicar] [Ativar] [Preview]               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  CHECKLISTS PADRÃO DO SISTEMA (Read-only)                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔒 Inspeção Padrão - Bloco                              ││
│  │    15 itens | Sistema                                    ││
│  │    [Preview] [Clonar para Customizar]                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ EDITOR DE CHECKLIST ────────────────────────────────────┐│
│  │                                                       [X] ││
│  │ Editar Checklist: Inspeção Bloco Mercedes               ││
│  │ ─────────────────────────────────────────────────────── ││
│  │                                                          ││
│  │ Nome do Checklist: *                                     ││
│  │ [Inspeção Bloco Mercedes                           ]    ││
│  │                                                          ││
│  │ Componente: * [▼ Bloco                            ]     ││
│  │                                                          ││
│  │ Descrição:                                               ││
│  │ [Checklist específico para motores Mercedes...       ]  ││
│  │                                                          ││
│  │ ✅ Checklist ativo                                      ││
│  │                                                          ││
│  │ ┌─ ITENS DO CHECKLIST ──────────────────────────────┐   ││
│  │ │                                                    │   ││
│  │ │ [+ Adicionar Item]                                │   ││
│  │ │                                                    │   ││
│  │ │ 1. [☰] Estado das camisas * [Editar] [X]         │   ││
│  │ │    Tipo: Select | Trigger: ✅ Configurado         │   ││
│  │ │                                                    │   ││
│  │ │ 2. [☰] Possui trincas visíveis * [Editar] [X]    │   ││
│  │ │    Tipo: Boolean | Trigger: ✅ Configurado        │   ││
│  │ │                                                    │   ││
│  │ │ 3. [☰] Desgaste irregular * [Editar] [X]         │   ││
│  │ │    Tipo: Boolean | Sem trigger                    │   ││
│  │ │                                                    │   ││
│  │ │ ... (15 itens restantes)                          │   ││
│  │ │                                                    │   ││
│  │ └────────────────────────────────────────────────────┘   ││
│  │                                                          ││
│  │          [Cancelar]  [Pré-visualizar]  [Salvar]         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Criar Novo Checklist
```gherkin
Given que sou admin
When acesso "Configurações > Diagnósticos > Checklists"
And clico em "+ Novo"
And preencho nome "Inspeção Bloco Custom"
And seleciono componente "Bloco"
And adiciono 3 itens
And salvo
Then checklist aparece na lista
And status é "Inativo" (padrão)
```

### E2E Test 2: Adicionar Item com Trigger
```gherkin
Given que estou editando checklist
When clico em "+ Adicionar Item"
And preencho nome "Estado das camisas"
And seleciono tipo "Select"
And adiciono opções: "Bom, Regular, Ruim, Crítico"
And clico em "Configurar Trigger"
And configuro: "é igual a Ruim" → sugere "BLC001"
And salvo item
Then item aparece na lista com badge "Trigger ✅"
```

### E2E Test 3: Reordenar Itens (Drag & Drop)
```gherkin
Given que tenho checklist com 5 itens
When arrasto item 3 para posição 1
Then ordem é atualizada
And display_order recalcula automaticamente
And preview reflete nova ordem
```

### E2E Test 4: Pré-visualizar Checklist
```gherkin
Given que editei checklist
When clico em "Pré-visualizar"
Then modal abre com checklist renderizado
And posso preencher campos para testar
And triggers são avaliados em tempo real
```

### E2E Test 5: Clonar Checklist Padrão
```gherkin
Given que visualizo checklist padrão "Inspeção Bloco"
When clico em "Clonar para Customizar"
Then novo checklist é criado
And todos os itens são copiados
And posso editar livremente
And org_id é da minha empresa
```

---

## 🚫 Negative Scope

**Não inclui:**
- Versionamento completo de checklists
- Aprovação multi-nível de checklists
- Importação/exportação de checklists (JSON)
- Marketplace de checklists compartilhados

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-DIAG-001 (Criar Checklist)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
