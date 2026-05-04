import { describe, expect, it, vi } from 'vitest';
import { applyOrgIdFilter, assertSingleOrgForWrite } from '@/services/financial/orgScope';

function mockQuery() {
  const q = {
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
  };
  return q;
}

describe('orgScope', () => {
  it('applyOrgIdFilter usa eq com um id', () => {
    const q = mockQuery();
    applyOrgIdFilter(q, 'org_id', ['a']);
    expect(q.eq).toHaveBeenCalledWith('org_id', 'a');
    expect(q.in).not.toHaveBeenCalled();
  });

  it('applyOrgIdFilter usa in com vários ids', () => {
    const q = mockQuery();
    applyOrgIdFilter(q, 'org_id', ['a', 'b']);
    expect(q.in).toHaveBeenCalledWith('org_id', ['a', 'b']);
  });

  it('assertSingleOrgForWrite retorna o único org', () => {
    expect(assertSingleOrgForWrite(['x'])).toBe('x');
  });

  it('assertSingleOrgForWrite lança se não houver exatamente um', () => {
    expect(() => assertSingleOrgForWrite([])).toThrow();
    expect(() => assertSingleOrgForWrite(['a', 'b'])).toThrow();
  });
});
