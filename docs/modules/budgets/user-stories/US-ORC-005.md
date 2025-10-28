# US-ORC-005: Registrar Aprovação/Rejeição do Cliente

**ID:** US-ORC-005  
**Epic:** Orçamentos  
**Sprint:** 5  
**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente comercial  
**Quero** registrar a decisão do cliente sobre o orçamento  
**Para** documentar aprovações e iniciar execução dos serviços

---

## 🎯 Business Objective

Criar sistema robusto de aprovação com documentação comprobatória obrigatória e diferentes modalidades de aprovação (total, parcial, rejeição).

---

## 📐 Business Rules

### RN028: Tipos de Aprovação
```typescript
type ApprovalType = 
  | 'total'              // Cliente aprovou tudo
  | 'partial'            // Cliente aprovou apenas alguns itens
  | 'rejected';          // Cliente rejeitou o orçamento

interface BudgetApproval {
  id: string;
  budget_id: string;
  approval_type: ApprovalType;
  approval_method: ApprovalMethod;
  approved_by_customer: string;    // Nome do aprovador
  approved_at: Date;
  
  // Aprovação parcial
  approved_services?: string[];    // IDs dos serviços aprovados
  approved_parts?: string[];       // IDs das peças aprovadas
  approved_amount?: number;        // Valor total aprovado
  
  // Documentação OBRIGATÓRIA
  approval_document: {
    file_url: string;              // URL do Supabase Storage
    file_name: string;
    file_type: 'image/jpeg' | 'image/jpg' | 'image/png';
    uploaded_at: Date;
  };
  
  approval_notes?: string;
  registered_by: string;           // Usuário que registrou
}
```

### RN029: Métodos de Aprovação
```typescript
type ApprovalMethod = 
  | 'signature'      // Assinatura física digitalizada
  | 'whatsapp'       // Print de conversa WhatsApp
  | 'email'          // Screenshot de email
  | 'verbal';        // Confirmação verbal (foto/print registro)

// TODOS os métodos exigem upload de imagem obrigatória
const documentRequirements = {
  signature: 'Foto da assinatura física no orçamento impresso',
  whatsapp: 'Print da conversa confirmando aprovação',
  email: 'Screenshot do email de confirmação',
  verbal: 'Foto ou print do registro de confirmação verbal'
};
```

### RN030: Validação de Documento
**Requisitos obrigatórios:**
- ✅ Arquivo de imagem (JPEG, JPG ou PNG apenas)
- ✅ Tamanho máximo: 5 MB
- ✅ Upload bem-sucedido no Supabase Storage
- ✅ Nome descritivo do arquivo
- ⛔ Não aceita: PDF, DOC, TXT ou outros formatos

### RN031: Aprovação Total
**Quando cliente aprova tudo:**
1. Status do orçamento → `customer_approved`
2. Todos os serviços/peças marcados como aprovados
3. Valor aprovado = valor total do orçamento
4. Documento comprobatório é armazenado
5. Notificação enviada ao gerente
6. Orçamento aguarda aprovação interna final

### RN032: Aprovação Parcial
**Quando cliente aprova apenas alguns itens:**
1. Status do orçamento → `partially_approved`
2. Sistema exibe seletor de itens
3. Usuário marca quais serviços/peças foram aprovados
4. Valor aprovado = soma dos itens selecionados
5. Novo orçamento pode ser gerado com itens rejeitados
6. Documento comprova aprovação parcial

### RN033: Rejeição
**Quando cliente rejeita:**
1. Status do orçamento → `rejected`
2. Campo de justificativa é obrigatório
3. Documento de rejeição é armazenado
4. Orçamento pode ser revisado (novo orçamento gerado)
5. Notificação com motivo da rejeição

### RN034: Portal do Cliente
**Cliente pode aprovar diretamente pelo portal:**
```typescript
// Fluxo no portal público
1. Cliente acessa link recebido
2. Visualiza orçamento completo
3. Escolhe uma opção:
   - "✅ Aprovar Tudo"
   - "📝 Aprovar Parcialmente"
   - "❌ Rejeitar"
4. Para qualquer opção:
   - Preenche nome completo
   - Pode adicionar observações
   - Upload de documento comprobatório
5. Submete aprovação
6. Recebe confirmação por email/WhatsApp
```

### RN035: Histórico de Aprovações
**Auditoria completa:**
- Todas as aprovações são registradas
- Histórico mostra quem aprovou, quando e como
- Documentos ficam arquivados permanentemente
- Impossível deletar aprovações (apenas visualizar)

---

## ✅ Acceptance Criteria

