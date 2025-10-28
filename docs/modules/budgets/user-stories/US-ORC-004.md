# US-ORC-004: Enviar Orçamento para Aprovação do Cliente

**ID:** US-ORC-004  
**Epic:** Orçamentos  
**Sprint:** 4  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente comercial  
**Quero** enviar orçamento para aprovação do cliente  
**Para** formalizar proposta e obter decisão sobre os serviços

---

## 🎯 Business Objective

Estabelecer canal formal de envio e comunicação de orçamentos, garantindo rastreabilidade e comprovação de envio.

---

## 📐 Business Rules

### RN021: Status do Orçamento
**Transição de estados:**
```typescript
type BudgetStatus = 
  | 'draft'              // Rascunho (editável)
  | 'pending_customer'   // Enviado, aguardando cliente
  | 'customer_approved'  // Cliente aprovou
  | 'approved'           // Gerente aprovou (pós-cliente)
  | 'rejected'           // Rejeitado
  | 'revised';           // Em revisão

// Transições permitidas
const transitions = {
  draft: ['pending_customer'],
  pending_customer: ['customer_approved', 'rejected', 'revised'],
  revised: ['pending_customer'],
  customer_approved: ['approved'],
  // approved e rejected são finais
};
```

### RN022: Validações Antes do Envio
**Orçamento deve ter:**
- ✅ Pelo menos 1 serviço OU 1 peça
- ✅ Valor total > R$ 0,00
- ✅ Validade configurada (data futura)
- ✅ Garantia definida
- ✅ Dados do cliente completos

### RN023: Métodos de Envio
```typescript
interface SendMethod {
  type: 'whatsapp' | 'email' | 'print' | 'portal';
  enabled: boolean;
  requiresConfirmation: boolean;
}

const sendMethods = {
  whatsapp: {
    enabled: true,
    requiresConfirmation: true,
    format: 'PDF + link portal'
  },
  email: {
    enabled: true,
    requiresConfirmation: true,
    format: 'PDF attachment + link portal'
  },
  print: {
    enabled: true,
    requiresConfirmation: false,
    format: 'PDF para impressão'
  },
  portal: {
    enabled: true,
    requiresConfirmation: false,
    format: 'Link de acesso público'
  }
};
```

### RN024: Geração de PDF
**Estrutura do PDF:**
1. **Cabeçalho:**
   - Logo da empresa
   - Número do orçamento
   - Data de emissão
   - Validade

2. **Dados do Cliente:**
   - Nome/Razão Social
   - CPF/CNPJ
   - Contato

3. **Dados da OS:**
   - Número da OS
   - Motor/Equipamento
   - Componente orçado

4. **Itens:**
   - Tabela de serviços
   - Tabela de peças
   - Subtotais

5. **Cálculos:**
   - Breakdown completo
   - Total final destacado

6. **Termos:**
   - Validade do orçamento
   - Prazo de garantia
   - Condições de pagamento
   - Observações

7. **Rodapé:**
   - Dados da empresa
   - Formas de contato
   - QR Code (link portal)

### RN025: Portal de Aprovação
**Link público gerado:**
```
https://app.motormanager.com/orcamentos/
  public/{uuid}?token={secure_token}
```

**Funcionalidades do portal:**
- Visualizar orçamento completo
- Aprovar total ou parcialmente
- Rejeitar com justificativa
- Solicitar revisão/negociação
- Chat com atendente (opcional)

### RN026: Registro de Envio
```typescript
interface BudgetSendLog {
  id: string;
  budget_id: string;
  sent_by: string;           // Usuário que enviou
  sent_at: Date;
  method: SendMethod['type'];
  recipient: string;         // Email/telefone
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  pdf_url?: string;          // Link do PDF gerado
  portal_url?: string;       // Link do portal
  notes?: string;
}
```

### RN027: Notificações
**Após envio:**
- Cliente recebe notificação (WhatsApp/Email)
- Gerente recebe confirmação de envio
- Dashboard exibe orçamento como "Pendente"

**Após abertura (se rastreável):**
- Gerente recebe notificação: "Cliente abriu orçamento X"

---

## ✅ Acceptance Criteria

**AC21:** Botão "Enviar para Cliente" aparece após salvar orçamento  
**AC22:** Modal de envio permite escolher método (WhatsApp/Email/Print)  
**AC23:** Sistema valida completude do orçamento antes de enviar  
**AC24:** PDF é gerado automaticamente com layout profissional  
**AC25:** Link do portal público é criado com token seguro  
**AC26:** Status do orçamento muda para "pending_customer"  
**AC27:** Log de envio é registrado com timestamp  
**AC28:** Cliente recebe notificação no método escolhido

