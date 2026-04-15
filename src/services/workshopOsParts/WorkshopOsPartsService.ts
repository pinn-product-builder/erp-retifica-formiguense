import { supabase } from '@/integrations/supabase/client';
import {
  addExtraLineSchema,
  cancelPartialSchema,
  noteLineSchema,
  orderNumberSearchSchema,
  paginatedCatalogSearchSchema,
  releaseStockSchema,
  substituteLineSchema,
  type AddExtraLineInput,
  type CancelPartialInput,
  type NoteLineInput,
  type PaginatedCatalogSearchInput,
  type ReleaseStockInput,
  type SubstituteLineInput,
} from './schemas';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any;

/** Linhas só de reserva (sem registro em workshop_os_part_lines) usam este prefixo no `id`. */
export const WORKSHOP_RESERVATION_ONLY_LINE_PREFIX = 'resv:';

export interface WorkshopOrderContext {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string | null;
  engineLabel: string | null;
  commercialParts: CommercialPartItem[];
  workshopLines: WorkshopPartLine[];
}

export interface CommercialPartItem {
  key: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  sourceBudgetId?: string;
}

export interface WorkshopPartLine {
  id: string;
  orderId: string;
  partId: string | null;
  partCode: string;
  partName: string;
  sectionName: string;
  source: 'commercial_json' | 'extra' | 'substitution';
  isExtra: boolean;
  /** true quando a linha vem só de `parts_reservations` (legado / ainda não espelhada na tabela de oficina) */
  isReservationOnly: boolean;
  qtyNoted: number;
  qtyReleased: number;
  qtyCancelled: number;
  unitPriceApplied: number;
  unitPriceOriginalSnapshot: number | null;
  priceBasis: 'original' | 'substitute' | 'manual';
  replacesLineId: string | null;
  reservationId: string | null;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CatalogPartResult {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
}

export interface PaginatedCatalogResult {
  data: CatalogPartResult[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderSuggestion {
  id: string;
  orderNumber: string;
  customerName: string | null;
}

function coalesceInt(value: unknown): number {
  if (value == null || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDbLine(row: Record<string, unknown>): WorkshopPartLine {
  const r = row as Record<string, unknown>;
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    partId: (row.part_id as string | null) ?? null,
    partCode: String(row.part_code),
    partName: String(row.part_name),
    sectionName: String(row.section_name),
    source: row.source as WorkshopPartLine['source'],
    isExtra: Boolean(row.is_extra),
    isReservationOnly: false,
    qtyNoted: coalesceInt(r.qty_noted ?? r.qtyNoted),
    qtyReleased: coalesceInt(r.qty_released ?? r.qtyReleased),
    qtyCancelled: coalesceInt(r.qty_cancelled ?? r.qtyCancelled),
    unitPriceApplied: Number(row.unit_price_applied ?? 0),
    unitPriceOriginalSnapshot:
      row.unit_price_original_snapshot === null || row.unit_price_original_snapshot === undefined
        ? null
        : Number(row.unit_price_original_snapshot),
    priceBasis: row.price_basis as WorkshopPartLine['priceBasis'],
    replacesLineId: (row.replaces_line_id as string | null) ?? null,
    reservationId: (row.reservation_id as string | null) ?? null,
    cancellationReason: (row.cancellation_reason as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

function workshopLineFromReservationRow(
  res: Record<string, unknown>,
  orderId: string
): WorkshopPartLine {
  const resId = String(res.id);
  const qtyReserved = Number(res.quantity_reserved ?? 0);
  const qtySeparated = Number(res.quantity_separated ?? 0);
  const qtyApplied = Number(res.quantity_applied ?? 0);
  const status = String(res.reservation_status ?? '');
  return {
    id: `${WORKSHOP_RESERVATION_ONLY_LINE_PREFIX}${resId}`,
    orderId,
    partId: (res.part_id as string | null) ?? null,
    partCode: String(res.part_code ?? ''),
    partName: String(res.part_name ?? ''),
    sectionName: 'Reserva comercial',
    source: 'commercial_json',
    isExtra: false,
    isReservationOnly: true,
    qtyNoted: qtyReserved > 0 ? qtyReserved : 1,
    qtyReleased: Math.max(qtySeparated, qtyApplied),
    qtyCancelled: 0,
    unitPriceApplied: Number(res.unit_cost ?? 0),
    unitPriceOriginalSnapshot: null,
    priceBasis: 'original',
    replacesLineId: null,
    reservationId: resId,
    cancellationReason: null,
    notes: status ? `Reserva: ${status}` : null,
    createdAt: String(res.reserved_at ?? res.created_at ?? new Date().toISOString()),
  };
}

/** Quantidade ainda elegível para baixa (notada − baixada − cancelada). */
export function getWorkshopLineRemainingToRelease(line: WorkshopPartLine): number {
  const noted = Number(line.qtyNoted ?? 0);
  const released = Number(line.qtyReleased ?? 0);
  const cancelled = Number(line.qtyCancelled ?? 0);
  if (!Number.isFinite(noted) || noted <= 0) return 0;
  return Math.max(0, noted - released - cancelled);
}

function remainingReleaseQtyFromDbRow(line: Record<string, unknown>): number {
  const noted = coalesceInt(line.qty_noted ?? line.qtyNoted);
  const released = coalesceInt(line.qty_released ?? line.qtyReleased);
  const cancelled = coalesceInt(line.qty_cancelled ?? line.qtyCancelled);
  if (noted <= 0) return 0;
  return Math.max(0, noted - released - cancelled);
}

function parseCommercialParts(budgetRows: Array<Record<string, unknown>>): CommercialPartItem[] {
  const parsed: CommercialPartItem[] = [];

  for (const budget of budgetRows ?? []) {
    const rawParts = Array.isArray(budget.parts) ? budget.parts : [];
    rawParts.forEach((part: unknown, index: number) => {
      const partObj = (part ?? {}) as Record<string, unknown>;
      parsed.push({
        key: `${String(budget.id)}:${index}`,
        code: String(partObj.part_code ?? partObj.code ?? `SEM-COD-${index + 1}`),
        name: String(partObj.part_name ?? partObj.name ?? 'Peça sem descrição'),
        quantity: Number(partObj.quantity ?? 1),
        unitPrice: Number(partObj.unit_price ?? partObj.price ?? 0),
        sourceBudgetId: String(budget.id),
      });
    });
  }

  return parsed;
}

async function fetchLineOrThrow(client: DbClient, lineId: string, orgId: string) {
  const { data, error } = await client
    .from('workshop_os_part_lines')
    .select('*')
    .eq('id', lineId)
    .eq('org_id', orgId)
    .single();

  if (error || !data) {
    throw new Error('Linha da OS não encontrada');
  }
  return data;
}

async function fetchPartStockOrThrow(client: DbClient, orgId: string, partCode: string, partId?: string | null) {
  if (partId) {
    const byId = await client
      .from('parts_inventory')
      .select('id, quantity, unit_cost, part_code')
      .eq('org_id', orgId)
      .eq('id', partId)
      .maybeSingle();
    if (byId.data && !byId.error) {
      return byId.data;
    }
  }

  const byCode = await client
    .from('parts_inventory')
    .select('id, quantity, unit_cost, part_code')
    .eq('org_id', orgId)
    .eq('part_code', partCode)
    .maybeSingle();

  if (byCode.error || !byCode.data) {
    throw new Error(`Peça "${partCode || partId}" não encontrada no estoque`);
  }
  return byCode.data;
}

export class WorkshopOsPartsService {
  static async searchOrderSuggestions(orgId: string, term: string): Promise<OrderSuggestion[]> {
    const queryTerm = term.trim();
    if (!queryTerm) return [];

    const { data, error } = await db()
      .from('orders')
      .select('id, order_number, customers(name)')
      .eq('org_id', orgId)
      .ilike('order_number', `%${queryTerm}%`)
      .order('order_number', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Erro ao buscar sugestões de OS: ${error.message}`);
    }

    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      orderNumber: String(row.order_number),
      customerName: ((row.customers as { name?: string } | null)?.name as string | undefined) ?? null,
    }));
  }

  static async getOrderByNumber(orgId: string, orderNumberInput: string): Promise<{ id: string; order_number: string }> {
    const parsed = orderNumberSearchSchema.parse({ orderNumber: orderNumberInput });
    const { data, error } = await db()
      .from('orders')
      .select('id, order_number')
      .eq('org_id', orgId)
      .eq('order_number', parsed.orderNumber)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar OS: ${error.message}`);
    }

    if (!data) {
      throw new Error('OS não encontrada ou sem permissão de acesso');
    }

    return data;
  }

  static async getOrderContext(orgId: string, orderId: string): Promise<WorkshopOrderContext> {
    const { data: orderData, error: orderError } = await db()
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        customers(name),
        engines(brand, model, type),
        detailed_budgets(id, parts, created_at)
      `)
      .eq('org_id', orgId)
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      throw new Error('OS não encontrada ou sem permissão de acesso');
    }

    const { data: lineRows, error: linesError } = await db()
      .from('workshop_os_part_lines')
      .select('*')
      .eq('org_id', orgId)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (linesError) {
      throw new Error(`Erro ao carregar linhas da oficina: ${linesError.message}`);
    }

    const workshopRows = (lineRows ?? []).map((row: Record<string, unknown>) => normalizeDbLine(row));
    const coveredReservationIds = new Set(
      workshopRows.map((l) => l.reservationId).filter((id): id is string => Boolean(id))
    );

    const { data: reservationRows, error: reservationsError } = await db()
      .from('parts_reservations')
      .select('*')
      .eq('org_id', orgId)
      .eq('order_id', orderId)
      .order('reserved_at', { ascending: false });

    if (reservationsError) {
      throw new Error(`Erro ao carregar reservas de peças: ${reservationsError.message}`);
    }

    const reservationOnlyLines: WorkshopPartLine[] = [];
    for (const row of reservationRows ?? []) {
      const res = row as Record<string, unknown>;
      const resId = String(res.id ?? '');
      const status = String(res.reservation_status ?? '');
      if (!resId || status === 'cancelled' || status === 'expired') continue;
      if (coveredReservationIds.has(resId)) continue;
      reservationOnlyLines.push(workshopLineFromReservationRow(res, orderData.id));
    }

    const engine = orderData.engines;
    const engineLabel = engine ? `${engine.brand ?? ''} ${engine.model ?? ''} ${engine.type ?? ''}`.trim() : null;

    return {
      id: orderData.id,
      orderNumber: orderData.order_number,
      status: orderData.status,
      customerName: orderData.customers?.name ?? null,
      engineLabel,
      commercialParts: parseCommercialParts(orderData.detailed_budgets ?? []),
      workshopLines: [...workshopRows, ...reservationOnlyLines],
    };
  }

  static async searchCatalogParts(
    orgId: string,
    input: PaginatedCatalogSearchInput
  ): Promise<PaginatedCatalogResult> {
    const parsed = paginatedCatalogSearchSchema.parse(input);
    const from = (parsed.page - 1) * parsed.pageSize;
    const to = from + parsed.pageSize - 1;

    let query = db()
      .from('parts_inventory')
      .select('id, part_code, part_name, quantity, unit_cost', { count: 'exact' })
      .eq('org_id', orgId)
      .order('part_name', { ascending: true })
      .range(from, to);

    if (parsed.query) {
      query = query.or(`part_code.ilike.%${parsed.query}%,part_name.ilike.%${parsed.query}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      throw new Error(`Erro ao pesquisar catálogo: ${error.message}`);
    }

    const safeCount = count ?? 0;
    return {
      data: (data ?? []) as CatalogPartResult[],
      count: safeCount,
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalPages: Math.max(1, Math.ceil(safeCount / parsed.pageSize)),
    };
  }

  static async addExtraLine(orgId: string, userId: string, input: AddExtraLineInput): Promise<WorkshopPartLine> {
    const parsed = addExtraLineSchema.parse(input);
    const { data, error } = await db()
      .from('workshop_os_part_lines')
      .insert({
        org_id: orgId,
        order_id: parsed.orderId,
        budget_id: parsed.budgetId ?? null,
        part_id: parsed.partId ?? null,
        part_code: parsed.partCode,
        part_name: parsed.partName,
        source: 'extra',
        is_extra: true,
        section_name: parsed.sectionName,
        qty_noted: parsed.quantity,
        unit_price_applied: parsed.unitPriceApplied,
        price_basis: 'manual',
        notes: parsed.notes ?? null,
        created_by: userId,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Erro ao incluir peça extra: ${error?.message ?? 'erro desconhecido'}`);
    }

    return normalizeDbLine(data);
  }

  static async noteLine(orgId: string, userId: string, input: NoteLineInput): Promise<WorkshopPartLine> {
    const parsed = noteLineSchema.parse(input);
    const { data, error } = await db()
      .from('workshop_os_part_lines')
      .insert({
        org_id: orgId,
        order_id: parsed.orderId,
        part_id: parsed.partId ?? null,
        part_code: parsed.partCode,
        part_name: parsed.partName,
        source: parsed.source,
        is_extra: parsed.isExtra,
        section_name: parsed.sectionName,
        qty_noted: parsed.quantity,
        unit_price_applied: parsed.unitPriceApplied,
        price_basis: parsed.source === 'commercial_json' ? 'original' : 'manual',
        commercial_line_key: parsed.commercialLineKey ?? null,
        notes: parsed.notes ?? null,
        created_by: userId,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Erro ao anotar peça: ${error?.message ?? 'erro desconhecido'}`);
    }

    return normalizeDbLine(data);
  }

  static async releaseStock(orgId: string, userId: string, input: ReleaseStockInput): Promise<WorkshopPartLine> {
    const parsed = releaseStockSchema.parse(input);
    const client = db();
    const line = await fetchLineOrThrow(client, parsed.lineId, orgId);

    const remaining = remainingReleaseQtyFromDbRow(line);
    if (remaining <= 0) {
      throw new Error(
        'Não há quantidade disponível para baixa nesta linha (verifique se já foi baixada ou cancelada por completo).'
      );
    }
    if (parsed.quantity > remaining) {
      throw new Error(`Quantidade para baixa excede o disponível (${remaining})`);
    }

    const stock = await fetchPartStockOrThrow(client, orgId, String(line.part_code ?? ''), (line.part_id as string | null) ?? null);
    if (Number(stock.quantity) < parsed.quantity) {
      throw new Error(`Estoque insuficiente. Disponível: ${stock.quantity}`);
    }

    const { data: movement, error: movementError } = await client
      .from('inventory_movements')
      .insert({
        org_id: orgId,
        part_id: stock.id,
        movement_type: 'saida',
        quantity: parsed.quantity,
        previous_quantity: stock.quantity,
        new_quantity: Number(stock.quantity) - parsed.quantity,
        order_id: line.order_id,
        reason: parsed.reason,
        notes: parsed.notes ?? null,
        created_by: userId,
        requires_approval: false,
        approval_status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
        metadata: { action_type: 'workshop_release', workshop_line_id: line.id },
      })
      .select('id')
      .single();

    if (movementError || !movement) {
      throw new Error(`Erro ao gravar movimentação de baixa: ${movementError?.message ?? 'erro desconhecido'}`);
    }

    const { data, error } = await client
      .from('workshop_os_part_lines')
      .update({
        qty_released: Number(line.qty_released) + parsed.quantity,
        last_movement_id: movement.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', line.id)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Erro ao atualizar linha após baixa: ${error?.message ?? 'erro desconhecido'}`);
    }

    return normalizeDbLine(data);
  }

  static async substituteLine(orgId: string, userId: string, input: SubstituteLineInput): Promise<WorkshopPartLine> {
    const parsed = substituteLineSchema.parse(input);
    const client = db();
    const line = await fetchLineOrThrow(client, parsed.lineId, orgId);
    const remaining = Number(line.qty_noted) - Number(line.qty_released) - Number(line.qty_cancelled);

    if (remaining <= 0) {
      throw new Error('A linha original não possui saldo para substituição');
    }

    const qtyToSubstitute = Math.min(parsed.quantity, remaining);
    const { error: cancelError } = await client
      .from('workshop_os_part_lines')
      .update({
        qty_cancelled: Number(line.qty_cancelled) + qtyToSubstitute,
        cancellation_reason: 'Substituída por outra peça',
      })
      .eq('id', line.id);

    if (cancelError) {
      throw new Error(`Erro ao marcar linha substituída: ${cancelError.message}`);
    }

    const { data, error } = await client
      .from('workshop_os_part_lines')
      .insert({
        org_id: orgId,
        order_id: line.order_id,
        budget_id: line.budget_id,
        part_id: parsed.newPartId ?? null,
        part_code: parsed.newPartCode,
        part_name: parsed.newPartName,
        source: 'substitution',
        section_name: parsed.sectionName,
        qty_noted: qtyToSubstitute,
        unit_price_original_snapshot:
          parsed.originalUnitPriceSnapshot ?? Number(line.unit_price_applied ?? 0),
        unit_price_applied: parsed.newUnitPrice,
        price_basis: parsed.priceBasis,
        replaces_line_id: line.id,
        is_extra: line.is_extra,
        notes: parsed.notes ?? null,
        created_by: userId,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Erro ao criar linha de substituição: ${error?.message ?? 'erro desconhecido'}`);
    }

    return normalizeDbLine(data);
  }

  static async cancelPartial(
    orgId: string,
    userId: string,
    input: CancelPartialInput
  ): Promise<{ line: WorkshopPartLine; receipt: string | null }> {
    const parsed = cancelPartialSchema.parse(input);
    const client = db();
    const line = await fetchLineOrThrow(client, parsed.lineId, orgId);

    const availableToCancel = Number(line.qty_noted) - Number(line.qty_cancelled);
    if (parsed.quantity > availableToCancel) {
      throw new Error(`Quantidade para cancelamento excede o elegível (${availableToCancel})`);
    }

    const qtyReleased = Number(line.qty_released ?? 0);
    const qtyToReverse = Math.min(parsed.quantity, qtyReleased);

    if (qtyToReverse > 0) {
      const stock = await fetchPartStockOrThrow(
        client,
        orgId,
        String(line.part_code ?? ''),
        (line.part_id as string | null) ?? null
      );

      const { error: movementError } = await client
        .from('inventory_movements')
        .insert({
          org_id: orgId,
          part_id: stock.id,
          movement_type: 'entrada',
          quantity: qtyToReverse,
          previous_quantity: Number(stock.quantity),
          new_quantity: Number(stock.quantity) + qtyToReverse,
          order_id: line.order_id,
          reason: `Estorno por cancelamento parcial de peça na OS`,
          notes: parsed.reason,
          created_by: userId,
          requires_approval: false,
          approval_status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          metadata: { action_type: 'workshop_cancel_partial', workshop_line_id: line.id },
        });

      if (movementError) {
        throw new Error(`Erro ao estornar estoque no cancelamento parcial: ${movementError.message}`);
      }
    }

    const { data, error } = await client
      .from('workshop_os_part_lines')
      .update({
        qty_cancelled: Number(line.qty_cancelled) + parsed.quantity,
        qty_released: Math.max(0, qtyReleased - qtyToReverse),
        cancellation_reason: parsed.reason,
        notes: parsed.notes ?? line.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', line.id)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Erro ao cancelar parcialmente a linha: ${error?.message ?? 'erro desconhecido'}`);
    }

    let receipt: string | null = null;
    if (parsed.issueReceipt) {
      const { data: orderRow } = await client
        .from('orders')
        .select('order_number')
        .eq('id', line.order_id)
        .eq('org_id', orgId)
        .maybeSingle();

      const orderNumber =
        orderRow && typeof orderRow === 'object' && 'order_number' in orderRow
          ? String((orderRow as { order_number?: string }).order_number ?? '')
          : '';

      receipt = [
        'Recibo de cancelamento de consumo',
        `Data: ${new Date().toLocaleString('pt-BR')}`,
        orderNumber ? `OS: ${orderNumber}` : `OS (id): ${String(line.order_id)}`,
        `Peça: ${line.part_name} (${line.part_code})`,
        `Quantidade cancelada: ${parsed.quantity}`,
        qtyToReverse > 0 ? `Estorno de estoque: ${qtyToReverse} un.` : 'Estorno de estoque: não aplicável (nada havia sido baixado)',
        `Motivo: ${parsed.reason}`,
        `Responsável (id): ${userId}`,
      ].join('\n');
    }

    return { line: normalizeDbLine(data), receipt };
  }

  static async removeLines(orgId: string, userId: string, lineIds: string[]): Promise<void> {
    if (lineIds.length === 0) return;
    const client = db();
    const workshopIds: string[] = [];
    const reservationIds: string[] = [];

    for (const id of lineIds) {
      if (id.startsWith(WORKSHOP_RESERVATION_ONLY_LINE_PREFIX)) {
        reservationIds.push(id.slice(WORKSHOP_RESERVATION_ONLY_LINE_PREFIX.length));
      } else {
        workshopIds.push(id);
      }
    }

    if (workshopIds.length > 0) {
      const { error } = await client
        .from('workshop_os_part_lines')
        .delete()
        .eq('org_id', orgId)
        .in('id', workshopIds);

      if (error) {
        throw new Error(`Erro ao remover peça(s) da OS: ${error.message}`);
      }
    }

    for (const rid of reservationIds) {
      const { data: resRow, error: fetchErr } = await client
        .from('parts_reservations')
        .select('id, reservation_status, quantity_applied')
        .eq('org_id', orgId)
        .eq('id', rid)
        .maybeSingle();

      if (fetchErr) {
        throw new Error(`Erro ao validar reserva: ${fetchErr.message}`);
      }
      if (!resRow) {
        throw new Error('Reserva de peça não encontrada ou sem permissão');
      }

      const qtyApplied = Number((resRow as { quantity_applied?: number }).quantity_applied ?? 0);
      if (qtyApplied > 0) {
        throw new Error(
          'Não é possível remover esta peça: já houve aplicação na OS. Trate o estorno pelo fluxo de materiais/reservas.'
        );
      }

      const st = String((resRow as { reservation_status?: string }).reservation_status ?? '');
      if (st === 'cancelled' || st === 'expired') {
        continue;
      }

      const { error: updErr } = await client
        .from('parts_reservations')
        .update({
          reservation_status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: userId,
          cancellation_reason: 'Removido na gestão de peças da OS',
        })
        .eq('org_id', orgId)
        .eq('id', rid);

      if (updErr) {
        throw new Error(`Erro ao cancelar reserva de peça: ${updErr.message}`);
      }
    }
  }
}
