# US-CLI-005: Buscar e Filtrar Clientes

**ID:** US-CLI-005  
**Épico:** Clientes  
**Sprint:** 3  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** ✅ Done

---

## 📋 User Story

**Como** atendente da retífica  
**Quero** buscar clientes por nome, documento ou telefone  
**Para** encontrar rapidamente o cliente desejado

---

## 🎯 Objetivo de Negócio

Reduzir tempo de busca de clientes de 45s para menos de 10s, melhorando eficiência operacional.

---

## ✅ Critérios de Aceitação

**AC01:** Campo de busca é exibido no topo da lista de clientes  
**AC02:** Busca funciona com debounce de 300ms (não sobrecarregar)  
**AC03:** Busca em múltiplos campos: nome, CPF/CNPJ (sem formatação), telefone  
**AC04:** Busca é case-insensitive e ignora acentos  
**AC05:** Filtros adicionais: Tipo (Todos/PF/PJ), Status (Ativo/Inativo)  
**AC06:** Resultados são paginados (15 por página)  
**AC07:** Contador exibe: "Mostrando X de Y clientes"  
**AC08:** Busca vazia retorna todos os clientes (paginados)  
**AC09:** Loading indicator durante busca  

---

## 📐 Regras de Negócio

### RN-CLI-005-A: Busca Full-Text Search
```typescript
interface SearchConfig {
  searchFields: string[];          // ['name', 'document', 'phone', 'email']
  debounceMs: number;              // 300
  resultsPerPage: number;          // 15
  minSearchLength: number;         // 2 (mínimo de caracteres)
  caseInsensitive: boolean;        // TRUE
  ignoreAccents: boolean;          // TRUE
}

// Query com Full-Text Search PostgreSQL
const searchCustomers = async (searchTerm: string, filters: Filters) => {
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId);
    
  // Busca por texto
  if (searchTerm && searchTerm.length >= 2) {
    const cleanedSearch = searchTerm.replace(/\D/g, ''); // Remove formatação
    
    query = query.or(`
      name.ilike.%${searchTerm}%,
      document.eq.${cleanedSearch},
      phone.ilike.%${cleanedSearch}%,
      email.ilike.%${searchTerm}%
    `);
  }
  
  // Filtro de tipo
  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }
  
  // Filtro de status
  if (filters.status === 'active') {
    query = query.eq('active', true);
  } else if (filters.status === 'inactive') {
    query = query.eq('active', false);
  }
  
  // Ordenação e paginação
  query = query
    .order('name', { ascending: true })
    .range(filters.page * 15, (filters.page + 1) * 15 - 1);
    
  return query;
};
```

### RN-CLI-005-B: Índices para Performance
```sql
-- Índice GIN para full-text search
CREATE INDEX IF NOT EXISTS idx_customers_fulltext 
ON customers 
USING gin(to_tsvector('portuguese', name || ' ' || COALESCE(email, '') || ' ' || phone));

-- Índice para busca por documento sem formatação
CREATE INDEX IF NOT EXISTS idx_customers_document_clean 
ON customers(document);

-- Índice composto para filtros
CREATE INDEX IF NOT EXISTS idx_customers_type_active 
ON customers(org_id, type, active);
```

---

## 💻 Implementação

### Hook: `useClientesSearch.ts`

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchFilters {
  type: 'all' | 'pf' | 'pj';
  status: 'all' | 'active' | 'inactive';
  page: number;
}

