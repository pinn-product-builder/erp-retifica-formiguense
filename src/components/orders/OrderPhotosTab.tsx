import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Trash2, Eye, Plus, Loader2 } from 'lucide-react';
import { useOrderPhotos } from '@/hooks/useOrderPhotos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderPhotosTabProps {
  orderId: string;
}

const PHOTO_TYPES = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'metrologia', label: 'Metrologia' },
  { value: 'usinagem', label: 'Usinagem' },
  { value: 'montagem', label: 'Montagem' },
  { value: 'teste', label: 'Teste' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'defeito', label: 'Defeito' },
  { value: 'outros', label: 'Outros' }
];

const COMPONENTS = [
  { value: 'bloco', label: 'Bloco' },
  { value: 'eixo', label: 'Eixo' },
  { value: 'biela', label: 'Biela' },
  { value: 'comando', label: 'Comando' },
  { value: 'cabecote', label: 'Cabeçote' }
];

export function OrderPhotosTab({ orderId }: OrderPhotosTabProps) {
  const { photos, loading, uploadPhoto, deletePhoto } = useOrderPhotos(orderId);
  const [selectedPhoto, setSelectedPhoto] = useState<unknown>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    photoType: '',
    component: '',
    description: ''
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadData(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.photoType) return;

    const success = await uploadPhoto(
      uploadData.file,
      uploadData.photoType,
      uploadData.component || undefined,
      undefined,
      uploadData.description || undefined
    );

    if (success) {
      setShowUploadDialog(false);
      setUploadData({
        file: null,
        photoType: '',
        component: '',
        description: ''
      });
    }
  };

  const handleDelete = async (photoId: string) => {
    if (confirm('Tem certeza que deseja remover esta foto?')) {
      await deletePhoto(photoId);
    }
  };

  const getPhotoTypeLabel = (type: string) => {
    return PHOTO_TYPES.find(pt => pt.value === type)?.label || type;
  };

  const getComponentLabel = (component: string | null) => {
    if (!component) return null;
    return COMPONENTS.find(c => c.value === component)?.label || component;
  };

  if (loading && photos.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando fotos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botão de upload */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Fotos da Ordem de Serviço</h3>
          <p className="text-sm text-muted-foreground">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'} encontrada{photos.length === 1 ? '' : 's'}
          </p>
        </div>
        
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Foto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Nova Foto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Arquivo</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>
              
              <div>
                <Label htmlFor="photoType">Tipo da Foto</Label>
                <Select value={uploadData.photoType} onValueChange={(value) => 
                  setUploadData(prev => ({ ...prev, photoType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PHOTO_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="component">Componente (Opcional)</Label>
                <Select value={uploadData.component} onValueChange={(value) => 
                  setUploadData(prev => ({ ...prev, component: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o componente" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPONENTS.map(component => (
                      <SelectItem key={component.value} value={component.value}>
                        {component.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva a foto..."
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!uploadData.file || !uploadData.photoType || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de fotos */}
      {photos.length === 0 ? (
        <div className="text-center py-8">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma foto encontrada</h3>
          <p className="text-muted-foreground mb-4">
            Adicione fotos para documentar o progresso da ordem de serviço.
          </p>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeira Foto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="border rounded-lg overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt={photo.file_name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(photo.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {getPhotoTypeLabel(photo.photo_type)}
                  </Badge>
                  {photo.component && (
                    <Badge variant="secondary">
                      {getComponentLabel(photo.component)}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm font-medium truncate">{photo.file_name}</p>
                
                {photo.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {photo.description}
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {format(new Date(photo.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de visualização */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedPhoto.file_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedPhoto.url && (
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.file_name}
                  className="w-full max-h-96 object-contain rounded"
                />
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Tipo:</strong> {getPhotoTypeLabel(selectedPhoto.photo_type)}
                </div>
                {selectedPhoto.component && (
                  <div>
                    <strong>Componente:</strong> {getComponentLabel(selectedPhoto.component)}
                  </div>
                )}
                <div>
                  <strong>Data:</strong> {format(new Date(selectedPhoto.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
                {selectedPhoto.uploaded_by && (
                  <div>
                    <strong>Enviado por:</strong> {selectedPhoto.uploaded_by}
                  </div>
                )}
              </div>
              
              {selectedPhoto.description && (
                <div>
                  <strong>Descrição:</strong>
                  <p className="mt-1 text-muted-foreground">{selectedPhoto.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
