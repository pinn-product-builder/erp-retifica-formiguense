import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGamification, useAchievements } from '@/hooks/useGamification';
import { useOrganization } from '@/hooks/useOrganization';
import { GamificationService, AchievementConfig } from '@/services/gamificationService';
import { 
  Trophy, 
  Award, 
  Star, 
  Target, 
  Zap,
  Crown,
  Medal,
  Shield,
  Flame,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AchievementProgress {
  key: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  current: number;
  target: number;
  progress: number;
  isEarned: boolean;
}

export function AchievementSystem() {
  const { processAction } = useGamification();
  const { achievements, recentAchievements, loading, error } = useAchievements();
  const { currentOrganization } = useOrganization();
  const [availableAchievements, setAvailableAchievements] = useState<AchievementConfig[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Ícones para conquistas
  const getAchievementIcon = (icon: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '🎯': <Target className="h-6 w-6 text-primary" />,
      '🏆': <Trophy className="h-6 w-6 text-primary" />,
      '👑': <Crown className="h-6 w-6 text-primary" />,
      '✅': <Award className="h-6 w-6 text-primary" />,
      '🎖️': <Medal className="h-6 w-6 text-primary" />,
      '🏅': <Shield className="h-6 w-6 text-primary" />,
      '💰': <Star className="h-6 w-6 text-primary" />,
      '💎': <Sparkles className="h-6 w-6 text-primary" />,
      '💍': <Crown className="h-6 w-6 text-primary" />,
      '⭐': <Star className="h-6 w-6 text-primary" />,
      '🌟': <Sparkles className="h-6 w-6 text-primary" />,
      '✨': <Zap className="h-6 w-6 text-primary" />,
      '🗡️': <Shield className="h-6 w-6 text-primary" />,
      '🦸': <Crown className="h-6 w-6 text-primary" />
    };
    return iconMap[icon] || <Award className="h-6 w-6 text-primary" />;
  };

  const getAchievementColor = (points: number) => {
    if (points >= 1000) return 'text-primary bg-primary/10';
    if (points >= 500) return 'text-primary bg-primary/10';
    if (points >= 250) return 'text-primary bg-primary/10';
    if (points >= 100) return 'text-primary bg-primary/10';
    return 'text-muted-foreground bg-muted';
  };

  const fetchAchievementProgress = async () => {
    try {
      setLoadingProgress(true);
      
      if (!currentOrganization) {
        setLoadingProgress(false);
        return;
      }
      
      const progressPromises = availableAchievements.map(async (achievement) => {
        const progress = await GamificationService.getAchievementProgress(
          currentOrganization.id,
          achievement.achievement_key
        );
        
        const isEarned = achievements.some(a => a.achievement_type === achievement.achievement_key);
        
        return {
          key: achievement.achievement_key,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          points: achievement.points,
          current: progress?.current || 0,
          target: progress?.target || 1,
          progress: progress?.progress || 0,
          isEarned
        };
      });
      
      const progressData = await Promise.all(progressPromises);
      setAchievementProgress(progressData);
    } catch (error) {
      console.error('Error fetching achievement progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    const fetchAvailableAchievements = async () => {
      try {
        if (currentOrganization) {
          const achievements = await GamificationService.getAvailableAchievements(currentOrganization.id);
          setAvailableAchievements(achievements);
        }
      } catch (error) {
        console.error('Error fetching available achievements:', error);
      }
    };

    fetchAvailableAchievements();
  }, [currentOrganization]);

  useEffect(() => {
    if (availableAchievements.length > 0) {
      fetchAchievementProgress();
    }
  }, [availableAchievements, achievements]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Sistema de Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Sistema de Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Sistema de Conquistas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="earned" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="earned">
              Conquistadas ({achievements.length})
            </TabsTrigger>
            <TabsTrigger value="progress">
              Em Progresso ({achievementProgress.filter(a => !a.isEarned).length})
            </TabsTrigger>
            <TabsTrigger value="recent">
              Recentes ({recentAchievements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earned" className="space-y-4">
            {achievements.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma conquista ainda. Continue trabalhando para desbloquear suas primeiras conquistas!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-4 p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                        <div className="text-2xl">
                          {getAchievementIcon(achievement.icon || '🏆')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{achievement.title}</h4>
                            <Badge variant="secondary" className={getAchievementColor(achievement.points_earned)}>
                              +{achievement.points_earned} pts
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Conquistada em {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl">🏆</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {loadingProgress ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : achievementProgress.filter(a => !a.isEarned).length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Todas as conquistas disponíveis foram conquistadas! 🎉
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {achievementProgress
                  .filter(a => !a.isEarned)
                  .map((achievement, index) => (
                    <motion.div
                      key={achievement.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-2xl opacity-50">
                            {getAchievementIcon(achievement.icon)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{achievement.title}</h4>
                              <Badge variant="outline">
                                +{achievement.points} pts
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso</span>
                            <span>{achievement.current}/{achievement.target}</span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {Math.round(achievement.progress)}% concluído
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            {recentAchievements.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma conquista recente. Continue trabalhando!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {recentAchievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-4 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <div className="text-2xl animate-pulse">
                          {getAchievementIcon(achievement.icon || '🏆')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-green-800">{achievement.title}</h4>
                            <Badge className="bg-green-600 text-white">
                              +{achievement.points_earned} pts
                            </Badge>
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              Nova!
                            </Badge>
                          </div>
                          <p className="text-sm text-green-700 mb-2">
                            {achievement.description}
                          </p>
                          <p className="text-xs text-green-600">
                            Conquistada em {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl animate-bounce">🎉</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
