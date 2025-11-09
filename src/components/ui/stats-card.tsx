import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  isLoading?: boolean;
  className?: string;
  valueClassName?: string;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  isLoading = false,
  className,
  valueClassName
}: StatsCardProps) {
  return (
    <Card className={cn("bg-gradient-card shadow-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : (
          <>
            <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 