import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';
import { useEngineComponents } from '@/hooks/useEngineComponents';

interface DiagnosticFiltersProps {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  component: string;
  onComponentChange: (v: string) => void;
}

export function DiagnosticFilters({
  searchTerm,
  onSearchTermChange,
  status,
  onStatusChange,
  component,
  onComponentChange,
}: DiagnosticFiltersProps) {
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar por ordem, cliente ou checklist..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-48">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Status</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="completed">Concluído</SelectItem>
          <SelectItem value="approved">Aprovado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={component} onValueChange={onComponentChange}>
        <SelectTrigger className="w-48">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Componentes</SelectItem>
          {componentsLoading ? (
            <SelectItem value="loading" disabled>Carregando...</SelectItem>
          ) : (
            engineComponents.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}


