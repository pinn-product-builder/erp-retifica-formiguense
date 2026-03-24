import { cn } from '@/lib/utils';

interface FinancialPageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function FinancialPageShell({ children, className }: FinancialPageShellProps) {
  return (
    <div
      className={cn(
        'w-full max-w-full px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6',
        className
      )}
    >
      {children}
    </div>
  );
}
