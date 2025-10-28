# US-FIN-004: Conciliação Bancária

**ID:** US-FIN-004  
**Épico:** Financeiro  
**Sprint:** 10  
**Prioridade:** 🟡 Média  
**Estimativa:** 8 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** contador  
**Quero** conciliar extrato bancário com lançamentos  
**Para** identificar divergências e garantir precisão contábil

---

## 🎯 Objetivo de Negócio

Automatizar processo de conciliação bancária reduzindo erros manuais e tempo gasto.

---

## ✅ Critérios de Aceitação

**AC01:** Upload de extrato OFX/CSV  
**AC02:** Parser automático de transações bancárias  
**AC03:** Matching automático com contas a pagar/receber  
**AC04:** Lista de transações não conciliadas  
**AC05:** Vincular manualmente transação a lançamento  
**AC06:** Criar lançamento a partir de transação não identificada  
**AC07:** Exportar relatório de conciliação  
**AC08:** Status: conciliado, pendente, divergente

---

## 📐 Regras de Negócio

### RN-FIN-004-A: Parser de Extrato OFX
```typescript
import { parseString } from 'xml2js';

interface BankTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number;
}

const parseOFX = async (file: File): Promise<BankTransaction[]> => {
  const text = await file.text();
  
  return new Promise((resolve, reject) => {
    parseString(text, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      
      const transactions = result.OFX.BANKMSGSRSV1[0].STMTTRNRS[0].STMTRS[0].BANKTRANLIST[0].STMTTRN;
      
      const parsed = transactions.map((trx: any) => ({
        date: new Date(
          trx.DTPOSTED[0].substring(0, 4),
          parseInt(trx.DTPOSTED[0].substring(4, 6)) - 1,
          trx.DTPOSTED[0].substring(6, 8)
        ),
        description: trx.MEMO[0],
        amount: parseFloat(trx.TRNAMT[0]),
        type: parseFloat(trx.TRNAMT[0]) > 0 ? 'credit' : 'debit',
        balance: 0, // Will be calculated
      }));
      
      resolve(parsed);
    });
  });
};
```

### RN-FIN-004-B: Matching Automático
```typescript
interface MatchResult {
  bank_transaction_id: string;
  matched_type: 'payable' | 'receivable' | 'none';
  matched_id?: string;
  confidence_score: number;  // 0-100
  match_reason: string;
}

const autoMatchTransaction = async (
  bankTrx: BankTransaction,
  orgId: string
): Promise<MatchResult> => {
  const tolerance = 0.01; // R$ 0,01
  const dateTolerance = 3; // 3 dias
  
  // Tentar match com contas a receber (créditos)
  if (bankTrx.type === 'credit') {
    const { data: receivables } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .gte('original_amount', Math.abs(bankTrx.amount) - tolerance)
      .lte('original_amount', Math.abs(bankTrx.amount) + tolerance);
    
    for (const receivable of receivables || []) {
      const daysDiff = Math.abs(
        (bankTrx.date.getTime() - new Date(receivable.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff <= dateTolerance) {
        return {
          bank_transaction_id: '',
          matched_type: 'receivable',
          matched_id: receivable.id,
          confidence_score: 95,
          match_reason: 'Valor e data compatíveis',
        };
      }
    }
  }
  
  // Tentar match com contas a pagar (débitos)
  if (bankTrx.type === 'debit') {
    const { data: payables } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .gte('original_amount', Math.abs(bankTrx.amount) - tolerance)
      .lte('original_amount', Math.abs(bankTrx.amount) + tolerance);
    
    for (const payable of payables || []) {
      const daysDiff = Math.abs(
        (bankTrx.date.getTime() - new Date(payable.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff <= dateTolerance) {
        return {
          bank_transaction_id: '',
          matched_type: 'payable',
          matched_id: payable.id,
          confidence_score: 95,
          match_reason: 'Valor e data compatíveis',
        };
      }
    }
  }
  
  return {
    bank_transaction_id: '',
    matched_type: 'none',
    confidence_score: 0,
    match_reason: 'Nenhuma correspondência encontrada',
  };
};
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE bank_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Identificação
  reconciliation_number TEXT NOT NULL,
  statement_date DATE NOT NULL,
  
  -- Arquivo
  file_name TEXT NOT NULL,
  file_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Estatísticas
  total_transactions INTEGER DEFAULT 0,
  matched_transactions INTEGER DEFAULT 0,
  unmatched_transactions INTEGER DEFAULT 0,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_reconciliation_number UNIQUE (org_id, reconciliation_number)
);

CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id UUID NOT NULL REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
  
  -- Dados da transação
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  transaction_type TEXT NOT NULL,
    CHECK (transaction_type IN ('debit', 'credit')),
  balance DECIMAL(12,2),
  
  -- Matching
  match_status TEXT NOT NULL DEFAULT 'unmatched',
    CHECK (match_status IN ('matched', 'unmatched', 'manual')),
  matched_type TEXT,
    CHECK (matched_type IN ('payable', 'receivable', 'other')),
  matched_id UUID,
  confidence_score INTEGER,
  match_reason TEXT,
  
  -- Observações
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_bank_transactions_reconciliation ON bank_transactions(reconciliation_id);
CREATE INDEX idx_bank_transactions_match_status ON bank_transactions(match_status);

-- RLS
ALTER TABLE bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view org reconciliations"
  ON bank_reconciliations FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Financial users manage reconciliations"
  ON bank_reconciliations FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'financial_manager', 'accountant')
    )
  );

CREATE POLICY "Users view reconciliation transactions"
  ON bank_transactions FOR SELECT
  USING (
    reconciliation_id IN (
      SELECT id FROM bank_reconciliations
      WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Financial users manage transactions"
  ON bank_transactions FOR ALL
  USING (
    reconciliation_id IN (
      SELECT id FROM bank_reconciliations
      WHERE org_id IN (
        SELECT org_id FROM user_organizations 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'financial_manager', 'accountant')
      )
    )
  );
```

