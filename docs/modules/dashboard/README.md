# Módulo de Dashboard

## 📋 Visão Geral

Dashboard central do sistema ERP Retífica, oferecendo visão consolidada de KPIs, orçamentos, ações rápidas e celebrações interativas.

## 🎯 Objetivo

Fornecer aos usuários uma visão em tempo real das principais métricas e permitir acesso rápido às funcionalidades mais utilizadas do sistema.

## 📊 Funcionalidades Principais

### Sistema de Tabs
- **Resumo**: KPIs principais e métricas gerais
- **Orçamentos**: Status de orçamentos pendentes e aprovados
- **Ações Rápidas**: Botões configuráveis para acesso direto

### KPIs Dinâmicos
- Configuráveis via admin
- Cálculo em tempo real
- Cores e ícones personalizáveis
- Ordem de exibição configurável

### Celebrações
- Animações ao atingir metas
- Confetes e feedback visual
- Sistema de gamificação

### Exportação PDF
- Geração de relatório do dashboard
- Inclui todos os KPIs e métricas
- Formato profissional

## 🔗 Integração com Outros Módulos

- **Ordens de Serviço**: Exibe métricas de OS
- **Orçamentos**: Mostra status de aprovação
- **Financeiro**: KPIs financeiros
- **Estoque**: Alertas de estoque baixo

## 🧪 Implementação Atual

**Componente Principal:** `src/pages/Dashboard.tsx`  
**Hooks:** 
- `useDashboard` - Gerenciamento de dados
- `useBreakpoint` - Responsividade
- `useSEO` - Otimização SEO
- `useDashboardPDF` - Geração de PDF
- `useCelebration` - Sistema de celebrações

**Componentes:**
- `DashboardTabs` - Sistema de abas
- `CelebrationAnimations` - Animações de conquista
- `StatCard` - Card de estatística

**Admin:**
- `KPIAdmin` - Configuração de KPIs
- `QuickActionsAdmin` - Configuração de ações rápidas

## 📅 Última Atualização

**Data**: 28/10/2025  
**Status**: ✅ Em Produção
