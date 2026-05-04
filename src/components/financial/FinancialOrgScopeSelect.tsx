import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { FinancialScopeSelection } from '@/hooks/useFinancialOrgScope';

type Option = { id: string; name: string };

type Props = {
  id?: string;
  groupOrgIds: string[];
  scopeSelection: FinancialScopeSelection;
  onScopeChange: (v: FinancialScopeSelection) => void;
  orgLabel: (id: string) => string;
  disabled?: boolean;
  className?: string;
};

/** Exibido só quando há mais de uma empresa no grupo (`showGroupFilter`). */
export function FinancialOrgScopeSelect({
  id = 'financial-org-scope',
  groupOrgIds,
  scopeSelection,
  onScopeChange,
  orgLabel,
  disabled,
  className,
}: Props) {
  if (groupOrgIds.length <= 1) return null;

  const options: Option[] = groupOrgIds.map((oid) => ({ id: oid, name: orgLabel(oid) }));

  return (
    <div className={`flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 ${className ?? ''}`}>
      <Label htmlFor={id} className="text-xs sm:text-sm whitespace-nowrap shrink-0">
        Empresa
      </Label>
      <Select
        value={scopeSelection === 'all' ? 'all' : scopeSelection}
        onValueChange={(v) => onScopeChange(v === 'all' ? 'all' : v)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="h-8 w-full min-w-0 sm:max-w-[280px] text-xs sm:text-sm">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id} className="text-xs sm:text-sm">
              {o.name}
            </SelectItem>
          ))}
          <SelectItem value="all" className="text-xs sm:text-sm font-medium">
            Todas as empresas
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
