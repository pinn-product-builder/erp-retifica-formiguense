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

    // Para campos CPF/CNPJ automático, detectar o tipo baseado no valor
    if (mask === 'cpfcnpj') {
      const detectedType = detectCPForCNPJ(value);
      const actualMask = masks[detectedType];
      
      return (
        <InputMask
          mask={actualMask}
          value={value}
          onChange={handleChange}
          maskChar="_"
          alwaysShowMask={false}
          disabled={disabled}
        >
          {(inputProps: React.InputHTMLAttributes<HTMLInputElement>) => (
            <Input
              {...props}
              {...inputProps}
              ref={ref}
              className={cn(className)}
            />
          )}
        </InputMask>
      );
    }

    // Para outros campos, usar react-input-mask
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
            {...props}
            {...inputProps}
            ref={ref}
            className={cn(className)}
          />
        )}
      </InputMask>
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };