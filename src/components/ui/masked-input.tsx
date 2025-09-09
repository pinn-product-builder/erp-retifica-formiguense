import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"

interface MaskedInputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  mask: 'cpf' | 'cnpj' | 'phone' | 'cep' | 'currency' | 'decimal';
  value?: string;
  onChange?: (value: string, rawValue: string) => void;
}

const masks = {
  cpf: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  },
  cnpj: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  },
  phone: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
      .replace(/(-\d{4})\d+?$/, '$1');
  },
  cep: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  },
  currency: (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount || 0);
  },
  decimal: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d)(\d{2})$/, '$1,$2')
      .replace(/(?=(\d{3})+(\D))\B/g, '.');
  }
};

const rawValue = {
  cpf: (value: string) => value.replace(/\D/g, ''),
  cnpj: (value: string) => value.replace(/\D/g, ''),
  phone: (value: string) => value.replace(/\D/g, ''),
  cep: (value: string) => value.replace(/\D/g, ''),
  currency: (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return (parseFloat(numbers) / 100).toString();
  },
  decimal: (value: string) => value.replace(/[^\d,]/g, '').replace(',', '.')
};

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, value = '', onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const maskedValue = masks[mask](inputValue);
      const raw = rawValue[mask](inputValue);
      
      onChange?.(maskedValue, raw);
    };

    return (
      <Input
        {...props}
        ref={ref}
        className={cn(className)}
        value={masks[mask](value)}
        onChange={handleChange}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };