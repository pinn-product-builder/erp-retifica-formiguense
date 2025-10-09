import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from './useOrganization';
import { useAuth } from './useAuth';
import { GamificationService, UserScore, UserAchievement, PerformanceRanking, GamificationResult } from '@/services/gamificationService';

export interface GamificationState {
  score: UserScore | null;
  achievements: UserAchievement[];
  ranking: PerformanceRanking[];
  userRankingPosition: PerformanceRanking | null;
  loading: boolean;
  error: string | null;
}

export interface GamificationActions {
  processAction: (actionType: string, metadata?: Record<string, any>) => Promise<GamificationResult | null>;
  refreshData: () => Promise<void>;
  getAchievementProgress: (achievementKey: string) => Promise<{ current: number; target: number; progress: number } | null>;
}

export const useGamification = (): GamificationState & GamificationActions => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [state, setState] = useState<GamificationState>({
    score: null,
    achievements: [],
    ranking: [],
    userRankingPosition: null,
    loading: true,
    error: null
  });

  const fetchGamificationData = useCallback(async () => {
    if (!currentOrganization || !user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [score, achievements, ranking, userRankingPosition] = await Promise.all([
        GamificationService.getUserScore(currentOrganization.id, user.id),
        GamificationService.getUserAchievements(currentOrganization.id, user.id),
        GamificationService.getPerformanceRanking(currentOrganization.id, 'weekly'),
        GamificationService.getUserRankingPosition(currentOrganization.id, user.id, 'weekly')
      ]);

      setState(prev => ({
        ...prev,
        score,
        achievements,
        ranking,
        userRankingPosition,
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar dados de gamificação'
      }));
    }
  }, [currentOrganization, user]);

  const processAction = useCallback(async (
    actionType: string,
    metadata: Record<string, any> = {}
  ): Promise<GamificationResult | null> => {
    if (!currentOrganization || !user) {
      return null;
    }

    try {
      const result = await GamificationService.processUserAction(
        currentOrganization.id,
        user.id,
        actionType,
        metadata
      );

      // Atualizar dados locais após processar ação
      await fetchGamificationData();

      return result;
    } catch (error) {
      console.error('Error processing gamification action:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao processar ação'
      }));
      return null;
    }
  }, [currentOrganization, user, fetchGamificationData]);

  const getAchievementProgress = useCallback(async (
    achievementKey: string
  ): Promise<{ current: number; target: number; progress: number } | null> => {
    if (!currentOrganization || !user) {
      return null;
    }

    try {
      return await GamificationService.getAchievementProgress(
        currentOrganization.id,
        user.id,
        achievementKey
      );
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      return null;
    }
  }, [currentOrganization, user]);

  const refreshData = useCallback(async () => {
    await fetchGamificationData();
  }, [fetchGamificationData]);

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  return {
    ...state,
    processAction,
    refreshData,
    getAchievementProgress
  };
};

// Hook específico para conquistas
export const useAchievements = () => {
  const { achievements, loading, error } = useGamification();
  const [recentAchievements, setRecentAchievements] = useState<UserAchievement[]>([]);

  useEffect(() => {
    // Filtrar conquistas dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recent = achievements.filter(achievement => 
      new Date(achievement.earned_at) >= sevenDaysAgo
    );

    setRecentAchievements(recent);
  }, [achievements]);

  return {
    achievements,
    recentAchievements,
    loading,
    error
  };
};

// Hook específico para ranking
export const useRanking = (periodType: 'daily' | 'weekly' | 'monthly' = 'weekly') => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [ranking, setRanking] = useState<PerformanceRanking[]>([]);
  const [userPosition, setUserPosition] = useState<PerformanceRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = useCallback(async () => {
    if (!currentOrganization || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [rankingData, userPositionData] = await Promise.all([
        GamificationService.getPerformanceRanking(currentOrganization.id, periodType),
        GamificationService.getUserRankingPosition(currentOrganization.id, user.id, periodType)
      ]);

      setRanking(rankingData);
      setUserPosition(userPositionData);
    } catch (error) {
      console.error('Error fetching ranking:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar ranking');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, user, periodType]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return {
    ranking,
    userPosition,
    loading,
    error,
    refresh: fetchRanking
  };
};

// Hook para pontuação do usuário
export const useUserScore = () => {
  const { score, loading, error, processAction } = useGamification();

  const getLevelInfo = useCallback(() => {
    if (!score) return null;

    const currentLevel = score.current_level;
    const progress = score.level_progress;
    const pointsToNextLevel = 100 - progress;
    const totalPointsInLevel = 100;

    return {
      currentLevel,
      progress,
      pointsToNextLevel,
      totalPointsInLevel,
      progressPercentage: (progress / totalPointsInLevel) * 100
    };
  }, [score]);

  const getScoreHistory = useCallback(async (limit: number = 10) => {
    // Implementar busca de histórico se necessário
    return [];
  }, []);

  return {
    score,
    levelInfo: getLevelInfo(),
    loading,
    error,
    processAction,
    getScoreHistory
  };
};
