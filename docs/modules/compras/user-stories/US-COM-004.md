# US-COM-004: Comparar Propostas

**ID:** US-COM-004  
**Epic:** Compras  
**Sprint:** 8  
**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** comprador  
**Quero** comparar propostas de fornecedores lado a lado  
**Para** tomar decisão informada sobre melhor custo-benefício

---

## 🎯 Business Objective

Facilitar análise comparativa de propostas através de visualização consolidada considerando preço, prazo e qualidade do fornecedor.

---

## ✅ Acceptance Criteria

**AC01:** Ao abrir cotação, visualizar quadro comparativo de propostas  
**AC02:** Para cada item: tabela com colunas por fornecedor  
**AC03:** Exibir: preço unitário, total, prazo entrega, condições pagamento  
**AC04:** Badge visual: menor preço, melhor prazo, fornecedor preferencial  
**AC05:** Rating do fornecedor visível na comparação  
**AC06:** Botão "Selecionar" para marcar proposta escolhida  
**AC07:** Gerar pedido de compra diretamente das propostas selecionadas  
**AC08:** Exportar comparativo em PDF

---

## 📐 Business Rules

### RN-COM-013: Matriz de Comparação
```typescript
interface ProposalComparison {
  part_id: string;
  part_description: string;
  quantity: number;
  
  proposals: ProposalSummary[];
  
  best_price: ProposalSummary;
  best_lead_time: ProposalSummary;
  preferred_supplier: ProposalSummary;
  
  recommended: ProposalSummary;      // Recomendação baseada em score
}

interface ProposalSummary {
  proposal_id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_rating: number;
  
  unit_price: number;
  total_price: number;
  lead_time_days: number;
  payment_terms: string;
  
  is_preferred: boolean;
  is_best_price: boolean;
  is_best_lead_time: boolean;
  
  score: number;                     // Score calculado
  
  responded_at: Date;
}
```

### RN-COM-014: Cálculo de Score
```typescript
function calculateProposalScore(
  proposal: ProposalSummary,
  supplierPerformance: SupplierPerformance
): number {
  // Normaliza preço (0-100, invertido: menor preço = maior score)
  const priceScore = 100 - ((proposal.unit_price / maxPrice) * 100);
  
  // Normaliza prazo (0-100, invertido: menor prazo = maior score)
  const leadTimeScore = 100 - ((proposal.lead_time_days / maxLeadTime) * 100);
  
  // Rating do fornecedor (já 0-100)
  const supplierScore = supplierPerformance.overall_rating;
  
  // Pontuação extra para preferencial
  const preferredBonus = proposal.is_preferred ? 10 : 0;
  
  // Pesos: 40% preço, 30% prazo, 20% fornecedor, 10% preferencial
  return (
    (priceScore * 0.40) +
    (leadTimeScore * 0.30) +
    (supplierScore * 0.20) +
    preferredBonus
  );
}
```

### RN-COM-015: Recomendação Automática
```typescript
function getRecommendedProposal(
  proposals: ProposalSummary[]
): ProposalSummary {
  // Ordena por score (maior primeiro)
  const sorted = [...proposals].sort((a, b) => b.score - a.score);
  
  // Se fornecedor preferencial tem score >= 85, recomenda ele
  const preferred = sorted.find(p => p.is_preferred);
  if (preferred && preferred.score >= 85) {
    return preferred;
  }
  
  // Senão, retorna maior score
  return sorted[0];
}
```

### RN-COM-016: Seleção de Propostas
```typescript
interface QuotationSelection {
  quotation_id: string;
  selections: ItemSelection[];
}

interface ItemSelection {
  quotation_item_id: string;
  selected_proposal_id: string;
  justification?: string;          // Justificativa se não for melhor preço
}

// Valida seleção
function validateSelection(selection: ItemSelection): ValidationResult {
  const proposal = getProposal(selection.selected_proposal_id);
  const item = getQuotationItem(selection.quotation_item_id);
  
  // Se não for melhor preço, exige justificativa
  if (!proposal.is_best_price && !selection.justification) {
    return {
      valid: false,
      message: 'Justificativa necessária para proposta mais cara',
    };
  }
  
  return { valid: true };
}
```

---

## 🗄️ Database Schema

```sql
-- Função para calcular score
CREATE OR REPLACE FUNCTION calculate_proposal_score(
  p_proposal_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC;
  v_price_score NUMERIC;
  v_leadtime_score NUMERIC;
  v_supplier_score NUMERIC;
  v_preferred_bonus NUMERIC := 0;
  v_max_price NUMERIC;
  v_max_leadtime INTEGER;
BEGIN
  -- Busca dados da proposta
  SELECT 
    qp.unit_price,
    qp.lead_time_days,
    sp.is_preferred,
    s.overall_rating,
    MAX(qp2.unit_price) OVER (PARTITION BY qi.quotation_id),
    MAX(qp2.lead_time_days) OVER (PARTITION BY qi.quotation_id)
  INTO 
    v_price_score, 
    v_leadtime_score,
    v_preferred_bonus,
    v_supplier_score,
    v_max_price,
    v_max_leadtime
  FROM quotation_proposals qp
  JOIN quotation_items qi ON qi.id = qp.quotation_item_id
  JOIN suppliers s ON s.id = qp.supplier_id
  LEFT JOIN supplier_products sp ON sp.supplier_id = qp.supplier_id 
    AND sp.part_id = qi.part_id
  JOIN quotation_proposals qp2 ON qp2.quotation_item_id = qi.id
  WHERE qp.id = p_proposal_id
  GROUP BY qp.id, s.id, sp.is_preferred;
  
  -- Normaliza scores
  v_price_score := 100 - ((v_price_score / NULLIF(v_max_price, 0)) * 100);
  v_leadtime_score := 100 - ((v_leadtime_score / NULLIF(v_max_leadtime, 0)) * 100);
  v_supplier_score := COALESCE(v_supplier_score, 50);
  
  IF v_preferred_bonus THEN
    v_preferred_bonus := 10;
  END IF;
  
  -- Calcula score final
  v_score := (
    (v_price_score * 0.40) +
    (v_leadtime_score * 0.30) +
    (v_supplier_score * 0.20) +
    v_preferred_bonus
  );
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- View de comparação
CREATE OR REPLACE VIEW proposal_comparison AS
SELECT 
  qi.id AS quotation_item_id,
  qi.quotation_id,
  qi.part_id,
  p.code AS part_code,
  p.name AS part_name,
  qi.quantity,
  qi.description,
  
  qp.id AS proposal_id,
  qp.supplier_id,
  s.trade_name AS supplier_name,
  s.overall_rating AS supplier_rating,
  
  qp.unit_price,
  qp.total_price,
  qp.lead_time_days,
  qp.payment_terms,
  qp.is_selected,
  
  sp.is_preferred,
  
  calculate_proposal_score(qp.id) AS score,
  
  qp.unit_price = MIN(qp.unit_price) OVER (PARTITION BY qi.id) AS is_best_price,
  qp.lead_time_days = MIN(qp.lead_time_days) OVER (PARTITION BY qi.id) AS is_best_lead_time,
  
  qp.responded_at

FROM quotation_items qi
JOIN parts p ON p.id = qi.part_id
JOIN quotation_proposals qp ON qp.quotation_item_id = qi.id
JOIN suppliers s ON s.id = qp.supplier_id
LEFT JOIN supplier_products sp ON sp.supplier_id = qp.supplier_id 
  AND sp.part_id = qi.part_id
ORDER BY qi.quotation_id, qi.id, score DESC;

GRANT SELECT ON proposal_comparison TO authenticated;

-- Tabela de seleções (histórico de decisão)
CREATE TABLE quotation_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) NOT NULL,
  quotation_item_id UUID REFERENCES quotation_items(id) NOT NULL,
  selected_proposal_id UUID REFERENCES quotation_proposals(id) NOT NULL,
  
  justification TEXT,              -- Obrigatório se não for melhor preço
  
  selected_by UUID REFERENCES profiles(id) NOT NULL,
  selected_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(quotation_item_id)
);

CREATE INDEX idx_quotation_selections_quotation ON quotation_selections(quotation_id);

ALTER TABLE quotation_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage selections in their organization"
  ON quotation_selections FOR ALL
  USING (quotation_id IN (
    SELECT id FROM quotations 
    WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  ));
```

---

## 🎨 Implementation

### Hook useQuotationComparison

```typescript
// src/hooks/useQuotationComparison.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useQuotationComparison(quotationId: string) {
  const queryClient = useQueryClient();
  
  // Get comparison data
  const { data: comparison, isLoading } = useQuery({
    queryKey: ['quotation-comparison', quotationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_comparison')
        .select('*')
        .eq('quotation_id', quotationId)
        .order('quotation_item_id')
        .order('score', { ascending: false });
      
      if (error) throw error;
      
      // Group by item
      const grouped = data.reduce((acc, proposal) => {
        const itemId = proposal.quotation_item_id;
        if (!acc[itemId]) {
          acc[itemId] = {
            item_id: itemId,
            part_code: proposal.part_code,
            part_name: proposal.part_name,
            quantity: proposal.quantity,
            proposals: [],
          };
        }
        acc[itemId].proposals.push(proposal);
        return acc;
      }, {});
      
      return Object.values(grouped);
    },
    enabled: !!quotationId,
  });
  
  // Select proposal
  const selectProposalMutation = useMutation({
    mutationFn: async ({
      itemId,
      proposalId,
      justification,
    }: {
      itemId: string;
      proposalId: string;
      justification?: string;
    }) => {
      // Mark proposal as selected
      await supabase
        .from('quotation_proposals')
        .update({ is_selected: false })
        .eq('quotation_item_id', itemId);
      
      await supabase
        .from('quotation_proposals')
        .update({ is_selected: true })
        .eq('id', proposalId);
      
      // Save selection with justification
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      const { error } = await supabase
        .from('quotation_selections')
        .upsert({
          quotation_id: quotationId,
          quotation_item_id: itemId,
          selected_proposal_id: proposalId,
          justification,
          selected_by: profile?.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-comparison'] });
      toast.success('Proposta selecionada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao selecionar proposta');
    },
  });
  
  // Generate purchase order from selections
  const generatePurchaseOrderMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc(
        'generate_purchase_orders_from_quotation',
        { p_quotation_id: quotationId }
      );
      
      if (error) throw error;
      return data;
    },
    onSuccess: (purchaseOrders) => {
      toast.success(`${purchaseOrders.length} pedido(s) de compra gerado(s)`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao gerar pedidos');
    },
  });
  
  return {
    comparison,
    isLoading,
    selectProposal: selectProposalMutation.mutateAsync,
    generatePurchaseOrders: generatePurchaseOrderMutation.mutateAsync,
  };
}
```

