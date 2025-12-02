import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Package } from "lucide-react";
import { DiagnosticChecklistItemComponent } from './DiagnosticChecklistItem';
import { PartsServicesSelector } from './PartsServicesSelector';
import type { DiagnosticChecklist, DiagnosticChecklistItem } from '@/hooks/useDiagnosticChecklists';

interface ChecklistResponse {
  [itemId: string]: {
    value: unknown;
    photos: Array<Record<string, unknown>>;
    notes?: string;
  };
}

interface Part {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Service {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface DiagnosticComponentTabProps {
  component: { id: string; value: string; label: string };
  checklist: DiagnosticChecklist | undefined;
  responses: ChecklistResponse;
  parts: Part[];
  services: Service[];
  onResponseChange: (itemId: string, value: unknown) => void;
  onPhotoUpload: (itemId: string, file: File) => void;
  onPhotoRemove: (itemId: string, photoIndex: number) => void;
  onNotesChange: (itemId: string, notes: string) => void;
  onPartsChange: (parts: Part[]) => void;
  onServicesChange: (services: Service[]) => void;
  macroComponentId?: string;
  engineTypeId?: string;
  validateItem: (item: DiagnosticChecklistItem, response: { value: unknown; photos: unknown[]; notes?: string }) => { isValid: boolean; message: string };
}

export function DiagnosticComponentTab({
  component,
  checklist,
  responses,
  parts,
  services,
  onResponseChange,
  onPhotoUpload,
  onPhotoRemove,
  onNotesChange,
  onPartsChange,
  onServicesChange,
  macroComponentId,
  engineTypeId,
  validateItem
}: DiagnosticComponentTabProps) {
  if (!checklist) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum checklist encontrado para {component.label}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {checklist.items
          ?.sort((a: DiagnosticChecklistItem, b: DiagnosticChecklistItem) => a.display_order - b.display_order)
          .map((item: DiagnosticChecklistItem) => {
            const response = responses[item.id] || { value: '', photos: [], notes: '' };
            return (
              <DiagnosticChecklistItemComponent
                key={item.id}
                item={item}
                response={response}
                onValueChange={(value) => onResponseChange(item.id, value)}
                onPhotoUpload={(file) => onPhotoUpload(item.id, file)}
                onPhotoRemove={(index) => onPhotoRemove(item.id, index)}
                onNotesChange={(notes) => onNotesChange(item.id, notes)}
                validateItem={validateItem}
              />
            );
          })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Peças e Serviços Adicionais - {component.label}
          </CardTitle>
          <CardDescription>
            Adicione peças e serviços adicionais específicos deste componente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PartsServicesSelector
            selectedParts={parts}
            selectedServices={services}
            onPartsChange={onPartsChange}
            onServicesChange={onServicesChange}
            macroComponentId={macroComponentId}
            engineTypeId={engineTypeId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

