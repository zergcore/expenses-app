"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useExpenseChart } from "./expense-chart/expense-chart-context";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Target,
} from "lucide-react";
import { COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const KPIHeader = () => {
  const {
    percentage,
    totalBudget,
    budgetSpent,
    remaining,
    isOverBudget,
    currency,
    dailyAverageSpent,
    dailyBudgetTarget,
    daysRemaining,
    daysElapsed,
    projectedSpending,
    unbudgetedAmount,
  } = useExpenseChart();
  const t = useTranslations();

  // Calculate if on track
  const isOnTrack = dailyAverageSpent <= dailyBudgetTarget;
  const isProjectedOverBudget = projectedSpending > totalBudget;
  const daysInMonth = daysElapsed + daysRemaining;
  const dailyGoal = totalBudget / daysInMonth;

  // Mini donut data
  const donutData = isOverBudget
    ? [
        { value: totalBudget, fill: COLORS.spent },
        { value: budgetSpent - totalBudget, fill: COLORS.over },
      ]
    : [
        { value: budgetSpent, fill: COLORS.spent },
        { value: remaining, fill: COLORS.remaining },
      ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Budget Summary - Mini Donut */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-primary/30 transition-colors">
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            {/* Donut Chart */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    innerRadius={22}
                    outerRadius={30}
                    strokeWidth={0}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={cn(
                    "text-sm font-bold",
                    isOverBudget ? "text-destructive" : "text-primary",
                  )}
                >
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t("Expenses.budget_overview")}
              </p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(budgetSpent, currency)}
              </p>
              <p className="text-sm text-muted-foreground">
                / {formatCurrency(totalBudget, currency)}
              </p>
            </div>
          </div>

          {/* Progress bar for days */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {t("Expenses.days_passed")}
              </span>
              <span className="text-xs font-medium text-foreground">
                {daysElapsed}/{daysInMonth}
              </span>
            </div>
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all"
                style={{ width: `${(daysElapsed / daysInMonth) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Daily Average - Burn Rate */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-primary/30 transition-colors">
        <div
          className={cn(
            "absolute top-0 left-0 w-full h-1",
            isOnTrack
              ? "bg-gradient-to-r from-green-500/60 via-green-500 to-green-500/60"
              : "bg-gradient-to-r from-orange-500/60 via-orange-500 to-orange-500/60",
          )}
        />
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  isOnTrack ? "bg-green-500/10" : "bg-orange-500/10",
                )}
              >
                <Target
                  className={cn(
                    "h-4 w-4",
                    isOnTrack ? "text-green-500" : "text-orange-500",
                  )}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("Expenses.daily_average")}
              </span>
            </div>
            {isOnTrack ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-orange-500" />
            )}
          </div>

          <div>
            <p
              className={cn(
                "text-2xl font-bold",
                isOnTrack ? "text-green-500" : "text-orange-500",
              )}
            >
              {formatCurrency(dailyAverageSpent, currency)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              / {formatCurrency(dailyGoal, currency)} {t("Expenses.goal")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. EOM Projection */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-primary/30 transition-colors">
        <div
          className={cn(
            "absolute top-0 left-0 w-full h-1",
            isProjectedOverBudget
              ? "bg-gradient-to-r from-orange-500/60 via-orange-500 to-orange-500/60"
              : "bg-gradient-to-r from-blue-500/60 via-blue-500 to-blue-500/60",
          )}
        />
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  isProjectedOverBudget ? "bg-orange-500/10" : "bg-blue-500/10",
                )}
              >
                <Calendar
                  className={cn(
                    "h-4 w-4",
                    isProjectedOverBudget ? "text-orange-500" : "text-blue-500",
                  )}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("Expenses.projected_spending")}
              </span>
            </div>
            {isProjectedOverBudget && (
              <TrendingUp className="h-5 w-5 text-orange-500" />
            )}
          </div>

          <div>
            <p
              className={cn(
                "text-2xl font-bold",
                isProjectedOverBudget ? "text-orange-500" : "text-foreground",
              )}
            >
              {formatCurrency(projectedSpending, currency)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {daysRemaining} {t("Expenses.days_remaining_month")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Unbudgeted Total - Badge Style */}
      <Card
        className={cn(
          "relative overflow-hidden bg-gradient-to-br from-card to-card/80 border-border/50 transition-colors",
          unbudgetedAmount > 0
            ? "border-amber-500/30 hover:border-amber-500/50"
            : "hover:border-green-500/30",
        )}
      >
        <div
          className={cn(
            "absolute top-0 left-0 w-full h-1",
            unbudgetedAmount > 0
              ? "bg-gradient-to-r from-amber-500/60 via-amber-500 to-amber-500/60"
              : "bg-gradient-to-r from-green-500/60 via-green-500 to-green-500/60",
          )}
        />
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                unbudgetedAmount > 0 ? "bg-amber-500/10" : "bg-green-500/10",
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-4 w-4",
                  unbudgetedAmount > 0 ? "text-amber-500" : "text-green-500",
                )}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("Expenses.unbudgeted_expenses")}
            </span>
          </div>

          <div>
            <p
              className={cn(
                "text-2xl font-bold",
                unbudgetedAmount > 0 ? "text-amber-500" : "text-green-500",
              )}
            >
              {formatCurrency(unbudgetedAmount, currency)}
            </p>
            {unbudgetedAmount > 0 ? (
              <p className="text-sm text-amber-500/80 mt-1">
                {t("Expenses.needs_category")}
              </p>
            ) : (
              <p className="text-sm text-green-500/80 mt-1">
                ✓ {t("Expenses.all_categorized")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
