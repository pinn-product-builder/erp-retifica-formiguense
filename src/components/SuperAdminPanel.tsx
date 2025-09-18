import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSuperAdmin, useSuperAdminActions } from '@/hooks/useSuperAdmin';
import { usePermissions } from '@/hooks/usePermissions';
import { Building2, Users, Plus, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  organization_users: Array<{
    id: string;
    user_id: string;
    role: string;
    profiles: {
      name: string;
    };
  }>;
}

export function SuperAdminPanel() {
  const { isSuperAdmin, loading } = useSuperAdmin();
  const { canCreateOrganizations, canViewAllOrganizations } = usePermissions();
  const { getAllOrganizations } = useSuperAdminActions();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (isSuperAdmin && canViewAllOrganizations()) {
      loadOrganizations();
    }
  }, [isSuperAdmin, canViewAllOrganizations]);

  const loadOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const orgs = await getAllOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast.error('Nome da organização é obrigatório');
      return;
    }

    try {
      // Aqui você integraria com o contexto de organização
      // const org = await createOrganization(newOrgName, newOrgDescription);
      toast.success('Organização criada com sucesso!');
      setNewOrgName('');
      setNewOrgDescription('');
      setCreateDialogOpen(false);
      loadOrganizations();
    } catch (error: any) {
      toast.error('Erro ao criar organização: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
            <span>Acesso restrito a super administradores</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel Super Admin</h1>
          <p className="text-muted-foreground">
            Gerencie todas as organizações e usuários do sistema
          </p>
        </div>
        <Badge variant="destructive" className="flex items-center space-x-1">
          <Shield className="h-3 w-3" />
          <span>Super Admin</span>
        </Badge>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{organizations.length}</p>
                <p className="text-sm text-muted-foreground">Organizações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {organizations.reduce((acc, org) => acc + org.organization_users.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Usuários Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ações Rápidas</p>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!canCreateOrganizations()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Org
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Organização</DialogTitle>
                    <DialogDescription>
                      Crie uma nova organização no sistema. O primeiro usuário adicionado será o proprietário.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="org-name">Nome da Organização</Label>
                      <Input
                        id="org-name"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        placeholder="Ex: Retífica ABC Ltda"
                      />
                    </div>
                    <div>
                      <Label htmlFor="org-description">Descrição (opcional)</Label>
                      <Input
                        id="org-description"
                        value={newOrgDescription}
                        onChange={(e) => setNewOrgDescription(e.target.value)}
                        placeholder="Descrição da organização"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateOrganization}>
                      Criar Organização
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Organizações */}
      <Card>
        <CardHeader>
          <CardTitle>Organizações</CardTitle>
          <CardDescription>
            Todas as organizações cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOrgs ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma organização encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{org.name}</h3>
                    {org.description && (
                      <p className="text-sm text-muted-foreground">{org.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline">
                        {org.organization_users.length} usuários
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Criada em {new Date(org.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      Gerenciar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
