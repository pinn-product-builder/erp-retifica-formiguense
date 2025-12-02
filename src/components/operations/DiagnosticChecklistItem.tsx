import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Camera, 
  CheckCircle, 
  Hash,
  Type,
  List,
  X,
  XCircle
} from "lucide-react";
import type { DiagnosticChecklistItem } from '@/hooks/useDiagnosticChecklists';

interface ChecklistResponse {
  value: unknown;
  photos: Array<Record<string, unknown>>;
  notes?: string;
}

interface DiagnosticChecklistItemProps {
  item: DiagnosticChecklistItem;
  response: ChecklistResponse;
  onValueChange: (value: unknown) => void;
  onPhotoUpload: (file: File) => void;
  onPhotoRemove: (index: number) => void;
  onNotesChange: (notes: string) => void;
  validateItem: (item: DiagnosticChecklistItem, response: ChecklistResponse) => { isValid: boolean; message: string };
}

const itemTypeIcons = {
  checkbox: CheckCircle,
  measurement: Hash,
  photo: Camera,
  text: Type,
  select: List
};

export function DiagnosticChecklistItemComponent({
  item,
  response,
  onValueChange,
  onPhotoUpload,
  onPhotoRemove,
  onNotesChange,
  validateItem
}: DiagnosticChecklistItemProps) {
  const IconComponent = itemTypeIcons[item.item_type as keyof typeof itemTypeIcons] || CheckCircle;
  const validation = validateItem(item, response);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <IconComponent className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="truncate">{item.item_name}</span>
                  {item.is_required && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {validation.isValid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <Badge variant="destructive" className="text-xs">
                            {validation.message}
                          </Badge>
                        </>
                      )}
                    </div>
                  )}
                </CardTitle>
              </div>
              {item.item_description && (
                <CardDescription className="mt-1">
                  {item.item_description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground flex-shrink-0">
            #{item.display_order}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {item.item_type === 'checkbox' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`item_${item.id}`}
              checked={Boolean(response.value)}
              onCheckedChange={onValueChange}
            />
            <Label htmlFor={`item_${item.id}`} className="text-sm">
              Marcar como verificado
            </Label>
          </div>
        )}

        {item.item_type === 'measurement' && (
          <div className="space-y-2">
            <Label htmlFor={`measurement_${item.id}`}>
              Medição (mm)
              {item.expected_values && typeof item.expected_values === 'object' && 'min' in item.expected_values && 'max' in item.expected_values && (
                <span className="text-sm text-muted-foreground ml-2">
                  (Esperado: {String(item.expected_values.min)} - {String(item.expected_values.max)})
                </span>
              )}
            </Label>
            <Input
              id={`measurement_${item.id}`}
              type="number"
              step="0.01"
              value={typeof response.value === 'number' ? response.value : ''}
              onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
              placeholder="Digite a medição..."
            />
          </div>
        )}

        {item.item_type === 'text' && (
          <div className="space-y-2">
            <Label htmlFor={`text_${item.id}`}>Observações</Label>
            <Textarea
              id={`text_${item.id}`}
              value={typeof response.value === 'string' ? response.value : ''}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="Digite suas observações..."
              rows={3}
            />
          </div>
        )}

        {item.item_type === 'select' && (
          <div className="space-y-2">
            <Label htmlFor={`select_${item.id}`}>Seleção</Label>
            <Select
              value={String(response.value || '')}
              onValueChange={onValueChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {item.item_options?.map((option: Record<string, unknown> | string, index: number) => {
                  const optionValue = typeof option === 'object' && option !== null && 'value' in option 
                    ? String(option.value) 
                    : String(option);
                  const optionLabel = typeof option === 'object' && option !== null && 'label' in option
                    ? String(option.label)
                    : String(option);
                  return (
                    <SelectItem key={index} value={optionValue}>
                      {optionLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {item.item_type === 'photo' && (
          <div className="space-y-4">
            <div>
              <Label>Fotos</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPhotoUpload(file);
                  }}
                  className="hidden"
                  id={`photo_${item.id}`}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById(`photo_${item.id}`)?.click()}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Adicionar Foto
                </Button>
              </div>
            </div>

            {response.photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {response.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={String(photo.url || '')}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onPhotoRemove(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={`notes_${item.id}`}>Observações Adicionais</Label>
          <Textarea
            id={`notes_${item.id}`}
            value={response.notes || ''}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Observações adicionais sobre este item..."
            rows={2}
          />
        </div>

        {item.help_text && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <strong>Dica:</strong> {item.help_text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

