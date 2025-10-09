import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: {
    x: number;
    y: number;
    rotation: number;
  };
}

interface CelebrationAnimationsProps {
  trigger: boolean;
  type: 'level_up' | 'achievement' | 'goal_completed' | 'milestone';
  onComplete?: () => void;
}

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export function CelebrationAnimations({ trigger, type, onComplete }: CelebrationAnimationsProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShowCelebration(true);
      createConfetti();
      
      // Auto-hide after animation
      setTimeout(() => {
        setShowCelebration(false);
        setConfetti([]);
        onComplete?.();
      }, 3000);
    }
  }, [trigger, onComplete]);

  const createConfetti = () => {
    const pieces: ConfettiPiece[] = [];
    const pieceCount = 50;

    for (let i = 0; i < pieceCount; i++) {
      pieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * 3 + 2,
          rotation: (Math.random() - 0.5) * 10
        }
      });
    }

    setConfetti(pieces);

    // Animate confetti
    const animateConfetti = () => {
      setConfetti(prev => 
        prev.map(piece => ({
          ...piece,
          x: piece.x + piece.velocity.x,
          y: piece.y + piece.velocity.y,
          rotation: piece.rotation + piece.velocity.rotation,
          velocity: {
            ...piece.velocity,
            y: piece.velocity.y + 0.1 // gravity
          }
        })).filter(piece => piece.y < window.innerHeight + 50)
      );
    };

    const interval = setInterval(animateConfetti, 16);
    setTimeout(() => clearInterval(interval), 3000);
  };

  const getCelebrationContent = () => {
    switch (type) {
      case 'level_up':
        return {
          emoji: '🎉',
          title: 'Level Up!',
          message: 'Parabéns! Você subiu de nível!',
          color: 'text-yellow-600',
          bgColor: 'bg-gradient-to-r from-yellow-100 to-orange-100'
        };
      case 'achievement':
        return {
          emoji: '🏆',
          title: 'Conquista Desbloqueada!',
          message: 'Nova conquista conquistada!',
          color: 'text-blue-600',
          bgColor: 'bg-gradient-to-r from-blue-100 to-purple-100'
        };
      case 'goal_completed':
        return {
          emoji: '🎯',
          title: 'Meta Atingida!',
          message: 'Excelente trabalho!',
          color: 'text-green-600',
          bgColor: 'bg-gradient-to-r from-green-100 to-emerald-100'
        };
      case 'milestone':
        return {
          emoji: '⭐',
          title: 'Marco Alcançado!',
          message: 'Incrível progresso!',
          color: 'text-purple-600',
          bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100'
        };
      default:
        return {
          emoji: '🎊',
          title: 'Parabéns!',
          message: 'Ótimo trabalho!',
          color: 'text-primary',
          bgColor: 'bg-gradient-to-r from-primary/10 to-primary/20'
        };
    }
  };

  if (!showCelebration) return null;

  const celebration = getCelebrationContent();

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Confetti */}
      <AnimatePresence>
        {confetti.map(piece => (
          <motion.div
            key={piece.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: piece.x,
              top: piece.y,
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size,
              transform: `rotate(${piece.rotation}deg)`
            }}
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </AnimatePresence>

      {/* Celebration Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 flex items-center justify-center"
      >
        <div className={`p-8 rounded-2xl shadow-2xl border-2 ${celebration.bgColor} max-w-md mx-4`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-center"
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-6xl mb-4"
            >
              {celebration.emoji}
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-2xl font-bold mb-2 ${celebration.color}`}
            >
              {celebration.title}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground"
            >
              {celebration.message}
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Fireworks Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`
            }}
            animate={{
              scale: [0, 3, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 1,
              delay: i * 0.2,
              repeat: 2
            }}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

// Componente para Toast de Celebração
interface CelebrationToastProps {
  show: boolean;
  type: 'success' | 'achievement' | 'level_up' | 'milestone';
  title: string;
  message: string;
  onClose: () => void;
}

export function CelebrationToast({ show, type, title, message, onClose }: CelebrationToastProps) {
  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'achievement':
        return {
          icon: '🏆',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200'
        };
      case 'level_up':
        return {
          icon: '🎉',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200'
        };
      case 'milestone':
        return {
          icon: '⭐',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 border-purple-200'
        };
    }
  };

  const config = getToastConfig();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          className={`fixed top-4 right-4 p-4 rounded-lg border shadow-lg max-w-sm z-50 ${config.bgColor}`}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="text-2xl"
            >
              {config.icon}
            </motion.div>
            <div className="flex-1">
              <h4 className={`font-semibold ${config.color}`}>
                {title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook para gerenciar celebrações
export function useCelebration() {
  const [celebration, setCelebration] = useState<{
    show: boolean;
    type: 'level_up' | 'achievement' | 'goal_completed' | 'milestone';
  }>({ show: false, type: 'achievement' });

  const triggerCelebration = (type: 'level_up' | 'achievement' | 'goal_completed' | 'milestone') => {
    setCelebration({ show: true, type });
  };

  const hideCelebration = () => {
    setCelebration(prev => ({ ...prev, show: false }));
  };

  return {
    celebration,
    triggerCelebration,
    hideCelebration
  };
}
