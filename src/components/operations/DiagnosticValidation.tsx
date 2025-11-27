import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

interface ValidationRule {
  id: string;
  type: 'required' | 'warning' | 'info';
  message: string;
  condition: boolean;
}

interface DiagnosticValidationProps {
  responses: Record<string, { value: unknown; photos: unknown[]; notes?: string }>;
  checklist: { items?: ChecklistItem[] };
  onValidationChange?: (isValid: boolean, errors: string[], warnings: string[]) => void;
}

interface ChecklistItem {
  id: string;
  item_name: string;
  item_type: 'checkbox' | 'measurement' | 'photo' | 'text' | 'select';
  is_required: boolean;
  expected_values?: { min: number; max: number };
}

const DiagnosticValidation = ({ 
  responses, 
  checklist, 
  onValidationChange 
}: DiagnosticValidationProps) => {
  
  const validateResponses = (): ValidationRule[] => {
    const rules: ValidationRule[] = [];
    
    if (!checklist?.items) return rules;

    checklist.items.forEach((item: ChecklistItem) => {
      const response = responses[item.id];
      
      // Validação de itens obrigatórios
      if (item.is_required) {
        const isEmpty = !response || 
          (typeof response.value === 'boolean' && !response.value) ||
          (typeof response.value === 'string' && response.value.trim() === '') ||
          (typeof response.value === 'number' && response.value === 0);
        
        rules.push({
          id: `required_${item.id}`,
          type: 'required',
          message: `"${item.item_name}" é obrigatório`,
          condition: !isEmpty
        });
      }

      // Validação de medições com valores esperados
      if (item.item_type === 'measurement' && item.expected_values && response?.value) {
        const value = parseFloat(String(response.value));
        const { min, max } = item.expected_values;
        
        if (value < min || value > max) {
          rules.push({
            id: `measurement_${item.id}`,
            type: 'warning',
            message: `"${item.item_name}" está fora do padrão esperado (${min} - ${max}mm)`,
            condition: false
          });
        }
      }

      // Validação de fotos obrigatórias
      if (item.item_type === 'photo' && item.is_required && (!response?.photos || response.photos.length === 0)) {
        rules.push({
          id: `photo_${item.id}`,
          type: 'required',
          message: `"${item.item_name}" requer pelo menos uma foto`,
          condition: false
        });
      }

      // Validação de seleção obrigatória
      if (item.item_type === 'select' && item.is_required && (!response?.value || response.value === '')) {
        rules.push({
          id: `select_${item.id}`,
          type: 'required',
          message: `"${item.item_name}" requer uma seleção`,
          condition: false
        });
      }
    });

    return rules;
  };

  const validationRules = validateResponses();
  const errors = validationRules.filter(rule => rule.type === 'required' && !rule.condition);
  const warnings = validationRules.filter(rule => rule.type === 'warning' && !rule.condition);
  const info = validationRules.filter(rule => rule.type === 'info' && !rule.condition);
  
  const isValid = errors.length === 0;
  const hasWarnings = warnings.length > 0;

  // Notificar mudanças na validação
  React.useEffect(() => {
    if (onValidationChange) {
      onValidationChange(
        isValid, 
        errors.map(e => e.message), 
        warnings.map(w => w.message)
      );
    }
  }, [isValid, errors, warnings, onValidationChange]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'required':
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
      case 'info':
        return <Info className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'required':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'default';
    }
  };

  const translateValidationType = (type: string) => {
    switch (type) {
      case 'required':
        return 'obrigatório';
      case 'warning':
        return 'aviso';
      case 'info':
        return 'informação';
      default:
        return type;
    }
  };

  if (validationRules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Validação completa - Todas as validações foram aprovadas</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {isValid ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <span>Validação do Diagnóstico</span>
          </CardTitle>
          <div className="flex gap-2">
            {errors.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {errors.length} erro{errors.length > 1 ? 's' : ''}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {warnings.length} aviso{warnings.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-xs mt-1">
          {isValid 
            ? "Diagnóstico válido e pronto para ser salvo"
            : "Corrija os erros abaixo antes de salvar"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {validationRules.map((rule) => (
            <div 
              key={rule.id} 
              className={`flex items-center gap-2 py-1.5 px-2 rounded text-xs ${
                rule.condition 
                  ? 'bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400' 
                  : rule.type === 'required'
                  ? 'bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                  : 'bg-yellow-50/50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400'
              }`}
            >
              <div className="flex-shrink-0">
                {getIcon(rule.condition ? 'success' : rule.type)}
              </div>
              <span className="flex-1 min-w-0 truncate">{rule.message}</span>
              {!rule.condition && (
                <Badge 
                  variant={getBadgeVariant(rule.type)} 
                  className="text-xs px-1.5 py-0 h-5 flex-shrink-0"
                >
                  {translateValidationType(rule.type)}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DiagnosticValidation;
