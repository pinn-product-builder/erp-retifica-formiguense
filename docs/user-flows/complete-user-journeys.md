# 🗺️ Jornadas Completas de Usuários - ERP Retífica

## 📋 Índice
- [Administrador/Owner](#administradorowner)
- [Gerente de Operações](#gerente-de-operações)
- [Técnico/Operador](#técnicooperador)
- [Consultor/Vendedor](#consultorvendedor)
- [Financeiro/Contador](#financeirocontador)

---

## 👑 Administrador/Owner

### Jornada Completa

```mermaid
graph TD
    A[Login] --> B[Selecionar Organização]
    B --> C[Dashboard Executivo]
    C --> D[Configuração Inicial]
    D --> E[Adicionar Usuários]
    E --> F[Configurar Perfis]
    F --> G[Configurar Módulos]
    G --> H[Acompanhamento]
    
    H --> I[Relatórios Executivos]
    H --> J[Gestão de Equipe]
    H --> K[Análise de Performance]
    
    style A fill:#4F46E5
    style C fill:#10B981
    style I fill:#F59E0B
```

### 1. Login e Configuração Inicial
**Ações**: Login → Seleção de org → Dashboard → Configurações  
**Tempo médio**: 15 minutos (primeiro acesso)

### 2. Gestão de Usuários
**Menu**: Configurações > Gestão de Usuários  
**Ações possíveis**:
- Adicionar usuários
- Definir perfis
- Desativar usuários
- Resetar senhas

### 3. Configuração de Módulos
**Menu**: Configurações > Configurações de Operações/Fiscal/Financeiro  
**Configure**: Workflows, impostos, planos de conta

### 4. Relatórios Executivos
**Acesso diário**: Dashboard com KPIs consolidados  
**Relatórios**: DRE, Fluxo de Caixa, Performance Operacional

---

## 🏭 Gerente de Operações

### Jornada Completa

```mermaid
graph TD
    A[Login] --> B[Dashboard Operacional]
    B --> C{Atividade}
    C -->|Monitorar| D[Kanban Board]
    C -->|Aprovar| E[Orçamentos Pendentes]
    C -->|Resolver| F[Checklists Pendentes]
    C -->|Analisar| G[Relatórios]
    
    D --> H[Movimentar Cards]
    D --> I[Alocar Recursos]
    E --> J[Revisar Orçamento]
    E --> K[Aprovar/Rejeitar]
    
    style B fill:#10B981
    style D fill:#3B82F6
```

### Ações Principais
1. **Monitorar Workflow** (50% do tempo)
2. **Aprovar Orçamentos** (20% do tempo)
3. **Resolver Bloqueios** (15% do tempo)
4. **Relatórios** (15% do tempo)

---

## 🔧 Técnico/Operador

### Jornada Completa

```mermaid
graph TD
    A[Login] --> B[Ver Tarefas do Dia]
    B --> C[Recepção de Motor]
    C --> D[Criar OS]
    D --> E[Diagnóstico]
    E --> F[Preencher Checklist]
    F --> G[Gerar Serviços]
    G --> H[Executar Serviços]
    H --> I[Movimentar Kanban]
    I --> J[Registrar Materiais]
    J --> K[Finalizar Componente]
    
    style C fill:#10B981
    style E fill:#F59E0B
    style H fill:#3B82F6
```

### Ciclo Diário Típico
**8h-9h**: Recepção de motores  
**9h-12h**: Diagnósticos  
**13h-17h**: Execução de serviços  
**17h-18h**: Registro de materiais

---

## 💼 Consultor/Vendedor

### Jornada Completa

```mermaid
graph TD
    A[Login] --> B[Dashboard de Vendas]
    B --> C[Gestão de Clientes]
    C --> D[Criar Orçamento]
    D --> E[Enviar para Cliente]
    E --> F{Cliente Responde}
    F -->|Aprova| G[Registrar Aprovação]
    F -->|Negocia| H[Ajustar Orçamento]
    F -->|Rejeita| I[Follow-up]
    G --> J[OS em Produção]
    
    style D fill:#10B981
    style G fill:#3B82F6
```

### KPIs Monitorados
- Taxa de conversão
- Ticket médio
- Orçamentos pendentes
- Tempo de resposta

---

## 💰 Financeiro/Contador

### Jornada Completa

```mermaid
graph TD
    A[Login] --> B[Dashboard Financeiro]
    B --> C[Contas a Receber]
    B --> D[Contas a Pagar]
    B --> E[Fluxo de Caixa]
    B --> F[Apuração Fiscal]
    
    C --> G[Registrar Recebimentos]
    D --> H[Agendar Pagamentos]
    E --> I[Conciliação Bancária]
    F --> J[Calcular Impostos]
    J --> K[Gerar Guias]
    
    style B fill:#10B981
    style F fill:#F59E0B
```

### Rotinas Mensais
**Dia 5**: Fechamento do mês anterior  
**Dia 10**: Apuração fiscal  
**Dia 15**: Pagamento de impostos  
**Dia 20**: Geração de DRE  
**Dia 25**: Conciliação bancária

---

**Última Atualização**: 2025-01-14