---

## 🛠️ Definition of Done

- [ ] Componente `BudgetSendModal.tsx` implementado
- [ ] Hook `useBudgetSend.ts` criado
- [ ] Função de geração de PDF implementada
- [ ] Sistema de links públicos criado
- [ ] Integração WhatsApp configurada
- [ ] Integração Email configurada
- [ ] Tabela `budget_send_logs` criada
- [ ] Portal público implementado
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/budgets/
  ├── BudgetSendModal.tsx          (NEW)
  ├── BudgetPDF.tsx                (NEW)
  └── BudgetPreview.tsx            (NEW)

src/pages/
  └── PublicBudgetView.tsx         (NEW)

src/hooks/
  ├── useBudgetSend.ts             (NEW)
  └── useBudgetPDF.ts              (NEW)

src/lib/
  ├── pdfGenerator.ts              (NEW)
  └── whatsappIntegration.ts       (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela de logs de envio
CREATE TABLE budget_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES detailed_budgets(id) NOT NULL,
  sent_by UUID REFERENCES profiles(id) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  method TEXT NOT NULL CHECK (method IN ('whatsapp', 'email', 'print', 'portal')),
  recipient TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'failed')),
  pdf_url TEXT,
  portal_url TEXT,
  portal_token TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_budget_send_logs_budget ON budget_send_logs(budget_id);
CREATE INDEX idx_budget_send_logs_token ON budget_send_logs(portal_token);

