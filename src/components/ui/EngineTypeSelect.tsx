import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { useEngineTypes } from '@/hooks/useEngineTypes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface EngineTypeSelectProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function EngineTypeSelect({
  value,
  onChange,
  placeholder = 'Selecione um tipo de motor...',
  disabled = false,
  className = ''
}: EngineTypeSelectProps) {
  const { engineTypes, loading, fetchEngineTypes } = useEngineTypes();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    fetchEngineTypes();
  }, [fetchEngineTypes]);

  const selectedEngineType = useMemo(() => {
    return engineTypes.find((et) => et.id === value);
  }, [engineTypes, value]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return engineTypes;
    return engineTypes.filter(
      (et) =>
        et.name.toLowerCase().includes(term) ||
        et.description?.toLowerCase().includes(term) ||
        et.brand?.toLowerCase().includes(term)
    );
  }, [engineTypes, searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={className || 'w-full justify-between'}
          disabled={disabled || loading}
        >
          {selectedEngineType ? selectedEngineType.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-96" align="start">
        <Command>
          <CommandInput placeholder="Buscar tipo de motor..." value={searchTerm} onValueChange={setSearchTerm} />
          <CommandEmpty>Nenhum tipo de motor encontrado</CommandEmpty>
          <ScrollArea className="h-64">
            <CommandList>
              <CommandGroup>
                {loading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando tipos de motor...
                  </div>
                ) : (
                  filtered.map((engineType) => {
                    const checked = value === engineType.id;
                    return (
                      <CommandItem
                        key={engineType.id}
                        onSelect={() => {
                          onChange(checked ? undefined : engineType.id);
                          setOpen(false);
                        }}
                      >
                        <div className="mr-2 flex h-4 w-4 items-center justify-center">
                          <Check className={`h-4 w-4 ${checked ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{engineType.name}</span>
                          {engineType.description && (
                            <span className="text-xs text-muted-foreground">{engineType.description}</span>
                          )}
                        </div>
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

export default EngineTypeSelect;

