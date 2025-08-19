import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useJurisdictionConfig, JurisdictionConfig } from '@/hooks/useJurisdictionConfig';
import { Palette, Save } from 'lucide-react';
import { toast } from 'sonner';

interface JurisdictionConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JurisdictionConfigModal({ open, onOpenChange }: JurisdictionConfigModalProps) {
  const { jurisdictionConfigs, updateJurisdictionConfig, loading } = useJurisdictionConfig();
  const [editingConfigs, setEditingConfigs] = useState<Record<string, Partial<JurisdictionConfig>>>({});

  const handleColorChange = (configId: string, field: 'badge_color' | 'text_color', value: string) => {
    setEditingConfigs(prev => ({
      ...prev,
      [configId]: {
        ...prev[configId],
        [field]: value
      }
    }));
  };

  const handleSave = async (configId: string) => {
    const updates = editingConfigs[configId];
    if (!updates) return;

    try {
      await updateJurisdictionConfig(configId, updates);
      setEditingConfigs(prev => {
        const { [configId]: removed, ...rest } = prev;
        return rest;
      });
      toast.success('Configuração de jurisdição atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar configuração');
    }
  };

  const getPreviewStyle = (config: JurisdictionConfig) => {
    const editing = editingConfigs[config.id];
    return {
      backgroundColor: editing?.badge_color || config.badge_color,
      color: editing?.text_color || config.text_color
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Configurar Cores das Jurisdições
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {jurisdictionConfigs.map(config => (
            <div key={config.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium capitalize">{config.jurisdiction}</h4>
                <Badge style={getPreviewStyle(config)}>
                  {config.jurisdiction}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`badge-color-${config.id}`}>Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`badge-color-${config.id}`}
                      type="color"
                      value={editingConfigs[config.id]?.badge_color || config.badge_color}
                      onChange={(e) => handleColorChange(config.id, 'badge_color', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={editingConfigs[config.id]?.badge_color || config.badge_color}
                      onChange={(e) => handleColorChange(config.id, 'badge_color', e.target.value)}
                      placeholder="Ex: hsl(var(--primary))"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`text-color-${config.id}`}>Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`text-color-${config.id}`}
                      type="color"
                      value={editingConfigs[config.id]?.text_color || config.text_color}
                      onChange={(e) => handleColorChange(config.id, 'text_color', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={editingConfigs[config.id]?.text_color || config.text_color}
                      onChange={(e) => handleColorChange(config.id, 'text_color', e.target.value)}
                      placeholder="Ex: hsl(var(--primary-foreground))"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              {editingConfigs[config.id] && (
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    onClick={() => handleSave(config.id)}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          <div className="bg-muted/50 rounded-lg p-4">
            <h5 className="font-medium mb-2">Dica:</h5>
            <p className="text-sm text-muted-foreground">
              Use tokens do design system como <code>hsl(var(--primary))</code> para manter consistência visual. 
              Os tokens disponíveis incluem: --primary, --secondary, --accent, --muted, e suas variações com -foreground.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}