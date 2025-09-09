import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Input } from "./input";
import { MaskedInput } from "./masked-input";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number';
  mask?: 'cpf' | 'cnpj' | 'phone' | 'cep' | 'currency' | 'decimal';
  value: string;
  onChange: (value: string, rawValue?: string) => void;
  error?: string;
  success?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => boolean;
  };
}

export function FormField({
  label,
  name,
  type = 'text',
  mask,
  value,
  onChange,
  error,
  success,
  required,
  placeholder,
  disabled,
  className,
  helpText,
  validation
}: FormFieldProps) {
  const [touched, setTouched] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string>('');

  const validateField = React.useCallback((val: string) => {
    if (!validation || !touched) return '';

    if (validation.minLength && val.length < validation.minLength) {
      return `Mínimo ${validation.minLength} caracteres`;
    }

    if (validation.maxLength && val.length > validation.maxLength) {
      return `Máximo ${validation.maxLength} caracteres`;
    }

    if (validation.pattern && !validation.pattern.test(val)) {
      return 'Formato inválido';
    }

    if (validation.custom && !validation.custom(val)) {
      return 'Valor inválido';
    }

    return '';
  }, [validation, touched]);

  React.useEffect(() => {
    setValidationError(validateField(value));
  }, [value, validateField]);

  const handleChange = (val: string, rawVal?: string) => {
    onChange(val, rawVal);
    if (!touched) setTouched(true);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const displayError = error || validationError;
  const hasError = Boolean(displayError);
  const hasSuccess = Boolean(success) && !hasError && touched && value;

  const InputComponent = mask ? MaskedInput : Input;
  const inputProps = mask ? { mask } : { type };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <InputComponent
          id={name}
          name={name}
          {...inputProps}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            "pr-10",
            hasError && "border-destructive focus-visible:ring-destructive",
            hasSuccess && "border-success focus-visible:ring-success"
          )}
        />
        
        {/* Status Icon */}
        {(hasError || hasSuccess) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-success" />
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <div className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-3 w-3" />
          {displayError}
        </div>
      )}

      {/* Success Message */}
      {hasSuccess && (
        <div className="flex items-center gap-1 text-sm text-success">
          <CheckCircle2 className="h-3 w-3" />
          {success}
        </div>
      )}

      {/* Help Text */}
      {helpText && !hasError && !hasSuccess && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}