---

## 🖼️ Wireframe

```
┌────────────────────────────────────────────────────────────────┐
│ Comparar Propostas - COT-250127-001             [Gerar Pedido] │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ITEM 1: Rolamento 6204 (10 un)                                 │
│                                                                  │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│ │              │ Rolamentos   │ Peças        │ Importadora  │  │
│ │              │ Sul ⭐       │ Express      │ ABC          │  │
│ │              │ Rating: 4.8  │ Rating: 4.2  │ Rating: 3.5  │  │
│ ├──────────────┼──────────────┼──────────────┼──────────────┤  │
│ │ Preço Unit.  │ R$ 15,90     │ R$ 16,50     │ R$ 14,20 💰  │  │
│ │ Total        │ R$ 159,00    │ R$ 165,00    │ R$ 142,00    │  │
│ │ Prazo        │ 5 dias ⚡    │ 7 dias       │ 15 dias      │  │
│ │ Pagamento    │ 30 dias      │ 30 dias      │ À vista      │  │
│ │ Score        │ 92 🏆        │ 78           │ 65           │  │
│ │              │ [✓ Selecio-  │ [Selecionar] │ [Selecionar] │  │
│ │              │     nado]    │              │              │  │
│ └──────────────┴──────────────┴──────────────┴──────────────┘  │
│                                                                  │
│ Recomendação: Rolamentos Sul (melhor custo-benefício)          │
│ Badges: ⭐ Preferencial | 💰 Menor Preço | ⚡ Menor Prazo     │
│                                                                  │
├──────────────────────────────────────────────────────────────  │
│                                                                  │
│ ITEM 2: Retentor 40x60x10 (5 un)                               │
│                                                                  │
│ ┌──────────────┬──────────────┬──────────────┐                 │
│ │              │ Retentores BR│ Vedações Tech│                 │
│ │              │ Rating: 4.5  │ Rating: 4.9⭐│                 │
│ ├──────────────┼──────────────┼──────────────┤                 │
│ │ Preço Unit.  │ R$ 8,50 💰   │ R$ 9,00      │                 │
│ │ Total        │ R$ 42,50     │ R$ 45,00     │                 │
│ │ Prazo        │ 10 dias      │ 3 dias ⚡    │                 │
│ │ Pagamento    │ 30 dias      │ 30 dias      │                 │
│ │ Score        │ 85           │ 88 🏆        │                 │
│ │              │ [Selecionar] │ [✓ Selecio-  │                 │
│ │              │              │     nado]    │                 │
│ └──────────────┴──────────────┴──────────────┘                 │
│                                                                  │
│ Recomendação: Vedações Tech (preferencial + melhor prazo)      │
│ Justificativa: "Fornecedor preferencial com histórico          │
│ excelente, diferença de preço compensada pela qualidade"       │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### Cenário 1: Comparação Visual
```gherkin
Given cotação tem 2 itens com 3 propostas cada
When acessar página de comparação
Then deve exibir tabela comparativa
And destacar melhor preço de cada item
And destacar melhor prazo de cada item
And mostrar score calculado
And indicar proposta recomendada
```

### Cenário 2: Seleção com Justificativa
```gherkin
Given item tem proposta A (R$ 10) e B (R$ 12)
When selecionar proposta B (mais cara)
Then deve solicitar justificativa
And não permitir selecionar sem justificativa
When preencher justificativa válida
Then deve permitir seleção
```

### Cenário 3: Gerar Pedido
```gherkin
Given todas propostas foram selecionadas
When clicar em "Gerar Pedido"
Then deve criar pedidos agrupados por fornecedor
And atualizar status cotação para "approved"
And redirecionar para lista de pedidos
```

---

## ✓ Definition of Done

- [ ] View `proposal_comparison` criada
- [ ] Função `calculate_proposal_score` implementada
- [ ] Tabela `quotation_selections` criada
- [ ] Hook `useQuotationComparison.ts`
- [ ] Componente `ProposalComparisonTable.tsx`
- [ ] Componente `ProposalBadges.tsx`
- [ ] Modal de justificativa
- [ ] Função `generatePurchaseOrders`
- [ ] Exportar PDF implementado
- [ ] Testes de cálculo de score
- [ ] Testes E2E
- [ ] Documentação atualizada

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
