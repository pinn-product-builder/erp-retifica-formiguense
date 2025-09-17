import React, { useState } from 'react';
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
  UserCog
} from 'lucide-react';
import { useUserManagement, type CreateUserData } from '@/hooks/useUserManagement';
import { useAdminGuard } from '@/hooks/useRoleGuard';
import type { AppRole } from '@/hooks/usePermissions';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-red-100 text-red-800 border-red-200',
  manager: 'bg-blue-100 text-blue-800 border-blue-200',
  user: 'bg-green-100 text-green-800 border-green-200',
  viewer: 'bg-gray-100 text-gray-800 border-gray-200'
};

const ROLE_ICONS = {
  owner: Crown,
  admin: ShieldCheck,
  manager: UserCog,
  user: Users,
  viewer: Eye
};

const ROLE_LABELS = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuário',
  viewer: 'Visualizador'
};

export default function GestaoUsuarios() {
  // Verificar permissões de admin
  const { hasPermission } = useAdminGuard({
    toastMessage: 'Acesso restrito a administradores para gerenciar usuários.'
  });

  const {
    users,
    loading,
    createLoading,
    fetchUsers,
    createUser,
    updateUserRole,
    toggleUserStatus,
    removeUser,
    canManageUsers,
    canEditUser,
    currentOrganization,
    userRole
  } = useUserManagement();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<AppRole>('user');

  const [newUserData, setNewUserData] = useState<CreateUserData>({
    email: '',
    name: '',
    role: 'user'
  });

  // Se não tem permissão, não renderizar nada
  if (!hasPermission) {
    return null;
  }

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.name) return;

    const success = await createUser(newUserData);
    if (success) {
      setNewUserData({ email: '', name: '', role: 'user' });
      setIsCreateDialogOpen(false);
    }
  };

  const handleUpdateRole = async (userId: string) => {
    const success = await updateUserRole(userId, editingRole);
    if (success) {
      setEditingUser(null);
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie usuários e permissões da organização {currentOrganization?.name}
          </p>
        </div>
        
        {canManageUsers() && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário à organização. Uma conta será criada automaticamente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
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
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          {getRoleIcon('viewer')}
                          {ROLE_LABELS.viewer}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateUser}
                  disabled={createLoading || !newUserData.email || !newUserData.name}
                >
                  {createLoading ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
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
      <Card>
        <CardHeader>
          <CardTitle>Usuários da Organização</CardTitle>
          <CardDescription>
            Gerencie os usuários e suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                        <div className="font-medium">{user.user?.name || 'Nome não disponível'}</div>
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
                    
                    <TableCell>
                      <div className="text-sm">
                        {user.joined_at ? formatDate(user.joined_at) : 'Pendente'}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEditUser(user.user_id, user.role) && (
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
                                      <SelectItem value="viewer">
                                        <div className="flex items-center gap-2">
                                          {getRoleIcon('viewer')}
                                          {ROLE_LABELS.viewer}
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
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
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
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
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveUser(user.user_id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Remover
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
        </CardContent>
      </Card>
    </div>
  );
}
