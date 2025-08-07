// Utility functions for responsive design
export const responsive = {
  // Grid utilities
  grid: {
    statsCards: (isMobile: boolean, isTablet: boolean) => 
      isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4',
    contentLayout: (isMobile: boolean) => 
      isMobile ? 'grid-cols-1' : 'lg:grid-cols-3',
    form: (isMobile: boolean) => 
      isMobile ? 'grid-cols-1' : 'sm:grid-cols-2',
  },

  // Spacing utilities  
  spacing: {
    page: (isMobile: boolean) => isMobile ? 'p-4 space-y-4' : 'p-6 space-y-6',
    card: (isMobile: boolean) => isMobile ? 'p-3' : 'p-4 lg:p-6',
    section: (isMobile: boolean) => isMobile ? 'space-y-3' : 'space-y-4',
  },

  // Text utilities
  text: {
    title: (isMobile: boolean) => isMobile ? 'text-2xl' : 'text-3xl',
    heading: (isMobile: boolean) => isMobile ? 'text-lg' : 'text-xl',
    body: (isMobile: boolean) => isMobile ? 'text-sm' : 'text-base',
  },

  // Component utilities
  component: {
    button: (isMobile: boolean) => ({
      className: isMobile ? 'w-full' : 'w-auto',
      size: isMobile ? 'sm' : 'default'
    }),
    modal: (isMobile: boolean) => isMobile ? 'mx-4' : 'mx-auto',
    table: () => 'overflow-x-auto',
  },

  // Layout utilities
  layout: {
    flex: {
      mobileStack: 'flex flex-col sm:flex-row',
      centerStack: 'flex flex-col sm:flex-row sm:items-center',
      spaceBetween: 'flex flex-col sm:flex-row sm:justify-between sm:items-center',
    },
    container: 'container mx-auto px-4 sm:px-6',
  }
};

// CSS classes for responsive design
export const responsiveClasses = {
  // Common responsive patterns
  mobileFirst: {
    padding: 'p-4 sm:p-6 lg:p-8',
    margin: 'm-4 sm:m-6 lg:m-8', 
    text: 'text-sm sm:text-base lg:text-lg',
    gap: 'gap-4 sm:gap-6 lg:gap-8',
  },
  
  // Grid systems
  grids: {
    auto: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    stats: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    content: 'grid grid-cols-1 lg:grid-cols-3',
    form: 'grid grid-cols-1 sm:grid-cols-2',
  },

  // Common layout patterns
  layouts: {
    page: 'container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6',
    card: 'p-3 sm:p-4 lg:p-6',
    section: 'space-y-3 sm:space-y-4 lg:space-y-6',
    flexMobileStack: 'flex flex-col sm:flex-row gap-4',
    flexCenterStack: 'flex flex-col sm:flex-row sm:items-center gap-4',
  }
};