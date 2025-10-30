import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { ScrollArea } from '@/components/ui/scroll-area';
type SingleValue = string | undefined;
type MultiValue = string[] | undefined;

interface BaseProps {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface SingleProps extends BaseProps {
  multiple?: false;
  value: SingleValue;
  onChange: (value: string | undefined) => void;
}

interface MultiProps extends BaseProps {
  multiple: true;
  value: MultiValue;
  onChange: (value: string[]) => void;
}

export type EngineComponentSelectProps = SingleProps | MultiProps;

export function EngineComponentSelect(props: EngineComponentSelectProps) {
  const { components, loading } = useEngineComponents();

  const placeholder = props.placeholder || (props.multiple ? 'Selecione componentes...' : 'Selecione um componente');

  // SINGLE SELECT
  if (!props.multiple) {
    const { value, onChange, disabled, className } = props as SingleProps;
    return (
      <Select value={value || ''} onValueChange={(v) => onChange(v || undefined)} disabled={disabled}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>
              Carregando componentes...
            </SelectItem>
          ) : (
            components.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  }

  // MULTI SELECT via Popover + Command + Checkbox
  const { value, onChange, disabled, className } = props as MultiProps;
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedLabels = useMemo(() => {
    const set = new Set(value || []);
    return components.filter((c) => set.has(c.value)).map((c) => c.label);
  }, [value, components]);

  const toggleValue = (val: string) => {
    const current = new Set(value || []);
    if (current.has(val)) {
      current.delete(val);
    } else {
      current.add(val);
    }
    onChange(Array.from(current));
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return components;
    return components.filter((c) => c.label.toLowerCase().includes(term) || c.value.toLowerCase().includes(term));
  }, [components, searchTerm]);

  const allFilteredValues = useMemo(() => filtered.map((c) => c.value), [filtered]);
  const allSelected = useMemo(() => {
    const set = new Set(value || []);
    return allFilteredValues.length > 0 && allFilteredValues.every((v) => set.has(v));
  }, [value, allFilteredValues]);

  const handleToggleAll = () => {
    const current = new Set(value || []);
    if (allSelected) {
      // Desmarcar todos os filtrados
      allFilteredValues.forEach((v) => current.delete(v));
    } else {
      // Selecionar todos os filtrados
      allFilteredValues.forEach((v) => current.add(v));
    }
    onChange(Array.from(current));
  };

  // Listagem completa (sem paginação)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={className || 'w-full justify-between'}
          disabled={disabled}
        >
          {selectedLabels.length > 0
            ? `${selectedLabels.length === 1 ? selectedLabels[0] : `${selectedLabels.length} selecionados`}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-96" align="start">
        <Command>
          <CommandInput placeholder="Buscar componente..." value={searchTerm} onValueChange={setSearchTerm} />
          <CommandEmpty>Nenhum componente encontrado</CommandEmpty>
          <ScrollArea className="h-64">
            <CommandList>
              <CommandGroup>
                <CommandItem key="__select_all__" onSelect={handleToggleAll}>
                  <div className="mr-2 flex h-4 w-4 items-center justify-center">
                    <Check className={`h-4 w-4 ${allSelected ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  {allSelected ? 'Desmarcar todos' : 'Selecionar todos'} ({filtered.length})
                </CommandItem>
                {loading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Carregando componentes...</div>
                ) : (
                  filtered.map((c) => {
                    const checked = (value || []).includes(c.value);
                    return (
                      <CommandItem key={c.value} onSelect={() => toggleValue(c.value)}>
                        <div className="mr-2 flex h-4 w-4 items-center justify-center">
                          <Check className={`h-4 w-4 ${checked ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                        {c.label}
                      </CommandItem>
                    );
                  })
                )}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default EngineComponentSelect;


