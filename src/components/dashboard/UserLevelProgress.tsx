import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUserScore } from '@/hooks/useGamification';
import { 
  Star, 
  Zap, 
  Crown, 
  Target,
  TrendingUp,
  Award,
  Sparkles,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LevelReward {
  level: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
}

const getLevelRewards = (currentLevel: number): LevelReward[] => [
  {
    level: 5,
    title: 'Especialista',
    description: 'Desbloqueia acesso a relatórios avançados',
    icon: <Star className="h-5 w-5" />,
    color: 'text-primary',
    unlocked: currentLevel >= 5
  },
  {
    level: 10,
    title: 'Mestre',
    description: 'Acesso ao dashboard personalizado',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-primary',
    unlocked: currentLevel >= 10
  },
  {
    level: 15,
    title: 'Expert',
    description: 'Prioridade no suporte técnico',
    icon: <Award className="h-5 w-5" />,
    color: 'text-primary',
    unlocked: currentLevel >= 15
  },
  {
    level: 20,
    title: 'Lenda',
    description: 'Acesso exclusivo a funcionalidades beta',
    icon: <Crown className="h-5 w-5" />,
    color: 'text-primary',
    unlocked: currentLevel >= 20
  }
];

const getLevelInfo = (level: number) => {
  if (level >= 20) return { 
    title: 'Lenda', 
    color: 'text-primary', 
    bgColor: 'bg-card border border-primary/20',
    icon: <Crown className="h-6 w-6" />,
    description: 'Você é uma lenda no sistema!'
  };
  if (level >= 15) return { 
    title: 'Expert', 
    color: 'text-primary', 
    bgColor: 'bg-card border border-primary/20',
    icon: <Flame className="h-6 w-6" />,
    description: 'Nível de especialista alcançado!'
  };
  if (level >= 10) return { 
    title: 'Mestre', 
    color: 'text-primary', 
    bgColor: 'bg-card border border-primary/20',
    icon: <Star className="h-6 w-6" />,
    description: 'Você é um mestre!'
  };
  if (level >= 5) return { 
    title: 'Especialista', 
    color: 'text-primary', 
    bgColor: 'bg-card border border-primary/20',
    icon: <Zap className="h-6 w-6" />,
    description: 'Nível de especialista!'
  };
  return { 
    title: 'Iniciante', 
    color: 'text-muted-foreground', 
    bgColor: 'bg-card border',
    icon: <Target className="h-6 w-6" />,
    description: 'Continue evoluindo!'
  };
};

export function UserLevelProgress() {
  const { score, levelInfo, loading, error } = useUserScore();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);

  useEffect(() => {
    if (levelInfo && levelInfo.currentLevel > previousLevel) {
      setShowLevelUp(true);
      setPreviousLevel(levelInfo.currentLevel);
      
      // Auto-hide level up animation after 3 seconds
      setTimeout(() => {
        setShowLevelUp(false);
      }, 3000);
    }
  }, [levelInfo, previousLevel]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Seu Progresso
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

  if (error || !score || !levelInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Seu Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {error || 'Não foi possível carregar seu progresso'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const levelData = getLevelInfo(levelInfo.currentLevel);
  const rewards = getLevelRewards(levelInfo.currentLevel);
  const nextReward = rewards.find(r => !r.unlocked);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Seu Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level Up Animation */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="p-4 border-2 border-yellow-400 rounded-lg bg-gradient-to-r from-yellow-100 to-orange-100"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl animate-bounce">🎉</div>
                <div>
                  <h3 className="font-bold text-yellow-800">Level Up!</h3>
                  <p className="text-sm text-yellow-700">
                    Você alcançou o nível {levelInfo.currentLevel}!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Level Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 border rounded-lg ${levelData.bgColor}`}
        >
          <div className="flex items-center gap-4">
            <div className={`${levelData.color}`}>
              {levelData.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">Nível {levelInfo.currentLevel}</h3>
                <Badge className="text-white bg-orange-500">
                  {levelData.title}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {levelData.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {score.total_points}
              </div>
              <div className="text-xs text-muted-foreground">pontos totais</div>
            </div>
          </div>
        </motion.div>

        {/* Progress to Next Level */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progresso para o próximo nível</span>
            <span className="text-sm text-muted-foreground">
              {levelInfo.pointsToNextLevel} pontos restantes
            </span>
          </div>
          <Progress 
            value={levelInfo.progressPercentage} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Nível {levelInfo.currentLevel}</span>
            <span>Nível {levelInfo.currentLevel + 1}</span>
          </div>
        </div>

        {/* Next Reward */}
        {nextReward && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 border border-dashed border-muted-foreground/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`${nextReward.color} opacity-50`}>
                {nextReward.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">Próxima Recompensa</h4>
                  <Badge variant="outline">
                    Nível {nextReward.level}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {nextReward.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Unlocked Rewards */}
        {rewards.filter(r => r.unlocked).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Recompensas Desbloqueadas</h4>
            <div className="grid gap-2">
              {rewards
                .filter(r => r.unlocked)
                .map((reward, index) => (
                  <motion.div
                    key={reward.level}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200"
                  >
                    <div className={`${reward.color}`}>
                      {reward.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-sm">{reward.title}</h5>
                        <Badge variant="secondary" className="text-green-600 bg-green-100">
                          Nível {reward.level}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {reward.description}
                      </p>
                    </div>
                    <div className="text-green-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4 pt-4 border-t"
        >
          <div className="text-center">
            <div className="text-xl font-bold text-primary">
              {levelInfo.currentLevel}
            </div>
            <div className="text-xs text-muted-foreground">
              Nível Atual
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-primary">
              {Number(levelInfo.progressPercentage.toFixed(2))}%
            </div>
            <div className="text-xs text-muted-foreground">
              Progresso
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
