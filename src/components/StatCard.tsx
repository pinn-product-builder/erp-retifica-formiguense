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
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium",
              variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              {title}
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className={cn(
                "text-2xl font-bold",
                variant === "primary" ? "text-primary-foreground" : "text-foreground"
              )}>
                {value}
              </h3>
              {trend && (
                <span className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-success" : "text-destructive",
                  variant === "primary" && "text-primary-foreground/70"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className={cn(
                "text-xs mt-1",
                variant === "primary" ? "text-primary-foreground/60" : "text-muted-foreground"
              )}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            variant === "primary" 
              ? "bg-primary-foreground/20" 
              : "bg-muted"
          )}>
            <Icon className={cn(
              "w-6 h-6",
              variant === "primary" ? "text-primary-foreground" : "text-muted-foreground"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}