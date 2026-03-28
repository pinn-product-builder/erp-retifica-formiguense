import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type FinancialAsyncComboboxProps<T extends { id: string }> = {
  id?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  value: T | null;
  onChange: (next: T | null) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  options: T[];
  loading?: boolean;
  getOptionLabel: (o: T) => string;
  emptyText?: string;
  listZIndexClass?: string;
};

export function FinancialAsyncCombobox<T extends { id: string }>({
  id: externalId,
  label,
  placeholder,
  required,
  disabled,
  className,
  value,
  onChange,
  inputValue,
  onInputChange,
  options,
  loading = false,
  getOptionLabel,
  emptyText = 'Nenhum resultado',
  listZIndexClass = 'z-[2000]',
}: FinancialAsyncComboboxProps<T>) {
  const uid = useId();
  const inputId = externalId ?? `fac-${uid}`;
  const listId = `${inputId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [close]);

  return (
    <div ref={rootRef} className={cn('relative w-full space-y-2', className)}>
      <Label htmlFor={inputId}>
        {label}
        {required ? ' *' : ''}
      </Label>
      <div className="relative">
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          value={inputValue}
          onChange={(e) => {
            onInputChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={cn(loading && 'pr-9')}
        />
        {loading && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          </span>
        )}
        {open && !disabled && (
          <div
            id={listId}
            role="listbox"
            className={cn(
              'absolute left-0 right-0 top-full mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md',
              listZIndexClass
            )}
          >
            {options.length === 0 && !loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={value?.id === opt.id}
                  className="flex w-full items-start px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onInputChange(getOptionLabel(opt));
                    onChange(opt);
                    close();
                  }}
                >
                  {getOptionLabel(opt)}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