**AC29:** Botão "Registrar Aprovação" aparece para orçamentos pendentes  
**AC30:** Modal permite selecionar tipo (Total/Parcial/Rejeitado)  
**AC31:** Upload de imagem comprobatória é obrigatório  
**AC32:** Sistema valida formato de arquivo (JPEG/JPG/PNG)  
**AC33:** Aprovação parcial exibe seletor de itens  
**AC34:** Status do orçamento é atualizado automaticamente  
**AC35:** Histórico completo de aprovações é exibido  
**AC36:** Portal público permite cliente aprovar diretamente

---

## 🛠️ Definition of Done

- [ ] Componente `BudgetApprovalModal.tsx` implementado
- [ ] Componente `ItemSelector.tsx` criado (aprovação parcial)
- [ ] Hook `useBudgetApproval.ts` implementado
- [ ] Tabela `budget_approvals` criada
- [ ] Storage bucket `budget-approvals` configurado
- [ ] RLS policies para aprovações criadas
- [ ] Portal público com formulário de aprovação
- [ ] Validação de formatos de arquivo
- [ ] Histórico de aprovações visível
- [ ] Notificações implementadas
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/budgets/
  ├── BudgetApprovalModal.tsx      (NEW)
  ├── ItemSelector.tsx             (NEW)
  ├── ApprovalHistory.tsx          (NEW)
  └── ApprovalDocumentUpload.tsx   (NEW)

src/pages/
  └── PublicBudgetView.tsx         (UPDATE - formulário)

src/hooks/
  └── useBudgetApproval.ts         (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela de aprovações
CREATE TABLE budget_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES detailed_budgets(id) NOT NULL,
  approval_type TEXT NOT NULL CHECK (
    approval_type IN ('total', 'partial', 'rejected')
  ),
  approval_method TEXT NOT NULL CHECK (
    approval_method IN ('signature', 'whatsapp', 'email', 'verbal')
  ),
  
  -- Identificação do aprovador
  approved_by_customer TEXT NOT NULL,
  approved_at TIMESTAMPTZ DEFAULT now(),
  
  -- Aprovação parcial
  approved_services JSONB DEFAULT '[]'::jsonb,
  approved_parts JSONB DEFAULT '[]'::jsonb,
  approved_amount NUMERIC(10,2),
  
  -- Documento OBRIGATÓRIO
  approval_document JSONB NOT NULL,  -- { file_url, file_name, file_type, uploaded_at }
  
  approval_notes TEXT,
  rejection_reason TEXT,  -- Obrigatório se rejected
  
  -- Auditoria
  registered_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Validações
  CONSTRAINT check_rejection_reason 
    CHECK (
      (approval_type = 'rejected' AND rejection_reason IS NOT NULL) OR
      (approval_type != 'rejected')
    ),
  CONSTRAINT check_partial_items
    CHECK (
      (approval_type = 'partial' AND 
       (jsonb_array_length(approved_services) > 0 OR 
        jsonb_array_length(approved_parts) > 0)) OR
      (approval_type != 'partial')
    )
);

-- Índices
CREATE INDEX idx_budget_approvals_budget ON budget_approvals(budget_id);
CREATE INDEX idx_budget_approvals_type ON budget_approvals(approval_type);

