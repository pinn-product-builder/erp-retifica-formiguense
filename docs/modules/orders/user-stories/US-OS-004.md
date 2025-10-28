# US-OS-004: Visualizar Detalhes Completos da Ordem de Serviço

**ID:** US-OS-004  
**Epic:** Gestão de Ordens de Serviço  
**Sprint:** 1  
**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** usuário do sistema  
**Quero** visualizar todos os detalhes de uma ordem de serviço em uma interface organizada por abas  
**Para** ter acesso completo às informações e acompanhar o progresso

---

## 🎯 Business Objective

Centralizar todas as informações relacionadas a uma OS em uma única interface intuitiva, facilitando o acompanhamento e tomada de decisões.

---

## 📐 Business Rules

### RN001: Estrutura de Abas
- **Detalhes**: Informações gerais, dados do motor, ações rápidas
- **Timeline**: Histórico cronológico de eventos
- **Fotos**: Galeria de imagens do motor/componentes
- **Materiais**: Peças aplicadas e rastreabilidade
- **Garantia**: Informações de cobertura e prazos

### RN002: Informações no Header
- Número da OS (destaque)
- Nome do cliente
- Status badge com cores dinâmicas
- Botões: Editar, Imprimir, Voltar

### RN003: Tab "Detalhes" - Dados Exibidos
**Informações Principais (Grid 2 colunas):**
- Cliente
- Consultor Responsável
- Data de Coleta
- Local de Coleta
- Motorista
- Prazo de Entrega
- Status Atual

**Dados do Motor:**
- Marca / Modelo
- Tipo de Motor
- Número de Série
- Estado de Montagem
- Componentes Presentes (visual com ícones)

**Ações Rápidas:**
- Avançar Workflow
- Registrar Diagnóstico
- Gerar Orçamento
- Agendar Entrega

### RN004: Visibilidade por Perfil
- **Consultores**: Veem apenas OSs de seus clientes
- **Gerentes**: Veem todas as OSs
- **Técnicos**: Veem OSs com tarefas atribuídas a eles
- **Admins**: Acesso irrestrito

---

## ✅ Acceptance Criteria

**AC1:** Header exibe número, cliente, status e botões de ação  
**AC2:** Tabs navigation funcional (Detalhes, Timeline, Fotos, Materiais, Garantia)  
**AC3:** Tab "Detalhes" carrega informações gerais e do motor  
**AC4:** Componentes presentes exibidos com checkboxes visuais  
**AC5:** Ações rápidas habilitadas conforme status da OS  
**AC6:** Responsivo (Desktop, Tablet, Mobile)  
**AC7:** Loading state enquanto carrega dados  
**AC8:** Error state se falhar carregamento

---

## 🛠️ Definition of Done

- [x] Componente `OrderDetails.tsx` criado
- [x] Hook `useOrderDetails.ts` implementado
- [x] Tabs component do Shadcn/ui integrado
- [x] Query Supabase com joins (orders + engines + customers)
- [x] RLS policies testadas
- [x] Rotas configuradas (`/orders/:id`)
- [x] Estados loading/error/empty tratados
- [x] Testes E2E escritos
- [x] Wireframes completos

---

## 📁 Affected Components

```
src/pages/
  └── OrderDetails.tsx            (EXISTS)

src/components/orders/
  ├── OrderHeader.tsx             (EXISTS)
  ├── OrderDetailsTab.tsx         (EXISTS)
  ├── OrderTimelineTab.tsx        (EXISTS - US-OS-005)
  ├── OrderPhotosTab.tsx          (EXISTS - US-OS-006)
  ├── OrderMaterialsTab.tsx       (EXISTS - US-OS-008)
  └── OrderWarrantyTab.tsx        (EXISTS - US-OS-007)

src/hooks/
  └── useOrderDetails.ts          (EXISTS)
```

---

## 🗄️ Database Query

```typescript
// Hook useOrderDetails.ts
const { data: order, isLoading, error } = useQuery({
  queryKey: ['order', orderId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          id,
          name,
          document,
          phone,
          email
        ),
        engines (
          id,
          brand,
          model,
          engine_type,
          serial_number,
          assembly_state,
          required_components
        ),
        order_workflow (
          id,
          component,
          stage,
          assigned_to,
          started_at,
          completed_at
        ),
        profiles!orders_created_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }
});
```

---

## 🎨 Wireframe

Ver arquivo: `proj_docs/modules/operations/wireframes/order-details.md`

---

## 🧪 Test Scenarios

### E2E Test 1: Visualização Completa
```gherkin
Given que estou logado como gerente
When navego para "/orders/uuid-123"
Then vejo o header com número da OS e cliente
And tab "Detalhes" está ativa por padrão
And informações gerais e do motor são exibidas
And ações rápidas estão visíveis
```

### E2E Test 2: Navegação entre Tabs
```gherkin
Given que estou visualizando uma OS
When clico na tab "Timeline"
Then conteúdo da tab muda para histórico
And URL permanece "/orders/uuid-123"
```

### E2E Test 3: Permissão de Acesso
```gherkin
Given que estou logado como consultor
When tento acessar OS de outro consultor
Then vejo mensagem "Acesso negado"
And sou redirecionado para "/orders"
```

---

## 🚫 Negative Scope

**Não inclui:**
- Edição inline de dados (ver US-OS-003)
- Upload de fotos (ver US-OS-006)
- Aplicação de materiais (ver US-OS-008)
- Geração de PDF (ver US-OS-010)

---

## 🔗 Dependencies

**Blocks:**
- US-OS-003 (Editar OS)
- US-OS-005 (Timeline)
- US-OS-006 (Fotos)
- US-OS-007 (Garantia)
- US-OS-008 (Materiais)

**Blocked by:**
- US-OS-001 (Criar OS)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
