import React, { createContext, useContext, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Info, HelpCircle } from 'lucide-react';

interface ConfirmDialogOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
  showIcon?: boolean;
  iconType?: 'warning' | 'danger' | 'info' | 'question';
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions>({
    title: 'Confirmar ação',
    description: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'default',
    showIcon: false,
    iconType: 'question'
  });
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = (confirmOptions: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        title: confirmOptions.title || 'Confirmar ação',
        description: confirmOptions.description,
        confirmText: confirmOptions.confirmText || 'Confirmar',
        cancelText: confirmOptions.cancelText || 'Cancelar',
        variant: confirmOptions.variant || 'default',
        showIcon: confirmOptions.showIcon || false,
        iconType: confirmOptions.iconType || 'question'
      });
      setResolver(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    if (resolver) {
      resolver(true);
    }
    setIsOpen(false);
    setResolver(null);
  };

  const handleCancel = () => {
    if (resolver) {
      resolver(false);
    }
    setIsOpen(false);
    setResolver(null);
  };

  const getIcon = () => {
    if (!options.showIcon) return null;
    
    const iconClass = "w-6 h-6 mr-3 flex-shrink-0";
    
    switch (options.iconType) {
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-amber-500`} />;
      case 'danger':
        return <Trash2 className={`${iconClass} text-red-500`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-500`} />;
      case 'question':
      default:
        return <HelpCircle className={`${iconClass} text-gray-500`} />;
    }
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              {getIcon()}
              <span>{options.title}</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-4 space-y-3">
              <div className="whitespace-pre-line text-sm leading-relaxed">
                {options.description}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={handleCancel}>
                {options.cancelText}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                variant={options.variant} 
                onClick={handleConfirm}
              >
                {options.confirmText}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return context;
}