import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { toast } from 'sonner';
import { 
  Users, 
  Building2, 
  UserPlus, 
  Shield, 
  Search, 
  MoreHorizontal,
  UserX,
  Crown,
  Link as LinkIcon,
  Unlink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';

// Constantes de cores padronizadas
const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-red-100 text-red-800 border-red-200',
  manager: 'bg-blue-100 text-blue-800 border-blue-200',
  user: 'bg-green-100 text-green-800 border-green-200'
};

const ROLE_LABELS = {
  owner: 'Proprietário',
  admin: 'Administrador', 
  manager: 'Gerente',
  user: 'Usuário'
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'owner': return <Crown className="h-3 w-3" />;
    case 'admin': return <Shield className="h-3 w-3" />;
    case 'manager': return <Users className="h-3 w-3" />;
    default: return <Users className="h-3 w-3" />;
  }
};

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  created_by: string;
  _count?: {
    users: number;
  };
}

interface UserWithOrganizations {
  id: string;
  email: string;
  created_at: string;
  is_super_admin: boolean;
  user_basic_info?: {
    name?: string;
  }[];
  organizations: {
    organization_id: string;
    role: string;
    is_active: boolean;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
}

interface UserOrgLinkForm {
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'manager' | 'user';
}

const SuperAdmin: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();
  
  const [users, setUsers] = useState<UserWithOrganizations[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOrgs, setTotalOrgs] = useState(0);
  const pageSize = 10;
  
  // Estados para vincular usuário a organização
  const [linkUserOrgDialog, setLinkUserOrgDialog] = useState(false);
  const [linkForm, setLinkForm] = useState<UserOrgLinkForm>({
    userId: '',
    organizationId: '',
    role: 'user'
  });
  const [linkLoading, setLinkLoading] = useState(false);

