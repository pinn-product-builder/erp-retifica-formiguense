
import { LucideIcon, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
  calculationInfo?: string; // Informação sobre como o cálculo é feito
}

const variantStyles = {
  default: "bg-card border",
  primary: "bg-gradient-primary text-primary-foreground border-primary/20",
  success: "bg-success/10 border-success/20 text-success-foreground",
  warning: "bg-warning/10 border-warning/20 text-warning-foreground", 
  danger: "bg-destructive/10 border-destructive/20 text-destructive-foreground"
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = "default",
  className,
  calculationInfo
}: StatCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-elevated min-h-[110px]",
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-3 sm:p-4 lg:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className={cn(
              "text-xs sm:text-sm font-medium truncate flex items-center gap-1",
              variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              <Icon className={cn(
                "w-3 h-3 sm:w-4 sm:h-4",
                variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
              )} />
              {title}
              {calculationInfo && (
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Info className={cn(
                        "w-3 h-3 sm:w-3.5 sm:h-3.5 cursor-help ml-1 flex-shrink-0",
                        variant === "primary" ? "text-primary-foreground/60" : "text-muted-foreground/60"
                      )} />
                    </TooltipTrigger>
                    <TooltipContent 
                      className="max-w-[280px] sm:max-w-sm p-3 text-xs leading-relaxed"
                      sideOffset={5}
                    >
                      <p className="whitespace-normal break-words">{calculationInfo}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2 mt-1 sm:mt-2">
              <h3 className={cn(
                "text-lg sm:text-xl lg:text-2xl font-bold whitespace-nowrap",
                variant === "primary" ? "text-primary-foreground" : "text-foreground"
              )}>
                {value}
              </h3>
              {trend && (
                <span className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  trend.isPositive ? "text-success" : "text-destructive",
                  variant === "primary" && "text-primary-foreground/70"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <div className={cn(
                "text-xs mt-1 truncate",
                variant === "primary" ? "text-primary-foreground/60" : "text-muted-foreground"
              )}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
