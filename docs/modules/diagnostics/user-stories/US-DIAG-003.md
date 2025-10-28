# US-DIAG-003: Upload de Fotos Durante Diagnóstico

**ID:** US-DIAG-003  
**Epic:** Diagnósticos  
**Sprint:** 3  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** técnico  
**Quero** fazer upload de fotos durante o preenchimento do diagnóstico  
**Para** documentar visualmente as condições encontradas nos componentes

---

## 🎯 Business Objective

Criar evidências visuais que suportem o diagnóstico técnico, facilitando aprovação de orçamentos e reduzindo contestações futuras.

---

## 📐 Business Rules

### RN001: Upload de Fotos
**Formatos aceitos:**
- JPG/JPEG
- PNG
- WEBP
- HEIC (converter para JPG server-side)

**Limites:**
- Tamanho máximo por foto: 10MB
- Máximo de fotos por item: 10
- Máximo de fotos por diagnóstico completo: 50

### RN002: Armazenamento
**Supabase Storage:**
```typescript
const storage = {
  bucket: 'diagnostic-photos',
  path: `{org_id}/{order_id}/{component}/{timestamp}_{filename}`,
  isPublic: false, // Requer autenticação
  
  // Exemplo de path completo:
  // abc123/order-uuid/bloco/1706345678_camisa1.jpg
};
```

### RN003: Compressão Automática
```typescript
const compression = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'jpg',
  
  // Se imagem > 1920px, redimensiona mantendo aspect ratio
  // Aplica compressão JPEG quality 80%
};
```

### RN004: Metadados da Foto
```typescript
interface PhotoMetadata {
  id: string;
  url: string;
  filename: string;
  size: number; // bytes
  uploaded_at: Date;
  uploaded_by: string;
  response_item_id: string;
  checklist_item_id: string;
  component: ComponentType;
  metadata: {
    original_filename: string;
    mime_type: string;
    width?: number;
    height?: number;
    camera_model?: string; // EXIF data
    gps_location?: { lat: number; lng: number }; // EXIF data
  };
}
```

### RN005: Preview e Lightbox
- Preview em thumbnail (150x150px)
- Click abre lightbox fullscreen
- Navegação entre fotos com setas
- Zoom in/out
- Download da foto original
- Excluir foto (soft delete)

### RN006: Políticas de Acesso
```sql
-- Storage Policies
CREATE POLICY "Users can view photos of their org orders"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'diagnostic-photos'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Technicians can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'diagnostic-photos'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tecnico', 'gerente', 'admin')
    )
  );

CREATE POLICY "Technicians can delete photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'diagnostic-photos'
    AND (storage.foldername(name))[1] = (SELECT org_id::text FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tecnico', 'gerente', 'admin')
    )
  );
```

---

## ✅ Acceptance Criteria

**AC1:** Upload de múltiplas fotos funciona (drag & drop ou click)  
**AC2:** Fotos são comprimidas automaticamente antes do upload  
**AC3:** Preview em thumbnail aparece após upload  
**AC4:** Click no thumbnail abre lightbox fullscreen  
**AC5:** Botão de excluir remove foto do storage e do array  
**AC6:** Fotos persistem ao salvar rascunho

---

## 🛠️ Definition of Done

- [x] Bucket `diagnostic-photos` criado no Supabase Storage
- [x] Componente `PhotoUpload.tsx` implementado
- [x] Compressão client-side com `browser-image-compression`
- [x] Lightbox implementado
- [x] Storage policies configuradas
- [x] Array de URLs salvo em `diagnostic_response_items.photos`
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/diagnostics/
  ├── ChecklistForm.tsx            (UPDATE - integra photos)
  ├── PhotoUpload.tsx              (NEW)
  └── PhotoLightbox.tsx            (NEW)

src/hooks/
  └── usePhotoUpload.ts            (NEW)
```

---

## 🗄️ Database Changes

```sql
-- Bucket de storage (criar via Supabase Dashboard ou SQL)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('diagnostic-photos', 'diagnostic-photos', false);

