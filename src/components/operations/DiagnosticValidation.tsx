import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            Validação Completa
          </CardTitle>
          <CardDescription>
            Todas as validações foram aprovadas
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          Validação do Diagnóstico
        </CardTitle>
        <CardDescription>
          {isValid 
            ? "Diagnóstico válido e pronto para ser salvo"
            : "Corrija os erros abaixo antes de salvar o diagnóstico"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="flex gap-2 flex-wrap">
          {errors.length > 0 && (
            <Badge variant="destructive">
              {errors.length} erro{errors.length > 1 ? 's' : ''}
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge variant="secondary">
              {warnings.length} aviso{warnings.length > 1 ? 's' : ''}
            </Badge>
          )}
          {info.length > 0 && (
            <Badge variant="outline">
              {info.length} informação{info.length > 1 ? 'ões' : ''}
            </Badge>
          )}
        </div>

        {/* Erros */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Erros que impedem o salvamento:</p>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error) => (
                    <li key={error.id} className="text-sm">
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Avisos */}
        {warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Avisos importantes:</p>
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning) => (
                    <li key={warning.id} className="text-sm">
                      {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Informações */}
        {info.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Informações adicionais:</p>
                <ul className="list-disc list-inside space-y-1">
                  {info.map((infoItem) => (
                    <li key={infoItem.id} className="text-sm">
                      {infoItem.message}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Lista detalhada de validações */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Detalhes das Validações:</h4>
          <div className="space-y-1">
            {validationRules.map((rule) => (
              <div 
                key={rule.id} 
                className={`flex items-center gap-2 p-2 rounded text-sm ${
                  rule.condition 
                    ? 'bg-green-50 text-green-700' 
                    : rule.type === 'required'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                {getIcon(rule.condition ? 'success' : rule.type)}
                <span className="flex-1">{rule.message}</span>
                <Badge variant={rule.condition ? 'default' : getBadgeVariant(rule.type)}>
                  {rule.condition ? 'OK' : translateValidationType(rule.type)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiagnosticValidation;
