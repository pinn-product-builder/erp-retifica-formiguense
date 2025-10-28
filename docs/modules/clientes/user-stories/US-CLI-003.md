# US-CLI-003: Validar CPF/CNPJ e Telefone

**ID:** US-CLI-003  
**Épico:** Clientes  
**Sprint:** 2  
**Prioridade:** 🔴 Alta  
**Estimativa:** 2 pontos  
**Status:** ✅ Done

---

## 📋 User Story

**Como** sistema  
**Quero** validar CPF/CNPJ e telefones automaticamente  
**Para** garantir qualidade dos dados cadastrados

---

## 🎯 Objetivo de Negócio

Prevenir cadastros com documentos inválidos que causem problemas futuros (fiscais, contato, duplicações).

---

## ✅ Critérios de Aceitação

**AC01:** CPF é validado usando algoritmo oficial da Receita Federal  
**AC02:** CNPJ é validado usando algoritmo oficial  
**AC03:** Telefone valida formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX  
**AC04:** Validação ocorre em tempo real (on blur)  
**AC05:** Mensagem de erro específica é exibida abaixo do campo  
**AC06:** Indicador visual mostra se campo está válido (✓ verde)  
**AC07:** Botão "Salvar" fica desabilitado enquanto houver erros  
**AC08:** E-mail é validado se preenchido (formato padrão)  

---

## 📐 Regras de Negócio

### RN-CLI-003-A: Biblioteca de Validações
```typescript
// lib/utils/validators.ts

export const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(12))) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(13))) return false;
  
  return true;
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
  return phoneRegex.test(phone);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email);
};
```

### RN-CLI-003-B: Componente de Validação Visual
```typescript
// components/ui/validated-input.tsx

interface ValidatedInputProps {
  value: string;
  isValid: boolean;
  error?: string;
  showValidIcon?: boolean;
}

export const ValidatedInput = ({
  value,
  isValid,
  error,
  showValidIcon = true,
  ...props
}: ValidatedInputProps & InputProps) => {
  return (
    <div className="relative">
      <Input {...props} value={value} />
      
      {/* Ícone de validação */}
      {value && showValidIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValid ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
        </div>
      )}
      
      {/* Mensagem de erro */}
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
      
      {/* Mensagem de sucesso */}
      {value && isValid && !error && (
        <p className="text-sm text-green-600 mt-1">✓ Válido</p>
      )}
    </div>
  );
};
```

---

## 💻 Implementação

### Hook de Validação: `useFieldValidation.ts`

```typescript
import { useState, useEffect } from 'react';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const useFieldValidation = (
  value: string,
  validator: (val: string) => boolean,
  errorMessage: string
): ValidationResult => {
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | undefined>();
  
  useEffect(() => {
    if (!value) {
      setIsValid(false);
      setError(undefined);
      return;
    }
    
    const valid = validator(value);
    setIsValid(valid);
    setError(valid ? undefined : errorMessage);
  }, [value, validator, errorMessage]);
  
  return { isValid, error };
};
```

### Uso no Formulário

```typescript
import { useFieldValidation } from "@/hooks/useFieldValidation";
import { validateCPF } from "@/lib/utils/validators";
import { ValidatedInput } from "@/components/ui/validated-input";

const ClienteForm = () => {
  const [cpf, setCPF] = useState('');
  
  const cpfValidation = useFieldValidation(
    cpf,
    validateCPF,
    'CPF inválido'
  );
  
  return (
    <ValidatedInput
      value={cpf}
      onChange={(e) => setCPF(e.target.value)}
      isValid={cpfValidation.isValid}
      error={cpfValidation.error}
      placeholder="000.000.000-00"
    />
  );
};
```

---

## 🧪 Cenários de Teste

```typescript
describe('Validadores', () => {
  describe('validateCPF', () => {
    it('deve aceitar CPF válido', () => {
      expect(validateCPF('123.456.789-09')).toBe(true);
    });
    
    it('deve rejeitar CPF com todos dígitos iguais', () => {
      expect(validateCPF('111.111.111-11')).toBe(false);
    });
    
    it('deve rejeitar CPF com dígito verificador errado', () => {
      expect(validateCPF('123.456.789-00')).toBe(false);
    });
  });
  
  describe('validateCNPJ', () => {
    it('deve aceitar CNPJ válido', () => {
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
    });
    
    it('deve rejeitar CNPJ inválido', () => {
      expect(validateCNPJ('11.222.333/0001-00')).toBe(false);
    });
  });
  
  describe('validatePhone', () => {
    it('deve aceitar celular com 9 dígitos', () => {
      expect(validatePhone('(11) 99999-8888')).toBe(true);
    });
    
    it('deve aceitar fixo com 8 dígitos', () => {
      expect(validatePhone('(11) 3333-4444')).toBe(true);
    });
    
    it('deve rejeitar formato inválido', () => {
      expect(validatePhone('11999998888')).toBe(false);
    });
  });
});

test('deve validar CPF em tempo real', async ({ page }) => {
  await page.goto('/clientes');
  await page.click('text=Novo Cliente');
  
  // CPF inválido
  await page.fill('[id="document"]', '111.111.111-11');
  await page.blur('[id="document"]');
  await expect(page.locator('text=CPF inválido')).toBeVisible();
  await expect(page.locator('[data-testid="error-icon"]')).toBeVisible();
  
  // CPF válido
  await page.fill('[id="document"]', '123.456.789-09');
  await page.blur('[id="document"]');
  await expect(page.locator('text=✓ Válido')).toBeVisible();
  await expect(page.locator('[data-testid="check-icon"]')).toBeVisible();
});
```

---

## 📋 Definition of Done

- [x] Funções de validação implementadas
- [x] Testes unitários com cobertura >90%
- [x] Validação visual em tempo real
- [x] Mensagens de erro específicas
- [x] Ícones de status (✓ e ✗)
- [x] Botão salvar desabilitado com erros
- [x] Documentação atualizada

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
