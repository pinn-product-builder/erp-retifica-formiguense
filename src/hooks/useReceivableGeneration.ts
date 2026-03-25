import { useCallback, useState } from 'react';
import {
  ReceivableFromBudgetService,
  type BudgetPaymentConditionInput,
} from '@/services/financial/receivableFromBudgetService';

export function useReceivableGeneration() {
  const [isLoading, setIsLoading] = useState(false);

  const generateFromApprovedBudget = useCallback(
    async (params: {
      orgId: string;
      userId: string | null;
      budgetId: string;
      orderId: string | null;
      customerId: string;
      approvedAmount: number;
      condition: BudgetPaymentConditionInput;
      payment_method:
        | 'cash'
        | 'pix'
        | 'credit_card'
        | 'debit_card'
        | 'bank_transfer'
        | 'check'
        | 'boleto'
        | null
        | undefined;
    }) => {
      setIsLoading(true);
      try {
        return await ReceivableFromBudgetService.createForApprovedBudget(params);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, generateFromApprovedBudget };
}
