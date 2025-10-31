import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Flag,
  Award,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Goal {
  id: string;
  org_id: string;
  kpi_id: string | null;
  goal_type: 'kpi' | 'custom' | 'project';
  target_value: number;
  progress_current: number;
  progress_unit: string;
  target_period_start: string;
  target_period_end: string;
  status: 'pending' | 'on_track' | 'at_risk' | 'delayed' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string | null;
  assigned_to: string[] | null;
  parent_goal_id: string | null;
  milestones: Milestone[];
  notifications_enabled: boolean;
  auto_update_from_kpi: boolean;
  created_at: string;
  updated_at: string;
}

interface Milestone {
  name: string;
  target: number;
  date: string;
  completed: boolean;
}

interface NewGoal {
  goal_type: 'kpi' | 'custom' | 'project';
  target_value: number;
  progress_unit: string;
  target_period_end: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-gray-500', icon: Clock },
  on_track: { label: 'No Prazo', color: 'bg-success', icon: CheckCircle },
  at_risk: { label: 'Em Risco', color: 'bg-warning', icon: AlertTriangle },
  delayed: { label: 'Atrasada', color: 'bg-destructive', icon: AlertTriangle },
  completed: { label: 'Concluída', color: 'bg-success', icon: Award }
};

const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: 'text-gray-500', badge: 'secondary' },
  medium: { label: 'Média', color: 'text-blue-600', badge: 'default' },
  high: { label: 'Alta', color: 'text-warning', badge: 'warning' },
  critical: { label: 'Crítica', color: 'text-destructive', badge: 'destructive' }
};

