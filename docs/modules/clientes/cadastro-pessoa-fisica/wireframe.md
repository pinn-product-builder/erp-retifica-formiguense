# Wireframe: Cadastro de Cliente Pessoa Física

## 🖥️ Desktop View (> 1024px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 🏠 Dashboard > Clientes > Novo Cliente                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ← Voltar para Clientes                                                         │
│                                                                                  │
│  📝 CADASTRAR CLIENTE - PESSOA FÍSICA                                           │
│  ─────────────────────────────────────────────────────────────────────────      │
│                                                                                  │
│  🔹 TIPO DE CLIENTE                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐                              │
│  │ ● Pessoa Física     │  │ ○ Oficina/Revenda   │                              │
│  └─────────────────────┘  └─────────────────────┘                              │
│                                                                                  │
│  🔹 DADOS PESSOAIS                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │ CPF * (obrigatório)                                                     │    │
│  │ [___.___.___-__]  🔍 Validar                                           │    │
│  │ ✓ CPF válido                                                            │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │ Nome Completo *                                                         │    │
│  │ [_________________________________________________________________]    │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌────────────────────────────────────┐  ┌───────────────────────────────┐    │
│  │ Telefone *                          │  │ E-mail (opcional)             │    │
│  │ [(__)_____-____]                   │  │ [_______________________]     │    │
│  └────────────────────────────────────┘  └───────────────────────────────┘    │
│                                                                                  │
│  🔹 ENDEREÇO (OPCIONAL)                                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │ ┌─────────────┐  ┌────────────────────────────────────────────────┐   │    │
│  │ │ CEP          │  │ Logradouro                                      │   │    │
│  │ │ [_____-___] │  │ [_________________________________________]     │   │    │
│  │ └─────────────┘  └────────────────────────────────────────────────┘   │    │
│  │                                                                         │    │
│  │ ┌─────────┐  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │ │ Número   │  │ Complemento     │  │ Bairro        │  │ Cidade        │  │    │
│  │ │ [_____] │  │ [___________]  │  │ [__________]  │  │ [__________]  │  │    │
│  │ └─────────┘  └────────────────┘  └──────────────┘  └──────────────┘  │    │
│  │                                                                         │    │
│  │ ┌────┐                                                                  │    │
│  │ │ UF │  [▼]                                                            │    │
│  │ └────┘                                                                  │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  🔹 OBSERVAÇÕES (OPCIONAL)                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │ [                                                                       ]│    │
│  │ [                                                                       ]│    │
│  │ [                                                                       ]│    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │ * Campos obrigatórios                                                 │      │
│  └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
│                       [   Cancelar   ]  [   Salvar Cliente   ]                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📱 Mobile View (< 768px)

```
┌────────────────────────────────┐
│ ← Novo Cliente PF              │
├────────────────────────────────┤
│                                │
│ 🔹 Tipo de Cliente             │
│ ┌────────────────────────────┐ │
│ │ ● Pessoa Física            │ │
│ │ ○ Oficina                  │ │
│ └────────────────────────────┘ │
│                                │
│ 🔹 Dados Pessoais              │
│ ┌────────────────────────────┐ │
│ │ CPF *                      │ │
│ │ [___.___.___-__]          │ │
│ │ ✓ Válido                   │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ Nome *                     │ │
│ │ [_______________________] │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ Telefone *                 │ │
│ │ [(__)_____-____]          │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ E-mail                     │ │
│ │ [_______________________] │ │
│ └────────────────────────────┘ │
│                                │
│ ▼ Endereço (opcional)          │
│                                │
│ [ Cancelar ]  [ Salvar ]      │
│                                │
└────────────────────────────────┘
```

## 🎨 Componentes UI

### Tipo de Cliente (Radio Group)
```tsx
<RadioGroup value="direto" disabled>
  <RadioGroupItem value="direto" label="Pessoa Física" />
  <RadioGroupItem value="oficina" label="Oficina/Revenda" />
</RadioGroup>
```

### Campo CPF com Validação
```tsx
<FormField
  name="cpf"
  label="CPF *"
  mask="999.999.999-99"
  icon={<Search />}
  validation={validateCPF}
  successMessage="✓ CPF válido"
  errorMessage="CPF inválido"
/>
```

### Campo Telefone
```tsx
<FormField
  name="phone"
  label="Telefone *"
  mask={['(99) 9999-9999', '(99) 99999-9999']}
  placeholder="(00) 00000-0000"
/>
```

### Seção de Endereço (Collapsible)
```tsx
<Collapsible defaultOpen={false}>
  <CollapsibleTrigger>
    📍 Endereço (opcional)
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Campos de endereço */}
  </CollapsibleContent>
</Collapsible>
```

---

## 🎭 Estados da Interface

### Estado: Loading
```
┌──────────────────────────────┐
│ CPF *                        │
│ [___.___.___-__] ⏳          │
│ Validando CPF...             │
└──────────────────────────────┘
```

### Estado: Erro
```
┌──────────────────────────────┐
│ CPF *                        │
│ [123.456.789-10] ❌          │
│ ⚠️ CPF inválido              │
└──────────────────────────────┘
```

### Estado: Sucesso
```
┌──────────────────────────────┐
│ CPF *                        │
│ [123.456.789-09] ✓           │
│ ✓ CPF válido                 │
└──────────────────────────────┘
```

### Estado: Duplicado
```
┌──────────────────────────────┐
│ CPF *                        │
│ [123.456.789-09] ⚠️          │
│ ⚠️ CPF já cadastrado          │
│ [Ver Cliente Existente]      │
└──────────────────────────────┘
```

---

## 🔄 Comportamentos Interativos

### Auto-preenchimento de Endereço via CEP
1. Usuário digita CEP completo
2. Sistema busca endereço via API ViaCEP
3. Preenche automaticamente: logradouro, bairro, cidade, UF
4. Usuário complementa com número e complemento

### Validação em Tempo Real
- **CPF**: Valida ao sair do campo (onBlur)
- **Email**: Valida ao sair do campo
- **Telefone**: Valida ao digitar (onChange)
- **Nome**: Valida ao sair do campo

### Máscaras Automáticas
- CPF: `999.999.999-99`
- Telefone: `(99) 9999-9999` ou `(99) 99999-9999` (adaptável)
- CEP: `99999-999`

---

## ♿ Acessibilidade

- Labels descritivos em todos os campos
- Atributos `aria-required` nos campos obrigatórios
- Atributos `aria-invalid` nos campos com erro
- Mensagens de erro associadas via `aria-describedby`
- Ordem lógica de tabulação (Tab)
- Atalhos de teclado:
  - `Enter` no último campo: salvar
  - `Esc`: cancelar

---

## 📏 Responsividade

| Breakpoint | Layout | Colunas |
|------------|--------|---------|
| < 768px (Mobile) | Single column | 1 |
| 768px - 1024px (Tablet) | Mixed | 2 |
| > 1024px (Desktop) | Grid | 2-3 |

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
