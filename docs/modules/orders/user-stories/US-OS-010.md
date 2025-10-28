# US-OS-010: Exportar/Imprimir OS em PDF

**ID:** US-OS-010  
**Epic:** Gestão de Ordens de Serviço  
**Sprint:** 3  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** usuário do sistema  
**Quero** exportar uma ordem de serviço em PDF  
**Para** imprimir, arquivar ou enviar ao cliente

---

## 🎯 Business Objective

Permitir geração de documento impresso da OS com todas as informações relevantes, facilitando comunicação com cliente e arquivamento físico.

---

## 📐 Business Rules

### RN001: Informações no PDF
**Cabeçalho:**
- Número da OS (destaque)
- Data de criação
- Status atual
- Prioridade

**Dados Gerais:**
- Cliente (nome, documento, telefone, e-mail)
- Consultor responsável
- Data de coleta
- Local de coleta
- Motorista
- Prazo de entrega

**Dados do Motor:**
- Marca / Modelo
- Tipo de motor
- Número de série
- Estado de montagem
- Componentes presentes

**Materiais Aplicados (se houver):**
- Tabela com código, nome, quantidade, valor unitário e total

**Rodapé:**
- Data/hora de geração
- Usuário que gerou
- Assinaturas (cliente e responsável)

### RN002: Layout
- Formato A4 (210mm x 297mm)
- Margens: 20mm
- Logo da empresa no cabeçalho
- Fonte legível (mínimo 10pt)
- Quebra de página automática se necessário

### RN003: Gatilhos de Geração
- Botão "Imprimir" no header do OrderDetails
- Atalho de teclado: Ctrl+P (abre pré-visualização)
- Geração automática ao finalizar OS

### RN004: Permissões
- Todos os perfis podem gerar PDF de OSs que têm acesso

---

## ✅ Acceptance Criteria

**AC1:** Botão "Imprimir" visível no header do OrderDetails  
**AC2:** Click abre pré-visualização de impressão do navegador  
**AC3:** Layout otimizado para impressão (@media print)  
**AC4:** Quebra de página correta em OSs longas  
**AC5:** Logo da empresa aparece no cabeçalho  
**AC6:** Todas as informações estão legíveis e organizadas

---

## 🛠️ Definition of Done

- [x] Componente `OrderPrintView.tsx` criado
- [x] CSS @media print configurado
- [x] Botão "Imprimir" integrado no OrderDetails
- [x] Função `window.print()` implementada
- [x] Layout testado em Chrome, Firefox e Safari
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/orders/
  ├── OrderPrintView.tsx          (EXISTS)
  └── OrderDetails.tsx            (UPDATE - botão imprimir)

src/styles/
  └── print.css                   (NEW - estilos de impressão)
```

---

## 🗄️ Database Changes

```sql
-- Nenhuma alteração necessária
-- Utiliza consultas existentes de visualização de OS
```

---

## 🎨 Wireframe

```
┌───────────────────────────────────────────────────────────┐
│  [LOGO EMPRESA]                         OS #1234           │
│                                     Criada em: 15/01/2025  │
│                                     Status: Em Produção    │
│                                     Prioridade: Alta       │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  DADOS GERAIS                                               │
│  ─────────────────────────────────────────────────────     │
│  Cliente:          ABC Motors Ltda                         │
│  Documento:        12.345.678/0001-90                      │
│  Telefone:         (11) 98765-4321                         │
│  E-mail:           contato@abcmotors.com.br                │
│                                                             │
│  Consultor:        João Silva                              │
│  Data de Coleta:   10/01/2025                              │
│  Local de Coleta:  Av. Paulista, 1000 - São Paulo/SP      │
│  Motorista:        Carlos Santos                          │
│  Prazo de Entrega: 30/01/2025                             │
│                                                             │
│  DADOS DO MOTOR                                             │
│  ─────────────────────────────────────────────────────     │
│  Marca:            Mercedes-Benz                           │
│  Modelo:           OM 906                                  │
│  Tipo:             6 cilindros em linha                    │
│  Série:            906985C1234567                          │
│  Estado:           Completo                                │
│                                                             │
│  Componentes: ✅ Bloco ✅ Cabeçote ✅ Virabrequim ✅ Biela │
│                                                             │
│  MATERIAIS APLICADOS                                        │
│  ─────────────────────────────────────────────────────     │
│  Cód.     Descrição              Qtd    Unit.    Total    │
│  ────────────────────────────────────────────────────     │
│  P001     Jogo de pistões         6    R$ 250   R$ 1.500 │
│  P002     Anéis segmento          6    R$  80   R$  480  │
│  P003     Bronzinas biela        12    R$ 150   R$ 1.800 │
│                                           Total: R$ 3.780 │
│                                                             │
├───────────────────────────────────────────────────────────┤
│  _______________________    _______________________        │
│  Assinatura Cliente          Responsável Técnico          │
│                                                             │
│  Gerado em: 27/01/2025 14:35 por João Silva               │
└───────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Imprimir OS Completa
```gherkin
Given que estou visualizando a OS #1234
When clico no botão "Imprimir"
Then pré-visualização de impressão abre
And layout está otimizado para A4
And todas as seções estão visíveis
And quebra de página está correta
```

### E2E Test 2: Imprimir OS sem Materiais
```gherkin
Given que estou visualizando OS sem materiais aplicados
When clico em "Imprimir"
Then seção "Materiais Aplicados" não aparece no PDF
And layout permanece consistente
```

### E2E Test 3: Atalho de Teclado
```gherkin
Given que estou em OrderDetails
When pressiono Ctrl+P
Then pré-visualização de impressão abre
And comportamento é idêntico ao botão "Imprimir"
```

---

## 🚫 Negative Scope

**Não inclui:**
- Geração de PDF server-side (usa window.print)
- Envio automático de e-mail com PDF
- Download direto de PDF (apenas impressão)
- Personalização de template pelo usuário

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-OS-004 (Visualizar detalhes)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
