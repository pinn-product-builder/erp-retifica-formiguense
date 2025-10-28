# US-OS-006: Galeria de Fotos e Documentos da OS

**ID:** US-OS-006  
**Epic:** Gestão de Ordens de Serviço  
**Sprint:** 3  
**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Status:** To Do  

---

## 📋 User Story

**Como** técnico ou consultor  
**Quero** fazer upload e visualizar fotos relacionadas a uma ordem de serviço  
**Para** documentar visualmente o estado do motor e componentes

---

## 🎯 Business Objective

Criar registro visual completo de cada OS, facilitando diagnósticos, aprovações de orçamento e resolução de disputas.

---

## 📐 Business Rules

### RN001: Storage Bucket
- **Bucket**: `order-photos`
- **Estrutura de pastas**: `{org_id}/{order_id}/{timestamp}_{filename}`
- **Formatos aceitos**: JPG, JPEG, PNG, WEBP
- **Tamanho máximo**: 5MB por foto
- **Compressão automática**: Imagens > 2MB

### RN002: Metadados da Foto
```typescript
interface OrderPhoto {
  id: string;
  order_id: string;
  uploaded_by: string;
  file_path: string;
  file_name: string;
  file_size: number;
  component?: 'biela' | 'bloco' | 'cabecote' | ... | null;
  workflow_stage?: 'entrada' | 'metrologia' | ... | null;
  description?: string;
  uploaded_at: timestamp;
}
```

### RN003: Upload
- Drag & drop ou clique para selecionar
- Preview imediato antes de enviar
- Seleção de componente relacionado (opcional)
- Seleção de etapa do workflow (opcional)
- Campo de descrição (opcional)
- Upload em lote (máx 10 fotos simultâneas)

### RN004: Visualização
- Grid 4 colunas (Desktop)
- Grid 2 colunas (Tablet)
- Lista 1 coluna (Mobile)
- Miniaturas 200x200px
- Lightbox para visualização ampliada
- Zoom in/out, rotação
- Navegação por setas

### RN005: Filtros
- Por componente
- Por etapa do workflow
- Por data de upload
- Por usuário que fez upload

### RN006: Ações
- Download individual
- Download em lote (ZIP)
- Exclusão (apenas quem fez upload ou admin)
- Editar descrição

### RN007: Permissões (RLS)
```sql
-- Usuários podem ver fotos de OSs da sua organização
CREATE POLICY "Users can view org photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'order-photos' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);

-- Usuários podem fazer upload em OSs da sua org
CREATE POLICY "Users can upload org photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'order-photos' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);

-- Apenas quem fez upload ou admin pode deletar
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'order-photos' AND
  (owner = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
);
```

---

## ✅ Acceptance Criteria

**AC1:** Tab "Fotos" exibe galeria de miniaturas  
**AC2:** Botão "Upload" abre modal de envio  
**AC3:** Drag & drop funcional  
**AC4:** Preview imediato antes de enviar  
**AC5:** Filtros por componente/etapa funcionam  
**AC6:** Lightbox abre ao clicar em miniatura  
**AC7:** Download individual e em lote implementados  
**AC8:** Exclusão com confirmação funcional  
**AC9:** Estado vazio com call-to-action

---

## 🛠️ Definition of Done

- [ ] Componente `OrderPhotosTab.tsx` criado
- [ ] Componente `PhotoUploadModal.tsx` criado
- [ ] Componente `PhotoLightbox.tsx` criado
- [ ] Hook `useOrderPhotos.ts` implementado
- [ ] Storage bucket configurado
- [ ] RLS policies aplicadas
- [ ] Compressão de imagens implementada
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/orders/
  ├── OrderPhotosTab.tsx          (NEW)
  ├── PhotoUploadModal.tsx        (NEW)
  ├── PhotoLightbox.tsx           (NEW)
  └── PhotoGrid.tsx               (NEW)

src/hooks/
  └── useOrderPhotos.ts           (NEW)

src/lib/
  └── imageCompression.ts         (NEW)
```

---

## 🗄️ Database Schema

```sql
-- Tabela de metadados de fotos
CREATE TABLE public.order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  component TEXT CHECK (component IN (
    'biela', 'bloco', 'cabecote', 'comando', 'eixo', 'pistao', 'virabrequim'
  )),
  workflow_stage TEXT CHECK (workflow_stage IN (
    'entrada', 'metrologia', 'usinagem', 'montagem', 'pronto', 'garantia', 'entregue'
  )),
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  org_id UUID NOT NULL
);

-- Indexes
CREATE INDEX idx_order_photos_order ON public.order_photos(order_id);
CREATE INDEX idx_order_photos_component ON public.order_photos(component);
CREATE INDEX idx_order_photos_stage ON public.order_photos(workflow_stage);

-- RLS
ALTER TABLE public.order_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org photos metadata"
ON public.order_photos FOR SELECT
USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Users can insert org photos metadata"
ON public.order_photos FOR INSERT
WITH CHECK (
  org_id = (auth.jwt() ->> 'org_id')::uuid AND
  uploaded_by = auth.uid()
);

CREATE POLICY "Users can delete own photos metadata"
ON public.order_photos FOR DELETE
USING (
  uploaded_by = auth.uid() OR
  auth.jwt() ->> 'role' = 'admin'
);
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Fotos (12)                                   [📤 Upload Fotos]  │
├─────────────────────────────────────────────────────────────────┤
│  Filtros: [Componente ▼] [Etapa ▼] [Data ▼]    [Download Todas] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                       │
│  │ 🖼️   │ │ 🖼️   │ │ 🖼️   │ │ 🖼️   │                       │
│  │ Bloco │ │ Biela │ │Cabec.│ │ Pistão│                       │
│  │ 10/01 │ │ 11/01 │ │ 12/01│ │ 13/01 │                       │
│  └───────┘ └───────┘ └───────┘ └───────┘                       │
│                                                                   │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                       │
│  │ 🖼️   │ │ 🖼️   │ │ 🖼️   │ │ 🖼️   │                       │
│  │ Vira. │ │ Eixo  │ │Comando│ │ Geral │                       │
│  │ 14/01 │ │ 15/01 │ │ 15/01│ │ 16/01 │                       │
│  └───────┘ └───────┘ └───────┘ └───────┘                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

Estado Vazio:
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                      📷                                           │
│                Nenhuma foto cadastrada                            │
│      Adicione fotos para documentar esta ordem de serviço        │
│                                                                   │
│                    [📤 Upload Fotos]                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Upload de Foto
```gherkin
Given que estou na tab "Fotos" de uma OS
When clico em "Upload Fotos"
And seleciono 1 arquivo JPG de 1.5MB
And seleciono componente "Bloco"
And adiciono descrição "Rachadura lateral"
And clico em "Enviar"
Then foto aparece no grid
And toast "Foto enviada com sucesso" é exibido
```

### E2E Test 2: Visualização em Lightbox
```gherkin
Given que há 5 fotos na galeria
When clico na 3ª foto
Then lightbox abre com a imagem ampliada
And posso navegar com setas ← →
And posso dar zoom com scroll
```

### E2E Test 3: Download em Lote
```gherkin
Given que há 12 fotos na galeria
When clico em "Download Todas"
Then arquivo ZIP é baixado
And contém as 12 imagens
```

---

## 🚫 Negative Scope

**Não inclui:**
- Edição de imagens (crop, filtros)
- Reconhecimento automático de componentes (AI)
- Comparação lado a lado de fotos
- Anotações sobre as fotos

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-OS-001 (Criar OS)
- US-OS-004 (Visualizar detalhes)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
