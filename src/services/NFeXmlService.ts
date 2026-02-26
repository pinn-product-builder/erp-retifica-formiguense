export interface NFeItem {
  codigo:        string;
  descricao:     string;
  ncm:           string;
  cfop:          string;
  quantidade:    number;
  unidade:       string;
  valor_unitario: number;
  valor_total:   number;
}

export interface NFeData {
  chave_acesso:  string;
  numero:        string;
  serie:         string;
  data_emissao:  string;
  emitente: {
    cnpj:        string;
    razao_social: string;
  };
  itens:         NFeItem[];
  totais: {
    valor_produtos: number;
    valor_frete:    number;
    valor_desconto: number;
    valor_total:    number;
    valor_icms:     number;
    valor_ipi:      number;
  };
  duplicatas: { numero: string; vencimento: string; valor: number }[];
}

function txt(el: Element | null, tag: string): string {
  return el?.getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';
}

function num(el: Element | null, tag: string): number {
  return parseFloat(txt(el, tag)) || 0;
}

export function parseNFeXml(xmlContent: string): NFeData {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(xmlContent, 'application/xml');

  const parseErr = doc.querySelector('parsererror');
  if (parseErr) throw new Error('XML inválido ou corrompido');

  const infNFe = doc.getElementsByTagName('infNFe')[0];
  if (!infNFe) throw new Error('Estrutura NF-e não encontrada no XML');

  const ide   = infNFe.getElementsByTagName('ide')[0];
  const emit  = infNFe.getElementsByTagName('emit')[0];
  const total = infNFe.getElementsByTagName('total')[0];
  const icmsTot = total?.getElementsByTagName('ICMSTot')[0] ?? null;
  const cobr  = infNFe.getElementsByTagName('cobr')[0];

  const chave = infNFe.getAttribute('Id')?.replace(/^NFe/, '') ?? '';

  const itens: NFeItem[] = Array.from(infNFe.getElementsByTagName('det')).map((det) => {
    const prod = det.getElementsByTagName('prod')[0];
    return {
      codigo:         txt(prod, 'cProd'),
      descricao:      txt(prod, 'xProd'),
      ncm:            txt(prod, 'NCM'),
      cfop:           txt(prod, 'CFOP'),
      quantidade:     num(prod, 'qCom'),
      unidade:        txt(prod, 'uCom'),
      valor_unitario: num(prod, 'vUnCom'),
      valor_total:    num(prod, 'vProd'),
    };
  });

  const duplicatas = Array.from(cobr?.getElementsByTagName('dup') ?? []).map((dup) => ({
    numero:     txt(dup, 'nDup'),
    vencimento: txt(dup, 'dVenc'),
    valor:      num(dup, 'vDup'),
  }));

  return {
    chave_acesso:   chave,
    numero:         txt(ide, 'nNF'),
    serie:          txt(ide, 'serie'),
    data_emissao:   txt(ide, 'dhEmi').split('T')[0] || txt(ide, 'dEmi'),
    emitente: {
      cnpj:         txt(emit, 'CNPJ'),
      razao_social: txt(emit, 'xNome'),
    },
    itens,
    totais: {
      valor_produtos: num(icmsTot, 'vProd'),
      valor_frete:    num(icmsTot, 'vFrete'),
      valor_desconto: num(icmsTot, 'vDesc'),
      valor_total:    num(icmsTot, 'vNF'),
      valor_icms:     num(icmsTot, 'vICMS'),
      valor_ipi:      num(icmsTot, 'vIPI'),
    },
    duplicatas,
  };
}