-- RLS
ALTER TABLE budget_send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view send logs of their org budgets"
  ON budget_send_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM detailed_budgets db
      JOIN orders o ON o.id = db.order_id
      WHERE db.id = budget_send_logs.budget_id
      AND o.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create send logs"
  ON budget_send_logs FOR INSERT
  WITH CHECK (
    sent_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM detailed_budgets db
      JOIN orders o ON o.id = db.order_id
      WHERE db.id = budget_send_logs.budget_id
      AND o.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Função para gerar token seguro
CREATE OR REPLACE FUNCTION generate_budget_portal_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Função para registrar envio e mudar status
CREATE OR REPLACE FUNCTION send_budget_to_customer(
  p_budget_id UUID,
  p_method TEXT,
  p_recipient TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_token TEXT;
  v_portal_url TEXT;
  v_log_id UUID;
BEGIN
  -- Gerar token único
  v_token := generate_budget_portal_token();
  v_portal_url := 'https://app.motormanager.com/orcamentos/public/' || 
                  p_budget_id::TEXT || '?token=' || v_token;
  
  -- Inserir log de envio
  INSERT INTO budget_send_logs (
    budget_id, sent_by, method, recipient, 
    portal_token, portal_url, notes
  ) VALUES (
    p_budget_id, auth.uid(), p_method, p_recipient,
    v_token, v_portal_url, p_notes
  ) RETURNING id INTO v_log_id;
  
  -- Atualizar status do orçamento
  UPDATE detailed_budgets
  SET status = 'pending_customer',
      updated_at = now()
  WHERE id = p_budget_id;
  
  -- Retornar dados do envio
  RETURN jsonb_build_object(
    'log_id', v_log_id,
    'portal_url', v_portal_url,
    'token', v_token,
    'sent_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View pública para visualização do orçamento (sem RLS)
CREATE OR REPLACE VIEW public_budget_view AS
SELECT 
  db.id,
  db.budget_number,
  db.component,
  db.services,
  db.parts,
  db.subtotal,
  db.discount_percentage,
  db.discount_amount,
  db.tax_percentage,
  db.tax_amount,
  db.total,
  db.warranty_months,
  db.notes,
  db.valid_until,
  db.created_at,
  o.order_number,
  c.name AS customer_name,
  org.name AS org_name,
  org.cnpj AS org_cnpj,
  org.logo_url AS org_logo
FROM detailed_budgets db
JOIN orders o ON o.id = db.order_id
JOIN customers c ON c.id = o.customer_id
JOIN organizations org ON org.id = o.org_id
WHERE db.status IN ('pending_customer', 'customer_approved', 'approved');

-- Permissão pública na view
GRANT SELECT ON public_budget_view TO anon;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Enviar Orçamento ORC-2025-0004-BIELA                   [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ Orçamento pronto para envio                              │
│                                                               │
│  Cliente: ABC Motors Ltda                                    │
│  Contato: João Silva                                         │
│  Email: joao@abcmotors.com                                   │
│  WhatsApp: (11) 98765-4321                                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ SELECIONE O MÉTODO DE ENVIO                              ││
│  │                                                          ││
│  │ (•) WhatsApp                                             ││
│  │     Enviar PDF + link do portal via WhatsApp            ││
│  │     Para: (11) 98765-4321                                ││
│  │                                                          ││
│  │ [ ] Email                                                ││
│  │     Enviar PDF anexo + link do portal via email         ││
│  │     Para: joao@abcmotors.com                            ││
│  │                                                          ││
│  │ [ ] Gerar PDF para Impressão                             ││
│  │     Baixar PDF para entrega presencial                   ││
│  │                                                          ││
│  │ [ ] Apenas Link do Portal                                ││
│  │     Copiar link de acesso público                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Mensagem personalizada (opcional):                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Olá João,                                                ││
│  │                                                          ││
│  │ Segue o orçamento detalhado para retífica da biela     ││
│  │ do motor OM 906.                                        ││
│  │                                                          ││
│  │ Qualquer dúvida, estou à disposição.                     ││
│  │                                                          ││
│  │ Atenciosamente,                                          ││
│  │ Equipe ABC Retífica                                      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  📄 PRÉVIA DO ORÇAMENTO                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [Thumbnail do PDF]                                       ││
│  │                                                          ││
│  │ • Total de itens: 3                                      ││
│  │ • Valor total: R$ 932,40                                 ││
│  │ • Validade: 27/02/2025 (30 dias)                         ││
│  │ • Garantia: 6 meses                                      ││
│  │                                                          ││
│  │ [👁️ Visualizar PDF Completo]                            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  [ ] Notificar-me quando cliente abrir o orçamento          │
│                                                               │
│                            [Cancelar]  [📤 Enviar Orçamento] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ✅ Orçamento Enviado com Sucesso!                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  O orçamento ORC-2025-0004-BIELA foi enviado via WhatsApp   │
│  para João Silva em 27/01/2025 às 14:35.                    │
│                                                               │
│  📱 Link do Portal (compartilhável):                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ https://app.motormanager.com/orcamentos/                ││
│  │ public/a1b2c3d4-e5f6-7890?token=xyz...                  ││
│  │                                                          ││
│  │ [📋 Copiar Link]  [📱 Enviar via WhatsApp]              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  🔔 Você será notificado quando:                             │
│  • Cliente abrir o orçamento                                 │
│  • Cliente aprovar/rejeitar                                  │
│  • Orçamento estiver próximo do vencimento                   │
│                                                               │
│  Status: Aguardando aprovação do cliente                     │
│                                                               │
│                        [Fechar]  [Ver Dashboard de Orçamentos]│
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Enviar via WhatsApp
```gherkin
Given que tenho orçamento completo
When clico em "Enviar para Cliente"
And seleciono método "WhatsApp"
And clico em "Enviar Orçamento"
Then PDF é gerado automaticamente
And link do portal é criado
And mensagem WhatsApp é preparada
And status muda para "pending_customer"
And log de envio é registrado
```

### E2E Test 2: Validação de Orçamento Incompleto
```gherkin
Given que tenho orçamento sem itens
When clico em "Enviar para Cliente"
Then erro de validação aparece
And mensagem lista problemas:
  - "Adicione pelo menos 1 serviço ou peça"
  - "Valor total deve ser maior que R$ 0,00"
And envio é bloqueado
```

### E2E Test 3: Gerar PDF para Impressão
```gherkin
Given que seleciono método "Gerar PDF"
When clico em "Enviar Orçamento"
Then PDF é baixado localmente
And status permanece "draft"
And log registra envio como "print"
```

### E2E Test 4: Portal Público Acessível
```gherkin
Given que orçamento foi enviado
When acesso link público sem login
Then visualizo orçamento completo
And vejo botões de "Aprovar" e "Rejeitar"
And não vejo informações sensíveis da empresa
```

### E2E Test 5: Notificação de Abertura
```gherkin
Given que marquei "Notificar-me quando abrir"
When cliente acessa link do portal
Then gerente recebe notificação in-app
And email de notificação é enviado (se configurado)
And log de envio muda status para "opened"
```

### E2E Test 6: Mensagem Personalizada
```gherkin
Given que preencho mensagem personalizada
When envio orçamento via WhatsApp
Then mensagem customizada aparece na conversa
And link do portal é incluído automaticamente
```

---

## 🚫 Negative Scope

**Não inclui:**
- Assinatura digital do orçamento
- Negociação inline no portal
- Chat ao vivo integrado
- Múltiplos idiomas no PDF
- Personalização avançada do template PDF

---

## 🔗 Dependencies

**Blocks:**
- US-ORC-005 (Registrar Aprovação)

**Blocked by:**
- US-ORC-003 (Cálculos)

**Related:**
- US-INT-002 (Integração WhatsApp Business)
- US-INT-003 (Envio de Emails)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
