import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { usePartsInventory, type PartInventory } from '@/hooks/usePartsInventory';
import { cn } from '@/lib/utils';

interface ContractItemPartSelectProps {
  onSelect: (part: { part_code: string; part_name: string; agreed_price: number }) => void;
  excludePartCodes?: string[];
  disabled?: boolean;
  className?: string;
}

export function ContractItemPartSelect({
  onSelect,
  excludePartCodes = [],
  disabled = false,
  className,
}: ContractItemPartSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [parts, setParts] = useState<PartInventory[]>([]);
  const [loading, setLoading] = useState(false);

  const { getPartsForSelection } = usePartsInventory();

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      const data = await getPartsForSelection(search || undefined);
      setParts(data);
      setLoading(false);
    };
    load();
  }, [getPartsForSelection, search, open]);

  const filteredParts = useMemo(() => {
    if (!excludePartCodes.length) return parts;
    return parts.filter((p) => !excludePartCodes.includes(p.part_code ?? ''));
  }, [parts, excludePartCodes]);

  const handleSelect = (part: PartInventory) => {
    onSelect({
      part_code: part.part_code ?? '',
      part_name: part.part_name,
      agreed_price: part.unit_cost ?? 0,
    });
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between text-sm font-normal', className)}
        >
          Selecionar peça...
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar por código ou nome..."
            value={search}
            onValueChange={setSearch}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                'Nenhuma peça encontrada.'
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredParts.map((part) => (
                <CommandItem
                  key={part.id}
                  value={`${part.part_code ?? ''} ${part.part_name}`}
                  onSelect={() => handleSelect(part)}
                  className="cursor-pointer"
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">
                      {part.part_code ? `${part.part_code} - ` : ''}{part.part_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Custo: R$ {(part.unit_cost ?? 0).toFixed(2)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
