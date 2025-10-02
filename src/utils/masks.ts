/**
 * Utilitários de Máscaras para Formulários
 * 
 * Regras:
 * - Máscaras são aplicadas apenas no frontend (visual)
 * - Dados são salvos SEM máscara no banco
 * - Use formatters para exibir e removers para salvar
 */

// ===================================
// FORMATTERS (Adicionar Máscara)
// ===================================

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(value: string): string {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return value;
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(value: string): string {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 14) {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
  return value;
}

/**
 * Formata CPF ou CNPJ automaticamente
 */
export function formatCPFCNPJ(value: string): string {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    return formatCPF(value);
  } else {
    return formatCNPJ(value);
  }
}

/**
 * Formata Telefone: (00) 0000-0000 ou (00) 00000-0000
 */
export function formatPhone(value: string): string {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 10) {
    // Fixo: (00) 0000-0000
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  } else {
    // Celular: (00) 00000-0000
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  }
}

/**
 * Formata CEP: 00000-000
 */
export function formatCEP(value: string): string {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

/**
 * Formata moeda brasileira: R$ 1.234,56
 */
export function formatCurrency(value: string | number): string {
  if (value === '' || value === null || value === undefined) return '';
  
  const numValue = typeof value === 'string' 
    ? parseFloat(value.replace(/\D/g, '')) / 100 
    : value;
  
  if (isNaN(numValue)) return '';
  
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Formata moeda para input (sem símbolo)
 */
export function formatCurrencyInput(value: string): string {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  const numValue = parseFloat(numbers) / 100;
  
  if (isNaN(numValue)) return '';
  
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formata data: DD/MM/YYYY
 */
export function formatDate(value: string): string {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  return numbers
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{4}).*/, '$1');
}

// ===================================
// REMOVERS (Remover Máscara)
// ===================================

/**
 * Remove máscara deixando apenas números
 */
export function removeMask(value: string): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Remove máscara de moeda e retorna número
 */
export function removeCurrencyMask(value: string): number {
  if (!value) return 0;
  const numbers = value.replace(/\D/g, '');
  return parseFloat(numbers) / 100;
}

/**
 * Remove máscara de data e retorna string no formato YYYY-MM-DD
 */
export function removeDateMask(value: string): string {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 8) {
    const day = numbers.substr(0, 2);
    const month = numbers.substr(2, 2);
    const year = numbers.substr(4, 4);
    return `${year}-${month}-${day}`;
  }
  return '';
}

// ===================================
// HELPERS
// ===================================

/**
 * Limita caracteres de acordo com o tipo de máscara
 */
export function limitByMask(value: string, maskType: 'cpf' | 'cnpj' | 'cpfcnpj' | 'phone' | 'cep' | 'date'): string {
  const numbers = value.replace(/\D/g, '');
  
  switch (maskType) {
    case 'cpf':
      return numbers.slice(0, 11);
    case 'cnpj':
      return numbers.slice(0, 14);
    case 'cpfcnpj':
      return numbers.slice(0, 14);
    case 'phone':
      return numbers.slice(0, 11);
    case 'cep':
      return numbers.slice(0, 8);
    case 'date':
      return numbers.slice(0, 8);
    default:
      return numbers;
  }
}

/**
 * Detecta se é CPF ou CNPJ baseado no tamanho
 */
export function detectCPForCNPJ(value: string): 'cpf' | 'cnpj' | null {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 11) return 'cpf';
  if (numbers.length === 14) return 'cnpj';
  return null;
}

