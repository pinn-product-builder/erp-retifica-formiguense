import React from 'react';
import { DialogContent, DialogContentProps } from '@/components/ui/dialog';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';

export type ModalSize = 'sm' | 'default' | 'lg' | 'xl' | '2xl' | 'full';

export interface ResponsiveModalContentProps extends Omit<DialogContentProps, 'className'> {
  size?: ModalSize;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-[95vw] sm:max-w-md',
  default: 'max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl',
  lg: 'max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl',
  xl: 'max-w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl',
  '2xl': 'max-w-[95vw] sm:max-w-5xl md:max-w-6xl lg:max-w-7xl',
  full: 'max-w-[95vw] h-[95vh]',
};

export const ResponsiveModalContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  ResponsiveModalContentProps
>(({ size = 'default', className, children, ...props }, ref) => {
  const { isMobile, isTablet } = useBreakpoint();
  const isResizable = !isMobile && !isTablet && (size === 'lg' || size === 'xl' || size === '2xl' || size === 'full');

  return (
    <DialogContent
      ref={ref}
      className={cn(
        sizeClasses[size],
        'max-h-[90vh] overflow-y-auto',
        (isMobile || isTablet) && 'mx-4',
        isResizable && 'resizable-modal',
        className
      )}
      style={{
        ...(props.style || {}),
        // Definir tamanhos mínimos para redimensionamento
        ...(isResizable ? {
          minWidth: '400px',
          minHeight: '300px',
        } : {}),
      }}
      {...props}
    >
      {children}
    </DialogContent>
  );
});

ResponsiveModalContent.displayName = 'ResponsiveModalContent';

