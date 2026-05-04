import { describe, expect, it } from 'vitest';
import { parseMoneyBr } from '@/lib/parseMoneyBr';

describe('parseMoneyBr', () => {
  it('interpreta inteiro simples', () => {
    expect(parseMoneyBr('3429')).toBe(3429);
  });
  it('interpreta centavos com vírgula', () => {
    expect(parseMoneyBr('3429,00')).toBe(3429);
    expect(parseMoneyBr('10,5')).toBe(10.5);
  });
  it('interpreta milhar BR', () => {
    expect(parseMoneyBr('3.429,00')).toBe(3429);
    expect(parseMoneyBr('1.234.567,89')).toBe(1234567.89);
  });
  it('interpreta decimal só com ponto quando há no máx. 2 casas', () => {
    expect(parseMoneyBr('10.5')).toBe(10.5);
    expect(parseMoneyBr('10.50')).toBe(10.5);
  });
  it('interpreta milhar só com pontos (sem vírgula)', () => {
    expect(parseMoneyBr('3.429')).toBe(3429);
  });
  it('retorna null para vazio ou inválido', () => {
    expect(parseMoneyBr('')).toBeNull();
    expect(parseMoneyBr('  ')).toBeNull();
    expect(parseMoneyBr('abc')).toBeNull();
  });
});
