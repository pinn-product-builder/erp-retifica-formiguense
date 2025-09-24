import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  UserCog,
  Plus,
  Building2,
  Shield,
  Eye,
  Edit,
  Trash2,
  Users,
  Palette,
  Settings,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useUserProfiles, type CreateUserProfileData, type CreateSectorData } from '@/hooks/useUserProfiles';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useResponsive } from '@/hooks/useResponsive';

const MODULE_COLORS = {
  dashboard: 'bg-blue-100 text-blue-800',
  fiscal: 'bg-green-100 text-green-800',
  financial: 'bg-yellow-100 text-yellow-800',
  production: 'bg-purple-100 text-purple-800',
  inventory: 'bg-orange-100 text-orange-800',
  purchasing: 'bg-pink-100 text-pink-800',
  hr: 'bg-indigo-100 text-indigo-800',
  customers: 'bg-teal-100 text-teal-800',
  reports: 'bg-red-100 text-red-800',
  admin: 'bg-gray-100 text-gray-800',
  settings: 'bg-slate-100 text-slate-800',
};

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#F97316', // orange
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#EF4444', // red
  '#6B7280', // gray
];

export default function GestaoPerfiUsuarios() {
  const { toast } = useToast();
  const { isMobile, padding, layout, componentSize, gridCols, textSize } = useResponsive();
  const { hasPermission } = useRoleGuard({
    requiredRole: ['owner', 'admin'],
    toastMessage: 'Acesso restrito a administradores para gerenciar perfis.',
    blockAccess: true
  });

  const {
    sectors,
    systemPages,
    profiles,
    loading,
    createLoading,
    fetchProfilePermissions,
    createSector,
    createProfile,
    canManageProfiles,
    currentOrganization
  } = useUserProfiles();

  // Estados para diálogos
  const [isCreateSectorOpen, setIsCreateSectorOpen] = useState(false);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profiles');

  // Estados para formulários
  const [newSectorData, setNewSectorData] = useState<CreateSectorData>({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0]
  });

  const [newProfileData, setNewProfileData] = useState<CreateUserProfileData>({
    name: '',
    description: '',
    sector_id: '',
    page_permissions: []
  });

  // Estado para permissões de páginas
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, { view: boolean; edit: boolean; delete: boolean }>>({});

  // Estados para controlar quando mostrar validações
  const [sectorValidationTouched, setSectorValidationTouched] = useState({ name: false });
  const [profileValidationTouched, setProfileValidationTouched] = useState({ name: false, sector_id: false });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Função para toggle das linhas expandidas
  const toggleRowExpansion = (profileId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(profileId)) {
      newExpanded.delete(profileId);
    } else {
      newExpanded.add(profileId);
    }
    setExpandedRows(newExpanded);
  };

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Acesso Restrito</h3>
          <p className="text-muted-foreground">
            Apenas administradores podem gerenciar perfis de usuários.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateSector = async () => {
    // Marcar todos os campos como "touched" para mostrar validações
    setSectorValidationTouched({ name: true });
    
    if (!newSectorData.name.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'O nome do setor é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    const success = await createSector(newSectorData);
    if (success) {
      setNewSectorData({ name: '', description: '', color: DEFAULT_COLORS[0] });
      setIsCreateSectorOpen(false);
    }
  };

  const handleCreateProfile = async () => {
    // Marcar todos os campos como "touched" para mostrar validações
    setProfileValidationTouched({ name: true, sector_id: true });
    
    if (!newProfileData.name.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'O nome do perfil é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (!newProfileData.sector_id) {
      toast({
        title: 'Campo obrigatório',
        description: 'O setor é obrigatório para o perfil',
        variant: 'destructive',
      });
      return;
    }

    const permissions = Object.entries(selectedPermissions)
      .filter(([_, perms]) => perms.view || perms.edit || perms.delete)
      .map(([pageId, perms]) => ({
        page_id: pageId,
        can_view: perms.view,
        can_edit: perms.edit,
        can_delete: perms.delete
      }));

    const profileWithPermissions = {
      ...newProfileData,
      page_permissions: permissions
    };

    const success = await createProfile(profileWithPermissions);
    if (success) {
      setNewProfileData({ name: '', description: '', sector_id: '', page_permissions: [] });
      setSelectedPermissions({});
      setIsCreateProfileOpen(false);
    }
  };

  const handlePermissionChange = (pageId: string, type: 'view' | 'edit' | 'delete', checked: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        [type]: checked
      }
    }));
  };

  const groupedPages = systemPages.reduce((acc, page) => {
    const module = page.module || 'other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(page);
    return acc;
  }, {} as Record<string, typeof systemPages>);

  return (
    <div className="w-full max-w-full px-4 py-6 mx-auto space-y-6 overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-start">
          <Link to="/gestao-usuarios">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isMobile ? 'Voltar' : 'Voltar para Gestão de Usuários'}
            </Button>
          </Link>
        </div>
        <div className="text-center sm:text-left">
          <h1 className={`${textSize.title} font-bold flex items-center justify-center sm:justify-start gap-2`}>
            <UserCog className={componentSize.button.icon} />
            Perfis de Usuários
          </h1>
          <p className={`text-muted-foreground ${textSize.body} mt-2`}>
            Gerencie perfis, setores e permissões de acesso da organização {currentOrganization?.name}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profiles">
            Perfis
          </TabsTrigger>
          <TabsTrigger value="sectors">
            Setores
          </TabsTrigger>
          <TabsTrigger value="pages">
            Páginas
          </TabsTrigger>
        </TabsList>

        {/* Tab de Perfis */}
        <TabsContent value="profiles" className="space-y-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className={`${textSize.heading} font-semibold`}>Perfis de Usuário</h2>
              <p className={`${textSize.caption} text-muted-foreground mt-1`}>
                Perfis definem grupos de permissões que podem ser atribuídos aos usuários
              </p>
            </div>
            
            {canManageProfiles() && (
              <div className="flex-shrink-0 sm:ml-4">
              <Dialog open={isCreateProfileOpen} onOpenChange={(open) => {
                setIsCreateProfileOpen(open);
                if (open) {
                  // Limpar formulário ao abrir
                  setNewProfileData({ name: '', description: '', sector_id: '', page_permissions: [] });
                  setSelectedPermissions({});
                  setProfileValidationTouched({ name: false, sector_id: false });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className={componentSize.button.icon} />
                    {isMobile ? 'Novo' : 'Novo Perfil'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[80vh] overflow-y-auto mx-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Perfil</DialogTitle>
                    <DialogDescription>
                      Defina um perfil com as permissões específicas para um grupo de usuários
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    <div className={`${gridCols.content[2]} gap-4`}>
                      <div>
                        <Label htmlFor="profile-name">Nome do Perfil</Label>
                        <Input
                          id="profile-name"
                          value={newProfileData.name}
                          onChange={(e) => setNewProfileData(prev => ({ ...prev, name: e.target.value }))}
                          onBlur={() => setProfileValidationTouched(prev => ({ ...prev, name: true }))}
                          placeholder="Ex: Analista Fiscal"
                          className={profileValidationTouched.name && !newProfileData.name.trim() ? 'border-red-300' : ''}
                        />
                        {profileValidationTouched.name && !newProfileData.name.trim() && (
                          <span className="text-sm text-red-500">Campo obrigatório</span>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="profile-sector">Setor</Label>
                        <Select
                          value={newProfileData.sector_id}
                          onValueChange={(value) => {
                            setNewProfileData(prev => ({ ...prev, sector_id: value }));
                            setProfileValidationTouched(prev => ({ ...prev, sector_id: true }));
                          }}
                        >
                          <SelectTrigger className={profileValidationTouched.sector_id && !newProfileData.sector_id ? 'border-red-300' : ''}>
                            <SelectValue placeholder="Selecione um setor" />
                          </SelectTrigger>
                          <SelectContent>
                            {sectors.map((sector) => (
                              <SelectItem key={sector.id} value={sector.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: sector.color }}
                                  />
                                  {sector.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {profileValidationTouched.sector_id && !newProfileData.sector_id && (
                          <span className="text-sm text-red-500">Campo obrigatório</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="profile-description">Descrição</Label>
                      <Textarea
                        id="profile-description"
                        value={newProfileData.description}
                        onChange={(e) => setNewProfileData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva as responsabilidades deste perfil..."
                      />
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-lg font-medium mb-4">Permissões de Páginas</h4>
                      <div className="space-y-6">
                        {Object.entries(groupedPages).map(([module, pages]) => (
                          <div key={module} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge className={MODULE_COLORS[module as keyof typeof MODULE_COLORS] || 'bg-gray-100 text-gray-800'}>
                                {module.charAt(0).toUpperCase() + module.slice(1)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {pages.length} página{pages.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            <div className="grid gap-3">
                              {pages.map((page) => (
                                <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex-1">
                                    <div className="font-medium">{page.display_name}</div>
                                    <div className="text-sm text-muted-foreground">{page.description}</div>
                                  </div>
                                  
                                  <div className="flex items-center gap-6">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${page.id}-view`}
                                        checked={selectedPermissions[page.id]?.view || false}
                                        onCheckedChange={(checked) => 
                                          handlePermissionChange(page.id, 'view', checked as boolean)
                                        }
                                      />
                                      <Label htmlFor={`${page.id}-view`} className="text-sm">
                                        <Eye className="h-4 w-4 inline mr-1" />
                                        Ver
                                      </Label>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${page.id}-edit`}
                                        checked={selectedPermissions[page.id]?.edit || false}
                                        onCheckedChange={(checked) => 
                                          handlePermissionChange(page.id, 'edit', checked as boolean)
                                        }
                                      />
                                      <Label htmlFor={`${page.id}-edit`} className="text-sm">
                                        <Edit className="h-4 w-4 inline mr-1" />
                                        Editar
                                      </Label>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${page.id}-delete`}
                                        checked={selectedPermissions[page.id]?.delete || false}
                                        onCheckedChange={(checked) => 
                                          handlePermissionChange(page.id, 'delete', checked as boolean)
                                        }
                                      />
                                      <Label htmlFor={`${page.id}-delete`} className="text-sm">
                                        <Trash2 className="h-4 w-4 inline mr-1" />
                                        Excluir
                                      </Label>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter className={`${layout.flex.mobileStack} gap-2`}>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateProfileOpen(false)}
                      className={componentSize.button.mobile}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateProfile}
                      disabled={createLoading || !newProfileData.name.trim()}
                      className={componentSize.button.mobile}
                    >
                      {createLoading ? 'Criando...' : 'Criar Perfil'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Perfis Cadastrados</CardTitle>
              <CardDescription>
                Lista de perfis de usuário da organização
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isMobile ? (
                // Layout de cards para mobile
                <div className="space-y-3 p-4 max-w-md mx-auto sm:max-w-none">
                  {loading ? (
                    <div className="text-center py-8">Carregando perfis...</div>
                  ) : profiles.length === 0 ? (
                    <div className="text-center py-8">Nenhum perfil encontrado</div>
                  ) : (
                    profiles.map((profile) => (
                      <div key={profile.id} className="border rounded-lg p-4 space-y-3 bg-card">
                        {/* Informações principais sempre visíveis */}
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-medium text-lg">{profile.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {profile.description || 'Sem descrição'}
                          </div>
                          {profile.sector && (
                            <div className="flex items-center justify-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: profile.sector.color }}
                              />
                              <span className="text-sm">{profile.sector.name}</span>
                            </div>
                          )}
                          <div className="flex justify-center">
                            <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                              {profile.is_active ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Ativo
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inativo
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-center">
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpansion(profile.id)}
                                className="flex-shrink-0"
                              >
                                {expandedRows.has(profile.id) ? (
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
                                  <span className="text-sm font-medium text-muted-foreground">Criado: </span>
                                  <span className="text-sm">
                                    {formatDistanceToNow(new Date(profile.created_at), { 
                                      addSuffix: true, 
                                      locale: ptBR 
                                    })}
                                  </span>
                                </div>
                                
                                {/* Ações */}
                                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                  <Button variant="outline" size="sm" className="w-full sm:flex-1">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver
                                  </Button>
                                  <Button variant="outline" size="sm" className="w-full sm:flex-1">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Button>
                                  <Button variant="outline" size="sm" className="w-full sm:flex-1">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
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
                        <TableHead>Perfil</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Carregando perfis...
                      </TableCell>
                    </TableRow>
                  ) : profiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Nenhum perfil encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{profile.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {profile.description || 'Sem descrição'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {profile.sector ? (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: profile.sector.color }}
                              />
                              {profile.sector.name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sem setor</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                            {profile.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inativo
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className={isMobile ? 'hidden' : ''}>
                          {formatDistanceToNow(new Date(profile.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
        </TabsContent>

        {/* Tab de Setores */}
        <TabsContent value="sectors" className="space-y-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className={`${textSize.heading} font-semibold`}>Setores</h2>
              <p className={`${textSize.caption} text-muted-foreground mt-1`}>
                Organize usuários por setores da empresa
              </p>
            </div>
            
            {canManageProfiles() && (
              <div className="flex-shrink-0 sm:ml-4">
              <Dialog open={isCreateSectorOpen} onOpenChange={(open) => {
                setIsCreateSectorOpen(open);
                if (open) {
                  // Limpar formulário ao abrir
                  setNewSectorData({ name: '', description: '', color: DEFAULT_COLORS[0] });
                  setSectorValidationTouched({ name: false });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className={componentSize.button.icon} />
                    {isMobile ? 'Novo' : 'Novo Setor'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Setor</DialogTitle>
                    <DialogDescription>
                      Adicione um novo setor para organizar os usuários
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sector-name">Nome do Setor</Label>
                      <Input
                        id="sector-name"
                        value={newSectorData.name}
                        onChange={(e) => setNewSectorData(prev => ({ ...prev, name: e.target.value }))}
                        onBlur={() => setSectorValidationTouched(prev => ({ ...prev, name: true }))}
                        placeholder="Ex: Financeiro, Produção, RH..."
                        className={sectorValidationTouched.name && !newSectorData.name.trim() ? 'border-red-300' : ''}
                      />
                      {sectorValidationTouched.name && !newSectorData.name.trim() && (
                        <span className="text-sm text-red-500">Campo obrigatório</span>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="sector-description">Descrição</Label>
                      <Textarea
                        id="sector-description"
                        value={newSectorData.description}
                        onChange={(e) => setNewSectorData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva as responsabilidades deste setor..."
                      />
                    </div>
                    
                    <div>
                      <Label>Cor do Setor</Label>
                      <div className="flex gap-2 mt-2">
                        {DEFAULT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 ${
                              newSectorData.color === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewSectorData(prev => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter className={`${layout.flex.mobileStack} gap-2`}>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateSectorOpen(false)}
                      className={componentSize.button.mobile}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateSector}
                      disabled={createLoading || !newSectorData.name.trim()}
                      className={componentSize.button.mobile}
                    >
                      {createLoading ? 'Criando...' : 'Criar Setor'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            )}
          </div>

          <div className={`${gridCols.statsCard[3]} gap-4`}>
            {sectors.map((sector) => (
              <Card key={sector.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: sector.color }}
                    />
                    {sector.name}
                  </CardTitle>
                  <CardDescription>{sector.description || 'Sem descrição'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant={sector.is_active ? 'default' : 'secondary'}>
                      {sector.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <div className="flex gap-1 sm:gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab de Páginas */}
        <TabsContent value="pages" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Páginas do Sistema</h2>
            <p className="text-sm text-muted-foreground">
              Todas as páginas disponíveis para configuração de permissões
            </p>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedPages).map(([module, pages]) => (
              <Card key={module}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={MODULE_COLORS[module as keyof typeof MODULE_COLORS] || 'bg-gray-100 text-gray-800'}>
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </Badge>
                    <span className="text-sm font-normal text-muted-foreground">
                      {pages.length} página{pages.length !== 1 ? 's' : ''}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {pages.map((page) => (
                      <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{page.display_name}</div>
                          <div className="text-sm text-muted-foreground">{page.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">{page.route_path}</div>
                        </div>
                        <Badge variant={page.is_active ? 'default' : 'secondary'}>
                          {page.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
