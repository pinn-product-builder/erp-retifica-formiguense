import { supabase } from '@/integrations/supabase/client';

export interface UserScore {
  id: string;
  org_id: string;
  user_id: string;
  total_points: number;
  current_level: number;
  level_progress: number;
  last_updated: string;
}

export interface UserAchievement {
  id: string;
  org_id: string;
  user_id: string;
  achievement_type: string;
  achievement_data: Record<string, any>;
  earned_at: string;
  points_earned: number;
  title?: string;
  description?: string;
  icon?: string;
}

export interface AchievementConfig {
  id: string;
  org_id: string;
  achievement_key: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  criteria: Record<string, any>;
  is_active: boolean;
}

export interface PerformanceRanking {
  id: string;
  org_id: string;
  user_id: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  total_points: number;
  rank_position: number;
  metrics: Record<string, any>;
  user_name?: string;
  user_email?: string;
}

export interface ScoreHistory {
  id: string;
  org_id: string;
  user_id: string;
  action_type: string;
  points_earned: number;
  points_before: number;
  points_after: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface GamificationResult {
  score: {
    points_earned: number;
    total_points: number;
    current_level: number;
    level_progress: number;
    level_up: boolean;
    previous_level: number;
  };
  achievements: Array<{
    id: string;
    key: string;
    title: string;
    description: string;
    icon: string;
    points: number;
  }>;
  action_type: string;
  processed_at: string;
}

export class GamificationService {
  /**
   * Processa uma ação do usuário e retorna pontos e conquistas
   */
  static async processUserAction(
    orgId: string,
    userId: string,
    actionType: string,
    metadata: Record<string, any> = {}
  ): Promise<GamificationResult> {
    const { data, error } = await supabase.rpc('process_user_action', {
      p_org_id: orgId,
      p_user_id: userId,
      p_action_type: actionType,
      p_metadata: metadata
    });

    if (error) {
      console.error('Error processing user action:', error);
      throw new Error('Falha ao processar ação do usuário');
    }

    return data as unknown as GamificationResult;
  }

  /**
   * Busca o score atual do usuário
   */
  static async getUserScore(orgId: string, userId: string): Promise<UserScore | null> {
    const { data, error } = await supabase
      .from('user_scores')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user score:', error);
      throw new Error('Falha ao buscar pontuação do usuário');
    }

    return data;
  }

  /**
   * Busca conquistas do usuário
   */
  static async getUserAchievements(orgId: string, userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user achievements:', error);
      throw new Error('Falha ao buscar conquistas do usuário');
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Buscar dados das conquistas separadamente
    const achievementTypes = data.map(achievement => achievement.achievement_type);
    const { data: configs } = await supabase
      .from('achievement_configs')
      .select('*')
      .eq('org_id', orgId)
      .in('achievement_key', achievementTypes);

    // Mapear dados das conquistas
    return data.map(achievement => {
      const config = configs?.find(c => c.achievement_key === achievement.achievement_type);
      return {
        ...achievement,
        achievement_data: achievement.achievement_data as Record<string, any>,
        title: config?.title || 'Conquista',
        description: config?.description || 'Conquista conquistada',
        icon: config?.icon || '🏆'
      } as UserAchievement;
    });
  }

  /**
   * Busca conquistas disponíveis
   */
  static async getAvailableAchievements(orgId: string): Promise<AchievementConfig[]> {
    if (!orgId || orgId.trim() === '') {
      console.warn('orgId is empty, returning empty array');
      return [];
    }

    const { data, error } = await supabase
      .from('achievement_configs')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('points', { ascending: true });

    if (error) {
      console.error('Error fetching available achievements:', error);
      throw new Error('Falha ao buscar conquistas disponíveis');
    }

    return (data || []).map(item => ({
      ...item,
      criteria: item.criteria as Record<string, any>
    })) as AchievementConfig[];
  }

