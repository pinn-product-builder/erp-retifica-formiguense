# US-DASH-001: Visualização de KPIs em Tempo Real

**ID:** US-DASH-001  
**Epic:** Dashboard  
**Sprint:** -  
**Prioridade:** Alta  
**Estimativa:** -  
**Status:** Implementado ✅

---

## 📋 User Story

**Como** gerente da retífica  
**Quero** visualizar KPIs em tempo real no dashboard  
**Para** acompanhar o desempenho da operação instantaneamente

---

## 🎯 Business Objective

Fornecer visibilidade imediata das principais métricas operacionais para tomada de decisão ágil.

---

## 📐 Business Rules

### RN-DASH-001: KPIs Configuráveis
- KPIs são configurados via admin (`/admin/dashboard-config`)
- Campos: código, nome, descrição, fórmula de cálculo, unidade, ícone, cor, ordem
- Podem ser globais (sistema) ou específicos por organização

### RN-DASH-002: Cálculo Dinâmico
- Fórmulas de cálculo executadas em tempo real
- Suporte a queries SQL customizadas
- Cache de 30 segundos para otimização

### RN-DASH-003: Exibição Responsiva
```typescript
// Breakpoints
mobile: < 768px (2 colunas)
tablet: 768px - 1024px (3 colunas)
desktop: > 1024px (4 colunas)
```

---

## 🗄️ Database Schema

```sql
-- Tabela de KPIs
CREATE TABLE kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  calculation_formula TEXT NOT NULL,
  unit TEXT, -- 'number', 'currency', 'percentage'
  icon TEXT DEFAULT 'TrendingUp',
  color TEXT DEFAULT 'blue',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🧪 Implementação Atual

**Componente:** `src/components/StatCard.tsx`  
**Hook:** `src/hooks/useDashboard.ts`  
**Admin:** `src/components/admin/KPIAdmin.tsx`

### Interface
```typescript
interface KPI {
  id: string;
  code: string;
  name: string;
  description?: string;
  calculation_formula: string;
  unit: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType;
  trend?: number;
  description?: string;
}
```

---

## ✅ Acceptance Criteria

**AC01:** Dashboard exibe KPIs ativos ordenados por `display_order`  
**AC02:** Valores calculados em tempo real via fórmula configurada  
**AC03:** Layout responsivo adapta quantidade de colunas  
**AC04:** Ícone e cor configuráveis por KPI  
**AC05:** Admin pode criar, editar e desativar KPIs

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
