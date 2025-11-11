import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import InputMask from 'react-input-mask'
import { NumericFormat } from 'react-number-format'

interface MaskedInputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  mask: 'cpf' | 'cnpj' | 'cpfcnpj' | 'phone' | 'cep' | 'currency' | 'decimal';
  value?: string;
  onChange?: (value: string, rawValue: string) => void;
}

const masks = {
  cpf: '999.999.999-99',
  cnpj: '99.999.999/9999-99',
  phone: '(99) 99999-9999',
  cep: '99999-999',
  currency: 'R$ 999999999,99',
  decimal: '999999999,99'
};

const rawValue = {
  cpf: (value: string) => value.replace(/\D/g, ''),
  cnpj: (value: string) => value.replace(/\D/g, ''),
  cpfcnpj: (value: string) => value.replace(/\D/g, ''),
  phone: (value: string) => value.replace(/\D/g, ''),
  cep: (value: string) => value.replace(/\D/g, ''),
  currency: (value: string) => {
    // Remove R$ e espaços, converte vírgula para ponto
    return value.replace(/[^\d.,]/g, '').replace(',', '.');
  },
  decimal: (value: string) => {
    // Remove caracteres não numéricos, converte vírgula para ponto
    return value.replace(/[^\d.,]/g, '').replace(',', '.');
  }
};

// Função para detectar se é CPF ou CNPJ baseado no tamanho
const detectCPForCNPJ = (value: string): 'cpf' | 'cnpj' => {
  const numbers = value.replace(/\D/g, '');
  return numbers.length <= 11 ? 'cpf' : 'cnpj';
};

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, value = '', onChange, disabled, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const customHandlersRef = React.useRef<{
      onBlur?: React.FocusEventHandler<HTMLInputElement>;
      onFocus?: React.FocusEventHandler<HTMLInputElement>;
      onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
      onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>;
      onKeyPress?: React.KeyboardEventHandler<HTMLInputElement>;
    }>({});

    // Combinar refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Separar handlers customizados das outras props
    const {
      onBlur: customOnBlur,
      onFocus: customOnFocus,
      onKeyDown: customOnKeyDown,
      onKeyUp: customOnKeyUp,
      onKeyPress: customOnKeyPress,
      ...inputMaskProps
    } = props;

    // Armazenar handlers customizados no ref
    React.useEffect(() => {
      customHandlersRef.current = {
        onBlur: customOnBlur,
        onFocus: customOnFocus,
        onKeyDown: customOnKeyDown,
        onKeyUp: customOnKeyUp,
        onKeyPress: customOnKeyPress,
      };
    }, [customOnBlur, customOnFocus, customOnKeyDown, customOnKeyUp, customOnKeyPress]);

    // Adicionar event listeners via DOM quando o input estiver montado
    React.useEffect(() => {
      const input = inputRef.current;
      if (!input) return;

      const handleBlur = (e: FocusEvent) => {
        customHandlersRef.current.onBlur?.(e as unknown as React.FocusEvent<HTMLInputElement>);
      };

      const handleFocus = (e: FocusEvent) => {
        customHandlersRef.current.onFocus?.(e as unknown as React.FocusEvent<HTMLInputElement>);
      };

      if (customOnBlur) {
        input.addEventListener('blur', handleBlur);
      }
      if (customOnFocus) {
        input.addEventListener('focus', handleFocus);
      }

      return () => {
        if (customOnBlur) {
          input.removeEventListener('blur', handleBlur);
        }
        if (customOnFocus) {
          input.removeEventListener('focus', handleFocus);
        }
      };
    }, [customOnBlur, customOnFocus]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const raw = rawValue[mask](inputValue);
      
      onChange?.(inputValue, raw);
    };

    // Para campos de moeda, usar react-number-format
    if (mask === 'currency') {
      const { type, defaultValue, ...restProps } = props;
      return (
        <NumericFormat
          {...restProps}
          value={value}
          onValueChange={(values) => {
            const formattedValue = values.formattedValue;
            const rawValue = values.floatValue !== undefined ? values.floatValue.toString() : '0';
            onChange?.(formattedValue, rawValue);
          }}
          thousandSeparator="."
          decimalSeparator=","
          prefix="R$ "
          decimalScale={2}
          fixedDecimalScale
          allowNegative={false}
          placeholder="R$ 0,00"
          disabled={disabled}
          customInput={Input}
          className={cn(className)}
        />
      );
    }

    // Para campos decimais, usar react-number-format sem prefixo
    if (mask === 'decimal') {
      const { type, defaultValue, ...restProps } = props;
      return (
        <NumericFormat
          {...restProps}
          value={value}
          onValueChange={(values) => {
            const formattedValue = values.formattedValue;
            const rawValue = values.floatValue !== undefined ? values.floatValue.toString() : '0';
            onChange?.(formattedValue, rawValue);
          }}
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={2}
          fixedDecimalScale={false}
          allowNegative={false}
          allowLeadingZeros={false}
          disabled={disabled}
          isAllowed={(values) => {
            // Permitir valores até 999.999,99
            return values.floatValue === undefined || values.floatValue <= 999999.99;
          }}
          customInput={Input}
          className={cn(className)}
        />
      );
    }

    // Para campos CPF/CNPJ automático, usar formatação manual (InputMask não permite mudança dinâmica)
    if (mask === 'cpfcnpj') {
      // Função para formatar CPF/CNPJ baseado no número de dígitos
      const formatCpfCnpj = (digits: string): string => {
        if (!digits || digits.length === 0) return '';
        
        if (digits.length <= 11) {
          // Formatar como CPF: 000.000.000-00
          if (digits.length <= 3) return digits;
          if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
          if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
          return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
        } else {
          // Formatar como CNPJ: 00.000.000/0000-00
          if (digits.length <= 2) return digits;
          if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
          if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
          if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}`;
          return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
        }
      };
      
      // Extrair apenas dígitos do valor atual e formatar
      const currentDigits = value.replace(/\D/g, '');
      const formattedValue = formatCpfCnpj(currentDigits);
      
      const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const digits = inputValue.replace(/\D/g, '');
        
        // Limitar a 14 dígitos (tamanho máximo do CNPJ)
        const limitedDigits = digits.slice(0, 14);
        const formatted = formatCpfCnpj(limitedDigits);
        
        onChange?.(formatted, limitedDigits);
      };
      
      // Usar Input normal com formatação manual (mais flexível que InputMask para mudança dinâmica)
      return (
        <Input
          {...props}
          ref={ref}
          value={formattedValue}
          onChange={handleCpfCnpjChange}
          disabled={disabled}
          className={cn(className)}
          type="text"
          inputMode="numeric"
        />
      );
    }

    // Para outros campos, usar react-input-mask
    // Não passar handlers customizados diretamente - usar event listeners via ref
    return (
      <InputMask
        mask={masks[mask]}
        value={value}
        onChange={handleChange}
        maskChar="_"
        alwaysShowMask={false}
        disabled={disabled}
      >
        {(inputProps: React.InputHTMLAttributes<HTMLInputElement>) => (
          <Input
            {...inputMaskProps}
            {...inputProps}
            ref={inputRef}
            className={cn(className)}
          />
        )}
      </InputMask>
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };