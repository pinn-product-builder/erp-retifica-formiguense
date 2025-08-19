import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';

export const OrganizationSelector: React.FC = () => {
  const {
    currentOrganization,
    userOrganizations,
    loading,
    switchOrganization,
    createOrganization,
  } = useOrganization();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast.error('Nome da organização é obrigatório');
      return;
    }

    setCreating(true);
    try {
      await createOrganization(newOrgName.trim(), newOrgDescription.trim() || undefined);
      toast.success('Organização criada com sucesso');
      setIsCreateDialogOpen(false);
      setNewOrgName('');
      setNewOrgDescription('');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Falha ao criar organização');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        Carregando...
      </div>
    );
  }

  if (userOrganizations.length === 0) {
    return (
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Criar Organização
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Organização</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="orgName">Nome da Organização</Label>
              <Input
                id="orgName"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Nome da sua organização"
              />
            </div>
            <div>
              <Label htmlFor="orgDescription">Descrição (opcional)</Label>
              <Textarea
                id="orgDescription"
                value={newOrgDescription}
                onChange={(e) => setNewOrgDescription(e.target.value)}
                placeholder="Descreva sua organização"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateOrganization} disabled={creating}>
                {creating ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentOrganization?.id || ''}
        onValueChange={switchOrganization}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {currentOrganization?.name || 'Selecionar organização'}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {userOrganizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {org.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Organização</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="orgName">Nome da Organização</Label>
              <Input
                id="orgName"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Nome da sua organização"
              />
            </div>
            <div>
              <Label htmlFor="orgDescription">Descrição (opcional)</Label>
              <Textarea
                id="orgDescription"
                value={newOrgDescription}
                onChange={(e) => setNewOrgDescription(e.target.value)}
                placeholder="Descreva sua organização"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateOrganization} disabled={creating}>
                {creating ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};