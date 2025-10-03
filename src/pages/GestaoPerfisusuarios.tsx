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
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Check,
  X
} from 'lucide-react';
import { useUserProfiles, type CreateUserProfileData, type CreateSectorData, type UserProfile, type UserSector } from '@/hooks/useUserProfiles';
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

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  fiscal: 'Fiscal',
  financial: 'Financeiro',
  production: 'Produção',
  inventory: 'Estoque',
  purchasing: 'Compras',
  hr: 'RH',
  customers: 'Clientes',
  reports: 'Relatórios',
  admin: 'Administração',
  settings: 'Configurações',
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
    updateSector,
    deleteSector,
    createProfile,
    updateProfile,
    deleteProfile,
    canManageProfiles,
    currentOrganization
  } = useUserProfiles();

  // Estados para diálogos
  const [isCreateSectorOpen, setIsCreateSectorOpen] = useState(false);
  const [isEditSectorOpen, setIsEditSectorOpen] = useState(false);
  const [isDeleteSectorOpen, setIsDeleteSectorOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<UserSector | null>(null);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isDeleteProfileOpen, setIsDeleteProfileOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('profiles');

  // Estados para formulários
  const [newSectorData, setNewSectorData] = useState<CreateSectorData>({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0]
  });

  const [editSectorData, setEditSectorData] = useState<CreateSectorData>({
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

  const [editProfileData, setEditProfileData] = useState<CreateUserProfileData>({
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
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({
    name: '',
    display_name: '',
    description: '',
    route_path: '',
    module: '',
    icon: ''
  });
  const [pageValidationTouched, setPageValidationTouched] = useState({
    name: false,
    display_name: false,
    route_path: false
  });

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

  // Handlers para ações dos setores
  const handleEditSector = (sector: UserSector) => {
    setSelectedSector(sector);
    setEditSectorData({
      name: sector.name,
      description: sector.description || '',
      color: sector.color
    });
    setIsEditSectorOpen(true);
  };

  const handleDeleteSector = (sector: UserSector) => {
    setSelectedSector(sector);
    setIsDeleteSectorOpen(true);
  };

  const handleConfirmDeleteSector = async () => {
    if (!selectedSector) return;
    
    const success = await deleteSector(selectedSector.id);
    if (success) {
      setIsDeleteSectorOpen(false);
      setSelectedSector(null);
    }
  };

  const handleUpdateSector = async () => {
    if (!selectedSector) return;

    const success = await updateSector(selectedSector.id, editSectorData);
    if (success) {
      setEditSectorData({ name: '', description: '', color: DEFAULT_COLORS[0] });
      setIsEditSectorOpen(false);
      setSelectedSector(null);
    }
  };

  // Handlers para ações dos perfis
  const handleViewProfile = async (profile: UserProfile) => {
    setSelectedProfile(profile);
    setIsViewProfileOpen(true);
  };

  const handleEditProfile = async (profile: UserProfile) => {
    setSelectedProfile(profile);
    
    // Carregar permissões do perfil
    const permissions = await fetchProfilePermissions(profile.id);
    const permissionsMap: Record<string, { view: boolean; edit: boolean; delete: boolean }> = {};
    
    permissions.forEach(perm => {
      permissionsMap[perm.page_id] = {
        view: perm.can_view,
        edit: perm.can_edit,
        delete: perm.can_delete
      };
    });
    
    setSelectedPermissions(permissionsMap);
    setEditProfileData({
      name: profile.name,
      description: profile.description || '',
      sector_id: profile.sector_id || '',
      page_permissions: permissions.map(perm => ({
        page_id: perm.page_id,
        can_view: perm.can_view,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete
      }))
    });
    
    setIsEditProfileOpen(true);
  };

  const handleDeleteProfile = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setIsDeleteProfileOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProfile) return;
    
    const success = await deleteProfile(selectedProfile.id);
    if (success) {
      setIsDeleteProfileOpen(false);
      setSelectedProfile(null);
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;

    const permissions = Object.entries(selectedPermissions)
      .filter(([_, perms]) => perms.view || perms.edit || perms.delete)
      .map(([pageId, perms]) => ({
        page_id: pageId,
        can_view: perms.view,
        can_edit: perms.edit,
        can_delete: perms.delete
      }));

    const profileWithPermissions = {
      ...editProfileData,
      page_permissions: permissions
    };

    const success = await updateProfile(selectedProfile.id, profileWithPermissions);
    if (success) {
      setEditProfileData({ name: '', description: '', sector_id: '', page_permissions: [] });
      setSelectedPermissions({});
      setIsEditProfileOpen(false);
      setSelectedProfile(null);
    }
  };

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
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium">Permissões de Páginas</h4>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                            onClick={() => {
                              const allPermissions: Record<string, { view: boolean; edit: boolean; delete: boolean }> = {};
                              systemPages.forEach(page => {
                                allPermissions[page.id] = { view: true, edit: true, delete: true };
                              });
                              setSelectedPermissions(allPermissions);
                              toast({
                                title: "Todas as permissões selecionadas",
                                description: "Todas as páginas de todos os módulos foram marcadas com permissões completas",
                              });
                            }}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Selecionar Todos os Módulos
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedPermissions({});
                              toast({
                                title: "Permissões desmarcadas",
                                description: "Todas as permissões de todos os módulos foram removidas",
                              });
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Desmarcar Todos os Módulos
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {Object.entries(groupedPages).map(([module, pages]) => (
                          <div key={module} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={MODULE_COLORS[module as keyof typeof MODULE_COLORS] || 'bg-gray-100 text-gray-800'}>
                                  {MODULE_LABELS[module as keyof typeof MODULE_LABELS] || module.charAt(0).toUpperCase() + module.slice(1)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {pages.length} página{pages.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const modulePermissions: Record<string, { view: boolean; edit: boolean; delete: boolean }> = {};
                                    pages.forEach(page => {
                                      modulePermissions[page.id] = { view: true, edit: true, delete: true };
                                    });
                                    setSelectedPermissions(prev => ({ ...prev, ...modulePermissions }));
                                    toast({
                                      title: "Permissões selecionadas",
                                      description: `Todas as páginas do módulo ${MODULE_LABELS[module as keyof typeof MODULE_LABELS] || module} foram marcadas com permissões completas`,
                                    });
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Selecionar Todas
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const modulePermissions: Record<string, { view: boolean; edit: boolean; delete: boolean }> = {};
                                    pages.forEach(page => {
                                      modulePermissions[page.id] = { view: false, edit: false, delete: false };
                                    });
                                    setSelectedPermissions(prev => ({ ...prev, ...modulePermissions }));
                                    toast({
                                      title: "Permissões desmarcadas",
                                      description: `Todas as páginas do módulo ${MODULE_LABELS[module as keyof typeof MODULE_LABELS] || module} foram desmarcadas`,
                                    });
                                  }}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Desmarcar Todas
                                </Button>
                              </div>
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
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full sm:flex-1"
                                    onClick={() => handleViewProfile(profile)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full sm:flex-1"
                                    onClick={() => handleEditProfile(profile)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full sm:flex-1"
                                    onClick={() => handleDeleteProfile(profile)}
                                  >
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
                        </TableCell>
                        <TableCell className={isMobile ? 'hidden' : ''}>
                          {formatDistanceToNow(new Date(profile.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewProfile(profile)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditProfile(profile)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteProfile(profile)}
                            >
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
                    <div className="flex gap-1 sm:gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditSector(sector)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteSector(sector)}
                      >
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
                      {MODULE_LABELS[module as keyof typeof MODULE_LABELS] || module.charAt(0).toUpperCase() + module.slice(1)}
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

      {/* Diálogo de Visualização de Perfil */}
      <Dialog open={isViewProfileOpen} onOpenChange={setIsViewProfileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Perfil</DialogTitle>
            <DialogDescription>
              Informações completas do perfil selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome</Label>
                  <p className="text-sm text-muted-foreground">{selectedProfile.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Setor</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedProfile.sector?.name || 'Sem setor'}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Descrição</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedProfile.description || 'Sem descrição'}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Setor</Label>
                {selectedProfile.sector ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: selectedProfile.sector.color }}
                    />
                    <span className="text-sm">{selectedProfile.sector.name}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem setor</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium">Criado em</Label>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(selectedProfile.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Edição de Perfil */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Altere as informações e permissões do perfil
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-profile-name">Nome do Perfil *</Label>
                <Input
                  id="edit-profile-name"
                  value={editProfileData.name}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome do perfil"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-profile-sector">Setor *</Label>
                <Select 
                  value={editProfileData.sector_id} 
                  onValueChange={(value) => setEditProfileData(prev => ({ ...prev, sector_id: value }))}
                >
                  <SelectTrigger>
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
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-profile-description">Descrição</Label>
              <Textarea
                id="edit-profile-description"
                value={editProfileData.description}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Digite uma descrição para o perfil (opcional)"
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Permissões de Páginas</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure quais páginas este perfil pode acessar e as ações permitidas
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    onClick={() => {
                      const allPermissions: Record<string, { view: boolean; edit: boolean; delete: boolean }> = {};
                      systemPages.forEach(page => {
                        allPermissions[page.id] = { view: true, edit: true, delete: true };
                      });
                      setSelectedPermissions(allPermissions);
                      toast({
                        title: "Todas as permissões selecionadas",
                        description: "Todas as páginas de todos os módulos foram marcadas com permissões completas",
                      });
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Selecionar Todos os Módulos
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedPermissions({});
                      toast({
                        title: "Permissões desmarcadas",
                        description: "Todas as permissões de todos os módulos foram removidas",
                      });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Desmarcar Todos os Módulos
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(groupedPages).map(([module, pages]) => (
                  <Collapsible key={module}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Badge className={MODULE_COLORS[module as keyof typeof MODULE_COLORS] || 'bg-gray-100 text-gray-800'}>
                          {MODULE_LABELS[module as keyof typeof MODULE_LABELS] || module.charAt(0).toUpperCase() + module.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {pages.length} página{pages.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                      <div className="flex justify-end gap-2 mb-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const modulePermissions: Record<string, { view: boolean; edit: boolean; delete: boolean }> = {};
                            pages.forEach(page => {
                              modulePermissions[page.id] = { view: true, edit: true, delete: true };
                            });
                            setSelectedPermissions(prev => ({ ...prev, ...modulePermissions }));
                            toast({
                              title: "Permissões selecionadas",
                              description: `Todas as páginas do módulo ${MODULE_LABELS[module as keyof typeof MODULE_LABELS] || module} foram marcadas com permissões completas`,
                            });
                          }}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Selecionar Todas
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const modulePermissions: Record<string, { view: boolean; edit: boolean; delete: boolean }> = {};
                            pages.forEach(page => {
                              modulePermissions[page.id] = { view: false, edit: false, delete: false };
                            });
                            setSelectedPermissions(prev => ({ ...prev, ...modulePermissions }));
                            toast({
                              title: "Permissões desmarcadas",
                              description: `Todas as páginas do módulo ${MODULE_LABELS[module as keyof typeof MODULE_LABELS] || module} foram desmarcadas`,
                            });
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Desmarcar Todas
                        </Button>
                      </div>
                      {pages.map((page) => (
                        <div key={page.id} className="p-3 border rounded-lg bg-muted/20">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-medium text-sm">{page.display_name}</div>
                              <div className="text-xs text-muted-foreground">{page.description}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-view-${page.id}`}
                                checked={selectedPermissions[page.id]?.view || false}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(page.id, 'view', checked as boolean)
                                }
                              />
                              <Label htmlFor={`edit-view-${page.id}`} className="text-sm">
                                <Eye className="h-3 w-3 inline mr-1" />
                                Ver
                              </Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-edit-${page.id}`}
                                checked={selectedPermissions[page.id]?.edit || false}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(page.id, 'edit', checked as boolean)
                                }
                              />
                              <Label htmlFor={`edit-edit-${page.id}`} className="text-sm">
                                <Edit className="h-3 w-3 inline mr-1" />
                                Editar
                              </Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-delete-${page.id}`}
                                checked={selectedPermissions[page.id]?.delete || false}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(page.id, 'delete', checked as boolean)
                                }
                              />
                              <Label htmlFor={`edit-delete-${page.id}`} className="text-sm">
                                <Trash2 className="h-3 w-3 inline mr-1" />
                                Excluir
                              </Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              console.log('Cancelando edição de perfil');
              setIsEditProfileOpen(false);
              setSelectedProfile(null);
              setEditProfileData({ name: '', description: '', sector_id: '', page_permissions: [] });
              setSelectedPermissions({});
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProfile} disabled={createLoading}>
              {createLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={isDeleteProfileOpen} onOpenChange={setIsDeleteProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O perfil será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="font-medium">{selectedProfile.name}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedProfile.description || 'Sem descrição'}
                </div>
                {selectedProfile.sector && (
                  <div className="flex items-center gap-2 mt-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: selectedProfile.sector.color }}
                    />
                    <span className="text-sm">{selectedProfile.sector.name}</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir este perfil? Esta ação removerá todas as permissões 
                associadas e não poderá ser desfeita.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteProfileOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={createLoading}>
              {createLoading ? 'Excluindo...' : 'Excluir Perfil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Edição de Setor */}
      <Dialog open={isEditSectorOpen} onOpenChange={setIsEditSectorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Setor</DialogTitle>
            <DialogDescription>
              Altere as informações do setor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sector-name">Nome do Setor *</Label>
              <Input
                id="edit-sector-name"
                value={editSectorData.name}
                onChange={(e) => setEditSectorData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome do setor"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-sector-description">Descrição</Label>
              <Textarea
                id="edit-sector-description"
                value={editSectorData.description}
                onChange={(e) => setEditSectorData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Digite uma descrição para o setor (opcional)"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Cor do Setor</Label>
              <div className="flex gap-2 mt-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      editSectorData.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditSectorData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSectorOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateSector} disabled={createLoading || !editSectorData.name.trim()}>
              {createLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão de Setor */}
      <Dialog open={isDeleteSectorOpen} onOpenChange={setIsDeleteSectorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O setor será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSector && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: selectedSector.color }}
                  />
                  <div className="font-medium">{selectedSector.name}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedSector.description || 'Sem descrição'}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir este setor? Esta ação removerá o setor 
                e não poderá ser desfeita. Certifique-se de que não há perfis atribuídos a este setor.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteSectorOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteSector} disabled={createLoading}>
              {createLoading ? 'Excluindo...' : 'Excluir Setor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
