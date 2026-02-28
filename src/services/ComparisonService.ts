import { supabase } from '@/integrations/supabase/client';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface ProposalRow {
  quotation_item_id:            string;
  quotation_id:                 string;
  part_id?:                     string;
  part_code?:                   string;
  part_name:                    string;
  quantity:                     number;
  description:                  string;
  specifications?:              string;

  proposal_id:                  string;
  supplier_id:                  string;
  supplier_name:                string;
  supplier_rating?:             number;
  supplier_delivery_performance?: number;

  unit_price:                   number;
  total_price:                  number;
  lead_time_days:               number;
  payment_terms?:               string;
  is_selected:                  boolean;
  responded_at:                 string;
  proposal_notes?:              string;

  is_preferred:                 boolean;
  is_best_price:                boolean;
  is_best_lead_time:            boolean;
  score:                        number;

  min_price:                    number;
  max_price:                    number;
  min_lead_time:                number;
  max_lead_time:                number;
  proposal_count:               number;
}

export interface ComparisonItem {
  quotation_item_id: string;
  part_code?:        string;
  part_name:         string;
  quantity:          number;
  description:       string;
  specifications?:   string;
  proposals:         ProposalRow[];
  recommended:       ProposalRow | null;
}

export interface QuotationSelection {
  quotation_item_id:    string;
  selected_proposal_id: string;
  justification?:       string;
}

// ── Utilitários ───────────────────────────────────────────────────────────────
export function getRecommendedProposal(proposals: ProposalRow[]): ProposalRow | null {
  if (proposals.length === 0) return null;
  const sorted = [...proposals].sort((a, b) => b.score - a.score);
  const preferred = sorted.find(p => p.is_preferred);
  if (preferred && preferred.score >= 85) return preferred;
  return sorted[0];
}

export function groupByItem(rows: ProposalRow[]): ComparisonItem[] {
  const map = new Map<string, ComparisonItem>();
  for (const row of rows) {
    if (!map.has(row.quotation_item_id)) {
      map.set(row.quotation_item_id, {
        quotation_item_id: row.quotation_item_id,
        part_code:         row.part_code,
        part_name:         row.part_name,
        quantity:          row.quantity,
        description:       row.description,
        specifications:    row.specifications,
        proposals:         [],
        recommended:       null,
      });
    }
    map.get(row.quotation_item_id)!.proposals.push(row);
  }
  const items = Array.from(map.values());
  items.forEach(item => {
    item.recommended = getRecommendedProposal(item.proposals);
  });
  return items;
}

// ── Service ───────────────────────────────────────────────────────────────────
export const ComparisonService = {

  async getComparison(quotationId: string): Promise<ComparisonItem[]> {
    const { data, error } = await supabase
      .from('purchase_proposal_comparison')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('quotation_item_id')
      .order('score', { ascending: false });

    if (error) throw error;
    return groupByItem((data ?? []) as ProposalRow[]);
  },

  async selectProposal(
    quotationId: string,
    itemId: string,
    proposalId: string,
    userId: string,
    justification?: string
  ): Promise<void> {
    // Remove seleção anterior do item
    await supabase
      .from('purchase_quotation_proposals')
      .update({ is_selected: false })
      .eq('quotation_item_id', itemId);

    // Marca nova seleção
    const { error: selErr } = await supabase
      .from('purchase_quotation_proposals')
      .update({ is_selected: true })
      .eq('id', proposalId);
    if (selErr) throw selErr;

    // Persiste decisão com justificativa
    const { error: recErr } = await supabase
      .from('purchase_quotation_selections')
      .upsert({
        quotation_id:         quotationId,
        quotation_item_id:    itemId,
        selected_proposal_id: proposalId,
        justification:        justification || null,
        selected_by:          userId,
      }, { onConflict: 'quotation_item_id' });
    if (recErr) throw recErr;
  },

  /**
   * Gera Pedidos de Compra a partir das propostas selecionadas.
   * Agrupa itens por fornecedor e cria um PO por fornecedor.
   */
  async generatePurchaseOrders(
    quotationId: string,
    orgId: string,
    userId: string,
    deliveryAddress?: string
  ): Promise<string[]> {
    // Busca todos os itens com proposta selecionada
    const { data: rows, error } = await supabase
      .from('purchase_proposal_comparison')
      .select('*')
      .eq('quotation_id', quotationId)
      .eq('is_selected', true);

    if (error) throw error;
    if (!rows || rows.length === 0) throw new Error('Nenhuma proposta selecionada');

    const typedRows = rows as ProposalRow[];

    // Agrupar por supplier_id
    const bySupplier = new Map<string, ProposalRow[]>();
    typedRows.forEach(row => {
      if (!bySupplier.has(row.supplier_id)) bySupplier.set(row.supplier_id, []);
      bySupplier.get(row.supplier_id)!.push(row);
    });

    const createdPoNumbers: string[] = [];

    for (const [supplierId, items] of bySupplier) {
      const totalValue = items.reduce((sum, r) => sum + r.total_price, 0);

      // Cria o PO
      const { data: po, error: poErr } = await (supabase as any)
        .from('purchase_orders')
        .insert({
          org_id:           orgId,
          supplier_id:      supplierId,
          quotation_id:     quotationId,
          status:           'draft',
          order_date:       new Date().toISOString().split('T')[0],
          total_value:      totalValue,
          subtotal:         totalValue,
          taxes:            0,
          freight:          0,
          discount:         0,
          delivery_address: deliveryAddress || null,
          created_by:       userId,
          requires_approval: true,
        })
        .select('id, po_number')
        .single();

      if (poErr) throw poErr;

      // Insere os itens do PO
      const poItems = items.map(item => ({
        po_id:       po.id,
        item_name:   item.part_name,
        description: item.description,
        quantity:    Math.ceil(item.quantity),
        unit_price:  item.unit_price,
        total_price: item.total_price,
        part_id:     item.part_id || null,
      }));

      const { error: itemsErr } = await supabase
        .from('purchase_order_items')
        .insert(poItems);

      if (itemsErr) throw itemsErr;

      createdPoNumbers.push(po.po_number ?? po.id);
    }

    // Atualiza status da cotação para 'approved'
    await supabase
      .from('purchase_quotations')
      .update({ status: 'approved' })
      .eq('id', quotationId);

    return createdPoNumbers;
  },
};
