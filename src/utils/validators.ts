/**
 * Utilitários de Validação
 * 
 * Validações que devem ser usadas em conjunto com as máscaras
 */

/**
 * Valida CPF
 * @param cpf - CPF com ou sem máscara
 * @returns true se válido
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;
  
  // Remove máscara
  const numbers = cpf.replace(/\D/g, '');
  
  // Verifica tamanho
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(10, 11))) return false;
  
  return true;
}

/**
 * Valida CNPJ
 * @param cnpj - CNPJ com ou sem máscara
 * @returns true se válido
 */
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  
  // Remove máscara
  const numbers = cnpj.replace(/\D/g, '');
  
  // Verifica tamanho
  if (numbers.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let length = numbers.length - 2;
  let numbersValidation = numbers.substring(0, length);
  const digits = numbers.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  // Primeiro dígito verificador
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbersValidation.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Segundo dígito verificador
  length = length + 1;
  numbersValidation = numbers.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbersValidation.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Valida CPF ou CNPJ automaticamente
 * @param value - CPF/CNPJ com ou sem máscara
 * @returns true se válido
 */
export function validateCPFCNPJ(value: string): boolean {
  if (!value) return false;
  
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return validateCPF(value);
  } else if (numbers.length === 14) {
    return validateCNPJ(value);
  }
  
  return false;
}

/**
 * Valida e-mail
 * @param email - E-mail a ser validado
 * @returns true se válido
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone brasileiro
 * @param phone - Telefone com ou sem máscara
 * @returns true se válido
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  
  const numbers = phone.replace(/\D/g, '');
  
  // Aceita 10 dígitos (fixo) ou 11 dígitos (celular)
  if (numbers.length < 10 || numbers.length > 11) return false;
  
  // DDD não pode começar com 0
  if (numbers.charAt(0) === '0') return false;
  
  // Terceiro dígito do celular deve ser 9
  if (numbers.length === 11 && numbers.charAt(2) !== '9') return false;
  
  return true;
}

/**
 * Valida CEP
 * @param cep - CEP com ou sem máscara
 * @returns true se válido
 */
export function validateCEP(cep: string): boolean {
  if (!cep) return false;
  
  const numbers = cep.replace(/\D/g, '');
  return numbers.length === 8;
}

/**
 * Valida data no formato DD/MM/YYYY
 * @param date - Data formatada
 * @returns true se válida
 */
export function validateDate(date: string): boolean {
  if (!date) return false;
  
  const numbers = date.replace(/\D/g, '');
  if (numbers.length !== 8) return false;
  
  const day = parseInt(numbers.substr(0, 2));
  const month = parseInt(numbers.substr(2, 2));
  const year = parseInt(numbers.substr(4, 4));
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Verifica dias por mês
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Ano bissexto
  if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
    daysInMonth[1] = 29;
  }
  
  if (day > daysInMonth[month - 1]) return false;
  
  return true;
}

/**
 * Valida valor monetário
 * @param value - Valor a ser validado
 * @returns true se válido
 */
export function validateCurrency(value: string | number): boolean {
  if (value === '' || value === null || value === undefined) return false;
  
  const numValue = typeof value === 'string' 
    ? parseFloat(value.replace(/\D/g, '')) / 100 
    : value;
  
  return !isNaN(numValue) && numValue >= 0;
}

/**
 * Retorna mensagem de erro para CPF/CNPJ inválido
 */
export function getCPFCNPJErrorMessage(value: string): string {
  if (!value) return 'CPF/CNPJ é obrigatório';
  
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length < 11) return 'CPF/CNPJ incompleto';
  if (numbers.length > 11 && numbers.length < 14) return 'CNPJ incompleto';
  if (numbers.length > 14) return 'CPF/CNPJ muito longo';
  
  if (numbers.length === 11) {
    return validateCPF(value) ? '' : 'CPF inválido';
  } else {
    return validateCNPJ(value) ? '' : 'CNPJ inválido';
  }
}

/**
 * Retorna mensagem de erro para telefone inválido
 */
export function getPhoneErrorMessage(phone: string): string {
  if (!phone) return 'Telefone é obrigatório';
  
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length < 10) return 'Telefone incompleto';
  if (numbers.length > 11) return 'Telefone muito longo';
  if (numbers.charAt(0) === '0') return 'DDD inválido';
  if (numbers.length === 11 && numbers.charAt(2) !== '9') return 'Celular deve começar com 9';
  
  return '';
}

