# 📖 Glossário Técnico - ERP Retífica

## 📋 Índice Alfabético
[A](#a) | [B](#b) | [C](#c) | [D](#d) | [E](#e) | [F](#f) | [G](#g) | [H](#h) | [I](#i) | [K](#k) | [L](#l) | [M](#m) | [N](#n) | [O](#o) | [P](#p) | [Q](#q) | [R](#r) | [S](#s) | [T](#t) | [U](#u) | [V](#v) | [W](#w)

---

## A

### API (Application Programming Interface)
Interface de programação que permite comunicação entre diferentes sistemas.  
**Exemplo**: O sistema usa a API do Supabase para acessar o banco de dados.

### Admin
Perfil de usuário com permissões administrativas dentro de uma organização.  
**Ver também**: [Owner](#owner), [Super Admin](#super-admin)

### Apuração Fiscal
Processo de cálculo e consolidação de impostos devidos em um período.  
**Módulo**: Fiscal  
**Exemplo**: Apuração mensal de ICMS, IPI, PIS e COFINS.

### Aprovação de Orçamento
Processo onde o cliente aprova (total, parcial ou rejeita) um orçamento.  
**Tipos**: Total, Parcial, Rejeitado  
**Ver também**: [Orçamento Detalhado](#orçamento-detalhado)

---

## B

### Backend
Parte do sistema que roda no servidor, responsável por lógica de negócio e dados.  
**Tecnologia**: Supabase (PostgreSQL)

### Biela
Componente do motor que conecta o pistão ao virabrequim.  
**Workflow**: Um dos 5 componentes rastreados no Kanban.

### Bloco
Estrutura principal do motor onde os cilindros são usinados.  
**Workflow**: Um dos 5 componentes rastreados no Kanban.

### Budget (Orçamento)
Ver [Orçamento Detalhado](#orçamento-detalhado)

---

## C

### Cabeçote
Componente superior do motor que fecha os cilindros.  
**Workflow**: Um dos 5 componentes rastreados no Kanban.

### Cache
Armazenamento temporário de dados para melhorar performance.  
**Tecnologia**: React Query implementa cache automático.

### CFOP (Código Fiscal de Operações e Prestações)
Código que identifica a natureza de circulação da mercadoria.  
**Módulo**: Fiscal  
**Exemplo**: 5.101 (Venda dentro do estado)

### Checklist de Diagnóstico
Lista de verificações realizadas durante o diagnóstico de um motor.  
**Configurável**: Administradores podem criar checklists personalizados.  
**Ver também**: [Diagnóstico](#diagnóstico)

### Comando de Válvulas
Componente que controla abertura/fechamento das válvulas do motor.  
**Workflow**: Um dos 5 componentes rastreados no Kanban.

### Componente
No contexto de workflow, refere-se às 5 partes principais do motor rastreadas separadamente.  
**Lista**: Bloco, Eixo/Virabrequim, Biela, Comando, Cabeçote

### Contas a Pagar
Valores devidos pela empresa a fornecedores e prestadores de serviço.  
**Módulo**: Financeiro

### Contas a Receber
Valores a receber de clientes por serviços prestados.  
**Módulo**: Financeiro  
**Integração**: Gerado automaticamente após aprovação de orçamento.

### CST (Código de Situação Tributária)
Código que define o tratamento tributário de um produto/serviço.  
**Módulo**: Fiscal  
**Exemplo**: 00 (Tributada integralmente)

---

## D

### Dashboard
Painel principal com visão geral de indicadores e métricas do sistema.  
**Tabs**: Dashboard, Performance, Gamificação, Compras  
**Atualização**: Tempo real via WebSocket

### Diagnóstico
Processo inicial de avaliação do estado do motor e identificação de serviços necessários.  
**Ferramenta**: Checklists configuráveis  
**Resultado**: Lista de serviços recomendados

### DRE (Demonstração do Resultado do Exercício)
Relatório financeiro que mostra receitas, despesas e lucro/prejuízo.  
**Módulo**: Financeiro  
**Periodicidade**: Mensal, Trimestral, Anual

---

## E

### Edge Function
Função serverless que roda no backend (Supabase/Deno).  
**Uso**: Lógica de negócio complexa, integrações externas.

### Eixo / Virabrequim
Componente que converte movimento linear dos pistões em rotação.  
**Workflow**: Um dos 5 componentes rastreados no Kanban.

### Estoque
Inventário de peças e materiais disponíveis.  
**Módulo**: Estoque  
**Funcionalidades**: Movimentações, Reservas, Alertas, Contagens

---

## F

### Fiscal
Módulo relacionado a obrigações tributárias e fiscais.  
**Funcionalidades**: Classificações, Cálculos, Apurações, Obrigações

### Fluxo de Caixa
Registro de entradas e saídas de dinheiro da empresa.  
**Módulo**: Financeiro  
**Tipos**: Realizado, Projetado

### Frontend
Parte visual do sistema com a qual o usuário interage.  
**Tecnologia**: React + TypeScript + TailwindCSS

---

## G

### Gamificação
Sistema de conquistas, pontos e rankings para engajar usuários.  
**Funcionalidades**: Achievements, Levels, Rankings  
**Acesso**: Tab "Gamificação" no dashboard

### Garantia
Período em que a empresa garante o serviço executado.  
**Padrão**: 3 meses (configurável)  
**Geração**: Automática ao finalizar OS

---

## H

### Hook
Função React que permite usar recursos do framework.  
**Exemplos**: useState, useEffect, useQuery  
**Customizados**: useOrders, useDashboard, useAuth

---

## I

### ICMS
Imposto sobre Circulação de Mercadorias e Serviços.  
**Módulo**: Fiscal  
**Âmbito**: Estadual

### IPI
Imposto sobre Produtos Industrializados.  
**Módulo**: Fiscal  
**Âmbito**: Federal

### Inventário
Ver [Estoque](#estoque)

---

## K

### Kanban
Quadro visual que mostra o workflow das ordens de serviço.  
**Colunas**: Representam etapas do processo  
**Cards**: Cada componente de cada OS  
**Ações**: Drag-and-drop para mover entre etapas

### KPI (Key Performance Indicator)
Indicador chave de performance.  
**Exemplos**: Total de OS, Receita, Taxa de Aprovação  
**Dashboard**: Exibidos em cards no topo

---

## L

### Lovable
Plataforma de desenvolvimento onde o sistema é hospedado.  
**Uso**: Frontend, CI/CD automático

---

## M

### Manager (Gerente)
Perfil de usuário com permissões de supervisão e aprovação.  
**Permissões**: Intermediárias entre Admin e Operator

### Mermaid
Linguagem para criar diagramas em markdown.  
**Uso**: Documentação técnica  
**Tipos**: Fluxogramas, Sequências, ER Diagrams

### Metrologia
Etapa do workflow relacionada a medições de precisão.  
**Status**: Uma das 14 etapas possíveis do Kanban

### Modal
Janela sobreposta que aparece sobre o conteúdo principal.  
**Uso**: Formulários, confirmações, detalhes

### Montagem
Etapa final do workflow onde o motor é montado.  
**Status**: Uma das 14 etapas do Kanban

### Motor
Produto principal recebido para retífica.  
**Tipos**: Diesel, Gasolina, Flex  
**Marcas**: Mercedes, Volvo, Scania, MWM, etc.

### Multi-tenancy (Multi-inquilinato)
Arquitetura onde múltiplas organizações compartilham a mesma infraestrutura mas com dados isolados.  
**Isolamento**: Row Level Security (RLS)  
**Seletor**: Dropdown no topo da tela

---

## N

### NCM (Nomenclatura Comum do Mercosul)
Código de classificação fiscal de produtos.  
**Módulo**: Fiscal  
**Formato**: 0000.00.00

### Necessidade de Compra
Registro de peça que precisa ser adquirida.  
**Módulo**: Compras  
**Origem**: Automática (após aprovação de orçamento) ou Manual

### Notificação
Alerta exibido ao usuário sobre eventos importantes.  
**Tipos**: Info, Warning, Error, Success  
**Central**: Ícone de sino no topo da tela

---

## O

### Obrigação Acessória
Declaração ou arquivo que deve ser entregue ao governo.  
**Módulo**: Fiscal  
**Exemplos**: SPED, DCTF, EFD-Contribuições

### Operator (Operador)
Perfil de usuário que executa tarefas operacionais.  
**Permissões**: Criar/editar OS, registrar diagnósticos, movimentar Kanban

### Ordem de Serviço (OS)
Registro de um serviço a ser executado.  
**Número**: Sequencial por ano (ex: OS-2025-0001)  
**Workflow**: Cada OS gera 5 componentes no Kanban

### Organização (Organization)
Empresa/cliente do sistema.  
**Multi-tenancy**: Cada organização tem dados isolados  
**Gestão**: Super Admins gerenciam organizações

### Orçamento Detalhado
Documento com serviços e peças necessários para um serviço.  
**Componentes**: Serviços, Peças, Mão de obra  
**Aprovação**: Total, Parcial ou Rejeitado  
**Integração**: Gera Contas a Receber automaticamente

### Owner (Dono)
Perfil de maior nível dentro de uma organização.  
**Permissões**: Todas dentro da organização  
**Quantidade**: Pode haver múltiplos owners

---

## P

### Peça
Item do estoque usado em serviços.  
**Gestão**: Módulo de Estoque  
**Rastreio**: Movimentações, Reservas, Lote

### Pedido de Compra (PO - Purchase Order)
Documento formal de compra enviado ao fornecedor.  
**Módulo**: Compras  
**Número**: PO-2025-0001 (sequencial)

### Perfil de Usuário
Conjunto de permissões atribuído a usuários.  
**Tipos**: Owner, Admin, Manager, Operator, Viewer  
**Customizável**: Administradores podem criar perfis personalizados

### Performance
Tab do dashboard com métricas de desempenho e metas.  
**Conteúdo**: Ranking, Metas, Tendências

### Permissão
Autorização para executar ação específica no sistema.  
**Granularidade**: Por módulo e ação (read, write, delete)  
**Gestão**: Via Perfis de Usuário

### PIS (Programa de Integração Social)
Contribuição federal sobre receita bruta.  
**Módulo**: Fiscal  
**Cálculo**: Conforme regime tributário

### PostgreSQL
Banco de dados relacional usado no backend.  
**Tecnologia**: Supabase (PostgreSQL gerenciado)

---

## Q

### Query
Consulta ao banco de dados.  
**Tecnologia**: React Query gerencia queries no frontend

---

## R

### RLS (Row Level Security)
Sistema de segurança que filtra dados no nível de linha do banco.  
**Uso**: Isolamento entre organizações  
**Implementação**: Políticas PostgreSQL

### React Query
Biblioteca para gerenciar estado assíncrono (dados do servidor).  
**Funcionalidades**: Cache, refetch automático, invalidação

### Recebimento
Processo de entrada de materiais comprados no estoque.  
**Módulo**: Compras > Recebimento  
**Integração**: Atualiza estoque automaticamente

### Regime Tributário
Sistema de tributação adotado pela empresa.  
**Tipos**: Simples Nacional, Lucro Real, Lucro Presumido  
**Módulo**: Fiscal

### Relatório
Documento gerado com dados consolidados.  
**Formatos**: PDF, Excel  
**Módulos**: Todos possuem relatórios específicos

### Reserva de Peças
Separação de peças para uma OS específica.  
**Momento**: Automática após aprovação de orçamento  
**Módulo**: Estoque

---

## S

### Setor
Departamento ou área da empresa.  
**Exemplos**: Produção, Administrativo, Comercial  
**Uso**: Organizar usuários e permissões

### Simples Nacional
Regime tributário simplificado para pequenas empresas.  
**Módulo**: Fiscal  
**Alíquotas**: Progressivas conforme faturamento

### SPED (Sistema Público de Escrituração Digital)
Conjunto de obrigações fiscais digitais.  
**Módulo**: Fiscal  
**Exemplos**: SPED Fiscal, SPED Contribuições

### Status
Estado atual de um registro.  
**Exemplos OS**: Entrada, Diagnóstico, Orçamento, Produção, Pronto, Entregue  
**Workflow**: Cada componente tem status independente

### Supabase
Plataforma Backend-as-a-Service usada no sistema.  
**Funcionalidades**: Database, Auth, Storage, Realtime, Functions

### Super Admin
Perfil global com acesso a todas as organizações.  
**Uso**: Gestão do sistema completo  
**Quantidade**: Restrito

---

## T

### TailwindCSS
Framework CSS utilitário usado para estilização.  
**Abordagem**: Classes utility-first  
**Tema**: Customizado em `tailwind.config.ts`

### Toast
Notificação temporária que aparece na tela.  
**Uso**: Confirmações, erros, avisos  
**Duração**: 3-5 segundos

### Trigger
Função automática do banco executada em eventos.  
**Uso**: Workflows automáticos, auditorias  
**Exemplo**: Gerar Contas a Receber após aprovação

### TypeScript
Linguagem de programação (JavaScript tipado).  
**Uso**: Todo o código frontend  
**Benefícios**: Type safety, autocomplete

---

## U

### Usinagem
Etapa do workflow onde peças são usinadas em máquinas.  
**Status**: Uma das 14 etapas do Kanban

### Usuário
Pessoa com acesso ao sistema.  
**Atributos**: Nome, E-mail, Perfil, Setor  
**Gestão**: Menu Configurações > Gestão de Usuários

---

## V

### Viewer (Visualizador)
Perfil de usuário com permissão apenas de visualização.  
**Restrições**: Não pode criar, editar ou deletar

### Vite
Ferramenta de build para desenvolvimento frontend.  
**Vantagens**: Hot reload instantâneo, build otimizado

### Virabrequim
Ver [Eixo](#eixo--virabrequim)

---

## W

### WebSocket
Protocolo de comunicação bidirecional em tempo real.  
**Uso**: Atualizar dashboard automaticamente  
**Tecnologia**: Supabase Realtime

### Workflow
Fluxo de trabalho definido para processar ordens de serviço.  
**Representação**: Kanban board  
**Etapas**: Configuráveis (padrão: 14 etapas)  
**Componentes**: 5 (Bloco, Eixo, Biela, Comando, Cabeçote)

---

## 🔗 Ver Também

- [Guia de Início Rápido](./quick-start.md)
- [Blueprint Arquitetural](./system-blueprint.md)
- [FAQ](./faq.md)
- [Fluxos de Usuários](./user-flows/complete-user-journeys.md)

---

**Última Atualização**: 2025-01-14  
**Versão**: 3.0.0