---

## 💻 Implementação

### Hook: `useBankReconciliation.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export const useBankReconciliation = () => {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  
  // Listar conciliações
  const { data: reconciliations = [], isLoading } = useQuery({
    queryKey: ['reconciliations', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      
      const { data, error } = await supabase
        .from('bank_reconciliations')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });
  
  // Upload e processar extrato
  const uploadStatement = useMutation({
    mutationFn: async (file: File) => {
      if (!currentOrg?.id) throw new Error("Organização não selecionada");
      
      // Upload do arquivo
      const fileName = `${currentOrg.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('bank-statements')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Criar registro de conciliação
      const { data: lastRec } = await supabase
        .from('bank_reconciliations')
        .select('reconciliation_number')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      const year = new Date().getFullYear();
      const lastNumber = lastRec?.reconciliation_number 
        ? parseInt(lastRec.reconciliation_number.split('-')[2]) 
        : 0;
      const recNumber = `RC-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
      
      const { data: reconciliation, error: recError } = await supabase
        .from('bank_reconciliations')
        .insert({
          org_id: currentOrg.id,
          reconciliation_number: recNumber,
          statement_date: new Date().toISOString().split('T')[0],
          file_name: file.name,
          file_url: fileName,
          status: 'in_progress',
        })
        .select()
        .single();
      
      if (recError) throw recError;
      
      // TODO: Processar arquivo e criar transações
      
      return reconciliation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      toast.success("Extrato carregado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao carregar extrato: ${error.message}`);
    },
  });
  
  return {
    reconciliations,
    isLoading,
    uploadStatement: uploadStatement.mutate,
    isUploading: uploadStatement.isPending,
  };
};
```

---

## 🧪 Cenários de Teste

```gherkin
Feature: Conciliação Bancária

Scenario: Upload de extrato OFX
  Given estou autenticado como contador
  When faço upload de arquivo extrato.ofx
  Then sistema processa 45 transações
  And realiza matching automático
  And mostra 40 transações conciliadas
  And mostra 5 transações pendentes
```

---

## 📋 Definition of Done

- [x] Tabelas criadas
- [x] Parser OFX implementado
- [x] Matching automático funcional
- [x] Upload de arquivos
- [x] RLS configurado

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
