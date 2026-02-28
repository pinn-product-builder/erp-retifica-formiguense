import { useState, useEffect } from 'react';
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
import { ChevronsUpDown, Loader2, X } from 'lucide-react';
import { usePartsInventory, type PartInventory } from '@/hooks/usePartsInventory';
import { cn } from '@/lib/utils';

export interface POSelectedPart {
  part_id:    string;
  item_name:  string;
  part_code?: string;
  unit_price: number;
}

interface POItemPartSelectProps {
  value?:    string;
  onSelect:  (part: POSelectedPart) => void;
  onClear?:  () => void;
  disabled?: boolean;
  className?: string;
}

export function POItemPartSelect({
  value,
  onSelect,
  onClear,
  disabled = false,
  className,
}: POItemPartSelectProps) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const [parts, setParts]   = useState<PartInventory[]>([]);
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

  const handleSelect = (part: PartInventory) => {
    onSelect({
      part_id:    part.id,
      item_name:  part.part_name,
      part_code:  part.part_code ?? undefined,
      unit_price: part.unit_cost ?? 0,
    });
    setOpen(false);
    setSearch('');
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-7 flex-1 justify-between text-xs font-normal min-w-0 px-2"
          >
            <span className="truncate text-left">
              {value || 'Selecionar peça...'}
            </span>
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
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
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  'Nenhuma peça encontrada.'
                )}
              </CommandEmpty>
              <CommandGroup>
                {parts.map(part => (
                  <CommandItem
                    key={part.id}
                    value={`${part.part_code ?? ''} ${part.part_name}`}
                    onSelect={() => handleSelect(part)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate text-sm">
                        {part.part_code ? `${part.part_code} — ` : ''}{part.part_name}
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

      {value && onClear && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
