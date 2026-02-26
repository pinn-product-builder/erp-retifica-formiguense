import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Package } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { useOrganization } from '@/hooks/useOrganization';
import { ConditionalOrderService } from '@/services/ConditionalOrderService';

interface PartResult {
  id: string;
  part_name: string;
  part_code: string | null;
  quantity: number;
  unit_cost: number;
}

interface PartSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectPart: (part: { name: string; code: string; unit_cost: number }) => void;
  placeholder?: string;
  className?: string;
}

export function PartSearchInput({
  value,
  onChange,
  onSelectPart,
  placeholder = 'Buscar peça...',
  className,
}: PartSearchInputProps) {
  const { currentOrganization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PartResult[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (!query || query.length < 2 || !currentOrganization?.id) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await ConditionalOrderService.searchParts(currentOrganization.id, query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query, currentOrganization?.id]);

  const handleSelect = (part: PartResult) => {
    onSelectPart({ name: part.part_name, code: part.part_code ?? '', unit_cost: part.unit_cost });
    setQuery('');
    setOpen(false);
  };

  const stockBadgeClass = (qty: number) => {
    if (qty <= 0) return 'border-red-200 bg-red-50 text-red-700';
    if (qty <= 3) return 'border-yellow-200 bg-yellow-50 text-yellow-700';
    return 'border-green-200 bg-green-50 text-green-700';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn(
            'h-8 justify-between px-2 text-xs font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0" align="start" sideOffset={4}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nome ou código da peça..."
            value={query}
            onValueChange={v => {
              setQuery(v);
              onChange(v);
            }}
          />

          <CommandList>
            {query.length < 2 && (
              <div className="py-5 text-center text-xs text-muted-foreground">
                <Package className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                Digite ao menos 2 caracteres
              </div>
            )}

            {query.length >= 2 && searching && (
              <div className="py-5 text-center text-xs text-muted-foreground">
                Buscando peças...
              </div>
            )}

            {query.length >= 2 && !searching && results.length === 0 && (
              <CommandEmpty>
                <Package className="h-7 w-7 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma peça encontrada</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Feche e digite o nome manualmente
                </p>
              </CommandEmpty>
            )}

            {!searching && results.length > 0 && (
              <CommandGroup heading={`${results.length} peça(s) encontrada(s)`}>
                {results.map(part => (
                  <CommandItem
                    key={part.id}
                    value={part.id}
                    onSelect={() => handleSelect(part)}
                    className="flex items-start gap-2 py-2.5 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        value === part.part_name ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm">{part.part_name}</span>
                        {part.part_code && (
                          <span className="font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            {part.part_code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] h-[18px] px-1.5 font-medium', stockBadgeClass(part.quantity))}
                        >
                          Estoque: {part.quantity}
                        </Badge>
                        {part.unit_cost > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            {formatCurrency(part.unit_cost)}/un
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
