import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import { formatCurrency } from "@/utils/masks";

interface DiagnosticObservationsTabProps {
  technicalObservations: string;
  extraServices: string;
  finalOpinion: string;
  laborCost: number;
  onTechnicalObservationsChange: (value: string) => void;
  onExtraServicesChange: (value: string) => void;
  onFinalOpinionChange: (value: string) => void;
}

export function DiagnosticObservationsTab({
  technicalObservations,
  extraServices,
  finalOpinion,
  laborCost,
  onTechnicalObservationsChange,
  onExtraServicesChange,
  onFinalOpinionChange
}: DiagnosticObservationsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Observações Técnicas
          </CardTitle>
          <CardDescription>
            Registre observações técnicas relevantes sobre o diagnóstico
          </CardDescription>
        </CardHeader>
        <CardContent>
          {laborCost > 0 && (
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-3">
              <span>Mão de obra do template</span>
              <span className="font-medium text-foreground">{formatCurrency(laborCost)}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="technical_observations">Observações Técnicas</Label>
            <Textarea
              id="technical_observations"
              value={technicalObservations}
              onChange={(e) => onTechnicalObservationsChange(e.target.value)}
              placeholder="Descreva observações técnicas relevantes..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Serviços Extras
          </CardTitle>
          <CardDescription>
            Descreva serviços extras necessários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="extra_services">Serviços Extras</Label>
            <Textarea
              id="extra_services"
              value={extraServices}
              onChange={(e) => onExtraServicesChange(e.target.value)}
              placeholder="Descreva serviços extras necessários..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Parecer Final
          </CardTitle>
          <CardDescription>
            Forneça um parecer final sobre o diagnóstico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="final_opinion">Parecer Final</Label>
            <Textarea
              id="final_opinion"
              value={finalOpinion}
              onChange={(e) => onFinalOpinionChange(e.target.value)}
              placeholder="Forneça um parecer final sobre o diagnóstico..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

