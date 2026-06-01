import { describe, it, expect } from 'vitest';
import { ReportEngine } from './reportEngine';
import type { ReportField, ReportRow } from './types';

const FIELDS: ReportField[] = [
  { key: 'customer', label: 'Cliente', type: 'text', defaultVisible: true },
  { key: 'amount', label: 'Valor', type: 'currency', defaultVisible: true, aggregatable: 'sum' },
  { key: 'qty', label: 'Quantidade', type: 'number', defaultVisible: true, aggregatable: 'count' },
  { key: 'rate', label: 'Taxa', type: 'percent', defaultVisible: true, aggregatable: 'avg' },
  { key: 'date', label: 'Data', type: 'date', defaultVisible: true },
];

const SAMPLE: ReportRow[] = [
  { customer: 'A', amount: 100, qty: 1, rate: 0.10, date: '2026-05-01' },
  { customer: 'A', amount: 200, qty: 2, rate: 0.20, date: '2026-05-02' },
  { customer: 'B', amount: 300, qty: 3, rate: 0.30, date: '2026-05-03' },
];

describe('ReportEngine.aggregate', () => {
  it('soma campos aggregatable=sum', () => {
    const r = ReportEngine.aggregate(SAMPLE, FIELDS);
    expect(r.amount).toBe(600);
  });

  it('conta campos aggregatable=count', () => {
    const r = ReportEngine.aggregate(SAMPLE, FIELDS);
    expect(r.qty).toBe(3);
  });

  it('calcula média para aggregatable=avg', () => {
    const r = ReportEngine.aggregate(SAMPLE, FIELDS);
    expect(r.rate).toBeCloseTo(0.20);
  });

  it('ignora campos não numéricos', () => {
    const r = ReportEngine.aggregate(SAMPLE, FIELDS);
    expect(r.customer).toBeUndefined();
    expect(r.date).toBeUndefined();
  });

  it('retorna objeto vazio quando não há linhas', () => {
    const r = ReportEngine.aggregate([], FIELDS);
    expect(r).toEqual({});
  });
});

describe('ReportEngine.groupRows', () => {
  it('agrupa por chave extraída', () => {
    const groups = ReportEngine.groupRows(
      SAMPLE,
      (row) => String(row.customer),
      FIELDS
    );
    expect(groups).toHaveLength(2);
    const groupA = groups.find((g) => g.groupKey === 'A');
    const groupB = groups.find((g) => g.groupKey === 'B');
    expect(groupA?.rows).toHaveLength(2);
    expect(groupB?.rows).toHaveLength(1);
  });

  it('calcula subtotais corretos por grupo', () => {
    const groups = ReportEngine.groupRows(
      SAMPLE,
      (row) => String(row.customer),
      FIELDS
    );
    const groupA = groups.find((g) => g.groupKey === 'A')!;
    const groupB = groups.find((g) => g.groupKey === 'B')!;
    expect(groupA.subtotals.amount).toBe(300);
    expect(groupB.subtotals.amount).toBe(300);
    expect(groupA.subtotals.qty).toBe(2);
    expect(groupB.subtotals.qty).toBe(1);
  });

  it('lida com linhas sem chave (todos no mesmo grupo "")', () => {
    const rows: ReportRow[] = [
      { amount: 50, customer: null, qty: 1, rate: 0, date: null },
      { amount: 70, customer: null, qty: 1, rate: 0, date: null },
    ];
    const groups = ReportEngine.groupRows(rows, (r) => String(r.customer ?? ''), FIELDS);
    expect(groups).toHaveLength(1);
    expect(groups[0].subtotals.amount).toBe(120);
  });
});

describe('ReportEngine.sortRows', () => {
  it('ordena por número ascendente', () => {
    const sorted = ReportEngine.sortRows(
      [{ amount: 30 }, { amount: 10 }, { amount: 20 }] as ReportRow[],
      { field: 'amount', direction: 'asc' }
    );
    expect(sorted.map((r) => r.amount)).toEqual([10, 20, 30]);
  });

  it('ordena por número descendente', () => {
    const sorted = ReportEngine.sortRows(
      [{ amount: 30 }, { amount: 10 }, { amount: 20 }] as ReportRow[],
      { field: 'amount', direction: 'desc' }
    );
    expect(sorted.map((r) => r.amount)).toEqual([30, 20, 10]);
  });

  it('ordena por string em pt-BR (acentos)', () => {
    const sorted = ReportEngine.sortRows(
      [{ customer: 'Ávila' }, { customer: 'Castro' }, { customer: 'Almeida' }] as ReportRow[],
      { field: 'customer', direction: 'asc' }
    );
    expect(sorted.map((r) => r.customer)).toEqual(['Almeida', 'Ávila', 'Castro']);
  });

  it('coloca null no final em qualquer direção', () => {
    const sorted = ReportEngine.sortRows(
      [{ amount: 10 }, { amount: null }, { amount: 5 }] as ReportRow[],
      { field: 'amount', direction: 'asc' }
    );
    expect(sorted[sorted.length - 1].amount).toBeNull();
  });

  it('não muta o array original', () => {
    const original: ReportRow[] = [{ amount: 30 }, { amount: 10 }];
    ReportEngine.sortRows(original, { field: 'amount', direction: 'asc' });
    expect(original[0].amount).toBe(30);
  });
});
