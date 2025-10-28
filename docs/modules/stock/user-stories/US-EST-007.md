# US-EST-007: Contagem Física de Estoque

**ID:** US-EST-007  
**Epic:** Estoque  
**Sprint:** 7  
**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente de estoque  
**Quero** realizar contagens físicas periódicas do estoque  
**Para** identificar e corrigir divergências entre sistema e físico

---

## 🎯 Business Objective

Manter acuracidade do inventário através de contagens físicas sistemáticas com ajustes controlados.

---

## 📐 Business Rules

### RN-EST-022: Tipos de Contagem
```typescript
type CountType = 
  | 'full'        // Inventário completo
  | 'partial'     // Por categoria/localização
  | 'cyclic';     // Contagem cíclica (rotativa)

interface InventoryCount {
  id: string;
  org_id: string;
  count_number: string;
  count_type: CountType;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: Date;
  started_at?: Date;
  completed_at?: Date;
  items: InventoryCountItem[];
}

interface InventoryCountItem {
  part_id: string;
  system_quantity: number;
  counted_quantity?: number;
  variance: number;
  variance_percentage: number;
  counted_by?: string;
  counted_at?: Date;
  notes?: string;
}
```

### RN-EST-023: Ajuste Automático
- Divergências < 5%: Ajuste automático
- Divergências >= 5%: Requer aprovação
- Divergências >= 20%: Recontagem obrigatória

---

## 🗄️ Database Schema

```sql
CREATE TABLE inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  count_number TEXT NOT NULL UNIQUE,
  count_type TEXT NOT NULL CHECK (count_type IN ('full', 'partial', 'cyclic')),
  status TEXT NOT NULL DEFAULT 'planned',
  
  scheduled_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID REFERENCES inventory_counts(id) NOT NULL,
  part_id UUID REFERENCES parts(id) NOT NULL,
  
  system_quantity NUMERIC(10,3) NOT NULL,
  counted_quantity NUMERIC(10,3),
  variance NUMERIC(10,3),
  variance_percentage NUMERIC(5,2),
  
  counted_by UUID REFERENCES profiles(id),
  counted_at TIMESTAMPTZ,
  notes TEXT,
  
  UNIQUE(count_id, part_id)
);
```

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
