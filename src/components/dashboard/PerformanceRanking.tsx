import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRanking } from '@/hooks/useGamification';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown,
  Users,
  TrendingUp,
  Star,
  Zap,
  Target,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RankingPosition {
  position: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const getRankingPosition = (position: number): RankingPosition => {
  switch (position) {
    case 1:
      return {
        position: 1,
        icon: <Crown className="h-6 w-6" />,
        color: 'text-primary',
        bgColor: 'bg-primary/10 border-primary/20'
      };
    case 2:
      return {
        position: 2,
        icon: <Medal className="h-6 w-6" />,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted border-border'
      };
    case 3:
      return {
        position: 3,
        icon: <Award className="h-6 w-6" />,
        color: 'text-primary',
        bgColor: 'bg-primary/10 border-primary/20'
      };
    default:
      return {
        position,
        icon: <Trophy className="h-5 w-5" />,
        color: 'text-muted-foreground',
        bgColor: 'bg-card border-border'
      };
  }
};

const formatPoints = (points: number): string => {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`;
  }
  return points.toString();
};

const getLevelInfo = (level: number) => {
  if (level >= 20) return { label: 'Lenda', color: 'text-primary', icon: <Crown className="h-4 w-4" /> };
  if (level >= 10) return { label: 'Mestre', color: 'text-primary', icon: <Star className="h-4 w-4" /> };
  if (level >= 5) return { label: 'Especialista', color: 'text-primary', icon: <Zap className="h-4 w-4" /> };
  return { label: 'Iniciante', color: 'text-muted-foreground', icon: <Target className="h-4 w-4" /> };
};

export function PerformanceRanking() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const { ranking, userPosition, loading, error, refresh } = useRanking(selectedPeriod);

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly') => {
    setSelectedPeriod(period);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking de Performance
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
            Ranking de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={refresh} variant="outline" className="mt-4">
              Tentar Novamente
            </Button>
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
          Ranking de Performance
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Atualizado em tempo real</span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedPeriod} onValueChange={handlePeriodChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Diário</TabsTrigger>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedPeriod} className="space-y-4">
            {/* Posição do Usuário */}
            {userPosition && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-2 border-primary rounded-lg bg-gradient-to-r from-primary/5 to-primary/10"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {getRankingPosition(userPosition.rank_position).icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">Sua Posição</h4>
                      <Badge variant="secondary">
                        #{userPosition.rank_position}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {formatPoints(userPosition.total_points)} pontos
                      </span>
                      <span className="flex items-center gap-1">
                        {getLevelInfo(userPosition.metrics.current_level).icon}
                        Nível {userPosition.metrics.current_level}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatPoints(userPosition.total_points)}
                    </div>
                    <div className="text-xs text-muted-foreground">pontos</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top 10 Ranking */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Top 10 - {selectedPeriod === 'daily' ? 'Hoje' : selectedPeriod === 'weekly' ? 'Esta Semana' : 'Este Mês'}</span>
              </div>

              {ranking.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum ranking disponível para este período.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {ranking.map((user, index) => {
                      const positionInfo = getRankingPosition(user.rank_position);
                      const levelInfo = getLevelInfo(user.metrics.current_level);
                      
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center gap-4 p-3 border rounded-lg ${positionInfo.bgColor}`}
                        >
                          <div className={`${positionInfo.color} flex items-center gap-2`}>
                            {positionInfo.icon}
                            <span className="font-bold text-lg">#{user.rank_position}</span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">
                                {user.user_name || 'Usuário'}
                              </h4>
                              <Badge variant="outline" className="text-primary border-primary/20">
                                {levelInfo.icon}
                                {levelInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Nível {user.metrics.current_level}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {user.metrics.level_progress}% do nível
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xl font-bold">
                              {formatPoints(user.total_points)}
                            </div>
                            <div className="text-xs text-muted-foreground">pontos</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Estatísticas do Ranking */}
            {ranking.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-4 pt-4 border-t"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {ranking.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Participantes
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatPoints(ranking[0]?.total_points || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Líder
                  </div>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
