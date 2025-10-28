# US-DASH-005: Sistema de Celebrações e Gamificação

**ID:** US-DASH-005  
**Epic:** Dashboard  
**Sprint:** -  
**Prioridade:** Baixa  
**Estimativa:** -  
**Status:** Implementado ✅

---

## 📋 User Story

**Como** usuário do sistema  
**Quero** ver animações celebratórias ao atingir metas  
**Para** me sentir motivado e engajado

---

## 🎯 Business Objective

Aumentar engajamento e satisfação dos usuários através de feedback visual positivo.

---

## 📐 Business Rules

### RN-DASH-013: Gatilhos de Celebração
```typescript
type CelebrationType =
  | 'approval'      // Orçamento aprovado
  | 'completion'    // OS concluída
  | 'milestone'     // Meta atingida
  | 'achievement';  // Conquista desbloqueada
```

### RN-DASH-014: Animações
- **Confetes**: Partículas coloridas caindo
- **Fogos de artifício**: Explosões na tela
- **Badge**: Medalha aparece e some

### RN-DASH-015: Frequência
- Máximo 1 celebração por minuto (evitar spam)
- Usuário pode desabilitar nas preferências

---

## 🧪 Implementação Atual

**Componente:** `src/components/dashboard/CelebrationAnimations.tsx`  
**Hook:** `src/hooks/useCelebration.ts`  
**Biblioteca:** `framer-motion`, `react-confetti`

### Hook de Celebração
```typescript
const useCelebration = () => {
  const [celebration, setCelebration] = useState({
    show: false,
    type: 'approval'
  });
  
  const triggerCelebration = (type: CelebrationType) => {
    setCelebration({ show: true, type });
    setTimeout(() => hideCelebration(), 3000);
  };
  
  const hideCelebration = () => {
    setCelebration(prev => ({ ...prev, show: false }));
  };
  
  return { celebration, triggerCelebration, hideCelebration };
};
```

### Uso
```tsx
// Ao aprovar orçamento
const handleApprove = async () => {
  await approveBudget(id);
  triggerCelebration('approval');
};
```

---

## ✅ Acceptance Criteria

**AC01:** Animação de confetes ao aprovar orçamento  
**AC02:** Fogos de artifício ao concluir OS  
**AC03:** Badge ao atingir milestone (ex: 100 OS)  
**AC04:** Animação dura 3 segundos e desaparece  
**AC05:** Pode ser desabilitado nas preferências do usuário

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