  /**
   * Busca ranking de performance
   */
  static async getPerformanceRanking(
    orgId: string,
    periodType: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<PerformanceRanking[]> {
    const { data, error } = await supabase
      .from('performance_rankings')
      .select('*')
      .eq('org_id', orgId)
      .eq('period_type', periodType)
      .order('rank_position', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching performance ranking:', error);
      throw new Error('Falha ao buscar ranking de performance');
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Buscar dados de usuários separadamente
    const userIds = data.map(ranking => ranking.user_id);
    const { data: userInfos } = await supabase
      .from('user_basic_info')
      .select('user_id, name, email')
      .in('user_id', userIds);

    // Mapear dados de usuários para rankings
    return data.map(ranking => {
      const userInfo = userInfos?.find(u => u.user_id === ranking.user_id);
      return {
        ...ranking,
        period_type: ranking.period_type as 'daily' | 'weekly' | 'monthly',
        metrics: ranking.metrics as Record<string, any>,
        user_name: userInfo?.name || 'Usuário',
        user_email: userInfo?.email || ''
      } as PerformanceRanking;
    });
  }

  /**
   * Busca posição do usuário no ranking
   */
  static async getUserRankingPosition(
    orgId: string,
    userId: string,
    periodType: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<PerformanceRanking | null> {
    const { data, error } = await supabase
      .from('performance_rankings')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .eq('period_type', periodType)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user ranking position:', error);
      throw new Error('Falha ao buscar posição do usuário no ranking');
    }

    if (!data) {
      return null;
    }

    // Buscar dados do usuário
    const { data: userInfo } = await supabase
      .from('user_basic_info')
      .select('user_id, name, email')
      .eq('user_id', userId)
      .single();

    return {
      ...data,
      period_type: data.period_type as 'daily' | 'weekly' | 'monthly',
      metrics: data.metrics as Record<string, any>,
      user_name: userInfo?.name || 'Usuário',
      user_email: userInfo?.email || ''
    } as PerformanceRanking;
  }

  /**
   * Busca histórico de pontuação do usuário
   */
  static async getUserScoreHistory(
    orgId: string,
    userId: string,
    limit: number = 20
  ): Promise<ScoreHistory[]> {
    const { data, error } = await supabase
      .from('user_score_history')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user score history:', error);
      throw new Error('Falha ao buscar histórico de pontuação');
    }

    return (data || []).map(item => ({
      ...item,
      metadata: item.metadata as Record<string, any>
    })) as ScoreHistory[];
  }

  /**
   * Calcula progresso para próxima conquista
   */
  static async getAchievementProgress(
    orgId: string,
    userId: string,
    achievementKey: string
  ): Promise<{ current: number; target: number; progress: number } | null> {
    const { data: config, error: configError } = await supabase
      .from('achievement_configs')
      .select('*')
      .eq('org_id', orgId)
      .eq('achievement_key', achievementKey)
      .single();

    if (configError || !config) {
      return null;
    }

    const criteria = config.criteria as Record<string, any>;
    const criteriaType = criteria?.type;
    const targetValue = criteria?.value || 0;

    let currentValue = 0;

    switch (criteriaType) {
      case 'total_orders': {
        const { count } = await (supabase.rpc as any)('count_user_orders', {
          p_org_id: orgId,
          p_user_id: userId
        });
        currentValue = count || 0;
        break;
      }

      case 'completed_orders': {
        const { count } = await (supabase.rpc as any)('count_completed_orders', {
          p_org_id: orgId,
          p_user_id: userId
        });
        currentValue = count || 0;
        break;
      }

      case 'approved_budgets': {
        const { count } = await (supabase.rpc as any)('count_approved_budgets', {
          p_org_id: orgId,
          p_user_id: userId
        });
        currentValue = count || 0;
        break;
      }

      case 'total_points':
        const { data: score } = await supabase
          .from('user_scores')
          .select('total_points')
          .eq('org_id', orgId)
          .eq('user_id', userId)
          .single();
        currentValue = score?.total_points || 0;
        break;

      case 'level_reached':
        const { data: levelScore } = await supabase
          .from('user_scores')
          .select('current_level')
          .eq('org_id', orgId)
          .eq('user_id', userId)
          .single();
        currentValue = levelScore?.current_level || 1;
        break;

      default:
        return null;
    }

    const progress = Math.min((currentValue / targetValue) * 100, 100);

    return {
      current: currentValue,
      target: targetValue,
      progress
    };
  }

  /**
   * Ações pré-definidas que geram pontos
   */
  static readonly ACTIONS = {
    ORDER_CREATED: 'order_created',
    ORDER_COMPLETED: 'order_completed',
    BUDGET_APPROVED: 'budget_approved',
    DIAGNOSTIC_COMPLETED: 'diagnostic_completed',
    ALERT_RESOLVED: 'alert_resolved',
    GOAL_ACHIEVED: 'goal_achieved',
    CHECKLIST_COMPLETED: 'checklist_completed',
    PHOTO_UPLOADED: 'photo_uploaded',
    DAILY_LOGIN: 'daily_login',
    WEEKLY_ACTIVE: 'weekly_active',
    MONTHLY_ACTIVE: 'monthly_active'
  } as const;
}
