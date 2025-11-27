import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check, Plus } from 'lucide-react';
import { useEngineTypes } from '@/hooks/useEngineTypes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EngineTypeForm } from '@/components/operations/EngineTypeForm';

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
        et.category?.toLowerCase().includes(term)
    );
  }, [engineTypes, searchTerm]);

  const handleCreateSuccess = async (createdId?: string) => {
    setCreateDialogOpen(false);
    await fetchEngineTypes();
    if (createdId) {
      onChange(createdId);
    }
  };

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
            className={`${className || 'w-full justify-between'} cursor-pointer`}
          disabled={disabled || loading}
        >
          {selectedEngineType ? selectedEngineType.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-96" align="start">
        <Command>
          <CommandInput placeholder="Buscar tipo de motor..." value={searchTerm} onValueChange={setSearchTerm} />
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-4 gap-2">
                <p className="text-sm text-muted-foreground">Nenhum tipo de motor encontrado</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    setCreateDialogOpen(true);
                  }}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar novo tipo
                </Button>
              </div>
            </CommandEmpty>
          <ScrollArea className="h-64">
            <CommandList>
              <CommandGroup>
                {loading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando tipos de motor...
                  </div>
                ) : (
                    <>
                      {filtered.map((engineType) => {
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
                      })}
                      <CommandItem
                        onSelect={() => {
                          setOpen(false);
                          setCreateDialogOpen(true);
                        }}
                        className="border-t"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="font-medium">Criar novo tipo de motor</span>
                      </CommandItem>
                    </>
                )}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Tipo de Motor</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo tipo de motor
            </DialogDescription>
          </DialogHeader>
          <EngineTypeForm
            mode="create"
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EngineTypeSelect;

