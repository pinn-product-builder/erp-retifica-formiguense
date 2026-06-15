import { describe, expect, it } from 'vitest';
import {
  parseOfxBankStatement,
  parseCsvBankStatement,
  parseBankStatementFile,
} from '@/services/financial/bankStatementParsers';

const OFX_SAMPLE = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>341
<ACCTID>12345-6
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260610
<TRNAMT>-150.50
<FITID>FITID-001
<NAME>PAGAMENTO FORNECEDOR A
<MEMO>NF 12345
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260611
<TRNAMT>5000.00
<FITID>FITID-002
<NAME>RECEBIMENTO CLIENTE B
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

describe('parseOfxBankStatement', () => {
  it('extrai todas as transações com FITID, data e valor', () => {
    const lines = parseOfxBankStatement(OFX_SAMPLE);
    expect(lines).toHaveLength(2);

    expect(lines[0]).toMatchObject({
      transaction_date: '2026-06-10',
      amount: -150.5,
      external_id: 'FITID-001',
    });
    expect(lines[0].description).toContain('PAGAMENTO FORNECEDOR A');

    expect(lines[1]).toMatchObject({
      transaction_date: '2026-06-11',
      amount: 5000,
      external_id: 'FITID-002',
    });
  });

  it('rejeita arquivo que não é OFX', () => {
    expect(() => parseOfxBankStatement('lorem ipsum dolor sit amet')).toThrowError(
      /n.o parece OFX/i
    );
  });

  it('rejeita OFX vazio', () => {
    const empty = '<OFX></OFX>';
    expect(() => parseOfxBankStatement(empty)).toThrowError(/nenhuma transa..o/i);
  });
});

describe('parseCsvBankStatement', () => {
  it('parseia CSV BR com cabeçalho data;valor;descrição', () => {
    const csv = [
      'data;valor;descricao',
      '10/06/2026;-150,50;Pagamento Fornecedor A',
      '11/06/2026;5000,00;Recebimento Cliente B',
    ].join('\n');
    const lines = parseCsvBankStatement(csv);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      transaction_date: '2026-06-10',
      amount: -150.5,
      description: 'Pagamento Fornecedor A',
    });
    expect(lines[1].amount).toBe(5000);
  });

  it('ignora linhas inválidas', () => {
    const csv = ['lixo;sem;dados', '11/06/2026;5000,00;Receita'].join('\n');
    const lines = parseCsvBankStatement(csv);
    expect(lines).toHaveLength(1);
  });
});

describe('parseBankStatementFile (roteador)', () => {
  it('detecta OFX pela extensão .ofx', () => {
    const r = parseBankStatementFile('extrato.ofx', OFX_SAMPLE);
    expect(r.format).toBe('OFX');
    expect(r.lines).toHaveLength(2);
  });

  it('detecta OFX em .txt pelo conteúdo', () => {
    const r = parseBankStatementFile('extrato.txt', OFX_SAMPLE);
    expect(r.format).toBe('OFX');
  });

  it('detecta CSV pela extensão', () => {
    const csv = 'data;valor;descricao\n10/06/2026;100,00;Teste';
    const r = parseBankStatementFile('extrato.csv', csv);
    expect(r.format).toBe('CSV');
    expect(r.lines[0].amount).toBe(100);
  });

  it('rejeita extensão não suportada', () => {
    expect(() => parseBankStatementFile('extrato.xlsx', 'qualquer')).toThrowError(
      /n.o suportado/i
    );
  });
});
