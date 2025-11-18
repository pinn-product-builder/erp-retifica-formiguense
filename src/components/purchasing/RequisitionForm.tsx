import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Search, Package, PackagePlus } from 'lucide-react';
import { usePurchasing } from '@/hooks/usePurchasing';
import { usePartsInventory, type PartInventory } from '@/hooks/usePartsInventory';
import { Badge } from '@/components/ui/badge';
import { PartForm } from '@/components/inventory/PartForm';

interface RequisitionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPart?: { part_code: string; part_name: string; shortage_quantity: number };
  onSuccess?: () => void;
}

interface RequisitionItem {
  part_id?: string;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  is_new_part?: boolean;
}

export default function RequisitionForm({ 
  open, 
  onOpenChange, 
  preselectedPart,
  onSuccess 
}: RequisitionFormProps) {
  const { createRequisition, loading } = usePurchasing();
  const { parts, fetchParts, createPart, loading: loadingParts } = usePartsInventory();
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    department: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    justification: string;
  }>({
    department: '',
    priority: 'medium',
    justification: '',
  });

  const [items, setItems] = useState<RequisitionItem[]>(() => {
    if (preselectedPart) {
      return [{
        item_name: preselectedPart.part_name,
        description: `${preselectedPart.part_code} - ${preselectedPart.part_name}`,
        quantity: preselectedPart.shortage_quantity,
        unit_price: 0,
      }];
    }
    return [{ item_name: '', description: '', quantity: 1, unit_price: 0 }];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartIndex, setSelectedPartIndex] = useState<number | null>(null);
  const [showPartSearch, setShowPartSearch] = useState<Record<number, boolean>>({});
  const [showCreatePartModal, setShowCreatePartModal] = useState(false);

  useEffect(() => {
    if (open) {
      fetchParts({ search: '' });
      
      // Resetar e pré-preencher itens quando o modal abrir com peça pré-selecionada
      if (preselectedPart) {
        setItems([{
          item_name: preselectedPart.part_name,
          description: `${preselectedPart.part_code} - ${preselectedPart.part_name}`,
          quantity: preselectedPart.shortage_quantity,
          unit_price: 0,
        }]);
      } else {
        setItems([{ item_name: '', description: '', quantity: 1, unit_price: 0 }]);
      }
    } else {
      // Resetar todos os estados quando o modal fechar
      setFormData({
        department: '',
        priority: 'medium',
        justification: '',
      });
      setItems([{ item_name: '', description: '', quantity: 1, unit_price: 0 }]);
      setSearchTerm('');
      setSelectedPartIndex(null);
      setShowPartSearch({});
      setShowCreatePartModal(false);
    }
  }, [open, fetchParts, preselectedPart]);

  // Quando as peças forem carregadas e houver uma peça pré-selecionada, tentar encontrar no estoque
  useEffect(() => {
    if (open && preselectedPart && parts.length > 0) {
      const foundPart = parts.find(p => 
        p.part_code === preselectedPart.part_code || 
        p.part_name.toLowerCase() === preselectedPart.part_name.toLowerCase()
      );
      
      if (foundPart) {
        // Atualizar apenas se ainda não tiver part_id ou se for diferente
        setItems(prevItems => {
          if (prevItems.length > 0 && prevItems[0]?.part_id === foundPart.id) {
            return prevItems; // Já está atualizado
          }
          return [{
            part_id: foundPart.id,
            item_name: foundPart.part_name,
            description: `${foundPart.part_code} - ${foundPart.part_name}`,
            quantity: preselectedPart.shortage_quantity,
            unit_price: foundPart.unit_cost || 0,
            is_new_part: false,
          }];
        });
      }
    }
  }, [open, preselectedPart, parts]);

  // Quando uma peça é selecionada, preencher dados
  const handleSelectPart = (index: number, part: PartInventory) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      part_id: part.id,
      item_name: part.part_name,
      description: `${part.part_code} - ${part.part_name}`,
      unit_price: part.unit_cost || 0,
      is_new_part: false,
    };
    setItems(updatedItems);
    setShowPartSearch({ ...showPartSearch, [index]: false });
    setSearchTerm('');
  };

  // Filtrar peças baseado na busca
  const filteredParts = parts.filter(part =>
    part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.part_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = () => {
    setItems([...items, { item_name: '', description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof RequisitionItem, value: string | number | boolean) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = async () => {
    if (!formData.department || items.length === 0) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Por favor, preencha o departamento e adicione pelo menos um item.",
      });
      return;
    }

    try {
      // Criar peças novas se necessário
      const itemsToCreate = items.filter(item => item.is_new_part && !item.part_id);
      
      for (const item of itemsToCreate) {
        if (item.item_name) {
          const partCode = item.item_name.toUpperCase().replace(/\s+/g, '-').substring(0, 20);
          const created = await createPart({
            part_name: item.item_name,
            part_code: partCode,
            quantity: 0, // Será atualizado após recebimento
            unit_cost: item.unit_price || 0,
            status: 'disponivel',
          });
          
          if (created) {
            // Buscar a peça criada para obter o ID
            await fetchParts({ search: item.item_name });
            const newPart = parts.find(p => p.part_name === item.item_name);
            if (newPart) {
              const itemIndex = items.findIndex(i => i.item_name === item.item_name && i.is_new_part);
              if (itemIndex !== -1) {
                updateItem(itemIndex, 'part_id', newPart.id);
                updateItem(itemIndex, 'is_new_part', false);
              }
            }
          }
        }
      }

      const totalValue = items.reduce((sum, item) => 
        sum + (item.quantity * (item.unit_price || 0)), 0
      );

      await createRequisition(
        {
          ...formData,
          total_estimated_value: totalValue,
          status: 'pending',
        },
        items.map(item => ({
          item_name: item.item_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * (item.unit_price || 0),
          part_id: item.part_id || undefined,
        }))
      );

      // Fechar modal e chamar callback de sucesso
      // O reset será feito pelo useEffect quando open mudar para false
      onOpenChange(false);
      onSuccess?.();

      toast({
        title: "Requisição criada",
        description: "Requisição de compra criada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao criar requisição:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar requisição",
        description: "Não foi possível criar a requisição. Tente novamente.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Requisição de Compra</DialogTitle>
        </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Departamento</Label>
            <Input
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              placeholder="Ex: Produção, Manutenção"
            />
          </div>
          <div>
            <Label>Prioridade</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => 
                setFormData({...formData, priority: value as 'low' | 'medium' | 'high' | 'urgent'})
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label>Justificativa</Label>
          <Textarea
            value={formData.justification}
            onChange={(e) => setFormData({...formData, justification: e.target.value})}
            placeholder="Justifique a necessidade da compra"
            rows={3}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Itens da Requisição</Label>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCreatePartModal(true)}
              >
                <PackagePlus className="h-4 w-4 mr-1" />
                Nova Peça
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </Button>
            </div>
          </div>
          
          {items.map((item, index) => (
            <div key={index} className="border p-3 rounded space-y-2 mb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  {/* Busca de peça */}
                  <div>
                    <Label className="text-xs">Buscar Peça no Estoque</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Digite para buscar peça..."
                        value={showPartSearch[index] ? searchTerm : (item.item_name || '')}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setSelectedPartIndex(index);
                          setShowPartSearch({ ...showPartSearch, [index]: true });
                        }}
                        onFocus={() => {
                          setSelectedPartIndex(index);
                          setShowPartSearch({ ...showPartSearch, [index]: true });
                        }}
                        className="pl-10"
                      />
                      {showPartSearch[index] && searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {loadingParts ? (
                            <div className="p-2 text-sm text-muted-foreground">Buscando...</div>
                          ) : filteredParts.length > 0 ? (
                            filteredParts.map((part) => (
                              <div
                                key={part.id}
                                className="p-2 hover:bg-accent cursor-pointer border-b"
                                onClick={() => handleSelectPart(index, part)}
                              >
                                <div className="font-medium text-sm">{part.part_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {part.part_code} • Estoque: {part.quantity} • R$ {part.unit_cost?.toFixed(2) || '0,00'}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              Nenhuma peça encontrada. A peça será criada após o recebimento.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {item.part_id && (
                      <Badge variant="outline" className="mt-1">
                        <Package className="w-3 h-3 mr-1" />
                        Peça do estoque
                      </Badge>
                    )}
                    {!item.part_id && item.item_name && (
                      <Badge variant="secondary" className="mt-1">
                        Nova peça (será criada após recebimento)
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity.toString()}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Preço Unitário</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price.toString()}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Descrição</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Descrição detalhada do item"
                    />
                  </div>
                </div>
                
                {items.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-right border-t pt-4">
          <p className="text-lg font-semibold">
            Total Estimado: {formatCurrency(
              items.reduce((sum, item) => 
                sum + (item.quantity * (item.unit_price || 0)), 0
              )
            )}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Requisição'}
          </Button>
        </div>
      </div>
      </DialogContent>

      {/* Modal para criar nova peça */}
      <Dialog open={showCreatePartModal} onOpenChange={setShowCreatePartModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Peça</DialogTitle>
          </DialogHeader>
          <PartForm 
            onSuccess={() => {
              setShowCreatePartModal(false);
              fetchParts({ search: '' }); // Recarregar lista de peças
              toast({
                title: "Peça criada",
                description: "Peça criada com sucesso. Agora você pode selecioná-la.",
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

