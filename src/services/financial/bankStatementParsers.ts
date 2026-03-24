export type ParsedStatementLine = {
  transaction_date: string;
  amount: number;
  description: string | null;
  balance_after: number | null;
  external_id: string | null;
};

function normalizeDateCell(raw: string): string | null {
  const t = raw.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t);
  if (br) {
    const d = br[1].padStart(2, '0');
    const m = br[2].padStart(2, '0');
    return `${br[3]}-${m}-${d}`;
  }
  return null;
}

function parseAmountCell(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '').replace(/"/g, '');
  const neg = s.startsWith('-');
  const n = s.replace('-', '').replace(/\./g, '').replace(',', '.');
  const v = Number(n);
  if (Number.isNaN(v)) return null;
  return neg ? -v : v;
}

export function parseCsvBankStatement(text: string): ParsedStatementLine[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const out: ParsedStatementLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (i === 0 && (lower.includes('data') || lower.includes('date')) && lower.includes('valor')) {
      continue;
    }
    const delim = line.includes(';') ? ';' : ',';
    const parts = line.split(delim).map((s) => s.trim().replace(/^"|"$/g, ''));
    if (parts.length < 2) continue;
    const dateStr = normalizeDateCell(parts[0]);
    const amount = parseAmountCell(parts[1]);
    if (!dateStr || amount === null) continue;
    out.push({
      transaction_date: dateStr,
      amount,
      description: parts[2] ?? null,
      balance_after: null,
      external_id: null,
    });
  }
  return out;
}

export function parseOfxBankStatement(text: string): ParsedStatementLine[] {
  const results: ParsedStatementLine[] = [];
  const upper = text.toUpperCase();
  if (!upper.includes('<OFX') && !upper.includes('OFXHEADER')) {
    throw new Error('Arquivo não parece OFX');
  }
  const blocks = text.split(/<STMTTRN>/i);
  for (let i = 1; i < blocks.length; i++) {
    const chunk = blocks[i].split(/<\/STMTTRN>/i)[0];
    const dt8 = /<DTPOSTED>\s*(\d{8})/i.exec(chunk);
    const dt14 = !dt8 ? /<DTPOSTED>\s*(\d{14})/i.exec(chunk) : null;
    const rawDt = dt8?.[1] ?? dt14?.[1];
    const amtM = /<TRNAMT>\s*([-0-9.,]+)/i.exec(chunk);
    const nameM = /<NAME>\s*([^\n<]+)/i.exec(chunk);
    const memoM = /<MEMO>\s*([^\n<]+)/i.exec(chunk);
    const fitidM = /<FITID>\s*([^\n<]+)/i.exec(chunk);
    if (!rawDt || !amtM) continue;
    const y = rawDt.slice(0, 4);
    const m = rawDt.slice(4, 6);
    const d = rawDt.slice(6, 8);
    const dateStr = `${y}-${m}-${d}`;
    const amount = Number(String(amtM[1]).replace(',', '.'));
    if (Number.isNaN(amount)) continue;
    const desc = (nameM?.[1] ?? memoM?.[1] ?? '').trim();
    results.push({
      transaction_date: dateStr,
      amount,
      description: desc || null,
      balance_after: null,
      external_id: fitidM?.[1]?.trim() ?? null,
    });
  }
  if (results.length === 0) {
    throw new Error('Nenhuma transação OFX encontrada');
  }
  return results;
}

export function parseBankStatementFile(
  fileName: string,
  text: string
): { format: string; lines: ParsedStatementLine[] } {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'ofx' || ext === 'qfx' || text.trimStart().startsWith('OFXHEADER')) {
    return { format: 'OFX', lines: parseOfxBankStatement(text) };
  }
  if (ext === 'txt' && text.toUpperCase().includes('<OFX')) {
    return { format: 'OFX', lines: parseOfxBankStatement(text) };
  }
  if (ext === 'csv' || ext === 'txt') {
    const lines = parseCsvBankStatement(text);
    if (lines.length === 0) {
      throw new Error('CSV sem linhas válidas (esperado: data;valor;descrição)');
    }
    return { format: 'CSV', lines };
  }
  throw new Error('Formato não suportado. Use OFX, QFX ou CSV.');
}
