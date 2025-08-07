import { useBreakpoint } from './useBreakpoint';

export function useResponsive() {
  const { isMobile, isTablet, isDesktop, current } = useBreakpoint();

  // Responsive spacing utilities
  const spacing = {
    xs: isMobile ? '2' : '3',
    sm: isMobile ? '3' : '4', 
    md: isMobile ? '4' : '6',
    lg: isMobile ? '6' : '8',
  };

  // Responsive grid columns
  const gridCols = {
    statsCard: {
      1: 'grid-cols-1',
      2: isMobile ? 'grid-cols-1' : 'grid-cols-2', 
      3: isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3',
      4: isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4',
      responsive: isMobile ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-4'
    },
    content: {
      1: 'grid-cols-1',
      2: isMobile ? 'grid-cols-1' : 'lg:grid-cols-2',
      3: isMobile ? 'grid-cols-1' : 'lg:grid-cols-3',
      sidebar: isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'
    },
    table: {
      mobile: 'overflow-x-auto',
      responsive: 'min-w-full'
    }
  };

  // Responsive text sizes
  const textSize = {
    title: isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl',
    subtitle: isMobile ? 'text-lg' : 'text-xl',
    heading: isMobile ? 'text-lg' : 'text-xl',
    body: isMobile ? 'text-sm' : 'text-base',
    caption: isMobile ? 'text-xs' : 'text-sm',
  };

  // Responsive padding
  const padding = {
    page: 'p-4 sm:p-6',
    card: 'p-3 sm:p-4 lg:p-6',
    compact: 'p-2 sm:p-3',
    container: 'px-4 sm:px-6 lg:px-8'
  };

  // Responsive gaps
  const gap = {
    xs: `gap-${spacing.xs}`,
    sm: `gap-${spacing.sm}`,
    md: `gap-${spacing.md}`,
    lg: `gap-${spacing.lg}`,
  };

  // Component sizing
  const componentSize = {
    button: {
      mobile: 'w-full sm:w-auto',
      icon: isMobile ? 'w-4 h-4' : 'w-5 h-5',
      size: isMobile ? 'sm' : 'default'
    },
    input: {
      mobile: 'w-full',
      icon: 'w-4 h-4'
    },
    modal: {
      mobile: 'mx-4 sm:mx-auto',
      width: isMobile ? 'w-full' : 'sm:max-w-lg'
    }
  };

  // Layout utilities
  const layout = {
    flex: {
      mobileStack: 'flex flex-col sm:flex-row',
      mobileCenterStack: 'flex flex-col sm:flex-row sm:items-center',
      mobileSpaceBetween: 'flex flex-col sm:flex-row sm:justify-between sm:items-center'
    },
    container: 'container mx-auto',
    section: `space-y-${spacing.md}`,
    card: 'transition-all duration-200 hover:shadow-elevated'
  };

  // Kanban specific utilities
  const kanban = {
    board: isMobile ? 'flex overflow-x-auto space-x-4 pb-4' : isTablet ? 'grid grid-cols-4 gap-4' : 'grid grid-cols-7 gap-4',
    column: isMobile ? 'min-w-[280px] flex-shrink-0' : '',
    height: isMobile ? 'min-h-[500px]' : 'min-h-[600px]'
  };

  return {
    isMobile,
    isTablet, 
    isDesktop,
    current,
    spacing,
    gridCols,
    textSize,
    padding,
    gap,
    componentSize,
    layout,
    kanban,
    
    // Utility functions
    responsive: (mobile: string, desktop: string) => isMobile ? mobile : desktop,
    responsiveSize: (base: string, sm?: string, lg?: string) => {
      let classes = base;
      if (sm) classes += ` sm:${sm}`;
      if (lg) classes += ` lg:${lg}`;
      return classes;
    }
  };
}