export function GoalsManager() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [newProgress, setNewProgress] = useState<number>(0);
  const [newGoal, setNewGoal] = useState<NewGoal>({
    goal_type: 'custom',
    target_value: 0,
    progress_unit: 'number',
    target_period_end: '',
    priority: 'medium',
    description: ''
  });
  const [editGoal, setEditGoal] = useState<NewGoal>({
    goal_type: 'custom',
    target_value: 0,
    progress_unit: 'number',
    target_period_end: '',
    priority: 'medium',
    description: ''
  });

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchGoals();
      setupRealtimeSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id]);

  // Escutar eventos de refresh do dashboard
  useEffect(() => {
    const handleRefresh = () => {
      if (currentOrganization?.id) {
        fetchGoals();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dashboard-refresh', handleRefresh);
      return () => {
        window.removeEventListener('dashboard-refresh', handleRefresh);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id]);

  const fetchGoals = async () => {
    if (!currentOrganization?.id) {
      return;
    }

    try {
      setLoading(true);

      const { data, error} = await supabase
        .from('kpi_targets')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('priority', { ascending: false })
        .order('target_period_end', { ascending: true });

      if (error) throw error;

      setGoals((data as unknown as Goal[]) || []);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar metas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`goals-${currentOrganization?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kpi_targets',
          filter: `org_id=eq.${currentOrganization?.id}`
        },
        (payload) => {
          console.log('Goal change detected:', payload);
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createGoal = async () => {
    try {
      const { error } = await supabase
        .from('kpi_targets')
        .insert({
          org_id: currentOrganization?.id,
          kpi_id: null,
          period_type: 'custom',
          valid_from: new Date().toISOString().split('T')[0],
          valid_to: newGoal.target_period_end,
          ...newGoal,
          target_period_start: new Date().toISOString(),
          progress_current: 0,
          status: 'pending',
          milestones: []
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "A meta foi criada com sucesso",
      });

      setDialogOpen(false);
      resetForm();
      fetchGoals();
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a meta",
        variant: "destructive"
      });
    }
  };

  const updateGoalProgress = async () => {
    if (!selectedGoal) return;

    try {
      const { error } = await supabase
        .from('kpi_targets')
        .update({ progress_current: newProgress } as Record<string, unknown>)
        .eq('id', selectedGoal.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "O progresso da meta foi atualizado com sucesso",
      });

      setProgressDialogOpen(false);
      setSelectedGoal(null);
      setNewProgress(0);
      fetchGoals();
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o progresso da meta",
        variant: "destructive"
      });
    }
  };

  const updateGoal = async () => {
    if (!editingGoal) return;

    try {
      const { error } = await supabase
        .from('kpi_targets')
        .update({
          goal_type: editGoal.goal_type,
          target_value: editGoal.target_value,
          progress_unit: editGoal.progress_unit,
          target_period_end: editGoal.target_period_end,
          priority: editGoal.priority,
          description: editGoal.description
        } as Record<string, unknown>)
        .eq('id', editingGoal.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "A meta foi atualizada com sucesso",
      });

      setEditDialogOpen(false);
      resetEditForm();
      fetchGoals();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a meta",
        variant: "destructive"
      });
    }
  };

  const deleteGoal = async () => {
    if (!selectedGoal) return;

    try {
      const { error } = await supabase
        .from('kpi_targets')
        .delete()
        .eq('id', selectedGoal.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "A meta foi excluída com sucesso",
      });

      setDeleteDialogOpen(false);
      setSelectedGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a meta",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setNewGoal({
      goal_type: 'custom',
      target_value: 0,
      progress_unit: 'number',
      target_period_end: '',
      priority: 'medium',
      description: ''
    });
    setEditingGoal(null);
  };

  const resetEditForm = () => {
    setEditGoal({
      goal_type: 'custom',
      target_value: 0,
      progress_unit: 'number',
      target_period_end: '',
      priority: 'medium',
      description: ''
    });
    setEditingGoal(null);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setEditGoal({
      goal_type: goal.goal_type,
      target_value: goal.target_value,
      progress_unit: goal.progress_unit,
      target_period_end: goal.target_period_end.split('T')[0],
      priority: goal.priority,
      description: goal.description || ''
    });
    setEditDialogOpen(true);
  };

  const openProgressDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setNewProgress(goal.progress_current);
    setProgressDialogOpen(true);
  };

  const openDeleteDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setDeleteDialogOpen(true);
  };

  const getProgressPercentage = (goal: Goal) => {
    if (goal.target_value === 0) return 0;
    return Math.min((goal.progress_current / goal.target_value) * 100, 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} dias atrasado`;
    if (diffDays === 0) return 'Vence hoje';
    return `${diffDays} dias restantes`;
  };

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando metas...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Sistema de Metas
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Meta</DialogTitle>
                <DialogDescription>
                  Configure uma nova meta para acompanhar o progresso da equipe
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="goal_type">Tipo de Meta</Label>
                  <Select
                    value={newGoal.goal_type}
                    onValueChange={(value: 'kpi' | 'custom' | 'project') => setNewGoal({ ...newGoal, goal_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Personalizada</SelectItem>
                      <SelectItem value="kpi">Baseada em KPI</SelectItem>
                      <SelectItem value="project">Projeto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Descreva a meta..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="target_value">Valor Alvo</Label>
                    <Input
                      id="target_value"
                      type="number"
                      value={newGoal.target_value}
                      onChange={(e) => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="progress_unit">Unidade</Label>
                    <Select
                      value={newGoal.progress_unit}
                      onValueChange={(value) => setNewGoal({ ...newGoal, progress_unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="currency">Moeda (R$)</SelectItem>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={newGoal.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setNewGoal({ ...newGoal, priority: value })}
                  >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="target_period_end">Data Limite</Label>
                    <Input
                      id="target_period_end"
                      type="date"
                      value={newGoal.target_period_end}
                      onChange={(e) => setNewGoal({ ...newGoal, target_period_end: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createGoal}>
                  Criar Meta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Edição de Meta */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Meta</DialogTitle>
                <DialogDescription>
                  Atualize as informações da meta
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_goal_type">Tipo de Meta</Label>
                  <Select
                    value={editGoal.goal_type}
                    onValueChange={(value: 'kpi' | 'custom' | 'project') => setEditGoal({ ...editGoal, goal_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Personalizada</SelectItem>
                      <SelectItem value="kpi">Baseada em KPI</SelectItem>
                      <SelectItem value="project">Projeto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit_description">Descrição</Label>
                  <Textarea
                    id="edit_description"
                    value={editGoal.description}
                    onChange={(e) => setEditGoal({ ...editGoal, description: e.target.value })}
                    placeholder="Descreva a meta..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit_target_value">Valor Alvo</Label>
                    <Input
                      id="edit_target_value"
                      type="number"
                      value={editGoal.target_value}
                      onChange={(e) => setEditGoal({ ...editGoal, target_value: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit_progress_unit">Unidade</Label>
                    <Select
                      value={editGoal.progress_unit}
                      onValueChange={(value) => setEditGoal({ ...editGoal, progress_unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="currency">Moeda (R$)</SelectItem>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit_priority">Prioridade</Label>
                    <Select
                      value={editGoal.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setEditGoal({ ...editGoal, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit_target_period_end">Data Limite</Label>
                    <Input
                      id="edit_target_period_end"
                      type="date"
                      value={editGoal.target_period_end}
                      onChange={(e) => setEditGoal({ ...editGoal, target_period_end: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setEditDialogOpen(false);
                  resetEditForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={updateGoal}>
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Edição de Progresso */}
          <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Atualizar Progresso</DialogTitle>
                <DialogDescription>
                  {selectedGoal && `Atualize o progresso da meta: ${selectedGoal.description}`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="progress">Progresso Atual</Label>
                  <Input
                    id="progress"
                    type="number"
                    value={newProgress}
                    onChange={(e) => setNewProgress(parseFloat(e.target.value) || 0)}
                    min="0"
                    step={selectedGoal?.progress_unit === 'currency' ? '0.01' : '1'}
                  />
                  {selectedGoal && (
                    <p className="text-sm text-muted-foreground">
                      Meta: {formatValue(selectedGoal.target_value, selectedGoal.progress_unit)}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setProgressDialogOpen(false);
                  setSelectedGoal(null);
                  setNewProgress(0);
                }}>
                  Cancelar
                </Button>
                <Button onClick={updateGoalProgress}>
                  Atualizar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Confirmação de Exclusão */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogDescription>
                  {selectedGoal && (
                    <>
                      Tem certeza que deseja excluir a meta <strong>"{selectedGoal.description}"</strong>?
                      <br />
                      <br />
                      Esta ação não pode ser desfeita.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedGoal(null);
                }}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={deleteGoal}>
                  Excluir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="popLayout">
          {goals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma meta configurada</h3>
              <p className="text-muted-foreground mb-4">
                Crie metas para acompanhar o progresso da equipe
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Meta
              </Button>
            </motion.div>
          ) : (
            goals.map((goal, index) => {
              const StatusIcon = STATUS_CONFIG[goal.status].icon;
              const progressPercentage = getProgressPercentage(goal);

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-l-4" style={{ borderLeftColor: `var(--${STATUS_CONFIG[goal.status].color})` }}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={PRIORITY_CONFIG[goal.priority].badge as 'default' | 'secondary' | 'destructive' | 'outline'}>
                                <Flag className="w-3 h-3 mr-1" />
                                {PRIORITY_CONFIG[goal.priority].label}
                              </Badge>
                              <Badge variant="outline">
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {STATUS_CONFIG[goal.status].label}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{goal.description}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditDialog(goal)}
                              title="Editar meta"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openProgressDialog(goal)}
                              title="Atualizar progresso"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-destructive/10"
                              onClick={() => openDeleteDialog(goal)}
                              title="Excluir meta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {formatValue(goal.progress_current, goal.progress_unit)} / {formatValue(goal.target_value, goal.progress_unit)}
                            </span>
                            <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {getDaysRemaining(goal.target_period_end)}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {goal.goal_type === 'kpi' ? 'KPI' : goal.goal_type === 'project' ? 'Projeto' : 'Personalizada'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
