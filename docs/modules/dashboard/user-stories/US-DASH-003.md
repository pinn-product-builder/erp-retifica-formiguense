# US-DASH-003: Ações Rápidas Configuráveis

**ID:** US-DASH-003  
**Epic:** Dashboard  
**Sprint:** -  
**Prioridade:** Média  
**Estimativa:** -  
**Status:** Implementado ✅

---

## 📋 User Story

**Como** usuário frequente do sistema  
**Quero** acessar funcionalidades mais usadas diretamente do dashboard  
**Para** economizar tempo na navegação

---

## 🎯 Business Objective

Reduzir cliques necessários para acessar funcionalidades críticas, aumentando produtividade.

---

## 📐 Business Rules

### RN-DASH-007: Ações Configuráveis
- Configuradas via admin (`/admin/dashboard-config`)
- Campos: título, descrição, ícone, cor, URL, ordem, permissões
- Até 12 ações por organização

### RN-DASH-008: Permissões Contextuais
```typescript
// Exibe apenas ações que o usuário tem permissão
if (action.requiredPermissions) {
  const hasPermission = action.requiredPermissions.every(
    perm => userPermissions.includes(perm)
  );
  if (!hasPermission) return null;
}
```

### RN-DASH-009: Layout em Grid
- Desktop: 4 colunas
- Tablet: 3 colunas
- Mobile: 2 colunas

---

## 🗄️ Database Schema

```sql
CREATE TABLE quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Zap',
  color TEXT DEFAULT 'blue',
  url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  required_permissions TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🧪 Implementação Atual

**Admin:** `src/components/admin/QuickActionsAdmin.tsx`  
**Exibição:** `src/components/dashboard/QuickActions.tsx`

### Ações Padrão
```typescript
const defaultActions = [
  { title: 'Nova OS', url: '/coleta', icon: 'Plus' },
  { title: 'Orçamentos', url: '/orcamentos', icon: 'FileText' },
  { title: 'Estoque', url: '/estoque', icon: 'Package' },
  { title: 'Financeiro', url: '/financeiro', icon: 'DollarSign' }
];
```

---

## ✅ Acceptance Criteria

**AC01:** Grid de ações exibido na tab "Ações Rápidas"  
**AC02:** Cada ação é um card clicável  
**AC03:** Ícone, cor e título configuráveis  
**AC04:** Admin pode adicionar, editar e remover ações  
**AC05:** Ações filtradas por permissões do usuário

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
