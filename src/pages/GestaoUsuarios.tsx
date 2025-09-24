import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  UserPlus,
  Settings,
  Eye,
  EyeOff,
  Crown,
  UserCog,
  Loader2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useUserManagement, type CreateUserData } from '@/hooks/useUserManagement';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/useResponsive';

type AppRole = Database['public']['Enums']['app_role'];
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-red-100 text-red-800 border-red-200',
  manager: 'bg-blue-100 text-blue-800 border-blue-200',
  user: 'bg-green-100 text-green-800 border-green-200'
};

const ROLE_ICONS = {
  owner: Crown,
  admin: ShieldCheck,
  manager: UserCog,
  user: Users
};

const ROLE_LABELS = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuário'
};

export default function GestaoUsuarios() {
  const { toast } = useToast();
  const { isMobile, padding, layout, componentSize, gridCols, textSize } = useResponsive();
  
  // Verificar permissões de admin - usando useRoleGuard diretamente
  const { hasPermission } = useRoleGuard({
    requiredRole: ['owner', 'admin'],
    toastMessage: 'Acesso restrito a administradores para gerenciar usuários.',
    blockAccess: true
  });

  const {
    users,
    loading,
    createLoading,
    deleteLoading,
    fetchUsers,
    createUser,
    updateUserRole,
    toggleUserStatus,
    removeUser,
    canManageUsers,
    canEditUser,
    isSelfUser,
    currentOrganization,
    userRole
  } = useUserManagement();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<AppRole>('user');
  const [editingProfile, setEditingProfile] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [newUserData, setNewUserData] = useState<CreateUserData>({
    email: '',
    name: '',
    role: 'user',
    profile_id: undefined
  });

  // Hook para gerenciar perfis
  const profilesData = useUserProfiles();
  const profiles = profilesData?.profiles || [];

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


  // Se não tem permissão, mostrar mensagem
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Acesso Restrito</h3>
          <p className="text-muted-foreground">
            Apenas administradores podem gerenciar usuários.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Sua role atual: <strong>{userRole}</strong>
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  const handleCreateUser = async () => {
    console.log('Iniciando criação de usuário:', newUserData);
    
    if (!newUserData.email || !newUserData.name) {
      console.log('Dados incompletos:', { email: newUserData.email, name: newUserData.name });
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, preencha o email e nome do usuário.',
        variant: 'destructive',
      });
      return;
    }
    
    const success = await createUser(newUserData);
    console.log('Resultado da criação:', success);
    
    if (success) {
      setNewUserData({ 
        email: '', 
        name: '', 
        role: 'user', 
        profile_id: undefined 
      });
      setIsCreateDialogOpen(false);
      // Toast já é exibido pela função createUser no hook
    }
    // Se success === false, o toast de erro já foi exibido pelo hook
  };

  const handleUpdateRole = async (userId: string) => {
    try {
      console.log('Atualizando usuário:', { userId, editingRole, editingProfile });
      
      const success = await updateUserRole(userId, editingRole);
      console.log('Resultado da atualização:', success);
      
      if (success) {
        setEditingUser(null);
        setEditingProfile('');
        
        toast({
          title: 'Usuário atualizado',
          description: 'Nível de acesso atualizado com sucesso',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: 'Erro ao atualizar usuário',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    await toggleUserStatus(userId, !currentStatus);
  };

  const handleRemoveUser = async (userId: string) => {
    await removeUser(userId);
  };

  const getRoleIcon = (role: AppRole) => {
    const Icon = ROLE_ICONS[role];
    return <Icon className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="w-full max-w-full px-4 py-6 mx-auto space-y-6 overflow-hidden">
      {/* Header */}
      <div className="space-y-4">
        <div className="text-center sm:text-left">
          <h1 className={`${textSize.title} font-bold`}>Gestão de Usuários</h1>
          <p className={`text-muted-foreground ${textSize.body} mt-2`}>
            Gerencie usuários e permissões da organização {currentOrganization?.name}
          </p>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link to="/gestao-usuarios/perfis">
            <Button variant="outline" className="w-full sm:w-auto">
              <UserCog className={componentSize.button.icon} />
              {isMobile ? 'Perfis' : 'Perfis de Usuário'}
            </Button>
          </Link>
      
          {canManageUsers() && (
              <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (open) {
                  // Limpar formulário ao abrir
                  setNewUserData({
                    email: '',
                    name: '',
                    role: 'user',
                    profile_id: undefined
                  });
                }
              }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className={componentSize.button.icon} />
                {isMobile ? 'Novo' : 'Novo Usuário'}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário à organização. Uma conta será criada automaticamente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className={`${gridCols.content[2]} gap-4`}>
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={newUserData.name}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Digite o email do usuário"
                    />
                  </div>
                </div>
                
                <div className={`${gridCols.content[2]} gap-4`}>
                  <div>
                    <Label htmlFor="role">Nível de Acesso</Label>
                    <Select
                      value={newUserData.role}
                      onValueChange={(value: AppRole) => setNewUserData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {userRole === 'owner' && (
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              {getRoleIcon('admin')}
                              {ROLE_LABELS.admin}
                            </div>
                          </SelectItem>
                        )}
                        <SelectItem value="manager">
                          <div className="flex items-center gap-2">
                            {getRoleIcon('manager')}
                            {ROLE_LABELS.manager}
                          </div>
                        </SelectItem>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            {getRoleIcon('user')}
                            {ROLE_LABELS.user}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="profile">Perfil de Usuário (Opcional)</Label>
                    <Select
                    value={newUserData.profile_id || 'none'}
                    onValueChange={(value) => setNewUserData(prev => ({ 
                      ...prev, 
                      profile_id: value === 'none' ? undefined : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">Nenhum perfil</span>
                      </SelectItem>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: profile.sector?.color || '#3B82F6' }}
                            />
                            <span>{profile.name}</span>
                            {profile.sector && (
                              <span className="text-xs text-muted-foreground">
                                ({profile.sector.name})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <DialogFooter className={`${layout.flex.mobileStack} gap-2`}>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className={componentSize.button.mobile}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateUser}
                  disabled={createLoading || !newUserData.email || !newUserData.name}
                  className={componentSize.button.mobile}
                >
                  {createLoading ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => ['owner', 'admin'].includes(u.role)).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
            <ShieldX className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {users.filter(u => !u.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="w-full max-w-none mx-auto">
        <CardHeader className="text-center sm:text-left">
          <CardTitle className={textSize.heading}>Usuários da Organização</CardTitle>
          <CardDescription className={textSize.caption}>
            Gerencie os usuários e suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isMobile ? (
            // Layout de cards para mobile
            <div className="space-y-3 p-4 max-w-md mx-auto sm:max-w-none">
              {loading ? (
                <div className="text-center py-8">Carregando usuários...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">Nenhum usuário encontrado</div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 space-y-3 bg-card">
                    {/* Informações principais sempre visíveis */}
                    <div className="text-center space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium text-lg">
                          {user.user?.name || 'Nome não disponível'}
                        </span>
                        {isSelfUser(user.user_id) && (
                          <Badge variant="secondary" className="text-xs">Você</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.user?.email}
                      </div>
                      <div className="flex justify-center">
                        <Badge variant="outline" className={ROLE_COLORS[user.role]}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {ROLE_LABELS[user.role]}
                          </div>
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex items-center gap-2 flex-1 justify-center">
                          <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm">{user.is_active ? 'Ativo' : 'Inativo'}</span>
                        </div>
                        
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(user.user_id)}
                              className="flex-shrink-0"
                            >
                              {expandedRows.has(user.user_id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        
                        <CollapsibleContent className="w-full">
                          <div className="mt-3 pt-3 border-t space-y-4">
                            {/* Informações detalhadas */}
                            <div className="text-center">
                              <span className="text-sm font-medium text-muted-foreground">Adicionado: </span>
                              <span className="text-sm">{user.joined_at ? formatDate(user.joined_at) : 'Pendente'}</span>
                            </div>
                            
                            {/* Ações */}
                            {canEditUser(user.user_id) && (
                              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                                  className="w-full sm:flex-1"
                                >
                                  {user.is_active ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                  {user.is_active ? 'Desativar' : 'Ativar'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full sm:flex-1"
                                  onClick={() => {
                                    setEditingUser(user.user_id);
                                    setEditingRole(user.role);
                                    setEditingProfile('');
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Button>
                              </div>
                            )}
                          </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Layout de tabela para desktop/tablet
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Adicionado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Carregando usuários...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.user?.name || 'Nome não disponível'}</span>
                          {isSelfUser(user.user_id) && (
                            <Badge variant="secondary" className="text-xs">
                              Você
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.user?.email}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={ROLE_COLORS[user.role]}
                      >
                        <div className="flex items-center gap-1">
                          {getRoleIcon(user.role)}
                          {ROLE_LABELS[user.role]}
                        </div>
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </div>
                    </TableCell>
                    
                    <TableCell className={isMobile ? 'hidden' : ''}>
                      <div className="text-sm">
                        {user.joined_at ? formatDate(user.joined_at) : 'Pendente'}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        {canEditUser(user.user_id) && (
                          <>
                            {/* Toggle Status */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                            >
                              {user.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            
                            {/* Edit Role */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingUser(user.user_id);
                                    setEditingRole(user.role);
                                    setEditingProfile(''); // TODO: Buscar perfil atual do usuário
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Usuário</DialogTitle>
                                  <DialogDescription>
                                    Alterar o nível de acesso de {user.user?.name}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div>
                                    <Label>Nível de Acesso</Label>
                                    <Select
                                      value={editingRole}
                                      onValueChange={(value: AppRole) => setEditingRole(value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {userRole === 'owner' && user.role !== 'owner' && (
                                          <SelectItem value="admin">
                                            <div className="flex items-center gap-2">
                                              {getRoleIcon('admin')}
                                              {ROLE_LABELS.admin}
                                            </div>
                                          </SelectItem>
                                        )}
                                        <SelectItem value="manager">
                                          <div className="flex items-center gap-2">
                                            {getRoleIcon('manager')}
                                            {ROLE_LABELS.manager}
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="user">
                                          <div className="flex items-center gap-2">
                                            {getRoleIcon('user')}
                                            {ROLE_LABELS.user}
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div>
                                    <Label>Perfil de Usuário (Opcional)</Label>
                                    <Select
                                      value={editingProfile || 'none'}
                                      onValueChange={(value) => setEditingProfile(value === 'none' ? '' : value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione um perfil (opcional)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          <span className="text-muted-foreground">Nenhum perfil</span>
                                        </SelectItem>
                                        {profiles.map((profile) => (
                                          <SelectItem key={profile.id} value={profile.id}>
                                            <div className="flex items-center gap-2">
                                              <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: profile.sector?.color || '#3B82F6' }}
                                              />
                                              <span>{profile.name}</span>
                                              {profile.sector && (
                                                <span className="text-xs text-muted-foreground">
                                                  ({profile.sector.name})
                                                </span>
                                              )}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={() => handleUpdateRole(user.user_id)}>
                                    Salvar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            {/* Remove User */}
                            {user.role !== 'owner' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={deleteLoading === user.user_id}
                                  >
                                    {deleteLoading === user.user_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja remover {user.user?.name} da organização?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={deleteLoading === user.user_id}>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveUser(user.user_id)}
                                      disabled={deleteLoading === user.user_id}
                                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                    >
                                      {deleteLoading === user.user_id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Removendo...
                                        </>
                                      ) : (
                                        'Remover'
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