-- Políticas de acesso (já documentadas em RN006)

-- Nenhuma alteração em tabelas
-- URLs são armazenadas no array photos da tabela diagnostic_response_items
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Diagnóstico - Bloco                                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  6. Fotos das camisas: (?)                                    │
│     Adicione fotos para documentar visualmente               │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📷 UPLOAD DE FOTOS                                      ││
│  ├─────────────────────────────────────────────────────────┤│
│  │                                                          ││
│  │  [+] Arraste fotos aqui ou clique para selecionar      ││
│  │      (JPG, PNG, WEBP - máx. 10MB por foto)             ││
│  │                                                          ││
│  │  Fotos Enviadas (3/10):                                 ││
│  │                                                          ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐           ││
│  │  │ [IMG]     │  │ [IMG]     │  │ [IMG]     │           ││
│  │  │           │  │           │  │           │           ││
│  │  │ camisa1   │  │ camisa2   │  │ camisa3   │           ││
│  │  │ 2.3 MB    │  │ 1.8 MB    │  │ 3.1 MB    │           ││
│  │  │           │  │           │  │           │           ││
│  │  │ [🔍 Ver]  │  │ [🔍 Ver]  │  │ [🔍 Ver]  │           ││
│  │  │ [🗑️ Del]  │  │ [🗑️ Del]  │  │ [🗑️ Del]  │           ││
│  │  └───────────┘  └───────────┘  └───────────┘           ││
│  │                                                          ││
│  │  [+ Adicionar Mais Fotos]                               ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ LIGHTBOX (ao clicar em Ver) ─────────────────────────┐  │
│  │                                                     [X]│  │
│  │                                                        │  │
│  │     ◀                                              ▶   │  │
│  │                                                        │  │
│  │                   [FOTO FULLSCREEN]                   │  │
│  │                                                        │  │
│  │                                                        │  │
│  │                                                        │  │
│  │  camisa1.jpg - 2.3 MB - Enviada por João Silva       │  │
│  │  27/01/2025 14:35                                     │  │
│  │                                                        │  │
│  │  [🔍+ Zoom] [🔍- Zoom] [⬇️ Download] [🗑️ Excluir]     │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Upload de Foto Única
```gherkin
Given que estou preenchendo diagnóstico
When clico em "Upload de Fotos"
And seleciono 1 foto (camisa1.jpg - 3MB)
Then foto é comprimida para ~1.5MB
And thumbnail aparece na lista
And URL é adicionada ao array photos
```

### E2E Test 2: Upload Múltiplo (Drag & Drop)
```gherkin
Given que estou no campo de fotos
When arrasto 5 fotos para a área de drop
Then todas as 5 fotos são processadas
And thumbnails aparecem
And contador mostra "5/10"
```

### E2E Test 3: Abrir Lightbox
```gherkin
Given que tenho 3 fotos enviadas
When clico em "Ver" na segunda foto
Then lightbox abre em fullscreen
And foto 2 é exibida
And posso navegar com setas ◀ ▶
And posso dar zoom in/out
```

### E2E Test 4: Excluir Foto
```gherkin
Given que tenho 3 fotos enviadas
When clico em "Excluir" na foto 2
Then modal de confirmação aparece
When confirmo exclusão
Then foto é removida do storage
And thumbnail desaparece da lista
And contador atualiza para "2/10"
```

### E2E Test 5: Limite de Fotos
```gherkin
Given que já tenho 10 fotos enviadas
When tento fazer upload de mais 1 foto
Then erro aparece: "Máximo de 10 fotos atingido"
And botão de upload fica desabilitado
```

---

## 🚫 Negative Scope

**Não inclui:**
- Edição de fotos (crop, rotate, filters)
- Anotações sobre as fotos (setas, círculos)
- Reconhecimento automático de defeitos (ML)
- Geolocalização obrigatória

---

## 🔗 Dependencies

**Blocks:**
- US-DIAG-005 (Aprovar Diagnóstico)

**Blocked by:**
- US-DIAG-002 (Responder Diagnóstico)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
