import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CostCenterService } from '@/services/financial/costCenterService';

type Row = { id: string; code: string; name: string };

type CostCenterSelectProps = {
  orgId: string;
  value: string;
  onValueChange: (id: string) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
};

export function CostCenterSelect({
  orgId,
  value,
  onValueChange,
  label = 'Centro de custo',
  id = 'cost-center',
  disabled,
}: CostCenterSelectProps) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!orgId) {
      setRows([]);
      return;
    }
    void CostCenterService.list(orgId).then((list) => {
      setRows(
        (list as { id: string; code: string; name: string }[]).map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
        }))
      );
    });
  }, [orgId]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs sm:text-sm">
        {label}
      </Label>
      <Select
        value={value || '__none__'}
        onValueChange={(v) => onValueChange(v === '__none__' ? '' : v)}
        disabled={disabled || !orgId}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Opcional" />
        </SelectTrigger>
        <SelectContent className="z-[2000]">
          <SelectItem value="__none__">Nenhum</SelectItem>
          {rows.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              <span className="truncate">
                {r.code} — {r.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
