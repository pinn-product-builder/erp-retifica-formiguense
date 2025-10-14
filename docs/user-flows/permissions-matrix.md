# 🔐 Matriz de Permissões - ERP Retífica

## 📋 Legenda
- ✅ **Acesso Total** (Create, Read, Update, Delete)
- 📖 **Apenas Leitura** (Read only)
- ✏️ **Ler e Editar** (Read, Update)
- ❌ **Sem Acesso**

---

## 📊 Matriz Completa

| Módulo/Funcionalidade | Super Admin | Owner | Admin | Manager | Operator | Viewer |
|----------------------|-------------|-------|-------|---------|----------|--------|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ | 📖 |
| **Organizações** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Gestão de Usuários** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Perfis e Setores** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Ordens de Serviço** | ✅ | ✅ | ✅ | ✏️ | ✏️ | 📖 |
| **Workflow Kanban** | ✅ | ✅ | ✅ | ✏️ | ✏️ | 📖 |
| **Diagnósticos** | ✅ | ✅ | ✅ | ✏️ | ✏️ | 📖 |
| **Orçamentos** | ✅ | ✅ | ✅ | ✏️ | ✏️ | 📖 |
| **Aprovações** | ✅ | ✅ | ✅ | ✏️ | ❌ | ❌ |
| **Clientes** | ✅ | ✅ | ✅ | ✏️ | ✏️ | 📖 |
| **Módulo Fiscal** | ✅ | ✅ | ✅ | 📖 | ❌ | ❌ |
| **Financeiro** | ✅ | ✅ | ✅ | 📖 | ❌ | 📖 |
| **Estoque** | ✅ | ✅ | ✅ | ✏️ | ✏️ | 📖 |
| **Compras** | ✅ | ✅ | ✅ | ✏️ | ✏️ | 📖 |
| **Relatórios** | ✅ | ✅ | ✅ | ✅ | 📖 | 📖 |
| **Configurações** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 🔍 Detalhamento por Perfil

### 👑 Super Admin
**Escopo**: Global (todas as organizações)  
**Uso**: Gestão da plataforma  
**Permissões especiais**:
- Criar/editar/deletar organizações
- Promover/revogar super admins
- Acesso a logs globais
- Configurações de sistema

### 🏢 Owner
**Escopo**: Sua organização  
**Uso**: Dono da empresa  
**Permissões especiais**:
- Todas dentro da organização
- Não pode acessar outras organizações
- Pode adicionar outros owners

### ⚙️ Admin
**Escopo**: Sua organização  
**Uso**: Administrador do sistema  
**Limitações vs Owner**:
- Não pode deletar a organização
- Não pode remover owners

### 🏭 Manager
**Escopo**: Sua organização  
**Uso**: Gerente de área  
**Pode**:
- Aprovar orçamentos
- Supervisionar workflow
- Ver relatórios operacionais  
**Não pode**:
- Acessar financeiro completo
- Modificar configurações
- Gerenciar usuários

### 🔧 Operator
**Escopo**: Sua organização  
**Uso**: Técnico/Operador  
**Pode**:
- Criar/editar OS
- Executar diagnósticos
- Movimentar Kanban
- Registrar materiais  
**Não pode**:
- Aprovar orçamentos
- Deletar registros importantes
- Acessar financeiro

### 👁️ Viewer
**Escopo**: Sua organização  
**Uso**: Visualização apenas  
**Pode**:
- Ver dashboards
- Consultar OS
- Ver relatórios  
**Não pode**:
- Editar nada
- Criar registros

---

## 🎯 Casos de Uso Práticos

### Cenário 1: Novo Funcionário
**Perfil recomendado**: Operator  
**Razão**: Pode executar tarefas sem risco de modificar configs

### Cenário 2: Gerente de Produção
**Perfil recomendado**: Manager  
**Razão**: Supervisiona mas não gerencia sistema

### Cenário 3: Contador Externo
**Perfil recomendado**: Viewer (com acesso a Fiscal)  
**Razão**: Precisa ver dados mas não editar

---

**Última Atualização**: 2025-01-14