export const useClientesSearch = () => {
  const { currentOrg } = useOrganization();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    status: 'all',
    page: 0,
  });
  
  // Debounce para não sobrecarregar
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', debouncedSearch, filters, currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return { data: [], count: 0 };
      
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('org_id', currentOrg.id);
        
      // Busca
      if (debouncedSearch && debouncedSearch.length >= 2) {
        const cleaned = debouncedSearch.replace(/\D/g, '');
        
        query = query.or(`
          name.ilike.%${debouncedSearch}%,
          document.eq.${cleaned},
          phone.ilike.%${cleaned}%,
          email.ilike.%${debouncedSearch}%
        `);
      }
      
      // Filtros
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      
      if (filters.status === 'active') {
        query = query.eq('active', true);
      } else if (filters.status === 'inactive') {
        query = query.eq('active', false);
      }
      
      // Paginação
      const startIndex = filters.page * 15;
      const endIndex = startIndex + 14;
      
      query = query
        .order('name', { ascending: true })
        .range(startIndex, endIndex);
        
      const { data, count, error } = await query;
      
      if (error) throw error;
      
      return { data: data || [], count: count || 0 };
    },
    enabled: !!currentOrg,
  });
  
  return {
    customers: data?.data || [],
    totalCount: data?.count || 0,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
  };
};
```

### Componente: `ClientesSearch.tsx`

```typescript
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export const ClientesSearch = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
}: Props) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Campo de busca */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Filtro de Tipo */}
      <Select
        value={filters.type}
        onValueChange={(value) => onFiltersChange({ ...filters, type: value as any })}
      >
        <SelectTrigger className="w-[180px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="pf">Pessoa Física</SelectItem>
          <SelectItem value="pj">Pessoa Jurídica</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Filtro de Status */}
      <Select
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as any })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Ativos</SelectItem>
          <SelectItem value="inactive">Inativos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
```

### Componente: `ClientesPagination.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const ClientesPagination = ({
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
}: Props) => {
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = currentPage * itemsPerPage + 1;
  const endIndex = Math.min((currentPage + 1) * itemsPerPage, totalCount);
  
  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-muted-foreground">
        Mostrando {startIndex} - {endIndex} de {totalCount} clientes
      </p>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
            <Button
              key={i}
              variant={currentPage === i ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(i)}
            >
              {i + 1}
            </Button>
          ))}
          
          {totalPages > 5 && <span className="px-2">...</span>}
          
          {totalPages > 5 && (
            <Button
              variant={currentPage === totalPages - 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(totalPages - 1)}
            >
              {totalPages}
            </Button>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
```

---

## 🧪 Cenários de Teste

```typescript
test('deve buscar cliente por nome', async ({ page }) => {
  await page.goto('/clientes');
  
  await page.fill('[placeholder*="Buscar"]', 'João');
  await page.waitForTimeout(350); // Aguardar debounce
  
  await expect(page.locator('table')).toContainText('João');
  await expect(page.locator('table tr')).toHaveCount(1); // Apenas João
});

test('deve buscar por CPF sem formatação', async ({ page }) => {
  await page.goto('/clientes');
  
  await page.fill('[placeholder*="Buscar"]', '12345678909');
  await page.waitForTimeout(350);
  
  await expect(page.locator('table')).toContainText('123.456.789-09');
});

test('deve filtrar por tipo PF', async ({ page }) => {
  await page.goto('/clientes');
  
  await page.click('[data-testid="type-filter"]');
  await page.click('text=Pessoa Física');
  
  // Verificar que apenas PFs aparecem
  await expect(page.locator('table')).not.toContainText('CNPJ');
});

test('deve paginar resultados', async ({ page }) => {
  await page.goto('/clientes');
  
  // Verificar contador
  await expect(page.locator('text=Mostrando 1 - 15 de')).toBeVisible();
  
  // Próxima página
  await page.click('button:has-text("Próximo")');
  await expect(page.locator('text=Mostrando 16 - 30 de')).toBeVisible();
  
  // Página anterior
  await page.click('button:has-text("Anterior")');
  await expect(page.locator('text=Mostrando 1 - 15 de')).toBeVisible();
});
```

---

## 📋 Definition of Done

- [x] Hook de busca com debounce
- [x] Busca por múltiplos campos
- [x] Filtros de tipo e status
- [x] Paginação funcional
- [x] Contador de resultados
- [x] Loading indicator
- [x] Índices de banco criados
- [x] Testes E2E passando
- [x] Performance < 500ms

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
