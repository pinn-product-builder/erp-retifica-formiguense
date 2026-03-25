import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BudgetPaymentConditionInput } from '@/services/financial/receivableFromBudgetService';

export type BudgetArPaymentMethod =
  | 'cash'
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'check'
  | 'boleto';

export type BudgetPaymentConditionUiState = {
  payKind: 'avista' | 'parcelado' | 'sinal_saldo';
  firstDue: string;
  competence: string;
  parcelN: string;
  signalAmt: string;
  signalDue: string;
  balanceDue: string;
  arPaymentMethod: BudgetArPaymentMethod;
};

export function getDefaultBudgetPaymentConditionState(): BudgetPaymentConditionUiState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    payKind: 'avista',
    firstDue: today,
    competence: today,
    parcelN: '2',
    signalAmt: '',
    signalDue: today,
    balanceDue: today,
    arPaymentMethod: 'pix',
  };
}

export function buildBudgetPaymentConditionFromUi(
  s: BudgetPaymentConditionUiState
): BudgetPaymentConditionInput {
  if (s.payKind === 'avista') {
    return {
      kind: 'avista',
      first_due_date: s.firstDue,
      competence_date: s.competence,
    };
  }
  if (s.payKind === 'parcelado') {
    const n = Math.min(12, Math.max(2, Math.floor(Number(s.parcelN) || 2)));
    return {
      kind: 'parcelado',
      first_due_date: s.firstDue,
      competence_date: s.competence,
      installments: n,
    };
  }
  return {
    kind: 'sinal_saldo',
    signal_amount: Number(String(s.signalAmt).replace(',', '.')),
    signal_due_date: s.signalDue,
    balance_due_date: s.balanceDue,
    competence_date: s.competence,
  };
}

type BudgetPaymentConditionSectionProps = {
  value: BudgetPaymentConditionUiState;
  onChange: (next: BudgetPaymentConditionUiState) => void;
};

export function BudgetPaymentConditionSection({ value, onChange }: BudgetPaymentConditionSectionProps) {
  const set = (patch: Partial<BudgetPaymentConditionUiState>) => onChange({ ...value, ...patch });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Condição de pagamento (contas a receber)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Forma</Label>
          <Select
            value={value.payKind}
            onValueChange={(v) => set({ payKind: v as BudgetPaymentConditionUiState['payKind'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="avista">À vista</SelectItem>
              <SelectItem value="parcelado">Parcelado</SelectItem>
              <SelectItem value="sinal_saldo">Sinal + saldo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">
              {value.payKind === 'sinal_saldo' ? 'Vencimento sinal' : 'Primeiro vencimento'}
            </Label>
            <Input
              type="date"
              value={value.payKind === 'sinal_saldo' ? value.signalDue : value.firstDue}
              onChange={(e) =>
                value.payKind === 'sinal_saldo'
                  ? set({ signalDue: e.target.value })
                  : set({ firstDue: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Competência</Label>
            <Input
              type="date"
              value={value.competence}
              onChange={(e) => set({ competence: e.target.value })}
            />
          </div>
        </div>
        {value.payKind === 'parcelado' && (
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Parcelas (2–12)</Label>
            <Input
              inputMode="numeric"
              value={value.parcelN}
              onChange={(e) => set({ parcelN: e.target.value })}
            />
          </div>
        )}
        {value.payKind === 'sinal_saldo' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Valor do sinal</Label>
              <Input
                inputMode="decimal"
                placeholder="0,00"
                value={value.signalAmt}
                onChange={(e) => set({ signalAmt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Vencimento saldo</Label>
              <Input
                type="date"
                value={value.balanceDue}
                onChange={(e) => set({ balanceDue: e.target.value })}
              />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Forma de recebimento</Label>
          <Select value={value.arPaymentMethod} onValueChange={(v) => set({ arPaymentMethod: v as BudgetArPaymentMethod })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="credit_card">Cartão crédito</SelectItem>
              <SelectItem value="debit_card">Cartão débito</SelectItem>
              <SelectItem value="bank_transfer">Transferência</SelectItem>
              <SelectItem value="cash">Dinheiro</SelectItem>
              <SelectItem value="check">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