-- RLS
ALTER TABLE budget_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals of their org budgets"
  ON budget_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM detailed_budgets db
      JOIN orders o ON o.id = db.order_id
      WHERE db.id = budget_approvals.budget_id
      AND o.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create approvals"
  ON budget_approvals FOR INSERT
  WITH CHECK (
    registered_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM detailed_budgets db
      JOIN orders o ON o.id = db.order_id
      WHERE db.id = budget_approvals.budget_id
      AND o.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Não permite UPDATE ou DELETE em aprovações (auditoria)
-- Aprovações são imutáveis após criação

-- Função para processar aprovação
CREATE OR REPLACE FUNCTION process_budget_approval(
  p_budget_id UUID,
  p_approval_type TEXT,
  p_approval_method TEXT,
  p_approved_by_customer TEXT,
  p_approval_document JSONB,
  p_approved_services JSONB DEFAULT '[]'::jsonb,
  p_approved_parts JSONB DEFAULT '[]'::jsonb,
  p_approval_notes TEXT DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_new_status TEXT;
  v_approved_amount NUMERIC(10,2);
  v_approval_id UUID;
BEGIN
  -- Determinar novo status
  CASE p_approval_type
    WHEN 'total' THEN v_new_status := 'customer_approved';
    WHEN 'partial' THEN v_new_status := 'partially_approved';
    WHEN 'rejected' THEN v_new_status := 'rejected';
  END CASE;
  
  -- Calcular valor aprovado
  IF p_approval_type = 'total' THEN
    SELECT total INTO v_approved_amount 
    FROM detailed_budgets WHERE id = p_budget_id;
  ELSIF p_approval_type = 'partial' THEN
    -- Calcular com base nos itens selecionados
    SELECT 
      COALESCE(SUM((item->>'total_price')::NUMERIC), 0)
    INTO v_approved_amount
    FROM detailed_budgets db
    CROSS JOIN jsonb_array_elements(db.services) AS item
    WHERE db.id = p_budget_id
    AND item->>'service_code' = ANY(
      SELECT jsonb_array_elements_text(p_approved_services)
    );
    
    -- Adicionar peças aprovadas
    v_approved_amount := v_approved_amount + (
      SELECT COALESCE(SUM((item->>'total_price')::NUMERIC), 0)
      FROM detailed_budgets db
      CROSS JOIN jsonb_array_elements(db.parts) AS item
      WHERE db.id = p_budget_id
      AND item->>'part_id' = ANY(
        SELECT jsonb_array_elements_text(p_approved_parts)
      )
    );
  ELSE
    v_approved_amount := 0;
  END IF;
  
  -- Inserir aprovação
  INSERT INTO budget_approvals (
    budget_id, approval_type, approval_method,
    approved_by_customer, approval_document,
    approved_services, approved_parts, approved_amount,
    approval_notes, rejection_reason,
    registered_by
  ) VALUES (
    p_budget_id, p_approval_type, p_approval_method,
    p_approved_by_customer, p_approval_document,
    p_approved_services, p_approved_parts, v_approved_amount,
    p_approval_notes, p_rejection_reason,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  ) RETURNING id INTO v_approval_id;
  
  -- Atualizar status do orçamento
  UPDATE detailed_budgets
  SET status = v_new_status,
      updated_at = now()
  WHERE id = p_budget_id;
  
  RETURN jsonb_build_object(
    'approval_id', v_approval_id,
    'new_status', v_new_status,
    'approved_amount', v_approved_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket para documentos de aprovação
INSERT INTO storage.buckets (id, name, public)
VALUES ('budget-approvals', 'budget-approvals', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Users can upload approval documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'budget-approvals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view approval documents of their org"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'budget-approvals'
    AND EXISTS (
      SELECT 1 FROM budget_approvals ba
      JOIN detailed_budgets db ON db.id = ba.budget_id
      JOIN orders o ON o.id = db.order_id
      WHERE ba.approval_document->>'file_url' LIKE '%' || (storage.objects.name) || '%'
      AND o.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Registrar Aprovação - ORC-2025-0004-BIELA              [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Cliente: ABC Motors Ltda                                    │
│  Contato: João Silva                                         │
│  Enviado em: 27/01/2025 às 14:35                            │
│  Status: Aguardando aprovação                                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ TIPO DE APROVAÇÃO *                                      ││
│  │                                                          ││
│  │ (•) Aprovação Total                                      ││
│  │     Cliente aprovou todo o orçamento (R$ 932,40)        ││
│  │                                                          ││
│  │ [ ] Aprovação Parcial                                    ││
│  │     Cliente aprovou apenas alguns itens                  ││
│  │                                                          ││
│  │ [ ] Rejeitado                                            ││
│  │     Cliente recusou o orçamento                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ MÉTODO DE APROVAÇÃO *                                    ││
│  │                                                          ││
│  │ [▼ WhatsApp                                  ]           ││
│  │                                                          ││
│  │ Opções:                                                  ││
│  │ • WhatsApp - Print da conversa                           ││
│  │ • Email - Screenshot da confirmação                      ││
│  │ • Assinatura física - Foto digitalizada                  ││
│  │ • Confirmação verbal - Foto/print do registro            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Nome do Aprovador (Cliente): *                              │
│  [João Silva_____________________________]                   │
│                                                               │
│  ┌─ DOCUMENTO COMPROBATÓRIO (OBRIGATÓRIO) ─────────────────┐│
│  │                                                          ││
│  │ 📤 Arraste uma imagem ou clique para selecionar         ││
│  │                                                          ││
│  │ Formatos aceitos: JPEG, JPG, PNG                         ││
│  │ Tamanho máximo: 5 MB                                     ││
│  │                                                          ││
│  │ ℹ️ Para WhatsApp: Tire um print da conversa confirmando││
│  │    a aprovação do orçamento                              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Observações (opcional):                                     │
│  [____________________________________________________________]│
│  [Cliente aprovou via WhatsApp às 15:20.                    ]│
│  [Solicitou início imediato dos serviços                    ]│
│                                                               │
│                      [Cancelar]  [✅ Registrar Aprovação]    │
└─────────────────────────────────────────────────────────────┘

┌─── APROVAÇÃO PARCIAL (quando selecionado) ──────────────────┐
│                                                               │
│  SELECIONE OS ITENS APROVADOS                                │
│                                                               │
│  SERVIÇOS (1 item):                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [✓] SRV-001 - Retífica de bielas          R$ 450,00     ││
│  │     4 horas estimadas                                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  PEÇAS (2 itens):                                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [✓] PCA-1523 - Jogo de bronzinas 0.50mm   R$ 380,00    ││
│  │                                                          ││
│  │ [ ] PCA-2801 - Parafusos de biela         R$  95,00    ││
│  │     ⚠️ Cliente optou por fornecer próprio parafuso      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  RESUMO DA APROVAÇÃO:                                        │
│  • Itens aprovados: 2 de 3                                   │
│  • Valor aprovado: R$ 830,00                                 │
│  • Valor não aprovado: R$ 95,00                              │
│                                                               │
│  💡 Você pode criar novo orçamento com os itens não aprovados│
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─── HISTÓRICO DE APROVAÇÕES ──────────────────────────────────┐
│                                                               │
│  ORC-2025-0004-BIELA                                         │
│                                                               │
│  ✅ APROVAÇÃO REGISTRADA                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Tipo: Aprovação Total                                    ││
│  │ Método: WhatsApp                                         ││
│  │ Aprovado por: João Silva (Cliente)                       ││
│  │ Data/Hora: 27/01/2025 às 15:22                          ││
│  │ Valor aprovado: R$ 932,40                                ││
│  │                                                          ││
│  │ Observações:                                             ││
│  │ Cliente aprovou via WhatsApp às 15:20.                   ││
│  │ Solicitou início imediato dos serviços                   ││
│  │                                                          ││
│  │ Documento:                                               ││
│  │ [📄 whatsapp-aprovacao-27012025.jpg]  [👁️ Visualizar]  ││
│  │                                                          ││
│  │ Registrado por: Carlos Mendes (Gerente)                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Status atual: Aprovado pelo cliente                         │
│  Próximo passo: Aprovação interna e geração de conta a receber│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Aprovação Total Completa
```gherkin
Given que tenho orçamento com status "pending_customer"
When abro modal de aprovação
And seleciono "Aprovação Total"
And seleciono método "WhatsApp"
And preencho nome "João Silva"
And faço upload de imagem válida
And clico em "Registrar Aprovação"
Then aprovação é salva com sucesso
And status muda para "customer_approved"
And documento é armazenado no storage
And histórico exibe a aprovação
```

### E2E Test 2: Validação de Upload Obrigatório
```gherkin
Given que preenchi todos os campos
When não faço upload de documento
And clico em "Registrar Aprovação"
Then erro de validação aparece
And mensagem: "Documento comprobatório é obrigatório"
And formulário não é submetido
```

### E2E Test 3: Validação de Formato de Arquivo
```gherkin
Given que tento fazer upload de PDF
When seleciono arquivo "orcamento.pdf"
Then erro aparece
And mensagem: "Apenas imagens JPEG/JPG/PNG são aceitas"
And upload é recusado
```

### E2E Test 4: Aprovação Parcial com Seleção
```gherkin
Given que seleciono "Aprovação Parcial"
When modal de seleção de itens aparece
And marco 2 de 3 itens
Then valor aprovado é calculado: R$ 830,00
And resumo mostra "2 de 3 itens aprovados"
When registro aprovação
Then sistema salva itens selecionados
And valor parcial é gravado
```

### E2E Test 5: Rejeição com Justificativa
```gherkin
Given que seleciono "Rejeitado"
When campo "Motivo da rejeição" aparece
And não preencho motivo
And tento registrar
Then erro de validação: "Motivo é obrigatório para rejeições"
When preencho motivo "Valor acima do orçado"
And faço upload de documento
And registro
Then status muda para "rejected"
And motivo é salvo
```

### E2E Test 6: Cliente Aprova via Portal Público
```gherkin
Given que cliente acessa link público do orçamento
When clica em "✅ Aprovar Tudo"
And preenche seu nome
And faz upload de documento
And submete formulário
Then aprovação é registrada automaticamente
And gerente recebe notificação
And status é atualizado
```

### E2E Test 7: Histórico de Aprovações
```gherkin
Given que orçamento possui aprovação registrada
When visualizo detalhes do orçamento
Then seção "Histórico de Aprovações" aparece
And mostra todos os dados da aprovação
And botão "Visualizar" abre documento em nova aba
And não permite edição ou exclusão
```

---

## 🚫 Negative Scope

**Não inclui:**
- Assinatura digital eletrônica integrada
- OCR automático de documentos
- Aprovação por múltiplos stakeholders
- Fluxo de aprovação em etapas
- Integração com DocuSign/similar

---

## 🔗 Dependencies

**Blocks:**
- US-ORC-006 (Gerar Conta a Receber)

**Blocked by:**
- US-ORC-004 (Enviar para Aprovação)

**Related:**
- US-EST-007 (Reserva de Estoque após Aprovação)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
