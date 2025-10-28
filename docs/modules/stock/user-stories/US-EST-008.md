# US-EST-008: Ajustes e Perdas

**ID:** US-EST-008  
**Epic:** Estoque  
**Sprint:** 7  
**Prioridade:** Média  
**Estimativa:** 3 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente de estoque  
**Quero** registrar ajustes e perdas de estoque com justificativas  
**Para** manter inventário preciso e rastrear causas de divergências

---

## 🎯 Business Objective

Permitir correções controladas de estoque com auditoria completa e análise de causas de perdas.

---

## 📐 Business Rules

### RN-EST-024: Tipos de Ajuste
```typescript
type AdjustmentReason =
  | 'inventory_variance'    // Diferença na contagem
  | 'damage'                // Dano/quebra
  | 'expiration'            // Vencimento
  | 'theft'                 // Roubo
  | 'quality_issue'         // Problema de qualidade
  | 'system_error'          // Erro no sistema
  | 'other';                // Outro (especificar)
```

### RN-EST-025: Aprovações
- Ajustes < R$ 100: Auto-aprovado
- Ajustes R$ 100-500: Aprovação gerente
- Ajustes > R$ 500: Aprovação admin

---

## 🗄️ Database Schema

```sql
-- Campos adicionais em inventory_movements
ALTER TABLE inventory_movements
  ADD COLUMN adjustment_reason TEXT,
  ADD COLUMN approved_by UUID REFERENCES profiles(id),
  ADD COLUMN approved_at TIMESTAMPTZ;

-- View de ajustes pendentes aprovação
CREATE VIEW pending_adjustments AS
SELECT 
  im.*,
  im.quantity * p.average_cost AS adjustment_value
FROM inventory_movements im
JOIN parts p ON p.id = im.part_id
WHERE im.movement_type IN ('adjustment_in', 'adjustment_out', 'loss')
AND im.approved_by IS NULL
AND (im.quantity * p.average_cost) >= 100;
```

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
