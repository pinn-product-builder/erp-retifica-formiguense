# US-OS-003: Editar Dados Gerais da Ordem de Serviço

**ID:** US-OS-003  
**Epic:** Gestão de Ordens de Serviço  
**Sprint:** 2  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** To Do  

---

## 📋 User Story

**Como** consultor ou gerente de produção  
**Quero** editar os dados gerais de uma ordem de serviço  
**Para** corrigir informações ou atualizar dados conforme necessário

---

## 🎯 Business Objective

Permitir a atualização de informações da OS após sua criação, garantindo flexibilidade e correção de dados sem comprometer a rastreabilidade.

---

## 📐 Business Rules

### RN001: Campos Editáveis
- Cliente (apenas se OS não estiver em produção)
- Data de coleta
- Local de coleta
- Motorista
- Prazo de entrega
- Observações gerais
- Status manual (com justificativa)

### RN002: Campos NÃO Editáveis
- Número da OS (gerado automaticamente)
- Data de criação
- Consultor responsável pela criação
- ID do motor (engine_id)
- Histórico de status

### RN003: Validações
- Data de coleta não pode ser futura
- Prazo de entrega deve ser maior que data de coleta
- Cliente deve existir no banco de dados
- Motorista deve ser um funcionário ativo

### RN004: Auditoria
- Toda edição deve gerar registro em `order_status_history`
- Timestamp `updated_at` deve ser atualizado
- Usuário responsável pela edição deve ser registrado

### RN005: Permissões
- Consultores: podem editar OSs que criaram (status draft/ativa)
- Gerentes: podem editar qualquer OS
- Técnicos: não podem editar dados gerais

---

## ✅ Acceptance Criteria

**AC1:** Botão "Editar" visível no header do OrderDetails  
**AC2:** Modal de edição abre com dados pré-preenchidos  
**AC3:** Validações impedem dados inválidos  
**AC4:** Toast de sucesso após salvar  
**AC5:** Dados atualizados refletem imediatamente na tela  
**AC6:** Registro criado em `order_status_history` com action="edited"

---

## 🛠️ Definition of Done

- [ ] Componente `EditOrderModal.tsx` criado
- [ ] Hook `useEditOrder.ts` implementado
- [ ] Validações com Zod schema
- [ ] Integração com Supabase (UPDATE)
- [ ] Auditoria automática implementada
- [ ] RLS policies verificadas
- [ ] Testes E2E escritos
- [ ] Documentação técnica atualizada

---

## 📁 Affected Components

```
src/components/orders/
  ├── EditOrderModal.tsx         (NEW)
  └── OrderDetails.tsx            (UPDATE - adicionar botão)

src/hooks/
  └── useEditOrder.ts             (NEW)

src/lib/
  └── validations/orderSchema.ts (UPDATE)
```

---

## 🗄️ Database Changes

```sql
-- Nenhuma alteração necessária
-- Utiliza tabelas existentes: orders, order_status_history
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  OS #1234 - Cliente ABC Motors                    [Editar] [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Cliente:           [Dropdown: ABC Motors           ▼]          │
│  Data de Coleta:    [Date: 15/01/2025              📅]          │
│  Local de Coleta:   [Input: Av. Paulista, 1000...      ]        │
│  Motorista:         [Dropdown: João Silva          ▼]           │
│  Prazo de Entrega:  [Date: 30/01/2025              📅]          │
│                                                                   │
│  Observações:                                                     │
│  [TextArea: Motor com sinais de superaquecimento...            ]│
│  [                                                              ]│
│                                                                   │
│                                  [Cancelar]  [Salvar Alterações]│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Edição Bem-Sucedida
```gherkin
Given que estou logado como gerente
And estou visualizando a OS #1234
When clico no botão "Editar"
And altero o prazo de entrega para "30/01/2025"
And clico em "Salvar Alterações"
Then vejo toast "Ordem atualizada com sucesso"
And o novo prazo aparece no cabeçalho
And registro aparece no histórico com action="edited"
```

### E2E Test 2: Validação de Data Inválida
```gherkin
Given que estou no modal de edição
When tento definir prazo de entrega anterior à data de coleta
And clico em "Salvar"
Then vejo erro "Prazo deve ser posterior à coleta"
And modal permanece aberto
```

### E2E Test 3: Permissão Negada
```gherkin
Given que estou logado como técnico
When visualizo uma OS
Then botão "Editar" não está visível
```

---

## 🚫 Negative Scope

**Não inclui:**
- Edição de dados do motor (engine_id)
- Edição de componentes do workflow
- Edição de materiais aplicados
- Exclusão de OS

---

## 🔗 Dependencies

**Blocks:**
- US-OS-005 (Timeline depende de histórico de edições)

**Blocked by:**
- US-OS-001 (Criar OS)
- US-OS-004 (Visualizar detalhes)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
