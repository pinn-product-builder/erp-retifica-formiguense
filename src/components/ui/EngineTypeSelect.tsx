import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { useEngineTypes } from '@/hooks/useEngineTypes';
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
  className = '',
}: EngineTypeSelectProps) {
  const { engineTypes, loading, fetchEngineTypes } = useEngineTypes();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    fetchEngineTypes();
  }, [fetchEngineTypes]);

  const selectedEngineType = useMemo(
    () => engineTypes.find((et) => et.id === value),
    [engineTypes, value]
  );

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

  const handleSelect = (engineTypeId: string) => {
    onChange(value === engineTypeId ? undefined : engineTypeId);
    setSearchDialogOpen(false);
    setSearchTerm('');
  };

  const handleCreateSuccess = async (createdId?: string) => {
    setCreateDialogOpen(false);
    await fetchEngineTypes();
    if (createdId) {
      onChange(createdId);
    }
  };

  const handleOpenSearch = () => {
    setSearchTerm('');
    setSearchDialogOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        onClick={handleOpenSearch}
        disabled={disabled || loading}
        className={`${className || 'w-full justify-between'} cursor-pointer`}
      >
        <span className="truncate">
          {selectedEngineType ? selectedEngineType.name : placeholder}
        </span>
        {loading ? (
          <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
        ) : (
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        )}
      </Button>

      <Dialog
        open={searchDialogOpen}
        onOpenChange={(open) => {
          setSearchDialogOpen(open);
          if (!open) setSearchTerm('');
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Selecionar Tipo de Motor</DialogTitle>
            <DialogDescription>
              Busque pelo nome, descrição ou categoria
            </DialogDescription>
          </DialogHeader>

          <Command className="border-0">
            <CommandInput
              placeholder="Buscar tipo de motor..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-72 overflow-y-auto">
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <p className="text-sm text-muted-foreground">
                    Nenhum tipo de motor encontrado
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchDialogOpen(false);
                      setCreateDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar novo tipo
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((engineType) => {
                  const checked = value === engineType.id;
                  return (
                    <CommandItem
                      key={engineType.id}
                      value={`${engineType.id} ${engineType.name} ${engineType.description ?? ''} ${engineType.category ?? ''}`}
                      onSelect={() => handleSelect(engineType.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{engineType.name}</span>
                          {engineType.description && (
                            <span className="text-xs text-muted-foreground truncate">
                              {engineType.description}
                            </span>
                          )}
                        </div>
                        {checked && <Check className="h-4 w-4 text-primary ml-2 shrink-0" />}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-sm"
                onClick={() => {
                  setSearchDialogOpen(false);
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Criar novo tipo de motor
              </Button>
            </div>
          </Command>
        </DialogContent>
      </Dialog>

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
