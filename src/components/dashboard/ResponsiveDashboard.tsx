import React, { useState, useEffect } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';

interface ResponsiveDashboardProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDashboard({ children, className = '' }: ResponsiveDashboardProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Detectar orientação
  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Fechar sidebar ao redimensionar para desktop
  useEffect(() => {
    if (isDesktop && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isDesktop, sidebarOpen]);

  // Gestos touch para mobile
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;
    let isScrolling = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isScrolling = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = Math.abs(currentX - startX);
      const diffY = Math.abs(currentY - startY);

      // Determinar se é scroll vertical ou swipe horizontal
      if (diffY > diffX) {
        isScrolling = true;
        return;
      }

      // Swipe da esquerda para direita para abrir sidebar
      if (currentX - startX > 50 && startX < 50 && !sidebarOpen && !isScrolling) {
        setSidebarOpen(true);
      }

      // Swipe da direita para esquerda para fechar sidebar
      if (startX - currentX > 50 && startX > window.innerWidth - 50 && sidebarOpen && !isScrolling) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile, sidebarOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreenMode(true);
    } else {
      document.exitFullscreen();
      setFullscreenMode(false);
    }
  };

  const getGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  const getGap = () => {
    if (isMobile) return 'gap-4';
    if (isTablet) return 'gap-5';
    return 'gap-6';
  };

  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Mobile Header */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
        >
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <h1 className="text-lg font-semibold">Dashboard</h1>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="p-2"
              >
                {fullscreenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-background border-r z-40 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Mobile Navigation Content */}
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">
                        Navegação rápida para mobile
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`p-${isMobile ? '4' : '6'} ${sidebarOpen && isMobile ? 'ml-0' : ''}`}>
        {/* Responsive Grid Container */}
        <div className={`grid ${getGridCols()} ${getGap()}`}>
          {React.Children.map(children, (child, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full"
            >
              {child}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-40"
        >
          <div className="flex items-center justify-around p-2">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <div className="h-4 w-4 bg-primary rounded-full" />
              <span className="text-xs">Home</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <div className="h-4 w-4 bg-muted rounded-full" />
              <span className="text-xs">Ordens</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <div className="h-4 w-4 bg-muted rounded-full" />
              <span className="text-xs">Orçamentos</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <div className="h-4 w-4 bg-muted rounded-full" />
              <span className="text-xs">Perfil</span>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Landscape Mode Warning */}
      <AnimatePresence>
        {isMobile && orientation === 'landscape' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-4 right-4 z-50"
          >
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Gire para modo retrato para melhor experiência
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Optimizations */}
      <div className="hidden">
        {/* Preload critical images */}
        <img src="/icons/trophy.svg" alt="" />
        <img src="/icons/star.svg" alt="" />
        <img src="/icons/crown.svg" alt="" />
      </div>
    </div>
  );
}

// Hook para otimizações mobile
export function useMobileOptimizations() {
  const { isMobile } = useBreakpoint();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast'>('fast');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detectar velocidade da conexão
    if ('connection' in navigator) {
      const connection = (navigator as { connection?: { effectiveType?: string } }).connection;
      const effectiveType = connection?.effectiveType;
      setConnectionSpeed(effectiveType === 'slow-2g' || effectiveType === '2g' ? 'slow' : 'fast');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isMobile,
    isOnline,
    connectionSpeed,
    shouldReduceAnimations: isMobile && connectionSpeed === 'slow',
    shouldLazyLoad: isMobile && connectionSpeed === 'slow'
  };
}
