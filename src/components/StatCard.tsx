
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  className 
}: StatCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-elevated",
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-3 sm:p-4 lg:p-6">
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
