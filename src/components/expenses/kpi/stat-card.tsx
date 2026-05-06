"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// --- 1. Reusable Stat Card Component ---
interface StatCardProps {
  title: string;
  value: string;
  subValue: React.ReactNode;
  icon: LucideIcon;
  statusColor: string; // e.g., "text-green-500"
  statusBg: string; // e.g., "bg-green-500/10"
  accentColor: string; // e.g., "from-green-500"
  borderColor?: string;
  trendIcon?: React.ReactNode;
}

export const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  statusColor,
  statusBg,
  accentColor,
  borderColor,
  trendIcon,
}: StatCardProps) => (
  <Card
    className={cn(
      "relative overflow-hidden bg-gradient-to-br from-card to-card/80 border-border/50 transition-colors hover:border-primary/30",
      borderColor,
    )}
  >
    <div
      className={cn(
        "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
        `${accentColor}/60 via-${accentColor.replace("from-", "")} to-${accentColor}/60`,
      )}
    />
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg", statusBg)}>
            <Icon className={cn("h-4 w-4", statusColor)} />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
        </div>
        {trendIcon}
      </div>

      <div>
        <p className={cn("text-2xl font-bold", statusColor)}>{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{subValue}</p>
      </div>
    </CardContent>
  </Card>
);
