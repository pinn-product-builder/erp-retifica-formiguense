import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Save, Loader2, Search } from 'lucide-react';
import { useEngineCategories, EngineCategory } from '@/hooks/useEngineCategories';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { Database } from '@/integrations/supabase/types';

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  components: z.array(z.string()).min(1, 'Pelo menos um componente é obrigatório'),
  is_active: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface EngineCategoryFormProps {
  category?: EngineCategory | null;
  mode: 'create' | 'edit';
  onSuccess: (createdId?: string) => void;
  onCancel: () => void;
}

export function EngineCategoryForm({ category, mode, onSuccess, onCancel }: EngineCategoryFormProps) {
  const { createCategory, updateCategory, loading } = useEngineCategories();
  const { components: engineComponents } = useEngineComponents();
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      components: [],
      is_active: true,
    },
  });

  useEffect(() => {
    if (category && mode === 'edit') {
      form.reset({
        name: category.name,
        components: Array.isArray(category.components) ? category.components as string[] : [],
        is_active: category.is_active,
      });
    }
  }, [category, mode, form]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (mode === 'create') {
        const created = await createCategory({
          name: data.name!,
          components: data.components as Database['public']['Enums']['engine_component'][],
          is_active: data.is_active,
        });
        onSuccess(created?.id);
      } else if (category) {
        await updateCategory(category.id, {
          name: data.name,
          components: data.components as Database['public']['Enums']['engine_component'][],
          is_active: data.is_active,
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    }
  };

  const selectedComponents = form.watch('components');

  const filteredComponents = useMemo(() => {
    if (!searchTerm) return engineComponents;
    
    const term = searchTerm.toLowerCase();
    return engineComponents.filter(comp => 
      comp.label.toLowerCase().includes(term) ||
      comp.value.toLowerCase().includes(term)
    );
  }, [engineComponents, searchTerm]);

  const handleToggleComponent = (componentId: string, checked: boolean) => {
    const currentComponents = form.getValues('components');
    if (checked) {
      if (!currentComponents.includes(componentId)) {
        form.setValue('components', [...currentComponents, componentId]);
      }
    } else {
      form.setValue('components', currentComponents.filter(c => c !== componentId));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Linha Pesada, Bosch, etc."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="components"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Componentes *</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar componente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    {filteredComponents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum componente encontrado
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredComponents.map((component) => {
                          const isChecked = selectedComponents.includes(component.value);
                          return (
                            <div key={component.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={component.value}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  handleToggleComponent(component.value, checked as boolean);
                                }}
                              />
                              <Label
                                htmlFor={component.value}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {component.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedComponents.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {selectedComponents.length} componente(s) selecionado(s)
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <FormLabel>Ativo</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Categorias inativas não aparecerão nas seleções
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            {mode === 'create' ? 'Criar Categoria' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

