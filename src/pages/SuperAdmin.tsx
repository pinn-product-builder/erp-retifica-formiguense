import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Unlink,
  ChevronDown,
  ChevronRight,
  Eye,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSuperAdmin, useSuperAdminActions } from '@/hooks/useSuperAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { useResponsive } from '@/hooks/useResponsive';

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
  is_active: boolean;
  created_at: string;
  created_by: string;
  organization_users?: Array<{
    id: string;
    user_id: string;
    role: string;
    profiles: { name: string } | null;
  }>;
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
  const { 
    loading: actionsLoading, 
    getAllOrganizations,
    createOrganization, 
    updateOrganization, 
    deleteOrganization,
    reactivateOrganization
  } = useSuperAdminActions();
  const { isMobile, padding, layout, componentSize, gridCols, textSize } = useResponsive();
  
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

  // Estados para CRUD de organizações
  const [orgDialog, setOrgDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgForm, setOrgForm] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [orgFormErrors, setOrgFormErrors] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);
  const [showInactiveOrgs, setShowInactiveOrgs] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Função para toggle das linhas expandidas
  const toggleRowExpansion = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

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
    const orgs = await getAllOrganizations(showInactiveOrgs);
    setOrganizations(orgs as unknown as Organization[]);
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
  }, []);

  useEffect(() => {
    const loadOrganizations = async () => {
      const orgs = await getAllOrganizations(showInactiveOrgs);
      setOrganizations(orgs as unknown as Organization[]);
    };
    loadOrganizations();
  }, [getAllOrganizations, showInactiveOrgs]);

  const filteredUsers = users.filter(user => 
    // Remover super admins da listagem de usuários normais
    !user.is_super_admin &&
    (user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.user_basic_info?.[0]?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getUserName = (user: UserWithOrganizations) => {
    return user.user_basic_info?.[0]?.name || user.email.split('@')[0];
  };

  // Funções para CRUD de organizações
  const validateOrgForm = () => {
    const errors = { name: '', slug: '', description: '' };
    
    if (!orgForm.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (orgForm.name.length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (orgForm.name.length > 100) {
      errors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    if (!orgForm.slug.trim()) {
      errors.slug = 'Slug é obrigatório';
    } else if (!/^[a-z0-9-]+$/.test(orgForm.slug)) {
      errors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens';
    } else if (orgForm.slug.length < 2) {
      errors.slug = 'Slug deve ter pelo menos 2 caracteres';
    } else if (orgForm.slug.length > 50) {
      errors.slug = 'Slug deve ter no máximo 50 caracteres';
    }

    if (orgForm.description && orgForm.description.length > 500) {
      errors.description = 'Descrição deve ter no máximo 500 caracteres';
    }

    setOrgFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const resetOrgForm = () => {
    setOrgForm({ name: '', slug: '', description: '' });
    setOrgFormErrors({ name: '', slug: '', description: '' });
    setEditingOrg(null);
  };

  const openOrgDialog = (org?: Organization) => {
    if (org) {
      setEditingOrg(org);
      setOrgForm({
        name: org.name,
        slug: org.slug,
        description: org.description || ''
      });
    } else {
      resetOrgForm();
    }
    setOrgDialog(true);
  };

  const closeOrgDialog = () => {
    setOrgDialog(false);
    resetOrgForm();
  };

  const handleCreateOrg = async () => {
    if (!validateOrgForm()) return;

    const success = await createOrganization({
      name: orgForm.name.trim(),
      slug: orgForm.slug.trim(),
      description: orgForm.description.trim() || undefined
    });

    if (success) {
      closeOrgDialog();
      fetchOrganizations();
    }
  };

  const handleUpdateOrg = async () => {
    if (!editingOrg || !validateOrgForm()) return;

    const success = await updateOrganization(editingOrg.id, {
      name: orgForm.name.trim(),
      slug: orgForm.slug.trim(),
      description: orgForm.description.trim() || undefined
    });

    if (success) {
      closeOrgDialog();
      fetchOrganizations();
    }
  };

  const handleDeleteOrg = async (org: Organization) => {
    setDeletingOrgId(org.id);
    try {
      const success = await deleteOrganization(org.id);
      if (success) {
        fetchOrganizations();
      }
    } finally {
      setDeletingOrgId(null);
    }
  };

  const handleReactivateOrg = async (org: Organization) => {
    const success = await reactivateOrganization(org.id);
    if (success) {
      fetchOrganizations();
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
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
    <div className="w-full max-w-full px-4 py-6 mx-auto space-y-6 overflow-hidden">
      <div className="text-center sm:text-left">
        <h1 className={`${textSize.title} font-bold flex items-center justify-center sm:justify-start gap-2`}>
          <Shield className={componentSize.button.icon} />
          Super Admin Dashboard
        </h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className={componentSize.button.icon} />
            {isMobile ? 'Users' : 'Usuários'}
          </TabsTrigger>
          <TabsTrigger value="superadmins" className="flex items-center gap-2">
            <Crown className={componentSize.button.icon} />
            {isMobile ? 'Admins' : 'Super Admins'}
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building2 className={componentSize.button.icon} />
            {isMobile ? 'Orgs' : 'Organizações'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div className="text-center sm:text-left">
                  <CardTitle className={`flex items-center justify-center sm:justify-start gap-2 ${textSize.heading}`}>
                    <Users className={componentSize.button.icon} />
                    Gestão de Usuários
                  </CardTitle>
                  <CardDescription className={`${textSize.caption} mt-1`}>
                    Gerencie usuários e suas vinculações com organizações
                  </CardDescription>
                </div>
                
                <div className="flex justify-center sm:justify-end">
                  <Dialog open={linkUserOrgDialog} onOpenChange={setLinkUserOrgDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2 w-full sm:w-auto">
                        <LinkIcon className={componentSize.button.icon} />
                        {isMobile ? 'Vincular' : 'Vincular Usuário'}
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
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
                        <Select value={linkForm.role} onValueChange={(value: 'owner' | 'admin' | 'manager' | 'user') => setLinkForm(prev => ({ ...prev, role: value }))}>
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 justify-center sm:justify-end">
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Users className="h-6 w-6 animate-spin" />
                  </div>
                ) : isMobile ? (
                  // Layout de cards para mobile
                  <div className="space-y-3 max-w-md mx-auto sm:max-w-none">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="border rounded-lg p-4 space-y-3 bg-card">
                        {/* Informações principais sempre visíveis */}
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-medium text-lg">{getUserName(user)}</span>
                            {user.id === currentUser?.id && (
                              <Badge variant="secondary" className="text-xs">Você</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          
                          {/* Status e organizações principais */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.organizations.some(o => o.is_active) ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-sm">
                                {user.organizations.some(o => o.is_active) ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            
                            {user.organizations.length === 0 ? (
                              <Badge variant="outline" className="text-xs">
                                Sem organizações
                              </Badge>
                            ) : (
                              <div className="text-xs text-center">
                                {user.organizations.length} organização{user.organizations.length > 1 ? 'ões' : ''}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botões de ação */}
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-4 w-full">
                            {/* Botão de ação principal */}
                            <Button
                              variant={user.is_super_admin ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => toggleSuperAdmin(user.id, user.is_super_admin)}
                              className="flex-1 max-w-[200px]"
                            >
                              <Crown className="h-3 w-3 mr-2" />
                              {user.is_super_admin ? 'Remover' : 'Promover'}
                            </Button>
                            
                            {/* Botão expandir/recolher */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(user.id)}
                              className="flex-shrink-0"
                            >
                              {expandedRows.has(user.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Seção expansível - fora do flex container */}
                        <Collapsible open={expandedRows.has(user.id)} onOpenChange={() => {}}>
                          <CollapsibleContent className="w-full">
                            <div className="mt-3 pt-3 border-t space-y-4">
                              {/* Detalhes das organizações */}
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium text-center">Organizações:</h5>
                                {user.organizations.length === 0 ? (
                                  <p className="text-center text-sm text-muted-foreground">
                                    Usuário não vinculado a nenhuma organização
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {user.organizations.map(org => (
                                      <div key={`${user.id}-${org.organization_id}`} className="flex items-center justify-between gap-2 p-2 bg-muted rounded">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <Badge 
                                            className={`text-xs ${ROLE_COLORS[org.role as keyof typeof ROLE_COLORS]} flex items-center gap-1 border flex-shrink-0`}
                                          >
                                            {getRoleIcon(org.role)}
                                            {ROLE_LABELS[org.role as keyof typeof ROLE_LABELS]}
                                          </Badge>
                                          <span className="text-sm truncate">{org.organization.name}</span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleUnlinkUserFromOrganization(user.id, org.organization_id)}
                                          className="flex-shrink-0 p-1 h-auto"
                                          title="Desvincular usuário desta organização"
                                        >
                                          <Unlink className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Layout de tabela para desktop/tablet
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Organizações</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map(user => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{getUserName(user)}</span>
                                  {user.id === currentUser?.id && (
                                    <Badge variant="secondary" className="text-xs">Você</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${user.organizations.some(o => o.is_active) ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-sm">
                                  {user.organizations.some(o => o.is_active) ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
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
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant={user.is_super_admin ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => toggleSuperAdmin(user.id, user.is_super_admin)}
                                className="flex items-center gap-1"
                              >
                                <Crown className="h-3 w-3" />
                                {user.is_super_admin ? 'Remover' : 'Promover'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="superadmins" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="text-center sm:text-left">
                <CardTitle className="flex items-center justify-center sm:justify-start gap-2">
                  <Crown className="h-5 w-5" />
                  Super Administradores
                </CardTitle>
                <CardDescription>
                  Gerencie os super administradores do sistema
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Users className="h-6 w-6 animate-spin" />
                  </div>
                ) : isMobile ? (
                  // Layout de cards para mobile
                  <div className="space-y-3 max-w-md mx-auto sm:max-w-none">
                    {users.filter(user => user.is_super_admin).map(user => (
                      <div key={user.id} className="border rounded-lg p-4 space-y-3 bg-card">
                        {/* Informações principais sempre visíveis */}
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-medium text-lg">{getUserName(user)}</span>
                            {user.id === currentUser?.id && (
                              <Badge variant="secondary" className="text-xs">Você</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          
                          <div className="flex justify-center">
                            <Badge variant="destructive" className="text-sm">
                              <Crown className="h-3 w-3 mr-1" />
                              Super Admin
                            </Badge>
                          </div>
                          
                          {/* Status e organizações principais */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.organizations.some(o => o.is_active) ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-sm">
                                {user.organizations.some(o => o.is_active) ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            
                            {user.organizations.length === 0 ? (
                              <Badge variant="outline" className="text-xs">
                                Sem organizações
                              </Badge>
                            ) : (
                              <div className="text-xs text-center">
                                {user.organizations.length} organização{user.organizations.length > 1 ? 'ões' : ''}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botões de ação */}
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-4 w-full">
                            {/* Botão de ação principal (só se não for o usuário atual) */}
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => toggleSuperAdmin(user.id, true)}
                                className="flex-1 max-w-[200px]"
                              >
                                <Crown className="h-3 w-3 mr-2" />
                                Remover Super Admin
                              </Button>
                            )}
                            
                            {/* Botão expandir/recolher */}
                            {user.organizations.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpansion(user.id)}
                                className="flex-shrink-0"
                              >
                                {expandedRows.has(user.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Seção expansível - fora do flex container */}
                        {user.organizations.length > 0 && (
                          <Collapsible open={expandedRows.has(user.id)} onOpenChange={() => {}}>
                            <CollapsibleContent className="w-full">
                              <div className="mt-3 pt-3 border-t space-y-4">
                                {/* Detalhes das organizações */}
                                <div className="space-y-2">
                                  <h5 className="text-sm font-medium text-center">Organizações:</h5>
                                  <div className="space-y-2">
                                    {user.organizations.map(org => (
                                      <div key={`${user.id}-${org.organization_id}`} className="flex items-center justify-center gap-2 p-2 bg-muted rounded">
                                        <Badge 
                                          className={`text-xs ${ROLE_COLORS[org.role as keyof typeof ROLE_COLORS]} flex items-center gap-1 border`}
                                        >
                                          {getRoleIcon(org.role)}
                                          {ROLE_LABELS[org.role as keyof typeof ROLE_LABELS]}
                                        </Badge>
                                        <span className="text-sm">{org.organization.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>
                    ))}
                    
                    {users.filter(user => user.is_super_admin).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Crown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum super administrador encontrado</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Layout de tabela para desktop/tablet
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Organizações</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.filter(user => user.is_super_admin).map(user => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{getUserName(user)}</span>
                                  <Badge variant="destructive" className="text-xs">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Super Admin
                                  </Badge>
                                  {user.id === currentUser?.id && (
                                    <Badge variant="secondary" className="text-xs">Você</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${user.organizations.some(o => o.is_active) ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-sm">
                                  {user.organizations.some(o => o.is_active) ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
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
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
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
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {users.filter(user => user.is_super_admin).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              <Crown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>Nenhum super administrador encontrado</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <CardTitle className="flex items-center justify-center sm:justify-start gap-2">
                    <Building2 className="h-5 w-5" />
                    Gerenciar Organizações
                  </CardTitle>
                  <CardDescription>
                    Crie, edite e gerencie todas as organizações do sistema
                  </CardDescription>
                </div>
                <Button onClick={() => openOrgDialog()} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Organização
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtro de Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-inactive"
                    checked={showInactiveOrgs}
                    onCheckedChange={setShowInactiveOrgs}
                  />
                  <Label htmlFor="show-inactive" className="text-sm">
                    Mostrar organizações inativas
                  </Label>
                </div>
                <Badge variant={showInactiveOrgs ? "secondary" : "default"}>
                  {showInactiveOrgs ? "Mostrando todas" : "Apenas ativas"}
                </Badge>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Building2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Carregando organizações...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {organizations.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Nenhuma organização encontrada</h3>
                      <p className="text-muted-foreground mb-4">
                        Comece criando sua primeira organização
                      </p>
                      <Button onClick={() => openOrgDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeira Organização
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {organizations.map(org => (
                        <Card key={org.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-lg truncate">{org.name}</h4>
                                  <Badge variant={org.is_active ? "default" : "secondary"}>
                                    {org.is_active ? "Ativa" : "Inativa"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Slug: <code className="bg-muted px-1 rounded text-xs">{org.slug}</code>
                                </p>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openOrgDialog(org)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                {!org.is_active && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReactivateOrg(org)}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                    title="Reativar organização"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={deletingOrgId === org.id}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      {deletingOrgId === org.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Inativar Organização</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja inativar a organização <strong>"{org.name}"</strong>?
                                        <br />
                                        <br />
                                        A organização será marcada como inativa e não poderá ser acessada, mas todos os dados serão preservados.
                                        <br />
                                        <br />
                                        <strong>Nota:</strong> Organizações que possuem usuários ativos não podem ser inativadas.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel disabled={deletingOrgId === org.id}>
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteOrg(org)}
                                        disabled={deletingOrgId === org.id}
                                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                      >
                                        {deletingOrgId === org.id ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Inativando...
                                          </>
                                        ) : (
                                          'Inativar Organização'
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                            
                            {org.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {org.description}
                              </p>
                            )}
                            
                            <div className="space-y-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span>Criada em: {new Date(org.created_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                <span>
                                  {users.filter(u => u.organizations.some(o => o.organization_id === org.id)).length} usuários
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Criação/Edição de Organização */}
      <Dialog open={orgDialog} onOpenChange={setOrgDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {editingOrg ? 'Editar Organização' : 'Nova Organização'}
            </DialogTitle>
            <DialogDescription>
              {editingOrg 
                ? 'Atualize as informações da organização' 
                : 'Preencha os dados para criar uma nova organização'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nome da Organização *</Label>
              <Input
                id="org-name"
                value={orgForm.name}
                onChange={(e) => {
                  const name = e.target.value.slice(0, 100);
                  setOrgForm(prev => ({ 
                    ...prev, 
                    name,
                    slug: !editingOrg ? generateSlug(name) : prev.slug
                  }));
                }}
                placeholder="Ex: Empresa ABC Ltda"
                className={orgFormErrors.name ? 'border-red-500' : ''}
              />
              {orgFormErrors.name && (
                <p className="text-sm text-red-500">{orgFormErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug *</Label>
              <Input
                id="org-slug"
                value={orgForm.slug}
                onChange={(e) => {
                  const slug = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '')
                    .slice(0, 50);
                  setOrgForm(prev => ({ ...prev, slug }));
                }}
                placeholder="Ex: empresa-abc-ltda"
                className={orgFormErrors.slug ? 'border-red-500' : ''}
              />
              {orgFormErrors.slug && (
                <p className="text-sm text-red-500">{orgFormErrors.slug}</p>
              )}
              <p className="text-xs text-muted-foreground">
                O slug será usado na URL e deve conter apenas letras minúsculas, números e hífens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-description">Descrição</Label>
              <textarea
                id="org-description"
                value={orgForm.description}
                onChange={(e) => {
                  const description = e.target.value.slice(0, 500);
                  setOrgForm(prev => ({ ...prev, description }));
                }}
                placeholder="Descrição opcional da organização"
                className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${orgFormErrors.description ? 'border-red-500' : ''}`}
                rows={3}
              />
              {orgFormErrors.description && (
                <p className="text-sm text-red-500">{orgFormErrors.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {orgForm.description.length}/500 caracteres
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeOrgDialog}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={editingOrg ? handleUpdateOrg : handleCreateOrg}
              disabled={actionsLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {actionsLoading ? 'Salvando...' : (editingOrg ? 'Atualizar' : 'Criar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdmin;