  const fetchUsers = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      
      // Primeiro, contar o total de usuários únicos
      const { count: totalCount, error: countError } = await supabase
        .from('organization_users')
        .select('user_id', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      // Buscar usuários com paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data: allUsers, error: usersError } = await supabase
        .from('organization_users')
        .select(`
          user_id,
          organization_id,
          role,
          is_active,
          created_at,
          organizations (
            id,
            name,
            slug
          )
        `)
        .range(from, to)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      
      setTotalUsers(totalCount || 0);

      // Buscar user_basic_info para todos os usuários
      const { data: basicInfo, error: basicInfoError } = await supabase
        .from('user_basic_info')
        .select('user_id, name, email, created_at');

      if (basicInfoError) {
        console.warn('Error fetching user basic info:', basicInfoError);
      }

      // Buscar informações de super admins usando RPC
      const { data: superAdmins, error: superAdminError } = await supabase.rpc('get_all_super_admins');
      const superAdminIds = superAdmins?.map(admin => admin.user_id) || [];

      if (superAdminError) {
        console.warn('Error fetching super admins:', superAdminError);
      }

      // Combinar dados
      const usersMap = new Map<string, UserWithOrganizations>();

      // Criar lista única de user_ids
      const allUserIds = [...new Set(allUsers?.map(u => u.user_id) || [])];

      // Inicializar usuários com dados básicos
      allUserIds.forEach(userId => {
        const userBasicInfo = basicInfo?.find(bi => bi.user_id === userId);
        const isSuperAdmin = superAdminIds.includes(userId);
        
        usersMap.set(userId, {
          id: userId,
          email: userBasicInfo?.email || `user_${userId.substring(0, 8)}@temp.com`,
          created_at: userBasicInfo?.created_at || new Date().toISOString(),
          is_super_admin: isSuperAdmin,
          user_basic_info: userBasicInfo ? [{ name: userBasicInfo.name }] : [],
          organizations: []
        });
      });

      // Adicionar organizações aos usuários
      allUsers?.forEach(orgUser => {
        const user = usersMap.get(orgUser.user_id);
        if (user && orgUser.organizations) {
          user.organizations.push({
            organization_id: orgUser.organization_id,
            role: orgUser.role,
            is_active: orgUser.is_active,
            organization: orgUser.organizations
          });
        }
      });

      setUsers(Array.from(usersMap.values()));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          description,
          created_at,
          created_by
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Erro ao carregar organizações');
    }
  };

  const handleLinkUserToOrganization = async () => {
    if (!linkForm.userId || !linkForm.organizationId) {
      toast.error('Selecione um usuário e uma organização');
      return;
    }

    setLinkLoading(true);
    try {
      // Verificar se já existe o vínculo
      const { data: existing, error: checkError } = await supabase
        .from('organization_users')
        .select('id')
        .eq('user_id', linkForm.userId)
        .eq('organization_id', linkForm.organizationId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        toast.error('Usuário já está vinculado a esta organização');
        return;
      }

      // Criar vínculo
      const { error: insertError } = await supabase
        .from('organization_users')
        .insert({
          user_id: linkForm.userId,
          organization_id: linkForm.organizationId,
          role: linkForm.role,
          is_active: true,
          joined_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      toast.success('Usuário vinculado à organização com sucesso');
      setLinkUserOrgDialog(false);
      setLinkForm({ userId: '', organizationId: '', role: 'user' });
      await fetchUsers();
    } catch (error) {
      console.error('Error linking user to organization:', error);
      toast.error('Erro ao vincular usuário à organização');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkUserFromOrganization = async (userId: string, organizationId: string) => {
    if (!confirm('Tem certeza que deseja desvincular este usuário da organização?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('organization_users')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      toast.success('Usuário desvinculado da organização');
      await fetchUsers();
    } catch (error) {
      console.error('Error unlinking user from organization:', error);
      toast.error('Erro ao desvincular usuário da organização');
    }
  };

  const toggleSuperAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Tem certeza que deseja ${currentStatus ? 'remover' : 'conceder'} privilégios de super admin?`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc(
        currentStatus ? 'revoke_user_super_admin' : 'promote_user_to_super_admin',
        { user_id: userId }
      );

      if (error) throw error;

      toast.success(`Privilégios de super admin ${currentStatus ? 'removidos' : 'concedidos'} com sucesso`);
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling super admin:', error);
      toast.error('Erro ao alterar privilégios de super admin');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, []);

  const filteredUsers = users.filter(user => 
    // Remover super admins da listagem de usuários normais
    !user.is_super_admin &&
    (user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.user_basic_info?.[0]?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getUserName = (user: UserWithOrganizations) => {
    return user.user_basic_info?.[0]?.name || user.email.split('@')[0];
  };

  // Verificações condicionais - DEPOIS de todos os hooks
  if (superAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="superadmins" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Super Admins
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organizações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestão de Usuários
                  </CardTitle>
                  <CardDescription>
                    Gerencie usuários e suas vinculações com organizações
                  </CardDescription>
                </div>
                
                <Dialog open={linkUserOrgDialog} onOpenChange={setLinkUserOrgDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Vincular Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Vincular Usuário à Organização</DialogTitle>
                      <DialogDescription>
                        Selecione um usuário e uma organização para criar o vínculo
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="user-select">Usuário</Label>
                        <Select value={linkForm.userId} onValueChange={(value) => setLinkForm(prev => ({ ...prev, userId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {getUserName(user)} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="org-select">Organização</Label>
                        <Select value={linkForm.organizationId} onValueChange={(value) => setLinkForm(prev => ({ ...prev, organizationId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma organização" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map(org => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="role-select">Role</Label>
                        <Select value={linkForm.role} onValueChange={(value: any) => setLinkForm(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="owner">Proprietário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleLinkUserToOrganization}
                          disabled={linkLoading}
                          className="flex-1"
                        >
                          {linkLoading ? 'Vinculando...' : 'Vincular'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setLinkUserOrgDialog(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Users className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map(user => (
                      <Card key={user.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{getUserName(user)}</h4>
                              {user.id === currentUser?.id && (
                                <Badge variant="secondary" className="text-xs">
                                  Você
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user.organizations.length === 0 ? (
                                <Badge variant="outline" className="text-xs">
                                  Sem organizações
                                </Badge>
                              ) : (
                                user.organizations.map(org => (
                                  <div key={`${user.id}-${org.organization_id}`} className="flex items-center gap-1">
                                    <Badge 
                                      className={`text-xs ${ROLE_COLORS[org.role as keyof typeof ROLE_COLORS]} flex items-center gap-1 border`}
                                    >
                                      {getRoleIcon(org.role)}
                                      {org.organization.name} ({ROLE_LABELS[org.role as keyof typeof ROLE_LABELS]})
                                    </Badge>
                                    <button
                                      onClick={() => handleUnlinkUserFromOrganization(user.id, org.organization_id)}
                                      className="ml-1 hover:text-destructive text-muted-foreground hover:text-red-600"
                                      title="Desvincular usuário desta organização"
                                    >
                                      <Unlink className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))
                              )}
                              
                              {/* Indicador de status */}
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${user.organizations.some(o => o.is_active) ? 'bg-green-500' : 'bg-red-500'}`} />
                                  <span className="text-xs text-muted-foreground">
                                    {user.organizations.some(o => o.is_active) ? 'Ativo' : 'Inativo'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant={user.is_super_admin ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => toggleSuperAdmin(user.id, user.is_super_admin)}
                              className="flex items-center gap-1"
                            >
                              <Crown className="h-3 w-3" />
                              {user.is_super_admin ? 'Remover' : 'Promover'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="superadmins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Super Administradores
              </CardTitle>
              <CardDescription>
                Gerencie os super administradores do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Users className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.filter(user => user.is_super_admin).map(user => (
                      <Card key={user.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{getUserName(user)}</h4>
                              <Badge variant="destructive" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Super Admin
                              </Badge>
                              {user.id === currentUser?.id && (
                                <Badge variant="secondary" className="text-xs">
                                  Você
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user.organizations.length === 0 ? (
                                <Badge variant="outline" className="text-xs">
                                  Sem organizações
                                </Badge>
                              ) : (
                                user.organizations.map(org => (
                                  <Badge 
                                    key={`${user.id}-${org.organization_id}`} 
                                    className={`text-xs ${ROLE_COLORS[org.role as keyof typeof ROLE_COLORS]} flex items-center gap-1 border`}
                                  >
                                    {getRoleIcon(org.role)}
                                    {org.organization.name} ({ROLE_LABELS[org.role as keyof typeof ROLE_LABELS]})
                                  </Badge>
                                ))
                              )}
                              
                              {/* Indicador de status */}
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${user.organizations.some(o => o.is_active) ? 'bg-green-500' : 'bg-red-500'}`} />
                                  <span className="text-xs text-muted-foreground">
                                    {user.organizations.some(o => o.is_active) ? 'Ativo' : 'Inativo'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => toggleSuperAdmin(user.id, true)}
                                className="flex items-center gap-1"
                              >
                                <Crown className="h-3 w-3" />
                                Remover Super Admin
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    {users.filter(user => user.is_super_admin).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Crown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum super administrador encontrado</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizações
              </CardTitle>
              <CardDescription>
                Visualize todas as organizações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organizations.map(org => (
                  <Card key={org.id} className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">{org.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Slug: {org.slug}
                      </p>
                      {org.description && (
                        <p className="text-sm text-muted-foreground">
                          {org.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Criada em: {new Date(org.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Users className="h-3 w-3" />
                        <span>
                          {users.filter(u => u.organizations.some(o => o.organization_id === org.id)).length} usuários
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdmin;
